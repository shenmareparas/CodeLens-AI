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

interface PromptCategory {
  category: string;
  prompts: string[];
}

const SUGGESTED_PROMPT_GROUPS: PromptCategory[] = [
  {
    category: "General & Non-Developer Friendly",
    prompts: [
      "Explain what this project does in simple, non-technical terms.",
      "What are the main features and who is the target audience for this app?",
      "Give me a high-level overview of what technologies are used and why.",
    ],
  },
  {
    category: "Getting Started & Onboarding",
    prompts: [
      "How do I set up and run this project step-by-step on my computer?",
      "What environment variables or prerequisites are needed before starting?",
    ],
  },
  {
    category: "Architecture & Engineering Deep Dive",
    prompts: [
      "What is the core architecture, folder structure, and design pattern used here?",
      "Draw a flowchart diagram explaining the major data flow and entry points.",
      "Are there any circular dependencies, security alerts, or code hotspots?",
    ],
  },
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
            background: isUser
              ? "var(--color-chat-bubble-user)"
              : "var(--color-chat-bubble-assistant)",
            border: isUser
              ? "1px solid var(--color-primary)"
              : "1px solid var(--color-border)",
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
                    style={{
                      fontSize: "1.1rem",
                      fontWeight: 700,
                      margin: "0.6rem 0 0.3rem",
                      color: "var(--color-text)",
                    }}
                    {...props}
                  />
                ),
                h2: ({ ...props }) => (
                  <h2
                    style={{
                      fontSize: "0.98rem",
                      fontWeight: 600,
                      margin: "0.5rem 0 0.25rem",
                      color: "var(--color-text)",
                    }}
                    {...props}
                  />
                ),
                h3: ({ ...props }) => (
                  <h3
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: 600,
                      margin: "0.4rem 0 0.2rem",
                      color: "var(--color-primary)",
                    }}
                    {...props}
                  />
                ),
                p: ({ ...props }) => (
                  <p
                    style={{
                      margin: "0 0 0.5rem 0",
                      color: "inherit",
                      lineHeight: "1.6",
                    }}
                    {...props}
                  />
                ),
                ul: ({ ...props }) => (
                  <ul
                    style={{ margin: "0.3rem 0 0.5rem 1.1rem", padding: 0 }}
                    {...props}
                  />
                ),
                ol: ({ ...props }) => (
                  <ol
                    style={{ margin: "0.3rem 0 0.5rem 1.1rem", padding: 0 }}
                    {...props}
                  />
                ),
                li: ({ ...props }) => (
                  <li style={{ margin: "0.15rem 0" }} {...props} />
                ),
                hr: () => (
                  <hr
                    style={{
                      border: "none",
                      borderTop: "1px solid var(--color-border)",
                      margin: "0.8rem 0",
                    }}
                  />
                ),
                code: ({ className, children, ...props }) => {
                  const isInline = !className;
                  const rawCode = String(children).replace(/\n$/, "");
                  const matchLanguage = /language-(\w+)/.exec(className || "");
                  const lang = matchLanguage
                    ? matchLanguage[1].toLowerCase()
                    : "";

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

export function RepoChatSidebar({
  auditId,
  backendToken,
  repoName,
  isOpen,
  onClose,
}: RepoChatSidebarProps) {
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
  const [rateLimitUntil, setRateLimitUntil] = useState<number | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeStreamControllerRef = useRef<AbortController | null>(null);
  const isInitialMountRef = useRef(true);

  // Timer countdown for rate limit cooldown
  useEffect(() => {
    if (!rateLimitUntil) {
      setSecondsRemaining(0);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.ceil((rateLimitUntil - now) / 1000);
      if (diff <= 0) {
        setRateLimitUntil(null);
        setSecondsRemaining(0);
      } else {
        setSecondsRemaining(diff);
      }
    };

    updateTimer();
    const interval = window.setInterval(updateTimer, 1000);
    return () => window.clearInterval(interval);
  }, [rateLimitUntil]);

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
      localStorage.setItem(
        `codelens-chat-${auditId}`,
        JSON.stringify(messages),
      );
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
    const formattedTime = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

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
      (retryAfter) => {
        const cooldown =
          (retryAfter && retryAfter > 0 ? retryAfter : 60) * 1000;
        setRateLimitUntil(Date.now() + cooldown);
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
            <div
              style={{
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "var(--color-text)",
              }}
            >
              Repo AI
            </div>
            <div
              style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}
            >
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
                background: "var(--color-badge-bg)",
                color: "var(--color-primary)",
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
              }}
            >
              <span style={{ animation: "pulse 1.5s infinite" }}>●</span>{" "}
              Streaming
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
          <div
            style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem" }}
          >
            <span style={{ fontSize: "1.2rem", lineHeight: 1 }}>⚠️</span>
            <div>
              <div
                id="clear-chat-title"
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "var(--color-text)",
                }}
              >
                Clear entire conversation?
              </div>
              <div
                id="clear-chat-desc"
                style={{
                  fontSize: "0.75rem",
                  color: "var(--color-text-muted)",
                  marginTop: "0.15rem",
                }}
              >
                This will delete all saved chat messages for this repository.
                This action cannot be undone.
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              justifyContent: "flex-end",
            }}
          >
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

      {/* ── Rate Limit Notification Banner ─────────────────────────────────── */}
      {Boolean(rateLimitUntil && secondsRemaining > 0) && (
        <div
          role="status"
          aria-live="polite"
          style={{
            padding: "0.75rem 1.15rem",
            background:
              "linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(239, 68, 68, 0.08) 100%)",
            borderBottom: "1px solid rgba(245, 158, 11, 0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.75rem",
            animation: "fadeIn 0.25s ease-out",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "0.6rem",
              flex: 1,
            }}
          >
            <span style={{ fontSize: "1.1rem", lineHeight: 1.2 }}>⏳</span>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.15rem",
              }}
            >
              <div
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  color: "#f59e0b",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                }}
              >
                <span>Gemini API Quota Exhausted</span>
                <span
                  style={{
                    fontSize: "0.65rem",
                    fontWeight: 600,
                    padding: "0.1rem 0.4rem",
                    borderRadius: "99px",
                    background: "rgba(245, 158, 11, 0.2)",
                    color: "#f59e0b",
                    fontFamily: "var(--font-mono, monospace)",
                  }}
                >
                  Free Tier (15 RPM)
                </span>
              </div>
              <div
                style={{
                  fontSize: "0.72rem",
                  color: "var(--color-text-muted)",
                  lineHeight: 1.4,
                }}
              >
                Rate limit reached. Answers are actively answered by the local
                AST grounded engine.
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                fontFamily: "var(--font-mono, monospace)",
              }}
            >
              <span
                style={{
                  fontSize: "0.62rem",
                  color: "var(--color-text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Resets in
              </span>
              <span
                style={{
                  fontSize: "0.86rem",
                  fontWeight: 700,
                  color: secondsRemaining <= 10 ? "#ef4444" : "#f59e0b",
                }}
              >
                {secondsRemaining >= 3600
                  ? `${Math.floor(secondsRemaining / 3600)}h ${Math.floor((secondsRemaining % 3600) / 60)}m`
                  : `${Math.floor(secondsRemaining / 60)}:${(secondsRemaining % 60).toString().padStart(2, "0")}`}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setRateLimitUntil(null)}
              title="Dismiss warning"
              style={{
                background: "transparent",
                border: "none",
                color: "var(--color-text-muted)",
                cursor: "pointer",
                padding: "0.2rem",
                fontSize: "0.85rem",
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
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
              <strong style={{ color: "var(--color-text)" }}>{repoName}</strong>
              . Answers are grounded in AST telemetry and dossier facts.
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.85rem",
                marginTop: "0.5rem",
              }}
            >
              {SUGGESTED_PROMPT_GROUPS.map((group) => (
                <div
                  key={group.category}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.35rem",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.72rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: "var(--color-primary-light)",
                      fontWeight: 600,
                      textAlign: "left",
                    }}
                  >
                    {group.category}
                  </span>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.35rem",
                    }}
                  >
                    {group.prompts.map((question) => (
                      <button
                        key={question}
                        type="button"
                        onClick={() => handleSend(question)}
                        style={{
                          padding: "0.5rem 0.75rem",
                          borderRadius: "var(--radius-sm)",
                          background: "var(--color-surface)",
                          border: "1px solid var(--color-border)",
                          color: "var(--color-text)",
                          fontSize: "0.78rem",
                          textAlign: "left",
                          cursor: "pointer",
                          transition: "var(--transition-fast)",
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "0.4rem",
                          lineHeight: "1.4",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background =
                            "var(--color-surface-hover)";
                          e.currentTarget.style.borderColor =
                            "var(--color-primary)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background =
                            "var(--color-surface)";
                          e.currentTarget.style.borderColor =
                            "var(--color-border)";
                        }}
                      >
                        <span style={{ color: "var(--color-primary)" }}>
                          💬
                        </span>
                        <span>{question}</span>
                      </button>
                    ))}
                  </div>
                </div>
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
            background:
              isStreaming || !input.trim()
                ? "var(--color-surface-hover)"
                : "var(--color-primary)",
            color:
              isStreaming || !input.trim()
                ? "var(--color-text-muted)"
                : "#ffffff",
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
