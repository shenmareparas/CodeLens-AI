import type { AuditResponse } from "@/lib/api-client";
import styles from "./DashboardClient.module.css";

interface RecentAuditChipsProps {
  recentAudits: AuditResponse[];
  activeAudit: AuditResponse | null;
  isLoadingAudits?: boolean;
  onSelectAudit: (audit: AuditResponse) => void;
}

export function RecentAuditChips({
  recentAudits,
  activeAudit,
  isLoadingAudits = false,
  onSelectAudit,
}: RecentAuditChipsProps) {
  if (isLoadingAudits) {
    return (
      <section className={styles.recentSection}>
        <span className={styles.recentTitle}>Your Recent Repositories</span>
        <div className={styles.recentChipsList}>
          <div className={styles.skeletonChip} />
          <div className={styles.skeletonChip} />
          <div className={styles.skeletonChip} />
        </div>
      </section>
    );
  }

  if (recentAudits.length === 0) {
    return null;
  }

  return (
    <section className={styles.recentSection}>
      <span className={styles.recentTitle}>Your Recent Repositories</span>
      <div className={styles.recentChipsList}>
        {recentAudits.map((audit) => {
          const isSelected = activeAudit?.auditId === audit.auditId;
          const cleanName = audit.repoUrl.replace("https://github.com/", "");
          return (
            <button
              key={audit.auditId}
              type="button"
              onClick={() => onSelectAudit(audit)}
              className={`${styles.recentChip} ${
                isSelected ? styles.recentChipSelected : ""
              }`}
            >
              <span>📦</span>
              <span>{cleanName}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
