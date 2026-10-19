import styles from "@/pages/HomePage.module.css";

export function BentoFeaturesSection() {
  return (
    <section id="features" className={styles.featuresSection} aria-label="Core Capabilities">
      <div className={styles.sectionHeader}>
        <div className={`${styles.sectionEyebrow} bento-eyebrow`}>CORE CAPABILITIES</div>
        <h2 className={`${styles.sectionTitle} bento-title`}>
          Engineered for Deep Codebase Clarity
        </h2>
        <p className={`${styles.sectionDesc} bento-desc`}>
          Built from the ground up with high-throughput .NET 10 compilation, Roslyn syntax analysis,
          and Google Gemini 3.8 Flash.
        </p>
      </div>

      <div className={styles.bentoGrid}>
        {/* Card 1: Deterministic Cyclomatic Hotspots */}
        <div className={`${styles.bentoCard} bento-feature-card`}>
          <div className={styles.iconCircle}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
          </div>
          <h3 className={styles.bentoCardTitle}>Deterministic Cyclomatic Hotspots</h3>
          <p className={styles.bentoCardDesc}>
            Eliminates subjective AI guesswork. Hotspot risk scores are computed deterministically
            by combining Roslyn cyclomatic branching with git commit churn:
            <code> Risk = CC × ln(Churn + 1)</code>.
          </p>
          <div className={styles.cardStatBadge}>
            <span>Deterministic Mathematical Score</span>
          </div>
        </div>

        {/* Card 2: Zero-Disk Ingestion Pipeline */}
        <div className={`${styles.bentoCard} bento-feature-card`}>
          <div className={styles.iconCircle}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <h3 className={styles.bentoCardTitle}>Zero-Disk Streaming Ingestion</h3>
          <p className={styles.bentoCardDesc}>
            Never run local git clones. Repositories stream directly into RAM via GitHub Zipball API,
            automatically stripping vendor directories (node_modules, bin, obj, dist) to keep container memory tiny.
          </p>
          <div className={styles.cardStatBadge}>
            <span>0 KB Local Disk Footprint</span>
          </div>
        </div>

        {/* Card 3: Google Gemini 3.8 Flash Dossiers */}
        <div className={`${styles.bentoCard} bento-feature-card`}>
          <div className={styles.iconCircle}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <h3 className={styles.bentoCardTitle}>Google Gemini 3.8 Flash Dossiers</h3>
          <p className={styles.bentoCardDesc}>
            Passes compact AST symbol manifests instead of multi-megabyte source dumps. Synthesizes
            comprehensive technical dossiers including architecture smells, ELI5 onboarding, and operational runbooks.
          </p>
          <div className={styles.cardStatBadge}>
            <span>Standardized PROJECT_KNOWLEDGE.md</span>
          </div>
        </div>

        {/* Card 4: Gesture-Driven C4 Canvas */}
        <div className={`${styles.bentoCard} bento-feature-card`}>
          <div className={styles.iconCircle}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <path d="m16 12-4-4-4 4M12 8v8" />
            </svg>
          </div>
          <h3 className={styles.bentoCardTitle}>Gesture-Driven C4 Canvas</h3>
          <p className={styles.bentoCardDesc}>
            Auto-generates clean Mermaid.js component diagrams. Features native trackpad pinch-to-zoom,
            two-finger panning, viewport pan boundaries, and 1-click view reset with clamped 100% minimum zoom.
          </p>
          <div className={styles.cardStatBadge}>
            <span>Pinch-to-Zoom & Pan Clamping</span>
          </div>
        </div>

        {/* Card 5: Zero-Allocation Secret Scanner */}
        <div className={`${styles.bentoCard} bento-feature-card`}>
          <div className={styles.iconCircle}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h3 className={styles.bentoCardTitle}>Zero-Allocation Secret Scanner</h3>
          <p className={styles.bentoCardDesc}>
            .NET 10 compile-time [GeneratedRegex] scanner searches source files for API keys and tokens.
            Intelligently ignores benign dummy templates like .env.example to prevent false-positive alert fatigue.
          </p>
          <div className={styles.cardStatBadge}>
            <span>Zero GC Allocation Overhead</span>
          </div>
        </div>

        {/* Card 6: Sub-50ms Shared Cache & Re-analysis */}
        <div className={`${styles.bentoCard} bento-feature-card`}>
          <div className={styles.iconCircle}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h3 className={styles.bentoCardTitle}>Sub-50ms Shared Cache & Staleness</h3>
          <p className={styles.bentoCardDesc}>
            Returns cached audit telemetry instantly in under 50ms from Cosmos DB Free Tier. Inspects remote
            commit SHAs to detect new remote code pushes and provides 1-click re-analysis triggers.
          </p>
          <div className={styles.cardStatBadge}>
            <span>1-Click Commit Staleness Refresh</span>
          </div>
        </div>
      </div>
    </section>
  );
}
