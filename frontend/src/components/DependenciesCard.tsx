"use client";

import { useState, useMemo } from "react";
import type { DependencyEntry } from "@/lib/api-client";

interface DependenciesCardProps {
  dependencies: DependencyEntry[];
}

export function DependenciesCard({ dependencies }: DependenciesCardProps) {
  const [selectedEcosystem, setSelectedEcosystem] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Extract distinct ecosystems with package counts
  const ecosystemCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const dep of dependencies) {
      counts[dep.ecosystem] = (counts[dep.ecosystem] || 0) + 1;
    }
    return counts;
  }, [dependencies]);

  const uniqueEcosystems = useMemo(() => {
    return Object.keys(ecosystemCounts).sort();
  }, [ecosystemCounts]);

  // Filtered dependencies based on selected ecosystem pill and search query
  const filteredDependencies = useMemo(() => {
    return dependencies.filter((dep) => {
      const matchesEcosystem =
        selectedEcosystem === "ALL" || dep.ecosystem === selectedEcosystem;
      const matchesSearch =
        !searchQuery.trim() ||
        dep.package.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dep.version.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesEcosystem && matchesSearch;
    });
  }, [dependencies, selectedEcosystem, searchQuery]);

  const getEcosystemBadgeStyle = (eco: string) => {
    const lower = eco.toLowerCase();
    if (lower.includes("pub")) {
      return {
        bg: "rgba(0, 180, 171, 0.15)",
        text: "#2dd4bf",
        border: "rgba(0, 180, 171, 0.3)",
      };
    }
    if (lower.includes("bun")) {
      return {
        bg: "rgba(244, 114, 182, 0.15)",
        text: "#f472b6",
        border: "rgba(244, 114, 182, 0.3)",
      };
    }
    if (lower.includes("nuget")) {
      return {
        bg: "rgba(2, 132, 199, 0.15)",
        text: "#38bdf8",
        border: "rgba(2, 132, 199, 0.3)",
      };
    }
    if (lower.includes("npm")) {
      return {
        bg: "rgba(245, 158, 11, 0.15)",
        text: "#fbbf24",
        border: "rgba(245, 158, 11, 0.3)",
      };
    }
    if (lower.includes("pnpm")) {
      return {
        bg: "rgba(251, 146, 60, 0.15)",
        text: "#fb923c",
        border: "rgba(251, 146, 60, 0.3)",
      };
    }
    if (lower.includes("yarn")) {
      return {
        bg: "rgba(56, 189, 248, 0.15)",
        text: "#38bdf8",
        border: "rgba(56, 189, 248, 0.3)",
      };
    }
    if (lower.includes("pypi") || lower.includes("python")) {
      return {
        bg: "rgba(59, 130, 246, 0.15)",
        text: "#60a5fa",
        border: "rgba(59, 130, 246, 0.3)",
      };
    }
    if (lower.includes("go")) {
      return {
        bg: "rgba(6, 182, 212, 0.15)",
        text: "#22d3ee",
        border: "rgba(6, 182, 212, 0.3)",
      };
    }
    if (lower.includes("cargo") || lower.includes("rust")) {
      return {
        bg: "rgba(249, 115, 22, 0.15)",
        text: "#fb923c",
        border: "rgba(249, 115, 22, 0.3)",
      };
    }
    return {
      bg: "rgba(255, 255, 255, 0.08)",
      text: "var(--color-text-muted)",
      border: "rgba(255, 255, 255, 0.12)",
    };
  };

  return (
    <div
      style={{
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "var(--radius-lg)",
        padding: "1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.85rem",
      }}
    >
      {/* Header & Total Count */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <div>
          <h3
            style={{
              fontSize: "0.875rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--color-text-muted)",
              margin: 0,
            }}
          >
            Dependencies &amp; Ecosystem
          </h3>
          <p
            style={{
              fontSize: "0.75rem",
              color: "var(--color-text-muted)",
              margin: "0.15rem 0 0",
            }}
          >
            {filteredDependencies.length === dependencies.length
              ? `${dependencies.length} packages parsed`
              : `Showing ${filteredDependencies.length} of ${dependencies.length} packages`}
          </p>
        </div>

        {/* Quick Search */}
        {dependencies.length > 5 && (
          <input
            type="text"
            placeholder="Search packages..."
            aria-label="Search packages"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: "0.35rem 0.65rem",
              fontSize: "0.75rem",
              borderRadius: "6px",
              background: "var(--color-input-bg)",
              border: "1px solid var(--color-input-border)",
              color: "var(--color-input-text)",
              outline: "none",
              fontFamily: "inherit",
              width: "150px",
            }}
          />
        )}
      </div>

      {/* Ecosystem Filter Tabs / Pills */}
      {uniqueEcosystems.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.35rem",
            flexWrap: "wrap",
            paddingBottom: "0.25rem",
          }}
          role="toolbar"
          aria-label="Filter dependencies by ecosystem"
        >
          <button
            type="button"
            onClick={() => setSelectedEcosystem("ALL")}
            style={{
              fontSize: "0.72rem",
              fontWeight: 500,
              padding: "0.2rem 0.55rem",
              borderRadius: "99px",
              border:
                selectedEcosystem === "ALL"
                  ? "1px solid var(--color-primary)"
                  : "1px solid var(--color-border)",
              background:
                selectedEcosystem === "ALL"
                  ? "var(--color-primary)"
                  : "var(--color-surface)",
              color:
                selectedEcosystem === "ALL"
                  ? "#fff"
                  : "var(--color-text-muted)",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            All ({dependencies.length})
          </button>

          {uniqueEcosystems.map((eco) => {
            const isSelected = selectedEcosystem === eco;
            const count = ecosystemCounts[eco];
            const badgeStyle = getEcosystemBadgeStyle(eco);

            return (
              <button
                key={eco}
                type="button"
                onClick={() => setSelectedEcosystem(eco)}
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 500,
                  padding: "0.2rem 0.55rem",
                  borderRadius: "99px",
                  border: isSelected
                    ? `1px solid ${badgeStyle.border}`
                    : "1px solid var(--color-border)",
                  background: isSelected
                    ? badgeStyle.bg
                    : "var(--color-surface)",
                  color: isSelected
                    ? badgeStyle.text
                    : "var(--color-text-muted)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {eco} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Dependencies List */}
      {dependencies.length === 0 ? (
        <div style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
          No direct packages parsed from manifest files.
        </div>
      ) : filteredDependencies.length === 0 ? (
        <div
          style={{
            color: "var(--color-text-muted)",
            fontSize: "0.8rem",
            padding: "1rem 0",
            textAlign: "center",
          }}
        >
          No packages match your search filter.
        </div>
      ) : (
        <div
          style={{
            maxHeight: "320px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "0.4rem",
            paddingRight: "0.2rem",
          }}
        >
          {filteredDependencies.map((dep) => {
            const badgeStyle = getEcosystemBadgeStyle(dep.ecosystem);

            return (
              <div
                key={`${dep.ecosystem}-${dep.package}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "0.45rem 0.65rem",
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.04)",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.8rem",
                  gap: "0.5rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    minWidth: 0,
                    overflow: "hidden",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.68rem",
                      padding: "0.1rem 0.4rem",
                      borderRadius: "4px",
                      background: badgeStyle.bg,
                      color: badgeStyle.text,
                      border: `1px solid ${badgeStyle.border}`,
                      flexShrink: 0,
                      fontWeight: 500,
                    }}
                  >
                    {dep.ecosystem}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontWeight: 500,
                      color: "var(--color-text)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                    title={dep.package}
                  >
                    {dep.package}
                  </span>
                </div>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    color: "var(--color-primary-light)",
                    fontSize: "0.75rem",
                    flexShrink: 0,
                    background: "var(--color-badge-bg)",
                    padding: "0.1rem 0.4rem",
                    borderRadius: "4px",
                  }}
                >
                  {dep.version}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
