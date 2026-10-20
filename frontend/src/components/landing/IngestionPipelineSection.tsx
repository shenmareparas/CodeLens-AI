import styles from "@/pages/HomePage.module.css";

interface PipelineStep {
  step: string;
  tag: string;
  title: string;
  subtitle: string;
  desc: string;
  badge: string;
  accentGradient: string;
  accentColor: string;
  highlights: string[];
  renderIcon: (color: string) => React.JSX.Element;
}

function StreamIcon({ color }: { color: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function AstIcon({ color }: { color: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function MathIcon({ color }: { color: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
      <path d="M4 20h16" />
    </svg>
  );
}

function GeminiIcon({ color }: { color: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
    </svg>
  );
}

function CheckIcon({ size = 14, color = "#10b981" }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

const PIPELINE_STEPS: PipelineStep[] = [
  {
    step: "01",
    tag: "INGESTION ENGINE",
    title: "Zero-Disk In-Memory Stream",
    subtitle: "Octokit Zipball API ➔ RAM ZipArchive",
    desc: "Never executes local git clone. Repositories stream directly into system RAM via GitHub Zipball API. Non-source files, binary assets, and bloated vendor directories (node_modules, bin, obj, dist, .git) are stripped dynamically on stream iteration.",
    badge: "0 MB Disk Used",
    accentGradient: "linear-gradient(135deg, #0ea5e9, #38bdf8)",
    accentColor: "#38bdf8",
    highlights: [
      "Direct RAM decompression via GitHub Zipball stream",
      "Dynamic filtering strips vendor, build & binary folders",
      "Zero disk I/O bottlenecks with immediate garbage collection",
    ],
    renderIcon: (color) => <StreamIcon color={color} />,
  },
  {
    step: "02",
    tag: "STATIC AST PARSING",
    title: "Roslyn & Polyglot Graph Parsing",
    subtitle: "C# Syntax Trees & 7+ Manifest Analyzers",
    desc: "Traverses syntax trees with Microsoft Roslyn to measure cyclomatic branching, method nesting, and interface implementations. Concurrently parses Bun (bun.lock text format), Flutter (pubspec.yaml), .NET (.csproj), Python, Go, and Rust.",
    badge: "Sub-Second Traversal",
    accentGradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    accentColor: "#818cf8",
    highlights: [
      "Microsoft Roslyn AST walker measures nesting & branching",
      "Polyglot lockfile & manifest parsers for 7+ modern ecosystems",
      "Produces compact, high-signal AST Symbol Manifest for AI",
    ],
    renderIcon: (color) => <AstIcon color={color} />,
  },
  {
    step: "03",
    tag: "ALGORITHMIC RISK ENGINE",
    title: "Deterministic Hotspot Scoring",
    subtitle: "Cyclomatic Complexity × Logarithmic Churn",
    desc: "Eliminates vague AI guesses. Hotspot risk scores are computed deterministically as Risk = Math.Round(CyclomaticComplexity * Math.Log(ChurnCount + 1), 2), highlighting volatile files that pose genuine regression hazards.",
    badge: "Deterministic Math",
    accentGradient: "linear-gradient(135deg, #10b981, #34d399)",
    accentColor: "#34d399",
    highlights: [
      "Formula: Math.Round(Complexity × Math.Log(Churn + 1), 2)",
      "Combines code branching with all-time Git churn frequency",
      "Highlights volatile regression targets with zero hallucination",
    ],
    renderIcon: (color) => <MathIcon color={color} />,
  },
  {
    step: "04",
    tag: "AI SYNTHESIS ENGINE",
    title: "Gemini 3.8 Flash Technical Dossier",
    subtitle: "Semantic Kernel ➔ PROJECT_KNOWLEDGE.md",
    desc: "Passes the compact AST Symbol Manifest directly to Google Gemini 3.8 Flash via Microsoft Semantic Kernel. Compiles architectural smells, ELI5 developer onboarding guide, and runbooks into a standardized dossier cached in Cosmos DB.",
    badge: "Zero Context Bloat",
    accentGradient: "linear-gradient(135deg, #f43f5e, #ec4899, #a855f7)",
    accentColor: "#f43f5e",
    highlights: [
      "Zero context bloat: passes AST Symbol Manifest + telemetry",
      "Generates sanitized C4 & architecture Mermaid diagrams",
      "Caches PROJECT_KNOWLEDGE.md in Cosmos DB for <50ms recalls",
    ],
    renderIcon: (color) => <GeminiIcon color={color} />,
  },
];

export function IngestionPipelineSection() {
  return (
    <section id="pipeline" className={styles.pipelineSection} aria-label="Ingestion Pipeline">
      {/* Section Header */}
      <div className={styles.sectionHeader}>
        <div className={`${styles.sectionEyebrow} pipeline-eyebrow`}>HOW IT WORKS</div>
        <h2 className={`${styles.sectionTitle} pipeline-title`}>
          The Zero-Disk Intelligence Pipeline
        </h2>
        <p className={`${styles.sectionDesc} pipeline-desc`}>
          From raw GitHub URL to synthesized architectural dossier in seconds—powered by
          high-throughput .NET 10 compilation, Roslyn syntax analysis, and Google Gemini 3.8 Flash.
        </p>
      </div>

      {/* 2x2 Connected Pipeline Grid */}
      <div className={styles.pipelineGrid}>
        {PIPELINE_STEPS.map((item) => (
          <div
            key={item.step}
            className={`${styles.pipelineCard} pipeline-step-card`}
            style={{ "--accent-gradient": item.accentGradient } as React.CSSProperties}
          >
            {/* Top Accent Gradient Bar */}
            <div
              className={styles.pipelineCardAccent}
              style={{ background: item.accentGradient }}
              aria-hidden="true"
            />

            {/* Step Header */}
            <div className={styles.pipelineCardHeader}>
              <div className={styles.pipelineStepBadge}>
                <span className={styles.pipelineStepIcon}>{item.renderIcon(item.accentColor)}</span>
                <span className={styles.pipelineStepNum} style={{ color: item.accentColor }}>
                  {item.step}
                </span>
              </div>

              <div className={styles.pipelineBadge}>
                <span
                  className={styles.pipelineBadgeDot}
                  style={{ background: item.accentColor, boxShadow: `0 0 8px ${item.accentColor}` }}
                  aria-hidden="true"
                />
                <span>{item.badge}</span>
              </div>
            </div>

            {/* Step Category Tag */}
            <div className={styles.pipelineStepTag} style={{ color: item.accentColor }}>
              {item.tag}
            </div>

            {/* Step Titles */}
            <h3 className={styles.pipelineCardTitle}>{item.title}</h3>
            <div className={styles.pipelineCardSub}>
              <span>{item.subtitle}</span>
            </div>

            {/* Step Description */}
            <p className={styles.pipelineCardDesc}>{item.desc}</p>

            {/* Architectural Highlights List */}
            <ul className={styles.pipelineHighlights} aria-label={`Key guarantees for ${item.title}`}>
              {item.highlights.map((point) => (
                <li key={point} className={styles.pipelineHighlightItem}>
                  <span className={styles.pipelineHighlightIcon}>
                    <CheckIcon size={14} color={item.accentColor} />
                  </span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
