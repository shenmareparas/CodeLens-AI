import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Analyze a GitHub repository with CodeLens AI.",
};

// Allow blocking prerender — this page requires auth
export const instant = false;

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/auth/signin");

  return (
    <main style={{ padding: "2rem", color: "#fff" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>
        Welcome, {session.user?.name?.split(" ")[0]} 👋
      </h1>
      <p style={{ color: "rgba(255,255,255,0.5)" }}>
        Phase 2 will add the repository analysis form and telemetry dashboard here.
      </p>
    </main>
  );
}
