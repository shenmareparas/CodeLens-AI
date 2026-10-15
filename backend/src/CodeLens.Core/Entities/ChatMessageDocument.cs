namespace CodeLens.Core.Entities;

/// <summary>A single chat message in a session (ChatSessions container).</summary>
public sealed class ChatMessageDocument
{
    public string Id { get; set; } = default!;        // "msg_<ulid>"
    public string AuditId { get; set; } = default!;   // partition key
    public string Role { get; set; } = default!;      // "user" | "assistant"
    public string Content { get; set; } = default!;
    public DateTimeOffset Timestamp { get; set; } = DateTimeOffset.UtcNow;
}
