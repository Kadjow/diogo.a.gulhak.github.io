import { marked } from 'marked';

export function sanitizeHtml(
  raw: string,
  purify: { sanitize(s: string): string },
): string {
  return purify.sanitize(raw);
}

export async function renderMarkdown(md: string): Promise<string> {
  if (md === '') return '';
  return marked.parse(md, { async: true });
}
