import { useEffect, useRef, useState, useId, memo } from "react";
import mermaid from "mermaid";
import { useTheme } from "@/context/ThemeContext";
import { sanitizeMermaid } from "@/lib/mermaidUtils";

interface InlineMermaidBlockProps {
  code: string;
}

// In-memory cache for rendered SVGs keyed by theme + sanitized code
const svgRenderCache = new Map<string, string>();

function InlineMermaidBlockComponent({ code }: InlineMermaidBlockProps) {
  const { resolvedTheme } = useTheme();
  const rawId = useId();
  const containerId = `mermaid-chat-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const cleanCode = sanitizeMermaid(code);
  const cacheKey = `${resolvedTheme}:${cleanCode}`;

  const [svgHtml, setSvgHtml] = useState<string>(() => svgRenderCache.get(cacheKey) || "");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // If already cached for this exact theme & code, serve immediately without re-initializing/re-rendering
    const cached = svgRenderCache.get(cacheKey);
    if (cached) {
      setSvgHtml(cached);
      setError(null);
      return;
    }

    let active = true;
    const isDark = resolvedTheme === "dark";

    try {
      mermaid.initialize({
        startOnLoad: false,
        theme: isDark ? "dark" : "default",
        themeVariables: isDark
          ? {
              darkMode: true,
              background: "#18181b",
              primaryColor: "#6366f1",
              primaryTextColor: "#f4f4f5",
              primaryBorderColor: "rgba(99, 102, 241, 0.4)",
              lineColor: "#818cf8",
              secondaryColor: "#1e1b4b",
              tertiaryColor: "#18181b",
            }
          : {
              darkMode: false,
              background: "#ffffff",
              primaryColor: "#4f46e5",
              primaryTextColor: "#0f172a",
              primaryBorderColor: "#cbd5e1",
              lineColor: "#6366f1",
              secondaryColor: "#e0e7ff",
              tertiaryColor: "#f1f5f9",
            },
        securityLevel: "loose",
        fontFamily: "var(--font-mono)",
      });

      mermaid
        .render(containerId, cleanCode)
        .then(({ svg }) => {
          svgRenderCache.set(cacheKey, svg);
          if (active && isMountedRef.current) {
            setSvgHtml(svg);
            setError(null);
          }
        })
        .catch((err) => {
          if (active && isMountedRef.current) {
            setError(err instanceof Error ? err.message : "Failed to render flowchart");
          }
        });
    } catch (e) {
      if (active && isMountedRef.current) {
        setError(e instanceof Error ? e.message : "Mermaid initialization error");
      }
    }

    return () => {
      active = false;
    };
  }, [cacheKey, cleanCode, containerId, resolvedTheme]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard error
    }
  };

  if (error) {
    return (
      <div
        style={{
          margin: "0.5rem 0",
          padding: "0.75rem",
          borderRadius: "var(--radius-sm)",
          background: "var(--color-code-bg)",
          border: "1px solid var(--color-border)",
          fontFamily: "var(--font-mono)",
          fontSize: "0.78rem",
          overflowX: "auto",
        }}
      >
        <div style={{ color: "var(--color-warning)", marginBottom: "0.4rem", fontSize: "0.75rem" }}>
          ⚠️ Could not render flowchart (raw Mermaid source below):
        </div>
        <pre style={{ margin: 0, color: "var(--color-text)" }}>
          <code>{code}</code>
        </pre>
      </div>
    );
  }

  return (
    <div
      style={{
        margin: "0.75rem 0",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--color-border)",
        background: "var(--color-surface)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.15)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.45rem 0.75rem",
          borderBottom: "1px solid var(--color-border-subtle)",
          background: "rgba(0, 0, 0, 0.2)",
          fontSize: "0.72rem",
          fontFamily: "var(--font-mono)",
          color: "var(--color-text-muted)",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
          <span>📊</span>
          <span>Flow Diagram</span>
        </span>
        <button
          type="button"
          onClick={handleCopy}
          style={{
            padding: "0.2rem 0.5rem",
            background: "transparent",
            border: "1px solid var(--color-border)",
            borderRadius: "4px",
            color: copied ? "var(--color-success)" : "var(--color-text-muted)",
            fontSize: "0.7rem",
            cursor: "pointer",
            transition: "var(--transition-fast)",
          }}
        >
          {copied ? "✓ Copied" : "Copy Code"}
        </button>
      </div>

      <div
        style={{
          padding: "1rem",
          overflowX: "auto",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "120px",
        }}
      >
        {svgHtml ? (
          <div
            dangerouslySetInnerHTML={{ __html: svgHtml }}
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
            }}
          />
        ) : (
          <div style={{ color: "var(--color-text-muted)", fontSize: "0.75rem", fontStyle: "italic" }}>
            Rendering flowchart...
          </div>
        )}
      </div>
    </div>
  );
}

export const InlineMermaidBlock = memo(InlineMermaidBlockComponent);
