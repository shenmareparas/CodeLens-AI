"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAudit, getDossierDownloadUrl, startAudit, type AuditResponse } from "@/lib/api-client";
import { MermaidViewer } from "@/components/MermaidViewer";
import { DossierViewer } from "@/components/DossierViewer";
import { RepoChatSidebar } from "@/components/RepoChatSidebar";
import { TelemetryBentoGrid } from "@/components/TelemetryBentoGrid";

interface AuditWorkspaceClientProps {
  auditId: string;
  backendToken: string;
  userName?: string | null;
}

type TabType = "dossier" | "telemetry" | "diagram";

export function AuditWorkspaceClient({
  auditId,
  backendToken,
  userName,
}: AuditWorkspaceClientProps) {
  const [audit, setAudit] = useState<AuditResponse | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("dossier");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isReAnalyzing, setIsReAnalyzing] = useState(false);
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

  const handleReAnalyze = async () => {
    if (!audit?.repoUrl || !backendToken) return;
    try {
      setIsReAnalyzing(true);
      setError(null);
      const updatedAudit = await startAudit(audit.repoUrl, backendToken, true);
      const full = await getAudit(updatedAudit.auditId, backendToken);
      setAudit(full);
      if (updatedAudit.auditId !== auditId) {
        window.history.replaceState(null, "", `/dashboard/audit/${updatedAudit.auditId}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to re-analyze repository.";
      setError(msg);
    } finally {
      setIsReAnalyzing(false);
    }
  };

  const handleDownloadSas = async () => {
    if (!auditId || !backendToken) return;
    try {
      setIsDownloading(true);
      const { url } = await getDossierDownloadUrl(audit?.auditId || auditId, backendToken);
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
        position: "relative",
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
              Repository Intelligence & Knowledge Dossier
            </p>
          </div>
        </div>

        {/* Actions & View Mode Tabs */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          <button
            type="button"
            disabled={isReAnalyzing || isLoading || !audit?.repoUrl}
            onClick={handleReAnalyze}
            title="Re-analyze repository from scratch and update telemetry, diagrams & dossier"
            style={{
              padding: "0.35rem 0.75rem",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--color-border)",
              background: "rgba(255, 255, 255, 0.05)",
              color: "var(--color-text)",
              fontWeight: 600,
              fontSize: "0.78rem",
              cursor: isReAnalyzing || isLoading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              transition: "var(--transition-fast)",
            }}
          >
            <span style={{ display: "inline-block", animation: isReAnalyzing ? "spin 1s linear infinite" : "none" }}>🔄</span>
            <span>{isReAnalyzing ? "Re-analyzing..." : "Re-analyze Repo"}</span>
          </button>

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
                { id: "dossier", label: "Knowledge Dossier", icon: "📄" },
                { id: "telemetry", label: "Telemetry Bento", icon: "📊" },
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

          <button
            type="button"
            onClick={() => setIsChatOpen((prev) => !prev)}
            style={{
              padding: "0.35rem 0.85rem",
              borderRadius: "var(--radius-sm)",
              border: "1px solid rgba(99, 102, 241, 0.4)",
              background: isChatOpen ? "var(--color-primary)" : "rgba(99, 102, 241, 0.15)",
              color: isChatOpen ? "#fff" : "var(--color-primary-light)",
              fontWeight: 600,
              fontSize: "0.78rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              transition: "var(--transition-fast)",
            }}
          >
            <span>💬</span>
            <span>{isChatOpen ? "Hide Copilot" : "Ask AI Copilot"}</span>
          </button>
        </div>
      </header>

      {/* ── Main Full-Width Content Area ────────────────────────────────────── */}
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
          {/* TAB: Full Knowledge Dossier (Default) */}
          {activeTab === "dossier" && (
            <div style={{ minHeight: "750px", flex: 1 }}>
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
                  Dossier markdown not available for this repository.
                </div>
              )}
            </div>
          )}

          {/* TAB: Telemetry Bento Grid */}
          {activeTab === "telemetry" && audit.telemetry && (
            <div style={{ padding: "0.5rem 0" }}>
              <TelemetryBentoGrid repoUrl={audit.repoUrl} telemetry={audit.telemetry} />
            </div>
          )}

          {/* TAB: Architecture Diagram */}
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
        </div>
      ) : null}

      {/* ── Floating Ask AI Button (Bottom Right Corner) ──────────────────── */}
      {audit && !isChatOpen && (
        <button
          type="button"
          onClick={() => setIsChatOpen(true)}
          style={{
            position: "fixed",
            bottom: "2rem",
            right: "2rem",
            zIndex: 40,
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            padding: "0.85rem 1.35rem",
            borderRadius: "9999px",
            background: "linear-gradient(135deg, var(--color-primary) 0%, #4f46e5 100%)",
            color: "#fff",
            fontWeight: 600,
            fontSize: "0.95rem",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            boxShadow: "0 10px 25px -5px rgba(99, 102, 241, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4)",
            cursor: "pointer",
            transition: "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0) scale(1)";
          }}
        >
          <span style={{ fontSize: "1.2rem" }}>✨</span>
          <span>Ask AI Copilot</span>
        </button>
      )}

      {/* ── Slide-over Right Side Panel (Drawer) ───────────────────────────── */}
      {audit && isChatOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            bottom: 0,
            width: "min(520px, 92vw)",
            height: "100vh",
            zIndex: 50,
            background: "var(--color-surface)",
            boxShadow: "-8px 0 32px rgba(0, 0, 0, 0.6)",
            borderLeft: "1px solid var(--color-border)",
            display: "flex",
            flexDirection: "column",
            animation: "slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <RepoChatSidebar
            auditId={audit.auditId}
            backendToken={backendToken}
            repoName={repoName}
            onClose={() => setIsChatOpen(false)}
          />
        </div>
      )}

      {/* Backdrop overlay for drawer on smaller viewports */}
      {audit && isChatOpen && (
        <button
          type="button"
          aria-label="Close AI Chat Drawer"
          onClick={() => setIsChatOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 45,
            background: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(2px)",
            border: "none",
            cursor: "default",
          }}
        />
      )}
    </div>
  );
}
