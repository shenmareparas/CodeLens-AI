import { useState, useMemo } from "react";
import type { HotspotEntry } from "@/lib/api-client";

interface HotspotTableProps {
  hotspots: HotspotEntry[];
}

export function HotspotTable({ hotspots }: HotspotTableProps) {
  const [filter, setFilter] = useState("");
  const [sortBy, setSortBy] = useState<"score" | "complexity" | "churn">(
    "score",
  );

  const filtered = useMemo(() => {
    const trimmedFilter = filter.trim().toLowerCase();
    const list = trimmedFilter
      ? hotspots.filter((h) => h.file.toLowerCase().includes(trimmedFilter))
      : hotspots;

    return [...list].sort((a, b) => {
      if (sortBy === "score") return b.score - a.score;
      if (sortBy === "complexity") return b.complexity - a.complexity;
      return b.churn - a.churn;
    });
  }, [hotspots, filter, sortBy]);

  const getRiskBadge = (score: number, complexity: number) => {
    if (score >= 20 || complexity >= 25) {
      return {
        label: "Critical",
        bg: "rgba(239, 68, 68, 0.15)",
        border: "rgba(239, 68, 68, 0.35)",
        text: "#f87171",
      };
    }
    if (score >= 10 || complexity >= 12) {
      return {
        label: "Moderate",
        bg: "rgba(245, 158, 11, 0.15)",
        border: "rgba(245, 158, 11, 0.35)",
        text: "#fbbf24",
      };
    }
    return {
      label: "Low",
      bg: "rgba(34, 197, 94, 0.15)",
      border: "rgba(34, 197, 94, 0.35)",
      text: "#4ade80",
    };
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        width: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <input
          type="text"
          placeholder="Filter hotspots by filename..."
          aria-label="Filter hotspots by filename"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            flex: "1 1 200px",
            padding: "0.5rem 0.85rem",
            background: "var(--color-input-bg)",
            border: "1px solid var(--color-input-border)",
            borderRadius: "var(--radius-sm)",
            color: "var(--color-input-text)",
            fontSize: "0.85rem",
            outline: "none",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "0.8rem",
            color: "var(--color-text-muted)",
          }}
        >
          <span>Sort by:</span>
          {(["score", "complexity", "churn"] as const).map((criteria) => (
            <button
              key={criteria}
              type="button"
              onClick={() => setSortBy(criteria)}
              style={{
                padding: "0.25rem 0.6rem",
                borderRadius: "var(--radius-sm)",
                border: "1px solid",
                borderColor:
                  sortBy === criteria
                    ? "var(--color-primary)"
                    : "var(--color-border)",
                background:
                  sortBy === criteria ? "var(--color-badge-bg)" : "transparent",
                color:
                  sortBy === criteria
                    ? "var(--color-primary)"
                    : "var(--color-text-muted)",
                cursor: "pointer",
                fontSize: "0.75rem",
                textTransform: "capitalize",
              }}
            >
              {criteria === "score" ? "Risk Score" : criteria}
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          overflowX: "auto",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--color-border)",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            textAlign: "left",
            fontSize: "0.85rem",
          }}
        >
          <thead>
            <tr
              style={{
                background: "var(--color-surface)",
                borderBottom: "1px solid var(--color-border)",
              }}
            >
              <th
                style={{
                  padding: "0.75rem 1rem",
                  color: "var(--color-text-muted)",
                  fontWeight: 500,
                }}
              >
                Rank
              </th>
              <th
                style={{
                  padding: "0.75rem 1rem",
                  color: "var(--color-text-muted)",
                  fontWeight: 500,
                }}
              >
                File Path
              </th>
              <th
                style={{
                  padding: "0.75rem 1rem",
                  color: "var(--color-text-muted)",
                  fontWeight: 500,
                  textAlign: "right",
                }}
              >
                Complexity
              </th>
              <th
                style={{
                  padding: "0.75rem 1rem",
                  color: "var(--color-text-muted)",
                  fontWeight: 500,
                  textAlign: "right",
                }}
              >
                Churn
              </th>
              <th
                style={{
                  padding: "0.75rem 1rem",
                  color: "var(--color-text-muted)",
                  fontWeight: 500,
                  textAlign: "right",
                }}
              >
                Risk Score
              </th>
              <th
                style={{
                  padding: "0.75rem 1rem",
                  color: "var(--color-text-muted)",
                  fontWeight: 500,
                  textAlign: "center",
                }}
              >
                Level
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    padding: "2rem",
                    textAlign: "center",
                    color: "var(--color-text-muted)",
                  }}
                >
                  No hotspots matching filter
                </td>
              </tr>
            ) : (
              filtered.map((hotspot, idx) => {
                const risk = getRiskBadge(hotspot.score, hotspot.complexity);
                return (
                  <tr
                    key={hotspot.file}
                    style={{
                      borderBottom: "1px solid var(--color-border-subtle)",
                      background:
                        idx % 2 === 0
                          ? "transparent"
                          : "var(--color-surface-hover)",
                    }}
                  >
                    <td
                      style={{
                        padding: "0.75rem 1rem",
                        color: "var(--color-text-muted)",
                        width: "50px",
                      }}
                    >
                      #{idx + 1}
                    </td>
                    <td
                      style={{
                        padding: "0.75rem 1rem",
                        maxWidth: "340px",
                        wordBreak: "break-all",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.8rem",
                          color: "var(--color-text)",
                        }}
                      >
                        {hotspot.file}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "0.75rem 1rem",
                        textAlign: "right",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {hotspot.complexity}
                    </td>
                    <td
                      style={{
                        padding: "0.75rem 1rem",
                        textAlign: "right",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {hotspot.churn}
                    </td>
                    <td
                      style={{
                        padding: "0.75rem 1rem",
                        textAlign: "right",
                        fontFamily: "var(--font-mono)",
                        fontWeight: 600,
                        color: risk.text,
                      }}
                    >
                      {hotspot.score.toFixed(2)}
                    </td>
                    <td
                      style={{ padding: "0.75rem 1rem", textAlign: "center" }}
                    >
                      <span
                        style={{
                          display: "inline-block",
                          padding: "0.2rem 0.55rem",
                          borderRadius: "99px",
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          background: risk.bg,
                          border: `1px solid ${risk.border}`,
                          color: risk.text,
                        }}
                      >
                        {risk.label}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
