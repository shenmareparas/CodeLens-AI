import { useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import { CredentialsForm } from "./CredentialsForm";
import styles from "./SignInPage.module.css";

export function SignInPage() {
  const { theme, cycleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");

  const themeIcon = theme === "system" ? "💻" : theme === "dark" ? "🌙" : "☀️";
  const themeLabel = theme === "system" ? "System" : theme === "dark" ? "Dark" : "Light";

  return (
    <div className={styles.container}>
      {/* Top right theme toggle */}
      <div style={{ position: "absolute", top: "1.25rem", right: "1.25rem", zIndex: 20 }}>
        <button
          type="button"
          onClick={cycleTheme}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "0.35rem 0.75rem",
            borderRadius: "9999px",
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text)",
            fontSize: "0.8rem",
            fontWeight: 500,
            cursor: "pointer",
            transition: "background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease",
          }}
          title={`Theme: ${themeLabel} (Click to toggle)`}
        >
          <span>{themeIcon}</span>
          <span>{themeLabel}</span>
        </button>
      </div>

      <div className={styles.card}>
        {/* Brand */}
        <div className={styles.brand}>
          <div className={styles.logoIcon}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="8" y1="11" x2="14" y2="11" />
              <line x1="11" y1="8" x2="11" y2="14" />
            </svg>
          </div>
          <h1 className={styles.title}>CodeLens AI</h1>
          <p className={styles.subtitle}>
            Repository Intelligence, Architecture Auditor & Onboarding Copilot
          </p>
        </div>

        {/* Tab Switcher */}
        <div className={styles.tabContainer}>
          <button
            type="button"
            className={`${styles.tabButton} ${activeTab === "signin" ? styles.tabButtonActive : ""}`}
            onClick={() => setActiveTab("signin")}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`${styles.tabButton} ${activeTab === "signup" ? styles.tabButtonActive : ""}`}
            onClick={() => setActiveTab("signup")}
          >
            Create Account
          </button>
        </div>

        {/* Credentials Form */}
        <CredentialsForm activeTab={activeTab} />
      </div>
    </div>
  );
}

export default SignInPage;
