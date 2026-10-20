import { useState } from "react";
import styles from "@/pages/HomePage.module.css";

interface RepoPreviewData {
  name: string;
  repo: string;
  tag: string;
  stars: number;
  commits: number;
  complexity: number;
  churn: number;
  riskScore: number;
  languages: { name: string; pct: number; color: string }[];
  secretsStatus: string;
  c4Summary: string;
  dossierSummary: string;
  copilotResponse: string;
}

export const PREVIEW_DATA: Record<string, RepoPreviewData> = {
  "shenmareparas/CodeLens-AI": {
    name: "CodeLens-AI",
    repo: "shenmareparas/CodeLens-AI",
    tag: ".NET 10 / React 19",
    stars: 142,
    commits: 348,
    complexity: 12,
    churn: 45,
    riskScore: 45.94,
    languages: [
      { name: "C#", pct: 54, color: "#9b4dca" },
      { name: "TypeScript", pct: 38, color: "#3178c6" },
      { name: "Bicep", pct: 8, color: "#0078d4" },
    ],
    secretsStatus: "0 Exposed Keys (Clean)",
    c4Summary: "Clean Architecture: Client SPA -> .NET 10 Web API -> Roslyn Ingestion Engine -> Cosmos DB & Gemini 3.8 Flash",
    dossierSummary: "System is modularized across 3 core assemblies. Zero-disk streaming via Octokit Zipball avoids local clone overhead. AST symbols grounded in Semantic Kernel.",
    copilotResponse: "CodeLens AI routes GitHub zipballs into System.IO.Compression.ZipArchive in memory, parsing Roslyn AST nodes and lockfiles concurrently before dispatching compact manifests to Gemini 3.8 Flash.",
  },
  "shenmareparas/Chess": {
    name: "Chess Flutter",
    repo: "shenmareparas/Chess",
    tag: "Flutter / Dart",
    stars: 89,
    commits: 162,
    complexity: 18,
    churn: 28,
    riskScore: 60.61,
    languages: [
      { name: "Dart", pct: 92, color: "#00b4ab" },
      { name: "C++", pct: 5, color: "#f34b7d" },
      { name: "CMake", pct: 3, color: "#064f8c" },
    ],
    secretsStatus: "0 Exposed Keys (Clean)",
    c4Summary: "MVVM Architecture: Flutter Widgets -> Game Engine ViewModel -> Move Validator & Board State Repository",
    dossierSummary: "Clean separation between Flutter rendering widgets and board minimax evaluation logic. Dependencies managed via pubspec.yaml with zero unpinned overrides.",
    copilotResponse: "The Chess repository employs strict MVVM architecture. The MoveValidator class evaluates legal chess moves and checks for checkmate states without mutating UI state directly.",
  },
  "shenmareparas/play-store-ai-review": {
    name: "Play Store AI",
    repo: "shenmareparas/play-store-ai-review",
    tag: "Python / FastAPI",
    stars: 64,
    commits: 94,
    complexity: 8,
    churn: 19,
    riskScore: 23.97,
    languages: [
      { name: "Python", pct: 85, color: "#3572a5" },
      { name: "Docker", pct: 10, color: "#384d54" },
      { name: "Shell", pct: 5, color: "#89e051" },
    ],
    secretsStatus: "0 Exposed Keys (Clean)",
    c4Summary: "Microservice: Scraper Ingest -> Sentiment Engine -> FastAPI Dispatcher -> PostgreSQL Persistence",
    dossierSummary: "PyPI requirements.txt parsed dynamically. Contains background tasks for sentiment clustering with zero memory leak indications.",
    copilotResponse: "The Play Store Review Analyzer uses FastAPI dependency injection to route reviews into the sentiment pipeline. Secrets scanner confirmed zero production credentials leaked in Dockerfiles.",
  },
  "shenmareparas/Portfolio_NextJS": {
    name: "Portfolio Next.js",
    repo: "shenmareparas/Portfolio_NextJS",
    tag: "Next.js / TS",
    stars: 43,
    commits: 112,
    complexity: 6,
    churn: 22,
    riskScore: 18.81,
    languages: [
      { name: "TypeScript", pct: 72, color: "#3178c6" },
      { name: "CSS", pct: 24, color: "#563d7c" },
      { name: "JavaScript", pct: 4, color: "#f1e05a" },
    ],
    secretsStatus: "0 Exposed Keys (Clean)",
    c4Summary: "App Router: Server Components -> Client Canvas -> Tailwind Styling -> Vercel Edge Runtime",
    dossierSummary: "Modern Next.js App Router codebase. High Lighthouse score profile with zero cyclomatic hotspots identified.",
    copilotResponse: "Portfolio utilizes React Server Components with client boundary leaves for interactive GSAP animations and 3D canvas rendering.",
  },
};

interface HeroPreviewTabsProps {
  selectedRepo: string;
  onSelectRepo: (repo: string) => void;
  sampleRepos: readonly { name: string; repo: string; tag: string }[];
}

type TabKey = "bento" | "diagram" | "dossier" | "copilot";

export function HeroPreviewTabs({ selectedRepo, onSelectRepo, sampleRepos }: HeroPreviewTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("bento");
  const data = PREVIEW_DATA[selectedRepo] || PREVIEW_DATA["shenmareparas/CodeLens-AI"];

  return (
    <section id="preview" className={styles.mockSection} aria-label="Interactive Codebase Sandbox">
      {/* Section Header */}
      <div className={styles.sectionHeader}>
        <h2 className={`${styles.sectionTitle} preview-title`}>
          Interactive Codebase Sandbox
        </h2>
        <p className={`${styles.sectionDesc} preview-desc`}>
          Explore real-time AST telemetry, architecture diagrams, and AI dossiers on sample open-source repositories.
        </p>
      </div>

      {/* Interactive Sample Repo Selector directly above the macOS-like window */}
      <div className={`${styles.sampleReposContainer} hero-samples`}>
        <div className={styles.sampleReposHeader}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          <span className={styles.sampleReposLabel}>Try live demo repo:</span>
        </div>
        <div className={styles.sampleReposList} role="radiogroup" aria-label="Sample Repositories">
          {sampleRepos.map((item) => {
            const isSelected = selectedRepo === item.repo;
            return (
              <button
                key={item.repo}
                type="button"
                role="radio"
                aria-checked={isSelected}
                className={`${styles.sampleRepoPill} ${isSelected ? styles.sampleRepoPillActive : ""}`}
                onClick={() => onSelectRepo(item.repo)}
              >
                <span className={styles.sampleRepoTag}>{item.tag}</span>
                <span className={styles.sampleRepoName}>{item.name}</span>
                {isSelected && (
                  <span className={styles.sampleRepoCheck}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className={`${styles.mockWindow} preview-window`} data-ui="true">
        {/* Browser Top Navigation Bar */}
        <div className={styles.mockTitleBar}>
          <div className={styles.mockControls}>
            <span className={`${styles.mockDot} ${styles.mockDotRed}`} aria-hidden="true" />
            <span className={`${styles.mockDot} ${styles.mockDotYellow}`} aria-hidden="true" />
            <span className={`${styles.mockDot} ${styles.mockDotGreen}`} aria-hidden="true" />
          </div>

          <div className={styles.mockAddressBar}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span className={styles.mockAddress}>
              https://codelens.ai/
            </span>
          </div>

          <div className={styles.mockStatusMeta}>
            <span className={styles.mockPing} />
            <span className={styles.mockStatusText}>Cosmos DB &lt; 50ms</span>
          </div>
        </div>

        {/* Interactive View Tabs */}
        <div className={styles.previewTabsHeader} role="tablist" aria-label="Preview Views">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "bento"}
            className={`${styles.previewTabBtn} ${activeTab === "bento" ? styles.previewTabBtnActive : ""}`}
            onClick={() => setActiveTab("bento")}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            <span>Telemetry Bento</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "diagram"}
            className={`${styles.previewTabBtn} ${activeTab === "diagram" ? styles.previewTabBtnActive : ""}`}
            onClick={() => setActiveTab("diagram")}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <span>Interactive C4 Diagram</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "dossier"}
            className={`${styles.previewTabBtn} ${activeTab === "dossier" ? styles.previewTabBtnActive : ""}`}
            onClick={() => setActiveTab("dossier")}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <span>Knowledge Dossier</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "copilot"}
            className={`${styles.previewTabBtn} ${activeTab === "copilot" ? styles.previewTabBtnActive : ""}`}
            onClick={() => setActiveTab("copilot")}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span>Grounded Copilot</span>
          </button>
        </div>

        {/* Tab 1: Bento Telemetry */}
        {activeTab === "bento" && (
          <div className={`${styles.mockContent} preview-tab-pane`} role="tabpanel">
            <div className={styles.mockTelemetryCard}>
              <div className={styles.mockCardTop}>
                <div>
                  <h3 className={styles.mockCardTitle}>Repository Telemetry</h3>
                  <div className={styles.mockCardSubtitle}>{data.repo} • {data.tag}</div>
                </div>
                <span className={styles.mockBadgeGreen}>
                  {data.commits} Total Commits
                </span>
              </div>

              {/* Cyclomatic Hotspot Metric */}
              <div className={styles.mockMetricBox}>
                <div className={styles.mockMetricHeader}>
                  <span>Cyclomatic Hotspot Risk</span>
                  <strong className={styles.mockHighlightOrange}>Score: {data.riskScore}</strong>
                </div>
                <div className={styles.mockProgressBar}>
                  <div
                    className={styles.mockProgressFill}
                    style={{ width: `${Math.min(100, (data.riskScore / 80) * 100)}%` }}
                  />
                </div>
                <div className={styles.mockFormulaRow}>
                  <span>Formula: <code>CC ({data.complexity}) × ln(Churn ({data.churn}) + 1)</code></span>
                  <span className={styles.mockCleanTag}>Evaluated via Roslyn & Polyglot AST</span>
                </div>
              </div>

              {/* Languages Breakdown */}
              <div className={styles.mockLangContainer}>
                <div className={styles.mockLangHeader}>Language Distribution</div>
                <div className={styles.mockLangBar}>
                  {data.languages.map((l) => (
                    <div
                      key={l.name}
                      style={{ width: `${l.pct}%`, backgroundColor: l.color }}
                      className={styles.mockLangSegment}
                      title={`${l.name}: ${l.pct}%`}
                    />
                  ))}
                </div>
                <div className={styles.mockLangLegend}>
                  {data.languages.map((l) => (
                    <div key={l.name} className={styles.mockLangLegendItem}>
                      <span className={styles.mockLangDot} style={{ backgroundColor: l.color }} />
                      <span>{l.name}</span>
                      <strong className={styles.mockLangPct}>{l.pct}%</strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* Secret Scan */}
              <div className={styles.mockMetricRow}>
                <span className={styles.mockRowLabel}>Zero-Allocation Secret Scan</span>
                <span className={styles.mockBadgeGreen}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {data.secretsStatus}
                </span>
              </div>
            </div>

            {/* AI Insight Card */}
            <div className={styles.mockAiCard}>
              <div className={styles.mockAiHeader}>
                <div className={styles.mockAiIcon}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </div>
                <div>
                  <div className={styles.mockAiTitle}>Gemini 3.8 Flash Synthesis</div>
                  <div className={styles.mockAiSub}>AST Symbol Manifest Grounded</div>
                </div>
              </div>

              <div className={styles.mockAiBubble}>
                &ldquo;{data.dossierSummary}&rdquo;
              </div>

              <div className={styles.mockFeatureHighlights}>
                <div className={styles.mockFeatureItem}>
                  <div className={styles.mockFeatureIconWrapper}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                  </div>
                  <div>
                    <strong>Zero-Disk Streaming</strong>
                    <p>Processed entirely in-memory via Octokit Zipball stream.</p>
                  </div>
                </div>
                <div className={styles.mockFeatureItem}>
                  <div className={styles.mockFeatureIconWrapper}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                    </svg>
                  </div>
                  <div>
                    <strong>Staleness Detection</strong>
                    <p>Tracks remote commit SHAs with 1-click re-analysis trigger.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Interactive C4 Diagram */}
        {activeTab === "diagram" && (
          <div className={`${styles.mockDiagramPane} preview-tab-pane`} role="tabpanel">
            <div className={styles.mockDiagramToolbar}>
              <div className={styles.mockDiagramMeta}>
                <strong>C4 Component Diagram</strong>
                <span>Auto-Sanitized Mermaid Canvas</span>
              </div>
              <div className={styles.mockDiagramActions}>
                <span className={styles.mockPill}>Trackpad Zoom 100% Clamped</span>
                <span className={styles.mockPill}>Two-Finger Pan</span>
              </div>
            </div>

            <div className={styles.mockMermaidVisual}>
              <div className={styles.mermaidNodeBox} style={{ borderColor: "var(--color-primary)" }}>
                <span className={styles.nodeKind}>CLIENT</span>
                <strong>React 19 SPA (Vite + Bun)</strong>
                <span className={styles.nodeMeta}>JWT AuthContext • Tailwind</span>
              </div>

              <div className={styles.mermaidArrow}>
                <span>HTTPS / SSE</span>
                <span className={styles.arrowLine} />
              </div>

              <div className={styles.mermaidNodeBox} style={{ borderColor: "#d97706" }}>
                <span className={styles.nodeKind}>API GATEWAY</span>
                <strong>.NET 10 Web API (Port 5050)</strong>
                <span className={styles.nodeMeta}>Clean Architecture • Scalar OpenAPI</span>
              </div>

              <div className={styles.mermaidArrow}>
                <span>In-Memory Zip</span>
                <span className={styles.arrowLine} />
              </div>

              <div className={styles.mermaidNodeBox} style={{ borderColor: "#10b981" }}>
                <span className={styles.nodeKind}>ANALYSIS ENGINE</span>
                <strong>Roslyn AST & Polyglot Scanner</strong>
                <span className={styles.nodeMeta}>Cyclomatic Math • [GeneratedRegex]</span>
              </div>

              <div className={styles.mermaidArrow}>
                <span>Manifest</span>
                <span className={styles.arrowLine} />
              </div>

              <div className={styles.mermaidNodeBox} style={{ borderColor: "#f59e0b" }}>
                <span className={styles.nodeKind}>AI SYNTHESIS</span>
                <strong>Google Gemini 3.8 Flash</strong>
                <span className={styles.nodeMeta}>Semantic Kernel 1.81 • PROJECT_KNOWLEDGE.md</span>
              </div>
            </div>

            <div className={styles.mockDiagramFooter}>
              <span>{data.c4Summary}</span>
            </div>
          </div>
        )}

        {/* Tab 3: Gemini Knowledge Dossier */}
        {activeTab === "dossier" && (
          <div className={`${styles.mockDossierPane} preview-tab-pane`} role="tabpanel">
            <div className={styles.mockDossierHeader}>
              <div>
                <span className={styles.dossierFileName}>PROJECT_KNOWLEDGE.md</span>
                <span className={styles.dossierSub}>Generated Dossier Artifact</span>
              </div>
              <span className={styles.dossierSasBadge}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                15-Min Azure Blob SAS URL
              </span>
            </div>

            <div className={styles.dossierContentMock}>
              <div className={styles.dossierSection}>
                <h4># 1. Executive Architecture Summary</h4>
                <p>{data.dossierSummary}</p>
              </div>

              <div className={styles.dossierSection}>
                <h4># 2. Complexity Hotspots & Technical Debt</h4>
                <div className={styles.dossierHotspotRow}>
                  <code>src/Analysis/RoslynAnalyzer.cs</code>
                  <span className={styles.hotspotBadgeLow}>CC: {data.complexity} • Churn: {data.churn}</span>
                </div>
              </div>

              <div className={styles.dossierSection}>
                <h4># 3. ELI5 Developer Onboarding</h4>
                <p>
                  New to this repo? Start by inspecting the entrypoint. All business logic is isolated
                  from network transports, enabling quick testing without running external dependencies.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Grounded Copilot Drawer */}
        {activeTab === "copilot" && (
          <div className={`${styles.mockCopilotPane} preview-tab-pane`} role="tabpanel">
            <div className={styles.mockChatStream}>
              <div className={styles.chatMessageUser}>
                <span>How does the zero-disk ingestion stream work for {data.name}?</span>
              </div>

              <div className={styles.chatMessageAssistant}>
                <div className={styles.chatAvatar}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </div>
                <div className={styles.chatBubbleText}>
                  <p>{data.copilotResponse}</p>
                  <div className={styles.chatGroundedBadge}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Grounded on PROJECT_KNOWLEDGE.md</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.mockChatInputBar}>
              <input
                type="text"
                readOnly
                placeholder={`Ask about architecture, dependencies, or runbooks for ${data.name}...`}
                className={styles.mockChatInput}
              />
              <button type="button" className={styles.mockChatSendBtn} aria-label="Send query">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
