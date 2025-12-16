import React from "react";

/**
 * Simple markdown renderer for campaign ideas
 * Supports: headings (##, ###), lists (-), tables (|), bold (**), italic (*)
 */
export function MarkdownRenderer({ content }: { content: string }) {
  return <div className="space-y-2">{renderMarkdown(content)}</div>;
}

function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split(/\r?\n/);
  const nodes: React.ReactNode[] = [];
  let listBuffer: string[] = [];
  let tableBuffer: string[][] = [];
  let tableHeaders: string[] | null = null;

  const flushList = () => {
    if (listBuffer.length) {
      nodes.push(
        <ul key={`list-${nodes.length}`} className="list-disc space-y-1 pl-5">
          {listBuffer.map((item, index) => (
            <li key={`list-${index}`}>{parseInline(item)}</li>
          ))}
        </ul>
      );
      listBuffer = [];
    }
  };

  const flushTable = () => {
    if (tableBuffer.length) {
      nodes.push(
        <div key={`table-${nodes.length}`} className="max-w-full overflow-x-auto">
          <table className="w-full text-sm text-zinc-700">
            {tableHeaders && (
              <thead>
                <tr className="text-xs uppercase tracking-wide text-zinc-500">
                  {tableHeaders.map((cell, idx) => (
                    <th key={`header-${idx}`} className="border-b px-3 py-2 text-left">
                      {parseInline(cell)}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {tableBuffer.map((row, rowIndex) => (
                <tr key={`row-${rowIndex}`} className="border-b last:border-0">
                  {row.map((cell, cellIndex) => (
                    <td key={`cell-${rowIndex}-${cellIndex}`} className="px-3 py-2">
                      {parseInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableBuffer = [];
      tableHeaders = null;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      flushTable();
      continue;
    }

    if (trimmed.startsWith("## ")) {
      flushList();
      flushTable();
      nodes.push(
        <h2 key={`h2-${nodes.length}`} className="mt-4 text-xl font-semibold text-zinc-900">
          {parseInline(trimmed.slice(3))}
        </h2>
      );
      continue;
    }

    if (trimmed.startsWith("### ")) {
      flushList();
      flushTable();
      nodes.push(
        <h3 key={`h3-${nodes.length}`} className="mt-3 text-lg font-semibold text-zinc-900">
          {parseInline(trimmed.slice(4))}
        </h3>
      );
      continue;
    }

    if (trimmed.startsWith("- ")) {
      flushTable();
      listBuffer.push(trimmed.slice(2).trim());
      continue;
    }

    if (trimmed.startsWith("|")) {
      const rowCells = trimmed
        .split("|")
        .slice(1, -1)
        .map((cell) => cell.trim());
      const isDelimiter = rowCells.every((cell) => /^:?-+:?$/.test(cell.replace(/\s/g, "")));

      if (isDelimiter) {
        continue;
      }

      if (!tableHeaders) {
        tableHeaders = rowCells;
        continue;
      }

      tableBuffer.push(rowCells);
      continue;
    }

    flushList();
    flushTable();
    nodes.push(
      <p key={`p-${nodes.length}`} className="mt-2 text-sm text-zinc-700">
        {parseInline(trimmed)}
      </p>
    );
  }

  flushList();
  flushTable();

  return nodes;
}

function parseInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  const inlineRegex = /(\*\*[^*]+\*\*|\*[^*]+\*|__[^_]+__|_[^_]+_)/g;
  let match: RegExpExecArray | null;

  while ((match = inlineRegex.exec(text))) {
    const [token] = match;

    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const isBold = token.startsWith("**") || token.startsWith("__");
    const content = token.slice(isBold ? 2 : 1, token.length - (isBold ? 2 : 1));

    if (isBold) {
      nodes.push(<strong key={`bold-${match.index}`}>{parseInline(content)}</strong>);
    } else {
      nodes.push(<em key={`italic-${match.index}`}>{parseInline(content)}</em>);
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}
