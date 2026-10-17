namespace CodeLens.Infrastructure.AI;

using CodeLens.Core.Entities;
using CodeLens.Core.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
using System.Runtime.CompilerServices;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;

/// <summary>
/// AI synthesis service implementing structured repository intelligence extraction
/// and grounded conversational copilot via Google Gemini 3.8 Flash and Semantic Kernel.
/// </summary>
public sealed partial class GeminiSynthesisService : IGeminiSynthesisService
{
    private readonly GeminiOptions _options;
    private readonly ILogger<GeminiSynthesisService> _logger;
    private readonly Kernel? _kernel;
    private readonly IChatCompletionService? _chatService;

    [GeneratedRegex(@"\{[\s\S]*\}")]
    private static partial Regex JsonBlockRegex();

    [GeneratedRegex(@"^```(?:json)?\s*", RegexOptions.IgnoreCase | RegexOptions.Multiline)]
    private static partial Regex JsonFenceStartRegex();

    [GeneratedRegex(@"\s*```\s*$", RegexOptions.Multiline)]
    private static partial Regex JsonFenceEndRegex();

    public GeminiSynthesisService(
        IOptions<GeminiOptions> options,
        ILogger<GeminiSynthesisService> logger)
    {
        _options = options.Value;
        _logger = logger;

        // Resolve API key from options or environment variable
        var apiKey = !string.IsNullOrWhiteSpace(_options.ApiKey) && !_options.ApiKey.Contains("REPLACE_WITH")
            ? _options.ApiKey
            : Environment.GetEnvironmentVariable("GEMINI_API_KEY");

        if (!string.IsNullOrWhiteSpace(apiKey))
        {
            try
            {
                var builder = Kernel.CreateBuilder();
                var modelId = string.IsNullOrWhiteSpace(_options.ModelId) ? "gemini-3.8-flash" : _options.ModelId;
                builder.AddGoogleAIGeminiChatCompletion(modelId, apiKey);

                _kernel = builder.Build();
                _chatService = _kernel.GetRequiredService<IChatCompletionService>();
                _logger.LogInformation("Semantic Kernel Gemini connector initialized successfully with model {ModelId}", modelId);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to initialize Semantic Kernel Google connector. Fallback synthesis will be used.");
                _kernel = null;
                _chatService = null;
            }
        }
        else
        {
            _logger.LogInformation("No Gemini API key configured. Fallback heuristic synthesis engine active.");
        }
    }

    /// <inheritdoc />
    public async Task<AiInsights> SynthesizeRepositoryAsync(
        string owner,
        string repo,
        TelemetryData telemetry,
        CancellationToken ct = default)
    {
        if (_chatService is null)
        {
            _logger.LogInformation("Executing heuristic fallback synthesis for {Owner}/{Repo}", owner, repo);
            return BuildFallbackInsights(owner, repo, telemetry);
        }

        try
        {
            _logger.LogInformation("Invoking Gemini 3.8 Flash structured synthesis for {Owner}/{Repo}", owner, repo);

            var systemPrompt = """
            You are CodeLens AI, an expert software architecture auditor and developer onboarding copilot.
            Synthesize an authoritative, precise architectural review from the provided repository telemetry and AST symbol manifest.

            You MUST reply strictly with a valid JSON object with the following exact keys (no markdown code fences outside JSON):
            {
              "eli5Summary": "2-4 sentences explaining what the repository is, its main problem domain, and core mechanics in clear English.",
              "licenseVerdict": "Commercial usability analysis of the license (e.g. permissive, copyleft, dual-licensing, or proprietary risks).",
              "mermaidDiagram": "A valid Mermaid.js flowchart (starting with flowchart TD) illustrating the system architecture, major components, and data flow. All node labels MUST be quoted in square brackets, e.g. Node[\"Label\"].",
              "codeSmells": "3-5 bullet points analyzing architectural bottlenecks, high complexity churn hotspots, or potential anti-patterns based on telemetry.",
              "onboardingRunbook": "A step-by-step 3-5 item Day-1 developer onboarding runbook (prerequisites, setup commands, core entrypoints, testing instructions)."
            }
            """;

            var userPrompt = BuildUserPrompt(owner, repo, telemetry);

            var chatHistory = new ChatHistory();
            chatHistory.AddSystemMessage(systemPrompt);
            chatHistory.AddUserMessage(userPrompt);

            var response = await _chatService.GetChatMessageContentAsync(
                chatHistory,
                cancellationToken: ct);

            var responseContent = response.Content ?? string.Empty;
            var insights = ParseGeminiResponse(responseContent, repo, telemetry);

            _logger.LogInformation("Successfully synthesized architectural insights for {Owner}/{Repo}", owner, repo);
            return insights;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Gemini synthesis failed for {Owner}/{Repo}. Falling back to deterministic synthesis.", owner, repo);
            return BuildFallbackInsights(owner, repo, telemetry);
        }
    }

    /// <inheritdoc />
    public async IAsyncEnumerable<string> StreamChatResponseAsync(
        string dossierMarkdown,
        IReadOnlyList<ChatMessageDocument> chatHistory,
        string userMessage,
        [EnumeratorCancellation] CancellationToken ct = default)
    {
        if (_chatService is not null)
        {
            var systemPrompt = $"""
            You are CodeLens Copilot, an AI code architecture and onboarding assistant.
            You are answering questions from a software developer exploring this codebase.

            CRITICAL GROUNDING RULES:
            1. Ground your answers directly in the provided PROJECT_KNOWLEDGE.md dossier below.
            2. If something is not mentioned or cannot be inferred from the dossier, state that clearly and suggest where in the codebase they might check.
            3. Be direct, technically precise, and concise. Provide code or Mermaid diagrams when appropriate.

            === PROJECT_KNOWLEDGE.MD ===
            {dossierMarkdown}
            ============================
            """;

            var history = new ChatHistory();
            history.AddSystemMessage(systemPrompt);

            foreach (var msg in chatHistory)
            {
                if (string.Equals(msg.Role, "user", StringComparison.OrdinalIgnoreCase))
                {
                    history.AddUserMessage(msg.Content);
                }
                else if (string.Equals(msg.Role, "assistant", StringComparison.OrdinalIgnoreCase))
                {
                    history.AddAssistantMessage(msg.Content);
                }
            }

            history.AddUserMessage(userMessage);

            IAsyncEnumerable<StreamingChatMessageContent>? stream = null;
            try
            {
                stream = _chatService.GetStreamingChatMessageContentsAsync(
                    history,
                    cancellationToken: ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to initiate streaming chat from Gemini service. Falling back to local responder.");
            }

            if (stream is not null)
            {
                await foreach (var chunk in stream.WithCancellation(ct))
                {
                    if (!string.IsNullOrEmpty(chunk.Content))
                    {
                        yield return chunk.Content;
                    }
                }
                yield break;
            }
        }

        // Fallback grounded local responder when API key is not configured or offline
        var fallbackAnswer = GenerateFallbackChatAnswer(dossierMarkdown, userMessage);
        foreach (var chunk in ChunkString(fallbackAnswer, 12))
        {
            yield return chunk;
            await Task.Delay(30, ct);
        }
    }

    private static string BuildUserPrompt(string owner, string repo, TelemetryData telemetry)
    {
        var sb = new StringBuilder();
        sb.AppendLine($"Repository: {owner}/{repo}");
        sb.AppendLine($"Stars: {telemetry.Stars} | Forks: {telemetry.Forks}");
        sb.AppendLine($"License: {telemetry.License ?? "Unknown"}");
        sb.AppendLine($"Release Status: {telemetry.ReleaseStatus} (Last release: {telemetry.DaysSinceLastRelease} days ago)");

        if (telemetry.Languages.Count > 0)
        {
            var langs = string.Join(", ", telemetry.Languages.Select(kv => $"{kv.Key}: {kv.Value:F1}%"));
            sb.AppendLine($"Languages: {langs}");
        }

        if (telemetry.Hotspots.Count > 0)
        {
            sb.AppendLine("Top Complexity/Churn Hotspots:");
            foreach (var h in telemetry.Hotspots.OrderByDescending(x => x.Score).Take(10))
            {
                sb.AppendLine($" - {h.File} (Complexity: {h.Complexity}, Churn: {h.Churn}, Risk Score: {h.Score})");
            }
        }

        if (telemetry.Dependencies.Count > 0)
        {
            sb.AppendLine("Key Dependencies:");
            foreach (var d in telemetry.Dependencies.Take(25))
            {
                sb.AppendLine($" - [{d.Ecosystem}] {d.Package} ({d.Version})");
            }
        }

        if (telemetry.DeadCode.Count > 0)
        {
            sb.AppendLine($"Dead Code Candidates: {string.Join(", ", telemetry.DeadCode.Take(10))}");
        }

        if (telemetry.SecretAlerts.Count > 0)
        {
            sb.AppendLine($"Secret Alerts Flagged: {string.Join(", ", telemetry.SecretAlerts)}");
        }

        if (!string.IsNullOrWhiteSpace(telemetry.SymbolManifest))
        {
            // Truncate symbol manifest to 8,000 characters to practice context discipline
            var manifestSnippet = telemetry.SymbolManifest.Length > 8000
                ? telemetry.SymbolManifest[..8000] + "\n...[truncated for context discipline]"
                : telemetry.SymbolManifest;

            sb.AppendLine("AST Symbol Manifest (High-level types & methods):");
            sb.AppendLine(manifestSnippet);
        }

        return sb.ToString();
    }

    private static AiInsights ParseGeminiResponse(string rawResponse, string repo, TelemetryData telemetry)
    {
        if (string.IsNullOrWhiteSpace(rawResponse))
        {
            return BuildFallbackInsights(string.Empty, repo, telemetry);
        }

        // Clean any enclosing markdown fences
        var cleaned = JsonFenceStartRegex().Replace(rawResponse.Trim(), string.Empty);
        cleaned = JsonFenceEndRegex().Replace(cleaned, string.Empty).Trim();

        var jsonMatch = JsonBlockRegex().Match(cleaned);
        if (jsonMatch.Success)
        {
            cleaned = jsonMatch.Value;
        }

        try
        {
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            var dto = JsonSerializer.Deserialize<GeminiOutputDto>(cleaned, options);

            if (dto is not null)
            {
                var sanitizedMermaid = MermaidSanitizer.Sanitize(dto.MermaidDiagram, repo);

                return new AiInsights
                {
                    Eli5Summary = string.IsNullOrWhiteSpace(dto.Eli5Summary)
                        ? BuildFallbackEli5(repo, telemetry)
                        : dto.Eli5Summary.Trim(),
                    LicenseVerdict = string.IsNullOrWhiteSpace(dto.LicenseVerdict)
                        ? BuildFallbackLicenseVerdict(telemetry.License)
                        : dto.LicenseVerdict.Trim(),
                    MermaidDiagram = sanitizedMermaid,
                    CodeSmells = string.IsNullOrWhiteSpace(dto.CodeSmells)
                        ? BuildFallbackCodeSmells(telemetry)
                        : dto.CodeSmells.Trim(),
                    OnboardingRunbook = string.IsNullOrWhiteSpace(dto.OnboardingRunbook)
                        ? BuildFallbackOnboardingRunbook(telemetry)
                        : dto.OnboardingRunbook.Trim()
                };
            }
        }
        catch
        {
            // If strict JSON deserialization fails, continue to fallback
        }

        return BuildFallbackInsights(string.Empty, repo, telemetry);
    }

    public static AiInsights BuildFallbackInsights(string owner, string repo, TelemetryData telemetry)
    {
        return new AiInsights
        {
            Eli5Summary = BuildFallbackEli5(repo, telemetry),
            LicenseVerdict = BuildFallbackLicenseVerdict(telemetry.License),
            MermaidDiagram = MermaidSanitizer.BuildFallbackDiagram(repo),
            CodeSmells = BuildFallbackCodeSmells(telemetry),
            OnboardingRunbook = BuildFallbackOnboardingRunbook(telemetry)
        };
    }

    private static string BuildFallbackEli5(string repo, TelemetryData telemetry)
    {
        var primaryLang = telemetry.Languages.Count > 0
            ? telemetry.Languages.OrderByDescending(kv => kv.Value).First().Key
            : "software";

        var safeRepo = string.IsNullOrWhiteSpace(repo) ? "This repository" : repo;

        return $"**{safeRepo}** is a {primaryLang} project with {telemetry.Stars:N0} stars and {telemetry.Forks:N0} forks. " +
               $"It includes {telemetry.Hotspots.Count} identified architectural modules and is maintained under a {telemetry.ReleaseStatus.ToLowerInvariant()} release cadence. " +
               $"CodeLens AI has parsed its deterministic AST symbols and dependencies to assemble this onboarding knowledge base.";
    }

    private static string BuildFallbackLicenseVerdict(string? license)
    {
        if (string.IsNullOrWhiteSpace(license) || license.Equals("Unknown", StringComparison.OrdinalIgnoreCase))
        {
            return "No explicit open-source license detected. Exercise caution before using in commercial or proprietary software without legal verification.";
        }

        var upper = license.ToUpperInvariant();
        if (upper.Contains("MIT") || upper.Contains("APACHE") || upper.Contains("BSD") || upper.Contains("ISC"))
        {
            return $"Permissive commercial use approved ({license}). Commercial distribution, modification, and private usage are fully authorized without copyleft obligations.";
        }

        if (upper.Contains("GPL") || upper.Contains("AGPL"))
        {
            return $"Copyleft license ({license}). Commercial use is allowed, but derivative works and integrated distributions must also be open-sourced under the same license terms.";
        }

        return $"Open-source license detected ({license}). Review specific attribution, patent grant, or copyleft clauses for commercial compliance.";
    }

    private static string BuildFallbackCodeSmells(TelemetryData telemetry)
    {
        var sb = new StringBuilder();
        if (telemetry.Hotspots.Count > 0)
        {
            var top = telemetry.Hotspots.OrderByDescending(h => h.Score).First();
            sb.AppendLine($"- **High-Risk Hotspot:** `{top.File}` exhibits cyclomatic complexity of {top.Complexity} coupled with {top.Churn} recent commit churn (Risk score: {top.Score:F2}). Consider refactoring into smaller, single-responsibility units.");
        }

        if (telemetry.DeadCode.Count > 0)
        {
            sb.AppendLine($"- **Unreferenced Code Candidates:** {telemetry.DeadCode.Count} files or symbol declarations (e.g. `{telemetry.DeadCode[0]}`) appear unreferenced in the main execution path.");
        }

        if (telemetry.SecretAlerts.Count > 0)
        {
            sb.AppendLine($"- ⚠️ **Security Surface:** {telemetry.SecretAlerts.Count} potential credential or secret exposure pattern(s) flagged during static scanning.");
        }
        else
        {
            sb.AppendLine("- **Zero Exposed Secrets:** Clean secret scan surface with zero API keys or credentials detected.");
        }

        if (telemetry.WeeklyCommitsSparkline.Count > 0 && telemetry.WeeklyCommitsSparkline.TakeLast(3).All(c => c == 0))
        {
            sb.AppendLine("- **Commit Cadence Slowdown:** Commit churn has dropped over recent weeks; check maintenance vitality before introducing major dependencies.");
        }

        return sb.ToString().Trim();
    }

    private static string BuildFallbackOnboardingRunbook(TelemetryData telemetry)
    {
        var hasBun = telemetry.Dependencies.Any(d => d.Ecosystem.Contains("Bun", StringComparison.OrdinalIgnoreCase));
        var hasNpm = telemetry.Dependencies.Any(d => d.Ecosystem.Contains("npm", StringComparison.OrdinalIgnoreCase));
        var hasPub = telemetry.Dependencies.Any(d => d.Ecosystem.Contains("Pub", StringComparison.OrdinalIgnoreCase));
        var hasNuGet = telemetry.Dependencies.Any(d => d.Ecosystem.Contains("NuGet", StringComparison.OrdinalIgnoreCase));
        var hasPyPI = telemetry.Dependencies.Any(d => d.Ecosystem.Contains("PyPI", StringComparison.OrdinalIgnoreCase));

        var sb = new StringBuilder();
        sb.AppendLine("1. **Prerequisites & Toolchain:**");

        if (hasBun)
        {
            sb.AppendLine("   - Ensure [Bun](https://bun.sh) (v1.2+) is installed.");
            sb.AppendLine("2. **Dependency Installation:**\n   - Run `bun install` to install dependencies.");
            sb.AppendLine("3. **Development Server:**\n   - Run `bun run dev` to start the application locally.");
            sb.AppendLine("4. **Verification & Testing:**\n   - Run `bun test` or `bun run lint` before committing.");
        }
        else if (hasNuGet)
        {
            sb.AppendLine("   - Ensure .NET 10 SDK (`net10.0`) is installed.");
            sb.AppendLine("2. **Restore & Build:**\n   - Run `dotnet restore` then `dotnet build`.");
            sb.AppendLine("3. **Test Suite:**\n   - Run `dotnet test` to execute xUnit/NUnit test suites.");
            sb.AppendLine("4. **Local Execution:**\n   - Run `dotnet run` on the API or main project entrypoint.");
        }
        else if (hasPub)
        {
            sb.AppendLine("   - Ensure Flutter SDK & Dart runtime are installed.");
            sb.AppendLine("2. **Package Resolution:**\n   - Run `flutter pub get`.");
            sb.AppendLine("3. **Testing:**\n   - Run `flutter test` to verify logic.");
            sb.AppendLine("4. **Launch:**\n   - Run `flutter run` on your selected target device or emulator.");
        }
        else if (hasPyPI)
        {
            sb.AppendLine("   - Ensure Python 3.10+ and `uv` package manager are installed.");
            sb.AppendLine("2. **Environment & Dependencies:**\n   - Run `uv sync` to install virtual environment dependencies.");
            sb.AppendLine("3. **Testing:**\n   - Run `uv run pytest`.");
            sb.AppendLine("4. **Execution:**\n   - Run `uv run python main.py` or the application entrypoint.");
        }
        else
        {
            sb.AppendLine("   - Clone the repository and inspect the root manifests.");
            sb.AppendLine("2. **Dependency Resolution:**\n   - Resolve packages using the primary package manager.");
            sb.AppendLine("3. **Run Tests:**\n   - Execute the project test suite.");
            sb.AppendLine("4. **Start Development:**\n   - Launch the local entrypoint.");
        }

        return sb.ToString().Trim();
    }

    private static string GenerateFallbackChatAnswer(string dossierMarkdown, string userMessage)
    {
        var lower = userMessage.ToLowerInvariant();

        if (lower.Contains("hotspot") || lower.Contains("complexity") || lower.Contains("churn") || lower.Contains("bug"))
        {
            return "Looking at Section 4 (Complexity Heatmap) of the dossier, code risk is calculated as `Cyclomatic Complexity × ln(Churn + 1)`. " +
                   "Files ranked at the top of the table represent the prime hotspots with elevated technical debt and bug susceptibility, requiring priority test coverage and proactive refactoring.";
        }

        if (lower.Contains("license") || lower.Contains("commercial"))
        {
            return "Regarding licensing: Section 2 of the dossier provides the official license verdict. " +
                   "Permissive licenses (e.g. MIT, Apache, BSD) allow commercial utilization and modification without copyleft obligations.";
        }

        if (lower.Contains("architecture") || lower.Contains("diagram") || lower.Contains("structure") || lower.Contains("mermaid"))
        {
            return "Based on the synthesized `PROJECT_KNOWLEDGE.md`, this repository is structured into modular layers. " +
                   "Check Section 3 of the dossier to view the full Mermaid.js architecture diagram, which highlights the client, API, and storage contracts.";
        }

        if (lower.Contains("onboard") || lower.Contains("install") || lower.Contains("setup") || lower.Contains("run") || lower.Contains("build"))
        {
            return "For developer onboarding, Section 9 contains the Day-1 Runbook with prerequisite tools, package restoration commands, and local development setup instructions.";
        }

        if (lower.Contains("dependency") || lower.Contains("package") || lower.Contains("ecosystem") || lower.Contains("library"))
        {
            return "Refer to Section 5 (Dependency & Ecosystem Inventory) for a complete breakdown of all detected packages across Bun, npm, NuGet, Pub, and PyPI ecosystems.";
        }

        if (lower.Contains("secret") || lower.Contains("security") || lower.Contains("credential") || lower.Contains("key"))
        {
            return "Refer to Section 7 (Security & Secret Exposure Surface) for any credentials, private keys, or exposed secrets detected during zero-allocation regex scanning.";
        }

        return $"Based on the repository dossier: The codebase has been analyzed by CodeLens AI with deterministic AST metrics, dependency scanning, and architecture synthesis. " +
               $"To explore further, review the relevant sections in `PROJECT_KNOWLEDGE.md` or ask a specific question about files, dependencies, or architecture.";
    }

    private static IEnumerable<string> ChunkString(string s, int chunkSize)
    {
        for (int i = 0; i < s.Length; i += chunkSize)
        {
            yield return s.Substring(i, Math.Min(chunkSize, s.Length - i));
        }
    }

    private sealed class GeminiOutputDto
    {
        public string? Eli5Summary { get; set; }
        public string? LicenseVerdict { get; set; }
        public string? MermaidDiagram { get; set; }
        public string? CodeSmells { get; set; }
        public string? OnboardingRunbook { get; set; }
    }
}
