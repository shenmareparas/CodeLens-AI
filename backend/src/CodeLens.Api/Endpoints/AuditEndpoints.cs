using CodeLens.Core.DTOs;
using CodeLens.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CodeLens.Api.Endpoints;

public static class AuditEndpoints
{
    public static void MapAuditEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/audits")
            .WithTags("Audits")
            .RequireAuthorization();

        // POST /api/audits/analyze
        group.MapPost("/analyze", async (
            [FromBody] AnalyzeRequest request,
            ClaimsPrincipal user,
            [FromServices] ICosmosRepository repository,
            CancellationToken ct) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? user.FindFirstValue("sub")!;

            // Derive a stable repository ID from the URL
            var repoId = request.RepoUrl
                .Replace("https://github.com/", "")
                .Replace("/", "_")
                .Trim('_');

            var audit = new CodeLens.Core.Entities.AuditDocument
            {
                Id = $"audit_{Guid.NewGuid():N}",
                RepositoryId = repoId,
                RepoUrl = request.RepoUrl,
                UserId = userId,
                Status = CodeLens.Core.Entities.AuditStatus.Pending,
            };

            var saved = await repository.UpsertAuditAsync(audit, ct);

            // TODO (Phase 2): Enqueue background job for analysis
            return Results.Accepted(
                $"/api/audits/{saved.Id}",
                new AuditSummaryResponse(
                    saved.Id, saved.Status.ToString(), saved.RepoUrl,
                    saved.CreatedAt, null, null, null));
        })
        .WithName("CreateAudit")
        .WithSummary("Start a repository telemetry + AST scan");

        // GET /api/audits/{auditId}
        group.MapGet("/{auditId}", async (
            string auditId,
            [FromQuery] string repositoryId,
            [FromServices] ICosmosRepository repository,
            CancellationToken ct) =>
        {
            var audit = await repository.GetAuditAsync(auditId, repositoryId, ct);
            if (audit is null) return Results.NotFound();

            return Results.Ok(new AuditSummaryResponse(
                audit.Id, audit.Status.ToString(), audit.RepoUrl,
                audit.CreatedAt, audit.Telemetry, audit.AiInsights, audit.DossierMarkdown));
        })
        .WithName("GetAudit")
        .WithSummary("Retrieve an audit by ID");

        // GET /api/audits/{auditId}/download
        group.MapGet("/{auditId}/download", async (
            string auditId,
            [FromQuery] string repositoryId,
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
