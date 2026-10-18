namespace CodeLens.Core.DTOs;

/// <summary>Request body for POST /api/auth/register</summary>
public sealed record RegisterRequest(string Name, string Email, string Password);

/// <summary>Request body for POST /api/auth/login</summary>
public sealed record LoginRequest(string Email, string Password);


/// <summary>Request body for POST /api/auth/set-password</summary>
public sealed record SetPasswordRequest(string Password);

/// <summary>Response from auth endpoints (JWT + user summary)</summary>
public sealed record AuthResponse(
    string Token,
    string UserId,
    string Email,
    string Name,
    string? AvatarUrl,
    IReadOnlyList<string> AuthProviders
);

/// <summary>Request body for POST /api/audits/analyze</summary>
public sealed record AnalyzeRequest(string RepoUrl, bool ForceRefresh = false);

/// <summary>Lightweight audit summary returned by GET /api/audits/{auditId}</summary>
public sealed record AuditSummaryResponse(
    string AuditId,
    string Status,
    string RepoUrl,
    DateTimeOffset CreatedAt,
    object? Telemetry,
    object? AiInsights,
    string? DossierMarkdown,
    string? CommitSha = null,
    bool IsStale = false,
    string? LatestCommitSha = null
);

/// <summary>Response for GET /api/audits/{auditId}/download</summary>
public sealed record DossierDownloadResponse(string Url, DateTimeOffset ExpiresAt);

/// <summary>Request body for POST /api/chat/{auditId}/stream</summary>
public sealed record ChatRequest(string Message);
