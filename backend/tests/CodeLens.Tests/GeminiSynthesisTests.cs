namespace CodeLens.Tests;

using CodeLens.Core.Entities;
using CodeLens.Infrastructure.AI;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
public class GeminiSynthesisTests
{
    [Fact]
    public void SemanticKernel_GoogleGeminiConnector_ResolvesChatService()
    {
        var builder = Kernel.CreateBuilder();
        builder.AddGoogleAIGeminiChatCompletion("gemini-3.8-flash", "test-key");
        var kernel = builder.Build();
        var chatService = kernel.GetRequiredService<IChatCompletionService>();
        Assert.NotNull(chatService);
    }

    [Fact]
    public void MermaidSanitizer_HandlesEmptyAndNull()
    {
        var nullResult = MermaidSanitizer.Sanitize(null, "TestRepo");
        var emptyResult = MermaidSanitizer.Sanitize("   ", "TestRepo");

        Assert.Contains("flowchart TD", nullResult);
        Assert.Contains("TestRepo", nullResult);
        Assert.Contains("flowchart TD", emptyResult);
    }

    [Fact]
    public void MermaidSanitizer_StripsCodeFencesAndSanitizesLabels()
    {
        var rawMermaid = """
        ```mermaid
        flowchart TD
          Client[Web Client (Next.js)] --> API[Core API (v1)]
          API --> DB[(Azure Cosmos (NoSQL))]
        ```
        """;

        var sanitized = MermaidSanitizer.Sanitize(rawMermaid, "SampleApp");

        Assert.DoesNotContain("```", sanitized);
        Assert.Contains("[\"Web Client (Next.js)\"]", sanitized);
        Assert.Contains("[\"Core API (v1)\"]", sanitized);
        Assert.Contains("[(\"Azure Cosmos (NoSQL)\")]", sanitized);
    }

    [Fact]
    public void MermaidSanitizer_HealsUnclosedBracketsAndMalformedLines()
    {
        // Tests the exact scenario from user's parse error:
        // Parse error on line 5: ...iew Visual Spending
        // Parse error on line 7: ...ve Data to Device &
        var malformedDiagram = """
        flowchart TD
          subgraph UI Interface
            App[Mobile App]
          end
          A[View Visual Spending 
          subgraph Data Storage
            B[Save Data to Device & 
          end
        """;

        var sanitized = MermaidSanitizer.Sanitize(malformedDiagram, "expense_tracker");

        Assert.Contains("A[\"View Visual Spending\"]", sanitized);
        Assert.Contains("B[\"Save Data to Device &\"]", sanitized);
        Assert.Contains("subgraph UI_Interface[\"UI Interface\"]", sanitized);
        Assert.Contains("subgraph Data_Storage[\"Data Storage\"]", sanitized);
    }

    [Fact]
    public void MermaidSanitizer_SanitizesAllShapesAndArrowLabels()
    {
        var complexDiagram = """
        flowchart TD
          A[(Database Storage)] --> B([Start / Stop])
          B --> C[[Subroutine Call]]
          C --> D{{Decision Hexagon}}
          D --> E((Circle Point))
          E --> F[Standard Rectangle]
          F --> G(Rounded Node)
          G -->|Connected with Arrow & Special| A
        """;

        var sanitized = MermaidSanitizer.Sanitize(complexDiagram, "test");

        Assert.Contains("A[(\"Database Storage\")]", sanitized);
        Assert.Contains("B([\"Start / Stop\"])", sanitized);
        Assert.Contains("C[[\"Subroutine Call\"]]", sanitized);
        Assert.Contains("D{{\"Decision Hexagon\"}}", sanitized);
        Assert.Contains("E((\"Circle Point\"))", sanitized);
        Assert.Contains("F[\"Standard Rectangle\"]", sanitized);
        Assert.Contains("G(\"Rounded Node\")", sanitized);
        Assert.Contains("|\"Connected with Arrow & Special\"|", sanitized);
    }

    [Fact]
    public void MarkdownDossierBuilder_MatchesSection9StandardizedTemplate()
    {
        var telemetry = new TelemetryData
        {
            Stars = 1200,
            Forks = 340,
            License = "MIT",
            ReleaseStatus = "Active",
            DaysSinceLastRelease = 4,
            WeeklyCommitsSparkline = [5, 12, 18, 25, 20, 15, 30, 42],
            Languages = new Dictionary<string, double>
            {
                ["C#"] = 60.5,
                ["TypeScript"] = 39.5
            },
            Hotspots =
            [
                new HotspotEntry { File = "src/Engine.cs", Complexity = 25, Churn = 10, Score = 59.95 }
            ],
            DeadCode = ["src/UnusedHelper.cs"],
            SecretAlerts = ["Potential API Key in config.json"],
            Dependencies =
            [
                new DependencyEntry { Ecosystem = "NuGet", Package = "Microsoft.SemanticKernel", Version = "1.81.0" }
            ]
        };

        var insights = new AiInsights
        {
            Eli5Summary = "A fast and smart repository auditor.",
            LicenseVerdict = "Fully permissive for commercial use.",
            MermaidDiagram = "flowchart TD\n  A --> B",
            CodeSmells = "- Monolithic analyzer service",
            OnboardingRunbook = "1. Run dotnet restore\n2. Run dotnet test"
        };

        var markdown = MarkdownDossierBuilder.BuildDossierMarkdown(
            "testowner",
            "testrepo",
            telemetry,
            insights,
            "main",
            new DateTimeOffset(2026, 10, 17, 0, 0, 0, TimeSpan.Zero));

        Assert.Contains("# Project Knowledge Dossier: testowner/testrepo", markdown);
        Assert.Contains("Model: Gemini 3.8 Flash", markdown);
        Assert.Contains("## 1. Executive Architecture Overview", markdown);
        Assert.Contains("A fast and smart repository auditor.", markdown);
        Assert.Contains("## 2. Repository Health", markdown);
        Assert.Contains("⭐ 1,200 | 🍴 340", markdown);
        Assert.Contains("Active (Last release: 4 days ago)", markdown);
        Assert.Contains("[5, 12, 18, 25, 20, 15, 30, 42]", markdown);
        Assert.Contains("MIT — Fully permissive for commercial use.", markdown);
        Assert.Contains("## 3. System Architecture Diagram", markdown);
        Assert.Contains("```mermaid", markdown);
        Assert.Contains("## 4. Complexity Heatmap (Top Bug Hotspots)", markdown);
        Assert.Contains("`src/Engine.cs`", markdown);
        Assert.Contains("59.95", markdown);
        Assert.Contains("## 5. Dependency & Ecosystem Inventory", markdown);
        Assert.Contains("NuGet | `Microsoft.SemanticKernel` | 1.81.0", markdown);
        Assert.Contains("## 6. Dead Code & Unreferenced Candidates", markdown);
        Assert.Contains("`src/UnusedHelper.cs`", markdown);
        Assert.Contains("## 7. Security & Secret Exposure Surface", markdown);
        Assert.Contains("Potential API Key in config.json", markdown);
        Assert.Contains("## 8. Architectural Anti-Patterns & Code Smells", markdown);
        Assert.Contains("Monolithic analyzer service", markdown);
        Assert.Contains("## 9. Developer Onboarding & First-Day Runbook", markdown);
        Assert.Contains("Run dotnet restore", markdown);
    }

    [Fact]
    public void MarkdownDossierBuilder_WithEmptyTelemetry_ProducesCleanFallbackTables()
    {
        var telemetry = new TelemetryData();
        var insights = new AiInsights();

        var markdown = MarkdownDossierBuilder.BuildDossierMarkdown("owner", "repo", telemetry, insights);

        Assert.Contains("*No high-risk hotspots detected*", markdown);
        Assert.Contains("*No external package dependencies detected*", markdown);
        Assert.Contains("*No dead or unreferenced code candidates detected.*", markdown);
        Assert.Contains("No credentials, private keys, or exposed secrets detected.", markdown);
    }

    [Fact]
    public void MermaidSanitizer_FixesUnclosedSubgraphsAndSpecialTitles()
    {
        var malformed = """
        subgraph Core Services (API)
          A[Client / Frontend] --> B[API Controller: v1]
        """;

        var sanitized = MermaidSanitizer.Sanitize(malformed, "MyProject");

        Assert.StartsWith("flowchart TD", sanitized);
        Assert.Contains("subgraph Core_Services__API_[\"Core Services (API)\"]", sanitized);
        Assert.Contains("[\"Client / Frontend\"]", sanitized);
        Assert.Contains("[\"API Controller: v1\"]", sanitized);
        Assert.EndsWith("end", sanitized);
    }

    [Fact]
    public async Task GeminiSynthesisService_SynthesizeRepositoryAsync_FallbackProducesValidInsights()
    {
        var options = Microsoft.Extensions.Options.Options.Create(new GeminiOptions());
        var logger = Microsoft.Extensions.Logging.Abstractions.NullLogger<GeminiSynthesisService>.Instance;
        var service = new GeminiSynthesisService(options, logger);

        var telemetry = new TelemetryData
        {
            Stars = 500,
            Forks = 80,
            License = "Apache-2.0",
            ReleaseStatus = "Active",
            Languages = new Dictionary<string, double> { ["TypeScript"] = 80.0, ["CSS"] = 20.0 },
            Hotspots = [new HotspotEntry { File = "src/index.ts", Complexity = 15, Churn = 5, Score = 26.87 }],
            Dependencies = [new DependencyEntry { Ecosystem = "Bun", Package = "next", Version = "16.0.0" }]
        };

        var insights = await service.SynthesizeRepositoryAsync("acme", "super-app", telemetry);

        Assert.NotNull(insights);
        Assert.Contains("super-app", insights.Eli5Summary);
        Assert.Contains("Apache-2.0", insights.LicenseVerdict);
        Assert.Contains("Permissive commercial use", insights.LicenseVerdict);
        Assert.Contains("flowchart TD", insights.MermaidDiagram);
        Assert.Contains("High-Risk Hotspot", insights.CodeSmells);
        Assert.Contains("bun install", insights.OnboardingRunbook);
    }

    [Fact]
    public async Task GeminiSynthesisService_StreamChatResponseAsync_FallbackStreamsGroundedTokens()
    {
        var options = Microsoft.Extensions.Options.Options.Create(new GeminiOptions());
        var logger = Microsoft.Extensions.Logging.Abstractions.NullLogger<GeminiSynthesisService>.Instance;
        var service = new GeminiSynthesisService(options, logger);

        var dossier = "# Project Knowledge Dossier: acme/super-app\n## 4. Complexity Heatmap\n`src/index.ts` is top hotspot.";
        var history = new List<ChatMessageDocument>();

        var tokens = new List<string>();
        await foreach (var token in service.StreamChatResponseAsync(dossier, history, "Tell me about the architecture hotspots"))
        {
            tokens.Add(token);
        }

        var fullResponse = string.Concat(tokens);
        Assert.NotEmpty(tokens);
        Assert.Contains("hotspot", fullResponse, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void GeminiPromptExecutionSettings_ConfiguresThinkingLevelLow()
    {
        var settings = new Microsoft.SemanticKernel.Connectors.Google.GeminiPromptExecutionSettings
        {
            ThinkingConfig = new Microsoft.SemanticKernel.Connectors.Google.GeminiThinkingConfig
            {
                ThinkingLevel = "low"
            }
        };

        Assert.NotNull(settings.ThinkingConfig);
        Assert.Equal("low", settings.ThinkingConfig.ThinkingLevel);
    }
}

