# Playground AI Assistant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Painel de assistente de IA no playground — usuário cola a própria chave free da Groq, a IA vê o código + console e responde em Markdown.

**Architecture:** Lógica pura (montar mensagens, formatar contexto, corpo do request, parse de resposta, mapa de erro) em `ai/groq.logic.ts`, testada isolada. `GroqClient` faz o `fetch` (fetch injetável p/ teste). `AiPanel` é um componente standalone com config de chave (localStorage), lista de mensagens (Markdown sanitizado) e quick actions; fica numa seção recolhível abaixo do grid do playground (não toca no grid resizable). Chave BYO só no `localStorage`.

**Tech Stack:** Angular 22 standalone + signals, TypeScript strict, SCSS tokens, `@angular/localize` (pt-BR + en), Vitest (jsdom), DOMPurify (já no projeto), Groq OpenAI-compatible API. Sem novas dependências.

## Global Constraints

- Angular 22 standalone; estado de UI com **signals**. (CLAUDE.md)
- **SSR-safe:** `fetch`/`localStorage`/DOMPurify só sob `isPlatformBrowser`/handlers; nunca no load. (CLAUDE.md)
- **Segurança:** chave **só** no `localStorage` do usuário, nunca em código/commits/logs; input `type="password"`; chamada direta browser→Groq (BYO, sem proxy); resposta da IA passa por `sanitizeHtml` (DOMPurify) antes de ir ao DOM. (spec §Segurança)
- **Estilo só por tokens** de `_tokens.scss`. Sem hex chumbado. (CLAUDE.md)
- **i18n:** IDs `@@tools.playground.ai.*`; `$localize` resolve em build-time; o system prompt e as mensagens de erro são `$localize` no componente e passados à lógica pura. (CLAUDE.md/spec)
- **Vitest:** `.toBe(true)`/`.toBe(false)` — nunca `.toBeTrue()`. Mock de corpo vazio = `() => undefined`. (CLAUDE.md)
- **Links externos:** `target="_blank" rel="noopener"`. (CLAUDE.md)
- **Cleanup:** sem timers novos; qualquer listener limpa no `OnDestroy`. (CLAUDE.md)
- **Constantes:** `GROQ_MODEL = 'llama-3.3-70b-versatile'`, `GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'`, `GROQ_KEY = 'tools.playground.groqKey'`. (spec)
- **Filtro de spec único:** `npx ng test --watch=false --include "<spec>"` (arg posicional após `--` falha neste builder).
- **Comandos:** `npm run lint` (0 erros; 4 warnings a11y pré-existentes ok), `npm run test:ci`, `npm run build`. (CLAUDE.md)

---

## File Structure

- `src/app/features/tools/playground/ai/groq.logic.ts` (+ `.spec.ts`) — **novo**: tipos, constantes, `buildMessages`, `formatContext`, `buildRequestBody`, `parseResponse`, `describeError`.
- `src/app/features/tools/playground/ai/groq-client.ts` (+ `.spec.ts`) — **novo**: `GroqClient.send(key, body, fetchFn?)`.
- `src/app/core/storage-keys.ts` — **modificar**: `GROQ_KEY`.
- `src/app/features/tools/playground/ai/ai-panel.ts` + `ai-panel.scss` — **novo**: componente do painel.
- `src/app/features/tools/playground/playground.ts` — **modificar**: importar/inserir `<app-ai-panel>` abaixo do grid, passar contexto.
- `src/app/features/tools/playground/playground.scss` — **modificar**: espaçamento da seção do painel (fora do grid).
- `src/locale/messages.xlf` / `messages.en.xlf` — **modificar** (Task 5).

---

### Task 1: Lógica pura da Groq

**Files:**
- Create: `src/app/features/tools/playground/ai/groq.logic.ts`
- Test: `src/app/features/tools/playground/ai/groq.logic.spec.ts`

**Interfaces:**
- Produces:
  - `interface ChatMessage { role: 'system' | 'user' | 'assistant'; content: string }`
  - `interface PlaygroundContext { html: string; css: string; js: string; console: string[] }`
  - `type GroqError = 'invalid-key' | 'rate-limit' | 'server' | 'unknown'`
  - `const GROQ_MODEL = 'llama-3.3-70b-versatile'`
  - `const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'`
  - `const CONSOLE_TAIL = 20`
  - `function formatContext(ctx: PlaygroundContext): string`
  - `function buildMessages(system: string, ctx: PlaygroundContext, userMsg: string): ChatMessage[]`
  - `function buildRequestBody(messages: ChatMessage[]): { model: string; messages: ChatMessage[]; temperature: number }`
  - `function parseResponse(json: unknown): string`
  - `function describeError(status: number): GroqError`

- [ ] **Step 1: Write the failing tests**

Create `src/app/features/tools/playground/ai/groq.logic.spec.ts`:

```ts
import {
  formatContext, buildMessages, buildRequestBody, parseResponse, describeError,
  GROQ_MODEL, CONSOLE_TAIL, PlaygroundContext,
} from './groq.logic';

const ctx: PlaygroundContext = {
  html: '<h1>hi</h1>', css: 'h1{color:red}', js: 'console.log(1)', console: ['[log] 1'],
};

describe('formatContext', () => {
  it('includes html, css and js', () => {
    const out = formatContext(ctx);
    expect(out.includes('<h1>hi</h1>')).toBe(true);
    expect(out.includes('h1{color:red}')).toBe(true);
    expect(out.includes('console.log(1)')).toBe(true);
  });
  it('keeps only the last CONSOLE_TAIL console lines', () => {
    const many = Array.from({ length: CONSOLE_TAIL + 5 }, (_, i) => `[log] ${i}`);
    const out = formatContext({ ...ctx, console: many });
    expect(out.includes(`[log] ${CONSOLE_TAIL + 4}`)).toBe(true);
    expect(out.includes('[log] 0')).toBe(false);
  });
  it('handles empty console', () => {
    expect(() => formatContext({ ...ctx, console: [] })).not.toThrow();
  });
});

describe('buildMessages', () => {
  it('orders system then user, user carrying context + message', () => {
    const msgs = buildMessages('SYS', ctx, 'why red?');
    expect(msgs[0].role).toBe('system');
    expect(msgs[0].content).toBe('SYS');
    expect(msgs[1].role).toBe('user');
    expect(msgs[1].content.includes('why red?')).toBe(true);
    expect(msgs[1].content.includes('<h1>hi</h1>')).toBe(true);
  });
});

describe('buildRequestBody', () => {
  it('uses the model and carries the messages', () => {
    const body = buildRequestBody(buildMessages('SYS', ctx, 'hi'));
    expect(body.model).toBe(GROQ_MODEL);
    expect(body.messages.length).toBe(2);
    expect(typeof body.temperature).toBe('number');
  });
});

describe('parseResponse', () => {
  it('extracts the assistant content', () => {
    const json = { choices: [{ message: { role: 'assistant', content: 'hello' } }] };
    expect(parseResponse(json)).toBe('hello');
  });
  it('throws when choices are missing', () => {
    expect(() => parseResponse({})).toThrow();
    expect(() => parseResponse({ choices: [] })).toThrow();
  });
});

describe('describeError', () => {
  it('maps status codes to error kinds', () => {
    expect(describeError(401)).toBe('invalid-key');
    expect(describeError(429)).toBe('rate-limit');
    expect(describeError(500)).toBe('server');
    expect(describeError(503)).toBe('server');
    expect(describeError(418)).toBe('unknown');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx ng test --watch=false --include "src/app/features/tools/playground/ai/groq.logic.spec.ts"`
Expected: FAIL — módulo `./groq.logic` não existe.

- [ ] **Step 3: Write the implementation**

Create `src/app/features/tools/playground/ai/groq.logic.ts`:

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx ng test --watch=false --include "src/app/features/tools/playground/ai/groq.logic.spec.ts"`
Expected: PASS.

- [ ] **Step 5: Lint**

Run: `npm run lint`
Expected: 0 erros.

- [ ] **Step 6: Commit**

```bash
git add src/app/features/tools/playground/ai/groq.logic.ts src/app/features/tools/playground/ai/groq.logic.spec.ts
git commit -m "feat(playground): pure Groq request/context/parse logic"
```

---

### Task 2: `GroqClient` + storage key

**Files:**
- Create: `src/app/features/tools/playground/ai/groq-client.ts`
- Test: `src/app/features/tools/playground/ai/groq-client.spec.ts`
- Modify: `src/app/core/storage-keys.ts`

**Interfaces:**
- Consumes: `GROQ_URL`, `buildRequestBody`'s output shape, `parseResponse`, `describeError` (Task 1).
- Produces:
  - `GROQ_KEY = 'tools.playground.groqKey'` em `storage-keys.ts`.
  - `type FetchFn = (url: string, init: RequestInit) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>`
  - `class GroqClient { send(key: string, body: unknown, fetchFn?: FetchFn): Promise<string> }`
    - Em sucesso: resolve com `parseResponse(json)`.
    - Em erro HTTP: rejeita com `Error(describeError(status))`.

- [ ] **Step 1: Add the storage key**

Em `src/app/core/storage-keys.ts`, ao fim, adicione:

```ts

/** localStorage key for the user's own Groq API key (BYO, never bundled). */
export const GROQ_KEY = 'tools.playground.groqKey';
```

- [ ] **Step 2: Write the failing test**

Create `src/app/features/tools/playground/ai/groq-client.spec.ts`:

```ts
import { GroqClient, FetchFn } from './groq-client';

function fakeFetch(status: number, payload: unknown): FetchFn {
  return () => Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(payload),
  });
}

describe('GroqClient.send', () => {
  it('resolves with the assistant content on success', async () => {
    const client = new GroqClient();
    const ok = fakeFetch(200, { choices: [{ message: { content: 'hi there' } }] });
    await expect(client.send('key', {}, ok)).resolves.toBe('hi there');
  });
  it('rejects with invalid-key on 401', async () => {
    const client = new GroqClient();
    await expect(client.send('bad', {}, fakeFetch(401, {}))).rejects.toThrow('invalid-key');
  });
  it('rejects with rate-limit on 429', async () => {
    const client = new GroqClient();
    await expect(client.send('key', {}, fakeFetch(429, {}))).rejects.toThrow('rate-limit');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx ng test --watch=false --include "src/app/features/tools/playground/ai/groq-client.spec.ts"`
Expected: FAIL — módulo `./groq-client` não existe.

- [ ] **Step 4: Write the implementation**

Create `src/app/features/tools/playground/ai/groq-client.ts`:

```ts
import { Injectable } from '@angular/core';
import { GROQ_URL, parseResponse, describeError } from './groq.logic';

export type FetchFn = (
  url: string,
  init: RequestInit,
) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

@Injectable({ providedIn: 'root' })
export class GroqClient {
  async send(key: string, body: unknown, fetchFn: FetchFn = fetch): Promise<string> {
    const res = await fetchFn(GROQ_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(describeError(res.status));
    return parseResponse(await res.json());
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx ng test --watch=false --include "src/app/features/tools/playground/ai/groq-client.spec.ts"`
Expected: PASS.

- [ ] **Step 6: Lint**

Run: `npm run lint`
Expected: 0 erros.

- [ ] **Step 7: Commit**

```bash
git add src/app/features/tools/playground/ai/groq-client.ts src/app/features/tools/playground/ai/groq-client.spec.ts src/app/core/storage-keys.ts
git commit -m "feat(playground): GroqClient with injectable fetch + storage key"
```

---

### Task 3: Componente `AiPanel`

**Files:**
- Create: `src/app/features/tools/playground/ai/ai-panel.ts`
- Create: `src/app/features/tools/playground/ai/ai-panel.scss`

**Interfaces:**
- Consumes: `GroqClient` (Task 2); `GROQ_KEY` (Task 2); `buildMessages`, `buildRequestBody`, `PlaygroundContext`, `GroqError` (Task 1); `renderMarkdown`, `sanitizeHtml` de `../../markdown-preview/render.logic`; `StorageService` de `../../../../core/storage.service`.
- Produces: componente `AiPanel` (selector `app-ai-panel`) com `@Input() context: () => PlaygroundContext` — função que devolve o snapshot atual do playground.

> Sem teste unitário próprio: o miolo está nas Tasks 1-2; este componente é fiação. Gate: lint + verificação manual na Task 6.

- [ ] **Step 1: Create the component**

Create `src/app/features/tools/playground/ai/ai-panel.ts`:

```ts
import {
  Component, Input, PLATFORM_ID, inject, signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';
import { StorageService } from '../../../../core/storage.service';
import { GROQ_KEY } from '../../../../core/storage-keys';
import { GroqClient } from './groq-client';
import { buildMessages, buildRequestBody, PlaygroundContext, GroqError } from './groq.logic';
import { renderMarkdown, sanitizeHtml } from '../../markdown-preview/render.logic';

interface Bubble { role: 'user' | 'assistant'; html: string; raw: string }

@Component({
  selector: 'app-ai-panel',
  standalone: true,
  imports: [FormsModule],
  template: `
    <details class="ai" [open]="open()">
      <summary class="ai-summary" (click)="toggle($event)">
        <span i18n="@@tools.playground.ai.title">Assistente de IA</span>
      </summary>

      <div class="ai-body">
        @if (!hasKey()) {
          <div class="ai-keyrow">
            <input class="ai-key" type="password" [ngModel]="keyInput()"
              (ngModelChange)="keyInput.set($event)"
              [attr.placeholder]="keyPlaceholder" [attr.aria-label]="keyPlaceholder" />
            <button type="button" class="ai-btn" (click)="saveKey()"
              i18n="@@tools.playground.ai.saveKey">Salvar chave</button>
          </div>
          <p class="ai-hint">
            <span i18n="@@tools.playground.ai.keyHint">Sua chave fica só neste dispositivo.</span>
            <a href="https://console.groq.com/keys" target="_blank" rel="noopener"
              i18n="@@tools.playground.ai.getKey">Criar chave grátis</a>
          </p>
        } @else {
          <div class="ai-actions">
            <button type="button" class="ai-chip" (click)="quick('explain')"
              i18n="@@tools.playground.ai.explain">Explicar código</button>
            <button type="button" class="ai-chip" (click)="quick('fix')"
              i18n="@@tools.playground.ai.fix">Corrigir erros</button>
            <button type="button" class="ai-chip ai-clearkey" (click)="clearKey()"
              i18n="@@tools.playground.ai.clearKey">Trocar chave</button>
          </div>

          <div class="ai-messages">
            @for (m of bubbles(); track $index) {
              <div class="ai-msg" [class.user]="m.role === 'user'">
                <div [innerHTML]="m.html"></div>
                @if (m.role === 'assistant') {
                  <button type="button" class="ai-copy" (click)="copy(m.raw)"
                    i18n="@@tools.playground.ai.copy">Copiar</button>
                }
              </div>
            } @empty {
              <p class="ai-empty" i18n="@@tools.playground.ai.empty">Pergunte algo sobre seu código.</p>
            }
          </div>

          @if (error()) {
            <p class="ai-error">{{ errorText(error()!) }}</p>
          }

          <div class="ai-inputrow">
            <input class="ai-input" [ngModel]="input()" (ngModelChange)="input.set($event)"
              (keydown.enter)="send()" [disabled]="busy()"
              [attr.placeholder]="inputPlaceholder" [attr.aria-label]="inputPlaceholder" />
            <button type="button" class="ai-btn" (click)="send()" [disabled]="busy()"
              i18n="@@tools.playground.ai.send">Enviar</button>
          </div>
        }
      </div>
    </details>
  `,
  styleUrl: './ai-panel.scss',
})
export class AiPanel {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly storage = inject(StorageService);
  private readonly client = inject(GroqClient);

  @Input() context: () => PlaygroundContext = () => ({ html: '', css: '', js: '', console: [] });

  readonly open = signal(false);
  readonly keyInput = signal('');
  readonly hasKey = signal(false);
  readonly input = signal('');
  readonly bubbles = signal<Bubble[]>([]);
  readonly busy = signal(false);
  readonly error = signal<GroqError | null>(null);

  readonly keyPlaceholder = $localize`:@@tools.playground.ai.keyPlaceholder:Cole sua chave Groq`;
  readonly inputPlaceholder = $localize`:@@tools.playground.ai.inputPlaceholder:Pergunte sobre o código…`;
  private readonly systemPrompt = $localize`:@@tools.playground.ai.system:Você é um assistente de programação. O usuário está num playground HTML/CSS/JS. Responda em Markdown, focando no código e no console fornecidos.`;
  private readonly explainPrompt = $localize`:@@tools.playground.ai.explainPrompt:Explique o que este código faz.`;
  private readonly fixPrompt = $localize`:@@tools.playground.ai.fixPrompt:Aponte e corrija os erros deste código.`;

  private readonly errInvalid = $localize`:@@tools.playground.ai.errInvalid:Chave inválida. Confira e salve de novo.`;
  private readonly errRate = $localize`:@@tools.playground.ai.errRate:Limite atingido. Tente de novo em instantes.`;
  private readonly errServer = $localize`:@@tools.playground.ai.errServer:Erro no servidor da IA. Tente de novo.`;
  private readonly errUnknown = $localize`:@@tools.playground.ai.errUnknown:Falha ao falar com a IA.`;

  constructor() {
    if (this.isBrowser) this.hasKey.set(!!this.storage.getLocal(GROQ_KEY));
  }

  toggle(e: Event): void {
    e.preventDefault();
    this.open.update(v => !v);
  }

  saveKey(): void {
    const k = this.keyInput().trim();
    if (!k) return;
    this.storage.setLocal(GROQ_KEY, k);
    this.hasKey.set(true);
    this.keyInput.set('');
  }

  clearKey(): void {
    this.storage.setLocal(GROQ_KEY, '');
    this.hasKey.set(false);
    this.bubbles.set([]);
  }

  copy(text: string): void {
    if (this.isBrowser && navigator.clipboard) void navigator.clipboard.writeText(text);
  }

  quick(kind: 'explain' | 'fix'): void {
    this.input.set(kind === 'explain' ? this.explainPrompt : this.fixPrompt);
    void this.send();
  }

  errorText(kind: GroqError): string {
    if (kind === 'invalid-key') return this.errInvalid;
    if (kind === 'rate-limit') return this.errRate;
    if (kind === 'server') return this.errServer;
    return this.errUnknown;
  }

  async send(): Promise<void> {
    if (!this.isBrowser || this.busy()) return;
    const userMsg = this.input().trim();
    if (!userMsg) return;
    const key = this.storage.getLocal(GROQ_KEY);
    if (!key) { this.hasKey.set(false); return; }

    this.error.set(null);
    this.busy.set(true);
    this.input.set('');
    await this.pushBubble('user', userMsg);

    try {
      const messages = buildMessages(this.systemPrompt, this.context(), userMsg);
      const content = await this.client.send(key, buildRequestBody(messages));
      await this.pushBubble('assistant', content);
    } catch (e) {
      const kind = (e as Error).message as GroqError;
      this.error.set(
        kind === 'invalid-key' || kind === 'rate-limit' || kind === 'server' ? kind : 'unknown',
      );
    } finally {
      this.busy.set(false);
    }
  }

  private async pushBubble(role: 'user' | 'assistant', markdown: string): Promise<void> {
    const rendered = await renderMarkdown(markdown);
    const { default: DOMPurify } = await import('dompurify');
    const html = sanitizeHtml(rendered, DOMPurify);
    this.bubbles.update(list => [...list, { role, html, raw: markdown }]);
  }
}
```

- [ ] **Step 2: Create the styles**

Create `src/app/features/tools/playground/ai/ai-panel.scss`:

```scss
.ai {
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
}
.ai-summary {
  cursor: pointer;
  padding: 8px 12px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--ink);
  &:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
}
.ai-body { padding: 10px 12px; display: flex; flex-direction: column; gap: 10px; }
.ai-keyrow, .ai-inputrow { display: flex; gap: 8px; }
.ai-key, .ai-input {
  flex: 1;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg);
  color: var(--ink);
  font-size: 0.8125rem;
  &:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
}
.ai-btn {
  padding: 8px 14px;
  border: 1.5px solid var(--ink);
  border-radius: 999px;
  background: transparent;
  color: var(--ink);
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  &:hover:not(:disabled) { background: var(--ink); color: var(--bg); }
  &:disabled { opacity: 0.5; cursor: default; }
  &:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
}
.ai-hint { font-size: 0.75rem; color: var(--muted); display: flex; gap: 8px; flex-wrap: wrap; }
.ai-hint a { color: var(--accent); }
.ai-actions { display: flex; gap: 6px; flex-wrap: wrap; }
.ai-chip {
  padding: 4px 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg);
  color: var(--ink);
  font-size: 0.75rem;
  cursor: pointer;
  &:hover { border-color: var(--accent); }
  &:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
}
.ai-clearkey { margin-left: auto; color: var(--muted); }
.ai-messages { display: flex; flex-direction: column; gap: 8px; max-height: 300px; overflow-y: auto; }
.ai-msg {
  padding: 8px 10px;
  border-radius: 8px;
  background: var(--bg);
  border: 1px solid var(--border);
  font-size: 0.8125rem;
  color: var(--ink);
  overflow-x: auto;
  &.user { background: var(--surface); font-style: italic; }
  a { color: var(--accent); }
  code { font-family: ui-monospace, monospace; }
}
.ai-copy {
  margin-top: 6px;
  padding: 2px 8px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: transparent;
  color: var(--muted);
  font-size: 0.6875rem;
  cursor: pointer;
  &:hover { color: var(--ink); border-color: var(--accent); }
  &:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
}
.ai-empty, .ai-error { font-size: 0.8125rem; }
.ai-empty { color: var(--muted); font-style: italic; }
.ai-error { color: var(--danger); }
```

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: 0 erros (4 warnings a11y pré-existentes ok).

- [ ] **Step 4: Commit**

```bash
git add src/app/features/tools/playground/ai/ai-panel.ts src/app/features/tools/playground/ai/ai-panel.scss
git commit -m "feat(playground): AI assistant panel (Groq BYO key, markdown answers)"
```

---

### Task 4: Integrar no `Playground`

**Files:**
- Modify: `src/app/features/tools/playground/playground.ts`
- Modify: `src/app/features/tools/playground/playground.scss`

**Interfaces:**
- Consumes: `AiPanel` (Task 3); `PlaygroundContext` (Task 1).

> Sem teste unitário: fiação. Gate: lint + suíte + verificação manual (Task 6).

- [ ] **Step 1: Import and register the panel**

Em `src/app/features/tools/playground/playground.ts`:

Adicione o import:

```ts
import { AiPanel } from './ai/ai-panel';
import { PlaygroundContext } from './ai/groq.logic';
```

No decorator, acrescente `AiPanel` a `imports: [...]`.

- [ ] **Step 2: Expose the context getter**

Na classe, adicione um método que devolve o snapshot atual (bound como função para o input):

```ts
  readonly aiContext = (): PlaygroundContext => ({
    html: this.mode() === 'single' ? this.single() : this.html(),
    css: this.mode() === 'single' ? '' : this.css(),
    js: this.mode() === 'single' ? '' : this.js(),
    console: this.consoleLines().map(l => `[${l.level}] ${l.text}`),
  });
```

- [ ] **Step 3: Place the panel below the grid**

No template, **depois** do fechamento da `<div class="pg">` (fora do grid resizable, para não alterar o alinhamento de tracks), mas ainda dentro do `<app-tool-shell>`, adicione:

```html
        <app-ai-panel class="pg-ai" [context]="aiContext" />
```

- [ ] **Step 4: Space the section**

Em `src/app/features/tools/playground/playground.scss`, ao fim, adicione:

```scss
.pg-ai { display: block; margin-top: 14px; }
```

- [ ] **Step 5: Lint + suite**

Run: `npm run lint && npm run test:ci`
Expected: lint 0 erros; suíte verde. **Não rode build** (targets en entram na Task 5).

- [ ] **Step 6: Commit**

```bash
git add src/app/features/tools/playground/playground.ts src/app/features/tools/playground/playground.scss
git commit -m "feat(playground): mount AI panel with live code+console context"
```

---

### Task 5: i18n — extração, tradução en e verificação

**Files:**
- Modify: `src/locale/messages.xlf`
- Modify: `src/locale/messages.en.xlf`

**Interfaces:** N/A.

- [ ] **Step 1: Extract**

Run: `npx ng extract-i18n --output-path src/locale`
Expected: novos ids `tools.playground.ai.*` (title, saveKey, keyHint, getKey, explain, fix, clearKey, empty, send, copy, keyPlaceholder, inputPlaceholder, system, explainPrompt, fixPrompt, errInvalid, errRate, errServer, errUnknown) em `messages.xlf`. (Warnings `pt-BR`→`pt`/`localize/init` são pré-existentes.)

- [ ] **Step 2: Fill English targets**

Em `src/locale/messages.en.xlf`, junto dos outros `tools.playground.*`, adicione (source = pt do componente; target = en abaixo):

```xml
      <trans-unit id="tools.playground.ai.title" datatype="html">
        <source>Assistente de IA</source>
        <target state="translated">AI Assistant</target>
      </trans-unit>
      <trans-unit id="tools.playground.ai.saveKey" datatype="html">
        <source>Salvar chave</source>
        <target state="translated">Save key</target>
      </trans-unit>
      <trans-unit id="tools.playground.ai.keyHint" datatype="html">
        <source>Sua chave fica só neste dispositivo.</source>
        <target state="translated">Your key stays on this device only.</target>
      </trans-unit>
      <trans-unit id="tools.playground.ai.getKey" datatype="html">
        <source>Criar chave grátis</source>
        <target state="translated">Get a free key</target>
      </trans-unit>
      <trans-unit id="tools.playground.ai.explain" datatype="html">
        <source>Explicar código</source>
        <target state="translated">Explain code</target>
      </trans-unit>
      <trans-unit id="tools.playground.ai.fix" datatype="html">
        <source>Corrigir erros</source>
        <target state="translated">Fix errors</target>
      </trans-unit>
      <trans-unit id="tools.playground.ai.clearKey" datatype="html">
        <source>Trocar chave</source>
        <target state="translated">Change key</target>
      </trans-unit>
      <trans-unit id="tools.playground.ai.empty" datatype="html">
        <source>Pergunte algo sobre seu código.</source>
        <target state="translated">Ask something about your code.</target>
      </trans-unit>
      <trans-unit id="tools.playground.ai.send" datatype="html">
        <source>Enviar</source>
        <target state="translated">Send</target>
      </trans-unit>
      <trans-unit id="tools.playground.ai.copy" datatype="html">
        <source>Copiar</source>
        <target state="translated">Copy</target>
      </trans-unit>
      <trans-unit id="tools.playground.ai.keyPlaceholder" datatype="html">
        <source>Cole sua chave Groq</source>
        <target state="translated">Paste your Groq key</target>
      </trans-unit>
      <trans-unit id="tools.playground.ai.inputPlaceholder" datatype="html">
        <source>Pergunte sobre o código…</source>
        <target state="translated">Ask about the code…</target>
      </trans-unit>
      <trans-unit id="tools.playground.ai.system" datatype="html">
        <source>Você é um assistente de programação. O usuário está num playground HTML/CSS/JS. Responda em Markdown, focando no código e no console fornecidos.</source>
        <target state="translated">You are a coding assistant. The user is in an HTML/CSS/JS playground. Answer in Markdown, focusing on the provided code and console.</target>
      </trans-unit>
      <trans-unit id="tools.playground.ai.explainPrompt" datatype="html">
        <source>Explique o que este código faz.</source>
        <target state="translated">Explain what this code does.</target>
      </trans-unit>
      <trans-unit id="tools.playground.ai.fixPrompt" datatype="html">
        <source>Aponte e corrija os erros deste código.</source>
        <target state="translated">Point out and fix the errors in this code.</target>
      </trans-unit>
      <trans-unit id="tools.playground.ai.errInvalid" datatype="html">
        <source>Chave inválida. Confira e salve de novo.</source>
        <target state="translated">Invalid key. Check it and save again.</target>
      </trans-unit>
      <trans-unit id="tools.playground.ai.errRate" datatype="html">
        <source>Limite atingido. Tente de novo em instantes.</source>
        <target state="translated">Rate limit reached. Try again shortly.</target>
      </trans-unit>
      <trans-unit id="tools.playground.ai.errServer" datatype="html">
        <source>Erro no servidor da IA. Tente de novo.</source>
        <target state="translated">AI server error. Try again.</target>
      </trans-unit>
      <trans-unit id="tools.playground.ai.errUnknown" datatype="html">
        <source>Falha ao falar com a IA.</source>
        <target state="translated">Failed to reach the AI.</target>
      </trans-unit>
```

- [ ] **Step 3: Verify parity**

Run (bash):
```bash
grep -oE 'trans-unit id="[^"]*"' src/locale/messages.xlf | sed 's/.*id="//;s/"//' | sort -u > /tmp/s.txt
grep -oE 'trans-unit id="[^"]*"' src/locale/messages.en.xlf | sed 's/.*id="//;s/"//' | sort -u > /tmp/e.txt
echo "missing:"; comm -23 /tmp/s.txt /tmp/e.txt
echo "orphan:"; comm -13 /tmp/s.txt /tmp/e.txt
echo "units=$(grep -c '<trans-unit ' src/locale/messages.en.xlf) targets=$(grep -c '<target' src/locale/messages.en.xlf)"
```
Expected: `missing:` vazio, `orphan:` vazio, `units` == `targets`.

- [ ] **Step 4: Commit**

```bash
git add src/locale/messages.xlf src/locale/messages.en.xlf
git commit -m "i18n(playground): AI assistant strings"
```

---

### Task 6: Verificação final

**Files:** N/A (só verificação).

- [ ] **Step 1: Suite + lint**

Run: `npm run test:ci && npm run lint`
Expected: testes verdes; lint 0 erros (4 warnings a11y pré-existentes ok).

- [ ] **Step 2: Build 2 locales**

Run: `npm run build`
Expected: build completo, 12 rotas prerenderizadas, sem erro de budget.

- [ ] **Step 3: Verify locale text**

Run (bash):
```bash
grep -o "Assistente de IA" dist/portfolio/browser/tools/playground/index.html | head -1
grep -o "AI Assistant" dist/portfolio/browser/en/tools/playground/index.html | head -1
```
Expected: pt mostra "Assistente de IA"; en mostra "AI Assistant".

- [ ] **Step 4: Manual smoke (dev server)**

`npm start` → `/tools/playground`:
- abrir o painel "Assistente de IA"; sem chave, aparece o campo + link "Criar chave grátis";
- colar uma chave Groq válida, salvar → some o campo, aparecem as quick actions e o input;
- escrever `<h1>` com bug de JS, clicar "Corrigir erros" → resposta em Markdown renderizado;
- chave inválida → mensagem de erro `Chave inválida`;
- "Trocar chave" limpa a chave e volta ao campo;
- confirmar que o painel fica abaixo do grid e o resize dos 3 eixos continua intacto.
