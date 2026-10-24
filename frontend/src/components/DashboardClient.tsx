import { useState, useEffect } from "react";
import {
  startAudit,
  getUserAudits,
  type AuditResponse,
} from "@/lib/api-client";
import { DashboardHeader } from "@/components/DashboardHeader";
import { ActiveAuditSection } from "@/components/ActiveAuditSection";
import { RepoInputForm } from "@/components/RepoInputForm";
import { RecentAuditChips } from "@/components/RecentAuditChips";
import { ChatDrawer } from "@/components/ChatDrawer";
import styles from "./DashboardClient.module.css";

interface DashboardClientProps {
  userName?: string | null;
  userEmail?: string | null;
  userAvatar?: string | null;
  backendToken: string;
  onLogout?: () => void;
}

export function DashboardClient({
  userName,
  userEmail,
  userAvatar,
  backendToken,
  onLogout,
}: DashboardClientProps) {
  const [repoUrl, setRepoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAudits, setIsLoadingAudits] = useState(true);
  const [isForceRefresh, setIsForceRefresh] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [activeAudit, setActiveAudit] = useState<AuditResponse | null>(null);
  const [recentAudits, setRecentAudits] = useState<AuditResponse[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Load previous audits on mount with loading skeleton support
  useEffect(() => {
    if (!backendToken) {
      setIsLoadingAudits(false);
      return;
    }

    setIsLoadingAudits(true);
    getUserAudits(backendToken)
      .then((audits) => {
        setRecentAudits(audits);
        if (audits.length > 0 && audits[0].telemetry) {
          setActiveAudit(audits[0]);
        }
      })
      .catch((err) => {
        console.error("Failed to load user audits:", err);
      })
      .finally(() => {
        setIsLoadingAudits(false);
      });
  }, [backendToken]);

  const handleAnalyze = async (
    urlToAnalyze?: string,
    forceRefresh: boolean = false,
  ) => {
    const targetUrl = (urlToAnalyze ?? repoUrl).trim();
    if (!targetUrl) {
      setError("Please enter a valid GitHub repository URL.");
      return;
    }

    setError(null);
    setIsLoading(true);
    setIsForceRefresh(forceRefresh);
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
      const msg =
        err instanceof Error ? err.message : "Failed to analyze repository.";
      setError(msg);
    } finally {
      setIsLoading(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleSelectAudit = (auditSummary: AuditResponse) => {
    setError(null);
    setActiveAudit(auditSummary);
  };

  return (
    <div className={styles.container}>
      {/* ── Top Bar ───────────────────────────────────────────────────────── */}
      <DashboardHeader
        userName={userName}
        userEmail={userEmail}
        avatarUrl={userAvatar}
        onSignOut={() => onLogout?.()}
      />

      {/* ── Ingestion Form / Hero ─────────────────────────────────────────── */}
      <RepoInputForm
        repoUrl={repoUrl}
        setRepoUrl={setRepoUrl}
        isLoading={isLoading}
        isForceRefresh={isForceRefresh}
        statusMessage={statusMessage}
        error={error}
        hasRecentAudits={recentAudits.length > 0}
        onAnalyze={handleAnalyze}
      />

      {/* ── Recent Audits Chips ───────────────────────────────────────────── */}
      <RecentAuditChips
        recentAudits={recentAudits}
        activeAudit={activeAudit}
        isLoadingAudits={isLoadingAudits}
        onSelectAudit={handleSelectAudit}
      />

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

      {/* ── AI Chat Drawer, Backdrop & Floating FAB ──────────────────────── */}
      <ChatDrawer
        activeAudit={activeAudit}
        backendToken={backendToken}
        isChatOpen={isChatOpen}
        onOpenChat={() => setIsChatOpen(true)}
        onCloseChat={() => setIsChatOpen(false)}
      />
    </div>
  );
}
