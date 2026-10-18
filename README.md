# CodeLens AI

> **AI-Powered Repository Intelligence, Architecture Auditor & Onboarding Copilot**  
> Ingests GitHub repositories, calculates deterministic telemetry and AST complexity heatmaps, and synthesizes architectural knowledge dossiers using **Google Gemini 3.8 Flash**.

---

## 🌟 Highlights & Capabilities

- 📊 **Commit Velocity & Sparklines:** Tracks commit cadence and repository activity over time via GitHub Octokit.
- 🔥 **Complexity Heatmaps:** Computes cyclomatic complexity and cross-references git churn to identify high-risk bug hotspots (automatically ignoring `.agents/` and configuration tooling).
- 📦 **Polyglot Dependency Intelligence:** Parses Bun (`bun.lock`), Node.js (`package.json`), Dart/Flutter (`pubspec.yaml`), .NET (`.csproj`), Python (`requirements.txt`), Go (`go.mod`), and Rust (`Cargo.toml`) with interactive real-time ecosystem filtering and search.
- 🌳 **Architecture Explorer & Touchpad Gestures:** Generates interactive Mermaid.js C4 and component dependency diagrams with trackpad pinch-to-zoom, two-finger pan, dynamic size-aware zoom limits, viewport pan clamping (preventing diagrams from escaping off-screen), a 1-click view reset button, and SVG export.
- 🧹 **Dead Code & Zombie Files:** Pinpoints unreferenced internal symbols and dormant legacy files.
- 🛡️ **Zero-Allocation Secret Scanner:** Scans for exposed API keys, private keys, `.pem`, and environment secrets using compiled .NET 10 `[GeneratedRegex]`, with smart filtering for benign `.env.example` templates.
- 🔐 **Hybrid Authentication:** Supports both standard email/password (PBKDF2 with HMAC-SHA512 + 100,000 iterations) and Google OAuth 2.0 with automatic account linking.
- ⚡ **Shared Repo Cache & 1-Click Re-Analysis:** Instantly retrieves previously analyzed repositories in `<50ms`. Automatically compares cached commit SHAs against the GitHub remote default branch to flag outdated audits with 1-click re-analysis (`forceRefresh: true`).
- 🖥️ **Unified All-in-One Dashboard:** Everything on the main dashboard — Telemetry Bento Grid, Architecture Diagram canvas, and Knowledge Dossier viewer.
- 🤖 **Context-Grounded Floating AI Drawer:** Slide-over AI copilot accessible from a floating bottom-right launcher button or top header, grounded strictly in the synthesized `PROJECT_KNOWLEDGE.md` dossier via real-time SSE streaming.
- 🌓 **Proper Light / Dark / System Theme:** Full 3-mode theme system (`System`, `Dark`, `Light`) with automatic OS preference detection, dynamic SVG diagram color shifting, and high-contrast form controls.
- ☁️ **Zero-Cost Azure Cloud Infrastructure:** Fully automated Infrastructure as Code via Azure Bicep (`infra/main.bicep`) featuring Cosmos DB Lifetime Free Tier (1,000 RU/s, 25 GB), Azure Container Apps with scale-to-zero billing, Azure Static Web Apps, and GitHub Actions CI/CD.

---

## 🏗️ Architecture & Technology Stack

```text
                              ┌────────────────────────────────────────┐
                              │     Next.js 16 (Bun / App Router)      │
                              │     Tailwind CSS / NextAuth v5         │
                              └──────────────────┬─────────────────────┘
                                                 │ HTTPS / Bearer JWT / SSE
                                                 ▼
                              ┌────────────────────────────────────────┐
                              │  ASP.NET Core .NET 10 Minimal Web API  │
                              │          Scalar OpenAPI Docs           │
                              └───────┬──────────────────────┬─────────┘
                                      │                      │
                   ┌──────────────────┴───────────────┐      │
                   ▼                                  ▼      ▼
    ┌─────────────────────────────┐    ┌─────────────────────────────┐
    │  Cosmos DB (Users / Audits) │    │  Azure Blob (Dossier .md)   │
    └─────────────────────────────┘    └─────────────────────────────┘
```

| Layer | Technologies | Details |
| :--- | :--- | :--- |
| **Frontend** | Next.js 16, Bun, TypeScript, NextAuth v5 | Light/Dark/System theme system, `src/proxy.ts` route protection |
| **Workspace UI** | Mermaid.js, React Markdown, Lucide Icons | Trackpad gestures, size-aware zoom, Markdown dossier viewer, AI chat drawer |
| **Backend** | .NET 10 (`net10.0`), C# 13, ASP.NET Core | Minimal APIs, Scalar OpenAPI, PBKDF2 cryptography, port 5050 |
| **Analysis** | Roslyn C# Compiler, Polyglot AST, Octokit | In-memory zipball parsing, complexity & hotspot calculation (ignoring `.agents/`), commit staleness |
| **AI Synthesis** | Microsoft Semantic Kernel (`1.81.0`), Gemini | Google AI Studio `gemini-3.8-flash` integration & fallback engine |
| **Data & Cloud** | Azure Cosmos DB, Azure Blob Storage | Fallback in-memory providers for local development; Bicep IaC for Azure |
| **DevOps & CI/CD** | GitHub Actions, Docker, Azure Bicep | Scale-to-zero ACA container deployment, GHCR images, SWA deployment |

---

## 📁 Repository Structure

```text
codelens-ai/
├── README.md                           # Project guide and quickstart
├── .github/
│   └── workflows/
│       ├── deploy-backend.yml          # GitHub Actions: .NET 10 build, test, Docker & ACA deploy
│       └── deploy-frontend.yml         # GitHub Actions: Bun Next.js 16 build & SWA deploy
├── infra/
│   ├── main.bicep                      # Zero-cost Azure Bicep template (ACA, SWA, Cosmos, Blob)
│   └── main.parameters.json            # Deployment parameter configurations
├── .agents/
│   ├── AGENTS.md                       # AI coding agent rules & guardrails
│   ├── PROJECT_CONTEXT.md              # Comprehensive architectural specification
│   ├── PROJECT_PLAN.md                 # Master project plan & feature specifications
│   └── skills/                         # Agent diagnostic skills (e.g. react-doctor)
├── frontend/                           # Next.js 16 App Router (Bun)
│   ├── src/
│   │   ├── auth.ts                     # NextAuth v5 configuration (Credentials + Google OAuth)
│   │   ├── proxy.ts                    # Next.js 16 proxy for route protection
│   │   ├── app/
│   │   │   ├── layout.tsx              # Root layout with Geist typography & hydration safety
│   │   │   ├── page.tsx                # Landing page
│   │   │   ├── globals.css             # Glassmorphism design system & token definitions
│   │   │   ├── auth/signin/            # Tabbed Sign-In / Create Account UI
│   │   │   └── dashboard/              # Protected dashboard & repository submission
│   │   │       ├── DashboardClient.tsx # Bento Grid telemetry presentation & sample chips
│   │   │       └── audit/[id]/         # Split-screen interactive workspace
│   │   │           └── AuditWorkspaceClient.tsx
│   │   ├── components/                 # Presentation & telemetry components
│   │   │   ├── DashboardHeader.tsx     # Top bar navigation & user profile
│   │   │   ├── ActiveAuditSection.tsx  # Active audit summary, stale banner & Bento container
│   │   │   ├── TelemetryBentoGrid.tsx  # Metrics Bento Grid layout
│   │   │   ├── DependenciesCard.tsx    # Ecosystem filter tabs (Bun, Pub, npm, NuGet, PyPI), search & badges
│   │   │   ├── HotspotTable.tsx        # Complexity x Churn risk table
│   │   │   ├── SparklineChart.tsx      # SVG 8-week commit sparklines
│   │   │   ├── MermaidViewer.tsx       # Client-side Mermaid diagram canvas with pan/zoom/copy
│   │   │   ├── DossierViewer.tsx       # Formatted Markdown dossier preview with SAS download
│   │   │   └── RepoChatSidebar.tsx     # Real-time SSE grounded repo copilot sidebar
│   │   └── lib/
│   │       ├── api-client.ts           # Typed API client + SSE stream reader
│   │       └── auth-helpers.ts         # Server-side authentication helpers
│   └── package.json
└── backend/                            # .NET 10 Solution
    ├── CodeLens.sln
    ├── Dockerfile                      # Multi-stage .NET 10 container image (port 5050)
    ├── tests/CodeLens.Tests/           # xUnit test suite (28 tests)
    └── src/
        ├── CodeLens.Core/              # Domain entities, DTOs, and interface contracts (IGeminiSynthesisService)
        ├── CodeLens.Infrastructure/    # Cosmos DB, Blob, Octokit, Roslyn analysis, Secret scanner, Gemini AI Engine
        └── CodeLens.Api/               # ASP.NET Core Minimal API (port 5050) & Scalar UI
```

---

## 🚀 Quickstart & Local Setup

### 1. Prerequisites

- **JavaScript / TypeScript:** [Bun](https://bun.sh) (`v1.2+`)
- **Backend SDK:** [.NET 10 SDK](https://dotnet.microsoft.com/download) (`10.0.x`)
- **GitHub Token (Optional):** Set `GITHUB_TOKEN` in your environment or `appsettings.Development.json` to increase API rate limits from 60/hr to 5,000/hr.

---

### 2. Backend Setup (.NET 10)

From the project root:

```bash
cd backend
dotnet restore CodeLens.sln
dotnet test CodeLens.sln               # Run all 28 xUnit tests
dotnet run --project src/CodeLens.Api
```

- **API Base:** `http://localhost:5050`
- **Interactive Scalar Docs:** `http://localhost:5050/scalar/v1`

> 💡 **Zero Setup Required:** If Azure connection strings or Gemini API keys are omitted, the backend automatically uses the built-in in-memory repository, blob services, and heuristic synthesis fallback so you can analyze repositories, inspect telemetry, and test chat immediately.

---

### 3. Frontend Setup (Next.js 16 + Bun)

In a separate terminal window:

```bash
cd frontend
bun install

# Configure environment variables
cp .env.example .env.local
```

Ensure `frontend/.env.local` contains:

```env
AUTH_SECRET=your-32-byte-secret-here
NEXTAUTH_SECRET=your-32-byte-secret-here
NEXT_PUBLIC_API_URL=http://localhost:5050
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Start the development server:

```bash
bun run dev
```

Visit [http://localhost:3000](http://localhost:3000) or open [http://localhost:3000/auth/signin](http://localhost:3000/auth/signin) to test the tabbed Sign-In, real-time password strength validation, and registration experience.

---

## ☁️ Cloud Deployment (Azure Zero-Cost Infrastructure)

CodeLens AI includes full Infrastructure as Code (IaC) via **Azure Bicep** in [`infra/main.bicep`](infra/main.bicep) configured for $0/month idle cost:

### 1. Deploy Infrastructure with Azure CLI

```bash
# Log in to Azure
az login

# Create resource group
az group create --name rg-codelens --location eastus

# Deploy Bicep template
az deployment group create \
  --resource-group rg-codelens \
  --template-file infra/main.bicep \
  --parameters infra/main.parameters.json
```

### 2. Automated GitHub Actions CI/CD

Pushing to `main` automatically triggers:
- [`.github/workflows/deploy-backend.yml`](.github/workflows/deploy-backend.yml): Runs all 29 xUnit tests, builds Docker container, publishes to GitHub Container Registry (`ghcr.io`), and deploys to Azure Container Apps.
- [`.github/workflows/deploy-frontend.yml`](.github/workflows/deploy-frontend.yml): Builds Next.js 16 with Bun and deploys to Azure Static Web Apps.

---

## 🧩 Implemented Core Capabilities

- [x] **Foundation & Infrastructure:** ASP.NET Core .NET 10 Minimal API, Next.js 16 App Router, Scalar OpenAPI UI, zero-warning build, 29 passing xUnit tests.
- [x] **Hybrid Authentication:** PBKDF2 Email/Password cryptography, Google OAuth 2.0 auto-linking, real-time criteria checks, dynamic strength meter, show/hide toggles, and dedicated auth page theme toggling.
- [x] **Deterministic Telemetry & Static Analysis:** Zero-disk in-memory zipball streaming, Octokit commit sparklines, Roslyn AST cyclomatic complexity, hotspot calculation (with `.agents/` exclusion), polyglot package parsing, compiled regex secret scanner (with `.env.example` filtering), and Telemetry Bento Grid.
- [x] **Gemini 3.8 Flash Dossier Synthesis:** Semantic Kernel connector, structured outputs (ELI5, License, Architecture Smells, Runbook), Mermaid diagram syntax sanitization, and standardized `PROJECT_KNOWLEDGE.md` compilation with Azure Blob SAS tokens.
- [x] **Unified Interactive Dashboard & Floating AI Drawer:** All-in-one home dashboard with tabs for Bento Grid, Mermaid Diagram, and Knowledge Dossier. Slide-over AI copilot drawer with streaming SSE responses. Trackpad gestures (pinch-to-zoom, two-finger pan) with dynamic diagram-aware zoom bounds.
- [x] **Light / Dark / System Theme:** Full 3-mode theme system (`System`, `Dark`, `Light`) with automatic OS preference detection, instant anti-flash pre-hydration script, dynamic SVG diagram color palette adaptation, and high-contrast form controls and typography.
- [x] **Zero-Cost Cloud Deployment & CI/CD:** Azure Container Apps scale-to-zero compute, Azure Static Web Apps, Cosmos DB Lifetime Free Tier, Azure Bicep IaC (`infra/main.bicep`), and automated GitHub Actions workflows.

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
