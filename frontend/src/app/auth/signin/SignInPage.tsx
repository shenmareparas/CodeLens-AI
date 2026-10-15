"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerWithCredentials } from "@/lib/api-client";
import styles from "./SignInPage.module.css";

export default function SignInPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch {
      setError("Failed to initiate Google sign-in. Please try again.");
      setIsLoading(false);
    }
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (activeTab === "signup" && !name) {
      setError("Please enter your name.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setIsLoading(true);

    try {
      if (activeTab === "signup") {
        // 1. Register with backend
        await registerWithCredentials(name, email, password);
      }

      // 2. Sign in via NextAuth Credentials provider
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError(
          activeTab === "signup"
            ? "Account created, but automatic sign-in failed. Please sign in."
            : "Invalid email or password. Please try again."
        );
        setIsLoading(false);
        return;
      }

      // Redirect to dashboard
      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed.";
      setError(msg);
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* Brand */}
        <div className={styles.brand}>
          <div className={styles.logoIcon}>
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="20" fill="url(#grad)" />
              <path d="M12 20l5 5 11-11" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#6366f1" />
                  <stop offset="1" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1 className={styles.brandName}>CodeLens AI</h1>
          <p className={styles.tagline}>Repository Intelligence &amp; Architecture Auditor</p>
        </div>

        {/* Tab Switcher */}
        <div className={styles.tabBar} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "signin"}
            className={`${styles.tabBtn} ${activeTab === "signin" ? styles.tabBtnActive : ""}`}
            onClick={() => {
              setActiveTab("signin");
              setError(null);
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "signup"}
            className={`${styles.tabBtn} ${activeTab === "signup" ? styles.tabBtnActive : ""}`}
            onClick={() => {
              setActiveTab("signup");
              setError(null);
            }}
          >
            Create Account
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className={styles.errorAlert} role="alert">
            <svg className={styles.errorIcon} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleCredentialsSubmit} className={styles.form}>
          {activeTab === "signup" && (
            <div className={styles.inputGroup}>
              <label htmlFor="user-name" className={styles.label}>Full Name</label>
              <input
                id="user-name"
                type="text"
                placeholder="Jane Developer"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={styles.input}
                disabled={isLoading}
                required
              />
            </div>
          )}

          <div className={styles.inputGroup}>
            <label htmlFor="user-email" className={styles.label}>Email Address</label>
            <input
              id="user-email"
              type="email"
              placeholder="developer@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              disabled={isLoading}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="user-password" className={styles.label}>Password</label>
            <input
              id="user-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              disabled={isLoading}
              required
            />
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={isLoading}
            id="auth-submit-btn"
          >
            {isLoading ? (
              <span className={styles.spinner} />
            ) : activeTab === "signin" ? (
              "Sign In with Email"
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        {/* Divider */}
        <div className={styles.divider}>
          <span className={styles.dividerLine} />
          <span className={styles.dividerText}>or continue with</span>
          <span className={styles.dividerLine} />
        </div>

        {/* Google OAuth Button */}
        <button
          type="button"
          className={styles.googleBtn}
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          id="google-signin-btn"
        >
          <GoogleIcon />
          <span>Continue with Google</span>
        </button>

        {/* Features */}
        <ul className={styles.features}>
          {FEATURES.map((f) => (
            <li key={f.label} className={styles.featureItem}>
              <span className={styles.featureDot} />
              <span>{f.label}</span>
            </li>
          ))}
        </ul>

        <p className={styles.legal}>
          By continuing, you agree to our{" "}
          <a href="/terms" className={styles.link}>Terms</a> and{" "}
          <a href="/privacy" className={styles.link}>Privacy Policy</a>.
        </p>
      </div>

      {/* Ambient background */}
      <div className={styles.bgOrb1} />
      <div className={styles.bgOrb2} />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 18 18" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
      <path fill="#EA4335" d="M17.64 9.2a10.34 10.34 0 0 0-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
      <path fill="#4285F4" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.34 0-4.33-1.58-5.04-3.71H.96v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.96 10.71A5.41 5.41 0 0 1 3.68 9c0-.59.1-1.17.28-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.04l3-2.33z" />
      <path fill="#34A853" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l3 2.33C4.67 5.16 6.66 3.58 9 3.58z" />
    </svg>
  );
}

const FEATURES = [
  { label: "Commit velocity & activity sparklines" },
  { label: "Cyclomatic complexity heatmaps" },
  { label: "Dead code & zombie file detection" },
  { label: "AI-powered architecture diagrams" },
  { label: "Secret & credential exposure surface" },
];
