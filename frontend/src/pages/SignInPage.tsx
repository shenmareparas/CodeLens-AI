import { useState } from "react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CredentialsForm } from "./CredentialsForm";
import styles from "./SignInPage.module.css";

export function SignInPage() {
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");

  return (
    <div className={styles.container}>
      {/* Ambient background blur elements */}
      <div className={styles.bgOrb1} aria-hidden="true" />
      <div className={styles.bgOrb2} aria-hidden="true" />

      {/* Top action bar: back to home + theme toggle */}
      <div
        style={{
          position: "absolute",
          top: "1.25rem",
          left: "1.25rem",
          right: "1.25rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 20,
        }}
      >
        <Link
          to="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "0.4rem 0.85rem",
            borderRadius: "9999px",
            background: "var(--color-surface)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text)",
            fontSize: "0.8125rem",
            fontWeight: 500,
            textDecoration: "none",
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.15)",
            transition: "all 0.2s ease",
          }}
        >
          <span aria-hidden="true">←</span>
          <span>Back to Home</span>
        </Link>

        <ThemeToggle />
      </div>

      <div className={styles.card}>
        {/* Brand */}
        <div className={styles.brand}>
          <div className={styles.logoIcon}>
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: "var(--color-primary-light)" }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="8" y1="11" x2="14" y2="11" />
              <line x1="11" y1="8" x2="11" y2="14" />
            </svg>
          </div>
          <h1 className={styles.brandName}>CodeLens AI</h1>
          <p className={styles.tagline}>
            Repository Intelligence, Architecture Auditor & Onboarding Copilot
          </p>
        </div>

        {/* Tab Switcher */}
        <div className={styles.tabBar} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "signin"}
            className={`${styles.tabBtn} ${activeTab === "signin" ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab("signin")}
          >
            Sign In
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "signup"}
            className={`${styles.tabBtn} ${activeTab === "signup" ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab("signup")}
          >
            Create Account
          </button>
        </div>

        {/* Credentials Form (keyed by activeTab to clear validation errors and transient inputs on tab switch) */}
        <CredentialsForm key={activeTab} activeTab={activeTab} />


        {/* Legal & privacy guarantee */}
        <p className={styles.legal}>
          By continuing, you agree to our terms of service and private code analysis policy.
        </p>
      </div>
    </div>
  );
}

export default SignInPage;
