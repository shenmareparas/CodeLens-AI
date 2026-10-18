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
- **Route Protection:** Handled via `<ProtectedRoute>` in `src/App.tsx`, verifying authentication state in `AuthContext.tsx`.
- **Hydration & Anti-Flash Safety:** Pre-hydration theme script runs directly inside `frontend/index.html` to eliminate theme flashing.
- **Verification Command:** Always run `bun run build` inside `frontend/` to verify TypeScript and static bundle compilation before finishing a task.
- **Diagnostics & Quality (`react-doctor`):** Before completing frontend features or committing React code, invoke the workspace skill `react-doctor` (`.agents/skills/react-doctor/SKILL.md`) to verify accessibility, bundle efficiency, and anti-patterns. Maintain a 0-warning baseline.

### Backend (`backend/`)

- **Target Framework:** Strictly `.NET 10` (`net10.0`) across all `.csproj` files. Do NOT downgrade to `net8.0` or `net9.0`.
- **Zero-Warning Policy:** `dotnet build CodeLens.sln` must succeed with **0 errors and 0 warnings**.
- **Port Assignment:** Backend API runs on `5050` (`http://localhost:5050`) to prevent collisions with macOS AirPlay (`ControlCenter` on port 5000). Never revert to port 5000.
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
- **Context Discipline:** Never send raw multi-megabyte source files to Gemini. Pass the compact **AST Symbol Manifest** + deterministic telemetry summary extracted during static analysis.
- **Resilient Fallback Synthesis:** When `Gemini:ApiKey` / `GEMINI_API_KEY` is omitted or invalid, `GeminiSynthesisService.cs` executes a deterministic fallback synthesis engine derived from AST telemetry and package manifests, guaranteeing zero-failure local development and CI runs.
- **Mermaid Sanitization:** All LLM-generated Mermaid diagrams are sanitized via `MermaidSanitizer.cs` to quote complex node labels containing brackets/colons/parentheses, normalize subgraph identifiers, and balance open blocks.
- **Dossier Artifact:** Every completed audit compiles a standardized `PROJECT_KNOWLEDGE.md` file via `MarkdownDossierBuilder.cs`, uploads it to Azure Blob Storage (`project-dossiers` container) via `IBlobStorageService`, and caches the markdown in `AuditDocument.DossierMarkdown` in Cosmos DB.
- **Streaming Endpoints (`POST /api/chat/{id}/stream`):**
  - Ground the system prompt strictly on the cached `PROJECT_KNOWLEDGE.md`.
  - Always set response headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache`, and `X-Accel-Buffering: no`.
  - Streams tokens as JSON payloads (`data: {"text":"..."}\n\n`) to prevent newline-splitting issues in HTTP proxies.

### 3.4 Cosmos DB Free-Tier Efficiency & Local Dev Fallbacks

- Containers in `CosmosRepository.cs`: `users`, `audits`, `messages`.
- Always include the Partition Key in point reads and queries to keep operations under 1–2 RUs within the 1,000 RU/s lifetime free tier.
- **In-Memory Fallbacks:** `InMemoryCosmosRepository` and `InMemoryBlobStorageService` are used automatically when Azure connection strings are omitted or placeholder, enabling zero-setup local development.

### 3.5 Unified Interactive Dashboard, Floating AI Drawer & Theme System

- **Landing Page & Routing:** `HomePage.tsx` lives at `/`, serving as a visual product showcase detailing repository telemetry, AST complexity heatmaps, and Gemini-powered architecture synthesis with direct action links to sign in (`/auth/signin`) or open the dashboard (`/dashboard`).
- **Unified Home Dashboard:** All audit content (Telemetry Bento Grid, Architecture Diagram, and Knowledge Dossier) lives in the main dashboard view (`/dashboard`). Navigation is streamlined via view tabs (`Split Workspace`, `Telemetry Bento`, `Mermaid Diagram`, `Knowledge Dossier`) on the home screen.
- **Floating AI Drawer:** A floating bottom-right `[ ✨ Ask AI ]` button (and top header action) opens a slide-over AI copilot drawer grounded in the repository's `PROJECT_KNOWLEDGE.md`, featuring prompt suggestion chips and real-time streaming tokens.
- **Trackpad Gestures, Dynamic Zoom & Pan Clamping:**
  - `MermaidViewer.tsx` supports native trackpad pinch-to-zoom (`ctrlKey + wheel` / `gesturestart` / `gesturechange`) and two-finger panning.
  - Dynamic zoom limits calculated based on SVG diagram bounds prevent over-zooming out into invisibility or over-zooming in beyond legibility.
  - Viewport pan clamping (`clampPan`) prevents the diagram from moving fully out of the container screen during mouse drag or two-finger trackpad panning.
  - Quick `[ ↺ Reset ]` action button restores the diagram view to default auto-fit scale and `(0, 0)` pan coordinates.
- **Theme Architecture (Light / Dark / System):**
  - `ThemeContext.tsx` handles `light`, `dark`, and `system` modes, dynamically listening to OS color scheme changes (`matchMedia`).
  - Pre-hydration anti-flash script in `layout.tsx` reads `localStorage` before paint to eliminate light/dark flickering.
  - Adaptive CSS variables in `globals.css` provide high contrast for input boxes, placeholders, headings, code blocks, and scrollbars in both dark and light modes.
  - Sign-in page (`SignInPage.tsx`) provides an accessible header theme cycle button allowing instant preview in any mode.
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
│       └── react-doctor/                             # React architecture, lint & bundle diagnostics skill
├── backend/
│   ├── CodeLens.sln
│   ├── Dockerfile                                    # Multi-stage .NET 10 container image (port 5050)
│   ├── tests/
│   │   └── CodeLens.Tests/                           # xUnit Test Suite (30 tests)
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
    └── src/
        ├── main.tsx                                  # React DOM entrypoint
        ├── App.tsx                                   # React Router DOM + ProtectedRoute
        ├── context/
        │   ├── AuthContext.tsx                       # JWT authentication context
        │   └── ThemeContext.tsx                      # Light/Dark/System theme context
        ├── pages/
        │   ├── HomePage.tsx                          # Modern Product Landing Page with hero, features & CTA
        │   ├── HomePage.module.css                   # Glassmorphic landing styles & animations
        │   ├── SignInPage.tsx                        # Tabbed presentation container with back-to-home
        │   ├── CredentialsForm.tsx                   # Form state, validation & submission logic
        │   ├── PasswordValidationComponents.tsx      # Eye toggles, strength meter, checklist badges
        │   ├── passwordUtils.ts                      # Criteria scoring & evaluation rules
        │   ├── SignInPage.module.css                 # Glassmorphic component styles
        │   └── DashboardPage.tsx                     # Protected dashboard page
        ├── components/
        │   ├── DashboardClient.tsx                   # Unified Dashboard (Bento Grid, Dossier & Diagram tabs)
        │   ├── DashboardHeader.tsx                   # Top bar navigation, home breadcrumbs & user profile
        │   ├── ActiveAuditSection.tsx                # Active audit summary, stale banner & Bento container
        │   ├── TelemetryBentoGrid.tsx                # Bento Grid telemetry presentation
        │   ├── DependenciesCard.tsx                  # Polyglot dependency cards with ecosystem filter tabs & search
        │   ├── HotspotTable.tsx                      # Complexity x Churn risk table
        │   ├── SparklineChart.tsx                    # SVG commit sparkline chart
        │   ├── MermaidViewer.tsx                     # Client-side Mermaid diagram canvas with pan/zoom/copy
        │   ├── DossierViewer.tsx                     # Formatted Markdown dossier preview with SAS download
        │   └── RepoChatSidebar.tsx                   # Real-time SSE grounded repo copilot sidebar
        ├── styles/
        │   └── globals.css                           # Glassmorphism design system, tokens (Plus Jakarta Sans, Inter, JetBrains Mono)
        └── lib/
            └── api-client.ts                         # Typed REST API & SSE client (JSON & raw chunk handling)
```

- **Dashboard Quick Samples & Shared Cache:** `DashboardClient.tsx` provides quick-sample chips linking to lightweight repositories (`shenmareparas/Chess`, `expense_tracker`, `play-store-ai-review`, `Portfolio_NextJS`, `nexu5-music-bot`) and retrieves shared audits in `<50ms` with remote commit staleness detection.

---

## 5. Pre-Commit Verification Checklist for Agents

1. Run `dotnet build backend/CodeLens.sln` — Must output `0 Warning(s)` and `0 Error(s)`.
2. Run `dotnet test backend/CodeLens.sln` — All xUnit tests must pass (currently 30/30).
3. Run `cd frontend && bun run build` — Must pass typechecking and static bundle compilation cleanly.
4. Run `bunx react-doctor@latest --scope changed` — Verify diagnostics baseline.
5. Verify no secrets or API keys are hardcoded in `appsettings.json` or `.env.local`.
