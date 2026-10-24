import { BrandLogo } from "@/components/BrandLogo";
import { AnalysisProgressBar } from "@/components/AnalysisProgressBar";
import styles from "./DashboardClient.module.css";

export const SAMPLE_REPOS = [
  "https://github.com/shenmareparas/Chess",
  "https://github.com/shenmareparas/expense_tracker",
  "https://github.com/shenmareparas/play-store-ai-review",
  "https://github.com/shenmareparas/Portfolio_NextJS",
  "https://github.com/shenmareparas/nexu5-music-bot",
];

interface RepoInputFormProps {
  repoUrl: string;
  setRepoUrl: (url: string) => void;
  isLoading: boolean;
  isForceRefresh: boolean;
  statusMessage: string | null;
  error: string | null;
  hasRecentAudits: boolean;
  onAnalyze: (url?: string, forceRefresh?: boolean) => void;
}

export function RepoInputForm({
  repoUrl,
  setRepoUrl,
  isLoading,
  isForceRefresh,
  statusMessage,
  error,
  hasRecentAudits,
  onAnalyze,
}: RepoInputFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAnalyze();
  };

  return (
    <section className={styles.heroSection}>
      <div>
        <span className={styles.heroBadge}>
          <span>⚡</span>
          <span>Zero-Disk Telemetry & Shared Repo Cache</span>
        </span>
        <h2 className={styles.heroTitle}>Scan & Audit GitHub Repository</h2>
        <p className={styles.heroDescription}>
          Extract commit sparklines, release cadence, Roslyn AST cyclomatic
          complexity, hotspot risk scores, dependencies, and sensitive secrets
          in-memory.
        </p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputWrapper}>
          <span className={styles.inputIcon}>
            <BrandLogo size={18} />
          </span>
          <input
            type="text"
            placeholder="https://github.com/owner/repo"
            aria-label="GitHub repository URL"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            disabled={isLoading}
            className={styles.input}
          />
        </div>

        <div className={styles.buttonsGroup}>
          <button
            type="submit"
            disabled={isLoading || !repoUrl.trim()}
            className={styles.submitButton}
          >
            {isLoading ? (
              <>
                <span className={styles.spinner}>🔄</span>
                <span>Analyzing Repository...</span>
              </>
            ) : (
              <>
                <span>⚡</span>
                <span>Analyze Repository</span>
              </>
            )}
          </button>
          <button
            type="button"
            disabled={isLoading || !repoUrl.trim()}
            onClick={() => onAnalyze(repoUrl, true)}
            title="Bypass shared cache and re-analyze the repository from scratch"
            className={styles.reanalyzeButton}
          >
            <span>🔄</span>
            <span>Re-analyze</span>
          </button>
        </div>
      </form>

      {/* Quick Sample Links: Shown prominently when no audits exist, or as quick presets */}
      {(!hasRecentAudits || SAMPLE_REPOS.length > 0) && (
        <div className={styles.sampleReposWrapper}>
          <span className={styles.sampleReposLabel}>
            {hasRecentAudits ? "Sample presets:" : "Quick sample repos:"}
          </span>
          {SAMPLE_REPOS.map((sample) => (
            <button
              key={sample}
              type="button"
              disabled={isLoading}
              onClick={() => {
                setRepoUrl(sample);
                onAnalyze(sample);
              }}
              className={styles.sampleRepoChip}
            >
              {sample.replace("https://github.com/", "")}
            </button>
          ))}
        </div>
      )}

      {/* Progress Bar & Stage Indicator */}
      <AnalysisProgressBar
        isLoading={isLoading}
        isForceRefresh={isForceRefresh}
      />

      {/* Status Message */}
      {statusMessage && !isLoading && (
        <div className={styles.statusMessage}>{statusMessage}</div>
      )}

      {/* Error Message */}
      {error && <div className={styles.errorMessage}>{error}</div>}
    </section>
  );
}
