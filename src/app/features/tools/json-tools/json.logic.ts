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
