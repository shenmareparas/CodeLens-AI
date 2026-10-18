import { useState } from "react";
import { getDossierDownloadUrl, type AuditResponse } from "@/lib/api-client";
import { TelemetryBentoGrid } from "./TelemetryBentoGrid";
import { MermaidViewer } from "./MermaidViewer";
import { DossierViewer } from "./DossierViewer";

interface ActiveAuditSectionProps {
  audit: AuditResponse;
  backendToken: string;
  isLoading: boolean;
  onReAnalyze: (repoUrl: string) => void;
  onOpenChat: () => void;
}

type SectionTab = "telemetry" | "diagram" | "dossier";

export function ActiveAuditSection({
  audit,
  backendToken,
  isLoading,
  onReAnalyze,
  onOpenChat,
}: ActiveAuditSectionProps) {
  const [activeTab, setActiveTab] = useState<SectionTab>("telemetry");
  const [isDownloading, setIsDownloading] = useState(false);

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

  const repoName = audit.repoUrl.replace("https://github.com/", "");
  const mermaidChart =
    (audit.aiInsights as Record<string, unknown> | undefined)?.mermaidDiagram as string | undefined;

  const handleDownloadSas = async () => {
    if (!audit.auditId || !backendToken) return;
    try {
      setIsDownloading(true);
      const { url } = await getDossierDownloadUrl(audit.auditId, backendToken);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to generate download URL";
      alert(msg);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
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

      {/* Audit Header, Tabs & Actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--color-text)" }}>
              {repoName}
            </h2>
            {audit.commitSha && (
              <code
                style={{
                  fontSize: "0.75rem",
                  padding: "0.15rem 0.45rem",
                  background: "var(--color-badge-bg)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "4px",
                  fontFamily: "var(--font-mono)",
                  color: "var(--color-primary)",
                  fontWeight: 600,
                }}
              >
                {audit.commitSha.substring(0, 7)}
              </code>
            )}
          </div>
          <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
            Audited on {new Date(audit.createdAt).toLocaleString()} • Status: {audit.status}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
          {/* Section View Tabs */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "var(--color-badge-bg)",
              padding: "0.2rem",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--color-border)",
              gap: "0.25rem",
            }}
          >
            {(
              [
                { id: "telemetry", label: "Telemetry Bento", icon: "📊" },
                { id: "dossier", label: "Knowledge Dossier", icon: "📄" },
                { id: "diagram", label: "Architecture Diagram", icon: "🗺️" },
              ] as const
            ).map((tab) => {
              const isCurrent = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: "0.35rem 0.75rem",
                    borderRadius: "var(--radius-sm)",
                    border: "none",
                    background: isCurrent ? "var(--color-primary)" : "transparent",
                    color: isCurrent ? "#ffffff" : "var(--color-text-muted)",
                    fontWeight: isCurrent ? 600 : 500,
                    fontSize: "0.78rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    transition: "var(--transition-fast)",
                  }}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            disabled={isLoading}
            onClick={() => onReAnalyze(audit.repoUrl)}
            title="Re-analyze repository and regenerate telemetry & dossier"
            style={{
              fontSize: "0.8rem",
              padding: "0.35rem 0.75rem",
              borderRadius: "var(--radius-sm)",
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text)",
              fontWeight: 600,
              cursor: isLoading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              transition: "var(--transition-fast)",
            }}
          >
            <span style={{ display: "inline-block", animation: isLoading ? "spin 1s linear infinite" : "none" }}>🔄</span>
            <span>Re-analyze</span>
          </button>

          <button
            type="button"
            onClick={onOpenChat}
            style={{
              fontSize: "0.8rem",
              padding: "0.35rem 0.75rem",
              borderRadius: "var(--radius-sm)",
              background: "rgba(99, 102, 241, 0.15)",
              border: "1px solid rgba(99, 102, 241, 0.35)",
              color: "var(--color-primary-light)",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              transition: "var(--transition-fast)",
            }}
          >
            <span>💬</span>
            <span>Ask AI</span>
          </button>

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
            GitHub ↗
          </a>
        </div>
      </div>

      {/* Tab 1: Bento Grid Telemetry */}
      {activeTab === "telemetry" && (
        <TelemetryBentoGrid repoUrl={audit.repoUrl} telemetry={audit.telemetry} />
      )}

      {/* Tab 2: Knowledge Dossier Preview */}
      {activeTab === "dossier" && (
        <div style={{ minHeight: "750px" }}>
          {audit.dossierMarkdown ? (
            <DossierViewer
              markdown={audit.dossierMarkdown}
              auditId={audit.auditId}
              onDownloadSas={handleDownloadSas}
              isDownloading={isDownloading}
            />
          ) : (
            <div
              style={{
                padding: "3rem",
                textAlign: "center",
                border: "1px dashed var(--color-border)",
                borderRadius: "var(--radius-lg)",
                color: "var(--color-text-muted)",
              }}
            >
              Dossier markdown not generated for this repository.
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Architecture Diagram */}
      {activeTab === "diagram" && (
        <div>
          {mermaidChart ? (
            <MermaidViewer
              chart={mermaidChart}
              title={`${repoName} — C4 Architecture Model`}
            />
          ) : (
            <div
              style={{
                padding: "3rem",
                textAlign: "center",
                border: "1px dashed var(--color-border)",
                borderRadius: "var(--radius-lg)",
                color: "var(--color-text-muted)",
              }}
            >
              No architecture diagram available for this repository.
            </div>
          )}
        </div>
      )}
    </section>
  );
}

