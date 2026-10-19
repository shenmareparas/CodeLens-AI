namespace CodeLens.Api.Endpoints;

using CodeLens.Core.DTOs;
using CodeLens.Core.Entities;
using CodeLens.Core.Interfaces;
using CodeLens.Infrastructure.AI;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

public static class AuditEndpoints
{
    public static void MapAuditEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/audits")
            .WithTags("Audits")
            .RequireAuthorization();

        // GET /api/audits (list audits for current user)
        group.MapGet("/", async (
            ClaimsPrincipal user,
            [FromServices] ICosmosRepository repository,
            CancellationToken ct) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? user.FindFirstValue("sub")!;

            var audits = await repository.GetAuditsByUserAsync(userId, ct);
            // Deduplicate by repository so subsequent analyses override prior ones in the recent list
            var summaries = audits
                .GroupBy(a => a.RepositoryId, StringComparer.OrdinalIgnoreCase)
                .Select(g => g.OrderByDescending(a => a.CreatedAt).First())
                .OrderByDescending(a => a.CreatedAt)
                .Select(a => new AuditSummaryResponse(
                    a.Id,
                    a.Status.ToString(),
                    a.RepoUrl,
                    a.CreatedAt,
                    a.Telemetry,
                    a.AiInsights,
                    a.DossierMarkdown,
                    CommitSha: a.CommitSha
                )).ToList();

            return Results.Ok(summaries);
        })
        .WithName("GetUserAudits")
        .WithSummary("Retrieve all audits for the authenticated user");

        // POST /api/audits/analyze
        group.MapPost("/analyze", async (
            [FromBody] AnalyzeRequest request,
            ClaimsPrincipal user,
            [FromServices] IGitHubTelemetryService telemetryService,
            [FromServices] ICodeAnalysisService analysisService,
            [FromServices] IGeminiSynthesisService geminiService,
            [FromServices] IBlobStorageService blobStorageService,
            [FromServices] ICosmosRepository repository,
            [FromServices] ILogger<Program> logger,
            CancellationToken ct) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? user.FindFirstValue("sub")!;

            // 1. Parse & validate GitHub repository URL
            string owner, repo;
            try
            {
                (owner, repo) = telemetryService.ParseRepoUrl(request.RepoUrl);
            }
            catch (ArgumentException ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }

            var repoId = $"{owner}_{repo}";

            // 2. Check for existing shared audit cache (unless forceRefresh is requested)
            if (!request.ForceRefresh)
            {
                var cachedAudit = await repository.GetLatestAuditByRepoAsync(repoId, ct);
                if (cachedAudit != null && cachedAudit.Status == AuditStatus.Completed)
                {
                    logger.LogInformation("Found cached audit for repository {RepoId} ({AuditId})", repoId, cachedAudit.Id);

                    // Check latest remote commit SHA to detect if repository was updated
                    var latestSha = await telemetryService.GetLatestCommitShaAsync(owner, repo, cachedAudit.Branch, ct);
                    var isStale = !string.IsNullOrEmpty(latestSha) &&
                                  !string.IsNullOrEmpty(cachedAudit.CommitSha) &&
                                  !string.Equals(latestSha, cachedAudit.CommitSha, StringComparison.OrdinalIgnoreCase);

                    // Create/update a user-scoped audit bookmark referencing this shared analysis
                    var userAuditRecord = new AuditDocument
                    {
                        Id = $"audit_{Guid.NewGuid():N}",
                        RepositoryId = repoId,
                        RepoUrl = request.RepoUrl,
                        UserId = userId,
                        CommitSha = cachedAudit.CommitSha,
                        Branch = cachedAudit.Branch,
                        Status = AuditStatus.Completed,
                        Telemetry = cachedAudit.Telemetry,
                        AiInsights = cachedAudit.AiInsights,
                        DossierBlobName = cachedAudit.DossierBlobName,
                        DossierMarkdown = cachedAudit.DossierMarkdown,
                        CreatedAt = DateTimeOffset.UtcNow,
                        CompletedAt = DateTimeOffset.UtcNow
                    };
                    await repository.UpsertAuditAsync(userAuditRecord, ct);

                    return Results.Ok(new AuditSummaryResponse(
                        userAuditRecord.Id,
                        userAuditRecord.Status.ToString(),
                        userAuditRecord.RepoUrl,
                        cachedAudit.CreatedAt,
                        userAuditRecord.Telemetry,
                        userAuditRecord.AiInsights,
                        userAuditRecord.DossierMarkdown,
                        CommitSha: cachedAudit.CommitSha,
                        IsStale: isStale,
                        LatestCommitSha: latestSha));
                }
            }

            var audit = new AuditDocument
            {
                Id = $"audit_{Guid.NewGuid():N}",
                RepositoryId = repoId,
                RepoUrl = request.RepoUrl,
                UserId = userId,
                Status = AuditStatus.Processing,
                CreatedAt = DateTimeOffset.UtcNow
            };

            await repository.UpsertAuditAsync(audit, ct);

            try
            {
                logger.LogInformation("Starting telemetry & AST analysis for {Owner}/{Repo}", owner, repo);

                // 3. Concurrently fetch GitHub REST telemetry and download in-memory zipball
                var telemetryTask = telemetryService.GetTelemetryAsync(owner, repo, ct);
                var zipStreamTask = telemetryService.DownloadZipballStreamAsync(owner, repo, ct: ct);

                await Task.WhenAll(telemetryTask, zipStreamTask);
                var telemetryResult = await telemetryTask;
                using var zipStream = await zipStreamTask;

                audit.Branch = telemetryResult.DefaultBranch;
                audit.CommitSha = telemetryResult.CommitSha;

                // 4. Execute zero-disk AST & polyglot complexity analysis
                var analysisResult = await analysisService.AnalyzeRepositoryAsync(
                    zipStream,
                    telemetryResult.FileChurn,
                    ct);

                // 5. Assemble TelemetryData
                audit.Telemetry = new TelemetryData
                {
                    Stars = telemetryResult.Stars,
                    Forks = telemetryResult.Forks,
                    License = telemetryResult.License,
                    ReleaseStatus = telemetryResult.ReleaseStatus,
                    DaysSinceLastRelease = telemetryResult.DaysSinceLastRelease,
                    TotalCommits = telemetryResult.TotalCommits,
                    WeeklyCommitsSparkline = telemetryResult.WeeklyCommitsSparkline.ToList(),
                    CommitTimeline = telemetryResult.CommitTimeline?.Select(p => new CodeLens.Core.Entities.CommitActivityPoint
                    {
                        Label = p.Label,
                        DateRange = p.DateRange,
                        Commits = p.Commits
                    }).ToList() ?? [],
                    Languages = telemetryResult.Languages.ToDictionary(),
                    Hotspots = analysisResult.Hotspots.ToList(),
                    DeadCode = analysisResult.DeadCode.ToList(),
                    SecretAlerts = analysisResult.SecretAlerts.ToList(),
                    Dependencies = analysisResult.Dependencies.ToList(),
                    SymbolManifest = analysisResult.SymbolManifest
                };

                // 6. Synthesize AI architectural insights via Gemini 3.8 Flash
                logger.LogInformation("Starting Gemini 3.8 Flash synthesis for {Owner}/{Repo}", owner, repo);
                var aiInsights = await geminiService.SynthesizeRepositoryAsync(owner, repo, audit.Telemetry, ct);
                audit.AiInsights = aiInsights;

                // 7. Compile standardized PROJECT_KNOWLEDGE.md dossier
                var dossierMarkdown = MarkdownDossierBuilder.BuildDossierMarkdown(
                    owner,
                    repo,
                    audit.Telemetry,
                    aiInsights,
                    telemetryResult.DefaultBranch,
                    audit.CreatedAt);
                audit.DossierMarkdown = dossierMarkdown;

                // 8. Upload dossier to Azure Blob Storage
                try
                {
                    var blobName = await blobStorageService.UploadDossierAsync(repoId, dossierMarkdown, ct);
                    audit.DossierBlobName = blobName;
                }
                catch (Exception blobEx)
                {
                    logger.LogWarning(blobEx, "Failed to upload dossier markdown to blob storage for {RepoId}", repoId);
                }

                audit.Status = AuditStatus.Completed;
                audit.CompletedAt = DateTimeOffset.UtcNow;
                await repository.UpsertAuditAsync(audit, ct);

                logger.LogInformation("Completed analysis and dossier compilation for {AuditId} ({Owner}/{Repo})", audit.Id, owner, repo);

                return Results.Accepted(
                    $"/api/audits/{audit.Id}",
                    new AuditSummaryResponse(
                        audit.Id,
                        audit.Status.ToString(),
                        audit.RepoUrl,
                        audit.CreatedAt,
                        audit.Telemetry,
                        audit.AiInsights,
                        audit.DossierMarkdown,
                        CommitSha: audit.CommitSha,
                        IsStale: false,
                        LatestCommitSha: audit.CommitSha));
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to analyze repository {RepoUrl}", request.RepoUrl);
                audit.Status = AuditStatus.Failed;
                await repository.UpsertAuditAsync(audit, CancellationToken.None);

                var isRateLimit = ex is Octokit.RateLimitExceededException ||
                                  ex.Message.Contains("rate limit", StringComparison.OrdinalIgnoreCase);

                var userMessage = isRateLimit
                    ? "GitHub API rate limit exceeded (unauthenticated IP quota is 60 requests/hr). Please provide a GITHUB_TOKEN environment variable or configure 'GitHub:Token' in appsettings.json to unlock 5,000 requests/hour."
                    : ex.Message;

                return Results.Problem(
                    detail: userMessage,
                    statusCode: isRateLimit ? StatusCodes.Status429TooManyRequests : StatusCodes.Status500InternalServerError,
                    title: isRateLimit ? "GitHub Rate Limit Exceeded" : "Repository Analysis Failed");
            }
        })
        .WithName("CreateAudit")
        .WithSummary("Start a repository telemetry + AST scan");

        // GET /api/audits/{auditId}
        group.MapGet("/{auditId}", async (
            string auditId,
            [FromQuery] string? repositoryId,
            [FromServices] ICosmosRepository repository,
            CancellationToken ct) =>
        {
            var audit = await repository.GetAuditAsync(auditId, repositoryId, ct);
            if (audit is null) return Results.NotFound();

            return Results.Ok(new AuditSummaryResponse(
                audit.Id,
                audit.Status.ToString(),
                audit.RepoUrl,
                audit.CreatedAt,
                audit.Telemetry,
                audit.AiInsights,
                audit.DossierMarkdown,
                CommitSha: audit.CommitSha));
        })
        .WithName("GetAudit")
        .WithSummary("Retrieve an audit by ID");

        // GET /api/audits/{auditId}/download
        group.MapGet("/{auditId}/download", async (
            string auditId,
            [FromQuery] string? repositoryId,
            [FromServices] ICosmosRepository repository,
            [FromServices] IBlobStorageService blobStorage,
            CancellationToken ct) =>
        {
            var audit = await repository.GetAuditAsync(auditId, repositoryId, ct);
            if (audit is null) return Results.NotFound();
            if (string.IsNullOrEmpty(audit.DossierBlobName))
                return Results.Problem("Dossier not yet generated.", statusCode: 400);

            var (url, expiresAt) = await blobStorage.GenerateSasUrlAsync(audit.DossierBlobName, ct);
            return Results.Ok(new DossierDownloadResponse(url, expiresAt));
        })
        .WithName("GetDossierDownload")
        .WithSummary("Generate a 15-minute SAS URL for the dossier .md file");
    }
}
