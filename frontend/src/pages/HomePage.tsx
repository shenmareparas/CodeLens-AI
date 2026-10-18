import { Link } from "react-router-dom";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import styles from "./HomePage.module.css";

export function HomePage() {
  const { theme, cycleTheme } = useTheme();
  const { isAuthenticated } = useAuth();

  const themeIcon = theme === "system" ? "💻" : theme === "dark" ? "🌙" : "☀️";
  const themeLabel = theme === "system" ? "System" : theme === "dark" ? "Dark" : "Light";

  return (
    <div className={styles.landingContainer}>
      {/* Ambient background glows */}
      <div className={styles.bgGlowTop} aria-hidden="true" />
      <div className={styles.bgGlowMiddle} aria-hidden="true" />
      <div className={styles.bgGlowBottom} aria-hidden="true" />

      {/* Navigation */}
      <header className={styles.nav}>
        <Link to="/" className={styles.brandLink}>
          <div className={styles.brandLogo}>
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="8" y1="11" x2="14" y2="11" />
              <line x1="11" y1="8" x2="11" y2="14" />
            </svg>
          </div>
          <span className={styles.brandText}>CodeLens AI</span>
        </Link>

        <nav className={styles.navLinks} aria-label="Main Navigation">
          <a href="#features" className={styles.navLink}>
            Features
          </a>
          <a href="#preview" className={styles.navLink}>
            Dashboard
          </a>
          <a href="#ecosystem" className={styles.navLink}>
            Ecosystems
          </a>
          <a
            href="https://github.com/shenmareparas/CodeLens-AI"
            target="_blank"
            rel="noreferrer"
            className={styles.navLink}
          >
            GitHub
          </a>
        </nav>

        <div className={styles.navActions}>
          <button
            type="button"
            onClick={cycleTheme}
            className={styles.themeToggle}
            title={`Theme: ${themeLabel} (Click to toggle)`}
          >
            <span>{themeIcon}</span>
            <span>{themeLabel}</span>
          </button>

          {isAuthenticated ? (
            <Link to="/dashboard" className={styles.loginBtn}>
              <span>Open Dashboard</span>
              <span aria-hidden="true">→</span>
            </Link>
          ) : (
            <Link to="/auth/signin" className={styles.loginBtn}>
              <span>Sign In</span>
              <span aria-hidden="true">→</span>
            </Link>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.badge}>
          <span>✨</span>
          <span>Next-Generation Architecture Auditor & Ingestion Copilot</span>
        </div>

        <h1 className={styles.headline}>
          Understand Any Codebase in Seconds,{" "}
          <span className={styles.gradientText}>Not Weeks.</span>
        </h1>

        <p className={styles.subtitle}>
          Stream repositories zero-disk from GitHub, compute deterministic cyclomatic complexity
          hotspots, render interactive C4 diagrams, and synthesize actionable technical dossiers
          with Google Gemini 3.8 Flash.
        </p>

        <div className={styles.heroCtaGroup}>
          <Link to={isAuthenticated ? "/dashboard" : "/auth/signin"} className={styles.primaryCta}>
            <span>{isAuthenticated ? "Go to Dashboard" : "Get Started Free"}</span>
            <span aria-hidden="true">→</span>
          </Link>
          <a href="#features" className={styles.secondaryCta}>
            <span>Explore Architecture</span>
          </a>
        </div>

        {/* Stats Ribbon */}
        <div className={styles.statsRibbon}>
          <div className={styles.statItem}>
            <div className={styles.statNum}>&lt; 50ms</div>
            <div className={styles.statLabel}>Shared Repo Cache Hit</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statNum}>0-Disk</div>
            <div className={styles.statLabel}>In-Memory Zip Stream</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statNum}>7+</div>
            <div className={styles.statLabel}>Polyglot Ecosystems</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statNum}>100%</div>
            <div className={styles.statLabel}>Grounded Gemini AI</div>
          </div>
        </div>
      </section>

      {/* Interactive Mock Dashboard Preview */}
      <section id="preview" className={styles.mockSection}>
        <div className={styles.mockWindow}>
          <div className={styles.mockTitleBar}>
            <span className={`${styles.mockDot} ${styles.mockDotRed}`} />
            <span className={`${styles.mockDot} ${styles.mockDotYellow}`} />
            <span className={`${styles.mockDot} ${styles.mockDotGreen}`} />
            <span className={styles.mockAddress}>
              https://codelens.ai/dashboard/shenmareparas/CodeLens-AI
            </span>
          </div>

          <div className={styles.mockContent}>
            <div className={styles.mockTelemetryCard}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong style={{ fontSize: "1.1rem" }}>Repository Telemetry Bento</strong>
                <span style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", borderRadius: "6px", background: "rgba(16, 185, 129, 0.2)", color: "#10b981", fontWeight: 600 }}>
                  Live Audit
                </span>
              </div>
              <div className={styles.mockMetricRow}>
                <span>Cyclomatic Risk Hotspots</span>
                <strong style={{ color: "#f59e0b" }}>Low Risk (1.42 max)</strong>
              </div>
              <div className={styles.mockMetricRow}>
                <span>Dependencies Analyzed</span>
                <strong>Bun, .NET 10, Roslyn, React 19</strong>
              </div>
              <div className={styles.mockMetricRow}>
                <span>Zero-Allocation Secret Scan</span>
                <strong style={{ color: "#10b981" }}>0 Exposed Keys Clean</strong>
              </div>
              <div className={styles.mockMetricRow}>
                <span>Architecture Diagram</span>
                <strong>Interactive C4 Mermaid Canvas</strong>
              </div>
            </div>

            <div className={styles.mockAiCard}>
              <div className={styles.mockAiHeader}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
                <span>Gemini 3.8 Flash Dossier Copilot</span>
              </div>
              <div className={styles.mockAiBubble}>
                &ldquo;This repository is structured around a Clean Architecture .NET 10 backend on port 5050 and a React 19 Bun SPA. Zero disk cloning was executed; all symbols were parsed dynamically in memory with sub-second commit tracking.&rdquo;
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillars Grid */}
      <section id="features" className={styles.featuresSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionEyebrow}>Core Capabilities</div>
          <h2 className={styles.sectionTitle}>Everything Engineered for Deep Codebase Clarity</h2>
          <p className={styles.sectionDesc}>
            Built from the ground up with high-throughput .NET 10 compilation, Roslyn syntax analysis, and Semantic Kernel.
          </p>
        </div>

        <div className={styles.featureGrid}>
          <div className={styles.featureCard}>
            <div className={styles.iconCircle}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <h3 className={styles.featureCardTitle}>Zero-Disk Ingestion Pipeline</h3>
            <p className={styles.featureCardDesc}>
              Never run local git clones. Repositories are streamed directly into memory via GitHub Zipball API, filtering vendor directories and analyzing AST symbols on the fly.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.iconCircle}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <h3 className={styles.featureCardTitle}>Google Gemini 3.8 Flash Dossiers</h3>
            <p className={styles.featureCardDesc}>
              Passes compact AST symbol manifests and churn telemetry to synthesize technical onboarding dossiers (Architecture smells, ELI5, Runbook, and licenses) with zero context bloat.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.iconCircle}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="m16 12-4-4-4 4M12 8v8" />
              </svg>
            </div>
            <h3 className={styles.featureCardTitle}>Interactive C4 & Gesture Canvas</h3>
            <p className={styles.featureCardDesc}>
              Auto-generates clean Mermaid.js component diagrams. Features native trackpad pinch-to-zoom, two-finger panning, viewport boundaries, and 1-click view reset.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.iconCircle}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h3 className={styles.featureCardTitle}>Zero-Allocation Secret Scanner</h3>
            <p className={styles.featureCardDesc}>
              High-speed compiled regex scanner detects API keys, credentials, and certificates without false positives on dummy templates like .env.example.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.iconCircle}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h3 className={styles.featureCardTitle}>Grounded Real-Time Copilot</h3>
            <p className={styles.featureCardDesc}>
              Slide-over AI copilot drawer grounded strictly in the synthesized PROJECT_KNOWLEDGE.md dossier, answering repo-specific architecture queries via live SSE token streams.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.iconCircle}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </div>
            <h3 className={styles.featureCardTitle}>Shared Cache & 1-Click Refresh</h3>
            <p className={styles.featureCardDesc}>
              Retrieves analyzed repositories instantly in under 50ms from Cosmos DB. Compares latest git commit SHAs to flag staleness with 1-click re-analysis.
            </p>
          </div>
        </div>
      </section>

      {/* Polyglot Ecosystems Section */}
      <section id="ecosystem" className={styles.featuresSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionEyebrow}>Ecosystem Coverage</div>
          <h2 className={styles.sectionTitle}>Deep Polyglot Dependency Parsing</h2>
          <p className={styles.sectionDesc}>
            Accurately parses modern lockfiles, workspace manifests, and sub-dependencies.
          </p>

          <div className={styles.ecosystemRibbon}>
            <span className={styles.ecosystemTag}>⚡ Bun (bun.lock)</span>
            <span className={styles.ecosystemTag}>📦 Node.js (package.json)</span>
            <span className={styles.ecosystemTag}>🎯 Dart & Flutter (pubspec.yaml)</span>
            <span className={styles.ecosystemTag}>🔷 .NET 10 & C# (.csproj)</span>
            <span className={styles.ecosystemTag}>🐍 Python (requirements.txt)</span>
            <span className={styles.ecosystemTag}>🐹 Go (go.mod)</span>
            <span className={styles.ecosystemTag}>🦀 Rust (Cargo.toml)</span>
          </div>
        </div>
      </section>

      {/* CTA Bottom Banner */}
      <section className={styles.ctaBanner}>
        <h2 className={styles.ctaTitle}>Ready to Audit Your Architecture?</h2>
        <p className={styles.ctaSubtitle}>
          Join developers auditing complex codebases with high confidence, zero local disk bloat, and deep AI insight.
        </p>
        <Link to={isAuthenticated ? "/dashboard" : "/auth/signin"} className={styles.primaryCta}>
          <span>{isAuthenticated ? "Launch Dashboard" : "Sign In & Get Started"}</span>
          <span aria-hidden="true">→</span>
        </Link>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <p className={styles.footerCopy}>
            &copy; {new Date().getFullYear()} CodeLens AI. Built with .NET 10, React 19, and Gemini 3.8 Flash.
          </p>
          <div className={styles.footerLinks}>
            <Link to="/auth/signin" className={styles.footerLink}>
              Sign In
            </Link>
            <Link to="/dashboard" className={styles.footerLink}>
              Dashboard
            </Link>
            <a
              href="https://github.com/shenmareparas/CodeLens-AI"
              target="_blank"
              rel="noreferrer"
              className={styles.footerLink}
            >
              GitHub Repository
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
