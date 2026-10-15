# CodeLens AI

> **AI-Powered Repository Intelligence, Architecture Auditor & Onboarding Copilot**  
> Ingests GitHub repositories, calculates deterministic telemetry and AST complexity heatmaps, and synthesizes architectural knowledge dossiers using **Google Gemini 3.8 Flash**.

---

## 🌟 Highlights & Capabilities

- 📊 **Commit Velocity & Sparklines:** Tracks commit cadence and repository activity over time via GitHub Octokit.
- 🔥 **Complexity Heatmaps:** Computes cyclomatic complexity and cross-references git churn to identify high-risk bug hotspots.
- 📦 **Polyglot Dependency Intelligence:** Parses Bun (`bun.lock`), Node.js (`package.json`), Dart/Flutter (`pubspec.yaml`), .NET (`.csproj`), Python (`requirements.txt`), Go (`go.mod`), and Rust (`Cargo.toml`) with interactive real-time ecosystem filtering.
- 🌳 **Architecture Explorer:** Generates interactive Mermaid.js C4 and component dependency diagrams.
- 🧹 **Dead Code & Zombie Files:** Pinpoints unreferenced internal symbols and dormant legacy files.
- 🛡️ **Zero-Allocation Secret Scanner:** Scans for exposed API keys, private keys, `.pem`, and environment secrets using compiled .NET 10 `[GeneratedRegex]`.
- 🔐 **Hybrid Authentication:** Supports both standard email/password (PBKDF2 with HMAC-SHA512 + 100,000 iterations) and Google OAuth 2.0 with automatic account linking.
- 🤖 **Grounded Contextual Chat:** Real-time Server-Sent Events (SSE) chat copilot answering codebase questions grounded in a synthesized `PROJECT_KNOWLEDGE.md` dossier.

---

## 🏗️ Architecture & Technology Stack

```
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
| **Frontend** | Next.js 16, Bun, TypeScript, NextAuth v5 | Dark glassmorphism token design system, `src/proxy.ts` route protection |
| **Backend** | .NET 10 (`net10.0`), C# 13, ASP.NET Core | Minimal APIs, Scalar OpenAPI, PBKDF2 cryptography |
| **Analysis** | Roslyn C# Compiler, Polyglot AST, Octokit | In-memory zipball parsing, complexity & hotspot calculation |
| **AI Synthesis** | Microsoft Semantic Kernel (`1.81.0`), Gemini | Google AI Studio `gemini-3.8-flash` integration |
| **Data & Cloud** | Azure Cosmos DB, Azure Blob Storage | Fallback in-memory providers included for local development |

---

## 📁 Repository Structure

```text
codelens-ai/
├── PROJECT_PLAN.md                     # Comprehensive architecture and milestone roadmap
├── PROJECT_CONTEXT.md                  # Comprehensive architectural single-source-of-truth
├── README.md                           # Project guide and quickstart
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
│   │   ├── components/                 # Presentation & telemetry components
│   │   │   ├── TelemetryBentoGrid.tsx  # Metrics Bento Grid layout
│   │   │   ├── DependenciesCard.tsx    # Ecosystem filter tabs (Bun, Pub, npm, NuGet, PyPI), search & badges
│   │   │   ├── HotspotTable.tsx        # Complexity x Churn risk table
│   │   │   └── SparklineChart.tsx      # SVG 8-week commit sparklines
│   │   └── lib/
│   │       ├── api-client.ts           # Typed API client + SSE stream reader
│   │       └── auth-helpers.ts         # Server-side authentication helpers
│   └── package.json
└── backend/                            # .NET 10 Solution
    ├── CodeLens.sln
    ├── tests/CodeLens.Tests/           # xUnit test suite (19 tests)
    └── src/
        ├── CodeLens.Core/              # Domain entities, DTOs, and interface contracts
        ├── CodeLens.Infrastructure/    # Cosmos DB, Blob, Octokit, Roslyn analysis, Secret scanner
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
dotnet test CodeLens.sln               # Run all 19 xUnit tests
dotnet run --project src/CodeLens.Api
```

- **API Base:** `http://localhost:5050`
- **Interactive Scalar Docs:** `http://localhost:5050/scalar/v1`

> 💡 **Zero Setup Required:** If Azure connection strings are omitted, the backend automatically uses the built-in in-memory repository and blob services so you can register, log in, and test immediately.

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

## 🛣️ Roadmap

- [x] **Phase 1: Foundation & Infrastructure** (.NET 10 Minimal API, Next.js 16, Scalar OpenAPI, zero-warning build)
- [x] **Phase 1.5: Hybrid Authentication** (PBKDF2 Email/Password + Google OAuth 2.0 Auto-Linking + Real-Time Criteria Checks)
- [x] **Phase 2: Deterministic Telemetry & Code Analysis** (In-memory zipball stream, Octokit commit sparklines, Roslyn AST complexity, compiled secret scanner, Telemetry Bento Grid)
- [ ] **Phase 3: Gemini 3.8 Flash Synthesis** (ELI5 summary, Mermaid architecture diagrams, `PROJECT_KNOWLEDGE.md` dossier generator)
- [ ] **Phase 4: Interactive Dashboard & SSE Copilot** (Mermaid pan/zoom canvas, split-screen dossier preview, streaming chat)
- [ ] **Phase 5: Cloud Deployment** (Azure Container Apps scale-to-zero, Azure Static Web Apps, Cosmos DB Free Tier)

---

## 📜 License

This project is licensed under the MIT License.
