import type { AuditResponse } from "@/lib/api-client";
import { RepoChatSidebar } from "@/components/RepoChatSidebar";
import styles from "./DashboardClient.module.css";

interface ChatDrawerProps {
  activeAudit: AuditResponse | null;
  backendToken: string;
  isChatOpen: boolean;
  onOpenChat: () => void;
  onCloseChat: () => void;
}

export function ChatDrawer({
  activeAudit,
  backendToken,
  isChatOpen,
  onOpenChat,
  onCloseChat,
}: ChatDrawerProps) {
  if (!activeAudit) return null;

  const repoName = activeAudit.repoUrl.replace("https://github.com/", "");

  return (
    <>
      {/* ── Floating Ask AI Button (Bottom Right Corner) ─────────────────── */}
      {!isChatOpen && (
        <button type="button" onClick={onOpenChat} className={styles.fabButton}>
          <span className={styles.fabSparkle}>✨</span>
          <span>Ask AI</span>
        </button>
      )}

      {/* ── Slide-over Right Side Panel (Drawer) ───────────────────────────── */}
      <div
        aria-hidden={!isChatOpen}
        className={`${styles.drawer} ${isChatOpen ? styles.drawerOpen : ""}`}
      >
        <RepoChatSidebar
          key={activeAudit.auditId}
          auditId={activeAudit.auditId}
          backendToken={backendToken}
          repoName={repoName}
          isOpen={isChatOpen}
          onClose={onCloseChat}
        />
      </div>

      {/* ── Backdrop Overlay ─────────────────────────────────────────────── */}
      {isChatOpen && (
        <button
          type="button"
          aria-label="Close AI Chat Drawer"
          onClick={onCloseChat}
          className={styles.drawerBackdrop}
        />
      )}
    </>
  );
}
