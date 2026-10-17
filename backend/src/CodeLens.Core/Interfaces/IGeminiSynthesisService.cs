namespace CodeLens.Core.Interfaces;

using CodeLens.Core.Entities;

/// <summary>
/// Service contract for Gemini 3.8 Flash synthesis and grounded chat copilot.
/// </summary>
public interface IGeminiSynthesisService
{
    /// <summary>
    /// Synthesizes high-level architectural insights (ELI5 summary, License commercial verdict,
    /// Mermaid C4/component architecture diagram, architectural code smells, and developer onboarding runbook)
    /// from deterministic telemetry and the compact AST symbol manifest.
    /// </summary>
    Task<AiInsights> SynthesizeRepositoryAsync(
        string owner,
        string repo,
        TelemetryData telemetry,
        CancellationToken ct = default);

    /// <summary>
    /// Streams tokens for grounded repository chat using the compiled PROJECT_KNOWLEDGE.md
    /// as system context.
    /// </summary>
    IAsyncEnumerable<string> StreamChatResponseAsync(
        string dossierMarkdown,
        IReadOnlyList<ChatMessageDocument> chatHistory,
        string userMessage,
        CancellationToken ct = default);
}
