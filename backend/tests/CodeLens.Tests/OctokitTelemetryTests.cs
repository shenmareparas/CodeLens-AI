namespace CodeLens.Tests;

using CodeLens.Infrastructure.GitHub;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Xunit;

public class OctokitTelemetryTests
{
    private readonly OctokitTelemetryService _service;

    public OctokitTelemetryTests()
    {
        var options = Options.Create(new GitHubOptions());
        var httpClient = new HttpClient();
        var logger = NullLogger<OctokitTelemetryService>.Instance;
        _service = new OctokitTelemetryService(options, httpClient, logger);
    }

    [Theory]
    [InlineData("https://github.com/dotnet/aspnetcore", "dotnet", "aspnetcore")]
    [InlineData("https://github.com/dotnet/aspnetcore.git", "dotnet", "aspnetcore")]
    [InlineData("http://github.com/dotnet/aspnetcore", "dotnet", "aspnetcore")]
    [InlineData("github.com/dotnet/aspnetcore", "dotnet", "aspnetcore")]
    [InlineData("dotnet/aspnetcore", "dotnet", "aspnetcore")]
    [InlineData("https://github.com/facebook/react/", "facebook", "react")]
    public void ParseRepoUrl_ValidUrls_ReturnsExpectedOwnerAndRepo(string url, string expectedOwner, string expectedRepo)
    {
        var (owner, repo) = _service.ParseRepoUrl(url);

        Assert.Equal(expectedOwner, owner);
        Assert.Equal(expectedRepo, repo);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("justastring")]
    [InlineData("https://github.com/")]
    public void ParseRepoUrl_InvalidUrls_ThrowsArgumentException(string url)
    {
        Assert.Throws<ArgumentException>(() => _service.ParseRepoUrl(url));
    }
}
