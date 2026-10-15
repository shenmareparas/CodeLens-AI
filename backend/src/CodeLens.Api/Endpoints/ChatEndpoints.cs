using CodeLens.Core.DTOs;
using CodeLens.Core.Entities;
using CodeLens.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Text;

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
            [FromQuery] string repositoryId,
            ClaimsPrincipal user,
            [FromServices] ICosmosRepository repository,
            HttpResponse response,
            CancellationToken ct) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? user.FindFirstValue("sub")!;

            // Persist user message
            await repository.SaveMessageAsync(new ChatMessageDocument
            {
                Id = $"msg_{Guid.NewGuid():N}",
                AuditId = auditId,
                Role = "user",
                Content = request.Message,
            }, ct);

            // Set up SSE response
            response.ContentType = "text/event-stream";
            response.Headers.CacheControl = "no-cache";
            response.Headers.Connection = "keep-alive";

            // TODO (Phase 3): Replace stub with real Semantic Kernel / Gemini streaming
            var stubReply = "Phase 3 will wire this up to Gemini 3.8 Flash via Semantic Kernel. " +
                            "The dossier context will be injected as the system prompt and the answer streamed token-by-token.";

            foreach (var chunk in ChunkString(stubReply, 8))
            {
                await response.WriteAsync($"data: {chunk}\n\n", ct);
                await response.Body.FlushAsync(ct);
                await Task.Delay(40, ct);
            }

            // Persist assistant reply
            await repository.SaveMessageAsync(new ChatMessageDocument
            {
                Id = $"msg_{Guid.NewGuid():N}",
                AuditId = auditId,
                Role = "assistant",
                Content = stubReply,
            }, ct);

            await response.WriteAsync("data: [DONE]\n\n", ct);
        })
        .WithName("StreamChat")
        .WithSummary("Stream a grounded Gemini response via SSE");
    }

    private static IEnumerable<string> ChunkString(string s, int chunkSize)
    {
        for (int i = 0; i < s.Length; i += chunkSize)
            yield return s.Substring(i, Math.Min(chunkSize, s.Length - i));
    }
}
