# CodeLens AI — Master Project Specification & Execution Plan

**Project Name:** CodeLens AI  
**Category:** AI-Powered Repository Intelligence, Architecture Auditor & Onboarding Copilot  
**Frontend Stack:** Next.js 16 (App Router, `src/proxy.ts`), Bun, TypeScript, Tailwind CSS, NextAuth v5 (Google OAuth + Credentials)  
**Backend Stack:** C# .NET 10 (`net10.0`), ASP.NET Core Minimal API, Scalar OpenAPI, Microsoft Semantic Kernel (`1.81.0`), Roslyn, Octokit  
**Cloud & Data:** Microsoft Azure (Container Apps, Static Web Apps, Cosmos DB Free Tier, Azure Blob Storage)  
**AI Model:** Google Gemini 3.8 Flash (via Google AI Studio API Key)  
**Target Scale:** <10 Active Users ($0.00/month Cloud Infrastructure Cost)

---

## 1. Executive Summary

CodeLens AI ingests GitHub repositories via URL, extracts deterministic metrics using the GitHub API (`Octokit`) and the Microsoft Roslyn Compiler Platform (with polyglot support for TS/JS/Python/Go/Java), and synthesizes architectural intelligence using **Google Gemini 3.8 Flash**.

For every analyzed repository, the system generates a portable **`PROJECT_KNOWLEDGE.md`** dossier stored in Azure Blob Storage and cached in Azure Cosmos DB. This dossier powers a grounded, real-time Server-Sent Events (SSE) streaming chat assistant for developer onboarding and codebase Q&A.

---

## 2. Core Feature Matrix (11 Pillars)

| # | Feature | Processing Engine | Output / UI Representation |
| :--- | :--- | :--- | :--- |
| 1 | **Commit Velocity & Activity Sparklines** | GitHub API (`Octokit`) | 8-week / 30-day SVG commit trend sparklines |
| 2 | **Release Cadence & Stagnation Alert** | GitHub API (`Octokit`) | Health badge (`Healthy`, `Stable`, `Stagnant`) + days since release |
| 3 | **Language & File Type Distribution** | GitHub API + Archive Scanner | Byte percentage breakdown & visual donut chart |
| 4 | **Complexity Heatmap (File Hotspots)** | Roslyn / Polyglot Complexity × Git Churn | Ranked list of high-risk files (`Red`, `Amber`, `Green`) |
| 5 | **Dependency & Ecosystem Inventory** | `.csproj` / `package.json` / `requirements.txt` Parser | Direct packages, target frameworks, and version inventory |
| 6 | **Dead Code & Zombie File Detection** | Roslyn AST Symbol Graph + Git History | Unreferenced internal classes/methods & dormant files |
| 7 | **Secret & Sensitive Data Surface** | .NET 10 `[GeneratedRegex]` Scanner | Alerts for exposed API keys, `.env`, `.pem`, or private keys |
| 8 | **License & Commercial Usability** | SPDX Parser + Gemini 3.8 Flash | Plain-English legal risk verdict (Commercial use, Copyleft risk) |
| 9 | **Interactive Architecture Explorer** | AST Symbol Manifest + Gemini 3.8 Flash | Pan/zoomable Mermaid.js C4 & component dependency diagram |
| 10 | **"Explain Like I'm 5" (ELI5) Summary** | Gemini 3.8 Flash | 3-sentence non-technical project overview |
| 11 | **Code Smells & Anti-Patterns** | Gemini 3.8 Flash | Identification of God classes, circular references, tight coupling |

---

## 3. System Architecture

```mermaid
graph TB
    subgraph Client ["Next.js 16 Frontend (Bun / Azure Static Web Apps)"]
        UI_Auth["Hybrid Auth UI (Email/Password + Google OAuth)<br/>& Next.js 16 Proxy (src/proxy.ts)"]
        UI_Dash["Telemetry Dashboard & Sparklines"]
        UI_Split["Split Workspace: Dossier Preview + Repo Chat"]
        UI_Mermaid["Interactive Mermaid.js Canvas"]
    end

    subgraph Azure ["Microsoft Azure Cloud (Free Tier)"]
        API["ASP.NET Core .NET 10 Minimal API<br/>(Azure Container Apps)"]
        
        subgraph Engines ["Backend Processing Engines"]
            AuthSvc["Hybrid Auth & Account Linking Service<br/>(PBKDF2/BCrypt + Google ID Token)"]
            Octo["Octokit Telemetry & Zipball Streamer"]
            Roslyn["Roslyn AST & Polyglot Complexity Engine"]
            Regex[".NET 10 GeneratedRegex Secret Scanner"]
            SK["Microsoft Semantic Kernel (v1.81.0)"]
            Dossier["Markdown Dossier Builder"]
        end

        Cosmos[("Azure Cosmos DB<br/>(Free 1,000 RU/s)<br/>users | audits | messages")]
        Blob[("Azure Blob Storage<br/>(PROJECT_KNOWLEDGE.md)")]
    end

    subgraph External ["External APIs"]
        GH["GitHub REST API & Zipball Archive"]
        Gemini["Google AI Studio API<br/>(Gemini 3.8 Flash)"]
    end

    UI_Auth -->|Credentials or Google ID Token| API
    UI_Dash -->|HTTPS REST + Bearer JWT| API
    UI_Split -->|SSE Token Stream| API
    API --> AuthSvc
    API --> Octo
    API --> Roslyn
    API --> Regex
    API --> SK
    API --> Dossier
    Octo -->|Metadata & Zip Stream| GH
    SK -->|Streaming Inference| Gemini
    API --> Cosmos
    Dossier --> Blob
```

---

## 4. Hybrid Authentication & Account Linking Architecture

CodeLens AI supports both **Standard Email/Password Authentication** and **Google OAuth 2.0**, allowing users to link or merge their accounts seamlessly without losing audit history.

### 4.1 `UserDocument` Schema (`users` Container)

```json
{
  "id": "usr_01HXYZ",
  "email": "developer@example.com",
  "name": "Paras Shenmare",
  "avatarUrl": "[https://lh3.googleusercontent.com/](https://lh3.googleusercontent.com/)...",
  "passwordHash": "$2a$11$...",
  "googleSub": "109876543210987654321",
  "authProviders": ["credentials", "google"],
  "createdAt": "2026-10-15T12:00:00Z"
}
```

### 4.2 Supported Authentication Flows

1. **Standard Sign-Up (`POST /api/auth/register`):**
   - Accepts `{ name, email, password }`.
   - Verifies the email is not already registered with a password.
   - Hashes the password using ASP.NET Core `PasswordHasher<UserDocument>` (PBKDF2 with HMAC-SHA512), sets `authProviders = ["credentials"]`, saves to Cosmos DB, and returns a signed HS256 backend JWT.
2. **Standard Sign-In (`POST /api/auth/login`):**
   - Accepts `{ email, password }`.
   - Verifies the password hash and issues the signed HS256 backend JWT.
3. **Google OAuth Sign-In & Auto-Linking (`POST /api/auth/google`):**
   - Validates the Google `id_token` via `GoogleJsonWebSignature.ValidateAsync()`.
   - Queries Cosmos DB by normalized `email`:
     - **New User:** Creates a `UserDocument` with `googleSub` and `authProviders = ["google"]`.
     - **Existing Email/Password User:** Automatically links the Google account by setting `googleSub`, appending `"google"` to `authProviders`, updating `avatarUrl` if empty, and issuing the JWT for the existing `user.Id`.
4. **Explicit Account Linking (`POST /api/auth/link-google` & `POST /api/auth/set-password`):**
   - Logged-in credentials users can link a Google account from the dashboard via `POST /api/auth/link-google`.
   - Logged-in Google-only users can add a local password via `POST /api/auth/set-password`.

---

## 5. End-to-End Ingestion, Analysis & Chat Pipeline

1. **Authentication:** User signs in via Email/Password or Google OAuth on Next.js 16 (`src/auth.ts`). Next.js exchanges the credentials or Google `id_token` with the .NET 10 API for a signed HS256 backend JWT stored in `Session.backendToken`.
2. **Ingestion Trigger & Shared Cache Check:** User submits a GitHub repository URL (`https://github.com/owner/repo`) to `POST /api/audits/analyze`.
   - **Cache Hit (Fresh):** If the repository has already been audited and the remote default branch commit SHA matches `AuditDocument.CommitSha`, return the shared audit immediately in `<50ms` with zero compute/AI overhead.
   - **Cache Hit (Stale):** If the repository has newer commits, return the cached audit immediately with an `isStale: true` flag and latest commit metadata, allowing the frontend to render the dossier instantly alongside an outdated notice and **"🔄 Re-analyze Latest Commits"** action button.
   - **Cache Miss / Forced Refresh:** If no audit exists or `forceRefresh: true` is passed, proceed to parallel zero-disk ingestion.
3. **In-Memory Parallel Extraction (Zero Disk Bloat):**
   - **Task A (`OctokitTelemetryService`):** Queries GitHub for stars, forks, license, release history, language breakdown, 8-week commit sparkline, recent file commit churn, and the latest commit SHA.
   - **Task B (`RoslynAndPolyglotAnalyzer`):** Streams the repository's default branch as an in-memory `ZipArchive` stream. Filters out vendor/build directories (`node_modules/`, `bin/`, `obj/`, `.git/`, `dist/`), calculates cyclomatic complexity per file, detects unreferenced symbols, parses `.csproj`/`package.json`/`pubspec.yaml` dependencies, runs `RegexSecretScanner`, and builds a compact **Symbol Manifest**.
4. **AI Synthesis (`GeminiSemanticKernelService`):** Sends the Symbol Manifest and telemetry summary to **Gemini 3.8 Flash** to generate the ELI5 summary, license usability verdict, Mermaid.js architecture diagram, code smells, and onboarding runbook.
5. **Dossier Compilation (`MarkdownDossierBuilder`):** Combines deterministic telemetry and Gemini outputs into `PROJECT_KNOWLEDGE.md`, uploads it to Azure Blob Storage, and saves the complete `AuditDocument` in Azure Cosmos DB.
6. **Grounded Repo Copilot (`POST /api/chat/{id}/stream`):** Injects the cached `PROJECT_KNOWLEDGE.md` into the system prompt and streams answers token-by-token over Server-Sent Events (`text/event-stream`).

---

## 6. Implementation Roadmap & Current Progress

### ✅ Phase 1: Foundation, Auth & Core Plumbing (COMPLETED + HYBRID AUTH UPGRADE)

- [x] **Frontend (`frontend/`):** Next.js 16 + Bun initialized with Geist fonts, custom dark glassmorphism design system (`globals.css`), NextAuth v5 (`src/auth.ts`), route protection (`src/proxy.ts`), typed API & SSE client (`src/lib/api-client.ts`), Sign-In UI, and Dashboard.
- [x] **Backend (`backend/`):** 3-project `.NET 10` (`net10.0`) solution (`CodeLens.Core`, `CodeLens.Infrastructure`, `CodeLens.Api`) building with 0 warnings and 0 errors. Configured on port `5050` to prevent macOS AirPlay port 5000 collisions.
- [x] **Security & Data Plumbing:** `AuthService.cs` (Google `id_token` validation + HS256 JWT generation), `CosmosRepository.cs` (`users`, `audits`, `messages` containers), `BlobStorageService.cs` (upload + 15-min SAS URL generator), and Scalar OpenAPI UI (`/scalar/v1` on `http://localhost:5050/scalar/v1`).
- [x] **Phase 1.5 — Hybrid Email/Password + Google Account Linking:**
  - Extended `UserDocument` with `PasswordHash`, `GoogleSub`, and `AuthProviders`.
  - Added `/api/auth/register`, `/api/auth/login`, `/api/auth/link-google`, and `/api/auth/set-password` in `AuthService.cs` and `AuthEndpoints.cs`.
  - Implemented real-time password criteria validation (8+ chars, uppercase, lowercase, number, special symbol), visual strength meter, criteria checklist, confirm-password match validation, and eye show/hide visibility toggles in `SignInPage.tsx`, `CredentialsForm.tsx`, and `PasswordValidationComponents.tsx`.
  - Added repository reset endpoint `DELETE /api/auth/users` for test cleanup.

### ✅ Phase 2: Deterministic Telemetry & Static Analysis Pipeline (COMPLETED)

- [x] **Step 2.1 — Core Contracts:** Added `IGitHubTelemetryService` and `ICodeAnalysisService` interfaces along with telemetry, hotspot, dead code, dependency, and secret alert records in `CodeLens.Core`.
- [x] **Step 2.2 — Octokit Telemetry Engine:** Implemented `OctokitTelemetryService.cs` in `CodeLens.Infrastructure/GitHub/` to fetch repo metadata, 8-week commit sparklines, release cadence status, file commit churn, rate-limit quota budgeting, and the in-memory repository zipball stream.
- [x] **Step 2.3 — Roslyn & Polyglot Analyzer:** Implemented `RoslynAndPolyglotAnalyzer.cs` in `CodeLens.Infrastructure/Analysis/` to iterate through the `ZipArchive` stream in memory, calculate cyclomatic complexity, compute Hotspot Risk Scores ($\text{Complexity} \times \ln(\text{Churn} + 1)$), identify dead code candidates, parse polyglot package dependencies (Bun `bun.lock`, Node `package.json`, Dart `pubspec.yaml`, .NET `.csproj`, Python `requirements.txt`, Go `go.mod`, Rust `Cargo.toml`), and build the compact Symbol Manifest. Validated on production repositories including `facebook/react` (1,046 files, 234K LOC) and `fastapi/fastapi` (2,751 files, 379K LOC).
- [x] **Step 2.4 — Compiled Secret Scanner:** Implemented `RegexSecretScanner.cs` in `CodeLens.Infrastructure/Security/` using `.NET 10` `[GeneratedRegex]` compile-time attributes for zero-allocation credential, private key, and `.env`/`.pem` detection.
- [x] **Step 2.5 — Pipeline Wiring & Telemetry UI:** Connected `POST /api/audits/analyze` in `AuditEndpoints.cs` to execute Phase 2 engines and persist deterministic metrics to `AuditDocument` in Cosmos DB. Built `TelemetryBentoGrid.tsx`, `DependenciesCard.tsx` (with real-time ecosystem filtering and search), `HotspotTable.tsx`, and `SparklineChart.tsx` in frontend. Created 19 xUnit tests in `CodeLens.Tests` with 100% pass rate.

### ✅ Phase 3: Gemini 3.8 Flash Synthesis & Dossier Builder (COMPLETED)

- [x] **Step 3.1 — Semantic Kernel Gemini Connector:** Implemented `GeminiSynthesisService.cs` using `Microsoft.SemanticKernel` (`1.81.0`) configured with `gemini-3.8-flash` and resilient heuristic fallback when offline or without API keys.
- [x] **Step 3.2 — Structured Prompt Execution:** Parse Gemini outputs into structured sections (`ELI5Summary`, `LicenseVerdict`, `MermaidDiagram`, `ArchitecturalSmells`, `OnboardingRunbook`) with automatic Mermaid syntax sanitization (`MermaidSanitizer.cs`).
- [x] **Step 3.3 — Markdown Dossier Compiler:** Implemented `MarkdownDossierBuilder.cs` strictly conforming to Section 9 template, uploading `PROJECT_KNOWLEDGE.md` via `IBlobStorageService`, and caching the markdown in `AuditDocument`.

### ⏳ Phase 4: Interactive Dashboard, Mermaid Canvas & Split-Screen Chat

- [x] **Step 4.1 — Telemetry Components (Completed in Phase 2):** SVG commit sparklines, release health badges, language distribution breakdown, hotspot table, secret alert banners, ecosystem dependency filtering (`TelemetryBentoGrid.tsx`, `DependenciesCard.tsx`, `HotspotTable.tsx`, `SparklineChart.tsx`), and quick-sample chips linking to lightweight user repos (`shenmareparas/Chess`, `expense_tracker`, etc.) in `DashboardClient.tsx`.
- [ ] **Step 4.2 — Shared Repository Cache & Freshness Validation Engine:**
  - **Common Repository Store:** Store audits at the shared repository level (`RepositoryId: {owner}_{repo}`) in Cosmos DB and memory rather than re-running the entire AST and Gemini pipeline for every user.
  - **User History / Bookmarks:** Track recent repos per user with lightweight links/buttons, enabling instant (<50ms) retrieval across sessions.
  - **Commit Staleness Detection:** Perform a fast lightweight commit head check (`GET /repos/{owner}/{repo}/commits/{branch}`) comparing the latest remote commit SHA against `AuditDocument.CommitSha`.
  - **Outdated Audit Notice & Re-Audit Flow:** If the repository has new commits, immediately display the cached dossier and telemetry with a prominent top notice banner (`⚠️ Outdated Audit: newer commits exist on main branch`) and an interactive **"🔄 Re-analyze Latest Commits"** action button (`forceRefresh: true`) that runs the complete pipeline on demand.
- [ ] **Step 4.3 — Interactive Mermaid Explorer:** Build client-side `MermaidViewer.tsx` with pan, zoom, and diagram copy/export controls.
- [ ] **Step 4.4 — Split-Screen Dossier & Grounded Chat:** Build `/audit/[id]/page.tsx` featuring the rendered `PROJECT_KNOWLEDGE.md` preview, one-click `.md` SAS download button, and real-time SSE streaming chat sidebar connected to `POST /api/chat/{id}/stream`.

### ⏳ Phase 5: Cloud Provisioning & Zero-Cost Azure Deployment

- [ ] **Step 5.1 — Azure Resource Provisioning:** Create Azure Cosmos DB (Free Tier enabled), Azure Blob Storage (`project-dossiers`), and Azure Container Apps environment.
- [ ] **Step 5.2 — CI/CD Pipelines:** Configure GitHub Actions workflows to deploy `backend/Dockerfile` to Azure Container Apps (scale-to-zero) and `frontend/` to Azure Static Web Apps.

---

## 7. Repository Directory Structure

```text
codelens-ai/
├── PROJECT_PLAN.md
├── backend/
│   ├── CodeLens.sln                              # .NET 10 Solution
│   ├── Dockerfile                                # Multi-stage .NET 10 container build
│   ├── tests/
│   │   └── CodeLens.Tests/                       # xUnit Test Suite (19 passing tests)
│   │       ├── OctokitTelemetryTests.cs
│   │       ├── RoslynAndPolyglotAnalyzerTests.cs
│   │       ├── SecretScannerTests.cs
│   │       └── UserRepositoryTests.cs
│   └── src/
│       ├── CodeLens.Core/
│       │   ├── Entities/
│       │   │   ├── UserDocument.cs
│       │   │   ├── AuditDocument.cs
│       │   │   └── ChatMessageDocument.cs
│       │   ├── DTOs/
│       │   │   ├── ApiDtos.cs
│       │   │   └── TelemetryDtos.cs              # Hotspot, SecretAlert, FileChurn, Sparkline
│       │   └── Interfaces/
│       │       ├── ICosmosRepository.cs
│       │       ├── IBlobStorageService.cs
│       │       ├── IGitHubTelemetryService.cs    # Phase 2
│       │       ├── ICodeAnalysisService.cs       # Phase 2
│       │       └── IGeminiSynthesisService.cs    # Phase 3
│       ├── CodeLens.Infrastructure/
│       │   ├── Auth/
│       │   │   └── AuthService.cs                # Hybrid Credentials + Google + Linking
│       │   ├── Data/
│       │   │   ├── CosmosRepository.cs
│       │   │   ├── InMemoryCosmosRepository.cs
│       │   │   ├── BlobStorageService.cs
│       │   │   └── InMemoryBlobStorageService.cs
│       │   ├── GitHub/
│       │   │   └── OctokitTelemetryService.cs    # Phase 2
│       │   ├── Analysis/
│       │   │   └── RoslynAndPolyglotAnalyzer.cs  # Phase 2
│       │   ├── Security/
│       │   │   └── RegexSecretScanner.cs         # Phase 2
│       │   └── AI/
│       │       ├── GeminiSynthesisService.cs     # Phase 3
│       │       └── MarkdownDossierBuilder.cs     # Phase 3
│       └── CodeLens.Api/
│           ├── Endpoints/
│           │   ├── AuthEndpoints.cs              # /register, /login, /google, /set-password, /users
│           │   ├── AuditEndpoints.cs             # /api/audits/analyze, /api/audits, /api/audits/{id}
│           │   └── ChatEndpoints.cs
│           ├── Program.cs                        # Port 5050, JWT, Scalar OpenAPI
│           └── appsettings.json
└── frontend/
    ├── package.json
    ├── bun.lock
    ├── .env.local
    └── src/
        ├── auth.ts                               # NextAuth v5 (Google + Credentials)
        ├── proxy.ts                              # Next.js 16 route protection proxy
        ├── app/
        │   ├── globals.css
        │   ├── layout.tsx
        │   ├── page.tsx
        │   ├── api/auth/[...nextauth]/route.ts
        │   ├── auth/signin/
        │   │   ├── page.tsx
        │   │   ├── SignInPage.tsx                # Tabbed Sign-In / Sign-Up
        │   │   ├── CredentialsForm.tsx           # Form state, validation & NextAuth
        │   │   ├── PasswordValidationComponents.tsx # Visibility toggles, strength meter, checklist
        │   │   ├── passwordUtils.ts              # Criteria scoring & evaluation rules
        │   │   └── SignInPage.module.css
        │   └── dashboard/
        │       ├── page.tsx                      # Server entrypoint with session check
        │       ├── DashboardClient.tsx           # Client dashboard orchestrator
        │       └── audit/[id]/page.tsx           # Phase 4 Split Workspace
        ├── components/
        │   ├── TelemetryBentoGrid.tsx            # Bento Grid telemetry presentation
        │   ├── SparklineChart.tsx                # SVG 8-week commit sparklines
        │   ├── HotspotTable.tsx                  # Complexity x Churn risk table
        │   ├── Providers.tsx                     # SessionProvider wrapper
        │   ├── MermaidExplorer.tsx               # Phase 4 Interactive diagram
        │   ├── DossierMarkdownViewer.tsx         # Phase 4 Markdown preview
        │   └── RepoChatSidebar.tsx               # Phase 4 Grounded copilot
        ├── lib/
        │   ├── api-client.ts                     # REST client + SSE stream reader
        │   └── auth-helpers.ts
        └── types/
            └── next-auth.d.ts
```

---

## 8. REST & Streaming API Contract

| HTTP Method | Route | Auth | Request Body | Response | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | `{ "name", "email", "password" }` | `{ "token": "jwt", "user": {...} }` | Creates email/password account & issues HS256 JWT |
| `POST` | `/api/auth/login` | Public | `{ "email", "password" }` | `{ "token": "jwt", "user": {...} }` | Verifies email/password & issues HS256 JWT |
| `POST` | `/api/auth/google` | Public | `{ "idToken": "string" }` | `{ "token": "jwt", "user": {...} }` | Validates Google token, auto-links matching email, & issues JWT |
| `POST` | `/api/auth/link-google` | Bearer JWT | `{ "idToken": "string" }` | `{ "user": {...} }` | Explicitly links a Google account to the current logged-in user |
| `POST` | `/api/audits/analyze` | Bearer JWT | `{ "repoUrl": "string" }` | `202 Accepted` + `AuditDto` | Runs Octokit + Roslyn + Gemini pipeline & saves dossier |
| `GET` | `/api/audits/{id}` | Bearer JWT | *None* | `200 OK` + `AuditDocument` | Fetches full telemetry, hotspots, Mermaid diagram, and dossier |
| `GET` | `/api/audits/{id}/download` | Bearer JWT | *None* | `{ "downloadUrl": "https://..." }` | Generates a 15-minute Azure Blob SAS URL for `PROJECT_KNOWLEDGE.md` |
| `POST` | `/api/chat/{id}/stream` | Bearer JWT | `{ "message": "string" }` | `text/event-stream` (SSE) | Streams grounded Gemini 3.8 Flash responses using the project dossier |

---

## 9. Standardized `PROJECT_KNOWLEDGE.md` Template

Every completed audit generates and stores this Markdown artifact:

```markdown
# Project Knowledge Dossier: {{Owner}}/{{RepoName}}
> Generated by CodeLens AI | Model: Gemini 3.8 Flash | Date: {{Timestamp}}

## 1. Explain Like I'm 5 (ELI5)
{{Eli5Summary}}

## 2. Repository Health & Operational Pulse
- **Default Branch:** `{{DefaultBranch}}`
- **Stars / Forks:** ⭐ {{Stars}} | 🍴 {{Forks}}
- **Release Cadence:** {{ReleaseStatus}} (Last release: {{DaysSinceRelease}} days ago)
- **8-Week Commit Trend:** `{{WeeklyCommitsArray}}`
- **License & Commercial Verdict:** {{LicenseName}} — {{LicenseVerdict}}
- **Language Distribution:** {{LanguageBreakdownList}}

## 3. System Architecture Diagram
\`\`\`mermaid
{{MermaidDiagramCode}}
\`\`\`

## 4. Complexity Heatmap (Top Bug Hotspots)
| File Path | Cyclomatic Complexity | Recent Commit Churn | Hotspot Risk Score |
| :--- | :--- | :--- | :--- |
{{HotspotTableRows}}

## 5. Dependency & Ecosystem Inventory
| Ecosystem | Package / Library | Version / Target |
| :--- | :--- | :--- |
{{DependencyTableRows}}

## 6. Dead Code & Unreferenced Candidates
{{DeadCodeBulletList}}

## 7. Security & Secret Exposure Surface
{{SecretScanBulletList}}

## 8. Architectural Anti-Patterns & Code Smells
{{GeminiCodeSmells}}

## 9. Developer Onboarding & First-Day Runbook
{{GeminiOnboardingRunbook}}
```

---

## 10. Zero-Dollar ($0/mo) Cloud Budget Allocation

| Component | Azure / Google Service | Selected Tier | Free Quota Included | Monthly Cost |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend Hosting** | Azure Static Web Apps | Free Plan | 100 GB bandwidth, Free SSL, Custom domain | **$0.00** |
| **Backend API Hosting** | Azure Container Apps | Consumption Plan | 180,000 vCPU-sec, 360,000 GiB-sec, 2M requests/mo | **$0.00** |
| **NoSQL Database** | Azure Cosmos DB | Lifetime Free Tier | 1,000 RU/s provisioned throughput, 25 GB storage | **$0.00** |
| **AI Inference** | Google AI Studio | Free Tier (`gemini-3.8-flash`) | 15 RPM / 1,500 Requests Per Day | **$0.00** |
| **Dossier Storage** | Azure Blob Storage | Standard LRS Hot | Text-only `.md` files (<100 KB per audit) | **~$0.00** |
| **Authentication** | Hybrid Credentials + Google OAuth 2.0 | Free Standard | Self-hosted PBKDF2 + Unlimited OAuth 2.0 flows | **$0.00** |

---

## 11. Local Development Quickstart

### 1. Run Backend (.NET 10 Minimal API)

```bash
cd backend
dotnet build CodeLens.sln
dotnet run --project src/CodeLens.Api
```

- **API Base URL:** `http://localhost:5000`
- **Scalar OpenAPI Explorer:** `http://localhost:5000/scalar/v1`

### 2. Run Frontend (Next.js 16 + Bun)

```bash
cd frontend
bun install
bun run dev
```

- **Web App URL:** `http://localhost:3000`
- **Sign-In / Sign-Up Page:** `http://localhost:3000/auth/signin`
