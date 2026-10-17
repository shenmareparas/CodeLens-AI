import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AuditWorkspaceClient } from "@/app/dashboard/audit/[id]/AuditWorkspaceClient";

export const metadata: Metadata = {
  title: "Audit Workspace | CodeLens AI",
  description: "Interactive architecture canvas, dossier viewer, and grounded repository copilot.",
};

interface AuditWorkspacePageProps {
  params: Promise<{ id: string }>;
}

export default async function AuditWorkspacePage({ params }: AuditWorkspacePageProps) {
  const session = await auth();
  if (!session) {
    redirect("/auth/signin");
  }

  const { id } = await params;

  return (
    <main style={{ minHeight: "100vh", background: "var(--color-bg)", color: "var(--color-text)" }}>
      <AuditWorkspaceClient
        auditId={id}
        backendToken={session.backendToken ?? ""}
        userName={session.user?.name}
      />
    </main>
  );
}
