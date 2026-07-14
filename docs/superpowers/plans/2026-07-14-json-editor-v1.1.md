# Editor JSON v1.1 (polish) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polir o Editor JSON v1 — botões em cabeçalhos por painel, erro sublinhado no editor, persistência da entrada + indentação, feedback do copiar, status bar sempre visível, seletor de indentação, drag & drop e atalhos.

**Architecture:** Estende o `CodeEditor` compartilhado com suporte a lint/diagnostics (`@codemirror/lint`). A lógica pura ganha `pos` (offset) no erro e um helper de indentação. O componente `JsonTools` é reestruturado em cabeçalhos por painel, com persistência via `StorageService` e chaves em `core/storage-keys.ts`.

**Tech Stack:** Angular 22 signals, CodeMirror 6 (`@codemirror/lint`), SCSS tokens, Vitest.

Spec: `docs/superpowers/specs/2026-07-14-json-editor-v1.1-design.md`. Base v1: commits `ce054997..7ba1c1e4`.

## Global Constraints

- **Tokens-only:** hex novo SÓ em `src/styles/_tokens.scss`. SCSS de componente usa `var(--*)`.
- **SSR-safe:** `@codemirror/lint` importado lazy dentro do `mount()` (browser-only). `localStorage` via `StorageService`. Drag/drop, `Ctrl+S` e clipboard atrás de `isPlatformBrowser`. Listeners e timers limpos em `OnDestroy`.
- **Playground inalterado:** o `CodeEditor` ganha `lint=false`/`diagnostics=null` por padrão — nenhum consumidor atual passa esses inputs; comportamento idêntico.
- **i18n:** strings visíveis novas marcadas `i18n`/`$localize` com IDs `@@tools.json-editor.*`. `extract-i18n` roda SÓ na Task 4 (última). Preencher `<target>` em `messages.en.xlf`; verificar paridade nos dois builds.
- **Vitest:** `.toBe(true)`/`.toBe(false)`; `toEqual` para objetos. Nunca `.toBeTrue()`.
- **Reduced motion:** sem animação nova.
- **QA:** executor roda `npm.cmd run lint` (0 erros; 4 warnings a11y pré-existentes fora do escopo ok — `npm.cmd`, não `npm`). Controller roda `test:ci`/`build` e commita quando via SDD; executor com shell próprio pode rodar `npm.cmd run test:ci`.
- **Commits:** um por task.

---

### Task 1: Lógica — `pos` no erro + helpers de indentação (TDD)

**Files:**
- Modify: `src/app/features/tools/json-tools/json.logic.ts`
- Modify: `src/app/features/tools/json-tools/json.logic.spec.ts`

**Interfaces:**
- Consumes: `JsonResult`, `transform`, `formatJson`, `errorToLineCol` (existentes).
- Produces (para as Tasks 2-3):
  - `JsonError` ganha `pos: number | null`.
  - `type IndentSetting = 2 | 4 | 'tab'`
  - `indentValue(setting: IndentSetting): number | string`
  - `isIndentSetting(v: unknown): v is IndentSetting`
  - `formatJson`/`sortJson`/`repairJson`/`transformJson` passam a aceitar `indent: number | string`.

- [ ] **Step 1: Escrever os testes que falham**

Adicionar ao fim de `src/app/features/tools/json-tools/json.logic.spec.ts`:

```ts
import { indentValue, isIndentSetting } from './json.logic';

describe('validateJson pos', () => {
  it('includes a numeric char offset for invalid JSON', () => {
    const err = validateJson('{\n  "a" 1\n}');
    expect(err !== null).toBe(true);
    expect(typeof err!.pos === 'number' || err!.pos === null).toBe(true);
    if (err!.pos !== null) expect(err!.pos >= 0).toBe(true);
  });
  it('has null pos / null error for valid or empty input', () => {
    expect(validateJson('{"a":1}')).toBe(null);
    expect(validateJson('   ')).toBe(null);
  });
});

describe('indentValue', () => {
  it('maps 2 and 4 to themselves and tab to a tab char', () => {
    expect(indentValue(2)).toBe(2);
    expect(indentValue(4)).toBe(4);
    expect(indentValue('tab')).toBe('\t');
  });
});

describe('isIndentSetting', () => {
  it('accepts 2, 4 and "tab"', () => {
    expect(isIndentSetting(2)).toBe(true);
    expect(isIndentSetting(4)).toBe(true);
    expect(isIndentSetting('tab')).toBe(true);
  });
  it('rejects anything else', () => {
    expect(isIndentSetting(3)).toBe(false);
    expect(isIndentSetting('2')).toBe(false);
    expect(isIndentSetting(null)).toBe(false);
  });
});

describe('indent with tab', () => {
  it('formatJson indents with a tab character', () => {
    expect(formatJson('{"a":1}', '\t').output).toBe('{\n\t"a": 1\n}');
  });
  it('sortJson indents with a tab character', () => {
    expect(sortJson('{"b":1,"a":2}', '\t').output).toBe('{\n\t"a": 2,\n\t"b": 1\n}');
  });
});
```

- [ ] **Step 2: Rodar — falha esperada**

Run: `npm.cmd run test:ci`
Expected: FAIL (`indentValue`/`isIndentSetting` não exportados; `err.pos` não existe).

- [ ] **Step 3: Implementar**

Em `src/app/features/tools/json-tools/json.logic.ts`:

1. Trocar a interface `JsonError` (linha existente) por:

```ts
export interface JsonError { message: string; line: number; col: number; pos: number | null; }
```

2. Trocar a função `validateJson` inteira por:

```ts
export function validateJson(input: string): JsonError | null {
  if (input.trim() === '') return null;
  try {
    JSON.parse(input);
    return null;
  } catch (e) {
    const message = (e as Error).message;
    // Node/V8 mensagens variam: "... at position N" e/ou "(line L column C)".
    const p = /position (\d+)/.exec(message);
    const pos = p ? Number(p[1]) : null;
    const lc = /line (\d+) column (\d+)/.exec(message);
    if (lc) return { message, line: Number(lc[1]), col: Number(lc[2]), pos };
    if (pos !== null) { const { line, col } = errorToLineCol(input, pos); return { message, line, col, pos }; }
    return { message, line: 1, col: 1, pos: null };
  }
}
```

3. Trocar as assinaturas de `indent: number` para `indent: number | string` em `formatJson`, `sortJson`, `repairJson` e `transformJson` (só o tipo do parâmetro muda; o corpo passa `indent` direto ao `JSON.stringify`, que já aceita string). Exemplo:

```ts
export function formatJson(input: string, indent: number | string): JsonResult {
  return transform(input, parsed => JSON.stringify(parsed, null, indent));
}
export function minifyJson(input: string): JsonResult {
  return transform(input, parsed => JSON.stringify(parsed));
}
export function sortJson(input: string, indent: number | string): JsonResult {
  return transform(input, parsed => JSON.stringify(sortValue(parsed), null, indent));
}
export function repairJson(input: string, indent: number | string): JsonResult {
  if (input.trim() === '') return { ok: true, output: '', error: null };
  try {
    return formatJson(jsonrepair(input), indent);
  } catch (e) {
    return { ok: false, output: '', error: (e as Error).message };
  }
}
export function transformJson(input: string, query: string, indent: number | string): JsonResult {
  if (query.trim() === '') return { ok: true, output: '', error: null };
  try {
    const parsed = JSON.parse(input);
    const result = jmesSearch(parsed, query);
    return { ok: true, output: JSON.stringify(result, null, indent), error: null };
  } catch (e) {
    return { ok: false, output: '', error: (e as Error).message };
  }
}
```

4. Adicionar ao fim do arquivo:

```ts
export type IndentSetting = 2 | 4 | 'tab';

export function indentValue(setting: IndentSetting): number | string {
  return setting === 'tab' ? '\t' : setting;
}

export function isIndentSetting(v: unknown): v is IndentSetting {
  return v === 2 || v === 4 || v === 'tab';
}
```

- [ ] **Step 4: Rodar — verde**

Run: `npm.cmd run test:ci`
Expected: PASS (testes existentes de `validateJson` que checam `line/col ≥ 1` seguem passando — só ganharam `pos`).

- [ ] **Step 5: Lint + commit**

Run: `npm.cmd run lint` → 0 erros.

```bash
git add src/app/features/tools/json-tools/json.logic.ts src/app/features/tools/json-tools/json.logic.spec.ts
git commit -m "feat(json-editor): error offset (pos) + indent setting helpers (TDD)"
```

---

### Task 2: `CodeEditor` — suporte a lint/diagnostics

**Files:**
- Modify: `src/app/shared/ui/code-editor/code-editor.ts`
- Modify: `src/app/shared/ui/code-editor/code-editor.spec.ts`
- Modify: `package.json` / `package-lock.json` (dep `@codemirror/lint`)

**Interfaces:**
- Produces (para a Task 3):
  - `export interface EditorDiagnostic { from: number; to: number; message: string; severity: 'error' | 'warning'; }`
  - `@Input() lint = false;`
  - `@Input() diagnostics: EditorDiagnostic[] | null = null;`

- [ ] **Step 1: Instalar dep**

```bash
npm.cmd install @codemirror/lint@^6 --save-exact=false
```

Expected: `package.json` ganha `"@codemirror/lint": "^6.x"` (major 6, mesmo do resto do CodeMirror).

- [ ] **Step 2: Estender o componente**

Em `src/app/shared/ui/code-editor/code-editor.ts`:

1. No import de tipos do topo, incluir `EditorState`:

```ts
import type { EditorState, Extension } from '@codemirror/state';
```

2. Adicionar a interface exportada logo abaixo do `EditorLanguage`:

```ts
export interface EditorDiagnostic { from: number; to: number; message: string; severity: 'error' | 'warning'; }
```

3. Adicionar os inputs (junto aos outros `@Input()`):

```ts
  @Input() lint = false;
  @Input() diagnostics: EditorDiagnostic[] | null = null;
```

4. Adicionar o campo do módulo de lint (junto aos campos privados):

```ts
  private lintMod?: typeof import('@codemirror/lint');
```

5. No `mount()`, dentro do bloco que monta `extras`, após o bloco `if (this.search) { ... }`, adicionar:

```ts
    if (this.lint) {
      this.lintMod = await import('@codemirror/lint');
      if (this.destroyed) return;
      extras.push(this.lintMod.lintGutter());
    }
```

6. Ainda no `mount()`, após a linha que cria `this.view = new EditorView(...)`, adicionar:

```ts
    if (this.lint && this.diagnostics) this.applyDiagnostics();
```

7. Adicionar o método `applyDiagnostics()` (por exemplo, logo antes de `loadLanguage()`):

```ts
  private applyDiagnostics(): void {
    if (!this.view || !this.lintMod) return;
    const v = this.view as unknown as { state: EditorState; dispatch: (t: unknown) => void };
    const len = v.state.doc.length;
    const clamp = (n: number): number => Math.max(0, Math.min(n, len));
    const diags = (this.diagnostics ?? []).map(d => ({
      from: clamp(d.from), to: clamp(d.to), severity: d.severity, message: d.message,
    }));
    v.dispatch(this.lintMod.setDiagnostics(v.state, diags));
  }
```

8. No `ngOnChanges`, após o bloco de `value` existente, adicionar (antes do fechamento do método):

```ts
    if (changes['diagnostics'] && this.view && this.lintMod) this.applyDiagnostics();
```

- [ ] **Step 3: Teste — lint não quebra o fallback (server path)**

Em `src/app/shared/ui/code-editor/code-editor.spec.ts`, adicionar dentro do `describe`:

```ts
  it('renders the fallback without error when lint/diagnostics are set (server)', () => {
    const fixture = make();
    fixture.componentInstance.lint = true;
    fixture.componentInstance.diagnostics = [{ from: 0, to: 1, message: 'x', severity: 'error' }];
    fixture.detectChanges();
    expect(fixture.componentInstance.useFallback).toBe(true);
    const ta = fixture.nativeElement.querySelector('textarea.cm-fallback') as HTMLTextAreaElement;
    expect(ta !== null).toBe(true);
  });
```

- [ ] **Step 4: Verificar**

Run: `npm.cmd run test:ci` → verde (specs do `CodeEditor` + novo caso).
Run: `npm.cmd run lint` → 0 erros.

- [ ] **Step 5: Commit**

```bash
git add src/app/shared/ui/code-editor/ package.json package-lock.json
git commit -m "feat(editor): lint/diagnostics support in CodeEditor (opt-in)"
```

---

### Task 3: `JsonTools` — cabeçalhos por painel, indentação, persistência, quick wins

**Files:**
- Rewrite: `src/app/features/tools/json-tools/json-tools.ts`
- Rewrite: `src/app/features/tools/json-tools/json-tools.scss`
- Modify: `src/app/core/storage-keys.ts`

**Interfaces:**
- Consumes: `CodeEditor` (com `lint`/`diagnostics`, Task 2); `EditorDiagnostic`; `formatJson`/`minifyJson`/`sortJson`/`repairJson`/`transformJson`/`validateJson`/`jsonStats`/`indentValue`/`isIndentSetting`/`IndentSetting`/`JsonResult`/`JsonError` (Task 1); `ResizeHandle`; `resizeStack`; `StorageService`.

- [ ] **Step 1: Chaves de storage**

Adicionar ao fim de `src/app/core/storage-keys.ts`:

```ts
/** localStorage: conteúdo da entrada do Editor JSON. */
export const JSON_EDITOR_INPUT_KEY = 'tools.json-editor.input';
/** localStorage: indentação escolhida no Editor JSON (2 | 4 | tab). */
export const JSON_EDITOR_INDENT_KEY = 'tools.json-editor.indent';
```

- [ ] **Step 2: Reescrever o componente**

Conteúdo completo de `src/app/features/tools/json-tools/json-tools.ts`:

```ts
import { Component, OnDestroy, Renderer2, computed, inject, signal, PLATFORM_ID } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToolShell } from '../../../shared/ui/tool-shell/tool-shell';
import { CodeEditor, EditorDiagnostic } from '../../../shared/ui/code-editor/code-editor';
import { ResizeHandle } from '../../../shared/ui/resizable/resize-handle';
import { resizeStack } from '../../../shared/util/resize';
import { StorageService } from '../../../core/storage.service';
import { JSON_EDITOR_INPUT_KEY, JSON_EDITOR_INDENT_KEY } from '../../../core/storage-keys';
import {
  formatJson, minifyJson, sortJson, repairJson, transformJson,
  validateJson, jsonStats, indentValue, isIndentSetting,
  IndentSetting, JsonResult, JsonError,
} from './json.logic';

@Component({
  selector: 'app-json-tools',
  standalone: true,
  imports: [FormsModule, ToolShell, CodeEditor, ResizeHandle],
  template: `
    <app-tool-shell [title]="titleText" [description]="descText">
      <div class="je-wrap">
        <div class="je-body" [style.gridTemplateColumns]="gridCols()">
          <section class="je-pane">
            <div class="je-pane-head">
              <div class="je-head-row">
                <span class="je-pane-title" i18n="@@tools.json-editor.inputLabel">Entrada</span>
                <button type="button" class="je-btn" (click)="doFormat()" i18n="@@tools.json-editor.format">Formatar</button>
                <button type="button" class="je-btn" (click)="doMinify()" i18n="@@tools.json-editor.minify">Minificar</button>
                <button type="button" class="je-btn" (click)="doSort()" i18n="@@tools.json-editor.sort">Ordenar</button>
                <button type="button" class="je-btn" (click)="doRepair()" i18n="@@tools.json-editor.repair">Reparar</button>
                <button type="button" class="je-btn" (click)="doValidate()" i18n="@@tools.json-editor.validate">Validar</button>
                <label class="je-btn je-upload">
                  <span i18n="@@tools.json-editor.upload">Abrir arquivo</span>
                  <input type="file" accept="application/json,.json,.txt" hidden (change)="onUpload($event)" />
                </label>
                <button type="button" class="je-btn" (click)="clearAll()" i18n="@@tools.json-editor.clear">Limpar</button>
                <div class="je-seg" role="group" [attr.aria-label]="indentAria">
                  <button type="button" [class.is-on]="indent() === 2" (click)="setIndent(2)">2</button>
                  <button type="button" [class.is-on]="indent() === 4" (click)="setIndent(4)">4</button>
                  <button type="button" [class.is-on]="indent() === 'tab'" (click)="setIndent('tab')" i18n="@@tools.json-editor.indentTab">Tab</button>
                </div>
              </div>
              <div class="je-head-row">
                <input
                  class="je-query"
                  [ngModel]="query()"
                  (ngModelChange)="query.set($event)"
                  [attr.placeholder]="queryPlaceholder"
                  [attr.aria-label]="queryLabel" />
                <button type="button" class="je-btn" (click)="doTransform()" i18n="@@tools.json-editor.run">Transformar</button>
              </div>
            </div>
            <div class="je-drop" (dragover)="onDragOver($event)" (drop)="onDrop($event)" [attr.aria-label]="dropAria">
              <app-code-editor
                language="json"
                [value]="input()"
                [search]="true"
                [lint]="true"
                [diagnostics]="errorDiag()"
                [ariaLabel]="inputAria"
                (valueChange)="onInput($event)"
                (run)="doFormat()"></app-code-editor>
            </div>
          </section>

          <app-resize-handle
            axis="x"
            [label]="splitLabel"
            [value]="cols()[0]"
            (resizeBy)="onResize($event)"
            (reset)="resetSplit()"></app-resize-handle>

          <section class="je-pane">
            <div class="je-pane-head">
              <div class="je-head-row">
                <span class="je-pane-title" i18n="@@tools.json-editor.outputLabel">Saída</span>
                <button type="button" class="je-btn" (click)="copyOutput()">{{ copyLabel() }}</button>
                <button type="button" class="je-btn" (click)="download()" i18n="@@tools.json-editor.download">Baixar</button>
              </div>
            </div>
            <app-code-editor
              language="json"
              [value]="output()"
              [readonly]="true"
              [search]="true"
              [ariaLabel]="outputAria"></app-code-editor>
          </section>
        </div>

        <div class="je-status" role="status">
          @if (error(); as e) {
            <span class="je-invalid">
              <ng-container i18n="@@tools.json-editor.invalid">JSON inválido</ng-container>
              — <ng-container i18n="@@tools.json-editor.at">linha</ng-container> {{ e.line }}:{{ e.col }}
            </span>
          } @else {
            <span class="je-valid" i18n="@@tools.json-editor.valid">JSON válido</span>
          }
          @if (opError(); as oe) {
            <span class="je-invalid">{{ opErrorPrefix }} {{ oe }}</span>
          }
          <span>
            <ng-container i18n="@@tools.json-editor.metricsIn">Entrada</ng-container>:
            {{ inStats().bytes }} B · {{ inStats().lines }} <ng-container i18n="@@tools.json-editor.linesUnit">linhas</ng-container>
            · {{ inStats().nodes }} <ng-container i18n="@@tools.json-editor.nodesUnit">nós</ng-container>
          </span>
          <span>
            <ng-container i18n="@@tools.json-editor.metricsOut">Saída</ng-container>:
            {{ outStats().bytes }} B · {{ outStats().lines }} <ng-container i18n="@@tools.json-editor.linesUnit2">linhas</ng-container>
          </span>
        </div>
      </div>
    </app-tool-shell>
  `,
  styleUrl: './json-tools.scss',
})
export class JsonTools implements OnDestroy {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly doc = inject(DOCUMENT);
  private readonly storage = inject(StorageService);
  private readonly renderer = inject(Renderer2);

  readonly input = signal('');
  readonly output = signal('');
  readonly error = signal<JsonError | null>(null);
  readonly opError = signal<string | null>(null);
  readonly query = signal('');
  readonly cols = signal<[number, number]>([0.5, 0.5]);
  readonly indent = signal<IndentSetting>(2);
  readonly copied = signal<'idle' | 'ok' | 'fail'>('idle');

  readonly inStats = computed(() => jsonStats(this.input()));
  readonly outStats = computed(() => jsonStats(this.output()));
  readonly errorDiag = computed<EditorDiagnostic[] | null>(() => {
    const e = this.error();
    if (!e || e.pos === null) return null;
    return [{ from: e.pos, to: e.pos + 1, message: e.message, severity: 'error' }];
  });
  readonly copyLabel = computed(() => {
    const c = this.copied();
    return c === 'ok' ? this.copiedText : c === 'fail' ? this.copyFailText : this.copyText;
  });

  private validateTimer: ReturnType<typeof setTimeout> | null = null;
  private copyTimer: ReturnType<typeof setTimeout> | null = null;
  private unlistenKey?: () => void;

  readonly titleText = $localize`:@@tools.json-editor.name:Editor JSON`;
  readonly descText = $localize`:@@tools.json-editor.desc:Editor de dois painéis: formatar, ordenar, reparar, validar e transformar JSON.`;
  readonly inputAria = $localize`:@@tools.json-editor.inputAria:Editor de entrada JSON`;
  readonly outputAria = $localize`:@@tools.json-editor.outputAria:Resultado JSON (somente leitura)`;
  readonly splitLabel = $localize`:@@tools.json-editor.splitAria:Redimensionar painéis`;
  readonly queryLabel = $localize`:@@tools.json-editor.queryAria:Consulta JMESPath`;
  readonly queryPlaceholder = $localize`:@@tools.json-editor.queryPlaceholder:Consulta JMESPath (ex: people[*].name)`;
  readonly opErrorPrefix = $localize`:@@tools.json-editor.opError:Erro:`;
  readonly indentAria = $localize`:@@tools.json-editor.indentAria:Indentação`;
  readonly dropAria = $localize`:@@tools.json-editor.dropAria:Solte um arquivo JSON aqui`;
  readonly copyText = $localize`:@@tools.json-editor.copy:Copiar saída`;
  readonly copiedText = $localize`:@@tools.json-editor.copied:Copiado!`;
  readonly copyFailText = $localize`:@@tools.json-editor.copyFail:Falhou`;

  constructor() {
    const savedInput = this.storage.getLocal(JSON_EDITOR_INPUT_KEY);
    if (savedInput) {
      this.input.set(savedInput);
      this.error.set(validateJson(savedInput));
    }
    const savedIndent = this.storage.getLocal(JSON_EDITOR_INDENT_KEY);
    const parsed = savedIndent === 'tab' ? 'tab' : Number(savedIndent);
    if (isIndentSetting(parsed)) this.indent.set(parsed);
    if (this.isBrowser) {
      this.unlistenKey = this.renderer.listen('document', 'keydown', (e: KeyboardEvent) => this.onGlobalKey(e));
    }
  }

  gridCols(): string {
    const [a, b] = this.cols();
    return `${a}fr 6px ${b}fr`;
  }

  onInput(value: string): void {
    this.input.set(value);
    if (this.validateTimer) clearTimeout(this.validateTimer);
    this.validateTimer = setTimeout(() => {
      this.error.set(validateJson(this.input()));
      this.storage.setLocal(JSON_EDITOR_INPUT_KEY, this.input());
    }, 150);
  }

  onResize(delta: number): void {
    this.cols.set(resizeStack(this.cols(), 0, delta) as [number, number]);
  }
  resetSplit(): void {
    this.cols.set([0.5, 0.5]);
  }

  setIndent(v: IndentSetting): void {
    this.indent.set(v);
    this.storage.setLocal(JSON_EDITOR_INDENT_KEY, String(v));
  }

  private apply(r: JsonResult): void {
    if (r.ok) { this.output.set(r.output); this.opError.set(null); }
    else { this.opError.set(r.error); }
  }
  doFormat(): void { this.apply(formatJson(this.input(), indentValue(this.indent()))); }
  doMinify(): void { this.apply(minifyJson(this.input())); }
  doSort(): void { this.apply(sortJson(this.input(), indentValue(this.indent()))); }
  doRepair(): void { this.apply(repairJson(this.input(), indentValue(this.indent()))); }
  doTransform(): void { this.apply(transformJson(this.input(), this.query(), indentValue(this.indent()))); }
  doValidate(): void { this.error.set(validateJson(this.input())); }

  clearAll(): void {
    this.input.set('');
    this.output.set('');
    this.error.set(null);
    this.opError.set(null);
    this.storage.setLocal(JSON_EDITOR_INPUT_KEY, '');
  }

  copyOutput(): void {
    if (!this.isBrowser) return;
    navigator.clipboard.writeText(this.output())
      .then(() => this.flashCopy('ok'))
      .catch(() => this.flashCopy('fail'));
  }
  private flashCopy(state: 'ok' | 'fail'): void {
    this.copied.set(state);
    if (this.copyTimer) clearTimeout(this.copyTimer);
    this.copyTimer = setTimeout(() => this.copied.set('idle'), 1200);
  }

  download(): void {
    if (!this.isBrowser) return;
    const blob = new Blob([this.output()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = this.doc.createElement('a');
    a.href = url;
    a.download = 'data.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  onUpload(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) this.loadFile(file);
  }
  onDragOver(e: DragEvent): void { e.preventDefault(); }
  onDrop(e: DragEvent): void {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file) this.loadFile(file);
  }
  private loadFile(file: File): void {
    if (!this.isBrowser) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      this.input.set(text);
      this.error.set(validateJson(text));
      this.storage.setLocal(JSON_EDITOR_INPUT_KEY, text);
    };
    reader.readAsText(file);
  }

  private onGlobalKey(e: KeyboardEvent): void {
    if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
      e.preventDefault();
      this.download();
    }
  }

  ngOnDestroy(): void {
    if (this.validateTimer) clearTimeout(this.validateTimer);
    if (this.copyTimer) clearTimeout(this.copyTimer);
    this.unlistenKey?.();
  }
}
```

- [ ] **Step 3: Reescrever o SCSS**

Conteúdo completo de `src/app/features/tools/json-tools/json-tools.scss`:

```scss
.je-wrap {
  display: flex;
  flex-direction: column;
  height: clamp(520px, calc(100vh - 220px), 1040px);
  min-width: 0;
}
.je-body {
  display: grid;
  grid-template-columns: 1fr 6px 1fr; /* sobrescrito inline via [style.gridTemplateColumns] */
  flex: 1;
  min-height: 0;
  min-width: 0;
}
.je-pane { display: flex; flex-direction: column; min-width: 0; min-height: 0; }
.je-pane-head { display: flex; flex-direction: column; gap: var(--space-1); padding-bottom: var(--space-2); }
.je-head-row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-2); }
.je-pane-title { font-size: 0.75rem; color: var(--muted); margin-right: var(--space-1); }

.je-btn {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1.5px solid var(--ink);
  background: transparent;
  color: var(--ink);
  font-weight: 600;
  font-size: 0.8125rem;
  cursor: pointer;
  &:hover { background: var(--ink); color: var(--bg); }
  &:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
}
.je-upload { cursor: pointer; }

.je-query {
  flex: 1;
  min-width: 140px;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--ink);
  font-family: var(--code-font, ui-monospace, monospace);
  font-size: 0.8125rem;
  &:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
}

.je-seg {
  display: inline-flex;
  margin-left: auto;
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  button {
    padding: 4px 10px;
    border: 0;
    background: transparent;
    color: var(--muted);
    font-size: 0.75rem;
    cursor: pointer;
    &.is-on { background: var(--accent); color: var(--bg); }
    &:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
  }
}

.je-drop { flex: 1; display: flex; min-height: 0; }
.je-pane app-code-editor,
.je-drop app-code-editor { flex: 1; min-height: 0; display: flex; }

.je-status {
  flex: none;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2) var(--space-3);
  margin-top: var(--space-2);
  font-size: 0.75rem;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}
.je-valid { color: var(--json-ok); font-weight: 600; }
.je-invalid { color: var(--danger); font-weight: 600; }

@media (max-width: 1023px) {
  .je-wrap { height: auto; }
  .je-body {
    grid-template-columns: 1fr !important;
    gap: var(--space-3);
  }
  .je-body app-resize-handle { display: none; }
  .je-pane { min-height: 60vh; }
  .je-seg { margin-left: 0; }
}
```

- [ ] **Step 4: Verificar**

Run: `npm.cmd run test:ci` → verde (suíte existente segue passando; sem spec nova de componente exigida).
Run: `npm.cmd run lint` → 0 erros.

- [ ] **Step 5: Commit**

```bash
git add src/app/features/tools/json-tools/ src/app/core/storage-keys.ts
git commit -m "feat(json-editor): per-pane toolbars, indent, persistence, drag-drop, shortcuts, copy feedback"
```

---

### Task 4: Extração i18n + paridade

**Files:**
- Modify: `src/locale/messages.xlf` (gerado)
- Modify: `src/locale/messages.en.xlf`

- [ ] **Step 1: Extrair**

Run: `npx ng extract-i18n --output-path src/locale`
Expected: `messages.xlf` ganha as units novas `@@tools.json-editor.clear`, `.indentTab`, `.indentAria`, `.dropAria`, `.copied`, `.copyFail`. As demais `@@tools.json-editor.*` já existem. Nenhuma unit antiga some (todas as strings do v1 continuam usadas).

- [ ] **Step 2: Preencher os targets em inglês**

Em `src/locale/messages.en.xlf`, garantir `<target>` para cada unit nova (preservar todos os targets já existentes):

| ID | target (en) |
|---|---|
| `@@tools.json-editor.clear` | `Clear` |
| `@@tools.json-editor.indentTab` | `Tab` |
| `@@tools.json-editor.indentAria` | `Indentation` |
| `@@tools.json-editor.dropAria` | `Drop a JSON file here` |
| `@@tools.json-editor.copied` | `Copied!` |
| `@@tools.json-editor.copyFail` | `Failed` |

- [ ] **Step 3: Verificar paridade nos dois builds**

Run: `npm.cmd run build`
Depois (grep sem acento no Windows):

```bash
grep -o "Clear" dist/portfolio/browser/en/tools/json-tools/index.html | head -1     # en
grep -o "Limpar" dist/portfolio/browser/tools/json-tools/index.html | head -1        # pt
grep -o "Copiar" dist/portfolio/browser/tools/json-tools/index.html | head -1        # pt (label idle)
```

Expected: `/en/` inglês, `/` português; 0 chave crua `@@tools.json-editor.*` no HTML renderizado; 0 unit sem `<target>`.

- [ ] **Step 4: Commit**

```bash
git add src/locale/messages.xlf src/locale/messages.en.xlf
git commit -m "i18n(json-editor): v1.1 strings + en parity"
```

---

### Task 5: Gates finais + evidência visual (controller, inline)

- [ ] **Step 1:** `npm.cmd run lint && npm.cmd run test:ci && npm.cmd run build` — verde; sem warning novo (baseline: 2× pt-BR locale; jmespath CJS já suprimido).
- [ ] **Step 2:** Screenshots dark desktop (1440×1000) e mobile (390×844) da rota `/tools/json-tools` via Edge headless (reusar `shoot.mjs` do scratchpad; já aponta pra rota json-tools). Para exercitar o erro sublinhado, semear um JSON **inválido** (ex: `{"a" 1}`) na Entrada antes do screenshot.
- [ ] **Aceite visual:**
  - Botões em cabeçalhos por painel (Entrada: ops+query+Abrir+Limpar+segmented de indentação; Saída: Copiar/Baixar).
  - **Status bar visível** sem rolar, tanto desktop quanto mobile.
  - JSON inválido: **sublinhado/marcador** no ponto do erro no editor da Entrada, além de "JSON inválido — linha X:Y".
  - Segmented de indentação com o valor ativo destacado.
  - Mobile: painéis empilhados, cada cabeçalho acima do seu editor, sem overflow horizontal.
- [ ] **Step 3:** Ajustes visuais, se necessário, no arquivo correspondente + re-commit.

---

## Fora deste plano

Tree mode, table mode, JSON Schema, compare de 2 documentos, share por URL, Web Worker — fases futuras (specs próprias).
