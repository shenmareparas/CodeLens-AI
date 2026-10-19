"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import mermaid from "mermaid";
import { useTheme } from "@/context/ThemeContext";
import { FullscreenMermaidModal } from "./FullscreenMermaidModal";

interface MermaidViewerProps {
  chart: string;
  title?: string;
}

export function MermaidViewer({ chart, title = "Architecture Diagram (C4 Component)" }: MermaidViewerProps) {
  const { resolvedTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const svgWrapperRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>("");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [copied, setCopied] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleOpenFullscreen = useCallback(() => setIsFullscreen(true), []);
  const handleCloseFullscreen = useCallback(() => setIsFullscreen(false), []);

  // Fit scale where 1.0 zoom (100%) fits the diagram comfortably in view
  const [baseFitScale, setBaseFitScale] = useState(1);

  // Dynamic zoom boundaries relative to the 100% fit view (fit to screen = 1.0 = min zoom)
  const [zoomLimits, setZoomLimits] = useState<{ min: number; max: number }>({
    min: 1.0,
    max: 3.5,
  });

  useEffect(() => {
    const isDark = resolvedTheme === "dark";
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
  }, [chart, resolvedTheme]);

  // Measure rendered SVG and calculate proportional fit-to-screen scale
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

      // Fit ratio so 1.0 (100%) fits the entire diagram comfortably in the viewport
      const fitRatioX = (containerWidth - 60) / svgWidth;
      const fitRatioY = (containerHeight - 60) / svgHeight;
      const fitScale = Math.min(fitRatioX, fitRatioY, 1.1);

      setBaseFitScale(fitScale);
      setZoomLimits({
        min: 1.0,
        max: 3.5,
      });

      // Fit to screen is 100% (zoom = 1)
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }, 50);

    return () => clearTimeout(timer);
  }, [svgContent]);

  // Helper to clamp pan offsets so diagram content cannot move out of the container screen
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

    // Visual dimensions of the rendered diagram based on baseFitScale * zoom
    const effectiveScale = baseFitScale * currentZoom;
    const renderedWidth = svgWidth * effectiveScale;
    const renderedHeight = svgHeight * effectiveScale;

    // If rendered diagram is smaller than or equal to container, keep centered (0)
    // If larger than container, allow panning only up to the diagram edges
    let clampedX = 0;
    if (renderedWidth > containerWidth) {
      const maxPanX = (renderedWidth - containerWidth) / 2 + 30;
      clampedX = Math.max(-maxPanX, Math.min(maxPanX, newX));
    } else {
      // Allow minor wiggle room (max 20px) but snap back within view
      const maxMargin = Math.max(0, (containerWidth - renderedWidth) / 4);
      clampedX = Math.max(-maxMargin, Math.min(maxMargin, newX));
    }

    let clampedY = 0;
    if (renderedHeight > containerHeight) {
      const maxPanY = (renderedHeight - containerHeight) / 2 + 30;
      clampedY = Math.max(-maxPanY, Math.min(maxPanY, newY));
    } else {
      const maxMargin = Math.max(0, (containerHeight - renderedHeight) / 4);
      clampedY = Math.max(-maxMargin, Math.min(maxMargin, newY));
    }

    return { x: clampedX, y: clampedY };
  };

  // Touchpad pinch-to-zoom and two-finger scroll panning with dynamic boundaries
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.ctrlKey || e.metaKey) {
        const zoomDelta = -e.deltaY * 0.008;
        const nextZoom = Math.min(Math.max(zoomLimits.min, zoom + zoomDelta), zoomLimits.max);
        setZoom(nextZoom);
        setPan((currentPan) => clampPan(currentPan.x, currentPan.y, nextZoom));
      } else {
        setPan((prev) => clampPan(prev.x - e.deltaX, prev.y - e.deltaY, zoom));
      }
    };

    const handleGesture = (e: Event) => {
      e.preventDefault();
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    container.addEventListener("gesturestart", handleGesture, { passive: false });
    container.addEventListener("gesturechange", handleGesture, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("gesturestart", handleGesture);
      container.removeEventListener("gesturechange", handleGesture);
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
    setZoom(1);
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
              disabled={zoom <= zoomLimits.min}
              title={zoom <= zoomLimits.min ? "Minimum zoom (Fit to Screen)" : "Zoom Out"}
              style={{
                padding: "0.25rem 0.6rem",
                background: "transparent",
                border: "none",
                color: zoom <= zoomLimits.min ? "var(--color-text-muted)" : "var(--color-text)",
                cursor: zoom <= zoomLimits.min ? "not-allowed" : "pointer",
                fontSize: "0.85rem",
                fontWeight: 600,
                opacity: zoom <= zoomLimits.min ? 0.5 : 1,
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

          {svgContent && !renderError && (
            <button
              type="button"
              onClick={handleOpenFullscreen}
              title="View Architecture Diagram Fullscreen"
              style={{
                padding: "0.3rem 0.75rem",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--color-border)",
                background: "var(--color-surface)",
                color: "var(--color-text)",
                cursor: "pointer",
                fontSize: "0.75rem",
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                transition: "var(--transition-fast)",
              }}
            >
              <span>⛶</span>
              <span>Fullscreen</span>
            </button>
          )}

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
        role="region"
        aria-label={title}
        tabIndex={0}
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
          background:
            resolvedTheme === "light"
              ? "radial-gradient(ellipse at center, rgba(79, 70, 229, 0.04) 0%, #f8fafc 75%)"
              : "radial-gradient(ellipse at center, rgba(99, 102, 241, 0.05) 0%, #09090b 75%)",
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
            background: resolvedTheme === "light" ? "rgba(255, 255, 255, 0.85)" : "rgba(0, 0, 0, 0.6)",
            padding: "0.2rem 0.5rem",
            borderRadius: "4px",
            border: resolvedTheme === "light" ? "1px solid rgba(0, 0, 0, 0.08)" : "1px solid rgba(255, 255, 255, 0.06)",
            boxShadow: resolvedTheme === "light" ? "0 2px 8px rgba(0, 0, 0, 0.05)" : "none",
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
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${baseFitScale * zoom})`,
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

      <FullscreenMermaidModal
        isOpen={isFullscreen}
        onClose={handleCloseFullscreen}
        svgHtml={svgContent}
        code={chart}
        resolvedTheme={resolvedTheme}
        title={title}
        icon="🗺️"
      />
    </div>
  );
}

