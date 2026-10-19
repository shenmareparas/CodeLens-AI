import styles from "@/pages/HomePage.module.css";

const PIPELINE_STEPS = [
  {
    step: "01",
    tag: "INGESTION",
    title: "Zero-Disk In-Memory Stream",
    subtitle: "Octokit Zipball API ➔ RAM ZipArchive",
    desc: "Never executes local git clone. Repositories stream directly into memory via GitHub Zipball API. Non-source files, lockfile binaries, and vendor directories (node_modules, bin, obj, dist, .git) are stripped dynamically on stream iteration.",
    badge: "0 MB Disk Used",
    codeSnippet: "using var zipStream = await octokit.GetZipballAsync(owner, repo);\nusing var archive = new ZipArchive(zipStream, ZipArchiveMode.Read);",
  },
  {
    step: "02",
    tag: "STATIC AST",
    title: "Roslyn & Polyglot Graph Parsing",
    subtitle: "C# Syntax Trees & 7+ Manifest Analyzers",
    desc: "Traverses syntax trees with Microsoft Roslyn to measure cyclomatic branching, method nesting, and interface implementations. Concurrently parses Bun (bun.lock text format), Flutter (pubspec.yaml), .NET (.csproj), Python, Go, and Rust.",
    badge: "Sub-Second Traversal",
    codeSnippet: "var syntaxTree = CSharpSyntaxTree.ParseText(sourceCode);\nvar cyclomaticCount = SyntaxWalker.CountControlFlowNodes(syntaxTree);",
  },
  {
    step: "03",
    tag: "MATH FORMULA",
    title: "Deterministic Hotspot Scoring",
    subtitle: "Cyclomatic Complexity × Logarithmic Churn",
    desc: "Eliminates vague AI guesses. Hotspot risk scores are computed deterministically as Risk = Math.Round(CyclomaticComplexity * Math.Log(ChurnCount + 1), 2), highlighting volatile files that pose genuine regression hazards.",
    badge: "Deterministic Math",
    codeSnippet: "double riskScore = Math.Round(\n  cyclomaticComplexity * Math.Log(churnCount + 1), 2\n);",
  },
  {
    step: "04",
    tag: "AI SYNTHESIS",
    title: "Gemini 3.8 Flash Technical Dossier",
    subtitle: "Semantic Kernel ➔ PROJECT_KNOWLEDGE.md",
    desc: "Passes the compact AST Symbol Manifest directly to Google Gemini 3.8 Flash via Microsoft Semantic Kernel. Compiles architectural smells, ELI5 developer onboarding guide, and runbooks into a standardized dossier cached in Cosmos DB.",
    badge: "Zero Context Bloat",
    codeSnippet: "var response = await kernel.InvokeAsync(dossierPlugin,\n  new() { [\"AST_Manifest\"] = astJson, [\"Telemetry\"] = telemetryJson });",
  },
];

export function IngestionPipelineSection() {
  return (
    <section id="pipeline" className={styles.pipelineSection} aria-label="Ingestion Pipeline">
      <div className={styles.sectionHeader}>
        <div className={`${styles.sectionEyebrow} pipeline-eyebrow`}>HOW IT WORKS</div>
        <h2 className={`${styles.sectionTitle} pipeline-title`}>
          The Zero-Disk Intelligence Pipeline
        </h2>
        <p className={`${styles.sectionDesc} pipeline-desc`}>
          From GitHub URL to synthesized architectural dossier in seconds—powered by high-throughput
          .NET 10 compilation, Roslyn syntax analysis, and Google Gemini 3.8 Flash.
        </p>
      </div>

      <div className={styles.pipelineGrid}>
        {PIPELINE_STEPS.map((item, index) => (
          <div key={item.step} className={`${styles.pipelineCard} pipeline-step-card`}>
            {/* Step Header */}
            <div className={styles.pipelineCardHeader}>
              <span className={styles.pipelineStepNum}>{item.step}</span>
              <span className={styles.pipelineStepTag}>{item.tag}</span>
              <span className={styles.pipelineBadge}>{item.badge}</span>
            </div>

            {/* Step Body */}
            <h3 className={styles.pipelineCardTitle}>{item.title}</h3>
            <div className={styles.pipelineCardSub}>{item.subtitle}</div>
            <p className={styles.pipelineCardDesc}>{item.desc}</p>

            {/* Code Snippet Box */}
            <div className={styles.pipelineCodeBox}>
              <div className={styles.pipelineCodeTop}>
                <span className={styles.codeLang}>C# / Roslyn</span>
                <span className={styles.codeStatus}>Live Engine</span>
              </div>
              <pre className={styles.pipelineCodeSnippet}>
                <code>{item.codeSnippet}</code>
              </pre>
            </div>

            {/* Connector Arrow (desktop only) */}
            {index < PIPELINE_STEPS.length - 1 && (
              <div className={styles.pipelineConnector} aria-hidden="true">
                <span className={styles.connectorLine} />
                <span className={styles.connectorDot} />
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
