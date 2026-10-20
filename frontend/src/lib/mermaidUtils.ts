/**
 * Robust client-side sanitization of Mermaid flowchart definitions.
 * Fixes unquoted node labels with spaces, dashes, commas, colons, or parentheses,
 * e.g., Node[Connectivity Monitor (connectivity_plus)] -> Node["Connectivity Monitor (connectivity_plus)"]
 */
export function sanitizeMermaid(raw: string): string {
  if (!raw || !raw.trim()) return "";

  // 1. Strip markdown fences if present
  const code = raw.replace(/^```(?:mermaid)?\s*/im, "").replace(/\s*```\s*$/im, "").trim();

  // 2. Ensure valid diagram declaration
  const lines = code.split("\n");
  const firstNonEmpty = lines.find((l) => l.trim().length > 0 && !l.trim().startsWith("%%"));
  if (!firstNonEmpty || !/^(?:flowchart|graph|sequenceDiagram|classDiagram|stateDiagram|erDiagram)/i.test(firstNonEmpty.trim())) {
    lines.unshift("flowchart TD");
  }

  // 3. Process each line to quote unquoted labels
  const sanitizedLines = lines.map((line) => {
    let l = line;

    // Fix node definitions like: A[Some text with spaces or (parens) or commas]
    // Regex matches identifier followed by [ ... ]
    l = l.replace(/([a-zA-Z0-9_-]+)\[([^"\]\n]+)\]/g, (_match, id, label) => {
      const cleanLabel = label.trim().replace(/"/g, "'");
      return `${id}["${cleanLabel}"]`;
    });

    // Fix cylindrical / database nodes: A[(Database label)]
    l = l.replace(/([a-zA-Z0-9_-]+)\[\(([^"\]\n]+)\)\]/g, (_match, id, label) => {
      const cleanLabel = label.trim().replace(/"/g, "'");
      return `${id}[("${cleanLabel}")]`;
    });

    // Fix round-corner nodes: A(Round label)
    l = l.replace(/([a-zA-Z0-9_-]+)\(([^")\n]+)\)/g, (_match, id, label) => {
      // Don't replace if it's already a method call or connection syntax
      if (label.includes("-->") || label.includes("---")) return _match;
      const cleanLabel = label.trim().replace(/"/g, "'");
      return `${id}("${cleanLabel}")`;
    });

    return l;
  });

  return sanitizedLines.join("\n");
}
