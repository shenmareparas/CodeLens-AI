"use client";

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import {
  startAudit,
  getUserAudits,
  getAudit,
  type AuditResponse,
} from "@/lib/api-client";
import { DashboardHeader } from "@/components/DashboardHeader";
import { ActiveAuditSection } from "@/components/ActiveAuditSection";
import { RepoChatSidebar } from "@/components/RepoChatSidebar";

interface DashboardClientProps {
  userName?: string | null;
  userEmail?: string | null;
  backendToken: string;
}

const SAMPLE_REPOS = [
  "https://github.com/shenmareparas/Chess",
  "https://github.com/shenmareparas/expense_tracker",
  "https://github.com/shenmareparas/play-store-ai-review",
  "https://github.com/shenmareparas/Portfolio_NextJS",
  "https://github.com/shenmareparas/nexu5-music-bot",
];

export function DashboardClient({
  userName,
  userEmail,
  backendToken,
}: DashboardClientProps) {
  const [repoUrl, setRepoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [activeAudit, setActiveAudit] = useState<AuditResponse | null>(null);
  const [recentAudits, setRecentAudits] = useState<AuditResponse[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Load previous audits on mount
  useEffect(() => {
    if (!backendToken) return;
    getUserAudits(backendToken)
      .then((audits) => {
        setRecentAudits(audits);
        if (audits.length > 0 && audits[0].telemetry) {
          setActiveAudit(audits[0]);
        }
      })
      .catch((err) => {
        console.error("Failed to load user audits:", err);
      });
  }, [backendToken]);

  const handleAnalyze = async (urlToAnalyze?: string, forceRefresh: boolean = false) => {
    const targetUrl = (urlToAnalyze ?? repoUrl).trim();
    if (!targetUrl) {
      setError("Please enter a valid GitHub repository URL.");
      return;
    }

    setError(null);
    setIsLoading(true);
    setStatusMessage(
      forceRefresh
        ? "Re-analyzing latest commits & generating fresh telemetry..."
        : "Checking shared cache & streaming AST telemetry...",
    );

    try {
      const response = await startAudit(targetUrl, backendToken, forceRefresh);
      setActiveAudit(response);
      setStatusMessage(
        response.isStale
          ? "Loaded existing repository audit (notice: newer commits exist on remote branch)."
          : "Repository telemetry and architectural intelligence loaded!",
      );

      // Refresh recent audits list
      const refreshed = await getUserAudits(backendToken);
      setRecentAudits(refreshed);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to analyze repository.";
      setError(msg);
    } finally {
      setIsLoading(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleSelectAudit = async (auditSummary: AuditResponse) => {
    setError(null);
    setIsLoading(true);
    try {
      const fullAudit = await getAudit(auditSummary.auditId, backendToken);
      setActiveAudit(fullAudit);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load audit.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "2rem 1.5rem", display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* ── Top Bar ───────────────────────────────────────────────────────── */}
      <DashboardHeader
        userName={userName}
        userEmail={userEmail}
        onSignOut={() => signOut({ callbackUrl: "/auth/signin" })}
      />

      {/* ── Ingestion Form / Hero ─────────────────────────────────────────── */}
      <section
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-xl)",
          padding: "2rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div>
          <span
            style={{
              display: "inline-block",
              padding: "0.2rem 0.6rem",
              borderRadius: "99px",
              background: "rgba(99, 102, 241, 0.15)",
              border: "1px solid rgba(99, 102, 241, 0.3)",
              color: "var(--color-primary)",
              fontSize: "0.75rem",
              fontWeight: 600,
              marginBottom: "0.5rem",
            }}
          >
            Zero-Disk Telemetry & Shared Repo Cache
          </span>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text)" }}>
            Scan & Audit GitHub Repository
          </h2>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", maxWidth: "600px" }}>
            Extracts commit sparklines, release cadence, Roslyn cyclomatic complexity, hotspot risk scores, dependencies, and sensitive secrets in-memory.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAnalyze();
          }}
          style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}
        >
          <input
            type="text"
            placeholder="https://github.com/owner/repo"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            disabled={isLoading}
            style={{
              flex: "1 1 320px",
              padding: "0.75rem 1rem",
              background: "var(--color-input-bg)",
              border: "1px solid var(--color-input-border)",
              borderRadius: "var(--radius-md)",
              color: "var(--color-input-text)",
              fontSize: "0.95rem",
              fontFamily: "var(--font-mono)",
              outline: "none",
            }}
          />
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button
              type="submit"
              disabled={isLoading || !repoUrl.trim()}
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "var(--radius-md)",
                border: "none",
                background: isLoading ? "rgba(99, 102, 241, 0.5)" : "var(--color-primary)",
                color: "#fff",
                fontWeight: 600,
                fontSize: "0.95rem",
                cursor: isLoading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                transition: "var(--transition-fast)",
              }}
            >
              {isLoading ? (
                <>
                  <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>🔄</span>
                  Analyzing...
                </>
              ) : (
                <>
                  <span>⚡</span> Analyze Repository
                </>
              )}
            </button>
            <button
              type="button"
              disabled={isLoading || !repoUrl.trim()}
              onClick={() => handleAnalyze(repoUrl, true)}
              title="Bypass shared cache and re-analyze the repository from scratch"
              style={{
                padding: "0.75rem 1.25rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border)",
                background: "var(--color-surface)",
                color: "var(--color-text)",
                fontWeight: 600,
                fontSize: "0.95rem",
                cursor: isLoading || !repoUrl.trim() ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                transition: "var(--transition-fast)",
              }}
            >
              <span style={{ display: "inline-block" }}>🔄</span>
              <span>Re-analyze</span>
            </button>
          </div>
        </form>

        {/* Quick Sample Links */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", fontSize: "0.8rem" }}>
          <span style={{ color: "var(--color-text-muted)" }}>Try quick sample:</span>
          {SAMPLE_REPOS.map((sample) => (
            <button
              key={sample}
              type="button"
              disabled={isLoading}
              onClick={() => {
                setRepoUrl(sample);
                handleAnalyze(sample);
              }}
              style={{
                padding: "0.2rem 0.55rem",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--color-border)",
                background: "var(--color-surface)",
                color: "var(--color-primary)",
                cursor: "pointer",
                fontSize: "0.75rem",
                fontFamily: "var(--font-mono)",
                fontWeight: 500,
              }}
            >
              {sample.replace("https://github.com/", "")}
            </button>
          ))}
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div
            style={{
              padding: "0.6rem 1rem",
              background: "rgba(99, 102, 241, 0.12)",
              border: "1px solid rgba(99, 102, 241, 0.3)",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.85rem",
              color: "var(--color-primary-light)",
            }}
          >
            {statusMessage}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div
            style={{
              padding: "0.6rem 1rem",
              background: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.85rem",
              color: "#f87171",
            }}
          >
            {error}
          </div>
        )}
      </section>

      {/* ── Recent Audits Chips ───────────────────────────────────────────── */}
      {recentAudits.length > 0 && (
        <section style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Your Recent Repositories
          </span>
          <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.25rem" }}>
            {recentAudits.map((audit) => {
              const isSelected = activeAudit?.auditId === audit.auditId;
              const cleanName = audit.repoUrl.replace("https://github.com/", "");
              return (
                <button
                  key={audit.auditId}
                  type="button"
                  onClick={() => handleSelectAudit(audit)}
                  style={{
                    padding: "0.4rem 0.85rem",
                    borderRadius: "99px",
                    border: "1px solid",
                    borderColor: isSelected ? "var(--color-primary)" : "var(--color-border)",
                    background: isSelected ? "var(--color-primary)" : "var(--color-surface)",
                    color: isSelected ? "#ffffff" : "var(--color-text)",
                    fontSize: "0.8rem",
                    fontFamily: "var(--font-mono)",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    transition: "var(--transition-fast)",
                  }}
                >
                  <span>📦</span>
                  <span>{cleanName}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Active Audit Telemetry Bento Grid, Dossier, Diagram & Staleness Banner ───── */}
      {activeAudit && (
        <ActiveAuditSection
          audit={activeAudit}
          backendToken={backendToken}
          isLoading={isLoading}
          onReAnalyze={(url) => handleAnalyze(url, true)}
          onOpenChat={() => setIsChatOpen(true)}
        />
      )}

      {/* ── Floating Ask AI Button (Bottom Right Corner) ─────────────────── */}
      {activeAudit && !isChatOpen && (
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
            transition: "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0) scale(1)";
          }}
        >
          <span style={{ fontSize: "1.2rem" }}>✨</span>
          <span>Ask AI</span>
        </button>
      )}

      {/* ── Slide-over Right Side Panel (Drawer) ───────────────────────────── */}
      {activeAudit && isChatOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            bottom: 0,
            width: "min(520px, 92vw)",
            height: "100vh",
            zIndex: 50,
            background: "var(--color-drawer-bg)",
            boxShadow: "-12px 0 36px rgba(0, 0, 0, 0.4)",
            borderLeft: "1px solid var(--color-drawer-border)",
            display: "flex",
            flexDirection: "column",
            animation: "slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <RepoChatSidebar
            auditId={activeAudit.auditId}
            backendToken={backendToken}
            repoName={activeAudit.repoUrl.replace("https://github.com/", "")}
            onClose={() => setIsChatOpen(false)}
          />
        </div>
      )}

      {/* Backdrop overlay for drawer */}
      {activeAudit && isChatOpen && (
        <button
          type="button"
          aria-label="Close AI Chat Drawer"
          onClick={() => setIsChatOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 45,
            background: "rgba(0, 0, 0, 0.65)",
            border: "none",
            cursor: "default",
          }}
        />
      )}
    </div>
  );
}
