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

        // 4. All-time total commits
        var totalCommits = await FetchTotalCommitsAsync(owner, repo, defaultBranch);

        // 5. Commit Activity & Chronological Timeline
        var (sparkline, commitTimeline) = await FetchCommitActivityAndTimelineAsync(owner, repo, totalCommits);

        // 6. File commit churn from recent commits
        var fileChurn = await FetchFileCommitChurnAsync(owner, repo);

        // 7. Latest commit SHA
        var commitSha = await GetLatestCommitShaAsync(owner, repo, defaultBranch, ct);

        return new RepoTelemetryResult(
            Owner: owner,
            Repo: repo,
            DefaultBranch: defaultBranch,
            CommitSha: commitSha,
            Stars: stars,
            Forks: forks,
            License: license,
            ReleaseStatus: releaseStatus,
            DaysSinceLastRelease: daysSinceRelease,
            WeeklyCommitsSparkline: sparkline,
            Languages: languages,
            FileChurn: fileChurn,
            TotalCommits: totalCommits,
            CommitTimeline: commitTimeline
        );
    }

    /// <inheritdoc />
    public async Task<string?> GetLatestCommitShaAsync(
        string owner,
        string repo,
        string? branch = null,
        CancellationToken ct = default)
    {
        try
        {
            var commits = await _client.Repository.Commit.GetAll(
                owner,
                repo,
                new CommitRequest { Sha = branch },
                new ApiOptions { PageSize = 1, PageCount = 1 });

            return commits.Count > 0 ? commits[0].Sha : null;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to fetch latest commit SHA for {Owner}/{Repo} on branch {Branch}", owner, repo, branch);
            return null;
        }
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

    private async Task<(IReadOnlyList<int> Sparkline, IReadOnlyList<CommitActivityPoint> Timeline)> FetchCommitActivityAndTimelineAsync(
        string owner,
        string repo,
        long totalCommits = 0)
    {
        var sparkline = new int[8];
        var timeline = new List<CommitActivityPoint>();

        // 1. Try 52-week commit activity statistics from GitHub
        IReadOnlyList<WeeklyCommitActivity>? weeklyActivities = null;
        try
        {
            var activity = await _client.Repository.Statistics.GetCommitActivity(owner, repo);
            if (activity?.Activity != null && activity.Activity.Count >= 8)
            {
                weeklyActivities = activity.Activity;
                sparkline = weeklyActivities.TakeLast(8).Select(w => w.Total).ToArray();
            }
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Statistics API not yet warm or unavailable for {Owner}/{Repo}. Falling back to commit queries.", owner, repo);
        }

        // 2. If weekly sparkline was not obtained from statistics, query last 56 days
        if (weeklyActivities == null)
        {
            try
            {
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
                _logger.LogWarning(ex, "Failed to build recent 8-week commit sparkline for {Owner}/{Repo}", owner, repo);
            }
        }

        // 3. Build All-Time chronological commit history timeline with date ranges and month/year labels
        try
        {
            var allTimeCommits = await _client.Repository.Commit.GetAll(
                owner,
                repo,
                new ApiOptions { PageSize = 100, PageCount = 1 });

            if (allTimeCommits.Count > 0)
            {
                var orderedCommits = allTimeCommits
                    .Select(c => c.Commit.Author?.Date ?? c.Commit.Committer?.Date ?? DateTimeOffset.UtcNow)
                    .OrderBy(d => d)
                    .ToList();

                var minDate = orderedCommits.First();
                var maxDate = orderedCommits.Last();
                var totalDays = (maxDate.Date - minDate.Date).TotalDays;

                if (totalDays > 60)
                {
                    // Group commits chronologically by month (e.g., "Jan 2024", "Feb 2024")
                    var monthlyGroups = orderedCommits
                        .GroupBy(d => new { d.Year, d.Month })
                        .OrderBy(g => g.Key.Year).ThenBy(g => g.Key.Month)
                        .ToList();

                    // If monthly groups are 14 or fewer, use monthly buckets directly
                    if (monthlyGroups.Count <= 14)
                    {
                        foreach (var mg in monthlyGroups)
                        {
                            var monthDate = new DateTime(mg.Key.Year, mg.Key.Month, 1);
                            var lastDay = DateTime.DaysInMonth(mg.Key.Year, mg.Key.Month);
                            timeline.Add(new CommitActivityPoint(
                                Label: monthDate.ToString("MMM yyyy"),
                                DateRange: $"{monthDate:MMM 01} - {monthDate:MMM} {lastDay}, {mg.Key.Year}",
                                Commits: mg.Count()
                            ));
                        }
                    }
                    else
                    {
                        // Repository spans many months/years: segment into 12 evenly-spaced chronological time windows
                        int bucketCount = 12;
                        var timeSpan = (maxDate - minDate).TotalSeconds;
                        var bucketCounters = new int[bucketCount];
                        var bucketMinDates = new DateTimeOffset?[bucketCount];
                        var bucketMaxDates = new DateTimeOffset?[bucketCount];

                        foreach (var date in orderedCommits)
                        {
                            var fraction = timeSpan > 0 ? (date - minDate).TotalSeconds / timeSpan : 0;
                            var idx = Math.Clamp((int)(fraction * bucketCount), 0, bucketCount - 1);
                            bucketCounters[idx]++;
                            if (!bucketMinDates[idx].HasValue || date < bucketMinDates[idx]!.Value) bucketMinDates[idx] = date;
                            if (!bucketMaxDates[idx].HasValue || date > bucketMaxDates[idx]!.Value) bucketMaxDates[idx] = date;
                        }

                        for (int i = 0; i < bucketCount; i++)
                        {
                            var start = minDate.AddSeconds(timeSpan * i / bucketCount);
                            var end = minDate.AddSeconds(timeSpan * (i + 1) / bucketCount);
                            timeline.Add(new CommitActivityPoint(
                                Label: $"{start:MMM yyyy}",
                                DateRange: $"{start:MMM dd, yyyy} - {end:MMM dd, yyyy}",
                                Commits: bucketCounters[i]
                            ));
                        }
                    }
                }
                else
                {
                    // Shorter repository lifetime (< 60 days): group into 8 chronological intervals
                    int bucketCount = Math.Min(8, Math.Max(4, orderedCommits.Count));
                    var timeSpan = (maxDate - minDate).TotalSeconds;
                    var bucketCounters = new int[bucketCount];
                    var bucketStart = new DateTimeOffset[bucketCount];
                    var bucketEnd = new DateTimeOffset[bucketCount];

                    for (int i = 0; i < bucketCount; i++)
                    {
                        bucketStart[i] = minDate.AddSeconds(timeSpan > 0 ? timeSpan * i / bucketCount : 0);
                        bucketEnd[i] = minDate.AddSeconds(timeSpan > 0 ? timeSpan * (i + 1) / bucketCount : 0);
                    }

                    foreach (var date in orderedCommits)
                    {
                        var fraction = timeSpan > 0 ? (date - minDate).TotalSeconds / timeSpan : 0;
                        var idx = Math.Clamp((int)(fraction * bucketCount), 0, bucketCount - 1);
                        bucketCounters[idx]++;
                    }

                    for (int i = 0; i < bucketCount; i++)
                    {
                        timeline.Add(new CommitActivityPoint(
                            Label: $"{bucketStart[i]:MMM dd}",
                            DateRange: $"{bucketStart[i]:MMM dd, yyyy} - {bucketEnd[i]:MMM dd, yyyy}",
                            Commits: bucketCounters[i]
                        ));
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to compile all-time commit chronological timeline for {Owner}/{Repo}", owner, repo);
        }

        // If timeline remains empty but 52-week activity exists, project non-zero activity
        if (timeline.Count == 0 && weeklyActivities != null && weeklyActivities.Count > 0)
        {
            var nonZero = weeklyActivities.Where(w => w.Total > 0).ToList();
            if (nonZero.Count > 0)
            {
                foreach (var w in weeklyActivities.TakeLast(12))
                {
                    var weekDate = DateTimeOffset.FromUnixTimeSeconds(w.Week);
                    timeline.Add(new CommitActivityPoint(
                        Label: weekDate.ToString("MMM yyyy"),
                        DateRange: $"{weekDate:MMM dd} - {weekDate.AddDays(6):MMM dd, yyyy}",
                        Commits: w.Total
                    ));
                }
            }
        }

        // If recent 8-week commits are low (<= 5) but chronological timeline has data, update sparkline from timeline
        if (sparkline.Sum() <= 5 && timeline.Count >= 4)
        {
            var sampled = new int[8];
            for (int i = 0; i < 8; i++)
            {
                int timelineIdx = (int)Math.Round((double)i / 7 * (timeline.Count - 1));
                sampled[i] = timeline[timelineIdx].Commits;
            }
            if (sampled.Sum() > 0)
            {
                sparkline = sampled;
            }
        }

        return (sparkline, timeline);
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

    private async Task<long> FetchTotalCommitsAsync(string owner, string repo, string branch)
    {
        try
        {
            // Query 1 commit to read the pagination 'last' page Link header from GitHub API
            var commits = await _client.Repository.Commit.GetAll(
                owner,
                repo,
                new CommitRequest { Sha = branch },
                new ApiOptions { PageSize = 1, PageCount = 1 });

            var lastApiInfo = _client.GetLastApiInfo();
            if (lastApiInfo?.Links != null &&
                lastApiInfo.Links.TryGetValue("last", out var lastPageUri) &&
                lastPageUri != null)
            {
                var query = System.Web.HttpUtility.ParseQueryString(lastPageUri.Query);
                var pageStr = query["page"];
                if (long.TryParse(pageStr, out var totalPages) && totalPages > 0)
                {
                    return totalPages;
                }
            }

            // If no pagination 'last' link exists, total commits is the small returned count
            return commits.Count;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to retrieve all-time total commits for {Owner}/{Repo}", owner, repo);
            return 0;
        }
    }
}
