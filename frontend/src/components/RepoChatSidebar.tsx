"use client";

import { useState, useRef, useEffect, useCallback, memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { streamChat, getChatHistory, clearChatHistory } from "@/lib/api-client";
import { ThinkingLines } from "./ThinkingLines";
import { InlineMermaidBlock } from "./InlineMermaidBlock";

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
  isOpen?: boolean;
  onClose?: () => void;
}

const PRESET_QUESTIONS = [
  "What is the core architecture and design pattern of this repository?",
  "How do I set up and run this project locally for onboarding?",
  "Are there any circular dependencies, God classes, or security smells?",
  "Explain the entry points and major data flows.",
];

interface ChatMessageItemProps {
  message: ChatMessage;
  repoName: string;
}

/**
 * Memoized ChatMessageItem to prevent re-rendering and flickering of prior
 * messages (and their rendered Mermaid diagrams) when user types in the input
 * or when other messages update.
 */
const ChatMessageItem = memo(
  function ChatMessageItem({ message, repoName }: ChatMessageItemProps) {
    const isUser = message.role === "user";

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignSelf: isUser ? "flex-end" : "flex-start",
          maxWidth: isUser ? "85%" : "96%",
          width: isUser ? "auto" : "100%",
        }}
      >
        <div
          style={{
            padding: isUser ? "0.65rem 0.95rem" : "0.85rem 1.1rem",
            borderRadius: "var(--radius-md)",
            background: isUser ? "var(--color-chat-bubble-user)" : "var(--color-chat-bubble-assistant)",
            border: isUser ? "1px solid var(--color-primary)" : "1px solid var(--color-border)",
            color: isUser ? "#ffffff" : "var(--color-text)",
            fontSize: "0.85rem",
            lineHeight: "1.6",
            wordBreak: "break-word",
          }}
        >
          {isUser ? (
            <div style={{ whiteSpace: "pre-wrap" }}>{message.content}</div>
          ) : message.content ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ ...props }) => (
                  <h1
                    style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0.6rem 0 0.3rem", color: "var(--color-text)" }}
                    {...props}
                  />
                ),
                h2: ({ ...props }) => (
                  <h2
                    style={{ fontSize: "0.98rem", fontWeight: 600, margin: "0.5rem 0 0.25rem", color: "var(--color-text)" }}
                    {...props}
                  />
                ),
                h3: ({ ...props }) => (
                  <h3
                    style={{ fontSize: "0.9rem", fontWeight: 600, margin: "0.4rem 0 0.2rem", color: "var(--color-primary)" }}
                    {...props}
                  />
                ),
                p: ({ ...props }) => (
                  <p style={{ margin: "0 0 0.5rem 0", color: "inherit", lineHeight: "1.6" }} {...props} />
                ),
                ul: ({ ...props }) => (
                  <ul style={{ margin: "0.3rem 0 0.5rem 1.1rem", padding: 0 }} {...props} />
                ),
                ol: ({ ...props }) => (
                  <ol style={{ margin: "0.3rem 0 0.5rem 1.1rem", padding: 0 }} {...props} />
                ),
                li: ({ ...props }) => (
                  <li style={{ margin: "0.15rem 0" }} {...props} />
                ),
                hr: () => (
                  <hr style={{ border: "none", borderTop: "1px solid var(--color-border)", margin: "0.8rem 0" }} />
                ),
                code: ({ className, children, ...props }) => {
                  const isInline = !className;
                  const rawCode = String(children).replace(/\n$/, "");
                  const matchLanguage = /language-(\w+)/.exec(className || "");
                  const lang = matchLanguage ? matchLanguage[1].toLowerCase() : "";

                  const isMermaid =
                    lang === "mermaid" ||
                    (!isInline &&
                      (rawCode.trim().startsWith("flowchart") ||
                        rawCode.trim().startsWith("graph") ||
                        rawCode.trim().startsWith("sequenceDiagram") ||
                        rawCode.trim().startsWith("classDiagram") ||
                        rawCode.trim().startsWith("stateDiagram")));

                  if (isMermaid) {
                    return <InlineMermaidBlock code={rawCode} />;
                  }

                  return isInline ? (
                    <code
                      style={{
                        background: "var(--color-badge-bg)",
                        border: "1px solid var(--color-border)",
                        padding: "0.12rem 0.35rem",
                        borderRadius: "4px",
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.8rem",
                        color: "var(--color-primary)",
                      }}
                      {...props}
                    >
                      {children}
                    </code>
                  ) : (
                    <pre
                      style={{
                        background: "var(--color-code-bg)",
                        border: "1px solid var(--color-border)",
                        padding: "0.75rem",
                        borderRadius: "var(--radius-sm)",
                        overflowX: "auto",
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.78rem",
                        margin: "0.5rem 0",
                        color: "var(--color-text)",
                      }}
                    >
                      <code>{children}</code>
                    </pre>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          ) : (
            <ThinkingLines repoName={repoName} />
          )}
        </div>
        <span
          style={{
            fontSize: "0.68rem",
            color: "var(--color-text-muted)",
            marginTop: "0.25rem",
            alignSelf: isUser ? "flex-end" : "flex-start",
          }}
        >
          {message.timestamp}
        </span>
      </div>
    );
  },
  (prev, next) =>
    prev.message.id === next.message.id &&
    prev.message.content === next.message.content &&
    prev.message.role === next.message.role &&
    prev.message.timestamp === next.message.timestamp &&
    prev.repoName === next.repoName,
);

export function RepoChatSidebar({ auditId, backendToken, repoName, isOpen, onClose }: RepoChatSidebarProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(`codelens-chat-${auditId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeStreamControllerRef = useRef<AbortController | null>(null);
  const isInitialMountRef = useRef(true);

  // Load chat history from backend on mount if local state is empty
  useEffect(() => {
    let isCancelled = false;
    getChatHistory(auditId, backendToken)
      .then((history) => {
        if (!isCancelled && history && history.length > 0) {
          setMessages(history);
        }
      })
      .catch(() => {
        // Fall back to localStorage messages
      });

    return () => {
      isCancelled = true;
    };
  }, [auditId, backendToken]);

  // Persist messages to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(`codelens-chat-${auditId}`, JSON.stringify(messages));
    } catch {
      // Ignore quota errors
    }
  }, [auditId, messages]);

  // Abort only when audit changes / component unmounts from tree
  useEffect(() => {
    return () => {
      activeStreamControllerRef.current?.abort();
    };
  }, []);

  // When drawer transitions open/close, do NOT animate-scroll.
  // When messages arrive or user sends a message while drawer is open, smoothly scroll to bottom.
  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
      return;
    }

    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const confirmClearChat = useCallback(async () => {
    if (isStreaming || isClearing) return;
    setIsClearing(true);
    setError(null);
    try {
      await clearChatHistory(auditId, backendToken);
    } catch {
      // Ignore backend clear errors if in-memory or offline
    } finally {
      setMessages([]);
      try {
        localStorage.removeItem(`codelens-chat-${auditId}`);
      } catch {
        // Ignore
      }
      setIsClearing(false);
      setShowClearConfirm(false);
    }
  }, [auditId, backendToken, isStreaming, isClearing]);

  const handleSend = (textToSend?: string) => {
    const query = (textToSend ?? input).trim();
    if (!query || isStreaming) return;

    setError(null);
    setInput("");

    const now = new Date();
    const formattedTime = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const userMessage: ChatMessage = {
      id: `user-${crypto.randomUUID()}`,
      role: "user",
      content: query,
      timestamp: formattedTime,
    };

    const assistantMessageId = `assistant-${crypto.randomUUID()}`;
    const initialAssistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: formattedTime,
    };

    setMessages((prev) => [...prev, userMessage, initialAssistantMessage]);
    setIsStreaming(true);

    activeStreamControllerRef.current?.abort();
    activeStreamControllerRef.current = streamChat(
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
        activeStreamControllerRef.current = null;
      },
      (err) => {
        setError(err.message || "Failed to stream chat response.");
        setIsStreaming(false);
        activeStreamControllerRef.current = null;
      },
    );
  };

  return (
    <div
      style={{
        borderRadius: "var(--radius-lg)",
        background: "var(--color-drawer-bg)",
        border: "1px solid var(--color-drawer-border)",
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
          borderBottom: "1px solid var(--color-drawer-border)",
          background: "var(--color-header-bg)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "1.1rem" }}>🤖</span>
          <div>
            <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text)" }}>
              Repo AI
            </div>
            <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>
              Grounded strictly in {repoName} dossier
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {isStreaming && (
            <span
              style={{
                fontSize: "0.7rem",
                padding: "0.15rem 0.5rem",
                borderRadius: "99px",
                background: "rgba(99, 102, 241, 0.15)",
                color: "var(--color-primary-light)",
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
              }}
            >
              <span style={{ animation: "pulse 1.5s infinite" }}>●</span> Streaming
            </span>
          )}

          {messages.length > 0 && (
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              disabled={isStreaming || isClearing}
              title="Clear conversation history"
              style={{
                background: "transparent",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-sm)",
                color: "var(--color-text-muted)",
                cursor: isStreaming || isClearing ? "not-allowed" : "pointer",
                padding: "0.2rem 0.55rem",
                fontSize: "0.74rem",
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
                transition: "var(--transition-fast)",
              }}
              onMouseEnter={(e) => {
                if (!isStreaming && !isClearing) {
                  e.currentTarget.style.color = "#ef4444";
                  e.currentTarget.style.borderColor = "#ef4444";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--color-text-muted)";
                e.currentTarget.style.borderColor = "var(--color-border)";
              }}
            >
              <span>🗑️</span>
              <span>{isClearing ? "Clearing..." : "Clear"}</span>
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              title="Close Copilot Drawer"
              style={{
                background: "transparent",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-sm)",
                color: "var(--color-text-muted)",
                cursor: "pointer",
                padding: "0.25rem 0.55rem",
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "var(--transition-fast)",
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── Clear Confirmation Dialog ────────────────────────────────────────── */}
      {showClearConfirm && (
        <div
          role="alertdialog"
          aria-labelledby="clear-chat-title"
          aria-describedby="clear-chat-desc"
          style={{
            padding: "1rem 1.25rem",
            background: "rgba(239, 68, 68, 0.08)",
            borderBottom: "1px solid rgba(239, 68, 68, 0.25)",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            animation: "fadeIn 0.2s ease-out",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem" }}>
            <span style={{ fontSize: "1.2rem", lineHeight: 1 }}>⚠️</span>
            <div>
              <div
                id="clear-chat-title"
                style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text)" }}
              >
                Clear entire conversation?
              </div>
              <div
                id="clear-chat-desc"
                style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.15rem" }}
              >
                This will delete all saved chat messages for this repository. This action cannot be undone.
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
            <button
              type="button"
              disabled={isClearing}
              onClick={() => setShowClearConfirm(false)}
              style={{
                padding: "0.35rem 0.75rem",
                borderRadius: "var(--radius-sm)",
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text)",
                fontSize: "0.78rem",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isClearing}
              onClick={confirmClearChat}
              style={{
                padding: "0.35rem 0.85rem",
                borderRadius: "var(--radius-sm)",
                background: "#ef4444",
                border: "none",
                color: "#ffffff",
                fontSize: "0.78rem",
                fontWeight: 600,
                cursor: isClearing ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
              }}
            >
              <span>🗑️</span>
              <span>{isClearing ? "Clearing..." : "Yes, Clear Chat"}</span>
            </button>
          </div>
        </div>
      )}

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
              <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-muted)" }}>
                Suggested Prompts
              </span>
              {PRESET_QUESTIONS.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => handleSend(question)}
                  style={{
                    padding: "0.55rem 0.85rem",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-primary-light)",
                    fontSize: "0.78rem",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "var(--transition-fast)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--color-surface-hover)";
                    e.currentTarget.style.borderColor = "var(--color-primary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--color-surface)";
                    e.currentTarget.style.borderColor = "var(--color-border)";
                  }}
                >
                  💬 {question}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <ChatMessageItem key={m.id} message={m} repoName={repoName} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Error Banner ─────────────────────────────────────────────────── */}
      {error && (
        <div
          style={{
            margin: "0 1rem 0.5rem",
            padding: "0.5rem 0.75rem",
            background: "rgba(239, 68, 68, 0.12)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "var(--radius-sm)",
            color: "#ef4444",
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
          background: "var(--color-header-bg)",
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
            background: "var(--color-input-bg)",
            border: "1px solid var(--color-input-border)",
            borderRadius: "var(--radius-sm)",
            color: "var(--color-input-text)",
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
            background: isStreaming || !input.trim() ? "var(--color-surface-hover)" : "var(--color-primary)",
            color: isStreaming || !input.trim() ? "var(--color-text-muted)" : "#ffffff",
            border: "none",
            fontWeight: 600,
            cursor: isStreaming || !input.trim() ? "not-allowed" : "pointer",
            fontSize: "0.82rem",
            display: "flex",
            alignItems: "center",
            gap: "0.3rem",
            transition: "var(--transition-fast)",
          }}
        >
          <span>Send</span>
          <span>↗</span>
        </button>
      </form>
    </div>
  );
}
