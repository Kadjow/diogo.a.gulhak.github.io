export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface PlaygroundContext {
  html: string;
  css: string;
  js: string;
  console: string[];
}

export type GroqError = 'invalid-key' | 'rate-limit' | 'server' | 'unknown';

export const GROQ_MODEL = 'llama-3.3-70b-versatile';
export const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
export const CONSOLE_TAIL = 20;

export function formatContext(ctx: PlaygroundContext): string {
  const tail = ctx.console.slice(-CONSOLE_TAIL);
  const consoleBlock = tail.length ? tail.join('\n') : '(vazio)';
  return [
    'HTML:', '```html', ctx.html, '```',
    'CSS:', '```css', ctx.css, '```',
    'JS:', '```js', ctx.js, '```',
    'Console:', '```', consoleBlock, '```',
  ].join('\n');
}

export function buildMessages(
  system: string,
  ctx: PlaygroundContext,
  userMsg: string,
): ChatMessage[] {
  return [
    { role: 'system', content: system },
    { role: 'user', content: `${formatContext(ctx)}\n\n${userMsg}` },
  ];
}

export function buildRequestBody(
  messages: ChatMessage[],
): { model: string; messages: ChatMessage[]; temperature: number } {
  return { model: GROQ_MODEL, messages, temperature: 0.4 };
}

export function parseResponse(json: unknown): string {
  const choices = (json as { choices?: { message?: { content?: unknown } }[] }).choices;
  const content = choices?.[0]?.message?.content;
  if (typeof content !== 'string') throw new Error('malformed-response');
  return content;
}

export function describeError(status: number): GroqError {
  if (status === 401 || status === 403) return 'invalid-key';
  if (status === 429) return 'rate-limit';
  if (status >= 500) return 'server';
  return 'unknown';
}
