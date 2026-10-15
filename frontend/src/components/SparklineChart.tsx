"use client";

import { useId } from "react";

interface SparklineChartProps {
  data: number[];
  width?: number;
  height?: number;
  strokeColor?: string;
}

export function SparklineChart({
  data,
  width = 320,
  height = 90,
  strokeColor = "#818cf8",
}: SparklineChartProps) {
  const gradientId = useId();

  if (!data || data.length === 0) {
    return (
      <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
        No commit data available
      </div>
    );
  }

  const padding = 12;
  const graphWidth = width - padding * 2;
  const graphHeight = height - padding * 2;

  const maxVal = Math.max(...data, 1);
  const minVal = 0;

  const points = data.map((val, idx) => {
    const x = padding + (idx / Math.max(1, data.length - 1)) * graphWidth;
    const y = padding + graphHeight - ((val - minVal) / (maxVal - minVal)) * graphHeight;
    return { x, y, val, week: idx + 1 };
  });

  const pathD = points.reduce((acc, curr, idx) => {
    return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
  }, "");

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  const totalCommits = data.reduce((a, b) => a + b, 0);

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          8-Week Velocity
        </span>
        <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text)" }}>
          {totalCommits} total commits
        </span>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: "100%", height: "auto", overflow: "visible" }}
        role="img"
        aria-label="8-week commit activity trend"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Shaded Area */}
        <path d={areaD} fill={`url(#${gradientId})`} />

        {/* Sparkline Stroke */}
        <path
          d={pathD}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {points.map((pt, i) => (
          <g key={i}>
            <circle
              cx={pt.x}
              cy={pt.y}
              r="3.5"
              fill="#09090b"
              stroke={strokeColor}
              strokeWidth="2"
            >
              <title>{`Week ${pt.week}: ${pt.val} commits`}</title>
            </circle>
          </g>
        ))}
      </svg>
    </div>
  );
}
