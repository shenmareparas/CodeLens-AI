using CodeLens.Core.DTOs;
using CodeLens.Core.Entities;
using CodeLens.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Text;
using System.Text.Json;

namespace CodeLens.Api.Endpoints;

public static class ChatEndpoints
{
    public static void MapChatEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/chat")
            .WithTags("Chat")
            .RequireAuthorization();

        // POST /api/chat/{auditId}/stream
        group.MapPost("/{auditId}/stream", async (
            string auditId,
            [FromBody] ChatRequest request,
            [FromQuery] string? repositoryId,
            ClaimsPrincipal user,
            [FromServices] ICosmosRepository repository,
            [FromServices] IGeminiSynthesisService geminiService,
            HttpResponse response,
            CancellationToken ct) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? user.FindFirstValue("sub")!;

            // Retrieve audit document to extract grounded PROJECT_KNOWLEDGE.md dossier
            var audit = await repository.GetAuditAsync(auditId, repositoryId, ct);
            var dossierMarkdown = audit?.DossierMarkdown ??
                "# Project Knowledge Dossier\nNo cached dossier available for this audit.";

            // Persist user message
            await repository.SaveMessageAsync(new ChatMessageDocument
            {
                Id = $"msg_{Guid.NewGuid():N}",
                AuditId = auditId,
                Role = "user",
                Content = request.Message,
                Timestamp = DateTimeOffset.UtcNow
            }, ct);

            // Fetch prior conversation history for context
            var history = await repository.GetMessagesForAuditAsync(auditId, ct);

            // Set up SSE response headers conforming to AGENTS.md requirements
            response.ContentType = "text/event-stream";
            response.Headers.CacheControl = "no-cache";
            response.Headers["X-Accel-Buffering"] = "no";
            response.Headers.Connection = "keep-alive";

            var fullReply = new StringBuilder();

            await foreach (var token in geminiService.StreamChatResponseAsync(dossierMarkdown, history, request.Message, ct))
            {
                fullReply.Append(token);
                var payload = JsonSerializer.Serialize(new { text = token });
                await response.WriteAsync($"data: {payload}\n\n", ct);
                await response.Body.FlushAsync(ct);
            }

            // Persist assistant reply
            await repository.SaveMessageAsync(new ChatMessageDocument
            {
                Id = $"msg_{Guid.NewGuid():N}",
                AuditId = auditId,
                Role = "assistant",
                Content = fullReply.ToString(),
                Timestamp = DateTimeOffset.UtcNow
            }, ct);

            await response.WriteAsync("data: [DONE]\n\n", ct);
            await response.Body.FlushAsync(ct);
        })
        .WithName("StreamChat")
        .WithSummary("Stream a grounded Gemini response via SSE");

        // GET /api/chat/{auditId} - Fetch prior conversation history
        group.MapGet("/{auditId}", async (
            string auditId,
            ClaimsPrincipal user,
            [FromServices] ICosmosRepository repository,
            CancellationToken ct) =>
        {
            var messages = await repository.GetMessagesForAuditAsync(auditId, ct);
            return Results.Ok(messages.Select(m => new
            {
                id = m.Id,
                role = m.Role,
                content = m.Content,
                timestamp = m.Timestamp.ToString("HH:mm")
            }));
        })
        .WithName("GetChatHistory")
        .WithSummary("Fetch stored conversation messages for an audit");

        // DELETE /api/chat/{auditId} - Clear chat history
        group.MapDelete("/{auditId}", async (
            string auditId,
            ClaimsPrincipal user,
            [FromServices] ICosmosRepository repository,
            CancellationToken ct) =>
        {
            var deleted = await repository.ClearMessagesForAuditAsync(auditId, ct);
            return Results.Ok(new { cleared = true, count = deleted });
        })
        .WithName("ClearChatHistory")
        .WithSummary("Clear conversation history for an audit");
    }
}

