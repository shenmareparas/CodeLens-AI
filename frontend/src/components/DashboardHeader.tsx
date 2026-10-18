import { useTheme } from "@/context/ThemeContext";

interface DashboardHeaderProps {
  userName?: string | null;
  userEmail?: string | null;
  onSignOut: () => void;
}

export function DashboardHeader({ userName, userEmail, onSignOut }: DashboardHeaderProps) {
  const { theme, resolvedTheme, cycleTheme } = useTheme();

  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        paddingBottom: "1.5rem",
        borderBottom: "1px solid var(--color-border)",
        flexWrap: "wrap",
        gap: "1rem",
      }}
    >
      <a
        href="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.85rem",
          textDecoration: "none",
          color: "inherit",
          transition: "opacity 0.2s ease",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 14px rgba(99, 102, 241, 0.35)",
            color: "#fff",
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="8" y1="11" x2="14" y2="11" />
            <line x1="11" y1="8" x2="11" y2="14" />
          </svg>
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "1.35rem", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--color-text)" }}>
              CodeLens AI
            </span>
            <span style={{ fontSize: "0.7rem", padding: "0.15rem 0.45rem", borderRadius: "9999px", background: "rgba(99, 102, 241, 0.15)", color: "var(--color-primary-light)", border: "1px solid rgba(99, 102, 241, 0.3)", fontWeight: 600 }}>
              Console
            </span>
          </div>
          <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", margin: 0 }}>
            Architecture Auditor & Onboarding Copilot
          </p>
        </div>
      </a>

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {/* Theme Toggle Button (Light / Dark / System) */}
        <button
          type="button"
          onClick={cycleTheme}
          title={`Current theme: ${theme} (resolved: ${resolvedTheme}). Click to cycle: System → Dark → Light.`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "0.45rem 0.8rem",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--color-border)",
            background: "var(--color-surface)",
            color: "var(--color-text)",
            cursor: "pointer",
            fontSize: "0.82rem",
            fontWeight: 500,
            transition: "var(--transition-fast)",
          }}
        >
          <span>
            {theme === "system" ? "💻" : theme === "dark" ? "🌙" : "☀️"}
          </span>
          <span style={{ textTransform: "capitalize" }}>
            {theme === "system" ? "System" : theme === "dark" ? "Dark" : "Light"}
          </span>
        </button>

        <div style={{ textAlign: "right", fontSize: "0.85rem" }}>
          <div style={{ fontWeight: 600, color: "var(--color-text)" }}>
            {userName || "Developer"}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
            {userEmail}
          </div>
        </div>

        <button
          type="button"
          onClick={onSignOut}
          style={{
            padding: "0.45rem 0.85rem",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--color-border)",
            background: "var(--color-surface)",
            color: "var(--color-text-muted)",
            cursor: "pointer",
            fontSize: "0.8rem",
            transition: "var(--transition-fast)",
          }}
        >
          Sign Out
        </button>
      </div>
    </header>
  );
}
