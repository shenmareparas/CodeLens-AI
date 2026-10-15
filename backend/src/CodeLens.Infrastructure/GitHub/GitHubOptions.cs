namespace CodeLens.Infrastructure.GitHub;

/// <summary>
/// Configuration options for GitHub API integrations.
/// </summary>
public sealed class GitHubOptions
{
    /// <summary>
    /// Optional GitHub Personal Access Token for higher rate limits (5,000 req/hr).
    /// If null or empty, unauthenticated requests (60 req/hr) or GITHUB_TOKEN environment variable is used.
    /// </summary>
    public string? Token { get; set; }
}
