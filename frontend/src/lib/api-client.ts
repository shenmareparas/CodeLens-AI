/**
 * Thin wrapper around the backend API.
 * All requests attach the backend JWT Bearer token from the session.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${options.method ?? "GET"} ${path} failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<T>;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface BackendAuthResponse {
  token: string;
  userId: string;
  email: string;
  name: string;
  avatarUrl?: string;
  authProviders: string[];
}

/**
 * Register with email and password on the CodeLens backend.
 */
export async function registerWithCredentials(
  name: string,
  email: string,
  password: string,
): Promise<BackendAuthResponse> {
  return apiRequest<BackendAuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

/**
 * Login with email and password on the CodeLens backend.
 */
export async function loginWithCredentials(
  email: string,
  password: string,
): Promise<BackendAuthResponse> {
  return apiRequest<BackendAuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

/**
 * Exchange the Google OAuth id_token for a CodeLens backend JWT.
 */
export async function exchangeGoogleToken(idToken: string): Promise<BackendAuthResponse> {
  return apiRequest<BackendAuthResponse>("/api/auth/google", {
    method: "POST",
    body: JSON.stringify({ idToken }),
  });
}

/**
 * Link a Google account to currently logged in user.
 */
export async function linkGoogleAccount(idToken: string, token: string): Promise<BackendAuthResponse> {
  return apiRequest<BackendAuthResponse>(
    "/api/auth/link-google",
    {
      method: "POST",
      body: JSON.stringify({ idToken }),
    },
    token,
  );
}

/**
 * Add or update local password for currently logged in user.
 */
export async function setAccountPassword(password: string, token: string): Promise<BackendAuthResponse> {
  return apiRequest<BackendAuthResponse>(
    "/api/auth/set-password",
    {
      method: "POST",
      body: JSON.stringify({ password }),
    },
    token,
  );
}

// ── Audits ────────────────────────────────────────────────────────────────────

export interface AuditResponse {
  auditId: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  repoUrl: string;
  createdAt: string;
  telemetry?: Record<string, unknown>;
  aiInsights?: Record<string, unknown>;
  dossierMarkdown?: string;
}

export async function startAudit(repoUrl: string, token: string): Promise<AuditResponse> {
  return apiRequest<AuditResponse>(
    "/api/audits/analyze",
    { method: "POST", body: JSON.stringify({ repoUrl }) },
    token,
  );
}

export async function getAudit(auditId: string, token: string): Promise<AuditResponse> {
  return apiRequest<AuditResponse>(`/api/audits/${auditId}`, {}, token);
}

export async function getDossierDownloadUrl(
  auditId: string,
  token: string,
): Promise<{ url: string }> {
  return apiRequest<{ url: string }>(`/api/audits/${auditId}/download`, {}, token);
}

// ── SSE Chat ──────────────────────────────────────────────────────────────────

/**
 * Opens an SSE stream to the backend chat endpoint.
 * Calls `onChunk` for each token and `onDone` when the stream closes.
 */
export function streamChat(
  auditId: string,
  message: string,
  token: string,
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError: (err: Error) => void,
): AbortController {
  const controller = new AbortController();

  (async () => {
    try {
      const res = await fetch(`${API_BASE}/api/chat/${auditId}/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "text/event-stream",
        },
        body: JSON.stringify({ message }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error(`SSE stream failed: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              onDone();
              return;
            }
            onChunk(data);
          }
        }
      }
      onDone();
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        onError(err as Error);
      }
    }
  })();

  return controller;
}
