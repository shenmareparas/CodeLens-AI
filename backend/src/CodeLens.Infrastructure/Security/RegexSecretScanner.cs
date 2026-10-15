namespace CodeLens.Infrastructure.Security;

using System.Text.RegularExpressions;

/// <summary>
/// High-performance, zero-allocation secret and credential scanner using .NET 10 [GeneratedRegex].
/// </summary>
public static partial class RegexSecretScanner
{
    // ── Compiled Regular Expressions ─────────────────────────────────────────────

    [GeneratedRegex(@"\bAKIA[0-9A-Z]{16}\b", RegexOptions.Compiled)]
    private static partial Regex AwsAccessKeyRegex();

    [GeneratedRegex(@"\bgh[pousr]_[A-Za-z0-9_]{36,255}\b", RegexOptions.Compiled)]
    private static partial Regex GitHubTokenRegex();

    [GeneratedRegex(@"-----BEGIN (?:RSA|EC|DSA|OPENSSH|PGP|ENCRYPTED)?\s?PRIVATE KEY-----", RegexOptions.Compiled)]
    private static partial Regex PrivateKeyBlockRegex();

    [GeneratedRegex(@"\bxox[baprs]-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]{24,32}\b", RegexOptions.Compiled)]
    private static partial Regex SlackTokenRegex();

    [GeneratedRegex(@"\bAIza[0-9A-Za-z\-_]{35}\b", RegexOptions.Compiled)]
    private static partial Regex GoogleApiKeyRegex();

    [GeneratedRegex(@"(?i)\b(api[_-]?key|apikey|client[_-]?secret|jwt[_-]?secret|auth[_-]?token|access[_-]?token|private[_-]?key)\s*[:=]\s*[""']([^""'\r\n]{10,})[""']", RegexOptions.Compiled)]
    private static partial Regex GenericCredentialRegex();

    // ── Sensitive File Names ─────────────────────────────────────────────────────

    private static readonly HashSet<string> SensitiveExactFileNames = new(StringComparer.OrdinalIgnoreCase)
    {
        ".env",
        ".env.local",
        ".env.development",
        ".env.production",
        ".env.staging",
        ".env.test",
        "id_rsa",
        "id_ed25519",
        "id_ecdsa",
        "credentials.json",
        "client_secret.json",
        "service_account.json"
    };

    private static readonly string[] SensitiveExtensions =
    {
        ".pem",
        ".key",
        ".pfx",
        ".p12"
    };

    /// <summary>
    /// Scans a file name and content for exposed credentials and secrets.
    /// </summary>
    public static IReadOnlyList<string> ScanFile(string relativePath, string content)
    {
        var alerts = new List<string>();
        var fileName = Path.GetFileName(relativePath);

        // 1. Check for sensitive file names / extensions
        if (SensitiveExactFileNames.Contains(fileName))
        {
            alerts.Add($"Sensitive environment/credential file detected in repository: {relativePath}");
        }
        else
        {
            foreach (var ext in SensitiveExtensions)
            {
                if (fileName.EndsWith(ext, StringComparison.OrdinalIgnoreCase))
                {
                    alerts.Add($"Cryptographic certificate/key file detected in repository: {relativePath}");
                    break;
                }
            }
        }

        if (string.IsNullOrWhiteSpace(content))
        {
            return alerts;
        }

        // 2. AWS Access Key ID
        foreach (Match match in AwsAccessKeyRegex().Matches(content))
        {
            alerts.Add($"Exposed AWS Access Key in {relativePath}: {MaskSecret(match.Value)}");
        }

        // 3. GitHub Personal Access Token
        foreach (Match match in GitHubTokenRegex().Matches(content))
        {
            alerts.Add($"Exposed GitHub Token in {relativePath}: {MaskSecret(match.Value)}");
        }

        // 4. Private Key Blocks
        if (PrivateKeyBlockRegex().IsMatch(content))
        {
            alerts.Add($"Exposed Private Key header block in {relativePath}");
        }

        // 5. Slack Tokens
        foreach (Match match in SlackTokenRegex().Matches(content))
        {
            alerts.Add($"Exposed Slack Token in {relativePath}: {MaskSecret(match.Value)}");
        }

        // 6. Google API Key
        foreach (Match match in GoogleApiKeyRegex().Matches(content))
        {
            alerts.Add($"Exposed Google API Key in {relativePath}: {MaskSecret(match.Value)}");
        }

        // 7. Generic Hardcoded Credential Assignments
        foreach (Match match in GenericCredentialRegex().Matches(content))
        {
            var keyName = match.Groups[1].Value;
            var secretValue = match.Groups[2].Value;

            if (IsLikelyPlaceholder(secretValue))
            {
                continue;
            }

            alerts.Add($"Hardcoded {keyName} assignment in {relativePath}: {MaskSecret(secretValue)}");
        }

        return alerts;
    }

    private static bool IsLikelyPlaceholder(string value)
    {
        var lower = value.ToLowerInvariant();
        return lower.Contains("your_") ||
               lower.Contains("your-") ||
               lower.Contains("placeholder") ||
               lower.Contains("example") ||
               lower.Contains("dummy") ||
               lower.Contains("changeme") ||
               lower.Contains("replace_with") ||
               lower.Contains("xxx") ||
               lower.Contains("todo") ||
               lower.StartsWith("process.env") ||
               lower.StartsWith("system.getenv");
    }

    private static string MaskSecret(string secret)
    {
        if (secret.Length <= 6)
        {
            return "******";
        }

        var visibleChars = Math.Min(4, secret.Length / 4);
        var prefix = secret[..visibleChars];
        return $"{prefix}{new string('*', secret.Length - visibleChars)}";
    }
}
