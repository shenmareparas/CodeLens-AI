"use client";

import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

interface MermaidViewerProps {
  chart: string;
  title?: string;
}

export function MermaidViewer({ chart, title = "Architecture Diagram (C4 Component)" }: MermaidViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>("");
  const [zoom, setZoom] = useState(1);
  const [copied, setCopied] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "dark",
      themeVariables: {
        darkMode: true,
        background: "#09090b",
        primaryColor: "#6366f1",
        primaryTextColor: "#f4f4f5",
        primaryBorderColor: "rgba(99, 102, 241, 0.4)",
        lineColor: "#818cf8",
        secondaryColor: "#1e1b4b",
        tertiaryColor: "#18181b",
      },
      securityLevel: "loose",
      fontFamily: "var(--font-mono)",
    });

    const renderChart = async () => {
      if (!chart || !chart.trim()) return;
      try {
        setRenderError(null);
        const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        const { svg } = await mermaid.render(id, chart.trim());
        setSvgContent(svg);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to render Mermaid diagram";
        setRenderError(message);
      }
    };

    renderChart();
  }, [chart]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(chart);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleResetZoom = () => setZoom(1);
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.2, 2.5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.2, 0.5));

  return (
    <div
      style={{
        borderRadius: "var(--radius-lg)",
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0.75rem 1.25rem",
          borderBottom: "1px solid var(--color-border)",
          background: "rgba(0, 0, 0, 0.3)",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "1.1rem" }}>🗺️</span>
          <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text)" }}>
            {title}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "rgba(255, 255, 255, 0.04)",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--color-border)",
            }}
          >
            <button
              type="button"
              onClick={handleZoomOut}
              title="Zoom Out"
              style={{
                padding: "0.25rem 0.6rem",
                background: "transparent",
                border: "none",
                color: "var(--color-text-muted)",
                cursor: "pointer",
                fontSize: "0.85rem",
              }}
            >
              −
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              title="Reset Zoom"
              style={{
                padding: "0.25rem 0.6rem",
                background: "transparent",
                border: "none",
                color: "var(--color-text)",
                cursor: "pointer",
                fontSize: "0.75rem",
                fontFamily: "var(--font-mono)",
                borderLeft: "1px solid var(--color-border)",
                borderRight: "1px solid var(--color-border)",
              }}
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              title="Zoom In"
              style={{
                padding: "0.25rem 0.6rem",
                background: "transparent",
                border: "none",
                color: "var(--color-text-muted)",
                cursor: "pointer",
                fontSize: "0.85rem",
              }}
            >
              +
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyCode}
            style={{
              padding: "0.3rem 0.75rem",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--color-border)",
              background: copied ? "rgba(34, 197, 94, 0.15)" : "rgba(255, 255, 255, 0.04)",
              color: copied ? "var(--color-success)" : "var(--color-text-muted)",
              cursor: "pointer",
              fontSize: "0.75rem",
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
            }}
          >
            <span>{copied ? "✓" : "📋"}</span>
            <span>{copied ? "Copied" : "Copy Mermaid"}</span>
          </button>
        </div>
      </div>

      {/* ── Diagram Canvas ────────────────────────────────────────────────── */}
      <div
        ref={containerRef}
        style={{
          minHeight: "360px",
          padding: "1.5rem",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          overflow: "auto",
          background: "radial-gradient(ellipse at center, rgba(99, 102, 241, 0.05) 0%, transparent 70%)",
        }}
      >
        {renderError ? (
          <div
            style={{
              maxWidth: "500px",
              padding: "1rem",
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "var(--radius-sm)",
              color: "#f87171",
              fontSize: "0.8rem",
              fontFamily: "var(--font-mono)",
            }}
          >
            <div>Unable to render interactive diagram. Raw definition below:</div>
            <pre style={{ marginTop: "0.5rem", whiteSpace: "pre-wrap" }}>{chart}</pre>
          </div>
        ) : svgContent ? (
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "center center",
              transition: "transform 0.15s ease-out",
              width: "100%",
              display: "flex",
              justifyContent: "center",
            }}
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        ) : (
          <div style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
            Rendering architecture diagram...
          </div>
        )}
      </div>
    </div>
  );
}
