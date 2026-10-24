# CodeLens AI

> **AI-Powered Repository Intelligence, Architecture Auditor & Onboarding Copilot**  
> Ingests GitHub repositories, calculates deterministic telemetry and AST complexity heatmaps, and synthesizes architectural knowledge dossiers using **Google Gemini 3.8 Flash**.

---

## 🌟 Highlights & Capabilities

- 🌐 **GSAP-Powered Modern Landing Page:** Immersive product showcase at `/` built with official GSAP primitives (`useGSAP`, `ScrollTrigger`, `matchMedia` reduced-motion safety). Features an interactive macOS sandbox window with live demo repository switching across 4 polyglot repos, The Zero-Clone Engine architecture console, a uniform 3×2 bento capabilities grid, official Simple Icons vector brand logos, and a single-unit dimension comparison table.
- 🎯 **Centered Viewport Hero (Section 1):** Full-height `100dvh` centered viewport layout (`display: flex; justify-content: center; align-items: center`) providing optical balance beneath the fixed floating navbar, accompanied by live emerald pulse status, responsive headline typography, and a secondary smooth-scroll CTA (_See How It Works_).
- 🛸 **Floating Island Navigation & Silky Smooth Scrolling:** Centered, fixed floating pill navbar with glassmorphic backdrop blur (`backdrop-filter: blur(20px) saturate(190%)`), dynamic scroll elevation border glow, and unboxed navigation links. Primary navigation links (_Live Demo_, _Architecture_, _Capabilities_, _Ecosystems_, _Why CodeLens_) match the natural sequential flow of the page, accompanied by an unadorned Sign In action pill. Implements hardware-accelerated smooth section scrolling via `scroll-behavior: smooth` in `globals.css` and JavaScript `scrollIntoView({ behavior: "smooth" })`, locking seamlessly onto each full-screen section without title clipping.
- ⚡ **The Zero-Clone Engine Architecture (`IngestionPipelineSection.tsx`):** Anti-slop, developer-grade architecture presentation strictly adhering to `@design-taste-frontend`. Eliminates decorative index numbering (`01/02/03`), fake status dots, card drop shadows, top color accent bars, and flow arrows. Features bare vector SVG icons alongside real runtime engine specs (`System.IO.ZipArchive`, `Roslyn AST + Multi-Manifest`, `Complexity × ln(Churn + 1)`, `Gemini 3.8 Flash + SK`), tangible engine artifact chips (`<code>System.IO.ZipArchive</code>`, `<code>AST Symbol Manifest</code>`, etc.), and deterministic performance metric pills (`0 MB Disk Footprint`, `Sub-Second Traversal`, etc.) inside a flat console marked `data-ui="true"`.
- 📐 **Symmetrical 3×2 Capability Bento Grid:** Standardized single-column geometry across all 6 core capability cards—including Deterministic Cyclomatic Hotspots—eliminating awkward spans and maintaining visual harmony across dark and light themes.
- 📊 **Unified Comparison Table Reveal (`ComparisonSection.tsx`):** Dimension-by-dimension comparison table comparing legacy manual audits against CodeLens AI, designed to reveal smoothly as a single cohesive unit on scroll, eliminating disruptive line-by-line staggered entry.
- 📏 **Full-Screen Viewport Stages (`min-height: 100dvh`):** Every landing page section commands its own dedicated, vertically centered full-screen stage (`min-height: 100dvh; display: flex; flex-direction: column; justify-content: center;`) with `padding: 6rem 1.5rem 3.5rem` providing clear breathing room beneath the fixed floating navbar.
- 🎨 **Official CodeLens Brand Favicon & Visual Identity:** High-resolution SVG favicon (`/favicon.svg`) featuring an architectural amber-to-bronze gradient squircle (`#f59e0b` → `#b45309`) with internal border highlight, drop-shadow depth, and code lens crosshair glyph, crisp on both dark and light browser tabs and mobile bookmarks.
- 🌓 **Streamlined Icon-Only Theme Toggle & Floating Tooltip:** Seamless toggling between Dark (Moon) and Light (Sun) modes with `system` OS color scheme defaulting (`prefers-color-scheme`). Features a circular 36px icon-only button and an accessible floating glassmorphic tooltip with triangular pointer arrow indicating _"Switch to light mode"_ / _"Switch to dark mode"_.
- 🚫 **Resilient 404 Not Found Handling & Azure SWA Rewrites:** Dedicated, theme-aware 404 page at unknown paths featuring glassmorphic error card, contextual redirect to dashboard or home, browser back action, and quick navigation links, reinforced by Azure Static Web Apps `staticwebapp.config.json` navigation fallback.
- 🎨 **State-of-the-Art Typography & Aesthetics:** Curated Google Fonts typography stack featuring **Plus Jakarta Sans** for prominent headings, **Inter** for readable body content, and **JetBrains Mono** for AST metrics, code tokens, and file paths.
- 👤 **Modern Profile Avatar & Authenticated Header:** Dashboard header featuring user initials/avatar pill, user email, and an interactive danger-accented signout action with smooth transitions.
- 📊 **Commit Velocity, All-Time Chronological Activity Pulse:** Tracks all-time repository commit history grouped by month and year (or spaced lifetime intervals for older/newer repositories) via GitHub Octokit with dynamic X-axis labels, formatted date range hover cards (`X commits (MMM dd, yyyy - MMM dd, yyyy)`), and all-time lifetime totals.
- 🌐 **Enhanced Language Distribution:** Interactive distribution card with dual visualization modes—compact multi-segment progress bar with proportional rows in Bar mode, and an expanded two-column Donut + Legend layout in Circular mode.
- 🔥 **Complexity Heatmaps:** Computes cyclomatic complexity and cross-references git churn to identify high-risk bug hotspots (automatically ignoring `.agents/` and configuration tooling).
- 📦 **Polyglot Dependency Intelligence:** Parses Bun (`bun.lock`), Node.js (`package.json`), Dart/Flutter (`pubspec.yaml`), .NET (`.csproj`), Python (`requirements.txt`), Go (`go.mod`), and Rust (`Cargo.toml`) with interactive real-time ecosystem filtering and search.
- 🌳 **Auto-Healing Architecture Explorer & Touchpad Gestures:** Generates interactive Mermaid.js C4 and component dependency diagrams with trackpad pinch-to-zoom, two-finger pan, dynamic size-aware zoom limits, viewport pan clamping (preventing diagrams from escaping off-screen), a 1-click 100% view reset button, and SVG export. Features an auto-healing sanitization engine that rejoins split multi-line declarations, auto-balances unclosed delimiters, preserves complex shapes (Cylinders, Stadiums, Subroutines, Hexagons, Double Circles), suppresses raw parser error SVGs in the DOM (`suppressErrorRendering: true`), and falls back seamlessly to an auto-generated C4 model on unrecoverable syntax anomalies.
- 🧠 **Gemini 3.8 Flash Dynamic Low-Reasoning & Fail-Fast Resilience:** Enforces `ThinkingLevel: "low"` via `GeminiThinkingConfig` on Semantic Kernel to eliminate prolonged reasoning latency spikes (reducing wait times from 230s+ to sub-second / few seconds) during synthesis and copilot chat. Equipped with a 30-second fail-fast timeout and upstream `503 Service Unavailable` / `504 Gateway Timeout` detection to instantly transition to high-fidelity deterministic AST telemetry fallback without blocking users.
- 🧹 **Dead Code & Zombie Files:** Pinpoints unreferenced internal symbols and dormant legacy files.
- 🛡️ **Zero-Allocation Secret Scanner:** Scans for exposed API keys, private keys, `.pem`, and environment secrets using compiled .NET 10 `[GeneratedRegex]`, with smart filtering for benign `.env.example` templates.
- 🔐 **Secure Password Authentication:** Built-in email/password credentials with PBKDF2 (HMAC-SHA512 + 100,000 iterations), strict password strength verification, and signed HS256 JWT sessions.
- ⚡ **Shared Repo Cache & 1-Click Re-Analysis:** Instantly retrieves previously analyzed repositories in `<50ms`. Automatically compares cached commit SHAs against the GitHub remote default branch to flag outdated audits with 1-click re-analysis (`forceRefresh: true`).
- 🖥️ **Unified All-in-One Dashboard:** High-contrast Bento Grid telemetry cards, interactive repository selector with quick sample chips, Architecture Diagram canvas, and Knowledge Dossier viewer.
- 🤖 **Context-Grounded Floating AI Drawer & Live Quota Countdown:** Slide-over AI copilot accessible from a floating bottom-right launcher button or top header, grounded strictly in the synthesized `PROJECT_KNOWLEDGE.md` dossier via real-time SSE streaming. Features prominent top-of-chat rate-limit alerts with a live countdown timer (`Resets in MM:SS` or `Hh MMm`), dynamic `retryDelay` propagation from Google Gemini, instantaneous auto-dismiss upon timer completion, and seamless fallback to the local AST-grounded engine when Gemini Free Tier quota is reached.
- ☁️ **Zero-Cost Azure Cloud Infrastructure:** Fully automated Infrastructure as Code via Azure Bicep (`infra/main.bicep`) featuring Cosmos DB Lifetime Free Tier (1,000 RU/s, 25 GB), Azure Container Apps with scale-to-zero billing, Azure Static Web Apps, and GitHub Actions CI/CD.
- 🩺 **Zero-Warning Diagnostics & Lint Policy:** Strict ESLint 9 Flat Config (`@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`) and .NET 10 compiler enforcement ensuring 0 errors and 0 warnings across both frontend and backend.

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

| Layer                  | Technologies                                        | Details                                                                                             |
| :--------------------- | :-------------------------------------------------- | :-------------------------------------------------------------------------------------------------- |
| **Frontend**           | React 19, Vite, Bun, TypeScript, React Router       | Ultra-fast client-side SPA, Light/Dark/System theme system, client JWT auth, dedicated 404 page     |
| **Animation & Motion** | GSAP (`gsap@^3.15.0`), `@gsap/react`, ScrollTrigger | Master entrance timeline, `ScrollTrigger.batch` reveals, `matchMedia` accessibility                 |
| **Workspace UI**       | Mermaid.js, React Markdown, Lucide Icons            | Trackpad gestures, size-aware zoom, Markdown dossier viewer, AI chat drawer                         |
| **Backend**            | .NET 10 (`net10.0`), C# 13, ASP.NET Core            | Minimal APIs, Scalar OpenAPI, PBKDF2 cryptography, port 5050                                        |
| **Analysis**           | Roslyn C# Compiler, Polyglot AST, Octokit           | In-memory zipball parsing, complexity & hotspot calculation (ignoring `.agents/`), commit staleness |
| **AI Synthesis**       | Microsoft Semantic Kernel (`1.81.0`), Gemini        | Google AI Studio `gemini-3.8-flash` integration & fallback engine                                   |
| **Data & Cloud**       | Azure Cosmos DB, Azure Blob Storage                 | Fallback in-memory providers for local development; Bicep IaC for Azure                             |
| **DevOps & CI/CD**     | GitHub Actions, Docker, Azure Bicep                 | Scale-to-zero ACA container deployment, GHCR images, SWA deployment                                 |

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
│       ├── vercel-react-best-practices/# Vercel React & Next.js performance optimization skill
│       └── gsap-*                      # Official GSAP AI skills (core, react, timeline, scrolltrigger, etc.)
├── frontend/                           # React 19 SPA (Vite + Bun)
│   ├── index.html                      # SPA entry point with anti-flash script & favicon link
│   ├── vite.config.ts                  # Vite ESM configuration (`import.meta.dirname`) & path aliases
│   ├── eslint.config.mjs               # ESLint 9 Flat Config (React 19 + TypeScript + React Hooks)
│   ├── staticwebapp.config.json        # Azure SWA client routing rewrite rules
│   ├── public/
│   │   ├── favicon.svg                 # Official CodeLens AI gradient brand squircle favicon
│   │   └── staticwebapp.config.json    # Azure SWA navigation fallback deployed to dist/
│   ├── src/
│   │   ├── main.tsx                    # Root React DOM entrypoint
│   │   ├── App.tsx                     # React Router routes, ProtectedRoute & NotFoundPage catch-all (code-split)
│   │   ├── context/
│   │   │   ├── AuthContext.tsx         # Client JWT authentication provider with memoized callbacks
│   │   │   └── ThemeContext.tsx        # Pure Light/Dark/System theme provider with system default & instant toggle
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
│   │   │   ├── landing/                # GSAP modular landing page sections
│   │   │   │   ├── HeroSection.tsx     # Hero introduction, stats ribbon & CTAs
│   │   │   │   ├── HeroPreviewTabs.tsx # Interactive macOS sandbox window (#preview) with demo repo controls & 4 tabs
│   │   │   │   ├── IngestionPipelineSection.tsx # The Zero-Clone Engine 4-phase architecture console (#pipeline)
│   │   │   │   ├── BentoFeaturesSection.tsx # 3x2 uniform bento capabilities grid (#features)
│   │   │   │   ├── EcosystemSection.tsx# Polyglot manifest intelligence & official Simple Icons (#ecosystem)
│   │   │   │   ├── ComparisonSection.tsx # Dimension comparison table with single-unit reveal (#comparison)
│   │   │   │   └── CtaBannerSection.tsx# Conversion CTA banner & community links
│   │   │   ├── BrandLogo.tsx           # Reusable SVG brand mark component
│   │   │   ├── ThemeToggle.tsx         # Icon-only circular theme toggle with floating accessible tooltip
│   │   │   ├── ThemeToggle.module.css  # Animated theme toggle & glassmorphic tooltip styles
│   │   │   ├── DashboardClient.tsx     # Unified Dashboard (Bento Grid, Dossier & Diagram tabs)
│   │   │   ├── DashboardHeader.tsx     # Top bar navigation, user profile avatar pill & danger signout button
│   │   │   ├── DashboardHeader.module.css # Header layout, avatar & signout styles
│   │   │   ├── ActiveAuditSection.tsx  # Active audit summary, stale banner, lazy-loaded Mermaid & Dossier
│   │   │   ├── AnalysisProgressBar.tsx # Multi-stage animated pipeline progress bar with shimmer & step indicators
│   │   │   ├── analysisSteps.ts        # 6-step analysis stage metadata, icons, and descriptions
│   │   │   ├── TelemetryBentoGrid.tsx  # Metrics Bento Grid layout
│   │   │   ├── DependenciesCard.tsx    # Ecosystem filter tabs (Bun, Pub, npm, NuGet, PyPI), search & badges
│   │   │   ├── LanguageDistributionCard.tsx # Dual-mode Bar/Circular language telemetry with dominant stack banner
│   │   │   ├── HotspotTable.tsx        # Complexity x Churn risk table (memoized sorting & filter)
│   │   │   ├── SparklineChart.tsx      # SVG 8-week commit sparklines with all-time total commits pill
│   │   │   ├── MermaidViewer.tsx       # Client-side Mermaid diagram canvas with pan/zoom/copy, 100% reset & a11y region
│   │   │   ├── FullscreenMermaidModal.tsx # Immersive fullscreen diagram viewer with touch & pan clamping
│   │   │   ├── InlineMermaidBlock.tsx  # Flow diagram renderer for AI chat markdown responses
│   │   │   ├── ThinkingLines.tsx       # Claude-style multi-line animated thinking shimmer state
│   │   │   ├── DossierViewer.tsx       # Formatted Markdown dossier preview with SAS download
│   │   │   └── RepoChatSidebar.tsx     # Real-time SSE grounded repo copilot with rate-limit countdown banner & clear chat
│   │   ├── styles/
│   │   │   └── globals.css             # Glassmorphism design system & token definitions (Plus Jakarta Sans, Inter, JetBrains Mono)
│   │   └── lib/
│   │       ├── api-client.ts           # Typed API client (sanitized API_BASE) + SSE stream & chat history endpoints
│   │       └── mermaidUtils.ts         # Client-side Mermaid syntax normalizer & label quoting
│   └── package.json
└── backend/                            # .NET 10 Solution
    ├── CodeLens.sln
    ├── Dockerfile                      # Multi-stage .NET 10 container image (port 5050)
    ├── tests/CodeLens.Tests/           # xUnit test suite (31 tests)
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
dotnet test CodeLens.sln               # Run all 34 xUnit tests
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

- [`.github/workflows/deploy-backend.yml`](.github/workflows/deploy-backend.yml): Runs all 34 xUnit tests, builds Docker container, publishes to GitHub Container Registry (`ghcr.io`), and deploys to Azure Container Apps.
- [`.github/workflows/deploy-frontend.yml`](.github/workflows/deploy-frontend.yml): Builds Vite React SPA with Bun and deploys static artifacts directly to Azure Static Web Apps edge CDN.

---

## 🧩 Implemented Core Capabilities

- [x] **Foundation & Infrastructure:** ASP.NET Core .NET 10 Minimal API, React 19 Vite SPA, Scalar OpenAPI UI, zero-warning build, 34 passing xUnit tests.
- [x] **Secure Password Authentication:** PBKDF2 Email/Password cryptography, real-time criteria checks, dynamic strength meter, show/hide toggles, and dedicated auth page theme toggling.
- [x] **Deterministic Telemetry & Static Analysis:** Zero-disk in-memory zipball streaming, Octokit commit sparklines, Roslyn AST cyclomatic complexity, hotspot calculation (with `.agents/` exclusion), polyglot package parsing, compiled regex secret scanner (with `.env.example` filtering), and Telemetry Bento Grid.
- [x] **Gemini 3.8 Flash Dossier Synthesis:** Semantic Kernel connector, structured outputs (ELI5, License, Architecture Smells, Runbook), Mermaid diagram syntax sanitization, and standardized `PROJECT_KNOWLEDGE.md` compilation with Azure Blob SAS tokens.
- [x] **Unified Interactive Dashboard & Floating AI Drawer:** All-in-one home dashboard with tabs for Bento Grid, Mermaid Diagram, and Knowledge Dossier. Slide-over AI copilot drawer with streaming SSE responses. Trackpad gestures (pinch-to-zoom, two-finger pan) with dynamic diagram-aware zoom bounds.
- [x] **Light / Dark / System Theme:** Full 3-mode theme system (`System`, `Dark`, `Light`) with automatic OS preference detection, instant anti-flash pre-hydration script, dynamic SVG diagram color palette adaptation, and high-contrast form controls and typography.
- [x] **Zero-Cost Cloud Deployment & CI/CD:** Azure Container Apps scale-to-zero compute, Azure Static Web Apps, Cosmos DB Lifetime Free Tier, Azure Bicep IaC (`infra/main.bicep`), and automated GitHub Actions workflows.

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
