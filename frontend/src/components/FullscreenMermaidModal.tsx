import { useEffect, useRef, useState, memo } from "react";
import { createPortal } from "react-dom";

interface FullscreenMermaidModalProps {
  isOpen: boolean;
  onClose: () => void;
  svgHtml: string;
  code: string;
  resolvedTheme: string;
  title?: string;
  icon?: string;
}

function FullscreenMermaidModalComponent({
  isOpen,
  onClose,
  svgHtml,
  code,
  resolvedTheme,
  title = "Diagram Fullscreen",
  icon = "📊",
}: FullscreenMermaidModalProps) {
  const [fullscreenZoom, setFullscreenZoom] = useState(1);
  const [baseFitScale, setBaseFitScale] = useState(1);
  const [fullscreenPan, setFullscreenPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const svgWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  // Compute fit-to-screen scale when opening modal or when svgHtml changes
  useEffect(() => {
    if (!isOpen || !svgHtml) return;

    const timer = setTimeout(() => {
      const canvas = canvasRef.current;
      const svgEl = svgWrapperRef.current?.querySelector("svg");
      if (!canvas || !svgEl) return;

      const canvasWidth = canvas.clientWidth || window.innerWidth || 1200;
      const canvasHeight = canvas.clientHeight || window.innerHeight || 800;

      let svgWidth = svgEl.viewBox?.baseVal?.width || svgEl.getBoundingClientRect().width;
      let svgHeight = svgEl.viewBox?.baseVal?.height || svgEl.getBoundingClientRect().height;

      if (!svgWidth || svgWidth <= 0) svgWidth = 800;
      if (!svgHeight || svgHeight <= 0) svgHeight = 500;

      const fitRatioX = (canvasWidth - 80) / svgWidth;
      const fitRatioY = (canvasHeight - 80) / svgHeight;
      const fitScale = Math.min(fitRatioX, fitRatioY, 1.2);

      setBaseFitScale(fitScale);
      setFullscreenZoom(1);
      setFullscreenPan({ x: 0, y: 0 });
    }, 50);

    return () => clearTimeout(timer);
  }, [isOpen, svgHtml]);

  // Clamp pan offsets so diagram content never moves out of the screen bounds
  const clampPan = (newX: number, newY: number, currentZoom: number) => {
    const canvas = canvasRef.current;
    const svgEl = svgWrapperRef.current?.querySelector("svg");
    if (!canvas || !svgEl) return { x: newX, y: newY };

    const canvasWidth = canvas.clientWidth || window.innerWidth || 1200;
    const canvasHeight = canvas.clientHeight || window.innerHeight || 800;

    let svgWidth = svgEl.viewBox?.baseVal?.width || svgEl.getBoundingClientRect().width;
    let svgHeight = svgEl.viewBox?.baseVal?.height || svgEl.getBoundingClientRect().height;
    if (!svgWidth || svgWidth <= 0) svgWidth = 800;
    if (!svgHeight || svgHeight <= 0) svgHeight = 500;

    const effectiveScale = baseFitScale * currentZoom;
    const renderedWidth = svgWidth * effectiveScale;
    const renderedHeight = svgHeight * effectiveScale;

    let clampedX = 0;
    if (renderedWidth > canvasWidth) {
      const maxPanX = (renderedWidth - canvasWidth) / 2 + 40;
      clampedX = Math.max(-maxPanX, Math.min(maxPanX, newX));
    } else {
      const maxMargin = Math.max(0, (canvasWidth - renderedWidth) / 4);
      clampedX = Math.max(-maxMargin, Math.min(maxMargin, newX));
    }

    let clampedY = 0;
    if (renderedHeight > canvasHeight) {
      const maxPanY = (renderedHeight - canvasHeight) / 2 + 40;
      clampedY = Math.max(-maxPanY, Math.min(maxPanY, newY));
    } else {
      const maxMargin = Math.max(0, (canvasHeight - renderedHeight) / 4);
      clampedY = Math.max(-maxMargin, Math.min(maxMargin, newY));
    }

    return { x: clampedX, y: clampedY };
  };

  // Non-passive wheel event listener to strictly prevent browser page pinch-to-zoom
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.ctrlKey || e.metaKey) {
        // Trackpad pinch-to-zoom or Ctrl + mouse wheel (min 1.0 = fit to screen)
        const zoomFactor = -e.deltaY * 0.006;
        const nextZoom = Math.min(Math.max(fullscreenZoom + zoomFactor, 1.0), 4.0);
        setFullscreenZoom(nextZoom);
        setFullscreenPan((currentPan) => clampPan(currentPan.x, currentPan.y, nextZoom));
      } else {
        // Two-finger scroll or wheel panning
        setFullscreenPan((prev) => clampPan(prev.x - e.deltaX, prev.y - e.deltaY, fullscreenZoom));
      }
    };

    // Safari trackpad gestures
    const handleGesture = (e: Event) => {
      e.preventDefault();
    };

    canvas.addEventListener("wheel", handleWheel, { passive: false });
    canvas.addEventListener("gesturestart", handleGesture, { passive: false });
    canvas.addEventListener("gesturechange", handleGesture, { passive: false });

    return () => {
      canvas.removeEventListener("wheel", handleWheel);
      canvas.removeEventListener("gesturestart", handleGesture);
      canvas.removeEventListener("gesturechange", handleGesture);
    };
  }, [isOpen, fullscreenZoom, baseFitScale]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - fullscreenPan.x, y: e.clientY - fullscreenPan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const rawX = e.clientX - dragStartRef.current.x;
    const rawY = e.clientY - dragStartRef.current.y;
    setFullscreenPan(clampPan(rawX, rawY, fullscreenZoom));
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard error
    }
  };

  if (!isOpen || !svgHtml || typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Flow Diagram Fullscreen View"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: resolvedTheme === "dark" ? "rgba(9, 9, 11, 0.95)" : "rgba(255, 255, 255, 0.96)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        display: "flex",
        flexDirection: "column",
        animation: "fadeIn 0.15s ease-out",
      }}
    >
      {/* Fullscreen Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.75rem 1.5rem",
          borderBottom: "1px solid var(--color-border)",
          background: resolvedTheme === "dark" ? "rgba(24, 24, 27, 0.8)" : "rgba(241, 245, 249, 0.85)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span style={{ fontSize: "1.1rem" }}>{icon}</span>
          <div>
            <span style={{ fontWeight: 600, fontSize: "0.92rem", color: "var(--color-text)" }}>
              {title}
            </span>
            <span
              style={{
                marginLeft: "0.6rem",
                fontSize: "0.74rem",
                color: "var(--color-text-muted)",
                fontFamily: "var(--font-mono)",
              }}
            >
              (Esc to exit)
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          {/* Zoom Controls */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "var(--color-surface)",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--color-border)",
              overflow: "hidden",
            }}
          >
            <button
              type="button"
              onClick={() => setFullscreenZoom((z) => Math.max(z - 0.15, 1.0))}
              disabled={fullscreenZoom <= 1.0}
              title={fullscreenZoom <= 1.0 ? "Minimum zoom (Fit to Screen)" : "Zoom Out"}
              style={{
                padding: "0.3rem 0.65rem",
                background: "transparent",
                border: "none",
                color: fullscreenZoom <= 1.0 ? "var(--color-text-muted)" : "var(--color-text)",
                cursor: fullscreenZoom <= 1.0 ? "not-allowed" : "pointer",
                fontSize: "0.85rem",
                opacity: fullscreenZoom <= 1.0 ? 0.5 : 1,
              }}
            >
              −
            </button>
            <span
              style={{
                padding: "0 0.5rem",
                fontSize: "0.75rem",
                fontFamily: "var(--font-mono)",
                color: "var(--color-text-muted)",
                minWidth: "48px",
                textAlign: "center",
              }}
            >
              {Math.round(fullscreenZoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setFullscreenZoom((z) => Math.min(z + 0.15, 3.5))}
              title="Zoom In"
              style={{
                padding: "0.3rem 0.65rem",
                background: "transparent",
                border: "none",
                color: "var(--color-text)",
                cursor: "pointer",
                fontSize: "0.85rem",
              }}
            >
              +
            </button>
            <button
              type="button"
              onClick={() => {
                setFullscreenZoom(1);
                setFullscreenPan({ x: 0, y: 0 });
              }}
              title="Reset Scale"
              style={{
                padding: "0.3rem 0.65rem",
                background: "transparent",
                borderLeft: "1px solid var(--color-border)",
                color: "var(--color-text)",
                cursor: "pointer",
                fontSize: "0.72rem",
              }}
            >
              ↺ Reset
            </button>
          </div>

          {/* Copy Code */}
          <button
            type="button"
            onClick={handleCopy}
            style={{
              padding: "0.35rem 0.75rem",
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              color: copied ? "var(--color-success)" : "var(--color-text)",
              fontSize: "0.76rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              transition: "var(--transition-fast)",
            }}
          >
            <span>📋</span>
            <span>{copied ? "✓ Copied" : "Copy Code"}</span>
          </button>

          {/* Exit Fullscreen Button */}
          <button
            type="button"
            onClick={onClose}
            title="Exit Fullscreen (Esc)"
            style={{
              padding: "0.35rem 0.85rem",
              background: "var(--color-primary)",
              border: "none",
              borderRadius: "var(--radius-sm)",
              color: "#ffffff",
              fontSize: "0.82rem",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              transition: "var(--transition-fast)",
            }}
          >
            <span>✕</span>
            <span>Exit Fullscreen</span>
          </button>
        </div>
      </div>

      {/* Canvas area with drag-to-pan & pinch/wheel zoom */}
      <div
        ref={canvasRef}
        role="region"
        aria-label="Interactive Diagram Canvas"
        tabIndex={0}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          flex: 1,
          width: "100%",
          height: "100%",
          overflow: "hidden",
          position: "relative",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          cursor: isDragging ? "grabbing" : "grab",
          userSelect: "none",
          padding: "2rem",
          outline: "none",
        }}
      >
        {/* Gesture Hint overlay */}
        <div
          style={{
            position: "absolute",
            bottom: "1.25rem",
            left: "1.5rem",
            fontSize: "0.75rem",
            color: "var(--color-text-muted)",
            pointerEvents: "none",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            background: resolvedTheme === "dark" ? "rgba(0, 0, 0, 0.7)" : "rgba(255, 255, 255, 0.85)",
            padding: "0.3rem 0.65rem",
            borderRadius: "6px",
            border: "1px solid var(--color-border)",
          }}
        >
          <span>🖐️</span>
          <span>Drag mouse to pan • Trackpad pinch or Ctrl + Wheel to zoom • Esc to exit</span>
        </div>

        <div
          ref={svgWrapperRef}
          style={{
            transform: `translate(${fullscreenPan.x}px, ${fullscreenPan.y}px) scale(${baseFitScale * fullscreenZoom})`,
            transformOrigin: "center center",
            transition: isDragging ? "none" : "transform 0.08s ease-out",
            width: "100%",
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            pointerEvents: isDragging ? "none" : "auto",
          }}
          dangerouslySetInnerHTML={{ __html: svgHtml }}
        />
      </div>
    </div>,
    document.body,
  );
}

export const FullscreenMermaidModal = memo(FullscreenMermaidModalComponent);
