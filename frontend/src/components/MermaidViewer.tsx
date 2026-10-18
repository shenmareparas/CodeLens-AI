"use client";

import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { useTheme } from "@/context/ThemeContext";

interface MermaidViewerProps {
  chart: string;
  title?: string;
}

export function MermaidViewer({ chart, title = "Architecture Diagram (C4 Component)" }: MermaidViewerProps) {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const svgWrapperRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>("");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [copied, setCopied] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  // Dynamic zoom boundaries based on diagram geometry
  const [zoomLimits, setZoomLimits] = useState<{ min: number; max: number; initial: number }>({
    min: 0.5,
    max: 2.2,
    initial: 1,
  });

  useEffect(() => {
    const isDark = theme === "dark";
    mermaid.initialize({
      startOnLoad: false,
      theme: isDark ? "dark" : "default",
      themeVariables: isDark
        ? {
            darkMode: true,
            background: "#09090b",
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
  }, [chart, theme]);

  // Measure rendered SVG and calculate proportional zoom bounds
  useEffect(() => {
    if (!svgContent || !containerRef.current || !svgWrapperRef.current) return;

    const timer = setTimeout(() => {
      const container = containerRef.current;
      const svgEl = svgWrapperRef.current?.querySelector("svg");
      if (!container || !svgEl) return;

      const containerWidth = container.clientWidth || 800;
      const containerHeight = container.clientHeight || 500;

      // Extract natural SVG dimensions
      let svgWidth = svgEl.viewBox?.baseVal?.width || svgEl.getBoundingClientRect().width;
      let svgHeight = svgEl.viewBox?.baseVal?.height || svgEl.getBoundingClientRect().height;

      if (!svgWidth || svgWidth <= 0) svgWidth = 800;
      if (!svgHeight || svgHeight <= 0) svgHeight = 500;

      // Fit ratio to show entire diagram comfortably in view
      const fitRatioX = (containerWidth - 60) / svgWidth;
      const fitRatioY = (containerHeight - 60) / svgHeight;
      const fitRatio = Math.min(fitRatioX, fitRatioY, 1.1);

      // Proportional dynamic boundaries:
      // - Min zoom: allows seeing full context without shrinking into an unreadable speck
      // - Max zoom: prevents over-zooming beyond legible glyph clarity
      const computedMin = Math.max(0.4, Math.round(fitRatio * 0.65 * 100) / 100);
      const computedMax = Math.min(3.0, Math.max(1.8, Math.round(fitRatio * 2.8 * 100) / 100));
      const computedInitial = Math.min(Math.max(computedMin, fitRatio), computedMax);

      setZoomLimits({
        min: computedMin,
        max: computedMax,
        initial: computedInitial,
      });

      setZoom(computedInitial);
      setPan({ x: 0, y: 0 });
    }, 50);

    return () => clearTimeout(timer);
  }, [svgContent]);

  // Helper to clamp pan offsets so diagram content cannot move fully out of the container viewport
  const clampPan = (newX: number, newY: number, currentZoom: number) => {
    const container = containerRef.current;
    const svgEl = svgWrapperRef.current?.querySelector("svg");
    if (!container || !svgEl) return { x: newX, y: newY };

    const containerWidth = container.clientWidth || 800;
    const containerHeight = container.clientHeight || 500;

    let svgWidth = svgEl.viewBox?.baseVal?.width || svgEl.getBoundingClientRect().width;
    let svgHeight = svgEl.viewBox?.baseVal?.height || svgEl.getBoundingClientRect().height;
    if (!svgWidth || svgWidth <= 0) svgWidth = 800;
    if (!svgHeight || svgHeight <= 0) svgHeight = 500;

    // Visual dimensions of the rendered diagram
    const renderedWidth = svgWidth * currentZoom;
    const renderedHeight = svgHeight * currentZoom;

    // Keep at least 100px or 25% of the diagram always visible inside the viewport
    const minVisibleX = Math.min(100, renderedWidth * 0.25);
    const minVisibleY = Math.min(100, renderedHeight * 0.25);

    const maxPanX = (containerWidth / 2) + (renderedWidth / 2) - minVisibleX;
    const minPanX = -maxPanX;

    const maxPanY = (containerHeight / 2) + (renderedHeight / 2) - minVisibleY;
    const minPanY = -maxPanY;

    return {
      x: Math.max(minPanX, Math.min(maxPanX, newX)),
      y: Math.max(minPanY, Math.min(maxPanY, newY)),
    };
  };

  // Touchpad pinch-to-zoom and two-finger scroll panning with dynamic boundaries
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey) {
        const zoomDelta = -e.deltaY * 0.008;
        const nextZoom = Math.min(Math.max(zoomLimits.min, zoom + zoomDelta), zoomLimits.max);
        setZoom(nextZoom);
        setPan((currentPan) => clampPan(currentPan.x, currentPan.y, nextZoom));
      } else {
        setPan((prev) => clampPan(prev.x - e.deltaX, prev.y - e.deltaY, zoom));
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, [zoomLimits, zoom]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const rawX = e.clientX - dragStartRef.current.x;
    const rawY = e.clientY - dragStartRef.current.y;
    setPan(clampPan(rawX, rawY, zoom));
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(chart);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleResetZoom = () => {
    setZoom(zoomLimits.initial);
    setPan({ x: 0, y: 0 });
  };
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.15, zoomLimits.max));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.15, zoomLimits.min));

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
              background: "var(--color-badge-bg)",
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
                color: "var(--color-text)",
                cursor: "pointer",
                fontSize: "0.85rem",
                fontWeight: 600,
              }}
            >
              −
            </button>
            <span
              style={{
                padding: "0.25rem 0.6rem",
                color: "var(--color-text)",
                fontSize: "0.75rem",
                fontFamily: "var(--font-mono)",
                fontWeight: 600,
                borderLeft: "1px solid var(--color-border)",
                borderRight: "1px solid var(--color-border)",
                userSelect: "none",
              }}
            >
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              title="Zoom In"
              style={{
                padding: "0.25rem 0.6rem",
                background: "transparent",
                border: "none",
                color: "var(--color-text)",
                cursor: "pointer",
                fontSize: "0.85rem",
                fontWeight: 600,
              }}
            >
              +
            </button>
          </div>

          <button
            type="button"
            onClick={handleResetZoom}
            title="Reset Zoom & Pan to Default"
            style={{
              padding: "0.3rem 0.65rem",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--color-border)",
              background: "var(--color-surface)",
              color: "var(--color-text)",
              cursor: "pointer",
              fontSize: "0.75rem",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
            }}
          >
            <span>↺</span>
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={handleCopyCode}
            style={{
              padding: "0.3rem 0.75rem",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--color-border)",
              background: copied ? "rgba(34, 197, 94, 0.15)" : "var(--color-surface)",
              color: copied ? "var(--color-success)" : "var(--color-text)",
              cursor: "pointer",
              fontSize: "0.75rem",
              fontWeight: 500,
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
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          minHeight: "440px",
          maxHeight: "720px",
          padding: "1.5rem",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          overflow: "hidden",
          position: "relative",
          cursor: isDragging ? "grabbing" : "grab",
          userSelect: "none",
          background: "radial-gradient(ellipse at center, rgba(99, 102, 241, 0.05) 0%, #09090b 75%)",
        }}
      >
        {/* Trackpad Gesture Guidance Overlay Hint */}
        <div
          style={{
            position: "absolute",
            bottom: "0.75rem",
            left: "1rem",
            fontSize: "0.72rem",
            color: "var(--color-text-muted)",
            pointerEvents: "none",
            display: "flex",
            alignItems: "center",
            gap: "0.35rem",
            background: "rgba(0, 0, 0, 0.6)",
            padding: "0.2rem 0.5rem",
            borderRadius: "4px",
            border: "1px solid rgba(255, 255, 255, 0.06)",
          }}
        >
          <span>🖐️</span>
          <span>Pinch trackpad to zoom • Two-finger drag or drag mouse to pan</span>
        </div>

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
            ref={svgWrapperRef}
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "center center",
              transition: isDragging ? "none" : "transform 0.08s ease-out",
              width: "100%",
              display: "flex",
              justifyContent: "center",
              pointerEvents: isDragging ? "none" : "auto",
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
