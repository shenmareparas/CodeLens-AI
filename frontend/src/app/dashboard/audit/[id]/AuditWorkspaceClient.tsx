"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAudit, getDossierDownloadUrl, type AuditResponse } from "@/lib/api-client";
import { MermaidViewer } from "@/components/MermaidViewer";
import { DossierViewer } from "@/components/DossierViewer";
import { RepoChatSidebar } from "@/components/RepoChatSidebar";
import { TelemetryBentoGrid } from "@/components/TelemetryBentoGrid";

interface AuditWorkspaceClientProps {
  auditId: string;
  backendToken: string;
  userName?: string | null;
}

type TabType = "workspace" | "telemetry" | "diagram" | "dossier";

export function AuditWorkspaceClient({
  auditId,
  backendToken,
  userName,
}: AuditWorkspaceClientProps) {
  const [audit, setAudit] = useState<AuditResponse | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("workspace");
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!backendToken || !auditId) return;

    setIsLoading(true);
    getAudit(auditId, backendToken)
      .then((data) => {
        setAudit(data);
        setError(null);
      })
      .catch((err) => {
        setError(err.message || "Failed to load audit data.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [auditId, backendToken]);

  const handleDownloadSas = async () => {
    if (!auditId || !backendToken) return;
    try {
      setIsDownloading(true);
      const { url } = await getDossierDownloadUrl(auditId, backendToken);
      window.open(url, "_blank");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to generate download URL";
      alert(msg);
    } finally {
      setIsDownloading(false);
    }
  };

  const repoName = audit?.repoUrl.replace("https://github.com/", "") ?? "Repository";
  const mermaidChart =
    (audit?.aiInsights as Record<string, unknown> | undefined)?.mermaidDiagram as string | undefined;

  return (
    <div
      style={{
        maxWidth: "1600px",
        margin: "0 auto",
        padding: "1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
        minHeight: "100vh",
      }}
    >
      {/* ── Top Navigation Bar ────────────────────────────────────────────── */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingBottom: "1rem",
          borderBottom: "1px solid var(--color-border)",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link
            href="/dashboard"
            style={{
              padding: "0.4rem 0.75rem",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--color-border)",
              background: "rgba(255, 255, 255, 0.03)",
              color: "var(--color-text-muted)",
              textDecoration: "none",
              fontSize: "0.8rem",
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
            }}
          >
            <span>←</span> Dashboard
          </Link>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "1.2rem" }}>🔬</span>
              <h1 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--color-text)" }}>
                {repoName}
              </h1>
              {audit?.commitSha && (
                <code
                  style={{
                    fontSize: "0.75rem",
                    padding: "0.15rem 0.45rem",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "4px",
                    fontFamily: "var(--font-mono)",
                    color: "var(--color-primary-light)",
                  }}
                >
                  {audit.commitSha.substring(0, 7)}
                </code>
              )}
            </div>
            <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
              Interactive Workspace • Dossier & Grounded Copilot
            </p>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: "rgba(255, 255, 255, 0.03)",
            padding: "0.2rem",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--color-border)",
            gap: "0.25rem",
          }}
        >
          {(
            [
              { id: "workspace", label: "Split Workspace", icon: "⚡" },
              { id: "telemetry", label: "Telemetry Bento", icon: "📊" },
              { id: "diagram", label: "Mermaid Diagram", icon: "🗺️" },
              { id: "dossier", label: "Knowledge Dossier", icon: "📄" },
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
                  color: isCurrent ? "#fff" : "var(--color-text-muted)",
                  fontWeight: isCurrent ? 600 : 400,
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
      </header>

      {/* ── Content Area ──────────────────────────────────────────────────── */}
      {isLoading ? (
        <div
          style={{
            minHeight: "500px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            color: "var(--color-text-muted)",
            fontSize: "0.9rem",
            gap: "0.5rem",
          }}
        >
          <span style={{ animation: "spin 1s linear infinite" }}>🔄</span>
          Loading repository dossier and architecture intelligence...
        </div>
      ) : error ? (
        <div
          style={{
            padding: "2rem",
            borderRadius: "var(--radius-md)",
            background: "rgba(239, 68, 68, 0.12)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "#f87171",
            textAlign: "center",
          }}
        >
          {error}
        </div>
      ) : audit ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* TAB: Split Workspace (Dossier Preview + Repo Chat) */}
          {activeTab === "workspace" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(480px, 1fr))",
                gap: "1.25rem",
                minHeight: "750px",
                flex: 1,
              }}
            >
              <div style={{ height: "750px" }}>
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
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1px dashed var(--color-border)",
                      borderRadius: "var(--radius-lg)",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    Dossier markdown not available.
                  </div>
                )}
              </div>

              <div style={{ height: "750px" }}>
                <RepoChatSidebar
                  auditId={audit.auditId}
                  backendToken={backendToken}
                  repoName={repoName}
                />
              </div>
            </div>
          )}

          {/* TAB: Telemetry Bento Grid */}
          {activeTab === "telemetry" && audit.telemetry && (
            <div style={{ padding: "0.5rem 0" }}>
              <TelemetryBentoGrid repoUrl={audit.repoUrl} telemetry={audit.telemetry} />
            </div>
          )}

          {/* TAB: Interactive Mermaid Diagram */}
          {activeTab === "diagram" && (
            <div style={{ padding: "0.5rem 0" }}>
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
                  No Mermaid diagram generated for this repository.
                </div>
              )}
            </div>
          )}

          {/* TAB: Standalone Knowledge Dossier */}
          {activeTab === "dossier" && audit.dossierMarkdown && (
            <div style={{ height: "800px" }}>
              <DossierViewer
                markdown={audit.dossierMarkdown}
                auditId={audit.auditId}
                onDownloadSas={handleDownloadSas}
                isDownloading={isDownloading}
              />
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
