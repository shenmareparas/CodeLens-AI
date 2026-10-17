"use client";

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import {
  startAudit,
  getUserAudits,
  getAudit,
  type AuditResponse,
} from "@/lib/api-client";
import { TelemetryBentoGrid } from "@/components/TelemetryBentoGrid";

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

  const handleAnalyze = async (urlToAnalyze?: string) => {
    const targetUrl = (urlToAnalyze ?? repoUrl).trim();
    if (!targetUrl) {
      setError("Please enter a valid GitHub repository URL.");
      return;
    }

    setError(null);
    setIsLoading(true);
    setStatusMessage("Extracting GitHub telemetry & streaming in-memory zipball...");

    try {
      const response = await startAudit(targetUrl, backendToken);
      setActiveAudit(response);
      setStatusMessage("Deterministic telemetry and static analysis completed!");

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

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
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
            onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            style={{
              padding: "0.45rem 0.85rem",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--color-border)",
              background: "rgba(255, 255, 255, 0.04)",
              color: "var(--color-text-muted)",
              cursor: "pointer",
              fontSize: "0.8rem",
            }}
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* ── Ingestion Form / Hero ─────────────────────────────────────────── */}
      <section
        style={{
          background: "linear-gradient(180deg, rgba(99, 102, 241, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)",
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
              color: "var(--color-primary-light)",
              fontSize: "0.75rem",
              fontWeight: 600,
              marginBottom: "0.5rem",
            }}
          >
            Phase 2: Zero-Disk Pipeline
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
              background: "rgba(0, 0, 0, 0.4)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              color: "#fff",
              fontSize: "0.95rem",
              fontFamily: "var(--font-mono)",
              outline: "none",
            }}
          />
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
                background: "rgba(255, 255, 255, 0.03)",
                color: "var(--color-primary-light)",
                cursor: "pointer",
                fontSize: "0.75rem",
                fontFamily: "var(--font-mono)",
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
            Your Audit History
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
                    background: isSelected ? "rgba(99, 102, 241, 0.2)" : "rgba(255, 255, 255, 0.02)",
                    color: isSelected ? "#fff" : "var(--color-text-muted)",
                    fontSize: "0.8rem",
                    fontFamily: "var(--font-mono)",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
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

      {/* ── Active Audit Telemetry Bento Grid ─────────────────────────────── */}
      {activeAudit?.telemetry ? (
        <section style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "0.5rem" }}>
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-text)" }}>
                {activeAudit.repoUrl.replace("https://github.com/", "")}
              </h2>
              <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                Audited on {new Date(activeAudit.createdAt).toLocaleString()} • Status: {activeAudit.status}
              </p>
            </div>
            <a
              href={activeAudit.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: "0.8rem",
                color: "var(--color-primary-light)",
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
              }}
            >
              View on GitHub ↗
            </a>
          </div>

          <TelemetryBentoGrid repoUrl={activeAudit.repoUrl} telemetry={activeAudit.telemetry} />
        </section>
      ) : activeAudit && !isLoading ? (
        <div
          style={{
            padding: "2rem",
            textAlign: "center",
            color: "var(--color-text-muted)",
            border: "1px dashed var(--color-border)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          Audit status: {activeAudit.status}. Click &quot;Analyze Repository&quot; to begin scanning.
        </div>
      ) : null}
    </div>
  );
}
