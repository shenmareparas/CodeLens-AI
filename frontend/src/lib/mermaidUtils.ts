/**
 * Robust client-side sanitization of Mermaid flowchart definitions across Mermaid 12+.
 * Heals unclosed brackets, joins multi-line node declarations, quotes unquoted labels,
 * properly sanitizes special characters (ampersands, parentheses, quotes), and balances subgraphs.
 */

const VALID_DIAGRAM_REGEX =
  /^(?:flowchart|graph|sequenceDiagram|classDiagram|stateDiagram|erDiagram|journey|gantt|pie|gitGraph|c4context|c4container|c4component)/i;

function cleanInnerLabel(text: string): string {
  const trimmed = text.trim().replace(/^"+|"+$/g, "");
  return trimmed.replace(/"/g, "'");
}

function isNewStatement(trimmed: string): boolean {
  if (!trimmed) return false;
  return (
    trimmed.toLowerCase().startsWith("subgraph") ||
    trimmed.toLowerCase() === "end" ||
    /^[a-zA-Z0-9_-]+\s*(?:--+>|==+>|-\.+->)/.test(trimmed)
  );
}

export function sanitizeMermaid(raw: string, repoName = "Repository"): string {
  if (!raw || !raw.trim()) {
    return buildFallbackDiagram(repoName);
  }

  // 1. Strip markdown fences if present
  const code = raw
    .replace(/^```(?:mermaid)?\s*/gim, "")
    .replace(/\s*```\s*$/gim, "")
    .trim();

  if (!code) {
    return buildFallbackDiagram(repoName);
  }

  // 2. Normalize line endings and strip markdown bullets/blockquotes
  const rawLines = code
    .split(/\r?\n/)
    .map((l) => l.trimEnd().replace(/^[>\s*-]+\s*/, ""));

  // 3. Ensure valid diagram declaration
  const firstNonEmptyIndex = rawLines.findIndex(
    (l) => l.trim().length > 0 && !l.trim().startsWith("%%"),
  );

  if (firstNonEmptyIndex === -1) {
    return buildFallbackDiagram(repoName);
  }

  const firstLine = rawLines[firstNonEmptyIndex].trim();
  if (!VALID_DIAGRAM_REGEX.test(firstLine)) {
    rawLines.splice(firstNonEmptyIndex, 0, "flowchart TD");
  }

  // 4. Multi-line node joining & auto-closing of unclosed brackets on a line
  const joinedLines: string[] = [];
  let buffer = "";
  let insideOpenDelimiter = false;

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("%%")) {
      if (!insideOpenDelimiter) {
        joinedLines.push(line);
      }
      continue;
    }

    if (insideOpenDelimiter) {
      buffer += " " + trimmed;
      if (
        buffer.includes("]") ||
        buffer.includes(")") ||
        buffer.includes("}")
      ) {
        joinedLines.push(buffer);
        buffer = "";
        insideOpenDelimiter = false;
      }
      continue;
    }

    // Count open/close delimiters
    const openBrackets = (trimmed.match(/\[/g) || []).length;
    const closeBrackets = (trimmed.match(/\]/g) || []).length;
    const openParens = (trimmed.match(/\(/g) || []).length;
    const closeParens = (trimmed.match(/\)/g) || []).length;

    if (openBrackets > closeBrackets) {
      if (i + 1 < rawLines.length && !isNewStatement(rawLines[i + 1].trim())) {
        buffer = line;
        insideOpenDelimiter = true;
        continue;
      } else {
        // Auto-close unclosed bracket: "A[View Visual Spending " -> "A[View Visual Spending]"
        joinedLines.push(line + "]");
        continue;
      }
    }

    if (
      openParens > closeParens &&
      !trimmed.includes("-->") &&
      !trimmed.includes("---")
    ) {
      if (i + 1 < rawLines.length && !isNewStatement(rawLines[i + 1].trim())) {
        buffer = line;
        insideOpenDelimiter = true;
        continue;
      } else {
        joinedLines.push(line + ")");
        continue;
      }
    }

    joinedLines.push(line);
  }

  if (buffer) {
    joinedLines.push(buffer + "]");
  }

  // 5. Line-by-line sanitization of node shapes, arrow labels, and subgraphs
  let subgraphCount = 0;
  let endCount = 0;

  const sanitizedLines = joinedLines.map((line) => {
    let l = line.trim();
    if (!l || l.startsWith("%%") || VALID_DIAGRAM_REGEX.test(l)) {
      return line;
    }

    // Subgraphs
    if (/^subgraph\s+/i.test(l)) {
      subgraphCount++;
      const match = l.match(/^(\s*subgraph\s+)(.+)$/i);
      if (match) {
        const prefix = match[1];
        const title = match[2].trim();
        if (
          !title.startsWith('"') &&
          !title.includes("[") &&
          /[\s\p{P}]/u.test(title)
        ) {
          const safeId = title.replace(/[^a-zA-Z0-9_]/g, "_");
          const cleanTitle = title.replace(/"/g, "'");
          return `${prefix}${safeId}["${cleanTitle}"]`;
        }
      }
      return line;
    }

    if (/^end$/i.test(l)) {
      endCount++;
      return line;
    }

    // 1. Cylinder: id[( label )] -> id[("clean")]
    l = l.replace(
      /([a-zA-Z0-9_-]+)\[\(\s*(.*?)\s*\)\]/g,
      (_m, id, inner) => `${id}[("${cleanInnerLabel(inner)}")]`,
    );

    // 2. Stadium: id([ label ]) -> id(["clean"])
    l = l.replace(
      /([a-zA-Z0-9_-]+)\(\[\s*(.*?)\s*\]\)/g,
      (_m, id, inner) => `${id}(["${cleanInnerLabel(inner)}"])`,
    );

    // 3. Subroutine: id[[ label ]] -> id[["clean"]]
    l = l.replace(
      /([a-zA-Z0-9_-]+)\[\[\s*(.*?)\s*\]\]/g,
      (_m, id, inner) => `${id}[["${cleanInnerLabel(inner)}"]]`,
    );

    // 4. Hexagon: id{{ label }} -> id{{"clean"}}
    l = l.replace(
      /([a-zA-Z0-9_-]+)\{\{\s*(.*?)\s*\}\}/g,
      (_m, id, inner) => `${id}{{"${cleanInnerLabel(inner)}"}}`,
    );

    // 5. Double Circle: id(( label )) -> id(("clean"))
    l = l.replace(
      /([a-zA-Z0-9_-]+)\(\(\s*(.*?)\s*\)\)/g,
      (_m, id, inner) => `${id}(("${cleanInnerLabel(inner)}"))`,
    );

    // 6. Standard Rectangle: id[ label ] (excluding [[ and [( and )] and ]])
    l = l.replace(
      /([a-zA-Z0-9_-]+)(?<!\[)\[(?![[(])\s*(.*?)\s*\](?!\])/g,
      (_m, id, inner) => `${id}["${cleanInnerLabel(inner)}"]`,
    );

    // 7. Standard Rounded: id( label ) (excluding (( and ([ and ]) and ))
    l = l.replace(
      /([a-zA-Z0-9_-]+)(?<!\()\((?![[(])\s*(.*?)\s*\)(?!\))/g,
      (_m, id, inner) => {
        if (inner.includes("-->") || inner.includes("---")) return _m;
        return `${id}("${cleanInnerLabel(inner)}")`;
      },
    );

    // 8. Arrow label: -->|label| -> -->|"clean"|
    l = l.replace(
      /(--+>|==+>|-\.+->)\|([^|\n]+)\|/g,
      (_m, arrow, inner) => `${arrow}|"${cleanInnerLabel(inner)}"|`,
    );

    return l;
  });

  // 6. Balance missing 'end' statements for subgraphs
  while (endCount < subgraphCount) {
    sanitizedLines.push("  end");
    endCount++;
  }

  const result = sanitizedLines.join("\n").trim();
  return result || buildFallbackDiagram(repoName);
}

export function buildFallbackDiagram(repoName = "Repository"): string {
  const safeName = repoName.replace(/"/g, "'");
  return `flowchart TD
  Client["Web / Client Application"]
  API["${safeName} API & Core Engine"]
  Analysis["Analysis & Telemetry Engine"]
  Storage[("Storage & Persistence")]

  Client --> API
  API --> Analysis
  API --> Storage
  Analysis --> Storage`;
}
