"use client";

import Link from "next/link";
import { type AuditResponse } from "@/lib/api-client";
import { TelemetryBentoGrid } from "./TelemetryBentoGrid";

interface ActiveAuditSectionProps {
  audit: AuditResponse;
  isLoading: boolean;
  onReAnalyze: (repoUrl: string) => void;
}

export function ActiveAuditSection({
  audit,
  isLoading,
  onReAnalyze,
}: ActiveAuditSectionProps) {
  if (!audit.telemetry) {
    if (isLoading) return null;
    return (
      <div
        style={{
          padding: "2rem",
          textAlign: "center",
          color: "var(--color-text-muted)",
          border: "1px dashed var(--color-border)",
          borderRadius: "var(--radius-lg)",
        }}
      >
        Audit status: {audit.status}. Click &quot;Analyze Repository&quot; to begin scanning.
      </div>
    );
  }

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Outdated Audit Notice Banner */}
      {audit.isStale && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
            padding: "0.85rem 1.25rem",
            borderRadius: "var(--radius-md)",
            background: "rgba(245, 158, 11, 0.12)",
            border: "1px solid rgba(245, 158, 11, 0.35)",
            color: "#fbbf24",
            fontSize: "0.85rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span style={{ fontSize: "1.1rem" }}>⚠️</span>
            <div>
              <strong>Outdated Audit Notice:</strong> This architecture scan was generated for commit{" "}
              <code style={{ fontFamily: "var(--font-mono)", background: "rgba(0,0,0,0.3)", padding: "0.1rem 0.35rem", borderRadius: "4px" }}>
                {audit.commitSha ? audit.commitSha.substring(0, 7) : "older"}
              </code>
              . Newer commits exist on remote (
              <code style={{ fontFamily: "var(--font-mono)", background: "rgba(0,0,0,0.3)", padding: "0.1rem 0.35rem", borderRadius: "4px" }}>
                {audit.latestCommitSha ? audit.latestCommitSha.substring(0, 7) : "head"}
              </code>
              ).
            </div>
          </div>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => onReAnalyze(audit.repoUrl)}
            style={{
              padding: "0.4rem 0.85rem",
              borderRadius: "var(--radius-sm)",
              background: "#f59e0b",
              color: "#000",
              fontWeight: 600,
              border: "none",
              cursor: isLoading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              fontSize: "0.8rem",
              boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
            }}
          >
            <span>🔄</span> Re-analyze Latest Commits
          </button>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "0.5rem" }}>
        <div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-text)" }}>
            {audit.repoUrl.replace("https://github.com/", "")}
          </h2>
          <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
            Audited on {new Date(audit.createdAt).toLocaleString()} • Status: {audit.status}
            {audit.commitSha && (
              <> • Commit: <code style={{ fontFamily: "var(--font-mono)" }}>{audit.commitSha.substring(0, 7)}</code></>
            )}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Link
            href={`/dashboard/audit/${audit.auditId}`}
            style={{
              fontSize: "0.8rem",
              padding: "0.35rem 0.75rem",
              borderRadius: "var(--radius-sm)",
              background: "rgba(99, 102, 241, 0.15)",
              border: "1px solid rgba(99, 102, 241, 0.3)",
              color: "var(--color-primary-light)",
              fontWeight: 600,
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
            }}
          >
            <span>🚀</span> Launch Split Workspace (Chat & Dossier)
          </Link>
          <a
            href={audit.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: "0.8rem",
              color: "var(--color-text-muted)",
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
              textDecoration: "none",
            }}
          >
            View on GitHub ↗
          </a>
        </div>
      </div>

      <TelemetryBentoGrid repoUrl={audit.repoUrl} telemetry={audit.telemetry} />
    </section>
  );
}
