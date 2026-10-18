namespace CodeLens.Tests;

using CodeLens.Infrastructure.Analysis;
using Microsoft.Extensions.Logging.Abstractions;
using System.IO.Compression;
using System.Text;
using Xunit;

public class RoslynAndPolyglotAnalyzerTests
{
    private readonly RoslynAndPolyglotAnalyzer _analyzer;

    public RoslynAndPolyglotAnalyzerTests()
    {
        _analyzer = new RoslynAndPolyglotAnalyzer(NullLogger<RoslynAndPolyglotAnalyzer>.Instance);
    }

    [Fact]
    public async Task AnalyzeRepositoryAsync_ProcessesZipArchive_ComputesHotspotsAndDependencies()
    {
        // Arrange: Create in-memory zip archive mimicking a GitHub repository zipball
        using var memoryStream = new MemoryStream();
        using (var archive = new ZipArchive(memoryStream, ZipArchiveMode.Create, leaveOpen: true))
        {
            // 1. C# file with branching and classes
            var csEntry = archive.CreateEntry("repo-main-12345/src/Calculator.cs");
            using (var writer = new StreamWriter(csEntry.Open(), Encoding.UTF8))
            {
                writer.WriteLine("""
                namespace SampleApp;

                public class Calculator
                {
                    public int Compute(int a, int b, bool flag)
                    {
                        if (a > 0 && b > 0)
                        {
                            return a + b;
                        }
                        else if (flag)
                        {
                            for (int i = 0; i < 5; i++)
                            {
                                a++;
                            }
                            return a;
                        }

                        return 0;
                    }
                }

                internal class DeadHelper
                {
                    public void NeverCalled() {}
                }
                """);
            }

            // 2. package.json with dependencies
            var pkgEntry = archive.CreateEntry("repo-main-12345/frontend/package.json");
            using (var writer = new StreamWriter(pkgEntry.Open(), Encoding.UTF8))
            {
                writer.WriteLine("""
                {
                  "name": "frontend",
                  "dependencies": {
                    "next": "^16.0.0",
                    "react": "^19.0.0"
                  }
                }
                """);
            }

            // 3. .csproj with NuGet dependencies
            var csprojEntry = archive.CreateEntry("repo-main-12345/backend/App.csproj");
            using (var writer = new StreamWriter(csprojEntry.Open(), Encoding.UTF8))
            {
                writer.WriteLine("""
                <Project Sdk="Microsoft.NET.Sdk">
                  <PropertyGroup>
                    <TargetFramework>net10.0</TargetFramework>
                  </PropertyGroup>
                  <ItemGroup>
                    <PackageReference Include="Octokit" Version="14.0.0" />
                  </ItemGroup>
                </Project>
                """);
            }

            // 4. Ignored file in node_modules
            var vendorEntry = archive.CreateEntry("repo-main-12345/node_modules/lodash/index.js");
            using (var writer = new StreamWriter(vendorEntry.Open(), Encoding.UTF8))
            {
                writer.WriteLine("module.exports = {};");
            }

            // 5. Ignored file in .agents
            var agentEntry = archive.CreateEntry("repo-main-12345/.agents/skills/react-doctor/SKILL.md");
            using (var writer = new StreamWriter(agentEntry.Open(), Encoding.UTF8))
            {
                writer.WriteLine("# React Doctor Skill\nif (a && b) { return c; }");
            }
        }

        memoryStream.Position = 0;

        var fileChurn = new Dictionary<string, int>
        {
            ["src/Calculator.cs"] = 8
        };

        // Act
        var result = await _analyzer.AnalyzeRepositoryAsync(memoryStream, fileChurn);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(3, result.TotalFilesAnalyzed); // Excludes node_modules

        // Hotspots
        var calculatorHotspot = Assert.Single(result.Hotspots, h => h.File == "src/Calculator.cs");
        Assert.True(calculatorHotspot.Complexity > 1, "Complexity should reflect branching constructs");
        Assert.Equal(8, calculatorHotspot.Churn);
        var expectedScore = Math.Round(calculatorHotspot.Complexity * Math.Log(8 + 1), 2);
        Assert.Equal(expectedScore, calculatorHotspot.Score);

        // Dependencies
        Assert.Contains(result.Dependencies, d => d.Package == "Octokit" && d.Version == "14.0.0");
        Assert.Contains(result.Dependencies, d => d.Package == "next" && d.Version == "^16.0.0");
        Assert.Contains(result.Dependencies, d => d.Package == "react" && d.Version == "^19.0.0");

        // Dead Code Candidate
        Assert.Contains(result.DeadCode, dc => dc.Contains("DeadHelper"));

        // Symbol Manifest
        Assert.Contains("CLASS: Calculator", result.SymbolManifest);
    }

    [Fact]
    public async Task AnalyzeRepositoryAsync_ParsesDartPubspecDependencies()
    {
        using var memoryStream = new MemoryStream();
        using (var archive = new ZipArchive(memoryStream, ZipArchiveMode.Create, leaveOpen: true))
        {
            var pubspecEntry = archive.CreateEntry("chess-main/pubspec.yaml");
            using var writer = new StreamWriter(pubspecEntry.Open(), Encoding.UTF8);
            writer.WriteLine("""
            name: chess
            description: A chess engine.
            version: 1.0.0

            environment:
              sdk: '>=3.0.0 <4.0.0'

            dependencies:
              flutter:
                sdk: flutter
              cupertino_icons: ^1.0.8
              provider: ^6.1.2

            dev_dependencies:
              flutter_test:
                sdk: flutter
              flutter_lints: ^4.0.0
            """);
        }

        memoryStream.Position = 0;
        var result = await _analyzer.AnalyzeRepositoryAsync(memoryStream, new Dictionary<string, int>());

        Assert.NotNull(result);
        Assert.Contains(result.Dependencies, d => d.Ecosystem == "Pub" && d.Package == "flutter" && d.Version == "sdk: flutter");
        Assert.Contains(result.Dependencies, d => d.Ecosystem == "Pub" && d.Package == "cupertino_icons" && d.Version == "^1.0.8");
        Assert.Contains(result.Dependencies, d => d.Ecosystem == "Pub" && d.Package == "provider" && d.Version == "^6.1.2");
        Assert.Contains(result.Dependencies, d => d.Ecosystem == "Pub (dev)" && d.Package == "flutter_lints" && d.Version == "^4.0.0");
    }

    [Fact]
    public async Task AnalyzeRepositoryAsync_ParsesBunDependencies_FromBunLockAndPackageManager()
    {
        using var memoryStream = new MemoryStream();
        using (var archive = new ZipArchive(memoryStream, ZipArchiveMode.Create, leaveOpen: true))
        {
            // 1. package.json with Bun packageManager
            var pkgEntry = archive.CreateEntry("app-main/package.json");
            using (var writer = new StreamWriter(pkgEntry.Open(), Encoding.UTF8))
            {
                writer.WriteLine("""
                {
                  "name": "bun-app",
                  "packageManager": "bun@1.4.3",
                  "dependencies": {
                    "hono": "^4.6.0"
                  },
                  "devDependencies": {
                    "@types/bun": "^1.2.0"
                  }
                }
                """);
            }

            // 2. bun.lock with workspaces and dependencies (including trailing commas)
            var bunLockEntry = archive.CreateEntry("app-main/bun.lock");
            using (var writer = new StreamWriter(bunLockEntry.Open(), Encoding.UTF8))
            {
                writer.WriteLine("""
                {
                  "lockfileVersion": 2,
                  "configVersion": 1,
                  "workspaces": {
                    "": {
                      "name": "bun-app",
                      "dependencies": {
                        "hono": "^4.6.0",
                        "zod": "^3.23.8",
                      },
                      "devDependencies": {
                        "@types/bun": "^1.2.0",
                      },
                    },
                  },
                }
                """);
            }
        }

        memoryStream.Position = 0;
        var result = await _analyzer.AnalyzeRepositoryAsync(memoryStream, new Dictionary<string, int>());

        Assert.NotNull(result);
        Assert.Contains(result.Dependencies, d => d.Ecosystem == "Bun" && d.Package == "hono" && d.Version == "^4.6.0");
        Assert.Contains(result.Dependencies, d => d.Ecosystem == "Bun" && d.Package == "zod" && d.Version == "^3.23.8");
        Assert.Contains(result.Dependencies, d => d.Ecosystem == "Bun (dev)" && d.Package == "@types/bun" && d.Version == "^1.2.0");
        // Ensure no duplicate or npm-labeled entries when Bun is detected
        Assert.DoesNotContain(result.Dependencies, d => d.Ecosystem.StartsWith("npm"));
    }
}
