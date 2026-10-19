# CodeLens AI

> **AI-Powered Repository Intelligence, Architecture Auditor & Onboarding Copilot**  
> Ingests GitHub repositories, calculates deterministic telemetry and AST complexity heatmaps, and synthesizes architectural knowledge dossiers using **Google Gemini 3.8 Flash**.

---

## 🌟 Highlights & Capabilities

- 🌐 **Modern Landing Page & Seamless Onboarding:** Immersive glassmorphic product showcase at `/` introducing features, telemetry capabilities, and architecture highlights, seamlessly routing through authentication to the protected workspace.
- 🚫 **Resilient 404 Not Found Handling & Azure SWA Rewrites:** Dedicated, theme-aware 404 page at unknown paths featuring glassmorphic error card, contextual redirect to dashboard or home, browser back action, and quick navigation links, reinforced by Azure Static Web Apps `staticwebapp.config.json` navigation fallback.
- 🎨 **State-of-the-Art Typography & Aesthetics:** Curated Google Fonts typography stack featuring **Plus Jakarta Sans** for prominent headings, **Inter** for readable body content, and **JetBrains Mono** for AST metrics, code tokens, and file paths.
- 🌓 **Proper Light / Dark / System Theme & Glassmorphic Switcher:** Unified 3-mode theme system (`System`, `Dark`, `Light`) with automatic OS preference detection, dynamic SVG diagram color shifting, high-contrast form controls, and an animated glassmorphic quick-switch control.
- 👤 **Modern Profile Avatar & Authenticated Header:** Dashboard header featuring user initials/avatar pill, user email, and an interactive danger-accented signout action with smooth transitions.
- ⚡ **Vercel Best Practices & Route-Level Code Splitting:** `React.lazy()` and `<Suspense>` boundaries split heavy diagram renderers (`MermaidViewer` ~92 kB, `DossierViewer` ~159 kB) and route pages, reducing initial bundle weight from ~644 kB to ~265 kB. Pure state updaters, hoisted regular expressions, and abort-controller SSE cleanups prevent memory leaks and unnecessary rerenders.
- 📊 **Commit Velocity & Sparklines:** Tracks commit cadence and repository activity over time via GitHub Octokit.
- 🔥 **Complexity Heatmaps:** Computes cyclomatic complexity and cross-references git churn to identify high-risk bug hotspots (automatically ignoring `.agents/` and configuration tooling).
- 📦 **Polyglot Dependency Intelligence:** Parses Bun (`bun.lock`), Node.js (`package.json`), Dart/Flutter (`pubspec.yaml`), .NET (`.csproj`), Python (`requirements.txt`), Go (`go.mod`), and Rust (`Cargo.toml`) with interactive real-time ecosystem filtering and search.
- 🌳 **Architecture Explorer & Touchpad Gestures:** Generates interactive Mermaid.js C4 and component dependency diagrams with trackpad pinch-to-zoom, two-finger pan, dynamic size-aware zoom limits, viewport pan clamping (preventing diagrams from escaping off-screen), a 1-click view reset button, and SVG export.
- 🧹 **Dead Code & Zombie Files:** Pinpoints unreferenced internal symbols and dormant legacy files.
- 🛡️ **Zero-Allocation Secret Scanner:** Scans for exposed API keys, private keys, `.pem`, and environment secrets using compiled .NET 10 `[GeneratedRegex]`, with smart filtering for benign `.env.example` templates.
- 🔐 **Secure Password Authentication:** Built-in email/password credentials with PBKDF2 (HMAC-SHA512 + 100,000 iterations), strict password strength verification, and signed HS256 JWT sessions.
- ⚡ **Shared Repo Cache & 1-Click Re-Analysis:** Instantly retrieves previously analyzed repositories in `<50ms`. Automatically compares cached commit SHAs against the GitHub remote default branch to flag outdated audits with 1-click re-analysis (`forceRefresh: true`).
- 🖥️ **Unified All-in-One Dashboard:** High-contrast Bento Grid telemetry cards, interactive repository selector with quick sample chips, Architecture Diagram canvas, and Knowledge Dossier viewer.
- 🤖 **Context-Grounded Floating AI Drawer:** Slide-over AI copilot accessible from a floating bottom-right launcher button or top header, grounded strictly in the synthesized `PROJECT_KNOWLEDGE.md` dossier via real-time SSE streaming.
- 🌓 **Proper Light / Dark / System Theme:** Full 3-mode theme system (`System`, `Dark`, `Light`) with automatic OS preference detection, dynamic SVG diagram color shifting, and high-contrast form controls.
- ☁️ **Zero-Cost Azure Cloud Infrastructure:** Fully automated Infrastructure as Code via Azure Bicep (`infra/main.bicep`) featuring Cosmos DB Lifetime Free Tier (1,000 RU/s, 25 GB), Azure Container Apps with scale-to-zero billing, Azure Static Web Apps, and GitHub Actions CI/CD.

---

## 🏗️ Architecture & Technology Stack

```text
                              ┌────────────────────────────────────────┐
                              │    React 19 SPA (Vite / Bun Runtime)   │
                              │    React Router / Tailwind CSS         │
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
| **Frontend** | React 19, Vite, Bun, TypeScript, React Router | Ultra-fast client-side SPA, Light/Dark/System theme system, client JWT auth, dedicated 404 page |
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
│       └── deploy-frontend.yml         # GitHub Actions: Bun Vite React build & SWA deploy
├── infra/
│   ├── main.bicep                      # Zero-cost Azure Bicep template (ACA, SWA, Cosmos, Blob)
│   └── main.parameters.json            # Deployment parameter configurations
├── .agents/
│   ├── AGENTS.md                       # AI coding agent rules & guardrails
│   ├── PROJECT_CONTEXT.md              # Comprehensive architectural specification
│   └── skills/                         # Agent engineering & quality skills
│       ├── react-doctor/               # React architecture, lint & bundle diagnostics skill
│       └── vercel-react-best-practices/# Vercel React & Next.js performance optimization skill
├── frontend/                           # React 19 SPA (Vite + Bun)
│   ├── index.html                      # SPA entry point with anti-flash script
│   ├── vite.config.ts                  # Vite ESM configuration (`import.meta.dirname`) & path aliases
│   ├── staticwebapp.config.json        # Azure SWA client routing rewrite rules
│   ├── public/
│   │   └── staticwebapp.config.json    # Azure SWA navigation fallback deployed to dist/
│   ├── src/
│   │   ├── main.tsx                    # Root React DOM entrypoint
│   │   ├── App.tsx                     # React Router routes, ProtectedRoute & NotFoundPage catch-all (code-split)
│   │   ├── context/
│   │   │   ├── AuthContext.tsx         # Client JWT authentication provider
│   │   │   └── ThemeContext.tsx        # Pure Light/Dark/System theme provider with memoized context
│   │   ├── pages/
│   │   │   ├── HomePage.tsx            # Modern Product Landing Page with hero, features & CTA
│   │   │   ├── HomePage.module.css     # Glassmorphic landing styles & animations
│   │   │   ├── SignInPage.tsx          # Tabbed Sign-In / Create Account UI with back-to-home
│   │   │   ├── CredentialsForm.tsx     # Form state, validation & submission logic
│   │   │   ├── PasswordValidationComponents.tsx  # Eye toggles, strength meter, checklist badges
│   │   │   ├── passwordUtils.ts        # Pure scoring rules & validation helpers (hoisted regexes)
│   │   │   ├── NotFoundPage.tsx        # Glassmorphic 404 error page with action shortcuts
│   │   │   ├── NotFoundPage.module.css # 404 styles, badges, and layout
│   │   │   └── DashboardPage.tsx       # Protected dashboard page
│   │   ├── components/                 # Presentation & telemetry components
│   │   │   ├── BrandLogo.tsx           # Reusable SVG brand mark component
│   │   │   ├── ThemeToggle.tsx         # Glassmorphic 3-mode theme toggle button
│   │   │   ├── ThemeToggle.module.css  # Animated theme toggle styles
│   │   │   ├── DashboardClient.tsx     # Unified Dashboard (Bento Grid, Dossier & Diagram tabs)
│   │   │   ├── DashboardHeader.tsx     # Top bar navigation, user profile avatar pill & danger signout button
│   │   │   ├── DashboardHeader.module.css # Header layout, avatar & signout styles
│   │   │   ├── ActiveAuditSection.tsx  # Active audit summary, stale banner, lazy-loaded Mermaid & Dossier
│   │   │   ├── AnalysisProgressBar.tsx # Multi-stage animated pipeline progress bar with shimmer & step indicators
│   │   │   ├── analysisSteps.ts        # 6-step analysis stage metadata, icons, and descriptions
│   │   │   ├── TelemetryBentoGrid.tsx  # Metrics Bento Grid layout
│   │   │   ├── DependenciesCard.tsx    # Ecosystem filter tabs (Bun, Pub, npm, NuGet, PyPI), search & badges
│   │   │   ├── HotspotTable.tsx        # Complexity x Churn risk table (memoized sorting & filter)
│   │   │   ├── SparklineChart.tsx      # SVG 8-week commit sparklines
│   │   │   ├── MermaidViewer.tsx       # Client-side Mermaid diagram canvas with pan/zoom/copy & a11y region
│   │   │   ├── InlineMermaidBlock.tsx  # Flow diagram renderer for AI chat markdown responses
│   │   │   ├── ThinkingLines.tsx       # Claude-style multi-line animated thinking shimmer state
│   │   │   ├── DossierViewer.tsx       # Formatted Markdown dossier preview with SAS download
│   │   │   └── RepoChatSidebar.tsx     # Real-time SSE grounded repo copilot with markdown formatting & clear chat
│   │   ├── styles/
│   │   │   └── globals.css             # Glassmorphism design system & token definitions (Plus Jakarta Sans, Inter, JetBrains Mono)
│   │   └── lib/
│   │       ├── api-client.ts           # Typed API client (sanitized API_BASE) + SSE stream & chat history endpoints
│   │       └── mermaidUtils.ts         # Client-side Mermaid syntax normalizer & label quoting
│   └── package.json
└── backend/                            # .NET 10 Solution
    ├── CodeLens.sln
    ├── Dockerfile                      # Multi-stage .NET 10 container image (port 5050)
    ├── tests/CodeLens.Tests/           # xUnit test suite (30 tests)
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
- **Gemini API Key (Optional):** Set `GEMINI_API_KEY` or `Gemini:ApiKey` in `appsettings.Development.json` to enable Gemini 3.8 Flash synthesis and AI chat.

---

### 2. Backend Setup (.NET 10)

From the project root:

```bash
cd backend
dotnet restore CodeLens.sln
dotnet test CodeLens.sln               # Run all 30 xUnit tests
dotnet run --project src/CodeLens.Api
```

- **API Base:** `http://localhost:5050`
- **Interactive Scalar Docs:** `http://localhost:5050/scalar/v1`

> 💡 **Zero Setup Required:** If Azure connection strings or Gemini API keys are omitted, the backend automatically uses the built-in in-memory repository, blob services, and heuristic synthesis fallback so you can analyze repositories, inspect telemetry, and test chat immediately.

---

### 3. Frontend Setup (React 19 + Vite + Bun)

In a separate terminal window:

```bash
cd frontend
bun install

# Configure environment variables
cp .env.example .env.local
```

Ensure `frontend/.env.local` contains:

```env
VITE_API_URL=http://localhost:5050
VITE_APP_URL=http://localhost:5173
```

Start the development server:

```bash
bun run dev
```

Visit [http://localhost:5173](http://localhost:5173) to view the interactive Product Landing Page, or open [http://localhost:5173/auth/signin](http://localhost:5173/auth/signin) to test the tabbed Sign-In, real-time password strength validation, and registration experience.

---

## ☁️ Cloud Deployment (Azure Zero-Cost Infrastructure)

CodeLens AI includes full Infrastructure as Code (IaC) via **Azure Bicep** in [`infra/main.bicep`](infra/main.bicep) configured for $0/month idle cost:

### 1. Deploy Infrastructure with Azure CLI

```bash
# Log in to Azure
az login

# Create resource group in Central India (or preferred region)
az group create --name rg-codelens-prod --location centralindia

# Deploy Bicep template
az deployment group create \
  --resource-group rg-codelens-prod \
  --template-file infra/main.bicep \
  --parameters location=centralindia
```

### 2. Automated GitHub Actions CI/CD

Pushing to `main` automatically triggers:

- [`.github/workflows/deploy-backend.yml`](.github/workflows/deploy-backend.yml): Runs all 30 xUnit tests, builds Docker container, publishes to GitHub Container Registry (`ghcr.io`), and deploys to Azure Container Apps.
- [`.github/workflows/deploy-frontend.yml`](.github/workflows/deploy-frontend.yml): Builds Vite React SPA with Bun and deploys static artifacts directly to Azure Static Web Apps edge CDN.

---

## 🧩 Implemented Core Capabilities

- [x] **Foundation & Infrastructure:** ASP.NET Core .NET 10 Minimal API, React 19 Vite SPA, Scalar OpenAPI UI, zero-warning build, 30 passing xUnit tests.
- [x] **Secure Password Authentication:** PBKDF2 Email/Password cryptography, real-time criteria checks, dynamic strength meter, show/hide toggles, and dedicated auth page theme toggling.
- [x] **Deterministic Telemetry & Static Analysis:** Zero-disk in-memory zipball streaming, Octokit commit sparklines, Roslyn AST cyclomatic complexity, hotspot calculation (with `.agents/` exclusion), polyglot package parsing, compiled regex secret scanner (with `.env.example` filtering), and Telemetry Bento Grid.
- [x] **Gemini 3.8 Flash Dossier Synthesis:** Semantic Kernel connector, structured outputs (ELI5, License, Architecture Smells, Runbook), Mermaid diagram syntax sanitization, and standardized `PROJECT_KNOWLEDGE.md` compilation with Azure Blob SAS tokens.
- [x] **Unified Interactive Dashboard & Floating AI Drawer:** All-in-one home dashboard with tabs for Bento Grid, Mermaid Diagram, and Knowledge Dossier. Slide-over AI copilot drawer with streaming SSE responses. Trackpad gestures (pinch-to-zoom, two-finger pan) with dynamic diagram-aware zoom bounds.
- [x] **Light / Dark / System Theme:** Full 3-mode theme system (`System`, `Dark`, `Light`) with automatic OS preference detection, instant anti-flash pre-hydration script, dynamic SVG diagram color palette adaptation, and high-contrast form controls and typography.
- [x] **Zero-Cost Cloud Deployment & CI/CD:** Azure Container Apps scale-to-zero compute, Azure Static Web Apps, Cosmos DB Lifetime Free Tier, Azure Bicep IaC (`infra/main.bicep`), and automated GitHub Actions workflows.

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
