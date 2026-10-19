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
                               │    React Router / Tailwind CSS         │
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

| Layer | Technology | Version / Spec | Key Role |
| :--- | :--- | :--- | :--- |
| **Frontend Runtime** | [Bun](https://bun.sh) | `1.2+` | Package manager and script runner (**NEVER** use npm/npx/yarn) |
| **Frontend Framework** | React 19 + Vite | React 19, Vite 8 | Ultra-fast client-side SPA, zero Node.js server overhead on edge |
| **Styling & Design** | Tailwind CSS / CSS Modules | Custom Glassmorphism | Dark/Light/System theme token system, smooth transitions |
| **Frontend Auth** | Client AuthContext | Custom JWT Hook | Direct authentication against backend JWT endpoints with localStorage session |
| **Routing** | React Router DOM | `v7` | Client-side routing with `ProtectedRoute` and Azure SWA rewrites |
| **Backend Framework** | ASP.NET Core Minimal APIs | `.NET 10` (`net10.0`) | High-performance, zero-warning asynchronous API |
| **Backend Language** | C# 13 | NetCoreApp 10.0 | Pattern matching, records, primary constructors |
| **API Documentation** | Scalar OpenAPI | `/scalar/v1` | Modern interactive API documentation |
| **AST & Code Analysis** | Roslyn C# Compiler + Polyglot | Roslyn 4.12+ | Zero-disk syntax parsing, cyclomatic complexity |
| **Git Ingestion Engine** | Octokit.NET | `14.0.0` | GitHub REST client, commit churn, zipball stream |
| **Database** | Azure Cosmos DB NoSQL | SDK `3.47.0` | Free-Tier partition key indexing (`users`, `audits`, `messages`) |
| **Blob Storage** | Azure Blob Storage | SDK `12.23.0` | Container `project-dossiers`, 15-minute SAS tokens |
| **Local Fallbacks** | In-Memory Repository & Storage | Built-in | Zero-setup local development without Azure credentials |
| **AI Orchestration** | Microsoft Semantic Kernel | `1.81.0` | Gemini 3.8 Flash connector and structured prompt engine |
| **AI Model** | Google Gemini 3.8 Flash | `gemini-3.8-flash` | ELI5 summary, Mermaid C4 diagram, architecture smells |

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
- **Session Bridge:** `AuthContext.tsx` stores the backend-issued HS256 JWT in `localStorage` under `codelens-token`. The frontend `api-client.ts` automatically attaches `Authorization: Bearer ${token}` to all backend calls.

### 3.2 Zero-Disk Telemetry & Static Analysis Pipeline

- **In-Memory Streaming:** Calls `GET /repos/{owner}/{repo}/zipball` to receive the default branch archive stream. Opens a `System.IO.Compression.ZipArchive` in memory and processes file contents on the fly.
- **Directory Exclusion:** Filters out non-source directories and tooling: `node_modules/`, `.git/`, `.agents/`, `bin/`, `obj/`, `dist/`, `.next/`, `vendor/`, and binary file types.
- **Hotspot Risk Formula:**
  $$\text{RiskScore} = \text{Math.Round}(\text{CyclomaticComplexity} \times \ln(\text{ChurnCount} + 1), 2)$$
  - Files under `.agents/` or configuration tooling directories are explicitly ignored to avoid polluting codebase complexity heatmaps.
- **Dead Code Detection:** Identifies unreferenced symbols, internal helper classes, and orphan files with zero inbound dependencies.
- **Dependency Parser:** Extracts package dependencies from `bun.lock` / `package.json` (Bun, npm), `pubspec.yaml` (Pub, Pub dev, Pub override), `.csproj` / `Directory.Build.props` (NuGet), `requirements.txt` (PyPI), `go.mod` (Go Modules), and `Cargo.toml` (Cargo).
- **Compiled Secret Scanner (`RegexSecretScanner.cs`):** Uses compile-time `.NET 10` `[GeneratedRegex]` attributes for zero-allocation scanning of:
  - AWS access keys (`AKIA[0-9A-Z]{16}`)
  - GitHub personal access tokens (`ghp_[0-9a-zA-Z]{36}`, `github_pat_...`)
  - Generic private keys (`-----BEGIN PRIVATE KEY-----`, `-----BEGIN RSA PRIVATE KEY-----`)
  - Connection strings and `.env` passwords
  - *Benign Template Filtering:* Dummy placeholder keys in `.env.example`, `.env.sample`, and `.env.template` are skipped to prevent false-positive security warnings.
- **GitHub Rate Limit Quota Management:**
  - Unauthenticated IP rate limit is 60 requests/hr.
  - Providing a `GITHUB_TOKEN` in `appsettings.Development.json` or environment variables unlocks 5,000 requests/hr.
  - `OctokitTelemetryService.cs` checks `GetLastApiInfo().RateLimit.Remaining` and automatically budgets per-commit churn requests if the quota is low.
  - Tested on production repositories: `facebook/react` (1,046 files, 234K LOC) and `fastapi/fastapi` (2,751 files, 379K LOC).
- **Test Suite:** 31 unit tests in `tests/CodeLens.Tests/` covering telemetry parsing, shared repo cache, polyglot analysis, Pub/Dart dependencies, Bun lockfile & packageManager parsing, secret scanning & example file filtering, repository persistence, Semantic Kernel connector, Mermaid sanitization, total commit calculation, and dossier compilation.

### 3.3 Gemini 3.8 Flash Synthesis & Dossier Builder

- **Model:** `gemini-3.8-flash` via `Microsoft.SemanticKernel` (`1.81.0`).
- **macOS SSL & Revocation Resilience:** Semantic Kernel's Gemini connector uses a custom `SocketsHttpHandler` with `CertificateRevocationCheckMode = X509RevocationMode.NoCheck` to bypass macOS TLS revocation lookup failures (`RevocationStatusUnknown`) on Google AI Studio endpoints while preserving complete certificate trust verification.
- **Prompt Input:** Compact Symbol Manifest (truncated to 8,000 characters for strict context discipline) + deterministic telemetry (complexity hotspots, dependencies, git cadence).
- **Structured Outputs:**
  1. `ELI5Summary`: High-level purpose and core functionality in simple terms.
  2. `LicenseVerdict`: Commercial usability and compatibility assessment.
  3. `MermaidDiagram`: Sanitized C4/component architecture diagram.
  4. `ArchitecturalSmells`: Critical structural flaws, circular references, or bloat.
  5. `OnboardingRunbook`: Step-by-step onboarding guide for newcomers.
- **Mermaid Sanitization (`MermaidSanitizer.cs`):** Automatic regex-based AST sanitization stripping wrapping code fences, quoting complex bracketed labels containing parentheses/colons, normalizing subgraph identifiers, and balancing open subgraphs.
- **Resilient Fallback Synthesis:** When `Gemini:ApiKey` or `GEMINI_API_KEY` is not supplied, `GeminiSynthesisService.cs` computes high-fidelity deterministic insights from AST and package metrics, ensuring complete local offline functionality and test stability.
- **Artifact Generation (`MarkdownDossierBuilder.cs`):** Compiles the standardized `PROJECT_KNOWLEDGE.md`, stores it in Azure Blob Storage (`project-dossiers` container) via `IBlobStorageService`, and caches markdown in `AuditDocument.DossierMarkdown`.
- **Chat Copilot API & Session Persistence:**
  - `POST /api/chat/{id}/stream`: Real-time SSE streaming copilot grounded directly in `PROJECT_KNOWLEDGE.md`. Response enumeration is guarded with try-catch fallback handling to prevent HTTP 500 interruptions.
  - **Rate Limit Propagation & Quota Alert Banner:** When Gemini API returns `429 Too Many Requests` or quota exhaustion, `GeminiSynthesisService.cs` extracts the actual retry delay from Google's response (`retryDelay` / `retry in Xh Ym Zs`) and emits `[CODELENS_RATELIMIT_EXHAUSTED:{seconds}]`. `ChatEndpoints.cs` maps this to an SSE event `data: {"text":"","rateLimited":true,"retryAfterSeconds":{seconds}}\n\n`. `RepoChatSidebar.tsx` renders a prominent top warning banner with a live countdown timer (`Resets in MM:SS` or `Hh MMm`), which automatically and synchronously dismisses as soon as the cooldown expires (`Boolean(rateLimitUntil && secondsRemaining > 0)`), while continuing uninterrupted with local AST grounded answers.
  - `GET /api/chat/{id}`: Restores stored conversation messages for the active audit session.
  - `DELETE /api/chat/{id}`: Purges chat history from storage.

### 3.4 Modern Landing Page, Unified Dashboard & Theme System

- **Landing Page Showcase (`HomePage.tsx`):** Available at `/` as the primary visitor entrypoint, showcasing interactive hero metrics, architecture highlights, polyglot ecosystem capabilities, and direct navigation into authentication or the dashboard.
- **Dedicated 404 Not Found Page (`NotFoundPage.tsx`):** Catch-all route handler (`*`) styled in line with the application's glassmorphic aesthetics. Features an ambient radial glow, dynamic status indicators, theme toggle, and context-aware return actions (taking authenticated users to `/dashboard` and unauthenticated visitors to `/`). Supported on Azure SWA via `public/staticwebapp.config.json` navigation fallback.
- **Unified Home Dashboard:** All audit content (Telemetry Bento Grid, Architecture Diagram, and Knowledge Dossier) lives in the main dashboard view (`/dashboard`) with seamless view switching (`Split Workspace`, `Telemetry Bento`, `Mermaid Diagram`, `Knowledge Dossier`). Heavy viewers (`MermaidViewer` ~92 kB and `DossierViewer` ~159 kB) are dynamically loaded with `React.lazy()` and `<Suspense>` boundaries.
- **All-Time Commits & Chronological Activity Pulse:** `OctokitTelemetryService.FetchTotalCommitsAsync` inspects GitHub API pagination headers (`rel="last"`) with `PageSize=1` to retrieve the true lifetime commit count in 1 API call. `OctokitTelemetryService.FetchCommitActivityAndTimelineAsync` compiles full chronological commit history grouped into month/year buckets (e.g. `Jan 2024`, `Feb 2024`) or spaced lifetime intervals for older/newer repositories, transmitting `CommitTimeline` directly to `SparklineChart.tsx` with date ranges, month/year X-axis labels, and clean hover-only inspection.
- **Dual-Mode Language Distribution (`LanguageDistributionCard.tsx`):** Features interactive Bar mode (compact multi-segment progress bar + proportional language rows) and Circular mode (two-column Donut chart + scrollable legend) with a dominant stack banner.
- **Floating AI Drawer & Persistent Copilot:** A floating bottom-right `[ ✨ Ask AI ]` button triggers a slide-over copilot drawer grounded directly in the audit's `PROJECT_KNOWLEDGE.md`. Messages render formatted markdown (headings, code blocks, lists) via `ReactMarkdown` + `remark-gfm`. Chat history is preserved across drawer toggles using dual-layer synchronization (`localStorage` + backend `GET /api/chat/{id}`), with a `[ 🗑️ Clear ]` action to purge chat history on demand. Real-time streaming tokens are ingested over SSE with automatic connection cleanup on unmount.
- **Touchpad Gestures, Dynamic Zoom & Pan Clamping:** `MermaidViewer.tsx` and `FullscreenMermaidModal.tsx` support trackpad pinch-to-zoom and two-finger pan with calculated diagram bounds that dynamically clamp zoom scale, normalized 1.0 = 100% fit baseline, viewport boundary protection (`clampPan`) ensuring diagrams never disappear off-screen, an accessible container (`role="region"`), and a dedicated `[ ↺ Reset ]` action button to quickly return to default 100% framing.
- **Typography & Theme System:** Premium Google Fonts stack (**Plus Jakarta Sans**, **Inter**, **JetBrains Mono**) paired with a full 3-mode theme system (`System`, `Dark`, `Light`), automatic OS preference detection via media query listeners, pre-hydration anti-flash script in `index.html`, adaptive SVG diagram palette updates, and accessible high-contrast form controls, typography, and scrollbars across both the dashboard and the authentication screens. Theme context is memoized with pure state transitions and decoupled `localStorage` synchronization.
- **Modern User Profile & Navigation Header:** `DashboardHeader.tsx` features an interactive user avatar pill displaying user initials and email address alongside an animated danger-glowing sign out button.
- **Shared Repository Cache & 1-Click Re-Analysis:** `POST /api/audit` returns cached audits in `<50ms` and checks remote default branch commit SHAs to detect staleness and offer 1-click re-analysis (`forceRefresh: true`).

### 3.5 Cloud Infrastructure & CI/CD Deployment

- **Infrastructure as Code:** Azure Bicep templates in `infra/main.bicep` and `infra/main.parameters.json`.
- **Regional Deployment:** Backend compute and databases in `Central India` (`rg-codelens-prod`), frontend edge in `East Asia` (`eastasia`) with global CDN distribution.
- **Zero-Cost Profile:**
  - Azure Container Apps (`ca-codelens-api`) with scale-to-zero compute (`minReplicas: 0`, `maxReplicas: 2`, 0.25 vCPU, 0.5 Gi memory) on port 5050.
  - Azure Static Web Apps (`swa-codelens-app`) on Free SKU for Vite React SPA.
  - Azure Cosmos DB NoSQL Lifetime Free Tier (1,000 RU/s, 25 GB storage) with containers `Users`, `Audits`, and `ChatSessions`.
  - Azure Blob Storage (`stcodelens...`) with container `project-dossiers` for dossier markdown and 15-minute SAS tokens.
- **CI/CD Automation:** GitHub Actions workflows (`deploy-backend.yml`, `deploy-frontend.yml`) running 30/30 xUnit tests, building Docker images to GHCR with lowercase tags (`shenmareparas/codelens-api`), and deploying to Azure Container Apps and Azure Static Web Apps.

---

## 4. Key Directory & File Index

```text
codelens-ai/
├── README.md                                         # Quickstart and overview
├── .github/
│   └── workflows/
│       ├── deploy-backend.yml                        # GitHub Actions: .NET 10 build, test, Docker & ACA deploy
│       └── deploy-frontend.yml                       # GitHub Actions: Vite React build & SWA deploy
├── infra/
│   ├── main.bicep                                    # Zero-cost Azure Bicep template (ACA, SWA, Cosmos, Blob)
│   └── main.parameters.json                          # Deployment parameter configurations
├── .agents/
│   ├── AGENTS.md                                     # AI coding agent rules and operational constraints
│   ├── PROJECT_CONTEXT.md                            # Authoritative project context & architecture spec
│   └── skills/
│       ├── react-doctor/                             # React architecture, lint & bundle diagnostics skill
│       └── vercel-react-best-practices/              # Vercel React & Next.js performance optimization skill
├── backend/
│   ├── CodeLens.sln                                  # .NET 10 solution file
│   ├── Dockerfile                                    # Multi-stage production container build (port 5050)
│   ├── tests/
│   │   └── CodeLens.Tests/                           # 30 xUnit tests
│   │       ├── OctokitTelemetryTests.cs              # Sparkline, URL parsing, release tests
│   │       ├── RoslynAndPolyglotAnalyzerTests.cs     # Complexity, Symbol Manifest, Pub & Bun tests
│   │       ├── SecretScannerTests.cs                 # [GeneratedRegex] secret detection tests
│   │       ├── UserRepositoryTests.cs                # CRUD, cache & user purge tests
│   │       └── GeminiSynthesisTests.cs               # SK connector, Mermaid sanitizer & dossier tests
│   └── src/
│       ├── CodeLens.Core/
│       │   ├── Entities/                             # UserDocument, AuditDocument, ChatMessageDocument
│       │   ├── DTOs/                                 # ApiDtos.cs, TelemetryDtos.cs
│       │   └── Interfaces/                           # ICosmosRepository, IBlobStorageService, IGitHubTelemetryService, ICodeAnalysisService, IGeminiSynthesisService
│       ├── CodeLens.Infrastructure/
│       │   ├── Auth/AuthService.cs                   # PBKDF2 Password Hashing & HS256 JWT Service
│       │   ├── Data/CosmosRepository.cs              # Cosmos DB implementation
│       │   ├── Data/InMemoryCosmosRepository.cs      # In-memory database fallback
│       │   ├── Data/BlobStorageService.cs            # Azure Blob Storage + SAS URLs
│       │   ├── Data/InMemoryBlobStorageService.cs    # In-memory blob storage fallback
│       │   ├── GitHub/OctokitTelemetryService.cs     # Octokit telemetry, zipball stream, rate budgeting
│       │   ├── Analysis/RoslynAndPolyglotAnalyzer.cs # Zero-disk AST complexity & dependency parser
│       │   ├── Security/RegexSecretScanner.cs        # [GeneratedRegex] zero-allocation scanner
│       │   └── AI/                                   # Gemini AI Engine
│       │       ├── GeminiOptions.cs                  # Gemini API options & model config
│       │       ├── GeminiSynthesisService.cs         # SK connector & fallback synthesis engine
│       │       ├── MermaidSanitizer.cs               # Diagram AST syntax cleanup & label quoting
│       │       └── MarkdownDossierBuilder.cs         # Standardized PROJECT_KNOWLEDGE.md generator
│       └── CodeLens.Api/
│           ├── Endpoints/                            # AuthEndpoints, AuditEndpoints, ChatEndpoints
│           ├── Properties/launchSettings.json        # Port 5050 configuration
│           ├── Program.cs                            # ASP.NET Core entrypoint, DI, JWT Bearer, CORS
│           ├── appsettings.json                      # Base configuration
│           └── appsettings.Development.json          # Local dev secrets (gitignored)
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

- **Dashboard Quick Samples & Shared Cache:** `DashboardClient.tsx` includes user quick-sample chips and user recent repositories, retrieving shared repository audits in `<50ms` with commit SHA staleness detection.

---

## 5. Development & Verification Guide

### 5.1 Local Ports & Networking

- **Backend API:** `http://localhost:5050` (Configured in `launchSettings.json`). *Never use port 5000 due to macOS AirPlay collision.*
- **Scalar OpenAPI Documentation:** `http://localhost:5050/scalar/v1`
- **Frontend Application:** `http://localhost:5173` (Vite dev server)

### 5.2 Common Commands

```bash
# ── Backend Operations ──────────────────────────────────────────────
cd backend
dotnet restore CodeLens.sln               # Restore NuGet packages
dotnet build CodeLens.sln                 # Build (Zero warnings required)
dotnet test CodeLens.sln                  # Run 30 xUnit tests
dotnet run --project src/CodeLens.Api     # Start API server on port 5050

# ── Frontend Operations ─────────────────────────────────────────────
cd frontend
bun install                               # Install dependencies via Bun
bun run dev                               # Start Vite React dev server
bun run build                             # Verify TypeScript & bundle compilation
bunx react-doctor@latest --scope changed  # Verify React diagnostics
```

### 5.3 Quality & Guardrail Checklist

- [x] Zero warnings on `dotnet build CodeLens.sln`.
- [x] All 30 xUnit tests passing on `dotnet test CodeLens.sln`.
- [x] Clean `bun run build` with static bundle compilation.
- [x] React Doctor baseline maintained.
- [x] Zero hardcoded secrets in source files (always use `.env.local` or gitignored `appsettings.Development.json`).
- [x] No `git clone` to local disk — all repo ingestion must remain zero-disk in-memory streams.
