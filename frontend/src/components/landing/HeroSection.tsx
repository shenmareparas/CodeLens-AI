import { Link } from "react-router-dom";
import styles from "@/pages/HomePage.module.css";

interface HeroSectionProps {
  isAuthenticated: boolean;
}

export function HeroSection({ isAuthenticated }: HeroSectionProps) {
  return (
    <section className={styles.hero} aria-label="Hero Introduction">
      {/* Eyebrow Badge */}
      <div className={`${styles.badge} hero-badge`}>
        <span className={styles.badgePulse} aria-hidden="true" />
        <span>Zero-Disk Architecture Auditor & Ingestion Copilot</span>
      </div>

      {/* Main Headline */}
      <h1 className={`${styles.headline} hero-headline`}>
        <span className={styles.headlineLine}>Understand Any Codebase</span>{" "}
        <span className={styles.headlineLine}>
          in Seconds, <span className={styles.gradientText}>Not Weeks.</span>
        </span>
      </h1>

      {/* Subtitle */}
      <p className={`${styles.subtitle} hero-subtitle`}>
        Stream GitHub repositories zero-disk straight into RAM, calculate deterministic
        cyclomatic complexity hotspots, render interactive gesture-driven C4 diagrams, and
        synthesize executive onboarding dossiers powered by Google Gemini 3.8 Flash.
      </p>

      {/* CTA Buttons */}
      <div className={`${styles.heroCtaGroup} hero-cta`}>
        <Link
          to={isAuthenticated ? "/dashboard" : "/auth/signin"}
          className={styles.primaryCta}
          id="hero-primary-cta"
        >
          <span>{isAuthenticated ? "Open Dashboard" : "Get Started Free"}</span>
          <span className={styles.ctaArrow} aria-hidden="true">→</span>
        </Link>
        <a href="#pipeline" className={styles.secondaryCta} id="hero-secondary-cta">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          <span>See How It Works</span>
        </a>
      </div>

      {/* Stats Ribbon */}
      <div className={`${styles.statsRibbon} hero-stats`} role="region" aria-label="Key Performance Metrics">
        <div className={styles.statItem}>
          <div className={`${styles.statNum} stat-counter`} data-target="50">
            &lt; 50ms
          </div>
          <div className={styles.statLabel}>Shared Repo Cache Hit</div>
          <div className={styles.statHint}>Cosmos DB Free Tier</div>
        </div>

        <div className={styles.statDivider} aria-hidden="true" />

        <div className={styles.statItem}>
          <div className={styles.statNum}>0-Disk</div>
          <div className={styles.statLabel}>In-Memory Zip Stream</div>
          <div className={styles.statHint}>Zero git clone bloat</div>
        </div>

        <div className={styles.statDivider} aria-hidden="true" />

        <div className={styles.statItem}>
          <div className={`${styles.statNum} stat-counter`} data-target="7">
            7+
          </div>
          <div className={styles.statLabel}>Polyglot Ecosystems</div>
          <div className={styles.statHint}>Bun, .NET, Dart, Rust +</div>
        </div>

        <div className={styles.statDivider} aria-hidden="true" />

        <div className={styles.statItem}>
          <div className={`${styles.statNum} stat-counter`} data-target="100">
            100%
          </div>
          <div className={styles.statLabel}>Grounded Gemini AI</div>
          <div className={styles.statHint}>Strict AST Symbol Context</div>
        </div>
      </div>
    </section>
  );
}
