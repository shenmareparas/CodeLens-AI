import { useState, useMemo } from "react";

interface LanguageDistributionCardProps {
  languages: Record<string, number>;
  languageColors: Record<string, string>;
  cardStyle: React.CSSProperties;
  sectionHeadingStyle: React.CSSProperties;
}

export function LanguageDistributionCard({
  languages,
  languageColors,
  cardStyle,
  sectionHeadingStyle,
}: LanguageDistributionCardProps) {
  const [viewMode, setViewMode] = useState<"bar" | "donut">("bar");
  const [hoveredLang, setHoveredLang] = useState<string | null>(null);

  // Sort languages descending by percentage
  const entries = useMemo(() => {
    return Object.entries(languages).sort((a, b) => b[1] - a[1]);
  }, [languages]);

  const primaryLang = entries[0] ? entries[0][0] : null;
  const primaryPct = entries[0] ? entries[0][1] : 0;
  const activeLang = hoveredLang || primaryLang;
  const activePct = activeLang && languages[activeLang] !== undefined ? languages[activeLang] : 0;
  const activeColor = activeLang ? languageColors[activeLang] || "#818cf8" : "#818cf8";

  // SVG Circular Donut geometry
  // Radius = 58, Circumference = 2 * PI * 58 = 364.425
  const radius = 58;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;
  const segments = entries.map(([lang, pct]) => {
    const strokeDasharray = `${(pct / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -((cumulativePercent / 100) * circumference);
    cumulativePercent += pct;
    return {
      lang,
      pct,
      color: languageColors[lang] || "#818cf8",
      strokeDasharray,
      strokeDashoffset,
    };
  });

  return (
    <div
      style={{
        ...cardStyle,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div>
        {/* ── Card Header with Controls ────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "0.5rem",
            marginBottom: "0.85rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
            <span style={{ fontSize: "1.1rem" }}>🌐</span>
            <h3 style={{ ...sectionHeadingStyle, margin: 0 }}>Language Distribution</h3>
          </div>

          {entries.length > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: "var(--color-surface)",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--color-border)",
                padding: "2px",
                gap: "2px",
              }}
            >
              <button
                type="button"
                onClick={() => setViewMode("bar")}
                title="Detailed Bar & Breakdown View"
                style={{
                  padding: "0.22rem 0.6rem",
                  borderRadius: "4px",
                  border: "none",
                  background: viewMode === "bar" ? "var(--color-primary)" : "transparent",
                  color: viewMode === "bar" ? "#ffffff" : "var(--color-text-muted)",
                  fontSize: "0.74rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  fontWeight: viewMode === "bar" ? 600 : 500,
                  transition: "var(--transition-fast)",
                }}
              >
                <span>📊</span>
                <span>Bar</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("donut")}
                title="Circular Donut & Ratio View"
                style={{
                  padding: "0.22rem 0.6rem",
                  borderRadius: "4px",
                  border: "none",
                  background: viewMode === "donut" ? "var(--color-primary)" : "transparent",
                  color: viewMode === "donut" ? "#ffffff" : "var(--color-text-muted)",
                  fontSize: "0.74rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  fontWeight: viewMode === "donut" ? 600 : 500,
                  transition: "var(--transition-fast)",
                }}
              >
                <span>🍩</span>
                <span>Circular</span>
              </button>
            </div>
          )}
        </div>

        {entries.length === 0 ? (
          <div
            style={{
              padding: "2rem 1rem",
              textAlign: "center",
              color: "var(--color-text-muted)",
              fontSize: "0.85rem",
            }}
          >
            No language files detected in this repository.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* ── Active / Dominant Focus Banner ─────────────────────────────── */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.6rem 0.85rem",
                borderRadius: "var(--radius-md)",
                background: "var(--color-badge-bg)",
                border: "1px solid var(--color-border-subtle)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <span
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    background: activeColor,
                    boxShadow: `0 0 10px ${activeColor}`,
                  }}
                />
                <div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem" }}>
                    <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--color-text)" }}>
                      {activeLang}
                    </span>
                    {hoveredLang ? (
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
                      <span
                        style={{
                          fontSize: "0.68rem",
                          color: "var(--color-text-muted)",
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                        }}
                      >
                        Dominant Stack
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", marginTop: "0.1rem" }}>
                    {activeLang === primaryLang
                      ? `Makes up the majority codebase volume`
                      : `Secondary language in active use`}
                  </div>
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontSize: "1.3rem",
                    fontWeight: 700,
                    fontFamily: "var(--font-mono)",
                    color: activeColor,
                    lineHeight: 1,
                  }}
                >
                  {activePct}%
                </div>
                <div style={{ fontSize: "0.68rem", color: "var(--color-text-muted)", marginTop: "0.2rem" }}>
                  of total source bytes
                </div>
              </div>
            </div>

            {/* ── View Mode: Stacked Bar & Progress Breakdown ─────────────────── */}
            {viewMode === "bar" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                {/* Visual Multi-Segment Bar */}
                <div>
                  <div
                    style={{
                      display: "flex",
                      height: "16px",
                      borderRadius: "8px",
                      overflow: "hidden",
                      width: "100%",
                      background: "rgba(255, 255, 255, 0.05)",
                      boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.25)",
                      border: "1px solid var(--color-border-subtle)",
                      padding: "2px",
                      gap: "2px",
                    }}
                  >
                    {entries.map(([lang, pct]) => {
                      const isHovered = hoveredLang === lang;
                      const color = languageColors[lang] || "#818cf8";
                      return (
                        <div
                          key={lang}
                          title={`${lang}: ${pct}%`}
                          onMouseEnter={() => setHoveredLang(lang)}
                          onMouseLeave={() => setHoveredLang(null)}
                          style={{
                            width: `${pct}%`,
                            background: color,
                            borderRadius: "4px",
                            opacity: hoveredLang && !isHovered ? 0.35 : 1,
                            transform: isHovered ? "scaleY(1.15)" : "scaleY(1)",
                            transition: "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
                            cursor: "pointer",
                          }}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Individual Language Progress Rows filling available space */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                  {entries.map(([lang, pct]) => {
                    const isHovered = hoveredLang === lang;
                    const color = languageColors[lang] || "#818cf8";
                    return (
                      <div
                        key={lang}
                        onMouseEnter={() => setHoveredLang(lang)}
                        onMouseLeave={() => setHoveredLang(null)}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.25rem",
                          padding: "0.35rem 0.55rem",
                          borderRadius: "var(--radius-sm)",
                          background: isHovered ? "var(--color-surface-hover)" : "transparent",
                          border: "1px solid",
                          borderColor: isHovered ? "var(--color-border)" : "transparent",
                          transition: "all 0.15s ease",
                          cursor: "pointer",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                            <span
                              style={{
                                width: "8px",
                                height: "8px",
                                borderRadius: "50%",
                                background: color,
                                flexShrink: 0,
                              }}
                            />
                            <span
                              style={{
                                fontSize: "0.82rem",
                                fontWeight: isHovered ? 600 : 500,
                                color: isHovered ? color : "var(--color-text)",
                              }}
                            >
                              {lang}
                            </span>
                          </div>
                          <span
                            style={{
                              fontSize: "0.78rem",
                              fontFamily: "var(--font-mono)",
                              fontWeight: 600,
                              color: isHovered ? color : "var(--color-text-muted)",
                            }}
                          >
                            {pct}%
                          </span>
                        </div>

                        {/* Thin proportional bar */}
                        <div
                          style={{
                            width: "100%",
                            height: "5px",
                            borderRadius: "99px",
                            background: "var(--color-border-subtle)",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${pct}%`,
                              height: "100%",
                              background: color,
                              borderRadius: "99px",
                              transition: "width 0.3s ease",
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* ── View Mode: Circular Donut Chart ────────────────────────── */
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "150px 1fr",
                  alignItems: "center",
                  gap: "1.25rem",
                  padding: "0.4rem 0",
                }}
              >
                {/* SVG Donut Chart */}
                <div style={{ position: "relative", width: "140px", height: "140px", margin: "0 auto" }}>
                  <svg
                    viewBox="0 0 140 140"
                    style={{
                      width: "100%",
                      height: "100%",
                      transform: "rotate(-90deg)",
                      overflow: "visible",
                    }}
                    role="img"
                    aria-label="Language distribution circular donut chart"
                  >
                    {/* Background track circle */}
                    <circle
                      cx="70"
                      cy="70"
                      r={radius}
                      fill="transparent"
                      stroke="var(--color-border-subtle)"
                      strokeWidth="15"
                    />

                    {/* Colored segments */}
                    {segments.map((seg) => {
                      const isHovered = hoveredLang === seg.lang;
                      return (
                        <circle
                          key={seg.lang}
                          cx="70"
                          cy="70"
                          r={radius}
                          fill="transparent"
                          stroke={seg.color}
                          strokeWidth={isHovered ? "19" : "15"}
                          strokeDasharray={seg.strokeDasharray}
                          strokeDashoffset={seg.strokeDashoffset}
                          opacity={hoveredLang && !isHovered ? 0.35 : 1}
                          onMouseEnter={() => setHoveredLang(seg.lang)}
                          onMouseLeave={() => setHoveredLang(null)}
                          style={{
                            cursor: "pointer",
                            transition: "stroke-width 0.18s ease, opacity 0.18s ease",
                          }}
                        >
                          <title>{`${seg.lang}: ${seg.pct}%`}</title>
                        </circle>
                      );
                    })}
                  </svg>

                  {/* Donut Center Display */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      pointerEvents: "none",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.95rem",
                        fontWeight: 700,
                        color: activeColor,
                        fontFamily: "var(--font-mono)",
                        lineHeight: 1,
                      }}
                    >
                      {activePct}%
                    </span>
                    <span
                      style={{
                        fontSize: "0.68rem",
                        color: "var(--color-text)",
                        fontWeight: 600,
                        maxWidth: "80px",
                        textAlign: "center",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        marginTop: "0.2rem",
                      }}
                    >
                      {activeLang}
                    </span>
                  </div>
                </div>

                {/* Right-hand side legend list in circular mode */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  {entries.map(([lang, pct]) => {
                    const isHovered = hoveredLang === lang;
                    const color = languageColors[lang] || "#818cf8";
                    return (
                      <button
                        key={lang}
                        type="button"
                        onMouseEnter={() => setHoveredLang(lang)}
                        onMouseLeave={() => setHoveredLang(null)}
                        onClick={() => setHoveredLang(hoveredLang === lang ? null : lang)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "0.35rem 0.6rem",
                          borderRadius: "var(--radius-sm)",
                          background: isHovered ? "var(--color-surface-hover)" : "var(--color-badge-bg)",
                          border: "1px solid",
                          borderColor: isHovered ? color : "var(--color-border-subtle)",
                          cursor: "pointer",
                          transition: "var(--transition-fast)",
                          textAlign: "left",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", overflow: "hidden" }}>
                          <span
                            style={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              background: color,
                              flexShrink: 0,
                            }}
                          />
                          <span
                            style={{
                              fontSize: "0.78rem",
                              fontWeight: isHovered ? 600 : 500,
                              color: isHovered ? color : "var(--color-text)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {lang}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontFamily: "var(--font-mono)",
                            fontWeight: 600,
                            color: isHovered ? color : "var(--color-text-muted)",
                            marginLeft: "0.5rem",
                          }}
                        >
                          {pct}%
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Footer Insight Pill ────────────────────────────────────────────── */}
      {entries.length > 0 && (
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
            {entries.length} {entries.length === 1 ? "language" : "languages"} detected
          </span>
          <span>{primaryLang ? `Primary: ${primaryLang} (${primaryPct}%)` : ""}</span>
        </div>
      )}
    </div>
  );
}
