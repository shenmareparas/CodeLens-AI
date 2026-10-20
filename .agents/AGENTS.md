# AGENTS.md — CodeLens AI Agent Rules & Context

## 1. Project Identity & Core Architecture

- **Project:** CodeLens AI (Repository Intelligence, Architecture Auditor & Onboarding Copilot)
- **Monorepo Layout:**
  - `frontend/`: React 19 SPA (Vite + Bun), TypeScript, Tailwind CSS, React Router, client-side JWT AuthContext
  - `backend/`: C# .NET 10 (`net10.0`) 3-project Clean Architecture solution (`CodeLens.Core`, `CodeLens.Infrastructure`, `CodeLens.Api`) + `tests/CodeLens.Tests`
- **Cloud & Storage:** Microsoft Azure (Container Apps, Static Web Apps, Cosmos DB NoSQL Free Tier, Azure Blob Storage)
- **AI Engine:** Google Gemini 3.8 Flash (`gemini-3.8-flash`) via `Microsoft.SemanticKernel` (`1.81.0`) using a Google AI Studio API Key

---

## 2. Strict Environment & Command Rules

### Frontend (`frontend/`)

- **NEVER** use `npm`, `npx`, `yarn`, or `pnpm`. **ALWAYS** use **Bun** (`bun install`, `bun add`, `bun run dev`, `bun run build`).
- **Framework & Router:** React 19 SPA powered by Vite and React Router DOM (`v7`).
- **Route Protection & 404:** Handled via `<ProtectedRoute>` in `src/App.tsx`, verifying authentication state in `AuthContext.tsx`. Catch-all route `*` renders `NotFoundPage.tsx` with theme integration, quick navigation links, and contextual redirect.
- **Vite Config Convention:** Use ESM-native `import.meta.dirname` for path resolution (`path.resolve(import.meta.dirname, "./src")`) inside `vite.config.ts`, not `__dirname`.
- **API Client Normalization:** `src/lib/api-client.ts` sanitizes `API_BASE` (`RAW_API_BASE.trim().replace(/\/+$/, "")`) to protect against trailing whitespace or carriage returns from CI environment variables.
- **Hydration & Anti-Flash Safety:** Pre-hydration theme script runs directly inside `frontend/index.html` to eliminate theme flashing.
- **Verification Commands:** Always run `bun run build` and `bun run lint` inside `frontend/` to verify TypeScript static bundle compilation and zero ESLint errors/warnings before finishing a task.
- **ESLint 9 Flat Config (`eslint.config.mjs`):** Uses modern flat configuration with `@eslint/js`, `typescript-eslint`, and `eslint-plugin-react-hooks`. Obey canonical React Rules of Hooks (never place hooks after conditional returns; memoize context handlers). Maintain a strict **0-error and 0-warning** linting baseline.
- **Diagnostics & Quality (`react-doctor`):** Before completing frontend features or committing React code, invoke the workspace skill `react-doctor` (`.agents/skills/react-doctor/SKILL.md`) to verify accessibility, bundle efficiency, and anti-patterns. Maintain a 0-warning baseline.

### Backend (`backend/`)

- **Target Framework:** Strictly `.NET 10` (`net10.0`) across all `.csproj` files. Do NOT downgrade to `net8.0` or `net9.0`.
- **Zero-Warning Policy:** `dotnet build CodeLens.sln` must succeed with **0 errors and 0 warnings**.
- **Port Assignment:** Backend API runs on `5050` (`http://localhost:5050`) to prevent collisions with macOS AirPlay (`ControlCenter` on port 5000). Never revert to port 5000.
- **CORS Policy:** Automatically permits Azure Static Web Apps domains (`*.azurestaticapps.net`), localhost origins (`http://localhost:*`), and origins defined in `AllowedOrigins` with credentials enabled.
- **ID Generation:** Use standard alphanumeric GUID formatting (`Guid.NewGuid().ToString("N")`). Do NOT introduce external `Ulid` packages.
- **API Documentation:** Uses Scalar OpenAPI UI at `/scalar/v1` (`http://localhost:5050/scalar/v1`). Do NOT replace Scalar with Swashbuckle.
- **Unit Testing:** Maintain and run xUnit tests in `tests/CodeLens.Tests/` via `dotnet test backend/CodeLens.sln`.

---

## 3. Architectural Guardrails & Coding Standards

### 3.1 Credentials Authentication (`AuthService.cs` & `src/context/AuthContext.tsx`)

- **Supported Flows:**
  1. `POST /api/auth/register` — Email/password registration using PBKDF2 with HMAC-SHA512 + 100,000 iterations. Enforces strong password rules (8+ chars, uppercase, lowercase, digit, special symbol).
  2. `POST /api/auth/login` — Email/password login returning a signed HS256 backend JWT.
  3. `POST /api/auth/set-password` — Authenticated endpoint to change or update local password.
  4. `DELETE /api/auth/users` — Cleanup endpoint to purge all users in development.
- **Frontend Password UX:** Password forms in `frontend/src/pages/` feature interactive eye show/hide visibility toggles, real-time password criteria validation badges, dynamic strength meters, and confirm-password matching.
- **Frontend Session Contract:** `AuthContext.tsx` stores the backend-issued HS256 JWT in `localStorage` under `codelens-token`. All API calls in `src/lib/api-client.ts` pass `Authorization: Bearer ${token}`.

### 3.2 Zero-Disk Ingestion Pipeline

- **NEVER** execute `git clone` to the local filesystem.
- Always stream the repository's default branch via Octokit's Zipball API directly into memory (`System.IO.Compression.ZipArchive`).
- Filter out non-source, tooling, and vendor directories during stream iteration: `node_modules/`, `.git/`, `.agents/`, `bin/`, `obj/`, `dist/`, `.next/`, `vendor/`, and binary assets.
- **Hotspot Formula:** Calculate file hotspot risk scores deterministically as:
  `RiskScore = Math.Round(CyclomaticComplexity * Math.Log(ChurnCount + 1), 2)`
  - Files under `.agents/` or configuration tooling directories are explicitly ignored to avoid polluting codebase complexity heatmaps.
- **Polyglot Dependency Manifest Parsing:**
  - **Bun & Node.js:** Parses `bun.lock` (Bun 1.2+ text lockfile with trailing commas) and `package.json`. If `bun.lock`, `bun.lockb`, `bunfig.toml`, or `packageManager: "bun@..."` is detected, packages are labeled under `Bun` and `Bun (dev)`; otherwise defaults to `npm` and `npm (dev)`.
  - **Dart & Flutter:** Parses `pubspec.yaml` with indentation tracking to capture `dependencies:` (`Pub`), `dev_dependencies:` (`Pub (dev)`), and `dependency_overrides:` (`Pub (override)`), resolving nested sub-properties (`sdk: flutter`, `git:`, `path:`, `version:`) into package version metadata.
  - **.NET, Python, Go & Rust:** Parses `.csproj` / `Directory.Build.props` (`NuGet`), `requirements.txt` (`PyPI`), `go.mod` (`Go Modules`), and `Cargo.toml` (`Cargo`).
- **Secret Scanning & Benign Template Filtering:**
  - Use `.NET 10` compile-time `[GeneratedRegex]` attributes inside `RegexSecretScanner.cs` for zero-allocation pattern matching.
  - `.env.example`, `.env.sample`, and `.env.template` files containing dummy placeholder keys (e.g. `your-...`, `example`, `000000`) are intelligently ignored to eliminate false-positive security surface alerts.
- **GitHub Rate Limits & Quotas:** Unauthenticated IP quota is 60 requests/hr. Supplying `GITHUB_TOKEN` in the environment or `appsettings.Development.json` unlocks 5,000 requests/hr. `OctokitTelemetryService.cs` automatically inspects remaining rate quota to avoid exhausting unauthenticated calls.

### 3.3 Gemini 3.8 Flash & Dossier Synthesis

- **Model Identifier:** Always use `gemini-3.8-flash` via `Microsoft.SemanticKernel` (`1.81.0`).
- **macOS SSL & Network Resilience:** Semantic Kernel's Gemini connector uses a custom `SocketsHttpHandler` with `CertificateRevocationCheckMode = X509RevocationMode.NoCheck` to prevent macOS `AuthenticationException` / `RevocationStatusUnknown` errors when validating Google API endpoints, while preserving full cryptographic certificate chain validation.
- **Context Discipline:** Never send raw multi-megabyte source files to Gemini. Pass the compact **AST Symbol Manifest** + deterministic telemetry summary extracted during static analysis.
- **Resilient Fallback Synthesis:** When `Gemini:ApiKey` / `GEMINI_API_KEY` is omitted or invalid, `GeminiSynthesisService.cs` executes a deterministic fallback synthesis engine derived from AST telemetry and package manifests, guaranteeing zero-failure local development and CI runs.
- **Mermaid Sanitization:** All LLM-generated Mermaid diagrams are sanitized via `MermaidSanitizer.cs` to quote complex node labels containing brackets/colons/parentheses, normalize subgraph identifiers, and balance open blocks.
- **Dossier Artifact:** Every completed audit compiles a standardized `PROJECT_KNOWLEDGE.md` file via `MarkdownDossierBuilder.cs`, uploads it to Azure Blob Storage (`project-dossiers` container) via `IBlobStorageService`, and caches the markdown in `AuditDocument.DossierMarkdown` in Cosmos DB.
- **Chat Endpoints & Stream Resilience (`/api/chat`):**
  - `POST /api/chat/{id}/stream`: Real-time SSE streaming copilot grounded strictly on `PROJECT_KNOWLEDGE.md`. Sets response headers `Content-Type: text/event-stream`, `Cache-Control: no-cache`, and `X-Accel-Buffering: no`. Streams tokens as JSON payloads (`data: {"text":"..."}\n\n`). Stream consumption is wrapped in a resilient try-catch to seamlessly fall back to local grounded answers without dropping connections (preventing 500 errors).
  - **Rate Limit Propagation & Quota Banner:** When Gemini API returns `429 Too Many Requests` or quota exhaustion, `GeminiSynthesisService.cs` extracts the actual retry delay from Google's response (`retryDelay` / `retry in Xh Ym Zs`) and emits `[CODELENS_RATELIMIT_EXHAUSTED:{seconds}]`. `ChatEndpoints.cs` converts this into an SSE event `data: {"text":"","rateLimited":true,"retryAfterSeconds":{seconds}}\n\n` without polluting stored chat history. `RepoChatSidebar.tsx` renders a prominent top warning banner with a live countdown timer (`Resets in MM:SS` or `Hh MMm`), which automatically and synchronously dismisses the banner as soon as the countdown finishes, while continuing uninterrupted with local AST grounded answers.
  - `GET /api/chat/{id}`: Fetches stored conversation messages for audit sessions.
  - `DELETE /api/chat/{id}`: Purges conversation history for an audit from Cosmos DB / in-memory store.
- **Chat Presentation & Persistence (`RepoChatSidebar.tsx`):**
  - Renders assistant responses with `ReactMarkdown` and `remark-gfm` featuring styled typography, syntax-highlighted code blocks, lists, and headers instead of raw text.
  - Retains conversation state across drawer close/re-open via synchronized `localStorage` (`codelens-chat-${auditId}`) and backend `GET /api/chat/{id}` synchronization.
  - Features an interactive `[ 🗑️ Clear ]` action in the chat header to reset conversation history both locally and on the server.
  - Features a rate-limit banner pinned under the header with live monospace cooldown countdown (`Hh MMm` / `MM:SS`), instantaneous auto-dismiss upon timer completion (`Boolean(rateLimitUntil && secondsRemaining > 0)`), and manual dismiss option.

### 3.4 Cosmos DB Free-Tier Efficiency & Local Dev Fallbacks

- Containers in `CosmosRepository.cs`: `users`, `audits`, `messages` (`ChatSessions`).
- Always include the Partition Key in point reads and queries to keep operations under 1–2 RUs within the 1,000 RU/s lifetime free tier.
- **In-Memory Fallbacks:** `InMemoryCosmosRepository` and `InMemoryBlobStorageService` are used automatically when Azure connection strings are omitted or placeholder, enabling zero-setup local development.

### 3.5 GSAP-Powered Modern Landing Page, Unified Dashboard & Theme System

- **GSAP-Powered Modern Landing Page (`HomePage.tsx` & `src/components/landing/`):**
  - **Floating Island Navigation Bar & Silky Smooth Scrolling:** Centered, fixed floating pill navbar (`.navWrapper` + `.nav`) with glassmorphic backdrop (`backdrop-filter: blur(20px) saturate(190%)`), border glow, dynamic scroll elevation (`.navScrolled`), and calibrated section scroll margins (`scroll-margin-top: 7.5rem` desktop, `5.5rem` mobile across `#hero`, `#preview`, `#pipeline`, `#features`, `#ecosystem`, and `#comparison`). Primary navigation links (*Live Demo*, *Architecture*, *Capabilities*, *Ecosystems*, *Why CodeLens*) sit directly on the navbar surface without nested container boxes, matching the natural sequential flow of the page, featuring soft hover pill states (`rgba(255, 255, 255, 0.08)` / light `rgba(0, 0, 0, 0.05)`) and an unadorned Sign In action pill (trailing arrows removed). Smooth anchor transitions are implemented via root `scroll-behavior: smooth` in `globals.css` (with `@media (prefers-reduced-motion: reduce)` accessibility override) and JavaScript `scrollIntoView({ behavior: "smooth" })` via `handleNavScroll` and `handleLogoClick` in `HomePage.tsx`.
  - **Centered Viewport Hero (Section 1):** Full-height dynamic viewport centering (`min-height: 100dvh; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;`) with `scroll-margin-top: 7.5rem`, providing optical balance beneath the fixed floating navbar. Houses the live emerald pulse status, staggered headline, dual CTAs (*Get Started Free* and smooth-scrolling *See How It Works*), and a 4-stat metrics ribbon.
  - **Symmetrical 3×2 Capability Bento Grid (`BentoFeaturesSection.tsx`):** Standardized single-column geometry across all 6 core capability cards—including Deterministic Cyclomatic Hotspots—eliminating oversized 2-column span asymmetry (`.bentoCardFeatured` removed) to achieve uniform visual balance across dark and light themes.
  - **Proportional Inter-Section Rhythm:** Standardized `9.5rem` (152px) desktop and `5.5rem` mobile inter-section spacing, with `3.5rem` section header bottom margins, delivering a deliberate 3:1 spatial rhythm conforming to anti-slop frontend standards (0 lint violations across all views).
  - **Official Brand Favicon (`public/favicon.svg`):** High-definition 32x32 SVG squircle with an architectural amber-to-bronze gradient (`#f59e0b` → `#b45309`), inner border highlight, drop-shadow depth, and the official CodeLens search/lens crosshair glyph with focal spark. Linked in `index.html` via `rel="icon"` and `rel="apple-touch-icon"`.
  - **The Zero-Clone Engine (`IngestionPipelineSection.tsx`):** Anti-slop, developer-grade architecture presentation strictly adhering to `@design-taste-frontend`. Eliminates decorative index numbering (`01/02/03`), fake status dots, card drop shadows at rest, top color accent bars, and directional flow arrows. Renders bare vector SVG icons directly alongside runtime specs (`System.IO.ZipArchive`, `Roslyn AST + Multi-Manifest`, `Complexity × ln(Churn + 1)`, `Gemini 3.8 Flash + SK`), tangible engine artifact chips (`<code>System.IO.ZipArchive</code>`, `<code>AST Symbol Manifest</code>`, `<code>Deterministic Risk Map</code>`, `<code>PROJECT_KNOWLEDGE.md</code>`), and performance metrics (`0 MB Disk Footprint`, `Sub-Second Traversal`, etc.) inside a clean console marked `data-ui="true"` with flat surfaces.
  - **Orchestration & Performance:** Uses `useGSAP` hook with `gsap.matchMedia()` container scoping. If `prefers-reduced-motion: reduce` is detected, animations are gracefully bypassed to ensure full accessibility.
  - **Ambient & Batch Animations:** Master entrance timeline for hero text/CTAs, `ScrollTrigger.batch` for stagger reveals on bento feature cards and ecosystem cards, and a single cohesive container reveal for the comparison table (`.comp-table`), eliminating distracting line-by-line staggered entry.
  - **Interactive Sandbox Window (`HeroPreviewTabs.tsx`):** macOS-style window mock with clean `https://codelens.ai/` address bar, section header (*Interactive Codebase Sandbox* at `#preview`), and 4 interactive preview tabs (*Telemetry Bento*, *Interactive C4 Diagram*, *Knowledge Dossier*, *Grounded Copilot*).
  - **Live Demo Repository Selector:** Pinned directly above the interactive mock window, allowing 1-click state switching across 4 representative polyglot repositories (`shenmareparas/CodeLens-AI`, `shenmareparas/Chess`, `play-store-ai-review`, `Portfolio_NextJS`).
  - **Polyglot Ecosystem Vectors (`EcosystemSection.tsx`):** Official brand vector SVG paths from Simple Icons for Bun (bao dumpling), Dart & Flutter, .NET 10, Node.js, Python (dual snake), Go (stylized speed mark), and Rust (gear & 'R').
  - **Strict Button & Icon Styling:** Zero emojis anywhere in landing UI (strictly SVG vector icons). All button links and child elements enforce `text-decoration: none !important` across all hover, focus, and active states.
- **Unified Home Dashboard:** All audit content (Telemetry Bento Grid, Architecture Diagram, and Knowledge Dossier) lives in the main dashboard view (`/dashboard`). Navigation is streamlined via view tabs (`Split Workspace`, `Telemetry Bento`, `Mermaid Diagram`, `Knowledge Dossier`) on the home screen.
- **All-Time Commits & Chronological Activity Pulse:** `OctokitTelemetryService.FetchTotalCommitsAsync` inspects GitHub API pagination headers (`rel="last"`) with `PageSize=1` to retrieve the true lifetime commit count in 1 API call. `OctokitTelemetryService.FetchCommitActivityAndTimelineAsync` generates a chronological commit history grouped by month and year (or spaced lifetime intervals for older/newer repos), passing `CommitTimeline` with date ranges and month/year axis labels directly into the front-end `SparklineChart.tsx`. Displayed with hover card inspections (`X commits (MMM dd, yyyy - MMM dd, yyyy)`) and dynamic X-axis labels.
- **Dual-Mode Language Distribution (`LanguageDistributionCard.tsx`):** Features interactive Bar mode (compact multi-segment progress bar + proportional language rows) and Circular mode (two-column Donut chart + scrollable legend) with a dominant stack banner.
- **Floating AI Drawer:** A floating bottom-right `[ ✨ Ask AI ]` button (and top header action) opens a slide-over AI copilot drawer grounded in the repository's `PROJECT_KNOWLEDGE.md`, featuring prompt suggestion chips, conversation persistence, clear chat capability, real-time streaming tokens, and live quota countdown alerts.
- **Trackpad Gestures, Dynamic Zoom & Pan Clamping:**
  - `MermaidViewer.tsx` and `FullscreenMermaidModal.tsx` support native trackpad pinch-to-zoom (`ctrlKey + wheel` / `gesturestart` / `gesturechange`) and two-finger panning.
  - Normalized zoom scale where `1.0` represents 100% fit-to-screen baseline. Zoom out is clamped at `1.0` to prevent diagrams from shrinking into invisibility.
  - Viewport pan clamping (`clampPan` wrapped in `useCallback`) prevents the diagram from moving fully out of the container screen during mouse drag or two-finger trackpad panning.
  - Quick `[ ↺ Reset ]` action button restores the diagram view to default auto-fit scale (100% / 1.0) and `(0, 0)` pan coordinates.
- **Streamlined Theme Architecture (`ThemeContext.tsx` & `ThemeToggle.tsx`):**
  - **System Default:** Initial state defaults to `"system"`, resolving automatically to the user's OS color scheme via `matchMedia("(prefers-color-scheme: light)")`.
  - **Binary Dark / Light Toggling:** Removed the 3-step cycle and "system" monitor button from the toggle UI. `toggleTheme()` toggles directly between `"dark"` and `"light"`.
  - **Icon-Only Button & Floating Tooltip:** [ThemeToggle.tsx](file:///Users/parasshenmare/Developer/other_projects/codelens-ai/frontend/src/components/ThemeToggle.tsx) is rendered as a clean 36×36px circular button with strictly the Sun SVG (in light mode) or Moon SVG (in dark mode). Features an accessible floating glassmorphic tooltip with a triangular top pointer arrow dynamically indicating `"Switch to light mode"` or `"Switch to dark mode"` on `:hover` and keyboard `:focus-visible` (`pointer-events: none`).
  - Pre-hydration anti-flash script in `index.html` reads `localStorage` before paint to eliminate light/dark flickering.
  - Adaptive CSS variables in `globals.css` provide high contrast for input boxes, placeholders, headings, code blocks, and scrollbars in both dark and light modes.
  - Mermaid diagrams automatically re-render with adapted dark/light color palettes upon theme change.
- **Shared Repository Cache & 1-Click Re-Analysis:** `POST /api/audit` checks `ICosmosRepository.GetLatestAuditByRepoAsync(repoId)` to return cached audit telemetry and synthesized dossiers in `<50ms`. Remote commit SHA staleness detection flags outdated audits and provides a 1-click `[ 🔄 Re-analyze Latest Commits ]` trigger (`forceRefresh: true`).

### 3.6 Zero-Cost Cloud Provisioning & CI/CD

- **Bicep Infrastructure as Code (`infra/`):**
  - Declarative templates in `infra/main.bicep` and `infra/main.parameters.json`.
  - **Regional Topology:** Primary compute/storage resources reside in `Central India` (`rg-codelens-prod`), with Azure Static Web Apps anchored in `East Asia` (`eastasia`) with global edge CDN distribution.
  - **Cosmos DB Free Tier:** Configured with `enableFreeTier: true` (1,000 RU/s lifetime free throughput, 25 GB storage) and containers `Users` (`/id`), `Audits` (`/repositoryId`), and `ChatSessions` (`/auditId`).
  - **Azure Container Apps:** Deploys backend API in container app `ca-codelens-api` under Consumption workload profile with `minReplicas: 0` (scale-to-zero) and `maxReplicas: 2` (0.25 vCPU, 0.5 Gi memory) on port 5050 for zero idle compute billing.
  - **Azure Static Web Apps:** Hosts Next.js frontend on Free SKU (`swa-codelens-app`) with global edge caching and automatic SSL.
  - **Azure Blob Storage:** General Purpose v2 storage account (`stcodelens...`) with container `project-dossiers` for dossier markdown and SAS tokens.
- **GitHub Actions Workflows (`.github/workflows/`):**
  - `deploy-backend.yml`: Automatically builds .NET 10 solution, runs 30/30 xUnit tests, packages Docker container image to GitHub Container Registry (GHCR) using strictly lowercase image naming (`shenmareparas/codelens-api`), and deploys to Azure Container Apps (`ca-codelens-api` in `rg-codelens-prod`).
  - `deploy-frontend.yml`: Executes Bun Vite React build and deploys pre-built static artifacts to Azure Static Web Apps (`swa-codelens-app`).

---

## 4. Key File Map

```text
codelens-ai/
├── README.md                                         # Quickstart, setup, and overview
├── .github/
│   └── workflows/
│       ├── deploy-backend.yml                        # CI/CD: .NET 10 build, xUnit test, Docker GHCR & ACA deploy
│       └── deploy-frontend.yml                       # CI/CD: Vite React build & SWA deploy
├── infra/
│   ├── main.bicep                                    # Zero-cost Azure Bicep template (ACA, SWA, Cosmos, Blob)
│   └── main.parameters.json                          # Parameter configurations for Azure environment
├── .agents/
│   ├── AGENTS.md                                     # AI coding agent instructions & guardrails
│   ├── PROJECT_CONTEXT.md                            # Comprehensive architectural single-source-of-truth
│   └── skills/
│       ├── react-doctor/                             # React architecture, lint & bundle diagnostics skill
│       ├── vercel-react-best-practices/              # Vercel React & Next.js performance optimization skill
│       └── gsap-*                                    # Official GSAP AI skills (core, react, timeline, scrolltrigger, plugins, etc.)
├── backend/
│   ├── CodeLens.sln
│   ├── Dockerfile                                    # Multi-stage .NET 10 container image (port 5050)
│   ├── tests/
│   │   └── CodeLens.Tests/                           # xUnit Test Suite (31 tests)
│   │       ├── OctokitTelemetryTests.cs
│   │       ├── RoslynAndPolyglotAnalyzerTests.cs
│   │       ├── SecretScannerTests.cs
│   │       ├── UserRepositoryTests.cs
│   │       └── GeminiSynthesisTests.cs               # SK, Mermaid sanitizer & dossier tests
│   └── src/
│       ├── CodeLens.Core/
│       │   ├── Entities/                             # UserDocument, AuditDocument, ChatMessageDocument
│       │   ├── DTOs/                                 # ApiDtos.cs, TelemetryDtos.cs
│       │   └── Interfaces/                           # ICosmosRepository, IBlobStorageService, IGitHubTelemetryService, ICodeAnalysisService, IGeminiSynthesisService
│       ├── CodeLens.Infrastructure/
│       │   ├── Auth/AuthService.cs                   # PBKDF2 Password Hashing & HS256 JWT Service
│       │   ├── Data/CosmosRepository.cs              # Cosmos DB persistence
│       │   ├── Data/InMemoryCosmosRepository.cs      # Local in-memory repository fallback
│       │   ├── Data/BlobStorageService.cs            # Azure Blob + 15-min SAS URLs
│       │   ├── Data/InMemoryBlobStorageService.cs    # Local in-memory blob fallback
│       │   ├── GitHub/OctokitTelemetryService.cs     # Commits, sparklines, releases, zipball stream, rate budgeting
│       │   ├── Analysis/RoslynAndPolyglotAnalyzer.cs # AST, cyclomatic complexity, hotspots, dead code, dependencies
│       │   ├── Security/RegexSecretScanner.cs        # [GeneratedRegex] secret detection
│       │   └── AI/                                   # Gemini AI Engine
│       │       ├── GeminiOptions.cs                  # Gemini API options & model config
│       │       ├── GeminiSynthesisService.cs         # SK connector & fallback synthesis engine
│       │       ├── MermaidSanitizer.cs               # Diagram AST syntax cleanup & label quoting
│       │       └── MarkdownDossierBuilder.cs         # Standardized PROJECT_KNOWLEDGE.md generator
│       └── CodeLens.Api/
│           ├── Endpoints/                            # AuthEndpoints, AuditEndpoints, ChatEndpoints
│           └── Program.cs                            # Port 5050, DI, JWT Bearer, CORS, Scalar OpenAPI
└── frontend/
    ├── package.json
    ├── bun.lock
    ├── vite.config.ts
    ├── index.html                                    # SPA entrypoint with anti-flash theme script
    ├── staticwebapp.config.json                      # Azure SWA navigation fallback & headers
    ├── public/
    │   └── staticwebapp.config.json                  # Azure SWA navigation fallback deployed to dist/
    └── src/
        ├── main.tsx                                  # React DOM entrypoint
        ├── App.tsx                                   # React Router DOM + ProtectedRoute + code splitting
        ├── context/
        │   ├── AuthContext.tsx                       # JWT authentication context
        │   └── ThemeContext.tsx                      # Pure Light/Dark/System theme context with memoized value
        ├── pages/
        │   ├── HomePage.tsx                          # Modern Product Landing Page with hero, features & CTA
        │   ├── HomePage.module.css                   # Glassmorphic landing styles & animations
        │   ├── SignInPage.tsx                        # Tabbed presentation container with back-to-home
        │   ├── CredentialsForm.tsx                   # Form state, validation & submission logic
        │   ├── PasswordValidationComponents.tsx      # Eye toggles, strength meter, checklist badges
        │   ├── passwordUtils.ts                      # Criteria scoring & evaluation rules (hoisted regexes)
        │   ├── SignInPage.module.css                 # Glassmorphic component styles
        │   ├── NotFoundPage.tsx                      # 404 error page with theme cycle & contextual navigation
        │   ├── NotFoundPage.module.css               # 404 error page styles
        │   └── DashboardPage.tsx                     # Protected dashboard page
        ├── components/
        │   ├── landing/                              # GSAP modular landing page sections
        │   │   ├── HeroSection.tsx                   # Hero introduction, stats ribbon & CTAs
        │   │   ├── HeroPreviewTabs.tsx               # macOS sandbox window with demo repo controls & 4 tabs
        │   │   ├── IngestionPipelineSection.tsx      # 4-stage progressive zero-disk streaming pipeline cards
        │   │   ├── BentoFeaturesSection.tsx          # 3x2 uniform bento capabilities grid
        │   │   ├── EcosystemSection.tsx              # Polyglot manifest intelligence & official Simple Icons
        │   │   ├── ComparisonSection.tsx             # Dimension-by-dimension comparison table
        │   │   └── CtaBannerSection.tsx              # Conversion CTA banner & community links
        │   ├── BrandLogo.tsx                         # Reusable vector brand logo mark
        │   ├── ThemeToggle.tsx                       # Universal glassmorphic theme toggle button
        │   ├── ThemeToggle.module.css                # Animated theme toggle styles
        │   ├── DashboardClient.tsx                   # Unified Dashboard (Bento Grid, Dossier & Diagram tabs)
        │   ├── DashboardHeader.tsx                   # Top bar navigation, user profile avatar & sign out
        │   ├── DashboardHeader.module.css            # Header layout, avatar & signout styles
        │   ├── ActiveAuditSection.tsx                # Active audit summary, stale banner & lazy-loaded view tabs
        │   ├── AnalysisProgressBar.tsx               # Multi-stage animated pipeline progress bar with shimmer & step indicators
        │   ├── analysisSteps.ts                      # 6-step analysis stage metadata, icons, and descriptions
        │   ├── TelemetryBentoGrid.tsx                # Bento Grid telemetry presentation (stable keys)
        │   ├── DependenciesCard.tsx                  # Polyglot dependency cards with ecosystem filter tabs & search
        │   ├── LanguageDistributionCard.tsx          # Dual-mode Bar/Circular language distribution with dominant stack banner
        │   ├── HotspotTable.tsx                      # Complexity x Churn risk table (memoized filter & sort)
        │   ├── SparklineChart.tsx                    # SVG commit sparkline chart with all-time total commits pill
        │   ├── MermaidViewer.tsx                     # Client-side Mermaid diagram canvas with pan/zoom/copy, 100% reset & a11y region
        │   ├── FullscreenMermaidModal.tsx            # Fullscreen interactive diagram modal with pan/touch clamping
        │   ├── InlineMermaidBlock.tsx                # Flow diagram renderer for AI chat markdown responses
        │   ├── ThinkingLines.tsx                     # Claude-style multi-line animated thinking shimmer state
        │   ├── DossierViewer.tsx                     # Formatted Markdown dossier preview with SAS download
        │   └── RepoChatSidebar.tsx                   # Real-time SSE grounded repo copilot sidebar with markdown, inline diagrams & rate-limit banner
        ├── styles/
        │   └── globals.css                           # Glassmorphism design system, tokens (Plus Jakarta Sans, Inter, JetBrains Mono)
        └── lib/
            ├── api-client.ts                         # Typed REST API & SSE client (sanitized API_BASE, chat persistence endpoints)
            └── mermaidUtils.ts                       # Client-side Mermaid syntax normalizer & label quoting
```

- **Dashboard Quick Samples & Shared Cache:** `DashboardClient.tsx` provides quick-sample chips linking to lightweight repositories (`shenmareparas/Chess`, `expense_tracker`, `play-store-ai-review`, `Portfolio_NextJS`, `nexu5-music-bot`) and retrieves shared audits in `<50ms` with remote commit staleness detection.

---

## 5. Pre-Commit Verification Checklist for Agents

1. Run `dotnet build backend/CodeLens.sln` — Must output `0 Warning(s)` and `0 Error(s)`.
2. Run `dotnet test backend/CodeLens.sln` — All xUnit tests must pass (currently 31/31).
3. Run `cd frontend && bun run build` — Must pass typechecking and static bundle compilation cleanly.
4. Run `bunx react-doctor@latest --scope changed` — Verify diagnostics baseline.
5. Verify no secrets or API keys are hardcoded in `appsettings.json` or `.env.local`.
