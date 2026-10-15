import type { Metadata } from "next";
import SignInPage from "./SignInPage";

export const metadata: Metadata = {
  title: "Sign In — CodeLens AI",
  description: "Sign in to CodeLens AI to analyze GitHub repositories with AI-powered intelligence.",
};

export default function Page() {
  return <SignInPage />;
}
