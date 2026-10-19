"use client";

import { useId, useState, useRef, useMemo } from "react";
import { useTheme } from "@/context/ThemeContext";

interface SparklineChartProps {
  data: number[];
  allTimeTotalCommits?: number;
  width?: number;
  height?: number;
  strokeColor?: string;
}

export function SparklineChart({
  data,
  allTimeTotalCommits,
  width = 340,
  height = 140,
  strokeColor = "#818cf8",
}: SparklineChartProps) {
  const gradientId = useId();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const safeData = data ?? [];
  const paddingLeft = 14;
  const paddingRight = 14;
  const paddingTop = 18;
  const paddingBottom = 20;

  const graphWidth = width - (paddingLeft + paddingRight);
  const graphHeight = height - (paddingTop + paddingBottom);

  const points = useMemo(() => {
    if (safeData.length === 0) return [];
    const maxVal = Math.max(...safeData, 1);
    const minVal = 0;
    return safeData.map((val, idx) => {
      const x = paddingLeft + (idx / Math.max(1, safeData.length - 1)) * graphWidth;
      const y = paddingTop + graphHeight - ((val - minVal) / (maxVal - minVal)) * graphHeight;
      return { x, y, val, week: idx + 1, idx };
    });
  }, [safeData, graphWidth, graphHeight]);

  const totalCommits = useMemo(() => safeData.reduce((a, b) => a + b, 0), [safeData]);
  const avgCommits = useMemo(() => Math.round(totalCommits / Math.max(1, safeData.length)), [totalCommits, safeData.length]);

  if (!data || data.length === 0) {
    return (
      <div
        style={{
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--color-text-muted)",
          fontSize: "0.85rem",
        }}
      >
        No commit data available
      </div>
    );
  }

  const pathD = points.reduce((acc, curr, idx) => {
    return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
  }, "");

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`;

  const activePoint = hoveredIdx !== null && hoveredIdx >= 0 && hoveredIdx < points.length ? points[hoveredIdx] : null;

  // Track cursor across SVG for smooth hovering only (no click lock)
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * width;

    // Find nearest point
    let closestDist = Infinity;
    let closestIndex = 0;
    points.forEach((pt, i) => {
      const dist = Math.abs(pt.x - mouseX);
      if (dist < closestDist) {
        closestDist = dist;
        closestIndex = i;
      }
    });

    setHoveredIdx(closestIndex);
  };

  const handleMouseLeave = () => {
    setHoveredIdx(null);
  };

  return (
    <div
      style={{
        width: "100%",
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div>
        {/* ── Interactive Focus Banner (Matches Language Distribution focus style) ── */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0.6rem 0.85rem",
            borderRadius: "var(--radius-md)",
            background: "var(--color-badge-bg)",
            border: "1px solid var(--color-border-subtle)",
            marginBottom: "0.85rem",
            minHeight: "56px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: strokeColor,
                boxShadow: `0 0 10px ${strokeColor}`,
              }}
            />
            <div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem" }}>
                <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--color-text)" }}>
                  {activePoint ? `Week ${activePoint.week}` : "8-Week Trend"}
                </span>
                {activePoint ? (
                  <span
                    style={{
                      fontSize: "0.68rem",
                      color: "var(--color-primary)",
                      background: "rgba(99, 102, 241, 0.12)",
                      padding: "0.1rem 0.35rem",
                      borderRadius: "4px",
                      fontWeight: 500,
                    }}
                  >
                    Inspecting
                  </span>
                ) : (
                  <span style={{ fontSize: "0.68rem", color: "var(--color-text-muted)" }}>
                    Hover timeline to inspect
                  </span>
                )}
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", marginTop: "0.1rem" }}>
                {activePoint
                  ? `${activePoint.val} commits pushed during this week`
                  : allTimeTotalCommits && allTimeTotalCommits > 0
                  ? `${allTimeTotalCommits.toLocaleString()} all-time commits across repository lifetime`
                  : `${totalCommits} total commits in the past 8 weeks`}
              </div>
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontSize: "1.3rem",
                fontWeight: 700,
                fontFamily: "var(--font-mono)",
                color: activePoint ? "var(--color-primary-light)" : "var(--color-text)",
                lineHeight: 1,
              }}
            >
              {activePoint
                ? activePoint.val
                : allTimeTotalCommits && allTimeTotalCommits > 0
                ? allTimeTotalCommits.toLocaleString()
                : totalCommits}
            </div>
            <div style={{ fontSize: "0.68rem", color: "var(--color-text-muted)", marginTop: "0.2rem" }}>
              {activePoint
                ? "commits that week"
                : allTimeTotalCommits && allTimeTotalCommits > 0
                ? "all-time commits"
                : "total commits (8w)"}
            </div>
          </div>
        </div>

        {/* ── Interactive SVG Sparkline Canvas ───────────────────────────────── */}
        <div style={{ position: "relative", padding: "0.25rem 0" }}>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${width} ${height}`}
            style={{
              width: "100%",
              height: "auto",
              overflow: "visible",
              cursor: "crosshair",
              touchAction: "none",
            }}
            role="img"
            aria-label="Interactive 8-week commit activity trend graph"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity={isDark ? "0.35" : "0.22"} />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
            </linearGradient>

            <filter id={`glow-${gradientId}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Reference baseline line */}
          <line
            x1={paddingLeft}
            y1={height - paddingBottom}
            x2={width - paddingRight}
            y2={height - paddingBottom}
            stroke="var(--color-border)"
            strokeDasharray="2 3"
            strokeWidth="1"
          />

          {/* Shaded Area */}
          <path d={areaD} fill={`url(#${gradientId})`} />

          {/* Sparkline Line */}
          <path
            d={pathD}
            fill="none"
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Hover guideline vertical crosshair */}
          {activePoint && (
            <g>
              <line
                x1={activePoint.x}
                y1={paddingTop}
                x2={activePoint.x}
                y2={height - paddingBottom}
                stroke={strokeColor}
                strokeWidth="1.5"
                strokeDasharray="3 3"
                opacity="0.8"
              />
              {/* Interactive Tooltip bubble inside SVG */}
              <g
                transform={`translate(${Math.min(Math.max(activePoint.x, 38), width - 38)}, ${Math.max(
                  activePoint.y - 18,
                  12,
                )})`}
              >
                <rect
                  x="-32"
                  y="-14"
                  width="64"
                  height="20"
                  rx="4"
                  fill={isDark ? "#18181b" : "#ffffff"}
                  stroke="var(--color-border)"
                  strokeWidth="1"
                  filter={`url(#glow-${gradientId})`}
                />
                <text
                  textAnchor="middle"
                  y="0"
                  fill="var(--color-text)"
                  fontSize="9.5"
                  fontWeight="600"
                  fontFamily="var(--font-mono)"
                >
                  {activePoint.val} commits
                </text>
              </g>
            </g>
          )}

          {/* Data Points */}
          {points.map((pt, i) => {
            const isActive = hoveredIdx === i;
            return (
              <g
                key={i}
                style={{ cursor: "pointer", transition: "transform 0.15s ease" }}
                onMouseEnter={() => setHoveredIdx(i)}
              >
                {/* Larger transparent hit target for easy mouse hover interaction */}
                <circle cx={pt.x} cy={pt.y} r="14" fill="transparent" />

                {/* Animated halo when active */}
                {isActive && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="8"
                    fill={strokeColor}
                    opacity="0.25"
                  />
                )}

                {/* Data point circle */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isActive ? "5" : "3.5"}
                  fill={isDark ? "#09090b" : "#ffffff"}
                  stroke={isActive ? "var(--color-primary-light)" : strokeColor}
                  strokeWidth={isActive ? "2.5" : "2"}
                />
              </g>
            );
          })}
        </svg>
      </div>
    </div>

      {/* ── Footer Insight Pill (Matches Language Distribution footer spacing) ── */}
      <div
        style={{
          marginTop: "1rem",
          paddingTop: "0.6rem",
          borderTop: "1px solid var(--color-border-subtle)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "0.72rem",
          color: "var(--color-text-muted)",
        }}
      >
        <span>
          {allTimeTotalCommits && allTimeTotalCommits > 0
            ? `All-Time: ${allTimeTotalCommits.toLocaleString()} commits`
            : "Last 8 weeks cadence"}
        </span>
        <span style={{ fontFamily: "var(--font-mono)" }}>~{avgCommits} commits/wk average</span>
      </div>
    </div>
  );
}
