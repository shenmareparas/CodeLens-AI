namespace CodeLens.Tests;

using CodeLens.Infrastructure.Security;
using Xunit;

public class SecretScannerTests
{
    [Fact]
    public void ScanFile_DetectsAwsAccessKey_AndMasksIt()
    {
        var content = "var accessKey = \"AKIAIOSFODNN7EXAMPLE\";";
        var alerts = RegexSecretScanner.ScanFile("config.cs", content);

        Assert.NotEmpty(alerts);
        Assert.Contains(alerts, a => a.Contains("AWS Access Key") && a.Contains("AKIA****"));
        Assert.DoesNotContain("AKIAIOSFODNN7EXAMPLE", alerts[0]);
    }

    [Fact]
    public void ScanFile_DetectsGitHubToken_AndMasksIt()
    {
        var content = "const token = 'ghp_123456789012345678901234567890123456';";
        var alerts = RegexSecretScanner.ScanFile("auth.ts", content);

        Assert.NotEmpty(alerts);
        Assert.Contains(alerts, a => a.Contains("GitHub Token") && a.Contains("ghp_****"));
    }

    [Fact]
    public void ScanFile_DetectsPrivateKeyBlock()
    {
        var content = "-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA...\n-----END RSA PRIVATE KEY-----";
        var alerts = RegexSecretScanner.ScanFile("server.key", content);

        Assert.NotEmpty(alerts);
        Assert.Contains(alerts, a => a.Contains("Private Key") || a.Contains("key file"));
    }

    [Fact]
    public void ScanFile_DetectsSensitiveDotEnvFile()
    {
        var alerts = RegexSecretScanner.ScanFile(".env.local", "FOO=bar");

        Assert.NotEmpty(alerts);
        Assert.Contains(alerts, a => a.Contains("Sensitive environment/credential file detected"));
    }

    [Fact]
    public void ScanFile_IgnoresPlaceholders()
    {
        var content = "var apiKey = \"YOUR_API_KEY_HERE\";\nvar secret = \"placeholder_token\";";
        var alerts = RegexSecretScanner.ScanFile("appsettings.json", content);

        Assert.Empty(alerts);
    }

    [Fact]
    public void ScanFile_IgnoresPlaceholderPrivateKeyInExampleFile()
    {
        var content = "PRIVATE_KEY=\"-----BEGIN PRIVATE KEY-----\\nyour-placeholder-key-here\\n-----END PRIVATE KEY-----\"";
        var alerts = RegexSecretScanner.ScanFile(".env.example", content);

        Assert.Empty(alerts);
    }
}
