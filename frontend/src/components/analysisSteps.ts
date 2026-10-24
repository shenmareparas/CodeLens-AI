export interface AnalysisStep {
  id: string;
  label: string;
  detail: string;
  icon: string;
}

export const ANALYSIS_STEPS: readonly AnalysisStep[] = [
  {
    id: "cache",
    label: "Checking Shared Cache",
    detail: "Querying Cosmos DB for existing intelligence & commit SHAs...",
    icon: "⚡",
  },
  {
    id: "telemetry",
    label: "Streaming In-Memory Zipball & Telemetry",
    detail:
      "Streaming GitHub repo stream into memory & fetching commit history...",
    icon: "📦",
  },
  {
    id: "ast",
    label: "AST & Polyglot Complexity Analysis",
    detail:
      "Parsing symbols, calculating cyclomatic hotspots & detecting dead code...",
    icon: "🔬",
  },
  {
    id: "security",
    label: "Scanning Secrets & Package Ecosystems",
    detail: "Scanning regex secret patterns & indexing polyglot manifests...",
    icon: "🛡️",
  },
  {
    id: "ai",
    label: "Gemini 3.8 Flash Architecture Synthesis",
    detail: "Synthesizing Mermaid diagrams & architectural dossier insights...",
    icon: "✨",
  },
  {
    id: "dossier",
    label: "Compiling Knowledge Dossier",
    detail: "Building PROJECT_KNOWLEDGE.md and persisting audit artifacts...",
    icon: "📋",
  },
];
