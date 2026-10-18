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
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: "1.1rem",
            color: "#fff",
          }}
        >
          ⚡
        </div>
        <div>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-text)" }}>
            CodeLens AI
          </h1>
          <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
            Repository Intelligence & Architecture Auditor
          </p>
        </div>
      </div>

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
