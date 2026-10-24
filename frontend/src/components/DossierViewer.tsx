"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface DossierViewerProps {
  markdown: string;
  auditId?: string;
  onDownloadSas?: () => Promise<void>;
  isDownloading?: boolean;
}

export function DossierViewer({
  markdown,
  onDownloadSas,
  isDownloading = false,
}: DossierViewerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div
      style={{
        borderRadius: "var(--radius-lg)",
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      {/* ── Dossier Toolbar ──────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0.75rem 1.25rem",
          borderBottom: "1px solid var(--color-border)",
          background: "var(--color-header-bg)",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "1.1rem" }}>📄</span>
          <span
            style={{
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "var(--color-text)",
            }}
          >
            PROJECT_KNOWLEDGE.md
          </span>
          <span
            style={{
              fontSize: "0.7rem",
              padding: "0.15rem 0.45rem",
              borderRadius: "var(--radius-sm)",
              background: "var(--color-badge-bg)",
              color: "var(--color-primary)",
              fontFamily: "var(--font-mono)",
            }}
          >
            Gemini 3.8 Flash Dossier
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button
            type="button"
            onClick={handleCopyMarkdown}
            style={{
              padding: "0.3rem 0.75rem",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--color-border)",
              background: copied
                ? "rgba(34, 197, 94, 0.15)"
                : "rgba(255, 255, 255, 0.04)",
              color: copied
                ? "var(--color-success)"
                : "var(--color-text-muted)",
              cursor: "pointer",
              fontSize: "0.75rem",
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
            }}
          >
            <span>{copied ? "✓" : "📋"}</span>
            <span>{copied ? "Copied" : "Copy Markdown"}</span>
          </button>

          {onDownloadSas && (
            <button
              type="button"
              disabled={isDownloading}
              onClick={onDownloadSas}
              style={{
                padding: "0.3rem 0.75rem",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--color-border)",
                background: "var(--color-badge-bg)",
                color: "var(--color-primary)",
                cursor: isDownloading ? "not-allowed" : "pointer",
                fontSize: "0.75rem",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
              }}
            >
              <span>{isDownloading ? "⏳" : "⬇️"}</span>
              <span>
                {isDownloading ? "Generating SAS..." : "Download .md"}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* ── Markdown Content Render ──────────────────────────────────────── */}
      <div
        style={{
          padding: "1.5rem",
          overflowY: "auto",
          fontSize: "0.9rem",
          lineHeight: "1.7",
          color: "var(--color-text)",
        }}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ ...props }) => (
              <h1
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  marginTop: "1rem",
                  marginBottom: "0.75rem",
                  color: "var(--color-text)",
                  borderBottom: "1px solid var(--color-border)",
                  paddingBottom: "0.4rem",
                }}
                {...props}
              />
            ),
            h2: ({ ...props }) => (
              <h2
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 600,
                  marginTop: "1.5rem",
                  marginBottom: "0.5rem",
                  color: "var(--color-text)",
                }}
                {...props}
              />
            ),
            h3: ({ ...props }) => (
              <h3
                style={{
                  fontSize: "1.05rem",
                  fontWeight: 600,
                  marginTop: "1.2rem",
                  marginBottom: "0.4rem",
                  color: "var(--color-primary)",
                }}
                {...props}
              />
            ),
            p: ({ ...props }) => (
              <p
                style={{ marginBottom: "0.85rem", color: "var(--color-text)" }}
                {...props}
              />
            ),
            code: ({ className, children, ...props }) => {
              const isInline = !className;
              return isInline ? (
                <code
                  style={{
                    background: "var(--color-badge-bg)",
                    border: "1px solid var(--color-border)",
                    padding: "0.15rem 0.4rem",
                    borderRadius: "4px",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.82rem",
                    color: "var(--color-primary)",
                  }}
                  {...props}
                >
                  {children}
                </code>
              ) : (
                <pre
                  style={{
                    background: "var(--color-code-bg)",
                    border: "1px solid var(--color-border)",
                    padding: "1rem",
                    borderRadius: "var(--radius-sm)",
                    overflowX: "auto",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.82rem",
                    margin: "0.75rem 0",
                    color: "var(--color-text)",
                  }}
                >
                  <code>{children}</code>
                </pre>
              );
            },
            blockquote: ({ ...props }) => (
              <blockquote
                style={{
                  borderLeft: "3px solid var(--color-primary)",
                  paddingLeft: "1rem",
                  margin: "1rem 0",
                  color: "var(--color-text-muted)",
                  fontStyle: "italic",
                }}
                {...props}
              />
            ),
            table: ({ ...props }) => (
              <div style={{ overflowX: "auto", margin: "1rem 0" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "0.82rem",
                    border: "1px solid var(--color-border)",
                  }}
                  {...props}
                />
              </div>
            ),
            th: ({ ...props }) => (
              <th
                style={{
                  padding: "0.5rem 0.75rem",
                  borderBottom: "1px solid var(--color-border)",
                  background: "var(--color-surface)",
                  textAlign: "left",
                  fontWeight: 600,
                  color: "var(--color-text)",
                }}
                {...props}
              />
            ),
            td: ({ ...props }) => (
              <td
                style={{
                  padding: "0.5rem 0.75rem",
                  borderBottom: "1px solid var(--color-border)",
                  color: "var(--color-text-muted)",
                }}
                {...props}
              />
            ),
            ul: ({ ...props }) => (
              <ul
                style={{ paddingLeft: "1.5rem", marginBottom: "0.85rem" }}
                {...props}
              />
            ),
            ol: ({ ...props }) => (
              <ol
                style={{ paddingLeft: "1.5rem", marginBottom: "0.85rem" }}
                {...props}
              />
            ),
            li: ({ ...props }) => (
              <li style={{ marginBottom: "0.3rem" }} {...props} />
            ),
          }}
        >
          {markdown}
        </ReactMarkdown>
      </div>
    </div>
  );
}
