namespace CodeLens.Core.Entities;

/// <summary>Persisted user record in Cosmos DB (Users container).</summary>
public sealed class UserDocument
{
    public string Id { get; set; } = default!;           // "usr_<guid>"
    public string Email { get; set; } = default!;
    public string Name { get; set; } = default!;
    public string? AvatarUrl { get; set; }
    public string? PasswordHash { get; set; }
    public List<string> AuthProviders { get; set; } = [];
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
