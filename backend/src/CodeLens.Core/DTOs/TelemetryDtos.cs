namespace CodeLens.Core.DTOs;

using CodeLens.Core.Entities;

/// <summary>
/// Deterministic GitHub repository telemetry fetched via Octokit.
/// </summary>
public sealed record RepoTelemetryResult(
    string Owner,
    string Repo,
    string DefaultBranch,
    string? CommitSha,
    long Stars,
    long Forks,
    string? License,
    string ReleaseStatus,
    int DaysSinceLastRelease,
    IReadOnlyList<int> WeeklyCommitsSparkline,
    IReadOnlyDictionary<string, double> Languages,
    IReadOnlyDictionary<string, int> FileChurn,
    long TotalCommits = 0
);

/// <summary>
/// Static analysis results computed from the in-memory repository zipball.
/// </summary>
public sealed record CodeAnalysisResult(
    IReadOnlyList<HotspotEntry> Hotspots,
    IReadOnlyList<string> DeadCode,
    IReadOnlyList<string> SecretAlerts,
    IReadOnlyList<DependencyEntry> Dependencies,
    string SymbolManifest,
    int TotalFilesAnalyzed,
    int TotalLinesOfCode
);
