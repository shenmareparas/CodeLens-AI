import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardClient } from "./DashboardClient";

export const metadata: Metadata = {
  title: "Dashboard | CodeLens AI",
  description: "Deterministic repository intelligence & static code analysis dashboard.",
};


export default async function DashboardPage() {
  const session = await auth();
  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <main style={{ minHeight: "100vh", background: "var(--color-bg)", color: "var(--color-text)" }}>
      <DashboardClient
        userName={session.user?.name}
        userEmail={session.user?.email}
        backendToken={session.backendToken ?? ""}
      />
    </main>
  );
}
