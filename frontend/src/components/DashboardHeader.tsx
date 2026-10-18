import { BrandLogo } from "./BrandLogo";
import { ThemeToggle } from "./ThemeToggle";
import styles from "./DashboardHeader.module.css";

interface DashboardHeaderProps {
  userName?: string | null;
  userEmail?: string | null;
  avatarUrl?: string | null;
  onSignOut: () => void;
}

export function DashboardHeader({ userName, userEmail, avatarUrl, onSignOut }: DashboardHeaderProps) {
  const displayName = userName || "Developer";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "D";

  return (
    <header className={styles.header}>
      <a href="/" className={styles.brandLink}>
        <div className={styles.brandLogo}>
          <BrandLogo size={22} />
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span className={styles.brandTitle}>
              CodeLens AI
            </span>
            <span className={styles.brandBadge}>
              Console
            </span>
          </div>
          <p className={styles.brandTagline}>
            Architecture Auditor &amp; Onboarding Copilot
          </p>
        </div>
      </a>

      <div className={styles.actionsGroup}>
        {/* Modern Theme Toggle */}
        <ThemeToggle />

        {/* User Profile Avatar & Identity */}
        <div className={styles.userProfile} title={`Signed in as ${displayName} (${userEmail})`}>
          <div className={styles.avatar} aria-hidden="true">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className={styles.avatarImg} />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{displayName}</span>
            {userEmail && <span className={styles.userEmail}>{userEmail}</span>}
          </div>
        </div>

        {/* Improved Sign Out Button */}
        <button
          type="button"
          onClick={onSignOut}
          className={styles.signOutBtn}
          title="Sign out of your account"
          aria-label="Sign out"
        >
          <span>Sign Out</span>
          <svg
            className={styles.signOutIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    </header>
  );
}

export default DashboardHeader;
