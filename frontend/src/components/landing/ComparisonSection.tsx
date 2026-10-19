import styles from "@/pages/HomePage.module.css";

const COMPARISONS = [
  {
    dimension: "Repository Ingestion",
    legacy: "Local git clone dumps 100s of MBs to disk, pulling node_modules and binary assets.",
    codelens: "Zero-disk in-memory streaming via GitHub Zipball API straight into RAM buffers.",
    advantage: "100% In-Memory",
  },
  {
    dimension: "Hotspot Scoring",
    legacy: "Opaque line-counting or subjective LLM guesses with zero verifiable evidence.",
    codelens: "Deterministic formula: Risk = Math.Round(CC * Math.Log(Churn + 1), 2) via Roslyn AST.",
    advantage: "Mathematical Precision",
  },
  {
    dimension: "AI Grounding & Context",
    legacy: "Dumps raw multi-megabyte source files into prompt, hitting token limits and hallucinating.",
    codelens: "Distills compact AST Symbol Manifests with Gemini 3.8 Flash via Semantic Kernel.",
    advantage: "Zero Context Bloat",
  },
  {
    dimension: "Architecture Diagrams",
    legacy: "Stale static PNG diagrams manually updated in Confluence or draw.io once a year.",
    codelens: "Auto-generated Mermaid C4 canvas with native trackpad pinch-to-zoom and two-finger pan.",
    advantage: "Live & Interactive",
  },
  {
    dimension: "Copilot Grounding",
    legacy: "Generic chat bot ungrounded in repo structure, prone to fabricating endpoints.",
    codelens: "Real-time SSE token stream strictly grounded on synthesized PROJECT_KNOWLEDGE.md.",
    advantage: "Strictly Grounded",
  },
  {
    dimension: "Cloud Infrastructure",
    legacy: "Expensive always-on VMs and heavy worker clusters charging high idle fees.",
    codelens: "Scale-to-zero Azure Container Apps + Cosmos DB Lifetime Free Tier (0 idle cost).",
    advantage: "Zero Idle Bill",
  },
];

export function ComparisonSection() {
  return (
    <section id="comparison" className={styles.comparisonSection} aria-label="Why CodeLens AI">
      <div className={styles.sectionHeader}>
        <div className={`${styles.sectionEyebrow} comp-eyebrow`}>THE PARADIGM SHIFT</div>
        <h2 className={`${styles.sectionTitle} comp-title`}>
          Why Modern Teams Switch to CodeLens AI
        </h2>
        <p className={`${styles.sectionDesc} comp-desc`}>
          Say goodbye to sluggish local cloning, context-bloated AI prompts, and unverified architectural assumptions.
        </p>
      </div>

      <div className={styles.comparisonTableWrapper}>
        <div className={styles.comparisonGrid}>
          {/* Header Row */}
          <div className={styles.comparisonHeaderRow}>
            <div className={styles.compColDimension}>Capability</div>
            <div className={styles.compColLegacy}>Traditional Code Audits</div>
            <div className={styles.compColCodeLens}>
              <span>CodeLens AI</span>
            </div>
          </div>

          {/* Rows */}
          {COMPARISONS.map((row) => (
            <div key={row.dimension} className={`${styles.comparisonRow} comp-row`}>
              <div className={styles.compColDimension}>
                <strong>{row.dimension}</strong>
                <span className={styles.compAdvantageBadge}>{row.advantage}</span>
              </div>

              <div className={styles.compColLegacy}>
                <span className={styles.compCrossIcon} aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </span>
                <span className={styles.compTextMuted}>{row.legacy}</span>
              </div>

              <div className={styles.compColCodeLens}>
                <span className={styles.compCheckIcon} aria-hidden="true">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <span className={styles.compTextHighlight}>{row.codelens}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
