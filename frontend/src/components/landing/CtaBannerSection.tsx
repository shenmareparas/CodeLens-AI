import { Link } from "react-router-dom";
import styles from "@/pages/HomePage.module.css";

interface CtaBannerSectionProps {
  isAuthenticated: boolean;
}

export function CtaBannerSection({ isAuthenticated }: CtaBannerSectionProps) {
  return (
    <section
      className={styles.ctaSection}
      aria-label="Get Started with CodeLens AI"
    >
      <div className={styles.ctaBanner}>
        <div className={styles.ctaContentWrapper}>
          <h2 className={`${styles.ctaTitle} cta-title`}>
            Ready to Audit Your Architecture in Seconds?
          </h2>

          <p className={`${styles.ctaSubtitle} cta-subtitle`}>
            Join developers exploring complex codebases with high confidence,
            zero local disk bloat, and deep architectural insights grounded in
            Gemini 3.8 Flash.
          </p>

          <div className={`${styles.ctaActions} cta-actions`}>
            <Link
              to={isAuthenticated ? "/dashboard" : "/auth/signin"}
              className={styles.primaryCta}
              id="bottom-primary-cta"
            >
              <span>
                {isAuthenticated
                  ? "Launch Dashboard"
                  : "Sign In & Get Started Free"}
              </span>
              <span className={styles.ctaArrow} aria-hidden="true">
                →
              </span>
            </Link>

            <a
              href="https://github.com/shenmareparas/CodeLens-AI"
              target="_blank"
              rel="noreferrer"
              className={styles.secondaryCta}
              id="bottom-github-cta"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                />
              </svg>
              <span>Star on GitHub</span>
            </a>
          </div>

          {/* Feature Checkmarks with SVG icons */}
          <div className={styles.ctaPillsRow}>
            <span className={styles.ctaPillItem}>
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                aria-hidden="true"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              In-Memory 0-Disk Ingestion
            </span>
            <span className={styles.ctaPillItem}>
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                aria-hidden="true"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Deterministic Hotspot Math
            </span>
            <span className={styles.ctaPillItem}>
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                aria-hidden="true"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Google Gemini 3.8 Flash Dossiers
            </span>
            <span className={styles.ctaPillItem}>
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                aria-hidden="true"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Interactive C4 Mermaid Canvas
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
