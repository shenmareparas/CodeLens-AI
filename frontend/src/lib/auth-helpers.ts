import { auth } from "@/auth";
import { exchangeGoogleToken } from "@/lib/api-client";
import { redirect } from "next/navigation";
import type { Session } from "next-auth";

/**
 * Retrieves the current session on the server side.
 * Redirects to /auth/signin if the user is not authenticated.
 */
export async function requireSession(): Promise<Session> {
  const session = await auth();
  if (!session) redirect("/auth/signin");
  return session;
}

/**
 * Retrieves the backend JWT from the session.
 * If it hasn't been fetched yet, exchanges the Google id_token and returns it.
 * This is called in Server Components or Server Actions only.
 */
export async function getBackendToken(): Promise<string> {
  const session = await requireSession();

  if (session.backendToken) {
    return session.backendToken;
  }

  // Fall back to exchanging the Google id_token
  // In a full implementation, store this in the JWT callback
  throw new Error("Backend token not found in session. Ensure JWT callback is wired correctly.");
}

/**
 * Exchanges the Google id_token for a backend JWT.
 * Called from the NextAuth JWT callback after sign-in.
 */
export async function fetchBackendToken(idToken: string): Promise<string> {
  const { token } = await exchangeGoogleToken(idToken);
  return token;
}
