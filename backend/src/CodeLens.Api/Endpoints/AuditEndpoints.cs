namespace CodeLens.Api.Endpoints;

using CodeLens.Core.DTOs;
using CodeLens.Core.Entities;
using CodeLens.Core.Interfaces;
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
            var summaries = audits.Select(a => new AuditSummaryResponse(
                a.Id,
                a.Status.ToString(),
                a.RepoUrl,
                a.CreatedAt,
                a.Telemetry,
                a.AiInsights,
                a.DossierMarkdown
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
                logger.LogInformation("Starting Phase 2 analysis for {Owner}/{Repo}", owner, repo);

                // 2. Concurrently fetch GitHub REST telemetry and download in-memory zipball
                var telemetryTask = telemetryService.GetTelemetryAsync(owner, repo, ct);
                var zipStreamTask = telemetryService.DownloadZipballStreamAsync(owner, repo, ct: ct);

                await Task.WhenAll(telemetryTask, zipStreamTask);
                var telemetryResult = await telemetryTask;
                using var zipStream = await zipStreamTask;

                // 3. Execute zero-disk AST & polyglot complexity analysis
                var analysisResult = await analysisService.AnalyzeRepositoryAsync(
                    zipStream,
                    telemetryResult.FileChurn,
                    ct);

                // 4. Assemble TelemetryData
                audit.Telemetry = new TelemetryData
                {
                    Stars = telemetryResult.Stars,
                    Forks = telemetryResult.Forks,
                    License = telemetryResult.License,
                    ReleaseStatus = telemetryResult.ReleaseStatus,
                    DaysSinceLastRelease = telemetryResult.DaysSinceLastRelease,
                    WeeklyCommitsSparkline = telemetryResult.WeeklyCommitsSparkline.ToList(),
                    Languages = telemetryResult.Languages.ToDictionary(),
                    Hotspots = analysisResult.Hotspots.ToList(),
                    DeadCode = analysisResult.DeadCode.ToList(),
                    SecretAlerts = analysisResult.SecretAlerts.ToList(),
                    Dependencies = analysisResult.Dependencies.ToList(),
                    SymbolManifest = analysisResult.SymbolManifest
                };

                audit.Status = AuditStatus.Completed;
                audit.CompletedAt = DateTimeOffset.UtcNow;
                await repository.UpsertAuditAsync(audit, ct);

                logger.LogInformation("Completed Phase 2 analysis for {AuditId} ({Owner}/{Repo})", audit.Id, owner, repo);

                return Results.Accepted(
                    $"/api/audits/{audit.Id}",
                    new AuditSummaryResponse(
                        audit.Id,
                        audit.Status.ToString(),
                        audit.RepoUrl,
                        audit.CreatedAt,
                        audit.Telemetry,
                        audit.AiInsights,
                        audit.DossierMarkdown));
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
                audit.DossierMarkdown));
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
