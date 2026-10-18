import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import styles from "./NotFoundPage.module.css";

export function NotFoundPage() {
  const navigate = useNavigate();
  const { theme, cycleTheme } = useTheme();
  const { isAuthenticated } = useAuth();

  const themeIcon = theme === "system" ? "💻" : theme === "dark" ? "🌙" : "☀️";
  const themeLabel = theme === "system" ? "System" : theme === "dark" ? "Dark" : "Light";

  return (
    <div className={styles.notFoundContainer}>
      {/* Ambient background glows */}
      <div className={styles.bgGlowTop} aria-hidden="true" />
      <div className={styles.bgGlowBottom} aria-hidden="true" />

      {/* Header / Nav */}
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
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="8" y1="11" x2="14" y2="11" />
              <line x1="11" y1="8" x2="11" y2="14" />
            </svg>
          </div>
          <span className={styles.brandText}>CodeLens AI</span>
        </Link>

        <div className={styles.navActions}>
          <button
            type="button"
            onClick={cycleTheme}
            className={styles.themeBtn}
            title={`Current theme: ${themeLabel}. Click to switch.`}
            aria-label={`Toggle theme: currently ${themeLabel}`}
          >
            <span>{themeIcon}</span>
            <span>{themeLabel}</span>
          </button>
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
            The repository, route, or architecture page you are looking for does not exist or has been moved.
          </p>

          <div className={styles.actionGroup}>
            <Link to={isAuthenticated ? "/dashboard" : "/"} className={styles.primaryBtn}>
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
              <span>{isAuthenticated ? "Go to Dashboard" : "Back to Home"}</span>
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
              <Link to="/" className={styles.textLink}>Home Overview</Link>
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
        <p>&copy; {new Date().getFullYear()} CodeLens AI &bull; Repository Intelligence &amp; Architecture Copilot</p>
      </footer>
    </div>
  );
}

export default NotFoundPage;
