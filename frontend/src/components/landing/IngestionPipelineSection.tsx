import styles from "@/pages/HomePage.module.css";

interface ArchitectureStage {
  id: string;
  name: string;
  runtimeSpec: string;
  desc: string;
  artifact: string;
  badge: string;
  renderIcon: () => React.JSX.Element;
}

function StreamIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
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

function AstIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
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

function MathIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
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

function GeminiIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
    </svg>
  );
}

const ARCHITECTURE_STAGES: ArchitectureStage[] = [
  {
    id: "stream",
    name: "Memory Streaming",
    runtimeSpec: "System.IO.ZipArchive",
    desc: "Streams repo archives directly into RAM via GitHub's Zipball API. Non-source files, vendor folders, and binaries are dynamically stripped on the fly—zero local clone.",
    artifact: "System.IO.ZipArchive",
    badge: "0 MB Disk Footprint",
    renderIcon: () => <StreamIcon />,
  },
  {
    id: "ast",
    name: "Polyglot Syntax Walk",
    runtimeSpec: "Roslyn AST + Multi-Manifest",
    desc: "Traverses syntax trees with Microsoft Roslyn for C# while concurrently extracting dependency manifests across Bun, Flutter, Python, Go, and Rust ecosystems.",
    artifact: "AST Symbol Manifest",
    badge: "Sub-Second Traversal",
    renderIcon: () => <AstIcon />,
  },
  {
    id: "hotspot",
    name: "Hotspot Risk Scoring",
    runtimeSpec: "Complexity × ln(Churn + 1)",
    desc: "Calculates file risk scores objectively as Cyclomatic Complexity × ln(Churn + 1), pinpointing volatile maintenance hotspots where frequent commits meet deep branching.",
    artifact: "Deterministic Risk Map",
    badge: "Deterministic Math",
    renderIcon: () => <MathIcon />,
  },
  {
    id: "synthesis",
    name: "AI Technical Dossier",
    runtimeSpec: "Gemini 3.8 Flash + SK",
    desc: "Transfers the compact AST symbol manifest to Google Gemini 3.8 Flash, generating interactive C4 diagrams, architectural smells, and cached dossiers.",
    artifact: "PROJECT_KNOWLEDGE.md",
    badge: "Instant <50ms Recall",
    renderIcon: () => <GeminiIcon />,
  },
];

export function IngestionPipelineSection() {
  return (
    <section
      id="pipeline"
      className={styles.pipelineSection}
      aria-label="Architecture Pipeline"
    >
      {/* Section Header */}
      <div className={styles.sectionHeader}>
        <h2 className={`${styles.sectionTitle} pipeline-title`}>
          The Zero-Clone Engine
        </h2>
        <p className={`${styles.sectionDesc} pipeline-desc`}>
          From raw GitHub repository to complete architectural intelligence in
          four memory-only phases.
        </p>
      </div>

      {/* Unified Architecture Grid */}
      <div className={styles.pipelineConsole} data-ui="true">
        <div className={styles.pipelineGrid}>
          {ARCHITECTURE_STAGES.map((item) => (
            <div
              key={item.id}
              className={`${styles.pipelineCard} pipeline-step-card`}
            >
              {/* Clean Stage Header */}
              <div className={styles.pipelineCardHeader}>
                <div className={styles.pipelineIcon}>{item.renderIcon()}</div>
                <span className={styles.pipelineRuntimeSpec}>
                  {item.runtimeSpec}
                </span>
              </div>

              {/* Stage Title & Description */}
              <h3 className={styles.pipelineCardTitle}>{item.name}</h3>
              <p className={styles.pipelineCardDesc}>{item.desc}</p>

              {/* Engine Artifact & Signal Badge */}
              <div className={styles.pipelineFooter}>
                <div className={styles.pipelineArtifactTag}>
                  <code>{item.artifact}</code>
                </div>

                <div className={styles.pipelineMetric}>
                  <span>{item.badge}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
