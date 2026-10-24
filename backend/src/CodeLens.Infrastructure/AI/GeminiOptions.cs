namespace CodeLens.Infrastructure.AI;

/// <summary>
/// Configuration options for Google Gemini 3.8 Flash inference and Semantic Kernel.
/// </summary>
public sealed class GeminiOptions
{
    /// <summary>
    /// Google AI Studio API key.
    /// Can also be supplied via the GEMINI_API_KEY environment variable.
    /// </summary>
    public string ApiKey { get; set; } = string.Empty;

    /// <summary>
    /// AI model identifier. Defaults strictly to "gemini-3.8-flash".
    /// </summary>
    public string ModelId { get; set; } = "gemini-3.8-flash";

    /// <summary>
    /// Sampling temperature (0.0 to 1.0).
    /// </summary>
    public double Temperature { get; set; } = 0.2;

    /// <summary>
    /// Maximum response tokens.
    /// </summary>
    public int MaxTokens { get; set; } = 4096;

    /// <summary>
    /// HTTP client timeout in seconds for Gemini API calls. Defaults to 30 seconds.
    /// Prevents hanging the analysis pipeline when Google Gemini API experiences high demand or temporary outages.
    /// </summary>
    public int TimeoutSeconds { get; set; } = 30;

    /// <summary>
    /// Reasoning effort / thinking level for Gemini 3 series models ("minimal", "low", "medium", "high").
    /// Defaults strictly to "low" to minimize latency, reduce token consumption, and eliminate prolonged reasoning timeouts.
    /// </summary>
    public string ThinkingLevel { get; set; } = "low";
}
