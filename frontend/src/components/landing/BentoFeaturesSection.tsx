import styles from "@/pages/HomePage.module.css";

export function BentoFeaturesSection() {
  return (
    <section id="features" className={styles.featuresSection} aria-label="Core Capabilities">
      <div className={styles.sectionHeader}>
        <h2 className={`${styles.sectionTitle} bento-title`}>
          Engineered for Deep Codebase Clarity
        </h2>
        <p className={`${styles.sectionDesc} bento-desc`}>
          Built from the ground up with high-throughput .NET 10 compilation, Roslyn syntax analysis,
          and Google Gemini 3.8 Flash.
        </p>
      </div>

      <div className={styles.bentoGrid}>
        {/* Card 1: Codebase Risk Hotspots */}
        <div className={`${styles.bentoCard} bento-feature-card`}>
          <h3 className={styles.bentoCardTitle}>Codebase Risk Hotspots</h3>
          <p className={styles.bentoCardDesc}>
            Eliminates subjective AI guesswork. Hotspot risk scores are computed deterministically
            by combining Roslyn cyclomatic branching with git commit churn:
            <code> Risk = CC × ln(Churn + 1)</code>.
          </p>
        </div>

        {/* Card 2: Zero-Clone RAM Streaming */}
        <div className={`${styles.bentoCard} bento-feature-card`}>
          <h3 className={styles.bentoCardTitle}>Zero-Clone RAM Streaming</h3>
          <p className={styles.bentoCardDesc}>
            Never run local git clones. Repositories stream directly into RAM via GitHub Zipball API,
            automatically stripping vendor directories (node_modules, bin, obj, dist) to keep memory tiny.
          </p>
        </div>

        {/* Card 3: AI Architecture Dossiers */}
        <div className={`${styles.bentoCard} bento-feature-card`}>
          <h3 className={styles.bentoCardTitle}>AI Architecture Dossiers</h3>
          <p className={styles.bentoCardDesc}>
            Passes compact AST symbol manifests instead of multi-megabyte source dumps. Synthesizes
            comprehensive technical dossiers including architecture smells, onboarding guides, and operational runbooks.
          </p>
        </div>

        {/* Card 4: Interactive System Maps */}
        <div className={`${styles.bentoCard} bento-feature-card`}>
          <h3 className={styles.bentoCardTitle}>Interactive System Maps</h3>
          <p className={styles.bentoCardDesc}>
            Auto-generates clean Mermaid.js component diagrams with native trackpad pinch-to-zoom,
            two-finger panning, viewport boundaries, and 1-click view reset with clamped 100% minimum zoom.
          </p>
        </div>

        {/* Card 5: Automated Secret Detection */}
        <div className={`${styles.bentoCard} bento-feature-card`}>
          <h3 className={styles.bentoCardTitle}>Automated Secret Detection</h3>
          <p className={styles.bentoCardDesc}>
            .NET 10 compile-time [GeneratedRegex] scanner searches source files for API keys and tokens.
            Intelligently ignores benign dummy templates like .env.example to eliminate false-positive alert fatigue.
          </p>
        </div>

        {/* Card 6: Instant Cached Audits */}
        <div className={`${styles.bentoCard} bento-feature-card`}>
          <h3 className={styles.bentoCardTitle}>Instant Cached Audits</h3>
          <p className={styles.bentoCardDesc}>
            Returns cached audit telemetry instantly in under 50ms from Cosmos DB Free Tier. Inspects remote
            commit SHAs to detect new remote code pushes and provides 1-click re-analysis triggers.
          </p>
        </div>
      </div>
    </section>
  );
}
