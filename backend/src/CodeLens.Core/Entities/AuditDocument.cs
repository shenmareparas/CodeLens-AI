namespace CodeLens.Core.Entities;

/// <summary>Audit status enumeration.</summary>
public enum AuditStatus
{
    Processing,
    Completed,
    Failed,
}

/// <summary>
/// Top-level audit document stored in Cosmos DB (Audits container,
/// partition key: /repositoryId).
/// </summary>
public sealed class AuditDocument
{
    public string Id { get; set; } = default!;               // "audit_<ulid>"
    public string RepositoryId { get; set; } = default!;     // "owner_repo"
    public string RepoUrl { get; set; } = default!;
    public string UserId { get; set; } = default!;
    public string? CommitSha { get; set; }
    public string? Branch { get; set; }
    public AuditStatus Status { get; set; } = AuditStatus.Processing;
    public TelemetryData? Telemetry { get; set; }
    public AiInsights? AiInsights { get; set; }
    public string? DossierBlobName { get; set; }
    public string? DossierMarkdown { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? CompletedAt { get; set; }
}

public sealed class TelemetryData
{
    public long Stars { get; set; }
    public long Forks { get; set; }
    public string? License { get; set; }
    public string ReleaseStatus { get; set; } = "Unknown";
    public int DaysSinceLastRelease { get; set; }
    public long TotalCommits { get; set; }
    public List<int> WeeklyCommitsSparkline { get; set; } = [];
    public List<CommitActivityPoint> CommitTimeline { get; set; } = [];
    public Dictionary<string, double> Languages { get; set; } = [];
    public List<HotspotEntry> Hotspots { get; set; } = [];
    public List<string> DeadCode { get; set; } = [];
    public List<string> SecretAlerts { get; set; } = [];
    public List<DependencyEntry> Dependencies { get; set; } = [];
    public string? SymbolManifest { get; set; }
}

public sealed class CommitActivityPoint
{
    public string Label { get; set; } = default!;
    public string DateRange { get; set; } = default!;
    public int Commits { get; set; }
}

public sealed class HotspotEntry
{
    public string File { get; set; } = default!;
    public int Complexity { get; set; }
    public int Churn { get; set; }
    public double Score { get; set; }
}

public sealed class DependencyEntry
{
    public string Ecosystem { get; set; } = default!;
    public string Package { get; set; } = default!;
    public string Version { get; set; } = default!;
}

public sealed class AiInsights
{
    public string? Eli5Summary { get; set; }
    public string? LicenseVerdict { get; set; }
    public string? MermaidDiagram { get; set; }
    public string? CodeSmells { get; set; }
    public string? OnboardingRunbook { get; set; }
}
