import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "CodeLens AI — Repository Intelligence",
  description:
    "CodeLens AI analyzes GitHub repositories to deliver architectural insights, complexity heatmaps, dead code detection, and AI-powered onboarding dossiers.",
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
