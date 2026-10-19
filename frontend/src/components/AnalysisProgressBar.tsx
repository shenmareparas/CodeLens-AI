import { useEffect, useState } from "react";
import { ANALYSIS_STEPS } from "./analysisSteps";

interface AnalysisProgressBarProps {
  isLoading: boolean;
  isForceRefresh?: boolean;
}

export function AnalysisProgressBar({ isLoading, isForceRefresh = false }: AnalysisProgressBarProps) {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [percent, setPercent] = useState(12);

  useEffect(() => {
    if (!isLoading) {
      setActiveStepIndex(0);
      setPercent(12);
      return;
    }

    // Step pacing intervals tailored to real-world backend analysis pipeline
    // Steps: 0: cache (0-1.5s), 1: telemetry/stream (1.5-4s), 2: AST (4-7s), 3: security/deps (7-10s), 4: Gemini (10-14s), 5: dossier (14s+)
    const stepDelays = [
      { step: 0, pct: 15, delay: 0 },
      { step: 1, pct: 32, delay: 1400 },
      { step: 2, pct: 54, delay: 3800 },
      { step: 3, pct: 72, delay: 6800 },
      { step: 4, pct: 88, delay: 9800 },
      { step: 5, pct: 95, delay: 13500 },
    ];

    const timeouts: ReturnType<typeof setTimeout>[] = [];

    stepDelays.forEach(({ step, pct, delay }) => {
      const timer = setTimeout(() => {
        setActiveStepIndex(step);
        setPercent(pct);
      }, delay);
      timeouts.push(timer);
    });

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [isLoading, isForceRefresh]);

  if (!isLoading) return null;

  const currentStep = ANALYSIS_STEPS[activeStepIndex] ?? ANALYSIS_STEPS[0];

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Repository analysis progress"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.85rem",
        padding: "1.15rem 1.25rem",
        background: "rgba(99, 102, 241, 0.08)",
        border: "1px solid rgba(99, 102, 241, 0.28)",
        borderRadius: "var(--radius-md)",
        boxShadow: "0 8px 24px rgba(99, 102, 241, 0.12)",
        animation: "fadeIn 0.3s ease-out",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      {/* Header with Step label, icon & percentage */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span
            style={{
              fontSize: "1.15rem",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "28px",
              height: "28px",
              borderRadius: "8px",
              background: "rgba(99, 102, 241, 0.15)",
              border: "1px solid rgba(99, 102, 241, 0.3)",
            }}
          >
            {currentStep.icon}
          </span>
          <div>
            <div
              style={{
                fontSize: "0.9rem",
                fontWeight: 600,
                color: "var(--color-text)",
                fontFamily: "var(--font-display)",
                display: "flex",
                alignItems: "center",
                gap: "0.45rem",
              }}
            >
              <span>{currentStep.label}</span>
              <span
                style={{
                  fontSize: "0.72rem",
                  padding: "0.15rem 0.45rem",
                  borderRadius: "999px",
                  background: "rgba(99, 102, 241, 0.2)",
                  color: "var(--color-primary-light)",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 600,
                }}
              >
                Step {activeStepIndex + 1}/{ANALYSIS_STEPS.length}
              </span>
            </div>
            <div
              style={{
                fontSize: "0.78rem",
                color: "var(--color-text-muted)",
                marginTop: "0.15rem",
              }}
            >
              {currentStep.detail}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontFamily: "var(--font-mono)",
            fontSize: "0.85rem",
            fontWeight: 700,
            color: "var(--color-primary-light)",
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "var(--color-primary)",
              boxShadow: "0 0 8px var(--color-primary)",
              animation: "pulseGlow 1.5s infinite ease-in-out",
            }}
          />
          <span>{percent}%</span>
        </div>
      </div>

      {/* Progress Track & Animated Gradient Bar */}
      <div
        style={{
          width: "100%",
          height: "8px",
          background: "rgba(0, 0, 0, 0.25)",
          borderRadius: "999px",
          overflow: "hidden",
          position: "relative",
          border: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${percent}%`,
            background: "linear-gradient(90deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)",
            borderRadius: "999px",
            transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
            position: "relative",
            boxShadow: "0 0 12px rgba(139, 92, 246, 0.5)",
          }}
        >
          {/* Shimmer sweep animation over bar */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.35) 50%, transparent 100%)",
              backgroundSize: "200% 100%",
              animation: "shimmerSweep 1.8s infinite linear",
            }}
          />
        </div>
      </div>

      {/* Multi-step Mini Indicators */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${ANALYSIS_STEPS.length}, 1fr)`,
          gap: "0.4rem",
          marginTop: "0.15rem",
        }}
      >
        {ANALYSIS_STEPS.map((step, idx) => {
          const isDone = idx < activeStepIndex;
          const isCurrent = idx === activeStepIndex;

          return (
            <div
              key={step.id}
              title={`${step.label} (${isDone ? "Done" : isCurrent ? "In Progress" : "Pending"})`}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.25rem",
              }}
            >
              <div
                style={{
                  height: "3px",
                  borderRadius: "999px",
                  background: isDone
                    ? "var(--color-success)"
                    : isCurrent
                      ? "var(--color-primary-light)"
                      : "rgba(255, 255, 255, 0.1)",
                  transition: "background 0.3s ease",
                  boxShadow: isCurrent ? "0 0 6px var(--color-primary-light)" : "none",
                }}
              />
              <span
                style={{
                  fontSize: "0.68rem",
                  fontFamily: "var(--font-mono)",
                  color: isCurrent
                    ? "var(--color-primary-light)"
                    : isDone
                      ? "var(--color-text)"
                      : "var(--color-text-muted)",
                  fontWeight: isCurrent ? 600 : 400,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {step.id}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
