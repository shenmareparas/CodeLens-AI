"use client";

import type { TelemetryData } from "@/lib/api-client";
import { SparklineChart } from "./SparklineChart";
import { HotspotTable } from "./HotspotTable";
import { DependenciesCard } from "./DependenciesCard";
import { LanguageDistributionCard } from "./LanguageDistributionCard";

interface TelemetryBentoGridProps {
  repoUrl?: string;
  telemetry: TelemetryData;
}

export function TelemetryBentoGrid({ telemetry }: TelemetryBentoGridProps) {
  const getCadenceColor = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("healthy") || s.includes("active"))
      return {
        bg: "rgba(34, 197, 94, 0.15)",
        text: "#4ade80",
        border: "rgba(34, 197, 94, 0.3)",
      };
    if (s.includes("stable"))
      return {
        bg: "rgba(245, 158, 11, 0.15)",
        text: "#fbbf24",
        border: "rgba(245, 158, 11, 0.3)",
      };
    return {
      bg: "rgba(239, 68, 68, 0.15)",
      text: "#f87171",
      border: "rgba(239, 68, 68, 0.3)",
    };
  };

  const cadenceStyle = getCadenceColor(telemetry.releaseStatus);

  // Language bar colors
  const languageColors: Record<string, string> = {
    TypeScript: "#3178c6",
    JavaScript: "#f7df1e",
    "C#": "#178600",
    Python: "#3572A5",
    Go: "#00ADD8",
    Rust: "#dea584",
    HTML: "#e34c26",
    CSS: "#563d7c",
    Shell: "#89e051",
    Java: "#b07219",
    Dart: "#00B4AB",
    Flutter: "#02569B",
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
        width: "100%",
      }}
    >
      {/* ── Top Metric Cards ──────────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1rem",
        }}
      >
        {/* Stars */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <span style={cardLabelStyle}>Stars</span>
            <span style={{ fontSize: "1.1rem" }}>⭐</span>
          </div>
          <div style={cardValueStyle}>{telemetry.stars.toLocaleString()}</div>
          <div style={cardSubtextStyle}>GitHub Stargazers</div>
        </div>

        {/* Forks */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <span style={cardLabelStyle}>Forks</span>
            <span style={{ fontSize: "1.1rem" }}>🍴</span>
          </div>
          <div style={cardValueStyle}>{telemetry.forks.toLocaleString()}</div>
          <div style={cardSubtextStyle}>Network copies</div>
        </div>

        {/* License */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <span style={cardLabelStyle}>License</span>
            <span style={{ fontSize: "1.1rem" }}>⚖️</span>
          </div>
          <div
            style={{
              ...cardValueStyle,
              fontSize: "1.25rem",
              wordBreak: "break-word",
            }}
          >
            {telemetry.license || "None / Custom"}
          </div>
          <div style={cardSubtextStyle}>SPDX Identifier</div>
        </div>

        {/* Cadence Status */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <span style={cardLabelStyle}>Release Health</span>
            <span
              style={{
                fontSize: "0.75rem",
                padding: "0.2rem 0.5rem",
                borderRadius: "99px",
                background: cadenceStyle.bg,
                color: cadenceStyle.text,
                border: `1px solid ${cadenceStyle.border}`,
                fontWeight: 600,
              }}
            >
              {telemetry.releaseStatus}
            </span>
          </div>
          <div style={cardValueStyle}>
            {telemetry.daysSinceLastRelease}d ago
          </div>
          <div style={cardSubtextStyle}>Since latest published release/tag</div>
        </div>
      </div>

      {/* ── Middle Row: Sparkline + Languages ─────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          gap: "1.25rem",
        }}
      >
        {/* Sparkline Card */}
        <div
          style={{
            ...cardStyle,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.45rem",
              marginBottom: "0.85rem",
            }}
          >
            <span style={{ fontSize: "1.1rem" }}>⚡</span>
            <h3 style={{ ...sectionHeadingStyle, margin: 0 }}>
              Activity Pulse{" "}
              {telemetry.commitTimeline && telemetry.commitTimeline.length > 0
                ? "(All-Time History)"
                : "(Recent Cadence)"}
            </h3>
          </div>
          <SparklineChart
            data={telemetry.weeklyCommitsSparkline}
            commitTimeline={telemetry.commitTimeline}
            allTimeTotalCommits={telemetry.totalCommits}
          />
        </div>

        {/* Language Distribution Card */}
        <LanguageDistributionCard
          languages={telemetry.languages}
          languageColors={languageColors}
          cardStyle={cardStyle}
          sectionHeadingStyle={sectionHeadingStyle}
        />
      </div>

      {/* ── Security / Secret Scanner Surface ────────────────────────────── */}
      <div
        style={{
          ...cardStyle,
          borderColor:
            telemetry.secretAlerts.length > 0
              ? "rgba(239, 68, 68, 0.3)"
              : "rgba(34, 197, 94, 0.25)",
          background:
            telemetry.secretAlerts.length > 0
              ? "rgba(239, 68, 68, 0.05)"
              : "rgba(34, 197, 94, 0.03)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            marginBottom: "0.5rem",
          }}
        >
          <span style={{ fontSize: "1.25rem" }}>
            {telemetry.secretAlerts.length > 0 ? "⚠️" : "🛡️"}
          </span>
          <div>
            <h3
              style={{
                fontSize: "1rem",
                fontWeight: 600,
                color:
                  telemetry.secretAlerts.length > 0 ? "#f87171" : "#4ade80",
              }}
            >
              {telemetry.secretAlerts.length > 0
                ? `${telemetry.secretAlerts.length} Sensitive Security Surface Alerts Detected`
                : "0 Exposed Secrets Detected"}
            </h3>
            <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
              {telemetry.secretAlerts.length > 0
                ? "Immediate remediation required: Ensure exposed keys and configuration files are revoked and removed from Git history."
                : "High-entropy zero-allocation regex scanner verified 0 API keys, sensitive tokens, or private certificates."}
            </p>
          </div>
        </div>

        {telemetry.secretAlerts.length > 0 && (
          <ul
            style={{
              listStyle: "none",
              display: "flex",
              flexDirection: "column",
              gap: "0.4rem",
              marginTop: "0.75rem",
            }}
          >
            {telemetry.secretAlerts.map((alert) => (
              <li
                key={alert}
                style={{
                  padding: "0.5rem 0.75rem",
                  background: "rgba(239, 68, 68, 0.1)",
                  borderRadius: "var(--radius-sm)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.8rem",
                  color: "#fca5a5",
                }}
              >
                {alert}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Hotspot Heatmap Table ────────────────────────────────────────── */}
      <div style={cardStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: "1rem",
          }}
        >
          <div>
            <h3 style={sectionHeadingStyle}>
              Complexity Heatmap & Top Bug Hotspots
            </h3>
            <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
              Deterministic Risk Score:{" "}
              <code style={{ color: "var(--color-primary-light)" }}>
                RiskScore = Complexity × ln(Churn + 1)
              </code>
            </p>
          </div>
          <span
            style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}
          >
            {telemetry.hotspots.length} files analyzed
          </span>
        </div>
        <HotspotTable hotspots={telemetry.hotspots} />
      </div>

      {/* ── Dependencies & Dead Code Candidates ─────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          gap: "1.25rem",
        }}
      >
        {/* Dependencies with Ecosystem Filter */}
        <DependenciesCard dependencies={telemetry.dependencies} />

        {/* Dead Code Candidates */}
        <div style={cardStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.75rem",
            }}
          >
            <h3 style={sectionHeadingStyle}>
              Candidate Dead Code & Zombie Symbols
            </h3>
            <span
              style={{
                fontSize: "0.75rem",
                padding: "0.15rem 0.5rem",
                borderRadius: "99px",
                background:
                  telemetry.deadCode.length > 0
                    ? "rgba(245, 158, 11, 0.15)"
                    : "rgba(34, 197, 94, 0.15)",
                color: telemetry.deadCode.length > 0 ? "#fbbf24" : "#4ade80",
              }}
            >
              {telemetry.deadCode.length} candidates
            </span>
          </div>

          {telemetry.deadCode.length === 0 ? (
            <div
              style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}
            >
              No dead code candidates detected.
            </div>
          ) : (
            <div
              style={{
                maxHeight: "280px",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "0.4rem",
              }}
            >
              {telemetry.deadCode.map((dc) => (
                <div
                  key={dc}
                  style={{
                    padding: "0.45rem 0.65rem",
                    background: "var(--color-badge-bg)",
                    borderRadius: "var(--radius-sm)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.75rem",
                    color: "var(--color-text)",
                  }}
                >
                  {dc}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Shared Styling Tokens ───────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-lg)",
  padding: "1.25rem",
  boxShadow: "var(--shadow-card)",
};

const cardHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "0.5rem",
};

const cardLabelStyle: React.CSSProperties = {
  fontSize: "0.8rem",
  color: "var(--color-text-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const cardValueStyle: React.CSSProperties = {
  fontSize: "1.75rem",
  fontWeight: 700,
  letterSpacing: "-0.02em",
  color: "var(--color-text)",
  lineHeight: 1.2,
};

const cardSubtextStyle: React.CSSProperties = {
  fontSize: "0.75rem",
  color: "var(--color-text-muted)",
  marginTop: "0.35rem",
};

const sectionHeadingStyle: React.CSSProperties = {
  fontSize: "1rem",
  fontWeight: 600,
  color: "var(--color-text)",
  marginBottom: "0.75rem",
};
