# HTML Playground Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar a tool de render em um playground HTML+CSS+JS ao vivo (preview em iframe sandbox, console estilo DevTools, viewport toggle, persistência, export) e extrair o Markdown para uma tool própria.

**Architecture:** Lógica pura (`buildSrcdoc`/`buildExportDoc`/`formatConsoleArg`) separada da fiação. O código do usuário roda num `<iframe sandbox="allow-scripts">` via `srcdoc` (isolamento, não sanitização). Console capturado por um bootstrap injetado que faz `postMessage` para o pai. Editores CodeMirror 6 carregados lazy, com fallback textarea. Cada peça é standalone e testável.

**Tech Stack:** Angular 22 standalone + signals, TypeScript strict, SCSS tokens, `@angular/localize` (pt-BR + en), Vitest (jsdom). CodeMirror 6 (lazy). Sem servidor.

## Global Constraints

- Angular 22 standalone; estado de UI com **signals**. (CLAUDE.md)
- **SSR-safe:** prerender roda em Node. `iframe`/`postMessage`/`localStorage`/`Blob`/`URL`/CodeMirror só sob `isPlatformBrowser(PLATFORM_ID)`. (CLAUDE.md)
- **Cleanup:** todo componente com timer/listener implementa `OnDestroy` e limpa (debounce `.cancel()`, `unlisten()`). (CLAUDE.md)
- **Estilo só por tokens** de `_tokens.scss` (`var(--bg)`, `var(--accent)`, `var(--danger)`, etc.). Sem hex/sombra chumbada. (CLAUDE.md)
- **i18n:** toda string visível marcada (`i18n`/`i18n-*` ou `$localize`), IDs estáveis `@@tools.<slug>.<chave>`. `$localize` resolve em build-time. (CLAUDE.md)
- **Vitest:** `.toBe(true)`/`.toBe(false)` — nunca `.toBeTrue()`. Mock de corpo vazio = `() => undefined`. (CLAUDE.md)
- **base-relativo:** links internos via `LocaleService.path()` — nunca `/` absoluto. (fix subpath)
- **Segurança:** `sandbox="allow-scripts"` **sem** `allow-same-origin`; console via `postMessage` só aceito de `iframe.contentWindow` com marcador `__pg`; sem `eval` no pai. (spec §Segurança)
- **Lazy:** CodeMirror fora do bundle inicial (budget initial: warning 500kB / error 1MB). (angular.json)
- **Comandos:** `npm run lint` (0 erros), `npm run test:ci` (verde), `npm run build` (2 locales). (CLAUDE.md)
- **i18n fluxo:** editar tudo → `npx ng extract-i18n --output-path src/locale` → preencher `<target>` en → verificar paridade → confirmar pt em `/` e en em `/en/`. (CLAUDE.md)

---

## File Structure

- `src/app/features/tools/playground/playground.logic.ts` (+ `.spec.ts`) — puro: tipos, `buildSrcdoc`, `buildExportDoc`, `formatConsoleArg`, `CONSOLE_BOOTSTRAP`, `VIEWPORTS`, `DEFAULT_SNIPPET`.
- `src/app/shared/util/debounce.ts` (+ `.spec.ts`) — helper puro de debounce com `.cancel()`.
- `src/app/features/tools/playground/editor/code-editor.ts` (+ `.spec.ts`) + `code-editor.scss` — CodeMirror 6 lazy + fallback textarea.
- `src/app/features/tools/playground/console-panel.ts` + `console-panel.scss` — painel de console (apresentação).
- `src/app/features/tools/playground/playground.ts` + `playground.scss` — componente principal.
- `src/app/core/storage-keys.ts` — **modificar**: `PLAYGROUND_KEY`.
- `src/app/features/tools/markdown-preview/` — **novo**: `markdown-preview.ts` + `.scss`, `render.logic.ts` (+ `.spec.ts`) movidos.
- `src/data/tools.ts` — **modificar**: trocar entradas.
- `src/app/app.routes.ts` — **modificar**: trocar rotas.
- `src/app/features/tools/html-markdown-render/` — **remover** (Task 6).
- `src/locale/messages.xlf` / `messages.en.xlf` — **modificar** (Task 7).

---

### Task 1: `playground.logic.ts` (lógica pura)

**Files:**
- Create: `src/app/features/tools/playground/playground.logic.ts`
- Test: `src/app/features/tools/playground/playground.logic.spec.ts`

**Interfaces:**
- Produces:
  - `type Viewport = 'desktop' | 'tablet' | 'mobile'`
  - `interface ConsoleLine { level: 'log'|'info'|'warn'|'error'; text: string }`
  - `interface Snippet { html: string; css: string; js: string }`
  - `const VIEWPORTS: Record<Viewport, number | null>`
  - `const DEFAULT_SNIPPET: Snippet`
  - `const CONSOLE_BOOTSTRAP: string`
  - `function formatConsoleArg(value: unknown): string`
  - `function buildSrcdoc(html: string, css: string, js: string): string`
  - `function buildExportDoc(html: string, css: string, js: string): string`

- [ ] **Step 1: Write the failing test**

Create `src/app/features/tools/playground/playground.logic.spec.ts`:

```ts
import {
  buildSrcdoc, buildExportDoc, formatConsoleArg, CONSOLE_BOOTSTRAP, VIEWPORTS, DEFAULT_SNIPPET,
} from './playground.logic';

describe('buildSrcdoc', () => {
  it('embeds css, html, bootstrap and user js in order', () => {
    const doc = buildSrcdoc('<h1>hi</h1>', 'h1{color:red}', 'var UNIQUE_USER_JS=1;');
    expect(doc.includes('<style>h1{color:red}</style>')).toBe(true);
    expect(doc.includes('<h1>hi</h1>')).toBe(true);
    expect(doc.includes(CONSOLE_BOOTSTRAP)).toBe(true);
    expect(doc.includes('var UNIQUE_USER_JS=1;')).toBe(true);
    // bootstrap must come before the user js so early logs are captured
    expect(doc.indexOf(CONSOLE_BOOTSTRAP) < doc.indexOf('var UNIQUE_USER_JS=1;')).toBe(true);
  });
});

describe('buildExportDoc', () => {
  it('embeds the three parts but NOT the console bootstrap', () => {
    const doc = buildExportDoc('<p>x</p>', 'p{margin:0}', 'console.log(1)');
    expect(doc.includes('<p>x</p>')).toBe(true);
    expect(doc.includes('<style>p{margin:0}</style>')).toBe(true);
    expect(doc.includes('console.log(1)')).toBe(true);
    expect(doc.includes(CONSOLE_BOOTSTRAP)).toBe(false);
  });
});

describe('formatConsoleArg', () => {
  it('formats primitives', () => {
    expect(formatConsoleArg('hi')).toBe('hi');
    expect(formatConsoleArg(42)).toBe('42');
    expect(formatConsoleArg(true)).toBe('true');
    expect(formatConsoleArg(undefined)).toBe('undefined');
    expect(formatConsoleArg(null)).toBe('null');
  });
  it('formats objects, arrays and errors', () => {
    expect(formatConsoleArg({ a: 1 })).toBe('{"a":1}');
    expect(formatConsoleArg([1, 2])).toBe('[1,2]');
    expect(formatConsoleArg(new Error('boom'))).toBe('Error: boom');
  });
  it('does not throw on circular references', () => {
    const o: Record<string, unknown> = {};
    o['self'] = o;
    expect(() => formatConsoleArg(o)).not.toThrow();
  });
  it('formats functions', () => {
    expect(formatConsoleArg(function foo() {})).toBe('ƒ foo()');
  });
});

describe('constants', () => {
  it('VIEWPORTS has desktop null, tablet 768, mobile 375', () => {
    expect(VIEWPORTS.desktop).toBe(null);
    expect(VIEWPORTS.tablet).toBe(768);
    expect(VIEWPORTS.mobile).toBe(375);
  });
  it('DEFAULT_SNIPPET has all three parts as strings', () => {
    expect(typeof DEFAULT_SNIPPET.html).toBe('string');
    expect(typeof DEFAULT_SNIPPET.css).toBe('string');
    expect(typeof DEFAULT_SNIPPET.js).toBe('string');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:ci -- src/app/features/tools/playground/playground.logic.spec.ts`
Expected: FAIL — cannot find module `./playground.logic`.

- [ ] **Step 3: Write minimal implementation**

Create `src/app/features/tools/playground/playground.logic.ts`:

```ts
export type Viewport = 'desktop' | 'tablet' | 'mobile';

export interface ConsoleLine {
  level: 'log' | 'info' | 'warn' | 'error';
  text: string;
}

export interface Snippet {
  html: string;
  css: string;
  js: string;
}

export const VIEWPORTS: Record<Viewport, number | null> = {
  desktop: null,
  tablet: 768,
  mobile: 375,
};

export const DEFAULT_SNIPPET: Snippet = {
  html: '<h1>Olá 👋</h1>\n<p>Edite HTML, CSS e JS ao lado.</p>',
  css: 'body { font-family: system-ui, sans-serif; padding: 1rem; }\nh1 { color: #2563eb; }',
  js: "console.log('Playground pronto');",
};

export function formatConsoleArg(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }
  if (typeof value === 'function') {
    return `ƒ ${(value as { name?: string }).name || 'anonymous'}()`;
  }
  if (value instanceof Error) return `${value.name}: ${value.message}`;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

// Injected INSIDE the sandboxed iframe. Cannot reference anything from the parent.
// Overrides console.* and error events, serializes args, postMessages to the parent.
export const CONSOLE_BOOTSTRAP = [
  '(function(){',
  'var ser=function(v){try{',
  "if(typeof v==='string')return v;",
  "if(v instanceof Error)return v.name+': '+v.message;",
  "if(typeof v==='function')return 'ƒ '+(v.name||'anonymous')+'()';",
  "if(typeof v==='object'&&v!==null)return JSON.stringify(v);",
  'return String(v);',
  '}catch(e){return String(v);}};',
  'var send=function(level,args){try{parent.postMessage({__pg:true,level:level,',
  "text:Array.prototype.map.call(args,ser).join(' ')},'*');}catch(e){}};",
  "['log','info','warn','error'].forEach(function(m){var o=console[m];",
  'console[m]=function(){send(m,arguments);try{o.apply(console,arguments);}catch(e){}};});',
  "window.addEventListener('error',function(e){send('error',[e.message]);});",
  "window.addEventListener('unhandledrejection',function(e){send('error',[String(e.reason)]);});",
  '})();',
].join('');

export function buildSrcdoc(html: string, css: string, js: string): string {
  return (
    '<!doctype html><html><head><meta charset="utf-8">' +
    `<style>${css}</style></head><body>${html}` +
    `<script>${CONSOLE_BOOTSTRAP}</script>` +
    `<script>${js}</script></body></html>`
  );
}

export function buildExportDoc(html: string, css: string, js: string): string {
  return (
    '<!doctype html><html><head><meta charset="utf-8">' +
    `<style>${css}</style></head><body>${html}` +
    `<script>${js}</script></body></html>`
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:ci -- src/app/features/tools/playground/playground.logic.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/features/tools/playground/playground.logic.ts src/app/features/tools/playground/playground.logic.spec.ts
git commit -m "feat(playground): pure logic — srcdoc/export builders, console format, bootstrap"
```

---

### Task 2: `debounce` helper

**Files:**
- Create: `src/app/shared/util/debounce.ts`
- Test: `src/app/shared/util/debounce.spec.ts`

**Interfaces:**
- Produces: `function debounce<A extends unknown[]>(fn: (...args: A) => void, ms: number): ((...args: A) => void) & { cancel(): void }`

- [ ] **Step 1: Write the failing test**

Create `src/app/shared/util/debounce.spec.ts`:

```ts
import { vi } from 'vitest';
import { debounce } from './debounce';

describe('debounce', () => {
  it('calls fn once after the delay, not per call', () => {
    vi.useFakeTimers();
    let calls = 0;
    const d = debounce(() => { calls++; }, 300);
    d(); d(); d();
    expect(calls).toBe(0);
    vi.advanceTimersByTime(300);
    expect(calls).toBe(1);
    vi.useRealTimers();
  });
  it('cancel() prevents a pending call', () => {
    vi.useFakeTimers();
    let calls = 0;
    const d = debounce(() => { calls++; }, 300);
    d();
    d.cancel();
    vi.advanceTimersByTime(300);
    expect(calls).toBe(0);
    vi.useRealTimers();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:ci -- src/app/shared/util/debounce.spec.ts`
Expected: FAIL — cannot find module `./debounce`.

- [ ] **Step 3: Write minimal implementation**

Create `src/app/shared/util/debounce.ts`:

```ts
export function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  ms: number,
): ((...args: A) => void) & { cancel(): void } {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const wrapped = (...args: A): void => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
  wrapped.cancel = (): void => {
    if (timer) clearTimeout(timer);
    timer = undefined;
  };
  return wrapped;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:ci -- src/app/shared/util/debounce.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/shared/util/debounce.ts src/app/shared/util/debounce.spec.ts
git commit -m "feat(util): debounce helper with cancel"
```

---

### Task 3: `CodeEditor` (CodeMirror 6 lazy + fallback)

**Files:**
- Modify: `package.json` (deps)
- Create: `src/app/features/tools/playground/editor/code-editor.ts`
- Create: `src/app/features/tools/playground/editor/code-editor.scss`
- Test: `src/app/features/tools/playground/editor/code-editor.spec.ts`

**Interfaces:**
- Produces: componente `CodeEditor` (selector `app-code-editor`), inputs `value: string`, `language: EditorLanguage`, `ariaLabel: string`; outputs `valueChange: EventEmitter<string>`, `run: EventEmitter<void>`. `type EditorLanguage = 'html' | 'css' | 'javascript'`. Campo público `useFallback: boolean` (true no server ou se o CodeMirror falhar).

- [ ] **Step 1: Install CodeMirror**

Run:
```bash
npm install codemirror @codemirror/state @codemirror/view @codemirror/lang-html @codemirror/lang-css @codemirror/lang-javascript
```
Expected: os pacotes entram em `dependencies`.

- [ ] **Step 2: Write the failing test (fallback contract)**

Create `src/app/features/tools/playground/editor/code-editor.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { CodeEditor } from './code-editor';

function make() {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [CodeEditor],
    providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
  });
  return TestBed.createComponent(CodeEditor);
}

describe('CodeEditor (fallback path on server)', () => {
  it('uses the textarea fallback when not in a browser', () => {
    const fixture = make();
    fixture.detectChanges();
    expect(fixture.componentInstance.useFallback).toBe(true);
  });
  it('emits valueChange from the fallback handler', () => {
    const fixture = make();
    let emitted = '';
    fixture.componentInstance.valueChange.subscribe((v: string) => (emitted = v));
    fixture.componentInstance.onFallback('hello');
    expect(emitted).toBe('hello');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm run test:ci -- src/app/features/tools/playground/editor/code-editor.spec.ts`
Expected: FAIL — cannot find module `./code-editor`.

- [ ] **Step 4: Write the component**

Create `src/app/features/tools/playground/editor/code-editor.ts`:

```ts
import {
  AfterViewInit, Component, ElementRef, EventEmitter, Input, NgZone, OnChanges,
  OnDestroy, Output, PLATFORM_ID, SimpleChanges, ViewChild, inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';

export type EditorLanguage = 'html' | 'css' | 'javascript';

@Component({
  selector: 'app-code-editor',
  standalone: true,
  imports: [FormsModule],
  template: `
    @if (useFallback) {
      <textarea
        class="cm-fallback"
        spellcheck="false"
        [ngModel]="value"
        (ngModelChange)="onFallback($event)"
        [attr.aria-label]="ariaLabel"></textarea>
    } @else {
      <div class="cm-host" #host [attr.aria-label]="ariaLabel"></div>
    }
  `,
  styleUrl: './code-editor.scss',
})
export class CodeEditor implements AfterViewInit, OnChanges, OnDestroy {
  @Input() value = '';
  @Input() language: EditorLanguage = 'html';
  @Input() ariaLabel = '';
  @Output() valueChange = new EventEmitter<string>();
  @Output() run = new EventEmitter<void>();
  @ViewChild('host') host?: ElementRef<HTMLElement>;

  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly zone = inject(NgZone);
  useFallback = !this.isBrowser;
  // Typed loosely: CodeMirror types are only available after the dynamic import.
  private view: { state: { doc: { toString(): string; length: number } }; dispatch(t: unknown): void; destroy(): void } | undefined;
  private lastEmitted = '';

  async ngAfterViewInit(): Promise<void> {
    if (!this.isBrowser) return;
    try {
      await this.mount();
    } catch {
      this.useFallback = true;
    }
  }

  private async mount(): Promise<void> {
    const [cm, view, state] = await Promise.all([
      import('codemirror'),
      import('@codemirror/view'),
      import('@codemirror/state'),
    ]);
    const langExt = await this.loadLanguage();
    const EditorView = cm.EditorView;
    const updateListener = EditorView.updateListener.of(u => {
      if (u.docChanged) {
        const text = u.state.doc.toString();
        this.lastEmitted = text;
        this.zone.run(() => this.valueChange.emit(text));
      }
    });
    const runKeymap = view.keymap.of([
      { key: 'Mod-Enter', run: () => { this.zone.run(() => this.run.emit()); return true; } },
    ]);
    const startState = state.EditorState.create({
      doc: this.value,
      extensions: [cm.basicSetup, langExt, updateListener, runKeymap, EditorView.lineWrapping],
    });
    this.view = new EditorView({ state: startState, parent: this.host!.nativeElement }) as unknown as typeof this.view;
  }

  private async loadLanguage(): Promise<unknown> {
    if (this.language === 'css') return (await import('@codemirror/lang-css')).css();
    if (this.language === 'javascript') return (await import('@codemirror/lang-javascript')).javascript();
    return (await import('@codemirror/lang-html')).html();
  }

  onFallback(value: string): void {
    this.lastEmitted = value;
    this.valueChange.emit(value);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['value'] || !this.view) return;
    if (this.value === this.lastEmitted) return;
    const current = this.view.state.doc.toString();
    if (current === this.value) return;
    this.view.dispatch({ changes: { from: 0, to: current.length, insert: this.value } });
  }

  ngOnDestroy(): void {
    this.view?.destroy();
  }
}
```

- [ ] **Step 5: Create the styles**

Create `src/app/features/tools/playground/editor/code-editor.scss`:

```scss
:host {
  display: block;
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
  background: var(--bg);
}
.cm-fallback {
  width: 100%;
  min-height: 120px;
  padding: 10px 12px;
  border: 0;
  background: var(--bg);
  color: var(--ink);
  font-family: ui-monospace, monospace;
  font-size: 0.8125rem;
  resize: vertical;
  &:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
}
.cm-host {
  min-height: 120px;
  font-size: 0.8125rem;
}
:host ::ng-deep .cm-editor { height: 100%; }
:host ::ng-deep .cm-editor.cm-focused { outline: 2px solid var(--accent); outline-offset: -2px; }
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm run test:ci -- src/app/features/tools/playground/editor/code-editor.spec.ts`
Expected: PASS (server platform → fallback path; no CodeMirror loaded in the test).

- [ ] **Step 7: Lint**

Run: `npm run lint`
Expected: 0 erros.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json src/app/features/tools/playground/editor/
git commit -m "feat(playground): CodeEditor with lazy CodeMirror 6 and textarea fallback"
```

---

### Task 4: `Playground` component (+ `ConsolePanel`, storage key)

**Files:**
- Modify: `src/app/core/storage-keys.ts`
- Create: `src/app/features/tools/playground/console-panel.ts`
- Create: `src/app/features/tools/playground/console-panel.scss`
- Create: `src/app/features/tools/playground/playground.ts`
- Create: `src/app/features/tools/playground/playground.scss`

**Interfaces:**
- Consumes: `buildSrcdoc`/`buildExportDoc`/`DEFAULT_SNIPPET`/`VIEWPORTS`/`Viewport`/`ConsoleLine`/`Snippet` (Task 1); `debounce` (Task 2); `CodeEditor` (Task 3); `ToolShell`; `StorageService`.
- Produces: componente `Playground` (exporta `Playground`, selector `app-playground`); componente `ConsolePanel` (selector `app-console-panel`, input `lines: ConsoleLine[]`, output `clear`).

- [ ] **Step 1: Add the storage key**

Em `src/app/core/storage-keys.ts`, adicionar ao final:

```ts
/** localStorage key for the persisted playground snippet (html/css/js JSON). */
export const PLAYGROUND_KEY = 'tools.playground.snippet';
```

- [ ] **Step 2: Create the console panel**

Create `src/app/features/tools/playground/console-panel.ts`:

```ts
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ConsoleLine } from './playground.logic';

@Component({
  selector: 'app-console-panel',
  standalone: true,
  template: `
    <div class="console">
      <div class="console-head">
        <span class="console-title" i18n="@@tools.playground.console">Console</span>
        <button type="button" class="console-clear" (click)="clear.emit()" i18n="@@tools.playground.clear">
          limpar
        </button>
      </div>
      <div class="console-body">
        @for (line of lines; track $index) {
          <div class="console-line" [class]="'lvl-' + line.level">{{ line.text }}</div>
        } @empty {
          <div class="console-empty" i18n="@@tools.playground.consoleEmpty">Sem saída ainda.</div>
        }
      </div>
    </div>
  `,
  styleUrl: './console-panel.scss',
})
export class ConsolePanel {
  @Input() lines: ConsoleLine[] = [];
  @Output() clear = new EventEmitter<void>();
}
```

- [ ] **Step 3: Create the console panel styles**

Create `src/app/features/tools/playground/console-panel.scss`:

```scss
.console {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
  min-height: 120px;
  max-height: 220px;
}
.console-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  border-bottom: 1px solid var(--border);
}
.console-title { font-size: 0.75rem; font-weight: 600; color: var(--muted); }
.console-clear {
  border: 0;
  background: transparent;
  color: var(--muted);
  font-size: 0.75rem;
  cursor: pointer;
  &:hover { color: var(--ink); }
  &:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
}
.console-body {
  overflow-y: auto;
  padding: 6px 10px;
  font-family: ui-monospace, monospace;
  font-size: 0.75rem;
}
.console-line { white-space: pre-wrap; word-break: break-word; padding: 1px 0; color: var(--ink); }
.console-line.lvl-warn { color: #b45309; }
.console-line.lvl-error { color: var(--danger); }
.console-empty { color: var(--muted); font-style: italic; }
```

> Nota: `#b45309` (âmbar de warning) — checar `_tokens.scss` por um token equivalente (ex. `--warn`); se existir, usar. Se não, adicionar `--warn` (claro `#b45309`, dark `#fbbf24`) em ambos os blocos e usar `var(--warn)`. Não deixar hex chumbado.

- [ ] **Step 4: Create the playground component**

Create `src/app/features/tools/playground/playground.ts`:

```ts
import {
  Component, ElementRef, OnDestroy, OnInit, PLATFORM_ID, Renderer2, ViewChild, computed, inject, signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ToolShell } from '../../../shared/ui/tool-shell/tool-shell';
import { CodeEditor } from './editor/code-editor';
import { ConsolePanel } from './console-panel';
import { StorageService } from '../../../core/storage.service';
import { PLAYGROUND_KEY } from '../../../core/storage-keys';
import { debounce } from '../../../shared/util/debounce';
import {
  buildSrcdoc, buildExportDoc, DEFAULT_SNIPPET, VIEWPORTS, Viewport, ConsoleLine, Snippet,
} from './playground.logic';

type EditorTab = 'html' | 'css' | 'javascript';

@Component({
  selector: 'app-playground',
  standalone: true,
  imports: [ToolShell, CodeEditor, ConsolePanel],
  template: `
    <app-tool-shell [title]="titleText" [description]="descText">
      <div class="pg">
        <!-- Mobile tabs -->
        <div class="pg-tabs" role="tablist" [attr.aria-label]="tabsLabel">
          <button type="button" role="tab" class="pg-tab" [class.active]="tab() === 'html'"
            [attr.aria-selected]="tab() === 'html'" (click)="tab.set('html')">HTML</button>
          <button type="button" role="tab" class="pg-tab" [class.active]="tab() === 'css'"
            [attr.aria-selected]="tab() === 'css'" (click)="tab.set('css')">CSS</button>
          <button type="button" role="tab" class="pg-tab" [class.active]="tab() === 'javascript'"
            [attr.aria-selected]="tab() === 'javascript'" (click)="tab.set('javascript')">JS</button>
        </div>

        <div class="pg-editors">
          <div class="pg-editor" [class.hidden-mobile]="tab() !== 'html'">
            <span class="pg-label">HTML</span>
            <app-code-editor language="html" [value]="html()" [ariaLabel]="'HTML'"
              (valueChange)="onHtml($event)" (run)="run()" />
          </div>
          <div class="pg-editor" [class.hidden-mobile]="tab() !== 'css'">
            <span class="pg-label">CSS</span>
            <app-code-editor language="css" [value]="css()" [ariaLabel]="'CSS'"
              (valueChange)="onCss($event)" (run)="run()" />
          </div>
          <div class="pg-editor" [class.hidden-mobile]="tab() !== 'javascript'">
            <span class="pg-label">JS</span>
            <app-code-editor language="javascript" [value]="js()" [ariaLabel]="'JavaScript'"
              (valueChange)="onJs($event)" (run)="run()" />
          </div>
        </div>

        <div class="pg-output">
          <div class="pg-toolbar">
            <div class="pg-viewports" role="group" [attr.aria-label]="viewportLabel">
              <button type="button" class="pg-vp" [class.active]="viewport() === 'desktop'"
                (click)="viewport.set('desktop')" [attr.aria-label]="desktopLabel">🖥</button>
              <button type="button" class="pg-vp" [class.active]="viewport() === 'tablet'"
                (click)="viewport.set('tablet')" [attr.aria-label]="tabletLabel">▭</button>
              <button type="button" class="pg-vp" [class.active]="viewport() === 'mobile'"
                (click)="viewport.set('mobile')" [attr.aria-label]="mobileLabel">▯</button>
            </div>
            <div class="pg-actions">
              <button type="button" class="pg-btn" (click)="run()" i18n="@@tools.playground.run">Run</button>
              <button type="button" class="pg-btn" (click)="stop()" i18n="@@tools.playground.stop">Stop</button>
              <label class="pg-auto">
                <input type="checkbox" [checked]="autoRun()" (change)="toggleAutoRun()" />
                <span i18n="@@tools.playground.auto">Auto</span>
              </label>
              <button type="button" class="pg-btn" (click)="export()" i18n="@@tools.playground.export">Export</button>
              <button type="button" class="pg-btn" (click)="reset()" i18n="@@tools.playground.reset">Reset</button>
            </div>
          </div>

          <div class="pg-preview">
            <iframe #frame class="pg-frame" [style.width]="frameWidth()"
              sandbox="allow-scripts" [attr.title]="previewLabel"></iframe>
          </div>

          <app-console-panel [lines]="consoleLines()" (clear)="clearConsole()" />
        </div>
      </div>
    </app-tool-shell>
  `,
  styleUrl: './playground.scss',
})
export class Playground implements OnInit, OnDestroy {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly storage = inject(StorageService);
  private readonly renderer = inject(Renderer2);
  @ViewChild('frame') frame?: ElementRef<HTMLIFrameElement>;

  readonly html = signal(DEFAULT_SNIPPET.html);
  readonly css = signal(DEFAULT_SNIPPET.css);
  readonly js = signal(DEFAULT_SNIPPET.js);
  readonly autoRun = signal(true);
  readonly consoleLines = signal<ConsoleLine[]>([]);
  readonly viewport = signal<Viewport>('desktop');
  readonly tab = signal<EditorTab>('html');
  readonly frameWidth = computed(() => {
    const w = VIEWPORTS[this.viewport()];
    return w === null ? '100%' : `${w}px`;
  });

  readonly titleText = $localize`:@@tools.playground.name:Playground HTML/CSS/JS`;
  readonly descText = $localize`:@@tools.playground.desc:Editor ao vivo de HTML, CSS e JS com preview e console.`;
  readonly tabsLabel = $localize`:@@tools.playground.tabs:Editores`;
  readonly viewportLabel = $localize`:@@tools.playground.viewport:Tamanho da tela`;
  readonly desktopLabel = $localize`:@@tools.playground.desktop:Desktop`;
  readonly tabletLabel = $localize`:@@tools.playground.tablet:Tablet`;
  readonly mobileLabel = $localize`:@@tools.playground.mobile:Mobile`;
  readonly previewLabel = $localize`:@@tools.playground.preview:Pré-visualização`;

  private unlistenMessage?: () => void;
  private readonly scheduleRun = debounce(() => this.run(), 300);
  private readonly scheduleSave = debounce(() => this.save(), 500);

  ngOnInit(): void {
    if (!this.isBrowser) return;
    this.restore();
    this.unlistenMessage = this.renderer.listen('window', 'message', (e: Event) =>
      this.onMessage(e as MessageEvent),
    );
    queueMicrotask(() => this.run());
  }

  onHtml(value: string): void { this.html.set(value); this.afterChange(); }
  onCss(value: string): void { this.css.set(value); this.afterChange(); }
  onJs(value: string): void { this.js.set(value); this.afterChange(); }

  private afterChange(): void {
    this.scheduleSave();
    if (this.autoRun()) this.scheduleRun();
  }

  run(): void {
    if (!this.isBrowser || !this.frame) return;
    this.consoleLines.set([]);
    this.frame.nativeElement.srcdoc = buildSrcdoc(this.html(), this.css(), this.js());
  }

  stop(): void {
    if (!this.frame) return;
    this.frame.nativeElement.srcdoc = '<!doctype html>';
  }

  toggleAutoRun(): void {
    this.autoRun.update(v => !v);
    if (this.autoRun()) this.run();
  }

  clearConsole(): void { this.consoleLines.set([]); }

  reset(): void {
    this.html.set(DEFAULT_SNIPPET.html);
    this.css.set(DEFAULT_SNIPPET.css);
    this.js.set(DEFAULT_SNIPPET.js);
    this.save();
    this.run();
  }

  export(): void {
    if (!this.isBrowser) return;
    const doc = buildExportDoc(this.html(), this.css(), this.js());
    const blob = new Blob([doc], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = this.renderer.createElement('a') as HTMLAnchorElement;
    a.href = url;
    a.download = 'playground.html';
    a.click();
    URL.revokeObjectURL(url);
  }

  private onMessage(e: MessageEvent): void {
    if (!this.frame) return;
    if (e.source !== this.frame.nativeElement.contentWindow) return;
    const data = e.data as { __pg?: boolean; level?: ConsoleLine['level']; text?: unknown } | null;
    if (!data || data.__pg !== true || !data.level) return;
    const line: ConsoleLine = { level: data.level, text: String(data.text) };
    this.consoleLines.update(lines => [...lines, line].slice(-200));
  }

  private restore(): void {
    const raw = this.storage.getLocal(PLAYGROUND_KEY);
    if (!raw) return;
    try {
      const s = JSON.parse(raw) as Partial<Snippet>;
      if (typeof s.html === 'string') this.html.set(s.html);
      if (typeof s.css === 'string') this.css.set(s.css);
      if (typeof s.js === 'string') this.js.set(s.js);
    } catch {
      // ignore corrupt storage
    }
  }

  private save(): void {
    const snippet: Snippet = { html: this.html(), css: this.css(), js: this.js() };
    this.storage.setLocal(PLAYGROUND_KEY, JSON.stringify(snippet));
  }

  ngOnDestroy(): void {
    this.unlistenMessage?.();
    this.scheduleRun.cancel();
    this.scheduleSave.cancel();
  }
}
```

- [ ] **Step 5: Create the playground styles**

Create `src/app/features/tools/playground/playground.scss`:

```scss
.pg { display: flex; flex-direction: column; gap: 14px; }

.pg-tabs { display: none; gap: 6px; }
.pg-tab {
  padding: 6px 14px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface);
  color: var(--muted);
  font-size: 0.8125rem;
  cursor: pointer;
  &.active { border-color: var(--accent); color: var(--ink); }
  &:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
}

.pg-editors { display: flex; flex-direction: column; gap: 10px; }
.pg-editor { display: flex; flex-direction: column; gap: 4px; }
.pg-label { font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--muted); }

.pg-output { display: flex; flex-direction: column; gap: 12px; }
.pg-toolbar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; }
.pg-viewports, .pg-actions { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.pg-vp {
  width: 32px; height: 30px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  color: var(--muted);
  cursor: pointer;
  &.active { border-color: var(--accent); color: var(--ink); }
  &:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
}
.pg-btn {
  padding: 6px 14px;
  border: 1.5px solid var(--ink);
  border-radius: 999px;
  background: transparent;
  color: var(--ink);
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  &:hover { background: var(--ink); color: var(--bg); }
  &:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
}
.pg-auto { display: inline-flex; align-items: center; gap: 5px; font-size: 0.8125rem; color: var(--muted); cursor: pointer; }

.pg-preview {
  display: flex;
  justify-content: center;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: #fff;
  overflow: auto;
  min-height: 260px;
}
.pg-frame { height: 320px; max-width: 100%; border: 0; background: #fff; }

@media (min-width: 1024px) {
  .pg {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
    align-items: start;
  }
  .pg-editors { grid-column: 1; }
  .pg-output { grid-column: 2; }
}

@media (max-width: 699px) {
  .pg-tabs { display: flex; }
  .pg-editor.hidden-mobile { display: none; }
  .pg-editor .pg-label { display: none; }
}

@media (prefers-reduced-motion: reduce) {
  .pg-tab, .pg-vp, .pg-btn { transition: none; }
}
```

> Nota: `#fff` no fundo do preview é intencional — o iframe do usuário deve renderizar sobre branco neutro (não sobre o tema do site), como um navegador. Mantê-lo literal é aceitável aqui; se preferir, criar `--preview-bg: #ffffff` em ambos os temas. Documente a escolha no report.

- [ ] **Step 6: Lint**

Run: `npm run lint`
Expected: 0 erros. (O componente ainda não é roteado; isso é resolvido na Task 6. **Não rode `npm run build`** ainda.)

- [ ] **Step 7: Commit**

```bash
git add src/app/core/storage-keys.ts src/app/features/tools/playground/console-panel.ts src/app/features/tools/playground/console-panel.scss src/app/features/tools/playground/playground.ts src/app/features/tools/playground/playground.scss
git commit -m "feat(playground): main component with iframe sandbox, console, viewport, persistence, export"
```

---

### Task 5: Extrair `markdown-preview`

**Files:**
- Create: `src/app/features/tools/markdown-preview/render.logic.ts`
- Create: `src/app/features/tools/markdown-preview/render.logic.spec.ts`
- Create: `src/app/features/tools/markdown-preview/markdown-preview.ts`
- Create: `src/app/features/tools/markdown-preview/markdown-preview.scss`

**Interfaces:**
- Consumes: `ToolShell`; libs `marked`, `dompurify`.
- Produces: componente `MarkdownPreview` (selector `app-markdown-preview`); `render.logic.ts` reexporta `renderMarkdown`, `sanitizeHtml`.

> Copia a lógica de markdown da tool antiga para a nova pasta (a antiga é removida na Task 6). Não deixa o preview de HTML cru — esta tool é só Markdown.

- [ ] **Step 1: Create the logic (copy of the working markdown logic)**

Create `src/app/features/tools/markdown-preview/render.logic.ts`:

```ts
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
```

- [ ] **Step 2: Create the logic test**

Create `src/app/features/tools/markdown-preview/render.logic.spec.ts`:

```ts
import { sanitizeHtml, renderMarkdown } from './render.logic';

describe('sanitizeHtml', () => {
  it('delegates to the injected purifier', () => {
    const purify = { sanitize: (s: string) => s.replace(/<script>.*?<\/script>/g, '') };
    expect(sanitizeHtml('<b>x</b><script>evil()</script>', purify)).toBe('<b>x</b>');
  });
});

describe('renderMarkdown', () => {
  it('renders headings and emphasis to HTML', async () => {
    const html = await renderMarkdown('# Hi\n\n**bold**');
    expect(html.includes('<h1')).toBe(true);
    expect(html.includes('<strong>bold</strong>')).toBe(true);
  });
  it('returns empty string for empty input', async () => {
    expect(await renderMarkdown('')).toBe('');
  });
});
```

- [ ] **Step 3: Run test to verify it passes**

Run: `npm run test:ci -- src/app/features/tools/markdown-preview/render.logic.spec.ts`
Expected: PASS.

- [ ] **Step 4: Create the component (markdown-only)**

Create `src/app/features/tools/markdown-preview/markdown-preview.ts`:

```ts
import { Component, PLATFORM_ID, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';
import { ToolShell } from '../../../shared/ui/tool-shell/tool-shell';
import { renderMarkdown, sanitizeHtml } from './render.logic';

@Component({
  selector: 'app-markdown-preview',
  standalone: true,
  imports: [FormsModule, ToolShell],
  template: `
    <app-tool-shell [title]="titleText" [description]="descText">
      <div class="split">
        <textarea
          class="field"
          rows="16"
          [ngModel]="source()"
          (ngModelChange)="onInput($event)"
          [attr.placeholder]="placeholderText"
          [attr.aria-label]="editorLabel"></textarea>
        <div class="preview" [innerHTML]="preview()" [attr.aria-label]="previewLabel"></div>
      </div>
    </app-tool-shell>
  `,
  styleUrl: './markdown-preview.scss',
})
export class MarkdownPreview {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly source = signal('');
  readonly preview = signal('');

  readonly titleText = $localize`:@@tools.markdown-preview.name:Markdown Preview`;
  readonly descText = $localize`:@@tools.markdown-preview.desc:Escreva Markdown e veja o preview ao vivo.`;
  readonly placeholderText = $localize`:@@tools.markdown-preview.placeholder:Escreva Markdown…`;
  readonly editorLabel = $localize`:@@tools.markdown-preview.editor:Editor`;
  readonly previewLabel = $localize`:@@tools.markdown-preview.preview:Pré-visualização`;

  onInput(value: string): void {
    this.source.set(value);
    void this.rerender();
  }

  private async rerender(): Promise<void> {
    if (!this.isBrowser) return;
    const raw = await renderMarkdown(this.source());
    const { default: DOMPurify } = await import('dompurify');
    this.preview.set(sanitizeHtml(raw, DOMPurify));
  }
}
```

- [ ] **Step 5: Create the styles**

Create `src/app/features/tools/markdown-preview/markdown-preview.scss`:

```scss
.split { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
@media (max-width: 700px) { .split { grid-template-columns: 1fr; } }
.field {
  width: 100%;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--ink);
  font-family: ui-monospace, monospace;
  font-size: 0.8125rem;
  resize: vertical;
  &:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
}
.preview {
  padding: 12px 16px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--ink);
  overflow-x: auto;
  h1, h2, h3 { color: var(--ink); }
  a { color: var(--accent); }
  code { font-family: ui-monospace, monospace; }
}
```

- [ ] **Step 6: Lint**

Run: `npm run lint`
Expected: 0 erros. (Ainda não roteado; **não rode build**.)

- [ ] **Step 7: Commit**

```bash
git add src/app/features/tools/markdown-preview/
git commit -m "feat(tools): extract markdown-preview tool"
```

---

### Task 6: Trocar catálogo + rotas, remover a tool antiga

**Files:**
- Modify: `src/data/tools.ts`
- Modify: `src/data/tools.spec.ts`
- Modify: `src/app/app.routes.ts`
- Delete: `src/app/features/tools/html-markdown-render/` (pasta inteira)

**Interfaces:**
- Consumes: `Playground` (Task 4), `MarkdownPreview` (Task 5).

- [ ] **Step 1: Update the catalog test first**

Em `src/data/tools.spec.ts`, no teste `marks the three MVP tools live, rest soon`, trocar o array esperado para refletir os novos slugs live:

```ts
  it('marks the live tools', () => {
    const live = TOOLS.filter(t => t.status === 'live').map(t => t.slug).sort();
    expect(live).toEqual(['hash', 'json-tools', 'markdown-preview', 'playground']);
  });
```

- [ ] **Step 2: Run the catalog test to verify it fails**

Run: `npm run test:ci -- src/data/tools.spec.ts`
Expected: FAIL — `html-markdown-render` ainda presente / novos slugs ausentes.

- [ ] **Step 3: Update the catalog**

Em `src/data/tools.ts`, **remover** o objeto com `slug: 'html-markdown-render'` e **adicionar** (no grupo `dev`, junto aos outros):

```ts
  {
    slug: 'playground',
    name: $localize`:@@tools.playground.name:Playground HTML/CSS/JS`,
    description: $localize`:@@tools.playground.desc:Editor ao vivo de HTML, CSS e JS com preview e console.`,
    group: 'dev', icon: '</>', status: 'live',
  },
  {
    slug: 'markdown-preview',
    name: $localize`:@@tools.markdown-preview.name:Markdown Preview`,
    description: $localize`:@@tools.markdown-preview.desc:Escreva Markdown e veja o preview ao vivo.`,
    group: 'dev', icon: '📝', status: 'live',
  },
```

- [ ] **Step 4: Run the catalog test to verify it passes**

Run: `npm run test:ci -- src/data/tools.spec.ts`
Expected: PASS.

- [ ] **Step 5: Swap the routes**

Em `src/app/app.routes.ts`, **remover** a rota `tools/html-markdown-render` e **adicionar**:

```ts
  {
    path: 'tools/playground',
    loadComponent: () => import('./features/tools/playground/playground').then(m => m.Playground),
  },
  {
    path: 'tools/markdown-preview',
    loadComponent: () =>
      import('./features/tools/markdown-preview/markdown-preview').then(m => m.MarkdownPreview),
  },
```

- [ ] **Step 6: Delete the old tool folder**

Run:
```bash
git rm -r src/app/features/tools/html-markdown-render
```
Expected: os 5 arquivos da tool antiga (`render.logic.ts`, `render.logic.spec.ts`, `html-markdown-render.ts`, `html-markdown-render.scss`) removidos.

- [ ] **Step 7: Verify tests + lint**

Run: `npm run test:ci && npm run lint`
Expected: testes verdes (sem os specs antigos, com os novos), lint 0 erros. **Ainda não rode build** — os novos IDs i18n não têm target en (Task 7).

- [ ] **Step 8: Commit**

```bash
git add src/data/tools.ts src/data/tools.spec.ts src/app/app.routes.ts
git commit -m "feat(tools): route playground + markdown-preview, remove html-markdown-render"
```

---

### Task 7: i18n — extração, tradução en e verificação

**Files:**
- Modify: `src/locale/messages.xlf`
- Modify: `src/locale/messages.en.xlf`

**Interfaces:**
- Consumes: todos os IDs `@@tools.playground.*` e `@@tools.markdown-preview.*` (Tasks 4-6). Os IDs antigos `@@tools.html-markdown-render.*` e `@@tools.render.*` deixam de existir.

- [ ] **Step 1: Extract i18n**

Run: `npx ng extract-i18n --output-path src/locale`
Expected: `messages.xlf` regenerado — novos IDs presentes, IDs `@@tools.render.*` / `@@tools.html-markdown-render.*` ausentes.

- [ ] **Step 2: Fill English targets**

Em `src/locale/messages.en.xlf`, adicionar `<target>` para cada novo trans-unit (preservar os existentes; **remover** os trans-units órfãos `@@tools.render.*` e o antigo `@@tools.html-markdown-render.*` se o extract não os tiver removido):

| ID | target (en) |
|---|---|
| `@@tools.playground.name` | `HTML/CSS/JS Playground` |
| `@@tools.playground.desc` | `Live HTML, CSS and JS editor with preview and console.` |
| `@@tools.playground.tabs` | `Editors` |
| `@@tools.playground.viewport` | `Screen size` |
| `@@tools.playground.desktop` | `Desktop` |
| `@@tools.playground.tablet` | `Tablet` |
| `@@tools.playground.mobile` | `Mobile` |
| `@@tools.playground.preview` | `Preview` |
| `@@tools.playground.run` | `Run` |
| `@@tools.playground.stop` | `Stop` |
| `@@tools.playground.auto` | `Auto` |
| `@@tools.playground.export` | `Export` |
| `@@tools.playground.reset` | `Reset` |
| `@@tools.playground.console` | `Console` |
| `@@tools.playground.clear` | `clear` |
| `@@tools.playground.consoleEmpty` | `No output yet.` |
| `@@tools.markdown-preview.name` | `Markdown Preview` |
| `@@tools.markdown-preview.desc` | `Write Markdown and see the live preview.` |
| `@@tools.markdown-preview.placeholder` | `Write Markdown…` |
| `@@tools.markdown-preview.editor` | `Editor` |
| `@@tools.markdown-preview.preview` | `Preview` |

- [ ] **Step 3: Build and verify parity**

Run: `npm run build`
Expected: build conclui (2 locales). Se reclamar de tradução faltando, preencher.

Verificar contagem:
```bash
grep -c '<source' src/locale/messages.xlf
grep -c '<target' src/locale/messages.en.xlf
```
Expected: números iguais (todo source tem target).

- [ ] **Step 4: Verify both locales render**

Run:
```bash
grep -o 'Playground' dist/portfolio/browser/tools/playground/index.html | head -1
grep -o 'Playground' dist/portfolio/browser/en/tools/playground/index.html | head -1
grep -o 'Escreva Markdown\|Write Markdown' dist/portfolio/browser/tools/markdown-preview/index.html | head -1
grep -o 'Escreva Markdown\|Write Markdown' dist/portfolio/browser/en/tools/markdown-preview/index.html | head -1
```
Expected: playground existe em ambos; markdown-preview mostra pt em `/` e en em `/en/`.

- [ ] **Step 5: Commit**

```bash
git add src/locale/messages.xlf src/locale/messages.en.xlf
git commit -m "i18n(playground): extract and translate playground + markdown-preview strings"
```

---

### Task 8: Verificação final da onda

- [ ] **Step 1: Suíte + lint + build**

Run: `npm run lint && npm run test:ci && npm run build`
Expected: lint 0 erros (só os 4 warnings a11y pré-existentes); todos os testes verdes; build 2 locales.

- [ ] **Step 2: Conferir rotas prerenderizadas**

Run:
```bash
ls dist/portfolio/browser/tools/playground dist/portfolio/browser/tools/markdown-preview
ls dist/portfolio/browser/en/tools/playground dist/portfolio/browser/en/tools/markdown-preview
test ! -d dist/portfolio/browser/tools/html-markdown-render && echo "old tool gone"
```
Expected: `index.html` nas rotas novas (pt+en); a rota antiga não existe mais.

- [ ] **Step 3: Conferir budget / lazy do CodeMirror**

Verificar a saída do build: nenhum warning novo de budget `initial`; os chunks de CodeMirror aparecem como lazy (nomes `chunk-*`/`code-editor-*`), não no initial.

- [ ] **Step 4: Finalizar**

Usar a skill `superpowers:finishing-a-development-branch`.

---

## Self-Review (autor do plano)

**Cobertura do spec:**
- Playground HTML+CSS+JS com preview ao vivo → Tasks 1, 4. ✓
- Execução isolada (iframe sandbox, sem allow-same-origin) → Task 4 (template `sandbox="allow-scripts"`). ✓
- Console pane via postMessage/bootstrap → Tasks 1 (`CONSOLE_BOOTSTRAP`), 4 (`onMessage`, `ConsolePanel`). ✓
- Auto-run debounce + toggle + Run/Stop + Ctrl+Enter → Tasks 2 (`debounce`), 3 (`run` output no `Mod-Enter`), 4. ✓
- Viewport D/T/M → Tasks 1 (`VIEWPORTS`), 4 (`frameWidth`). ✓
- CodeMirror lazy + fallback → Task 3. ✓
- Persistência + export → Task 4 (`restore`/`save`/`export`), Task 1 (`buildExportDoc`). ✓
- Responsivo mobile+desktop → Task 4 (`playground.scss` grid + tabs). ✓
- Split: markdown-preview extraído, html-markdown-render removido → Tasks 5, 6. ✓
- i18n pt/en + paridade → Task 7. ✓
- Catálogo/rotas atualizados → Task 6. ✓
- SSR-safe + cleanup → Task 4 (`isPlatformBrowser`, `OnDestroy`). ✓
- Testes puros (TDD) → Tasks 1, 2, 3, 5. ✓

**Fora desta onda (backlog):** sub-projeto A (identidade/popup/redesign do hub); `color-tools` clone do color.review; divisórias arrastáveis; share por URL; pré-processadores.

**Placeholder scan:** sem TBD/TODO; todo step de código tem código real. Os dois pontos condicionais (token `--warn` no console; `#fff`/`--preview-bg` no preview) trazem instrução explícita de resolução — não são placeholders de implementação.

**Consistência de tipos:** `buildSrcdoc`/`buildExportDoc`/`formatConsoleArg`/`CONSOLE_BOOTSTRAP`/`VIEWPORTS`/`DEFAULT_SNIPPET`/`Viewport`/`ConsoleLine`/`Snippet` (Task 1) usados igual em Task 4. `debounce().cancel()` (Task 2) usado em Task 4 (`scheduleRun.cancel()`). `CodeEditor` inputs/outputs (`value`/`language`/`ariaLabel`/`valueChange`/`run`, Task 3) batem com o uso no template da Task 4. `PLAYGROUND_KEY` (Task 4 Step 1) usado no mesmo componente. Exports `Playground`/`MarkdownPreview` batem com os `loadComponent` da Task 6. `renderMarkdown`/`sanitizeHtml` (Task 5) idênticos aos removidos na Task 6.
```
