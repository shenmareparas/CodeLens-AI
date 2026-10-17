# AGENTS.md — CodeLens AI Agent Rules & Context

## 1. Project Identity & Core Architecture

- **Project:** CodeLens AI (Repository Intelligence, Architecture Auditor & Onboarding Copilot)
- **Monorepo Layout:**
  - `frontend/`: Next.js 16 (App Router), Bun, TypeScript, Tailwind CSS, NextAuth v5 (Hybrid Google OAuth + Email/Password Credentials)
  - `backend/`: C# .NET 10 (`net10.0`) 3-project Clean Architecture solution (`CodeLens.Core`, `CodeLens.Infrastructure`, `CodeLens.Api`) + `tests/CodeLens.Tests`
- **Cloud & Storage:** Microsoft Azure (Container Apps, Static Web Apps, Cosmos DB NoSQL Free Tier, Azure Blob Storage)
- **AI Engine:** Google Gemini 3.8 Flash (`gemini-3.8-flash`) via `Microsoft.SemanticKernel` (`1.81.0`) using a Google AI Studio API Key

---

## 2. Strict Environment & Command Rules

### Frontend (`frontend/`)

- **NEVER** use `npm`, `npx`, `yarn`, or `pnpm`. **ALWAYS** use **Bun** (`bun install`, `bun add`, `bun run dev`, `bun run build`).
- **Next.js 16 Routing Convention:** Route protection is handled in `src/proxy.ts` (Next.js 16 convention). Do NOT create a legacy `src/middleware.ts` file that conflicts with `src/proxy.ts`.
- **Hydration Safety:** Root `<body>` in `src/app/layout.tsx` uses `suppressHydrationWarning` to prevent browser extension mismatches.
- **Verification Command:** Always run `bun run build` inside `frontend/` to verify TypeScript and static/dynamic route compilation before finishing a task.
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

### 3.1 Hybrid Authentication & Account Linking (`AuthService.cs` & `src/auth.ts`)

- **Supported Flows:**
  1. `POST /api/auth/register` — Email/password registration using `PasswordHasher<UserDocument>` (PBKDF2 with HMAC-SHA512 + 100,000 iterations). Enforces strong password rules (8+ chars, uppercase, lowercase, digit, special symbol).
  2. `POST /api/auth/login` — Email/password login returning a signed HS256 backend JWT.
  3. `POST /api/auth/google` — Google `id_token` validation via `Google.Apis.Auth` (`1.73.0`). If an account with the same verified email already exists in Cosmos DB, auto-link `GoogleSub` and append `"google"` to `AuthProviders` while preserving the existing `UserDocument.Id`.
  4. `POST /api/auth/link-google` — Authenticated endpoint to bind a Google account to an existing logged-in user.
  5. `POST /api/auth/set-password` — Authenticated endpoint to assign a local password to an existing logged-in OAuth user.
  6. `DELETE /api/auth/users` — Cleanup endpoint to purge all users in development.
- **Frontend Password UX:** Password forms in `frontend/src/app/auth/signin/` feature interactive eye show/hide visibility toggles, real-time password criteria validation badges, dynamic strength meters, and confirm-password matching.
- **Frontend Session Contract:** NextAuth v5 (`src/auth.ts`) stores the backend-issued HS256 JWT in `session.backendToken`. All API calls in `src/lib/api-client.ts` pass `Authorization: Bearer ${session.backendToken}`.

### 3.2 Zero-Disk Ingestion Pipeline (Phase 2)

- **NEVER** execute `git clone` to the local filesystem.
- Always stream the repository's default branch via Octokit's Zipball API directly into memory (`System.IO.Compression.ZipArchive`).
- Filter out non-source and vendor directories during stream iteration: `node_modules/`, `.git/`, `bin/`, `obj/`, `dist/`, `.next/`, `vendor/`, and binary assets.
- **Hotspot Formula:** Calculate file hotspot risk scores deterministically as:
  `RiskScore = Math.Round(CyclomaticComplexity * Math.Log(ChurnCount + 1), 2)`
- **Polyglot Dependency Manifest Parsing:**
  - **Bun & Node.js:** Parses `bun.lock` (Bun 1.2+ text lockfile with trailing commas) and `package.json`. If `bun.lock`, `bun.lockb`, `bunfig.toml`, or `packageManager: "bun@..."` is detected, packages are labeled under `Bun` and `Bun (dev)`; otherwise defaults to `npm` and `npm (dev)`.
  - **Dart & Flutter:** Parses `pubspec.yaml` with indentation tracking to capture `dependencies:` (`Pub`), `dev_dependencies:` (`Pub (dev)`), and `dependency_overrides:` (`Pub (override)`), resolving nested sub-properties (`sdk: flutter`, `git:`, `path:`, `version:`) into package version metadata.
  - **.NET, Python, Go & Rust:** Parses `.csproj` / `Directory.Build.props` (`NuGet`), `requirements.txt` (`PyPI`), `go.mod` (`Go Modules`), and `Cargo.toml` (`Cargo`).
- **Secret Scanning:** Use `.NET 10` compile-time `[GeneratedRegex]` attributes inside `RegexSecretScanner.cs` for zero-allocation pattern matching.
- **GitHub Rate Limits & Quotas:** Unauthenticated IP quota is 60 requests/hr. Supplying `GITHUB_TOKEN` in the environment or `appsettings.Development.json` unlocks 5,000 requests/hr. `OctokitTelemetryService.cs` automatically inspects remaining rate quota to avoid exhausting unauthenticated calls.

### 3.3 Gemini 3.8 Flash & Dossier Synthesis (Phase 3)

- **Model Identifier:** Always use `gemini-3.8-flash` via `Microsoft.SemanticKernel` (`1.81.0`).
- **Context Discipline:** Never send raw multi-megabyte source files to Gemini. Pass the compact **AST Symbol Manifest** + deterministic telemetry summary extracted during Phase 2.
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

---

## 4. Key File Map

```text
codelens-ai/
├── PROJECT_PLAN.md                                   # Master specification & roadmap
├── PROJECT_CONTEXT.md                                # Comprehensive architectural single-source-of-truth
├── README.md                                         # Quickstart, setup, and overview
├── .agents/
│   ├── AGENTS.md                                     # AI coding agent instructions & guardrails
│   └── skills/
│       └── react-doctor/                             # React architecture, lint & bundle diagnostics skill
├── backend/
│   ├── CodeLens.sln
│   ├── tests/
│   │   └── CodeLens.Tests/                           # xUnit Test Suite (27 tests)
│   │       ├── OctokitTelemetryTests.cs
│   │       ├── RoslynAndPolyglotAnalyzerTests.cs
│   │       ├── SecretScannerTests.cs
│   │       ├── UserRepositoryTests.cs
│   │       └── GeminiSynthesisTests.cs               # Phase 3 SK, Mermaid sanitizer & dossier tests
│   └── src/
│       ├── CodeLens.Core/
│       │   ├── Entities/                             # UserDocument, AuditDocument, ChatMessageDocument
│       │   ├── DTOs/                                 # ApiDtos.cs, TelemetryDtos.cs
│       │   └── Interfaces/                           # ICosmosRepository, IBlobStorageService, IGitHubTelemetryService, ICodeAnalysisService, IGeminiSynthesisService
│       ├── CodeLens.Infrastructure/
│       │   ├── Auth/AuthService.cs                   # Hybrid Credentials + Google OAuth + JWT + PBKDF2
│       │   ├── Data/CosmosRepository.cs              # Cosmos DB persistence
│       │   ├── Data/InMemoryCosmosRepository.cs      # Local in-memory repository fallback
│       │   ├── Data/BlobStorageService.cs            # Azure Blob + 15-min SAS URLs
│       │   ├── Data/InMemoryBlobStorageService.cs    # Local in-memory blob fallback
│       │   ├── GitHub/OctokitTelemetryService.cs     # Commits, sparklines, releases, zipball stream, rate budgeting
│       │   ├── Analysis/RoslynAndPolyglotAnalyzer.cs # AST, cyclomatic complexity, hotspots, dead code, dependencies
│       │   ├── Security/RegexSecretScanner.cs        # [GeneratedRegex] secret detection
│       │   └── AI/                                   # Phase 3 AI Engine
│       │       ├── GeminiOptions.cs                  # Gemini API options & model config
│       │       ├── GeminiSynthesisService.cs         # SK connector & fallback synthesis engine
│       │       ├── MermaidSanitizer.cs               # Diagram AST syntax cleanup & label quoting
│       │       └── MarkdownDossierBuilder.cs         # Standardized PROJECT_KNOWLEDGE.md generator
│       └── CodeLens.Api/
│           ├── Endpoints/                            # AuthEndpoints, AuditEndpoints, ChatEndpoints
│           └── Program.cs                            # Port 5050, DI, JWT Bearer, CORS, Scalar OpenAPI
└── frontend/
    └── src/
        ├── auth.ts                                   # NextAuth v5 (Google + Credentials)
        ├── proxy.ts                                  # Next.js 16 auth route protection
        ├── lib/api-client.ts                         # Typed REST + SSE stream client (JSON & raw chunk handling)
        ├── app/
        │   ├── auth/signin/
        │   │   ├── page.tsx                          # Auth entrypoint
        │   │   ├── SignInPage.tsx                    # Tabbed Sign-In / Sign-Up Presentation
        │   │   ├── CredentialsForm.tsx               # Form state & NextAuth handler
        │   │   ├── PasswordValidationComponents.tsx  # Eye toggles, strength bar, checklist
        │   │   └── passwordUtils.ts                  # Criteria scoring & evaluation rules
        │   └── dashboard/
        │       ├── page.tsx                          # Protected server dashboard page
        │       ├── DashboardClient.tsx               # Telemetry Bento Grid & repo submission
        │       └── audit/[id]/
        │           ├── page.tsx                      # Split-screen audit workspace entrypoint
        │           └── AuditWorkspaceClient.tsx      # Split workspace orchestrator (Dossier + Chat + Diagram)
        └── components/
            ├── DashboardHeader.tsx                   # Top bar navigation & user profile
            ├── ActiveAuditSection.tsx                # Active audit summary, stale banner & Bento container
            ├── TelemetryBentoGrid.tsx                # Bento Grid telemetry presentation
            ├── DependenciesCard.tsx                  # Ecosystem filter tabs (Bun, Pub, npm, NuGet, PyPI), package search & badges
            ├── HotspotTable.tsx                      # Complexity x Churn risk table
            ├── SparklineChart.tsx                    # SVG 8-week commit sparklines
            ├── MermaidViewer.tsx                     # Client-side Mermaid diagram canvas with pan/zoom/copy
            ├── DossierViewer.tsx                     # Formatted Markdown dossier preview with SAS download
            ├── RepoChatSidebar.tsx                   # Real-time SSE grounded repo copilot sidebar
            └── Providers.tsx                         # NextAuth SessionProvider wrapper
- **Dashboard Quick Samples & Shared Cache:** `DashboardClient.tsx` provides quick-sample chips linking to lightweight repositories (`shenmareparas/Chess`, `expense_tracker`, `play-store-ai-review`, `Portfolio_NextJS`, `nexu5-music-bot`) and retrieves shared audits in `<50ms` with remote commit staleness detection.
```

---

## 5. Pre-Commit Verification Checklist for Agents

1. Run `dotnet build backend/CodeLens.sln` — Must output `0 Warning(s)` and `0 Error(s)`.
2. Run `dotnet test backend/CodeLens.sln` — All xUnit tests must pass (currently 27/27).
3. Run `cd frontend && bun run build` — Must pass typechecking and route generation cleanly.
4. Run `bunx react-doctor@latest --scope changed` — Must report 0 issues.
5. Verify no secrets or API keys are hardcoded in `appsettings.json` or `.env.local`.
