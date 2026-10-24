# CodeLens AI — Project Context & Architectural Specification

> **Frameworks:** .NET 10 (`net10.0`), React 19 (Vite SPA), Bun runtime, Google Gemini 3.8 Flash

---

## 1. Executive Summary & Vision

**CodeLens AI** is an AI-powered repository intelligence, architecture auditor, and onboarding copilot. It ingests public and private GitHub repositories, calculates deterministic telemetry and AST complexity heatmaps without writing files to disk, and synthesizes comprehensive architectural knowledge dossiers (`PROJECT_KNOWLEDGE.md`) using **Google Gemini 3.8 Flash**.

### Core Value Propositions

1. **Zero-Disk Ingestion:** Direct in-memory streaming of GitHub default branches via zipball streams (`ZipArchive`), eliminating multi-gigabyte disk clone overhead.
2. **Deterministic Risk Scoring:** Mathematical hotspot identification combining cyclomatic code complexity with git commit churn:
   $$\text{Hotspot Risk} = \text{CyclomaticComplexity} \times \ln(\text{CommitChurn} + 1)$$
3. **Zero-Allocation Secret Detection:** Compiled `.NET 10` `[GeneratedRegex]` scanning for exposed credentials, private keys, and configuration secrets.
4. **Context-Disciplined AI Synthesis:** Rather than dumping multi-megabyte source code into an LLM context window, CodeLens compiles a compact **Symbol Manifest** + deterministic telemetry summary and prompts Gemini 3.8 Flash for architectural analysis, Mermaid.js diagrams, and onboarding runbooks.
5. **Grounded Repo Copilot:** Real-time Server-Sent Events (SSE) streaming chat where answers are grounded strictly in the synthesized `PROJECT_KNOWLEDGE.md` dossier.

---

## 2. Technology Stack & Environment

```text
                               ┌────────────────────────────────────────┐
                               │    React 19 SPA (Vite / Bun Runtime)   │
                               │    React Router v7 / Tailwind CSS      │
                               └──────────────────┬─────────────────────┘
                                                  │ HTTPS / Bearer JWT / SSE
                                                  ▼
                               ┌────────────────────────────────────────┐
                               │  ASP.NET Core .NET 10 Minimal Web API  │
                               │     Port 5050 · Scalar OpenAPI Docs    │
                               └───────┬──────────────────────┬─────────┘
                                       │                      │
                    ┌──────────────────┴───────────────┐      │
                    ▼                                  ▼      ▼
     ┌─────────────────────────────┐    ┌─────────────────────────────┐
     │  Cosmos DB (Users / Audits) │    │  Azure Blob (Dossier .md)   │
     │  (or In-Memory Fallback)    │    │  (or In-Memory Fallback)    │
     └─────────────────────────────┘    └─────────────────────────────┘
```

| Layer                      | Technology                     | Version / Spec        | Key Role                                                                                            |
| :------------------------- | :----------------------------- | :-------------------- | :-------------------------------------------------------------------------------------------------- |
| **Frontend Runtime**       | [Bun](https://bun.sh)          | `1.2+`                | Package manager and script runner (**NEVER** use npm/npx/yarn)                                      |
| **Frontend Framework**     | React 19 + Vite                | React 19, Vite 8      | Ultra-fast client-side SPA, zero Node.js server overhead on edge                                    |
| **Animation & Motion**     | GSAP + @gsap/react             | `3.15.0` / `2.1.2`    | Master timeline, `ScrollTrigger.batch`, `matchMedia` reduced-motion safety                          |
| **Styling & Design**       | Tailwind CSS / CSS Modules     | Custom Glassmorphism  | Dark/Light/System theme token system, smooth transitions                                            |
| **Code Quality & Linting** | ESLint 9 Flat Config           | `9.39.5`              | TypeScript-ESLint, React Hooks canonical rules, 0-warning baseline                                  |
| **Frontend Auth**          | Client AuthContext             | Custom JWT Hook       | Direct authentication against backend JWT endpoints with localStorage session                       |
| **Routing**                | React Router DOM               | `v7`                  | Client-side routing with `ProtectedRoute` and Azure SWA rewrites                                    |
| **Backend Framework**      | ASP.NET Core Minimal APIs      | `.NET 10` (`net10.0`) | High-performance, zero-warning asynchronous API                                                     |
| **Backend Language**       | C# 13                          | NetCoreApp 10.0       | Pattern matching, records, primary constructors                                                     |
| **API Documentation**      | Scalar OpenAPI                 | `/scalar/v1`          | Modern interactive API documentation                                                                |
| **AST & Code Analysis**    | Roslyn C# Compiler + Polyglot  | Roslyn 4.12+          | Zero-disk syntax parsing, cyclomatic complexity                                                     |
| **Git Ingestion Engine**   | Octokit.NET                    | `14.0.0`              | GitHub REST client, commit churn, zipball stream                                                    |
| **Database**               | Azure Cosmos DB NoSQL          | SDK `3.47.0`          | Free-Tier partition key indexing (`users`, `audits`, `messages`)                                    |
| **Blob Storage**           | Azure Blob Storage             | SDK `12.23.0`         | Container `project-dossiers`, 15-minute SAS tokens                                                  |
| **Local Fallbacks**        | In-Memory Repository & Storage | Built-in              | Zero-setup local development without Azure credentials                                              |
| **AI Orchestration**       | Microsoft Semantic Kernel      | `1.81.0`              | Gemini 3.8 Flash connector, GeminiPromptExecutionSettings & structured prompt engine                |
| **AI Model**               | Google Gemini 3.8 Flash        | `gemini-3.8-flash`    | Dynamic low reasoning (ThinkingLevel: "low"), ELI5 summary, Mermaid C4 diagram, architecture smells |

---

## 3. Subsystem Specifications

### 3.1 Credentials Authentication

- **Password Security:** Passwords hashed with PBKDF2 using HMAC-SHA512 and 100,000 iterations.
- **Complexity Policy:** Enforces 8+ characters, at least one uppercase (`A-Z`), one lowercase (`a-z`), one digit (`0-9`), and one special character (`!@#$%^&*...`).
- **Interactive Password UX:**
  - Eye/eye-off visibility toggle buttons for password and confirm-password fields.
  - Live criteria checklist with checkmark status badges.
  - Dynamic 5-level strength meter (`Weak` → `Fair` → `Good` → `Strong`).
  - Real-time confirm-password matching indicator.
- **Session Bridge:** `AuthContext.tsx` stores the backend-issued HS256 JWT in `localStorage` under `codelens-token` with active `isTokenExpired()` verification. The frontend `api-client.ts` automatically attaches `Authorization: Bearer ${token}` to all backend calls.
- **Production Secret Guard:** `Program.cs` validates JWT secrets at startup, throwing an `InvalidOperationException` if empty or matching development placeholders in non-development environments.
- **Probe Endpoint:** `GET /healthz` endpoint returning `{ status = "healthy", timestamp = ... }` for Azure Container Apps liveness/readiness probes.
- **Auth Endpoints:**
  - `POST /api/auth/register` — Email/password registration
  - `POST /api/auth/login` — Email/password login, returns signed HS256 JWT
  - `POST /api/auth/set-password` — Authenticated update of local password
  - `DELETE /api/auth/users` — Development-only cleanup endpoint (strictly gated with `app.Environment.IsDevelopment()` to prevent execution in production)

### 3.2 Zero-Disk Telemetry & Static Analysis Pipeline

- **In-Memory Streaming:** Calls `GET /repos/{owner}/{repo}/zipball` to receive the default branch archive stream. Opens a `System.IO.Compression.ZipArchive` in memory and processes file contents on the fly.
- **Directory Exclusion:** Filters out: `node_modules/`, `.git/`, `.agents/`, `bin/`, `obj/`, `dist/`, `.next/`, `vendor/`, `build/`, `.idea/`, `.vscode/`, `.vs/`, `target/`, `out/`, `coverage/`, `.gradle/`, `packages/` and binary file extensions.
- **Hotspot Risk Formula:**
  $$\text{RiskScore} = \text{Math.Round}(\text{CyclomaticComplexity} \times \ln(\text{ChurnCount} + 1), 2)$$
  - Files under `.agents/` or configuration tooling directories are explicitly ignored to avoid polluting codebase complexity heatmaps.
- **Dead Code Detection:** Identifies unreferenced JS/TS exports (via regex import/export cross-referencing) and unreferenced C# internal symbols (via Roslyn AST identifier tracking).
- **Dependency Parser:** Extracts package dependencies from `bun.lock` / `package.json` (Bun, npm), `pubspec.yaml` (Pub, Pub dev, Pub override), `.csproj` / `Directory.Build.props` (NuGet), `requirements.txt` (PyPI), `go.mod` (Go Modules), and `Cargo.toml` (Cargo).
- **Compiled Secret Scanner (`RegexSecretScanner.cs`):** Uses compile-time `.NET 10` `[GeneratedRegex]` attributes for zero-allocation scanning of:
  - AWS access keys (`AKIA[0-9A-Z]{16}`)
  - GitHub personal access tokens (`ghp_[0-9a-zA-Z]{36}`, `github_pat_...`)
  - Generic private keys (`-----BEGIN PRIVATE KEY-----`, `-----BEGIN RSA PRIVATE KEY-----`)
  - Slack tokens, Google API keys, generic `api_key=` / `client_secret=` credential patterns
  - Sensitive file names (`.env`, `.env.local`, `id_rsa`, `credentials.json`, `.pem`, `.key`, `.pfx`)
  - _Benign Template Filtering:_ Dummy placeholder keys in `.env.example`, `.env.sample`, and `.env.template` are skipped to prevent false-positive security warnings.
- **GitHub Rate Limit Quota Management:**
  - Unauthenticated IP rate limit is 60 requests/hr.
  - Providing a `GITHUB_TOKEN` in `appsettings.Development.json` or environment variables unlocks 5,000 requests/hr.
  - `OctokitTelemetryService.cs` checks `GetLastApiInfo().RateLimit.Remaining` and automatically budgets per-commit churn requests if the quota is low.
  - Tested on production repositories: `facebook/react` (1,046 files, 234K LOC) and `fastapi/fastapi` (2,751 files, 379K LOC).
- **Concurrent Analysis:** `telemetryTask` and `zipStreamTask` run concurrently via `Task.WhenAll(...)` for maximum throughput.
- **Test Suite:** 34 xUnit tests in `tests/CodeLens.Tests/` covering telemetry parsing, shared repo cache, polyglot analysis, Pub/Dart dependencies, Bun lockfile & packageManager parsing, secret scanning & example file filtering, repository persistence, Semantic Kernel connector, low-reasoning execution settings, auto-healing Mermaid sanitization, total commit calculation, and dossier compilation.

### 3.3 Gemini 3.8 Flash Synthesis & Dossier Builder

- **Model:** `gemini-3.8-flash` via `Microsoft.SemanticKernel` (`1.81.0`).
- **Dynamic Low-Reasoning Configuration (`ThinkingLevel: "low"`):**
  - Gemini 3 series models default to `high` dynamic reasoning depth, which can trigger prolonged thinking delays (200s+) and timeouts during upstream Google API traffic spikes.
  - Sets `ThinkingLevel: "low"` via `GeminiThinkingConfig` on `GeminiPromptExecutionSettings` across both structured repository synthesis (`SynthesizeRepositoryAsync`) and real-time streaming copilot chat (`StreamChatResponseAsync`).
  - Slashes latency to sub-second / few-second responses and reduces token consumption while preserving architectural reasoning depth.
- **Fail-Fast Timeout & Upstream Load Resilience:**
  - `GeminiOptions.TimeoutSeconds` (default: `30` seconds) configures `HttpClient.Timeout` to prevent hanging on Google API outages.
  - The synthesis retry loop explicitly catches `HttpOperationException` for `503 Service Unavailable`, `504 Gateway Timeout`, and `TaskCanceledException`, failing fast directly to deterministic fallback synthesis.
  - Exponential backoff (2s, 4s) on `429 Too Many Requests` up to 3 retries before falling back.
- **macOS SSL & Revocation Resilience:** Semantic Kernel's Gemini connector uses a custom `SocketsHttpHandler` with `CertificateRevocationCheckMode = X509RevocationMode.NoCheck` to bypass macOS TLS revocation lookup failures on Google AI Studio endpoints while preserving full certificate trust verification.
- **Prompt Input:** Compact Symbol Manifest (truncated to 8,000 characters for strict context discipline) + deterministic telemetry (complexity hotspots, dependencies, git cadence).
- **Structured Outputs:**
  1. `Eli5Summary`: High-level purpose and core functionality in simple terms.
  2. `LicenseVerdict`: Commercial usability and compatibility assessment.
  3. `MermaidDiagram`: Sanitized C4/component architecture diagram.
  4. `CodeSmells`: Critical structural flaws, circular references, or bloat.
  5. `OnboardingRunbook`: Step-by-step onboarding guide for newcomers.
- **Auto-Healing & Shape-Preserving Mermaid Engine (`MermaidSanitizer.cs` & `mermaidUtils.ts`):**
  - Multi-line buffer joining and delimiter balancing (`openBrackets > closeBrackets`, `openParens > closeParens`) to auto-close unclosed node declarations before parsing (eliminating Mermaid 12.2.0 `got '1'` syntax errors).
  - Boundary-aware regexes preserving Cylinder `[("...")]`, Stadium `(["..."])`, Subroutine `[["..."]]`, Hexagon `{{"..."}}`, Double Circle `((...))`, and rectangular nodes with parenthetical labels without collision.
  - Automatic `subgraph` balancing and entity escaping.
  - Client-side error suppression (`suppressErrorRendering: true`) in `MermaidViewer.tsx` preventing raw parser error SVGs in the DOM, with graceful fallback to an auto-generated C4 model.
- **Resilient Fallback Synthesis:** When `Gemini:ApiKey` or `GEMINI_API_KEY` is not supplied, or when upstream services time out or return 503, `GeminiSynthesisService.cs` computes high-fidelity deterministic insights from AST and package metrics, ensuring complete local offline functionality and test stability.
- **Artifact Generation (`MarkdownDossierBuilder.cs`):** Compiles the standardized `PROJECT_KNOWLEDGE.md`, stores it in Azure Blob Storage (`project-dossiers` container) via `IBlobStorageService`, and caches markdown in `AuditDocument.DossierMarkdown`.
- **Chat Copilot API & Session Persistence:**
  - `POST /api/chat/{auditId}/stream`: Real-time SSE streaming copilot grounded directly in `PROJECT_KNOWLEDGE.md`. Response headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `X-Accel-Buffering: no`, `Connection: keep-alive`. Stream enumeration is guarded with try-catch fallback handling.
  - **Rate Limit Propagation & Quota Alert Banner:** When Gemini API returns `429 Too Many Requests`, `GeminiSynthesisService.cs` extracts the actual retry delay and emits `[CODELENS_RATELIMIT_EXHAUSTED:{seconds}]`. `ChatEndpoints.cs` maps this to SSE event `data: {"text":"","rateLimited":true,"retryAfterSeconds":{seconds}}\n\n`. `RepoChatSidebar.tsx` renders a prominent top warning banner with a live countdown timer (`Resets in MM:SS` or `Hh MMm`), which auto-dismisses upon countdown completion, while continuing uninterrupted with local AST-grounded answers.
  - `GET /api/chat/{auditId}`: Restores stored conversation messages.
  - `DELETE /api/chat/{auditId}`: Purges chat history from storage.

### 3.4 GSAP-Powered Modern Landing Page, Unified Dashboard & Theme System

- **GSAP-Powered Modern Landing Page (`HomePage.tsx` & `src/components/landing/`):**
  - **Floating Island Navigation Bar & Silky Smooth Scrolling:** Centered, fixed floating pill navbar with glassmorphic backdrop (`backdrop-filter: blur(20px) saturate(190%)`), border glow, dynamic scroll elevation (`.navScrolled` after 20px), and calibrated section anchor scroll margins. Primary navigation links (_Live Demo_, _Architecture_, _Capabilities_, _Ecosystems_, _Why CodeLens_) sit directly on the navbar surface without nested container boxes. Hardware-accelerated smooth section scrolling via `scroll-behavior: smooth` in `globals.css` and JavaScript `scrollIntoView({ behavior: "smooth" })` via `handleNavScroll` and `handleLogoClick` in `HomePage.tsx`.
  - **Full-Screen Viewport Stages (`min-height: 100dvh`):** Every section commands its own dedicated, vertically centered full-screen stage (`min-height: 100dvh; display: flex; flex-direction: column; justify-content: center;`) with `padding: 6rem 1.5rem 3.5rem`.
  - **Symmetrical 3×2 Capability Bento Grid (`BentoFeaturesSection.tsx`):** Standardized single-column geometry across all 6 core capability cards eliminating oversized 2-column span asymmetry.
  - **Official Brand Favicon (`public/favicon.svg`):** High-definition 32×32 SVG squircle with architectural amber-to-bronze gradient (`#f59e0b` → `#b45309`).
  - **Animation Architecture:** Built with official GSAP primitives (`useGSAP`, `ScrollTrigger.batch`, `gsap.matchMedia()`). Automatically verifies `prefers-reduced-motion` to bypass animations for users with vestibular sensitivities.
  - **Modular Component Breakdown:**
    1. `HeroSection.tsx`: Centered `100dvh` viewport introduction, staggered headline, clean subtitle, CTAs, 4-stat metrics ribbon (`< 50ms`, `0-Disk`, `7+ Ecosystems`, `100% Grounded`), and live emerald pulse badge.
    2. `HeroPreviewTabs.tsx`: Interactive macOS-style sandbox preview window with address bar `https://codelens.ai/`, section header (_Interactive Codebase Sandbox_ at `#preview`), and 4 switchable views (_Telemetry Bento_, _Interactive C4 Diagram_, _Knowledge Dossier_, _Grounded Copilot_). Includes **Live Demo Repository Selector** pinned directly above the window for 1-click state switching across 4 polyglot repos. Fully responsive on mobile.
    3. `IngestionPipelineSection.tsx`: The Zero-Clone Engine 4-phase architecture console (`#pipeline`) adhering to `@design-taste-frontend`. Features bare vector SVG icons alongside real runtime engine specs (`System.IO.ZipArchive`, `Roslyn AST + Multi-Manifest`, `Complexity × ln(Churn + 1)`, `Gemini 3.8 Flash + SK`) and performance metrics.
    4. `BentoFeaturesSection.tsx`: Symmetrical 3×2 bento grid detailing zero-disk streaming, deterministic cyclomatic mathematical scoring, Gemini 3.8 Flash synthesis, gesture-driven C4 diagrams, grounded copilot, and zero-idle cloud architecture.
    5. `EcosystemSection.tsx`: Polyglot lockfile and manifest intelligence (Bun, Dart/Flutter, .NET 10, Node.js, Python, Go, Rust) with official Simple Icons vector paths.
    6. `ComparisonSection.tsx`: Dimension-by-dimension comparison table comparing legacy manual audits against CodeLens AI, designed to reveal as a single cohesive unit on scroll.
    7. `CtaBannerSection.tsx`: Radiant glow conversion banner and external community links.
  - **Strict Styling Rules:** Zero emojis across all landing components (strictly SVG icons). All button links and child elements strictly enforce `text-decoration: none !important`.
  - **Mobile Move-to-Top Floating Action Button:** Pinned at `bottom: calc(1.25rem + env(safe-area-inset-bottom, 0px)); right: 1.25rem;` on mobile viewports (`<768px`) with a 44×44px circular tap target, glassmorphic backdrop, dynamically revealed when needed (`scrollY > 400px`), strictly hidden on desktop.
- **Dedicated 404 Not Found Page (`NotFoundPage.tsx`):** Catch-all route handler (`*`) styled in line with the application's glassmorphic aesthetics. Supported on Azure SWA via `public/staticwebapp.config.json`.
- **Unified Home Dashboard:** All audit content (Telemetry Bento Grid, Architecture Diagram, and Knowledge Dossier) lives in the main dashboard view (`/dashboard`) with seamless view switching. `DashboardClient.tsx` is cleanly decomposed into modular sub-components: `RepoInputForm.tsx` (URL input and analysis actions), `RecentAuditChips.tsx` (cached recent/sample repository selection and purge), and `ChatDrawer.tsx` (slide-over AI copilot container), styled with `DashboardClient.module.css`. Heavy viewers (`MermaidViewer` ~92 kB and `DossierViewer` ~159 kB) are dynamically loaded with `React.lazy()` and `<Suspense>` boundaries.
- **All-Time Commits & Chronological Activity Pulse:** `OctokitTelemetryService.FetchTotalCommitsAsync` inspects GitHub API pagination headers (`rel="last"`) with `PageSize=1` to retrieve the true lifetime commit count in 1 API call. `OctokitTelemetryService.FetchCommitActivityAndTimelineAsync` compiles full chronological commit history grouped into month/year buckets, transmitting `CommitTimeline` directly to `SparklineChart.tsx`.
- **Dual-Mode Language Distribution (`LanguageDistributionCard.tsx`):** Interactive Bar mode (compact multi-segment progress bar + proportional language rows) and Circular mode (two-column Donut chart + scrollable legend) with a dominant stack banner.
- **Floating AI Drawer & Persistent Copilot:** A floating bottom-right `[ ✨ Ask AI ]` button triggers a slide-over copilot drawer grounded directly in the audit's `PROJECT_KNOWLEDGE.md`. Messages render formatted markdown via `ReactMarkdown` + `remark-gfm`. Chat history preserved across drawer toggles via dual-layer synchronization (`localStorage` + backend `GET /api/chat/{id}`).
- **Trackpad Gestures, Dynamic Zoom & Pan Clamping:** `MermaidViewer.tsx` and `FullscreenMermaidModal.tsx` support native trackpad pinch-to-zoom and two-finger pan with calculated diagram bounds, normalized 1.0 = 100% fit baseline, viewport boundary protection (`clampPan` wrapped in `useCallback`), and a dedicated `[ ↺ Reset ]` action button.
- **Streamlined Theme Architecture (`ThemeContext.tsx` & `ThemeToggle.tsx`):**
  - **System Default:** Initial state defaults to `"system"`, resolving automatically to the user's OS color scheme via `matchMedia("(prefers-color-scheme: light)")`.
  - **Binary Dark / Light Toggling:** `toggleTheme()` toggles directly between `"dark"` and `"light"`. Dead `cycleTheme` alias removed.
  - **Icon-Only Button & Floating Tooltip:** `ThemeToggle.tsx` is rendered as a clean 36×36px circular button with strictly the Sun SVG (in light mode) or Moon SVG (in dark mode). Features an accessible floating glassmorphic tooltip.
  - Pre-hydration anti-flash script in `index.html` reads `localStorage` before paint to eliminate light/dark flickering.
  - Mermaid diagrams automatically re-render with adapted dark/light color palettes upon theme change.
- **Modern User Profile & Navigation Header:** `DashboardHeader.tsx` features an interactive user avatar pill displaying user initials and email address alongside an animated danger-glowing sign out button.
- **Shared Repository Cache & 1-Click Re-Analysis:** `POST /api/audit` returns cached audits in `<50ms` and checks remote default branch commit SHAs to detect staleness and offer 1-click re-analysis (`forceRefresh: true`). Eliminates redundant HTTP re-fetching on audit selection.

### 3.5 Cloud Infrastructure & CI/CD Deployment

- **Infrastructure as Code:** Azure Bicep templates in `infra/main.bicep` and `infra/main.parameters.json`.
- **Regional Deployment:** Backend compute and databases in `Central India` (`rg-codelens-prod`), frontend edge in `East Asia` (`eastasia`) with global CDN distribution.
- **Zero-Cost Profile:**
  - Azure Container Apps (`ca-codelens-api`) with scale-to-zero compute (`minReplicas: 0`, `maxReplicas: 2`, 0.25 vCPU, 0.5 Gi memory) on port 5050.
  - Azure Static Web Apps (`swa-codelens-app`) on Free SKU for Vite React SPA.
  - Azure Cosmos DB NoSQL Lifetime Free Tier (1,000 RU/s, 25 GB storage) with containers `Users`, `Audits`, and `ChatSessions`.
  - Azure Blob Storage (`stcodelens...`) with container `project-dossiers` for dossier markdown and 15-minute SAS tokens.
- **CI/CD Automation:** GitHub Actions workflows (`deploy-backend.yml`, `deploy-frontend.yml`) running 34/34 xUnit tests, building Docker images to GHCR with lowercase tags (`shenmareparas/codelens-api`), and deploying to Azure Container Apps and Azure Static Web Apps.

---

## 4. Key Directory & File Index

```text
codelens-ai/
├── README.md                                         # Quickstart and overview
├── .github/
│   └── workflows/
│       ├── deploy-backend.yml                        # GitHub Actions: .NET 10 build, test, Docker & ACA deploy
│       └── deploy-frontend.yml                       # GitHub Actions: Bun Vite React build & SWA deploy
├── infra/
│   ├── main.bicep                                    # Zero-cost Azure Bicep template (ACA, SWA, Cosmos, Blob)
│   └── main.parameters.json                          # Deployment parameter configurations
├── .agents/
│   ├── AGENTS.md                                     # AI coding agent rules and operational constraints
│   ├── PROJECT_CONTEXT.md                            # Authoritative project context & architecture spec
│   └── skills/                                       # Agent engineering & quality skills
│       ├── react-doctor/                             # React architecture, lint & bundle diagnostics skill
│       ├── vercel-react-best-practices/              # Vercel React & Next.js performance optimization skill
│       ├── design-taste-frontend/                    # Anti-slop art direction skill for web design
│       └── gsap-*/                                   # Official GSAP AI skills (core, react, timeline, scrolltrigger, etc.)
├── backend/
│   ├── CodeLens.sln                                  # .NET 10 solution file
│   ├── Dockerfile                                    # Multi-stage production container build (port 5050)
│   ├── tests/
│   │   └── CodeLens.Tests/                           # 34 xUnit tests
│   │       ├── OctokitTelemetryTests.cs              # Sparkline, URL parsing, release tests
│   │       ├── RoslynAndPolyglotAnalyzerTests.cs     # Complexity, Symbol Manifest, Pub & Bun tests
│   │       ├── SecretScannerTests.cs                 # [GeneratedRegex] secret detection tests
│   │       ├── UserRepositoryTests.cs                # CRUD, cache & user purge tests
│   │       └── GeminiSynthesisTests.cs               # SK connector, Mermaid sanitizer & dossier tests
│   └── src/
│       ├── CodeLens.Core/
│       │   ├── Entities/                             # AuditDocument, TelemetryData, HotspotEntry, AiInsights, CommitActivityPoint, UserDocument, ChatMessageDocument
│       │   ├── DTOs/                                 # ApiDtos.cs (RegisterRequest, LoginRequest, AnalyzeRequest, AuditSummaryResponse, ChatRequest), TelemetryDtos.cs
│       │   └── Interfaces/                           # ICosmosRepository, IBlobStorageService, IGitHubTelemetryService, ICodeAnalysisService, IGeminiSynthesisService
│       ├── CodeLens.Infrastructure/
│       │   ├── Auth/AuthService.cs                   # PBKDF2 Password Hashing & HS256 JWT Service + JwtOptions
│       │   ├── Data/CosmosRepository.cs              # Cosmos DB implementation (Parallel.ForEachAsync user purge) + CosmosDbOptions
│       │   ├── Data/InMemoryCosmosRepository.cs      # ConcurrentDictionary-backed in-memory fallback (O(1) _auditIdsByUser indexing)
│       │   ├── Data/BlobStorageService.cs            # Azure Blob Storage + 15-min SAS URLs + BlobStorageOptions
│       │   ├── Data/InMemoryBlobStorageService.cs    # In-memory blob storage fallback (Dictionary-backed)
│       │   ├── GitHub/OctokitTelemetryService.cs     # Octokit telemetry, zipball stream, commit timeline, rate budgeting
│       │   ├── GitHub/GitHubOptions.cs               # GitHub PAT configuration
│       │   ├── Analysis/RoslynAndPolyglotAnalyzer.cs # Zero-disk AST complexity, dependency parser, dead code, secret scanner (IsExcludedDirectoryPath)
│       │   ├── Security/RegexSecretScanner.cs        # [GeneratedRegex] zero-allocation multi-pattern scanner
│       │   └── AI/                                   # Gemini AI Engine
│       │       ├── GeminiOptions.cs                  # Gemini API options & model config (ApiKey, ModelId, Temperature, MaxTokens, TimeoutSeconds, ThinkingLevel)
│       │       ├── GeminiSynthesisService.cs         # SK connector, structured synthesis, SSE streaming, fallback engine, rate limit propagation
│       │       ├── MermaidSanitizer.cs               # Diagram AST syntax cleanup, label quoting & subgraph balancing
│       │       └── MarkdownDossierBuilder.cs         # Standardized PROJECT_KNOWLEDGE.md generator
│       └── CodeLens.Api/
│           ├── Endpoints/AuthEndpoints.cs            # POST /register, POST /login, POST /set-password, DELETE /users (gated to IsDevelopment)
│           ├── Endpoints/AuditEndpoints.cs           # GET /audits, POST /audits/analyze, GET /audits/{id}, GET /audits/{id}/download
│           ├── Endpoints/ChatEndpoints.cs            # POST /chat/{id}/stream (SSE), GET /chat/{id}, DELETE /chat/{id}
│           ├── Properties/launchSettings.json        # Port 5050 configuration
│           ├── Program.cs                            # ASP.NET Core entrypoint, DI, JWT Bearer guard, CORS, Healthz probe, in-memory fallback wiring
│           ├── appsettings.json                      # Base configuration (Jwt, CosmosDb, BlobStorage sections)
│           └── appsettings.Development.json          # Local dev secrets (gitignored) — GITHUB_TOKEN, GEMINI_API_KEY
└── frontend/
    ├── package.json                                  # Bun dependencies & scripts (dev, build, lint, fmt: "bun fmt", fmt:check)
    ├── bunfig.toml                                   # Bun native formatter configuration ([fmt])
    ├── bun.lock                                      # Bun text lockfile
    ├── vite.config.ts                                # Vite ESM config with import.meta.dirname path aliases
    ├── eslint.config.mjs                             # ESLint 9 Flat Config (React 19 + TypeScript + React Hooks)
    ├── index.html                                    # SPA entrypoint with anti-flash theme script & favicon link
    ├── staticwebapp.config.json                      # Azure SWA navigation fallback & headers
    ├── public/
    │   ├── favicon.svg                               # Official CodeLens AI gradient brand squircle favicon
    │   └── staticwebapp.config.json                  # Azure SWA navigation fallback deployed to dist/
    └── src/
        ├── main.tsx                                  # React DOM entrypoint (AuthProvider + ThemeProvider wrapping)
        ├── App.tsx                                   # React Router DOM + ProtectedRoute + lazy code splitting
        ├── context/
        │   ├── AuthContext.tsx                       # JWT authentication context with memoized callbacks & isTokenExpired
        │   └── ThemeContext.tsx                      # Pure Light/Dark/System theme context with system default & instant toggle
        ├── pages/
        │   ├── HomePage.tsx                          # Modern Product Landing Page (GSAP orchestration + section refs)
        │   ├── HomePage.module.css                   # Glassmorphic landing styles & animations
        │   ├── SignInPage.tsx                        # Tabbed Sign-In / Create Account UI with back-to-home
        │   ├── CredentialsForm.tsx                   # Form state, validation & submission logic
        │   ├── PasswordValidationComponents.tsx      # Eye toggles, strength meter, checklist badges
        │   ├── passwordUtils.ts                      # Pure scoring rules & validation helpers (hoisted regexes)
        │   ├── SignInPage.module.css                 # Glassmorphic component styles
        │   ├── NotFoundPage.tsx                      # Glassmorphic 404 error page with contextual navigation
        │   ├── NotFoundPage.module.css               # 404 styles, badges, and layout
        │   └── DashboardPage.tsx                     # Protected route page (renders DashboardClient)
        ├── components/
        │   ├── landing/                              # GSAP modular landing page sections
        │   │   ├── HeroSection.tsx                   # Hero introduction, stats ribbon & CTAs
        │   │   ├── HeroPreviewTabs.tsx               # macOS sandbox window with demo repo controls & 4 tabs
        │   │   ├── IngestionPipelineSection.tsx      # 4-stage progressive zero-disk streaming pipeline cards
        │   │   ├── BentoFeaturesSection.tsx          # 3×2 uniform bento capabilities grid
        │   │   ├── EcosystemSection.tsx              # Polyglot manifest intelligence & official Simple Icons
        │   │   ├── ComparisonSection.tsx             # Dimension comparison table with single-unit reveal
        │   │   └── CtaBannerSection.tsx              # Conversion CTA banner & community links
        │   ├── BrandLogo.tsx                         # Reusable SVG brand mark (magnifier + crosshair glyph)
        │   ├── ThemeToggle.tsx                       # Icon-only circular theme toggle with floating accessible tooltip
        │   ├── ThemeToggle.module.css                # Animated theme toggle & glassmorphic tooltip styles
        │   ├── DashboardClient.tsx                   # Unified Dashboard orchestrator (Bento Grid, Dossier & Diagram tabs)
        │   ├── DashboardClient.module.css            # Scoped styles & grid layout for DashboardClient
        │   ├── RepoInputForm.tsx                     # Repository URL input form with analyze button & loading states
        │   ├── RecentAuditChips.tsx                  # Recent and sample repository audit chips with selection & delete actions
        │   ├── ChatDrawer.tsx                        # Slide-over chat drawer container with floating launcher trigger
        │   ├── DashboardHeader.tsx                   # Top bar navigation, user profile avatar pill & danger signout button
        │   ├── DashboardHeader.module.css            # Header layout, avatar & signout styles
        │   ├── ActiveAuditSection.tsx                # Active audit summary, stale banner & lazy-loaded view tabs
        │   ├── AnalysisProgressBar.tsx               # Multi-stage animated pipeline progress bar with shimmer & step indicators
        │   ├── analysisSteps.ts                      # 6-step analysis stage metadata (cache, telemetry, ast, security, ai, dossier)
        │   ├── TelemetryBentoGrid.tsx                # Metrics Bento Grid layout with stable keys
        │   ├── DependenciesCard.tsx                  # Ecosystem filter tabs (Bun, Pub, npm, NuGet, PyPI), search & badges
        │   ├── LanguageDistributionCard.tsx          # Dual-mode Bar/Circular language telemetry with dominant stack banner
        │   ├── HotspotTable.tsx                      # Complexity × Churn risk table (memoized sorting & filter)
        │   ├── SparklineChart.tsx                    # SVG commit sparklines with all-time total commits pill
        │   ├── MermaidViewer.tsx                     # Client-side Mermaid diagram canvas with pan/zoom/copy, 100% reset & a11y region
        │   ├── FullscreenMermaidModal.tsx            # Immersive fullscreen diagram viewer with touch & pan clamping
        │   ├── InlineMermaidBlock.tsx                # Flow diagram renderer for AI chat markdown responses
        │   ├── ThinkingLines.tsx                     # Claude-style multi-line animated thinking shimmer state (--color-primary-rgb)
        │   ├── DossierViewer.tsx                     # Formatted Markdown dossier preview with SAS download
        │   └── RepoChatSidebar.tsx                   # Real-time SSE grounded repo copilot with markdown, inline diagrams & rate-limit banner
        ├── styles/
        │   └── globals.css                           # Glassmorphism design system, tokens (Plus Jakarta Sans, Inter, JetBrains Mono)
        └── lib/
            ├── api-client.ts                         # Typed REST API & SSE client (sanitized API_BASE, chat persistence endpoints)
            └── mermaidUtils.ts                       # Client-side Mermaid syntax normalizer & label quoting
```

---

## 5. Resolved Technical Debt & Architecture Hardening

All previously flagged technical debt items have been resolved and verified across the codebase:

- [x] **`DELETE /api/auth/users` Development Gating:** Strictly gated behind `app.Environment.IsDevelopment()` to prevent unauthorized user deletion in production.
- [x] **Production JWT Secret Guard:** `Program.cs` validates JWT secrets on startup, failing fast with `InvalidOperationException` if empty or using development placeholders in production.
- [x] **Health Check Probe:** Added `GET /healthz` endpoint returning `{ status = "healthy", timestamp = ... }` for Azure Container Apps liveness/readiness probes.
- [x] **Zero Dead Directives:** Removed Next.js `"use client"` directives from all 10 Vite React components.
- [x] **ThemeContext Simplification:** Removed dead `cycleTheme` alias, maintaining pure binary dark/light toggling.
- [x] **Dead Export Cleanup:** Removed dead `setAccountPassword` and obsolete Next.js environment references.
- [x] **Audit Selection Optimization:** Eliminated redundant HTTP re-fetch in `DashboardClient.tsx` by consuming existing `recentAudits[]` state directly.
- [x] **DashboardClient Component Decomposition:** Broken down into modular `RepoInputForm.tsx`, `RecentAuditChips.tsx`, `ChatDrawer.tsx`, and `DashboardClient.module.css`.
- [x] **Native Bun Formatter Integration:** Adopted zero-config `bun fmt` and `bunfmt --check` with `bunfig.toml` across the full monorepo, retiring external Prettier.

---

## 6. Development & Verification Guide

### 6.1 Local Ports & Networking

- **Backend API:** `http://localhost:5050` (Configured in `launchSettings.json`). _Never use port 5000 due to macOS AirPlay collision._
- **Scalar OpenAPI Documentation:** `http://localhost:5050/scalar/v1`
- **Frontend Application:** `http://localhost:5173` (Vite dev server)

### 6.2 Common Commands

```bash
# ── Backend Operations ──────────────────────────────────────────────
cd backend
dotnet restore CodeLens.sln               # Restore NuGet packages
dotnet build CodeLens.sln                 # Build (Zero warnings required)
dotnet test CodeLens.sln                  # Run 34 xUnit tests
dotnet run --project src/CodeLens.Api     # Start API server on port 5050

# ── Frontend Operations ─────────────────────────────────────────────
cd frontend
bun install                               # Install dependencies via Bun
bun run dev                               # Start Vite React dev server
bun run fmt                               # Format with native Bun formatter (bun fmt)
bun run fmt:check                         # Verify all files are formatted
bun run build                             # Verify TypeScript & bundle compilation
bun run lint                              # Zero ESLint errors/warnings required
bunx react-doctor@latest --scope changed  # Verify React diagnostics
```

### 6.3 Quality & Guardrail Checklist

- [x] Zero warnings on `dotnet build CodeLens.sln`.
- [x] All 34 xUnit tests passing on `dotnet test CodeLens.sln`.
- [x] Clean `bun fmt --check` across all files in the workspace.
- [x] Clean `bun run build` with static bundle compilation.
- [x] Zero ESLint errors/warnings on `bun run lint`.
- [x] React Doctor baseline maintained (`✔ No issues found!`).
- [x] Zero hardcoded secrets in source files (always use `.env.local` or gitignored `appsettings.Development.json`).
- [x] No `git clone` to local disk — all repo ingestion must remain zero-disk in-memory streams.
- [x] No `"use client"` directives in Vite/React components (Next.js only).
- [x] `DELETE /api/auth/users` is not reachable in production environments.
