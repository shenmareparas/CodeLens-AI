namespace CodeLens.Core.Interfaces;

using CodeLens.Core.DTOs;

/// <summary>
/// Service contract for in-memory AST complexity calculation, hotspot analysis,
/// dependency parsing, and secret scanning across repository archives.
/// </summary>
public interface ICodeAnalysisService
{
    /// <summary>
    /// Analyzes an in-memory zip archive stream of the repository, calculating
    /// cyclomatic complexity, hotspot risk scores based on churn, candidate dead code,
    /// dependencies, and secret exposure surface.
    /// </summary>
    Task<CodeAnalysisResult> AnalyzeRepositoryAsync(
        Stream zipStream,
        IReadOnlyDictionary<string, int> fileChurn,
        CancellationToken ct = default);
}
