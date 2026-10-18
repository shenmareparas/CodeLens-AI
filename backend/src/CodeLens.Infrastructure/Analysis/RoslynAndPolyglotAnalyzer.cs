namespace CodeLens.Infrastructure.Analysis;

using CodeLens.Core.DTOs;
using CodeLens.Core.Entities;
using CodeLens.Core.Interfaces;
using CodeLens.Infrastructure.Security;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.Extensions.Logging;
using System.IO.Compression;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Xml.Linq;

/// <summary>
/// High-performance zero-disk code analysis engine extracting AST complexity,
/// hotspot risk scores, dependencies, secret alerts, and symbol manifests.
/// </summary>
public sealed partial class RoslynAndPolyglotAnalyzer : ICodeAnalysisService
{
    private readonly ILogger<RoslynAndPolyglotAnalyzer> _logger;

    public RoslynAndPolyglotAnalyzer(ILogger<RoslynAndPolyglotAnalyzer> logger)
    {
        _logger = logger;
    }

    [GeneratedRegex(@"(?m)^\s*(?:from\s+([a-zA-Z0-9_\.]+)\s+import|import\s+([a-zA-Z0-9_\.]+))", RegexOptions.Compiled)]
    private static partial Regex PythonImportRegex();

    [GeneratedRegex(@"(?m)^\s*import\s+(?:\{[^}]+\}|\*\s+as\s+\w+|\w+)\s+from\s+['""]([^'""]+)['""]", RegexOptions.Compiled)]
    private static partial Regex JsTsImportRegex();

    [GeneratedRegex(@"(?m)^\s*export\s+(?:default\s+)?(?:class|function|const|let|var|interface|type|enum)\s+([a-zA-Z0-9_]+)", RegexOptions.Compiled)]
    private static partial Regex JsTsExportRegex();

    [GeneratedRegex(@"\b(if|elif|else\s+if|while|for|case|switch|catch|except)\b|[?][.]|&&|\|\||\?\?|\?[^:]*:", RegexOptions.Compiled)]
    private static partial Regex PolyglotBranchingRegex();

    private static readonly HashSet<string> ExcludedDirectoryPrefixes = new(StringComparer.OrdinalIgnoreCase)
    {
        "node_modules/",
        ".git/",
        "bin/",
        "obj/",
        "dist/",
        ".next/",
        "vendor/",
        "build/",
        ".idea/",
        ".vscode/",
        ".vs/",
        "target/",
        "out/",
        "coverage/",
        ".gradle/",
        "packages/",
        ".agents/"
    };

    private static readonly HashSet<string> ExcludedBinaryExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".png", ".jpg", ".jpeg", ".gif", ".ico", ".svg", ".webp",
        ".pdf", ".zip", ".tar", ".gz", ".7z", ".rar",
        ".woff", ".woff2", ".ttf", ".eot",
        ".dll", ".exe", ".so", ".dylib", ".class", ".jar",
        ".bin", ".lock", ".lockb", ".sqlite", ".db", ".wasm"
    };

    /// <inheritdoc />
    public Task<CodeAnalysisResult> AnalyzeRepositoryAsync(
        Stream zipStream,
        IReadOnlyDictionary<string, int> fileChurn,
        CancellationToken ct = default)
    {
        _logger.LogInformation("Starting zero-disk polyglot code analysis");

        using var archive = new ZipArchive(zipStream, ZipArchiveMode.Read);

        var hotspots = new List<HotspotEntry>();
        var secretAlerts = new HashSet<string>(StringComparer.Ordinal);
        var dependencies = new List<DependencyEntry>();

        var csharpTrees = new List<(string Path, SyntaxTree Tree)>();
        var csharpDeclaredSymbols = new List<(string Path, string SymbolName, string Kind)>();
        var allReferencedIdentifiers = new HashSet<string>(StringComparer.Ordinal);

        var polyglotExports = new Dictionary<string, List<(string Path, string Name)>>(StringComparer.Ordinal);
        var polyglotImports = new HashSet<string>(StringComparer.Ordinal);

        var manifestBuilder = new StringBuilder();
        var filesAnalyzed = 0;
        var totalLines = 0;

        var repoHasBun = archive.Entries.Any(e =>
            e.Name.Equals("bun.lock", StringComparison.OrdinalIgnoreCase) ||
            e.Name.Equals("bun.lockb", StringComparison.OrdinalIgnoreCase) ||
            e.Name.Equals("bunfig.toml", StringComparison.OrdinalIgnoreCase));

        foreach (var entry in archive.Entries)
        {
            ct.ThrowIfCancellationRequested();

            if (entry.Length == 0 || entry.FullName.EndsWith('/'))
            {
                continue;
            }

            // Strip root archive directory created by GitHub (e.g. owner-repo-sha/...)
            var normalizedFullName = entry.FullName.Replace('\\', '/');
            var firstSlash = normalizedFullName.IndexOf('/');
            var relativePath = firstSlash >= 0 ? normalizedFullName[(firstSlash + 1)..] : normalizedFullName;

            if (string.IsNullOrWhiteSpace(relativePath))
            {
                continue;
            }

            // Exclude directories
            if (ExcludedDirectoryPrefixes.Any(p => relativePath.StartsWith(p, StringComparison.OrdinalIgnoreCase) ||
                                                   relativePath.Contains($"/{p}", StringComparison.OrdinalIgnoreCase)))
            {
                continue;
            }

            var extension = Path.GetExtension(relativePath).ToLowerInvariant();
            var fileName = Path.GetFileName(relativePath);

            // Exclude binary assets (allow bun.lock since it is text JSON in Bun 1.2+)
            if (ExcludedBinaryExtensions.Contains(extension) && !fileName.Equals("bun.lock", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            // Read entry content
            string content;
            using (var reader = new StreamReader(entry.Open(), Encoding.UTF8, detectEncodingFromByteOrderMarks: true, leaveOpen: false))
            {
                content = reader.ReadToEnd();
            }

            filesAnalyzed++;
            var lineCount = content.Split('\n').Length;
            totalLines += lineCount;

            // 1. Secret Scanning
            var fileAlerts = RegexSecretScanner.ScanFile(relativePath, content);
            foreach (var alert in fileAlerts)
            {
                secretAlerts.Add(alert);
            }

            // 2. Dependency Manifest Parsing
            ParseDependencies(relativePath, content, dependencies, repoHasBun);

            // 3. Complexity & AST analysis
            int complexity = 1;

            if (extension == ".cs")
            {
                var syntaxTree = CSharpSyntaxTree.ParseText(content, cancellationToken: ct);
                csharpTrees.Add((relativePath, syntaxTree));

                var walker = new RoslynComplexityAndSymbolWalker(relativePath);
                walker.Visit(syntaxTree.GetRoot(ct));

                complexity = walker.Complexity;

                foreach (var symbol in walker.DeclaredInternalSymbols)
                {
                    csharpDeclaredSymbols.Add((relativePath, symbol.Name, symbol.Kind));
                }

                foreach (var ident in walker.ReferencedIdentifiers)
                {
                    allReferencedIdentifiers.Add(ident);
                }

                if (walker.PublicTypesAndMethods.Count > 0)
                {
                    manifestBuilder.AppendLine($"[{relativePath}]");
                    foreach (var item in walker.PublicTypesAndMethods.Take(10))
                    {
                        manifestBuilder.AppendLine($"  - {item}");
                    }
                }
            }
            else if (IsCodeExtension(extension))
            {
                complexity = CalculatePolyglotComplexity(content);

                // Track JS/TS exports and imports for dead code candidate detection
                if (extension is ".ts" or ".tsx" or ".js" or ".jsx")
                {
                    foreach (Match exp in JsTsExportRegex().Matches(content))
                    {
                        var expName = exp.Groups[1].Value;
                        if (!polyglotExports.TryGetValue(expName, out var list))
                        {
                            list = [];
                            polyglotExports[expName] = list;
                        }
                        list.Add((relativePath, expName));
                    }

                    foreach (Match imp in JsTsImportRegex().Matches(content))
                    {
                        polyglotImports.Add(imp.Groups[1].Value);
                    }
                }
            }

            // 4. Hotspot Risk Score
            if (IsCodeExtension(extension))
            {
                // Match file churn by path or file name
                var churn = MatchChurn(relativePath, fileChurn);
                var riskScore = Math.Round(complexity * Math.Log(churn + 1), 2);

                hotspots.Add(new HotspotEntry
                {
                    File = relativePath,
                    Complexity = complexity,
                    Churn = churn,
                    Score = riskScore
                });
            }
        }

        // 5. Dead Code / Zombie candidate identification
        var deadCodeCandidates = new List<string>();

        // C# unreferenced internal/private symbols
        foreach (var (path, symbolName, kind) in csharpDeclaredSymbols)
        {
            if (!allReferencedIdentifiers.Contains(symbolName) &&
                !IsStandardEntryPoint(symbolName))
            {
                deadCodeCandidates.Add($"Unreferenced {kind} '{symbolName}' in {path}");
            }
        }

        // JS/TS unreferenced exports
        foreach (var (symbolName, occurrences) in polyglotExports)
        {
            if (!allReferencedIdentifiers.Contains(symbolName) &&
                !polyglotImports.Any(imp => imp.EndsWith(symbolName, StringComparison.OrdinalIgnoreCase)) &&
                !IsStandardEntryPoint(symbolName))
            {
                foreach (var (path, _) in occurrences)
                {
                    deadCodeCandidates.Add($"Exported symbol '{symbolName}' with no internal imports in {path}");
                }
            }
        }

        // Top Hotspots ranked descending by RiskScore, then by Complexity
        var topHotspots = hotspots
            .OrderByDescending(h => h.Score)
            .ThenByDescending(h => h.Complexity)
            .Take(25)
            .ToList();

        var distinctDeadCode = deadCodeCandidates.Distinct().Take(20).ToList();
        var distinctDependencies = dependencies
            .GroupBy(d => new { d.Ecosystem, d.Package })
            .Select(g => g.First())
            .OrderBy(d => d.Ecosystem)
            .ThenBy(d => d.Package)
            .ToList();

        var symbolManifest = manifestBuilder.Length > 0
            ? manifestBuilder.ToString()
            : "No public C# symbols extracted.";

        _logger.LogInformation("Analysis completed. Analyzed {Files} files, {Lines} LOC, {Hotspots} hotspots, {Secrets} secret alerts",
            filesAnalyzed, totalLines, topHotspots.Count, secretAlerts.Count);

        return Task.FromResult(new CodeAnalysisResult(
            Hotspots: topHotspots,
            DeadCode: distinctDeadCode,
            SecretAlerts: secretAlerts.ToList(),
            Dependencies: distinctDependencies,
            SymbolManifest: symbolManifest,
            TotalFilesAnalyzed: filesAnalyzed,
            TotalLinesOfCode: totalLines
        ));
    }

    // ── Internal Helpers ─────────────────────────────────────────────────────────

    private static bool IsCodeExtension(string ext) => ext switch
    {
        ".cs" or ".ts" or ".tsx" or ".js" or ".jsx" or
        ".py" or ".go" or ".java" or ".rs" or ".c" or
        ".cpp" or ".h" or ".hpp" or ".rb" or ".php" or
        ".swift" or ".kt" => true,
        _ => false
    };

    private static int MatchChurn(string relativePath, IReadOnlyDictionary<string, int> fileChurn)
    {
        if (fileChurn.TryGetValue(relativePath, out var exact))
        {
            return exact;
        }

        // Check if churn key ends with relativePath or vice versa
        foreach (var (key, value) in fileChurn)
        {
            if (key.EndsWith(relativePath, StringComparison.OrdinalIgnoreCase) ||
                relativePath.EndsWith(key, StringComparison.OrdinalIgnoreCase))
            {
                return value;
            }
        }

        return 0;
    }

    private static int CalculatePolyglotComplexity(string content)
    {
        var matches = PolyglotBranchingRegex().Matches(content);
        return 1 + matches.Count;
    }

    private static bool IsStandardEntryPoint(string name)
    {
        return name is "Main" or "Program" or "Configure" or "ConfigureServices" or
               "Dispose" or "Initialize" or "default" or "App" or "Page" or "Layout" or "metadata";
    }

    private static void ParseDependencies(string relativePath, string content, List<DependencyEntry> dependencies, bool repoHasBun = false)
    {
        var fileName = Path.GetFileName(relativePath);

        // 1. .NET .csproj / Directory.Build.props
        if (fileName.EndsWith(".csproj", StringComparison.OrdinalIgnoreCase) ||
            fileName.Equals("Directory.Build.props", StringComparison.OrdinalIgnoreCase))
        {
            try
            {
                var doc = XDocument.Parse(content);
                var packages = doc.Descendants("PackageReference");
                foreach (var pkg in packages)
                {
                    var include = pkg.Attribute("Include")?.Value ?? pkg.Attribute("Update")?.Value;
                    var version = pkg.Attribute("Version")?.Value ?? pkg.Element("Version")?.Value ?? "Implicit";

                    if (!string.IsNullOrWhiteSpace(include))
                    {
                        dependencies.Add(new DependencyEntry
                        {
                            Ecosystem = "NuGet (.NET)",
                            Package = include,
                            Version = version
                        });
                    }
                }

                var tfm = doc.Descendants("TargetFramework").FirstOrDefault()?.Value;
                if (!string.IsNullOrWhiteSpace(tfm))
                {
                    dependencies.Add(new DependencyEntry
                    {
                        Ecosystem = "Framework",
                        Package = "Target Framework",
                        Version = tfm
                    });
                }
            }
            catch
            {
                // Ignore malformed XML files
            }
        }
        // 2. Node.js / Bun package.json
        else if (fileName.Equals("package.json", StringComparison.OrdinalIgnoreCase))
        {
            try
            {
                var jsonOptions = new JsonDocumentOptions
                {
                    AllowTrailingCommas = true,
                    CommentHandling = JsonCommentHandling.Skip
                };
                using var json = JsonDocument.Parse(content, jsonOptions);
                var root = json.RootElement;

                var isBun = repoHasBun;
                if (root.TryGetProperty("packageManager", out var pm) && pm.ValueKind == JsonValueKind.String)
                {
                    var pmStr = pm.GetString() ?? "";
                    if (pmStr.StartsWith("bun", StringComparison.OrdinalIgnoreCase))
                    {
                        isBun = true;
                    }
                    else if (pmStr.StartsWith("npm", StringComparison.OrdinalIgnoreCase) ||
                             pmStr.StartsWith("pnpm", StringComparison.OrdinalIgnoreCase) ||
                             pmStr.StartsWith("yarn", StringComparison.OrdinalIgnoreCase))
                    {
                        isBun = false;
                    }
                }
                else if (root.TryGetProperty("trustedDependencies", out _))
                {
                    isBun = true;
                }

                var ecosystem = isBun ? "Bun" : "npm";
                var devEcosystem = isBun ? "Bun (dev)" : "npm (dev)";

                ExtractJsonDeps(root, "dependencies", ecosystem, dependencies);
                ExtractJsonDeps(root, "devDependencies", devEcosystem, dependencies);
            }
            catch
            {
                // Ignore malformed JSON
            }
        }
        // 2b. Bun bun.lock (text JSON lockfile in Bun 1.2+)
        else if (fileName.Equals("bun.lock", StringComparison.OrdinalIgnoreCase))
        {
            try
            {
                var jsonOptions = new JsonDocumentOptions
                {
                    AllowTrailingCommas = true,
                    CommentHandling = JsonCommentHandling.Skip
                };
                using var json = JsonDocument.Parse(content, jsonOptions);
                var root = json.RootElement;

                if (root.TryGetProperty("workspaces", out var workspaces) && workspaces.ValueKind == JsonValueKind.Object)
                {
                    foreach (var ws in workspaces.EnumerateObject())
                    {
                        if (ws.Value.ValueKind == JsonValueKind.Object)
                        {
                            ExtractJsonDeps(ws.Value, "dependencies", "Bun", dependencies);
                            ExtractJsonDeps(ws.Value, "devDependencies", "Bun (dev)", dependencies);
                        }
                    }
                }
                else
                {
                    ExtractJsonDeps(root, "dependencies", "Bun", dependencies);
                    ExtractJsonDeps(root, "devDependencies", "Bun (dev)", dependencies);
                }
            }
            catch
            {
                // Ignore malformed JSON
            }
        }
        // 3. Python requirements.txt
        else if (fileName.Equals("requirements.txt", StringComparison.OrdinalIgnoreCase))
        {
            var lines = content.Split('\n');
            foreach (var line in lines)
            {
                var trimmed = line.Trim();
                if (string.IsNullOrWhiteSpace(trimmed) || trimmed.StartsWith('#') || trimmed.StartsWith('-'))
                {
                    continue;
                }

                var parts = trimmed.Split(new[] { "==", ">=", "<=", "~=" }, StringSplitOptions.TrimEntries);
                dependencies.Add(new DependencyEntry
                {
                    Ecosystem = "PyPI (Python)",
                    Package = parts[0],
                    Version = parts.Length > 1 ? parts[1] : "*"
                });
            }
        }
        // 4. Go go.mod
        else if (fileName.Equals("go.mod", StringComparison.OrdinalIgnoreCase))
        {
            var lines = content.Split('\n');
            foreach (var line in lines)
            {
                var trimmed = line.Trim();
                if (trimmed.StartsWith("require (") || trimmed.StartsWith("module ") || trimmed.StartsWith("go "))
                {
                    continue;
                }

                if (trimmed.StartsWith("require "))
                {
                    trimmed = trimmed["require ".Length..].Trim();
                }

                var parts = trimmed.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                if (parts.Length >= 2 && !parts[0].StartsWith("//"))
                {
                    dependencies.Add(new DependencyEntry
                    {
                        Ecosystem = "Go Modules",
                        Package = parts[0],
                        Version = parts[1]
                    });
                }
            }
        }
        // 5. Dart / Flutter pubspec.yaml
        else if (fileName.Equals("pubspec.yaml", StringComparison.OrdinalIgnoreCase))
        {
            var lines = content.Split('\n');
            string? currentSection = null;
            DependencyEntry? currentEntry = null;
            var packageIndent = -1;

            foreach (var rawLine in lines)
            {
                var line = rawLine.TrimEnd('\r').Replace("\t", "  ");
                var commentIdx = line.IndexOf('#');
                if (commentIdx >= 0)
                {
                    line = line[..commentIdx];
                }

                if (string.IsNullOrWhiteSpace(line))
                {
                    continue;
                }

                // Top-level key (no leading indentation)
                if (!char.IsWhiteSpace(line[0]))
                {
                    currentEntry = null;
                    packageIndent = -1;

                    if (line.StartsWith("dependencies:", StringComparison.OrdinalIgnoreCase))
                    {
                        currentSection = "dependencies";
                    }
                    else if (line.StartsWith("dev_dependencies:", StringComparison.OrdinalIgnoreCase))
                    {
                        currentSection = "dev_dependencies";
                    }
                    else if (line.StartsWith("dependency_overrides:", StringComparison.OrdinalIgnoreCase))
                    {
                        currentSection = "dependency_overrides";
                    }
                    else
                    {
                        currentSection = null;
                    }
                    continue;
                }

                if (currentSection is "dependencies" or "dev_dependencies" or "dependency_overrides")
                {
                    var ecosystem = currentSection switch
                    {
                        "dev_dependencies" => "Pub (dev)",
                        "dependency_overrides" => "Pub (override)",
                        _ => "Pub"
                    };

                    var trimmed = line.TrimStart();
                    var leadingSpaces = line.Length - trimmed.Length;

                    if (packageIndent == -1)
                    {
                        packageIndent = leadingSpaces;
                    }

                    // 1. Sub-property of the current package (indented deeper than package name)
                    if (currentEntry != null && leadingSpaces > packageIndent)
                    {
                        if (trimmed.StartsWith("sdk:", StringComparison.OrdinalIgnoreCase))
                        {
                            var sdkVal = trimmed["sdk:".Length..].Trim().Trim('\'', '"');
                            currentEntry.Version = $"sdk: {sdkVal}";
                        }
                        else if (trimmed.StartsWith("version:", StringComparison.OrdinalIgnoreCase))
                        {
                            var verVal = trimmed["version:".Length..].Trim().Trim('\'', '"');
                            if (!string.IsNullOrWhiteSpace(verVal))
                            {
                                currentEntry.Version = verVal;
                            }
                        }
                        else if (trimmed.StartsWith("git:", StringComparison.OrdinalIgnoreCase) && currentEntry.Version == "*")
                        {
                            currentEntry.Version = "git";
                        }
                        else if (trimmed.StartsWith("path:", StringComparison.OrdinalIgnoreCase) && currentEntry.Version == "*")
                        {
                            currentEntry.Version = "path";
                        }
                    }
                    // 2. Direct package declaration (at packageIndent level)
                    else if (leadingSpaces == packageIndent && trimmed.Contains(':'))
                    {
                        var colonIdx = trimmed.IndexOf(':');
                        var pkgName = trimmed[..colonIdx].Trim();
                        var versionPart = trimmed[(colonIdx + 1)..].Trim().Trim('\'', '"');

                        if (!string.IsNullOrWhiteSpace(pkgName))
                        {
                            string version;
                            if (versionPart.StartsWith('{') && versionPart.EndsWith('}'))
                            {
                                var inner = versionPart.Trim('{', '}').Trim();
                                version = inner;
                            }
                            else
                            {
                                version = string.IsNullOrWhiteSpace(versionPart) ? "*" : versionPart;
                            }

                            currentEntry = new DependencyEntry
                            {
                                Ecosystem = ecosystem,
                                Package = pkgName,
                                Version = version
                            };
                            dependencies.Add(currentEntry);
                        }
                    }
                }
            }
        }
        // 6. Rust Cargo.toml
        else if (fileName.Equals("Cargo.toml", StringComparison.OrdinalIgnoreCase))
        {
            var lines = content.Split('\n');
            string? currentSection = null;

            foreach (var rawLine in lines)
            {
                var line = rawLine.TrimEnd('\r');
                var commentIdx = line.IndexOf('#');
                if (commentIdx >= 0)
                {
                    line = line[..commentIdx];
                }

                var trimmed = line.Trim();
                if (string.IsNullOrWhiteSpace(trimmed))
                {
                    continue;
                }

                if (trimmed.StartsWith('[') && trimmed.EndsWith(']'))
                {
                    var sectionName = trimmed.Trim('[', ']').Trim();
                    if (sectionName.Equals("dependencies", StringComparison.OrdinalIgnoreCase))
                    {
                        currentSection = "dependencies";
                    }
                    else if (sectionName.Equals("dev-dependencies", StringComparison.OrdinalIgnoreCase))
                    {
                        currentSection = "dev-dependencies";
                    }
                    else
                    {
                        currentSection = null;
                    }
                    continue;
                }

                if (currentSection is "dependencies" or "dev-dependencies" && trimmed.Contains('='))
                {
                    var isDev = currentSection == "dev-dependencies";
                    var ecosystem = isDev ? "Cargo (dev)" : "Cargo";

                    var eqIdx = trimmed.IndexOf('=');
                    var pkgName = trimmed[..eqIdx].Trim();
                    var valPart = trimmed[(eqIdx + 1)..].Trim();

                    string version = "*";
                    if (valPart.StartsWith('"') || valPart.StartsWith('\''))
                    {
                        version = valPart.Trim('"', '\'');
                    }
                    else if (valPart.Contains("version"))
                    {
                        var vIdx = valPart.IndexOf("version", StringComparison.OrdinalIgnoreCase);
                        var sub = valPart[vIdx..];
                        var subEq = sub.IndexOf('=');
                        if (subEq >= 0)
                        {
                            var afterEq = sub[(subEq + 1)..].Trim().Trim(',', '}', ' ', '"', '\'');
                            var endQuote = afterEq.IndexOfAny(new[] { '"', '\'', ',', '}' });
                            version = endQuote > 0 ? afterEq[..endQuote].Trim() : afterEq;
                        }
                    }

                    if (!string.IsNullOrWhiteSpace(pkgName))
                    {
                        dependencies.Add(new DependencyEntry
                        {
                            Ecosystem = ecosystem,
                            Package = pkgName,
                            Version = version
                        });
                    }
                }
            }
        }
    }

    private static void ExtractJsonDeps(JsonElement parent, string propName, string ecosystem, List<DependencyEntry> dependencies)
    {
        if (parent.TryGetProperty(propName, out var deps) && deps.ValueKind == JsonValueKind.Object)
        {
            foreach (var prop in deps.EnumerateObject())
            {
                dependencies.Add(new DependencyEntry
                {
                    Ecosystem = ecosystem,
                    Package = prop.Name,
                    Version = prop.Value.GetString() ?? "*"
                });
            }
        }
    }
}

/// <summary>
/// Roslyn AST walker calculating cyclomatic complexity and indexing declarations & usages.
/// </summary>
internal sealed class RoslynComplexityAndSymbolWalker : CSharpSyntaxWalker
{
    private readonly string _filePath;

    public int Complexity { get; private set; } = 1;
    public List<(string Name, string Kind)> DeclaredInternalSymbols { get; } = [];
    public HashSet<string> ReferencedIdentifiers { get; } = new(StringComparer.Ordinal);
    public List<string> PublicTypesAndMethods { get; } = [];

    public RoslynComplexityAndSymbolWalker(string filePath)
    {
        _filePath = filePath;
    }

    public override void VisitIfStatement(IfStatementSyntax node)
    {
        Complexity++;
        base.VisitIfStatement(node);
    }

    public override void VisitWhileStatement(WhileStatementSyntax node)
    {
        Complexity++;
        base.VisitWhileStatement(node);
    }

    public override void VisitForStatement(ForStatementSyntax node)
    {
        Complexity++;
        base.VisitForStatement(node);
    }

    public override void VisitForEachStatement(ForEachStatementSyntax node)
    {
        Complexity++;
        base.VisitForEachStatement(node);
    }

    public override void VisitCaseSwitchLabel(CaseSwitchLabelSyntax node)
    {
        Complexity++;
        base.VisitCaseSwitchLabel(node);
    }

    public override void VisitSwitchExpressionArm(SwitchExpressionArmSyntax node)
    {
        if (node.Pattern is not DiscardPatternSyntax)
        {
            Complexity++;
        }
        base.VisitSwitchExpressionArm(node);
    }

    public override void VisitCatchClause(CatchClauseSyntax node)
    {
        Complexity++;
        base.VisitCatchClause(node);
    }

    public override void VisitConditionalExpression(ConditionalExpressionSyntax node)
    {
        Complexity++;
        base.VisitConditionalExpression(node);
    }

    public override void VisitBinaryExpression(BinaryExpressionSyntax node)
    {
        if (node.IsKind(SyntaxKind.LogicalAndExpression) ||
            node.IsKind(SyntaxKind.LogicalOrExpression) ||
            node.IsKind(SyntaxKind.CoalesceExpression))
        {
            Complexity++;
        }
        base.VisitBinaryExpression(node);
    }

    public override void VisitBinaryPattern(BinaryPatternSyntax node)
    {
        Complexity++;
        base.VisitBinaryPattern(node);
    }

    public override void VisitClassDeclaration(ClassDeclarationSyntax node)
    {
        IndexTypeDeclaration(node.Identifier.Text, "class", node.Modifiers);
        base.VisitClassDeclaration(node);
    }

    public override void VisitInterfaceDeclaration(InterfaceDeclarationSyntax node)
    {
        IndexTypeDeclaration(node.Identifier.Text, "interface", node.Modifiers);
        base.VisitInterfaceDeclaration(node);
    }

    public override void VisitRecordDeclaration(RecordDeclarationSyntax node)
    {
        IndexTypeDeclaration(node.Identifier.Text, "record", node.Modifiers);
        base.VisitRecordDeclaration(node);
    }

    public override void VisitMethodDeclaration(MethodDeclarationSyntax node)
    {
        var isPublic = node.Modifiers.Any(SyntaxKind.PublicKeyword);
        var isInternalOrPrivate = node.Modifiers.Any(SyntaxKind.InternalKeyword) || node.Modifiers.Any(SyntaxKind.PrivateKeyword);

        if (isPublic)
        {
            PublicTypesAndMethods.Add($"Method: {node.Identifier.Text}({string.Join(", ", node.ParameterList.Parameters.Select(p => p.Type?.ToString() ?? "var"))})");
        }
        else if (isInternalOrPrivate)
        {
            DeclaredInternalSymbols.Add((node.Identifier.Text, "method"));
        }

        base.VisitMethodDeclaration(node);
    }

    public override void VisitIdentifierName(IdentifierNameSyntax node)
    {
        ReferencedIdentifiers.Add(node.Identifier.Text);
        base.VisitIdentifierName(node);
    }

    private void IndexTypeDeclaration(string name, string kind, SyntaxTokenList modifiers)
    {
        var isPublic = modifiers.Any(SyntaxKind.PublicKeyword);
        var isInternal = modifiers.Any(SyntaxKind.InternalKeyword) || modifiers.Any(SyntaxKind.PrivateKeyword);

        if (isPublic)
        {
            PublicTypesAndMethods.Add($"{kind.ToUpperInvariant()}: {name}");
        }
        else if (isInternal)
        {
            DeclaredInternalSymbols.Add((name, kind));
        }
    }
}
