namespace CodeLens.Core.Interfaces;

using CodeLens.Core.DTOs;

/// <summary>
/// Service contract for querying GitHub repository telemetry and streaming zip archives.
/// </summary>
public interface IGitHubTelemetryService
{
    /// <summary>
    /// Parses a GitHub repository URL or shorthand into (owner, repo).
    /// </summary>
    (string Owner, string Repo) ParseRepoUrl(string repoUrl);

    /// <summary>
    /// Fetches deterministic repository telemetry (stars, forks, license, cadence, sparkline, churn).
    /// </summary>
    Task<RepoTelemetryResult> GetTelemetryAsync(
        string owner,
        string repo,
        CancellationToken ct = default);

    /// <summary>
    /// Streams the repository's default branch or specified reference as an in-memory zipball.
    /// </summary>
    Task<Stream> DownloadZipballStreamAsync(
        string owner,
        string repo,
        string? refOrBranch = null,
        CancellationToken ct = default);
}
