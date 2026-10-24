import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BrandLogo } from "@/components/BrandLogo";
import styles from "./NotFoundPage.module.css";

export function NotFoundPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className={styles.notFoundContainer}>
      {/* Ambient background glows */}
      <div className={styles.bgGlowTop} aria-hidden="true" />
      <div className={styles.bgGlowBottom} aria-hidden="true" />

      {/* Header / Nav */}
      <header className={styles.nav}>
        <Link to="/" className={styles.brandLink}>
          <div className={styles.brandLogo}>
            <BrandLogo size={22} />
          </div>
          <span className={styles.brandText}>CodeLens AI</span>
        </Link>

        <div className={styles.navActions}>
          <ThemeToggle />
        </div>
      </header>

      {/* Main 404 Hero Card */}
      <main className={styles.mainContent}>
        <div className={styles.card}>
          <div className={styles.badge}>
            <span className={styles.statusIndicator} />
            Route Not Resolved
          </div>

          <h1 className={styles.errorCode}>404</h1>
          <h2 className={styles.title}>Lost in the codebase?</h2>
          <p className={styles.description}>
            The repository, route, or architecture page you are looking for does
            not exist or has been moved.
          </p>

          <div className={styles.actionGroup}>
            <Link
              to={isAuthenticated ? "/dashboard" : "/"}
              className={styles.primaryBtn}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <span>
                {isAuthenticated ? "Go to Dashboard" : "Back to Home"}
              </span>
            </Link>

            <button
              type="button"
              onClick={() => navigate(-1)}
              className={styles.secondaryBtn}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span>Go Back</span>
            </button>
          </div>

          <div className={styles.quickNavContainer}>
            <span className={styles.quickNavTitle}>Quick Navigation</span>
            <div className={styles.quickNavLinks}>
              <Link to="/" className={styles.textLink}>
                Home Overview
              </Link>
              <Link to="/auth/signin" className={styles.textLink}>
                {isAuthenticated ? "Switch Account" : "Sign In / Register"}
              </Link>
              <a
                href="https://github.com/shenmareparas/CodeLens-AI"
                target="_blank"
                rel="noreferrer"
                className={styles.textLink}
              >
                GitHub Repository ↗
              </a>
            </div>
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>
          &copy; {new Date().getFullYear()} CodeLens AI &bull; Repository
          Intelligence &amp; Architecture Copilot
        </p>
      </footer>
    </div>
  );
}

export default NotFoundPage;
