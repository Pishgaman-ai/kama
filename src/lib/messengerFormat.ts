function cleanInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\[(.+?)\]\((.+?)\)/g, "$1");
}

function parseTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cleanInlineMarkdown(cell.trim()));
}

function isSeparatorRow(line: string): boolean {
  const stripped = line.replace(/\|/g, "").trim();
  return !!stripped && /^[-:\s]+$/.test(stripped);
}

function formatTableBlock(tableLines: string[]): string[] {
  if (tableLines.length < 2) {
    return tableLines.map((line) => cleanInlineMarkdown(line));
  }

  const header = parseTableRow(tableLines[0]);
  const bodyLines = tableLines.slice(1).filter((line) => !isSeparatorRow(line));
  const bodyRows = bodyLines.map(parseTableRow).filter((row) => row.length > 0);

  if (header.length === 2) {
    return bodyRows.map((row) => {
      const left = row[0] || "-";
      const right = row[1] || "-";
      return `• ${left}: ${right}`;
    });
  }

  return bodyRows.map((row) => {
    const parts: string[] = [];
    for (let i = 0; i < header.length; i += 1) {
      const key = header[i] || `ستون ${i + 1}`;
      const value = row[i] || "-";
      parts.push(`${key}: ${value}`);
    }
    return `• ${parts.join(" | ")}`;
  });
}

export function formatForMessenger(rawText: string): string {
  const source = rawText.replace(/\r\n/g, "\n");
  const lines = source.split("\n");
  const output: string[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();

    if (!line) {
      output.push("");
      continue;
    }

    const headingMatch = line.match(/^#{1,6}\s+(.+)$/);
    if (headingMatch) {
      output.push(`🔹 ${cleanInlineMarkdown(headingMatch[1].trim())}`);
      output.push("");
      continue;
    }

    if (line.startsWith("|")) {
      const tableLines: string[] = [line];
      let j = i + 1;
      while (j < lines.length && lines[j].trim().startsWith("|")) {
        tableLines.push(lines[j].trim());
        j += 1;
      }
      output.push(...formatTableBlock(tableLines));
      output.push("");
      i = j - 1;
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      output.push(`• ${cleanInlineMarkdown(line.replace(/^[-*]\s+/, ""))}`);
      continue;
    }

    output.push(cleanInlineMarkdown(line));
  }

  return output
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

