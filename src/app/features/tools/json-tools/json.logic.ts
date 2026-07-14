export interface JsonResult {
  ok: boolean;
  output: string;
  error: string | null;
}

function transform(input: string, render: (parsed: unknown) => string): JsonResult {
  if (input.trim() === '') return { ok: true, output: '', error: null };
  try {
    const parsed = JSON.parse(input);
    return { ok: true, output: render(parsed), error: null };
  } catch (e) {
    return { ok: false, output: '', error: (e as Error).message };
  }
}

export function formatJson(input: string, indent: number): JsonResult {
  return transform(input, parsed => JSON.stringify(parsed, null, indent));
}

export function minifyJson(input: string): JsonResult {
  return transform(input, parsed => JSON.stringify(parsed));
}

export interface JsonError { message: string; line: number; col: number; }
export interface JsonStats { bytes: number; lines: number; nodes: number; }

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value && typeof value === 'object') {
    const src = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(src).sort((a, b) => a.localeCompare(b))) {
      out[key] = sortValue(src[key]);
    }
    return out;
  }
  return value;
}

export function sortJson(input: string, indent: number): JsonResult {
  return transform(input, parsed => JSON.stringify(sortValue(parsed), null, indent));
}

export function errorToLineCol(text: string, position: number): { line: number; col: number } {
  let line = 1;
  let col = 1;
  const end = Math.min(position, text.length);
  for (let i = 0; i < end; i++) {
    if (text[i] === '\n') { line++; col = 1; } else { col++; }
  }
  return { line, col };
}

export function validateJson(input: string): JsonError | null {
  if (input.trim() === '') return null;
  try {
    JSON.parse(input);
    return null;
  } catch (e) {
    const message = (e as Error).message;
    // Node/V8 mensagens variam: "... at position N" e/ou "(line L column C)".
    const lc = /line (\d+) column (\d+)/.exec(message);
    if (lc) return { message, line: Number(lc[1]), col: Number(lc[2]) };
    const p = /position (\d+)/.exec(message);
    if (p) { const { line, col } = errorToLineCol(input, Number(p[1])); return { message, line, col }; }
    return { message, line: 1, col: 1 };
  }
}

function countNodes(value: unknown): number {
  if (Array.isArray(value)) return 1 + value.reduce<number>((a, v) => a + countNodes(v), 0);
  if (value && typeof value === 'object') {
    return 1 + Object.values(value as Record<string, unknown>).reduce<number>((a, v) => a + countNodes(v), 0);
  }
  return 1;
}

export function jsonStats(text: string): JsonStats {
  const bytes = new TextEncoder().encode(text).length;
  const lines = text === '' ? 0 : text.split('\n').length;
  let nodes: number;
  try { nodes = countNodes(JSON.parse(text)); } catch { nodes = 0; }
  return { bytes, lines, nodes };
}
