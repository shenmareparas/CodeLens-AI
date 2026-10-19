interface ThinkingLinesProps {
  repoName: string;
}

export function ThinkingLines({ repoName }: ThinkingLinesProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.55rem",
        padding: "0.25rem 0",
      }}
    >
      {/* Claude-style Thinking header pill */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.45rem",
          fontSize: "0.76rem",
          fontWeight: 600,
          color: "var(--color-primary-light)",
          fontFamily: "var(--font-mono)",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            gap: "3px",
            alignItems: "center",
          }}
        >
          <span
            style={{
              width: "4px",
              height: "4px",
              borderRadius: "50%",
              background: "var(--color-primary-light)",
              animation: "subtleBounce 1.4s infinite ease-in-out",
            }}
          />
          <span
            style={{
              width: "4px",
              height: "4px",
              borderRadius: "50%",
              background: "var(--color-primary-light)",
              animation: "subtleBounce 1.4s infinite ease-in-out",
              animationDelay: "0.2s",
            }}
          />
          <span
            style={{
              width: "4px",
              height: "4px",
              borderRadius: "50%",
              background: "var(--color-primary-light)",
              animation: "subtleBounce 1.4s infinite ease-in-out",
              animationDelay: "0.4s",
            }}
          />
        </span>
        <span>Thinking & Grounding on {repoName}...</span>
      </div>

      {/* Claude-like animated skeleton pulse lines */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", width: "100%", maxWidth: "340px" }}>
        <div
          style={{
            height: "9px",
            borderRadius: "4px",
            width: "92%",
            background:
              "linear-gradient(90deg, rgba(99, 102, 241, 0.12) 0%, rgba(99, 102, 241, 0.35) 50%, rgba(99, 102, 241, 0.12) 100%)",
            backgroundSize: "200% 100%",
            animation: "claudeThinkingShimmer 1.6s infinite linear",
          }}
        />
        <div
          style={{
            height: "9px",
            borderRadius: "4px",
            width: "74%",
            background:
              "linear-gradient(90deg, rgba(99, 102, 241, 0.12) 0%, rgba(99, 102, 241, 0.35) 50%, rgba(99, 102, 241, 0.12) 100%)",
            backgroundSize: "200% 100%",
            animation: "claudeThinkingShimmer 1.6s infinite linear",
            animationDelay: "0.25s",
          }}
        />
        <div
          style={{
            height: "9px",
            borderRadius: "4px",
            width: "50%",
            background:
              "linear-gradient(90deg, rgba(99, 102, 241, 0.12) 0%, rgba(99, 102, 241, 0.35) 50%, rgba(99, 102, 241, 0.12) 100%)",
            backgroundSize: "200% 100%",
            animation: "claudeThinkingShimmer 1.6s infinite linear",
            animationDelay: "0.5s",
          }}
        />
      </div>
    </div>
  );
}
