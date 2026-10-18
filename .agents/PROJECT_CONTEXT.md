# CodeLens AI — Project Context & Architectural Specification

> **Frameworks:** .NET 10 (`net10.0`), Next.js 16 (App Router), Bun runtime, Google Gemini 3.8 Flash  

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
                               │     Next.js 16 (Bun / App Router)      │
                               │     Tailwind CSS / NextAuth v5         │
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
| **Frontend Framework** | Next.js 16 | App Router, React 19 | Server & Client Components, Geist typography |
| **Styling & Design** | Tailwind CSS / CSS Modules | Custom Glassmorphism | Dark theme token system, smooth transitions |
| **Frontend Auth** | NextAuth.js (Auth.js) | `v5.0.0-beta.25` | Hybrid Credentials provider + Google OAuth 2.0 |
| **Route Protection** | Next.js 16 Proxy | `src/proxy.ts` | Route protection convention (no legacy `middleware.ts`) |
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

### 3.1 Authentication & Account Linking

- **Password Security:** Passwords hashed with `Microsoft.AspNetCore.Identity.PasswordHasher<UserDocument>` using PBKDF2 with HMAC-SHA512 and 100,000 iterations.
- **Complexity Policy:** Enforces 8+ characters, at least one uppercase (`A-Z`), one lowercase (`a-z`), one digit (`0-9`), and one special character (`!@#$%^&*...`).
- **Interactive Password UX:**
  - Eye/eye-off visibility toggle buttons for password and confirm-password fields.
  - Live criteria checklist with checkmark status badges.
  - Dynamic 5-level strength meter (`Weak` → `Fair` → `Good` → `Strong`).
  - Real-time confirm-password matching indicator.
- **OAuth Account Linking:** When authenticating via Google OAuth (`POST /api/auth/google`), the backend validates the Google `id_token` cryptographically via `Google.Apis.Auth`. If an existing user matches the verified email, it automatically links `GoogleSub` and appends `"google"` to `AuthProviders`.
- **Session Bridge:** NextAuth v5 stores the backend-issued HS256 JWT in `session.backendToken`. The frontend `api-client.ts` automatically attaches `Authorization: Bearer ${session.backendToken}` to all backend calls.

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
- **Test Suite:** 29 unit tests in `tests/CodeLens.Tests/` covering telemetry parsing, shared repo cache, polyglot analysis, Pub/Dart dependencies, Bun lockfile & packageManager parsing, secret scanning & example file filtering, repository persistence, Semantic Kernel connector, Mermaid sanitization, and dossier compilation.

### 3.3 Gemini 3.8 Flash Synthesis & Dossier Builder

- **Model:** `gemini-3.8-flash` via `Microsoft.SemanticKernel` (`1.81.0`).
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

### 3.4 Unified Dashboard, Floating AI Drawer & Theme System

- **Unified Home Dashboard:** All audit content (Telemetry Bento Grid, Architecture Diagram, and Knowledge Dossier) lives in the main dashboard view (`/dashboard`) with seamless view switching (`Split Workspace`, `Telemetry Bento`, `Mermaid Diagram`, `Knowledge Dossier`).
- **Floating AI Drawer:** A floating bottom-right `[ ✨ Ask AI ]` button triggers a slide-over copilot drawer grounded directly in the audit's `PROJECT_KNOWLEDGE.md`, streaming response tokens via Server-Sent Events (`POST /api/chat/{id}/stream`).
- **Touchpad Gestures, Dynamic Zoom & Pan Clamping:** `MermaidViewer.tsx` supports trackpad pinch-to-zoom and two-finger pan with calculated diagram bounds that dynamically clamp zoom scale, viewport boundary protection (`clampPan`) ensuring diagrams never disappear off-screen, and a dedicated `[ ↺ Reset ]` action button to quickly return to default framing.
- **Light / Dark / System Theme:** Full 3-mode theme system (`System`, `Dark`, `Light`) with automatic OS preference detection via media query listeners, pre-hydration anti-flash script in `layout.tsx`, adaptive SVG diagram palette updates, and accessible high-contrast form controls, typography, and scrollbars across both the dashboard and the authentication screens.
- **Shared Repository Cache & 1-Click Re-Analysis:** `POST /api/audit` returns cached audits in `<50ms` and checks remote default branch commit SHAs to detect staleness and offer 1-click re-analysis (`forceRefresh: true`).

### 3.5 Cloud Infrastructure & CI/CD Deployment

- **Infrastructure as Code:** Azure Bicep templates in `infra/main.bicep` and `infra/main.parameters.json`.
- **Zero-Cost Profile:**
  - Azure Container Apps (`ca-codelens-api`) with scale-to-zero compute (`minReplicas: 0`, `maxReplicas: 1`, 0.25 vCPU, 0.5 Gi memory).
  - Azure Static Web Apps (`swa-codelens`) on Free SKU for Next.js frontend.
  - Azure Cosmos DB NoSQL Lifetime Free Tier (1,000 RU/s, 25 GB storage).
  - Azure Blob Storage (`stcodelens...`) with container `project-dossiers` for dossier markdown and 15-minute SAS tokens.
- **CI/CD Automation:** GitHub Actions workflows (`deploy-backend.yml`, `deploy-frontend.yml`) running test suites, building Docker images to GHCR, and deploying to Azure.

---

## 4. Key Directory & File Index

```text
codelens-ai/
├── README.md                                         # Quickstart and overview
├── .github/
│   └── workflows/
│       ├── deploy-backend.yml                        # GitHub Actions: .NET 10 build, test, Docker & ACA deploy
│       └── deploy-frontend.yml                       # GitHub Actions: Bun Next.js 16 build & SWA deploy
├── infra/
│   ├── main.bicep                                    # Zero-cost Azure Bicep template (ACA, SWA, Cosmos, Blob)
│   └── main.parameters.json                          # Deployment parameter configurations
├── .agents/
│   ├── AGENTS.md                                     # AI coding agent rules and operational constraints
│   ├── PROJECT_CONTEXT.md                            # Authoritative project context & architecture spec
│   ├── PROJECT_PLAN.md                               # Comprehensive roadmap and technical specification
│   └── skills/
│       └── react-doctor/                             # React architecture, lint & bundle diagnostics skill
├── backend/
│   ├── CodeLens.sln                                  # .NET 10 solution file
│   ├── Dockerfile                                    # Multi-stage production container build (port 5050)
│   ├── tests/
│   │   └── CodeLens.Tests/                           # 28 xUnit tests
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
│       │   ├── Auth/AuthService.cs                   # Hybrid Credentials + Google OAuth + PBKDF2
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
    ├── .env.local                                    # Local environment variables (gitignored)
    └── src/
        ├── auth.ts                                   # NextAuth v5 configuration
        ├── proxy.ts                                  # Next.js 16 route protection proxy
        ├── lib/
        │   ├── api-client.ts                         # Typed REST API & SSE client (JSON & raw chunk handling)
        │   └── auth-helpers.ts                       # Server-side auth helpers
        ├── app/
        │   ├── globals.css                           # Glassmorphism design system & CSS tokens
        │   ├── layout.tsx                            # Root layout with Geist typography
        │   ├── page.tsx                              # Landing page
        │   ├── api/auth/[...nextauth]/route.ts       # NextAuth route handler
        │   ├── auth/signin/
        │   │   ├── page.tsx                          # Auth entrypoint
        │   │   ├── SignInPage.tsx                    # Tabbed presentation container
        │   │   ├── CredentialsForm.tsx               # Form state, validation & submission logic
        │   │   ├── PasswordValidationComponents.tsx  # Eye toggles, strength meter, checklist badges
        │   │   ├── passwordUtils.ts                  # Pure scoring rules & validation helpers
        │   │   └── SignInPage.module.css             # Glassmorphic component styles
        │   └── dashboard/
        │       ├── page.tsx                          # Protected server page with session check
        │       ├── DashboardClient.tsx               # Dashboard client orchestrator
        │       └── audit/[id]/
        │           ├── page.tsx                      # Split-screen audit workspace entrypoint
        │           └── AuditWorkspaceClient.tsx      # Split workspace orchestrator (Dossier + Chat + Diagram)
        └── components/
            ├── DashboardHeader.tsx                   # Top bar navigation & user profile
            ├── ActiveAuditSection.tsx                # Active audit summary, stale banner & Bento container
            ├── TelemetryBentoGrid.tsx                # Bento Grid telemetry presentation
            ├── DependenciesCard.tsx                  # Polyglot dependency cards with ecosystem filter tabs & search
            ├── HotspotTable.tsx                      # Complexity x Churn risk table
            ├── SparklineChart.tsx                    # SVG commit sparkline chart
            ├── MermaidViewer.tsx                     # Client-side Mermaid diagram canvas with pan/zoom/copy
            ├── DossierViewer.tsx                     # Formatted Markdown dossier preview with SAS download
            ├── RepoChatSidebar.tsx                   # Real-time SSE grounded repo copilot sidebar
            └── Providers.tsx                         # NextAuth SessionProvider wrapper
- **Dashboard Quick Samples & Shared Cache:** `DashboardClient.tsx` includes user quick-sample chips and user recent repositories, retrieving shared repository audits in `<50ms` with commit SHA staleness detection.
```

---

## 5. Development & Verification Guide

### 5.1 Local Ports & Networking

- **Backend API:** `http://localhost:5050` (Configured in `launchSettings.json`). *Never use port 5000 due to macOS AirPlay collision.*
- **Scalar OpenAPI Documentation:** `http://localhost:5050/scalar/v1`
- **Frontend Application:** `http://localhost:3000`

### 5.2 Common Commands

```bash
# ── Backend Operations ──────────────────────────────────────────────
cd backend
dotnet restore CodeLens.sln               # Restore NuGet packages
dotnet build CodeLens.sln                 # Build (Zero warnings required)
dotnet test CodeLens.sln                  # Run 29 xUnit tests
dotnet run --project src/CodeLens.Api     # Start API server on port 5050

# ── Frontend Operations ─────────────────────────────────────────────
cd frontend
bun install                               # Install dependencies via Bun
bun run dev                               # Start Next.js 16 dev server
bun run build                             # Verify TypeScript & route compilation
bunx react-doctor@latest --scope changed  # Verify React diagnostics
```

### 5.3 Quality & Guardrail Checklist

- [x] Zero warnings on `dotnet build CodeLens.sln`.
- [x] All 29 xUnit tests passing on `dotnet test CodeLens.sln`.
- [x] Clean `bun run build` with static & dynamic route compilation.
- [x] React Doctor baseline maintained.
- [x] Zero hardcoded secrets in source files (always use `.env.local` or gitignored `appsettings.Development.json`).
- [x] No `git clone` to local disk — all repo ingestion must remain zero-disk in-memory streams.
