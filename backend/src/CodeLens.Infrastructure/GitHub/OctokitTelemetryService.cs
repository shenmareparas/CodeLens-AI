namespace CodeLens.Infrastructure.GitHub;

using CodeLens.Core.DTOs;
using CodeLens.Core.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Octokit;
using System.Net.Http.Headers;

/// <summary>
/// Telemetry engine implementing GitHub repository intelligence extraction via Octokit
/// and zero-disk in-memory zipball streaming.
/// </summary>
public sealed class OctokitTelemetryService : IGitHubTelemetryService
{
    private readonly GitHubClient _client;
    private readonly HttpClient _httpClient;
    private readonly ILogger<OctokitTelemetryService> _logger;
    private readonly string? _token;

    public OctokitTelemetryService(
        IOptions<GitHubOptions> options,
        HttpClient httpClient,
        ILogger<OctokitTelemetryService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;

        _token = !string.IsNullOrWhiteSpace(options.Value?.Token)
            ? options.Value.Token
            : Environment.GetEnvironmentVariable("GITHUB_TOKEN");

        _client = new GitHubClient(new Octokit.ProductHeaderValue("CodeLensAI"));
        if (!string.IsNullOrWhiteSpace(_token))
        {
            _client.Credentials = new Credentials(_token);
        }
    }

    /// <inheritdoc />
    public (string Owner, string Repo) ParseRepoUrl(string repoUrl)
    {
        if (string.IsNullOrWhiteSpace(repoUrl))
        {
            throw new ArgumentException("Repository URL cannot be null or empty.", nameof(repoUrl));
        }

        var cleaned = repoUrl.Trim();
        if (cleaned.StartsWith("https://github.com/", StringComparison.OrdinalIgnoreCase))
        {
            cleaned = cleaned["https://github.com/".Length..];
        }
        else if (cleaned.StartsWith("http://github.com/", StringComparison.OrdinalIgnoreCase))
        {
            cleaned = cleaned["http://github.com/".Length..];
        }
        else if (cleaned.StartsWith("github.com/", StringComparison.OrdinalIgnoreCase))
        {
            cleaned = cleaned["github.com/".Length..];
        }

        if (cleaned.EndsWith(".git", StringComparison.OrdinalIgnoreCase))
        {
            cleaned = cleaned[..^4];
        }

        cleaned = cleaned.Trim('/');

        var parts = cleaned.Split('/', StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length < 2)
        {
            throw new ArgumentException($"Invalid GitHub repository URL or format: '{repoUrl}'. Expected 'owner/repo'.");
        }

        return (parts[0], parts[1]);
    }

    /// <inheritdoc />
    public async Task<RepoTelemetryResult> GetTelemetryAsync(
        string owner,
        string repo,
        CancellationToken ct = default)
    {
        _logger.LogInformation("Fetching GitHub telemetry for {Owner}/{Repo}", owner, repo);

        // 1. Repository metadata
        var repository = await _client.Repository.Get(owner, repo);
        var stars = repository.StargazersCount;
        var forks = repository.ForksCount;
        var defaultBranch = repository.DefaultBranch ?? "main";
        var license = repository.License?.Name ?? repository.License?.SpdxId;

        // 2. Language distribution
        var languages = await FetchLanguagesAsync(owner, repo);

        // 3. Release cadence & days since release
        var (releaseStatus, daysSinceRelease) = await DetermineReleaseCadenceAsync(owner, repo);

        // 4. 8-Week Commit Sparkline
        var sparkline = await FetchCommitSparklineAsync(owner, repo);

        // 5. File commit churn from recent commits
        var fileChurn = await FetchFileCommitChurnAsync(owner, repo);

        return new RepoTelemetryResult(
            Owner: owner,
            Repo: repo,
            DefaultBranch: defaultBranch,
            Stars: stars,
            Forks: forks,
            License: license,
            ReleaseStatus: releaseStatus,
            DaysSinceLastRelease: daysSinceRelease,
            WeeklyCommitsSparkline: sparkline,
            Languages: languages,
            FileChurn: fileChurn
        );
    }

    /// <inheritdoc />
    public async Task<Stream> DownloadZipballStreamAsync(
        string owner,
        string repo,
        string? refOrBranch = null,
        CancellationToken ct = default)
    {
        _logger.LogInformation("Downloading in-memory zipball stream for {Owner}/{Repo} (ref: {Ref})", owner, repo, refOrBranch ?? "default");

        var url = string.IsNullOrWhiteSpace(refOrBranch)
            ? $"https://api.github.com/repos/{owner}/{repo}/zipball"
            : $"https://api.github.com/repos/{owner}/{repo}/zipball/{refOrBranch}";

        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.UserAgent.ParseAdd("CodeLensAI");
        request.Headers.Accept.ParseAdd("application/vnd.github+json");

        if (!string.IsNullOrWhiteSpace(_token))
        {
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _token);
        }

        var response = await _httpClient.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, ct);
        if (response.StatusCode == System.Net.HttpStatusCode.Forbidden || (int)response.StatusCode == 429)
        {
            var body = await response.Content.ReadAsStringAsync(ct);
            if (body.Contains("rate limit", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException(
                    "GitHub API rate limit exceeded (unauthenticated limit is 60 requests/hr). Add a GITHUB_TOKEN in your environment or appsettings.json to unlock 5,000 requests/hr.");
            }
        }
        response.EnsureSuccessStatusCode();

        var memoryStream = new MemoryStream();
        await response.Content.CopyToAsync(memoryStream, ct);
        memoryStream.Position = 0;
        return memoryStream;
    }

    // ── Internal Helpers ─────────────────────────────────────────────────────────

    private async Task<IReadOnlyDictionary<string, double>> FetchLanguagesAsync(string owner, string repo)
    {
        try
        {
            var rawLanguages = await _client.Repository.GetAllLanguages(owner, repo);
            long totalBytes = rawLanguages.Sum(l => l.NumberOfBytes);

            if (totalBytes <= 0)
            {
                return new Dictionary<string, double>();
            }

            return rawLanguages.ToDictionary(
                l => l.Name,
                l => Math.Round((double)l.NumberOfBytes / totalBytes * 100.0, 1)
            );
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to retrieve languages for {Owner}/{Repo}", owner, repo);
            return new Dictionary<string, double>();
        }
    }

    private async Task<(string Status, int DaysSinceRelease)> DetermineReleaseCadenceAsync(string owner, string repo)
    {
        try
        {
            var releases = await _client.Repository.Release.GetAll(
                owner,
                repo,
                new ApiOptions { PageSize = 1, PageCount = 1 });

            if (releases.Count > 0)
            {
                var latest = releases[0];
                var publishedAt = latest.PublishedAt ?? latest.CreatedAt;
                var daysSince = (int)Math.Max(0, (DateTimeOffset.UtcNow - publishedAt).TotalDays);

                var status = daysSince switch
                {
                    <= 30 => "Healthy",
                    <= 180 => "Stable",
                    _ => "Stagnant"
                };

                return (status, daysSince);
            }

            // Fallback: check recent tags
            var tags = await _client.Repository.GetAllTags(
                owner,
                repo,
                new ApiOptions { PageSize = 1, PageCount = 1 });

            if (tags.Count > 0)
            {
                return ("Stable (Tagged)", 45);
            }

            // Check recent commits as general activity indicator
            var commits = await _client.Repository.Commit.GetAll(
                owner,
                repo,
                new ApiOptions { PageSize = 1, PageCount = 1 });

            if (commits.Count > 0)
            {
                var commitDate = commits[0].Commit.Author?.Date ?? DateTimeOffset.UtcNow;
                var daysSinceCommit = (int)Math.Max(0, (DateTimeOffset.UtcNow - commitDate).TotalDays);

                var status = daysSinceCommit switch
                {
                    <= 30 => "Active (No Releases)",
                    <= 180 => "Stable (No Releases)",
                    _ => "Stagnant (No Releases)"
                };

                return (status, daysSinceCommit);
            }

            return ("No Releases", 0);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to fetch releases for {Owner}/{Repo}", owner, repo);
            return ("Unknown", 0);
        }
    }

    private async Task<IReadOnlyList<int>> FetchCommitSparklineAsync(string owner, string repo)
    {
        var sparkline = new int[8];

        try
        {
            // GitHub Commit Activity API returns 52 weeks of stats.
            var activity = await _client.Repository.Statistics.GetCommitActivity(owner, repo);
            if (activity?.Activity != null && activity.Activity.Count >= 8)
            {
                var last8Weeks = activity.Activity.TakeLast(8).Select(w => w.Total).ToArray();
                return last8Weeks;
            }
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Statistics API not yet warm or unavailable for {Owner}/{Repo}. Falling back to commit query.", owner, repo);
        }

        try
        {
            // Fallback: Query commits across the last 56 days (8 weeks)
            var since = DateTimeOffset.UtcNow.AddDays(-56);
            var commits = await _client.Repository.Commit.GetAll(
                owner,
                repo,
                new CommitRequest { Since = since },
                new ApiOptions { PageSize = 100, PageCount = 2 });

            foreach (var commit in commits)
            {
                var commitDate = commit.Commit.Author?.Date ?? DateTimeOffset.UtcNow;
                var daysAgo = (DateTimeOffset.UtcNow - commitDate).TotalDays;
                var weekIndex = 7 - (int)(daysAgo / 7);

                if (weekIndex is >= 0 and < 8)
                {
                    sparkline[weekIndex]++;
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to build commit sparkline for {Owner}/{Repo}", owner, repo);
        }

        return sparkline;
    }

    private async Task<IReadOnlyDictionary<string, int>> FetchFileCommitChurnAsync(string owner, string repo)
    {
        var fileChurn = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

        try
        {
            var lastApiInfo = _client.GetLastApiInfo();
            if (string.IsNullOrWhiteSpace(_token) && lastApiInfo?.RateLimit != null && lastApiInfo.RateLimit.Remaining < 10)
            {
                _logger.LogWarning("GitHub unauthenticated quota low ({Remaining} remaining). Skipping detailed commit file churn.", lastApiInfo.RateLimit.Remaining);
                return fileChurn;
            }

            int churnCommitLimit = string.IsNullOrWhiteSpace(_token) ? 5 : 15;
            var commits = await _client.Repository.Commit.GetAll(
                owner,
                repo,
                new ApiOptions { PageSize = churnCommitLimit, PageCount = 1 });

            foreach (var commitSummary in commits)
            {
                try
                {
                    var fullCommit = await _client.Repository.Commit.Get(owner, repo, commitSummary.Sha);
                    if (fullCommit?.Files == null) continue;

                    foreach (var file in fullCommit.Files)
                    {
                        if (string.IsNullOrWhiteSpace(file.Filename)) continue;

                        var normalizedPath = file.Filename.Replace('\\', '/');
                        fileChurn[normalizedPath] = fileChurn.GetValueOrDefault(normalizedPath, 0) + 1;
                    }
                }
                catch (RateLimitExceededException)
                {
                    _logger.LogWarning("GitHub rate limit reached while collecting file churn for {Owner}/{Repo}", owner, repo);
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogDebug(ex, "Error getting commit details for SHA {Sha}", commitSummary.Sha);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to collect file commit churn for {Owner}/{Repo}", owner, repo);
        }

        return fileChurn;
    }
}
