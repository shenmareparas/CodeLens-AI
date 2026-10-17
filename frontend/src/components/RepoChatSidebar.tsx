"use client";

import { useState, useRef, useEffect } from "react";
import { streamChat } from "@/lib/api-client";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface RepoChatSidebarProps {
  auditId: string;
  backendToken: string;
  repoName: string;
}

const PRESET_QUESTIONS = [
  "What is the core architecture and design pattern of this repository?",
  "How do I set up and run this project locally for onboarding?",
  "Are there any circular dependencies, God classes, or security smells?",
  "Explain the entry points and major data flows.",
];

export function RepoChatSidebar({ auditId, backendToken, repoName }: RepoChatSidebarProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (textToSend?: string) => {
    const query = (textToSend ?? input).trim();
    if (!query || isStreaming) return;

    setError(null);
    setInput("");

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const assistantMessageId = `assistant-${Date.now()}`;
    const initialAssistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage, initialAssistantMessage]);
    setIsStreaming(true);

    streamChat(
      auditId,
      query,
      backendToken,
      (chunk) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId
              ? { ...m, content: m.content + chunk }
              : m,
          ),
        );
      },
      () => {
        setIsStreaming(false);
      },
      (err) => {
        setError(err.message || "Failed to stream chat response.");
        setIsStreaming(false);
      },
    );
  };

  return (
    <div
      style={{
        borderRadius: "var(--radius-lg)",
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* ── Chat Header ──────────────────────────────────────────────────── */}
      <div
        style={{
          padding: "0.85rem 1.25rem",
          borderBottom: "1px solid var(--color-border)",
          background: "rgba(0, 0, 0, 0.3)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "1.1rem" }}>🤖</span>
          <div>
            <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text)" }}>
              Repo Onboarding Copilot
            </div>
            <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>
              Grounded strictly in {repoName} dossier
            </div>
          </div>
        </div>

        {isStreaming && (
          <span
            style={{
              fontSize: "0.7rem",
              padding: "0.15rem 0.5rem",
              borderRadius: "99px",
              background: "rgba(99, 102, 241, 0.2)",
              color: "var(--color-primary-light)",
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
            }}
          >
            <span style={{ animation: "pulse 1.5s infinite" }}>●</span> Streaming
          </span>
        )}
      </div>

      {/* ── Messages List ────────────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          padding: "1rem",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        {messages.length === 0 ? (
          <div
            style={{
              padding: "1.5rem 1rem",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              color: "var(--color-text-muted)",
              fontSize: "0.85rem",
            }}
          >
            <div>
              Ask any architectural or onboarding questions about{" "}
              <strong style={{ color: "var(--color-text)" }}>{repoName}</strong>. Answers are grounded in AST telemetry and dossier facts.
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginTop: "0.5rem" }}>
              <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Suggested Prompts
              </span>
              {PRESET_QUESTIONS.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => handleSend(question)}
                  style={{
                    padding: "0.45rem 0.75rem",
                    borderRadius: "var(--radius-sm)",
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-primary-light)",
                    fontSize: "0.78rem",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "var(--transition-fast)",
                  }}
                >
                  💬 {question}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => {
            const isUser = m.role === "user";
            return (
              <div
                key={m.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignSelf: isUser ? "flex-end" : "flex-start",
                  maxWidth: "88%",
                }}
              >
                <div
                  style={{
                    padding: "0.65rem 0.95rem",
                    borderRadius: "var(--radius-md)",
                    background: isUser ? "var(--color-primary)" : "rgba(255, 255, 255, 0.05)",
                    border: isUser ? "none" : "1px solid var(--color-border)",
                    color: isUser ? "#fff" : "var(--color-text)",
                    fontSize: "0.85rem",
                    lineHeight: "1.5",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {m.content || (isStreaming ? "Thinking..." : "")}
                </div>
                <span
                  style={{
                    fontSize: "0.68rem",
                    color: "var(--color-text-muted)",
                    marginTop: "0.2rem",
                    alignSelf: isUser ? "flex-end" : "flex-start",
                  }}
                >
                  {m.timestamp}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Error Banner ─────────────────────────────────────────────────── */}
      {error && (
        <div
          style={{
            margin: "0 1rem 0.5rem",
            padding: "0.5rem 0.75rem",
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "var(--radius-sm)",
            color: "#f87171",
            fontSize: "0.78rem",
          }}
        >
          {error}
        </div>
      )}

      {/* ── Input Bar ────────────────────────────────────────────────────── */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        style={{
          padding: "0.75rem 1rem",
          borderTop: "1px solid var(--color-border)",
          background: "rgba(0, 0, 0, 0.25)",
          display: "flex",
          gap: "0.5rem",
        }}
      >
        <input
          type="text"
          placeholder={`Ask anything about ${repoName}...`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isStreaming}
          style={{
            flex: 1,
            padding: "0.6rem 0.85rem",
            background: "rgba(0, 0, 0, 0.4)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-sm)",
            color: "#fff",
            fontSize: "0.85rem",
            outline: "none",
          }}
        />
        <button
          type="submit"
          disabled={isStreaming || !input.trim()}
          style={{
            padding: "0.6rem 1rem",
            borderRadius: "var(--radius-sm)",
            background: isStreaming || !input.trim() ? "rgba(255, 255, 255, 0.05)" : "var(--color-primary)",
            color: isStreaming || !input.trim() ? "var(--color-text-muted)" : "#fff",
            border: "none",
            fontWeight: 600,
            cursor: isStreaming || !input.trim() ? "not-allowed" : "pointer",
            fontSize: "0.82rem",
            display: "flex",
            alignItems: "center",
            gap: "0.3rem",
          }}
        >
          <span>Send</span>
          <span>↗</span>
        </button>
      </form>
    </div>
  );
}
