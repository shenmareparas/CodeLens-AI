"use client";

import { useId, useState, useRef, useMemo } from "react";
import { useTheme } from "@/context/ThemeContext";
import type { CommitActivityPoint } from "@/lib/api-client";

interface SparklineChartProps {
  data: number[];
  commitTimeline?: CommitActivityPoint[];
  allTimeTotalCommits?: number;
  width?: number;
  height?: number;
  strokeColor?: string;
}

export function SparklineChart({
  data,
  commitTimeline,
  allTimeTotalCommits,
  width = 380,
  height = 160,
  strokeColor = "#818cf8",
}: SparklineChartProps) {
  const gradientId = useId();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Normalize data points using commitTimeline if available, otherwise weekly data
  const hasTimeline = Boolean(commitTimeline && commitTimeline.length > 0);

  const timelinePoints = useMemo(() => {
    if (hasTimeline && commitTimeline) {
      return commitTimeline.map((item, idx) => ({
        val: item.commits,
        label: item.label,
        dateRange: item.dateRange,
        idx,
      }));
    }

    const safeData = data ?? [];
    return safeData.map((val, idx) => ({
      val,
      label: `Week ${idx + 1}`,
      dateRange: `Past 8 Weeks (W${idx + 1})`,
      idx,
    }));
  }, [hasTimeline, commitTimeline, data]);

  const paddingLeft = 20;
  const paddingRight = 20;
  const paddingTop = 22;
  const paddingBottom = 34; // extra room for month/year X-axis labels

  const graphWidth = width - (paddingLeft + paddingRight);
  const graphHeight = height - (paddingTop + paddingBottom);

  const points = useMemo(() => {
    if (timelinePoints.length === 0) return [];
    const maxVal = Math.max(...timelinePoints.map((p) => p.val), 1);
    const minVal = 0;
    return timelinePoints.map((pt, idx) => {
      const x = paddingLeft + (idx / Math.max(1, timelinePoints.length - 1)) * graphWidth;
      const y = paddingTop + graphHeight - ((pt.val - minVal) / (maxVal - minVal)) * graphHeight;
      return {
        ...pt,
        x,
        y,
      };
    });
  }, [timelinePoints, graphWidth, graphHeight]);

  const totalCommits = useMemo(
    () => timelinePoints.reduce((acc, curr) => acc + curr.val, 0),
    [timelinePoints]
  );
  const avgCommits = useMemo(
    () => Math.round(totalCommits / Math.max(1, timelinePoints.length)),
    [totalCommits, timelinePoints.length]
  );

  if (!points || points.length === 0) {
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
        No commit history available
      </div>
    );
  }

  const pathD = points.reduce((acc, curr, idx) => {
    return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
  }, "");

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`;

  const activePoint = hoveredIdx !== null && hoveredIdx >= 0 && hoveredIdx < points.length ? points[hoveredIdx] : null;

  // Track cursor across SVG for smooth hovering
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * width;

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

  // Determine selective X-axis labels (first, middle/quarter, last) to keep it clean
  const labelIndices = useMemo(() => {
    const len = points.length;
    if (len <= 4) return points.map((_, i) => i);
    if (len <= 8) return [0, Math.floor(len / 2), len - 1];
    return [0, Math.floor(len / 3), Math.floor((len * 2) / 3), len - 1];
  }, [points]);

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
                  {activePoint ? activePoint.label : (hasTimeline ? "All-Time Commit History" : "8-Week Commit Activity")}
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
                  ? `${activePoint.val} commits (${activePoint.dateRange})`
                  : allTimeTotalCommits && allTimeTotalCommits > 0
                  ? `${allTimeTotalCommits.toLocaleString()} commits across repository lifetime`
                  : `${totalCommits} commits across time`}
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
                ? "commits in period"
                : allTimeTotalCommits && allTimeTotalCommits > 0
                ? "all-time commits"
                : "recorded commits"}
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
            aria-label="Interactive commit history trend graph"
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

            {/* X-Axis Month / Date Labels */}
            {labelIndices.map((idx) => {
              const pt = points[idx];
              if (!pt) return null;
              const isFirst = idx === 0;
              const isLast = idx === points.length - 1;
              const textAnchor = isFirst ? "start" : isLast ? "end" : "middle";

              return (
                <text
                  key={`xaxis-${idx}`}
                  x={pt.x}
                  y={height - paddingBottom + 16}
                  textAnchor={textAnchor}
                  fill="var(--color-text-muted)"
                  fontSize="10"
                  fontFamily="var(--font-mono)"
                  opacity={0.85}
                >
                  {pt.label}
                </text>
              );
            })}

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
                  transform={`translate(${Math.min(
                    Math.max(activePoint.x, 60),
                    width - 60
                  )}, ${Math.max(activePoint.y - 18, 12)})`}
                >
                  <rect
                    x="-50"
                    y="-14"
                    width="100"
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

      {/* ── Footer Insight Pill ── */}
      <div
        style={{
          marginTop: "0.85rem",
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
            : "Recorded timeline"}
        </span>
        <span style={{ fontFamily: "var(--font-mono)" }}>
          {hasTimeline
            ? `~${avgCommits} commits/period avg`
            : `~${avgCommits} commits/wk average`}
        </span>
      </div>
    </div>
  );
}
