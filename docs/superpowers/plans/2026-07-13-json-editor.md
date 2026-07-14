# Editor JSON (v1 text mode, 2 painéis) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elevar a ferramenta `json-tools` para um Editor JSON de dois painéis (entrada→saída) com editores de código CodeMirror e operações Format/Minify/Sort/Repair/Validate/Transform(JMESPath)/Upload/Copy/Download, mais status bar com validade, `linha:coluna`, bytes, linhas e node count.

**Architecture:** Promove o componente `CodeEditor` do playground para `shared/ui/code-editor` e o estende (JSON, readonly, search). Toda a lógica de dados vira funções puras testáveis em `json.logic.ts`. O splitter reusa `ResizeHandle` + `resizeStack` (`shared/util/resize`). Repair via `jsonrepair`, Transform via `jmespath`.

**Tech Stack:** Angular 22 standalone + signals, CodeMirror 6 (`@codemirror/lang-json`, `@codemirror/search`), `jsonrepair`, `jmespath`, SCSS tokens, Vitest.

Spec: `docs/superpowers/specs/2026-07-13-json-editor-design.md`.

## Global Constraints

- **Tokens-only:** hex novo SÓ em `src/styles/_tokens.scss`. SCSS de componente usa `var(--*)`.
- **SSR-safe:** nada de `window`/`document`/`localStorage`/`Blob`/`FileReader` sem guarda `isPlatformBrowser` ou `DOCUMENT` injetado. Editores caem no fallback textarea fora do browser (já tratado pelo `CodeEditor`). Timers/listeners limpos em `OnDestroy`.
- **i18n:** toda string visível marcada (`i18n`/`i18n-aria-label`/`$localize`) com IDs estáveis `@@tools.json-editor.*`. `extract-i18n` roda SÓ na Task 5 (última). Preencher `<target>` em `messages.en.xlf`; verificar paridade nos dois builds.
- **Vitest:** `.toBe(true)`/`.toBe(false)`; `toEqual` para objetos. Nunca `.toBeTrue()`.
- **Reduced motion:** sem animação nova no splitter; qualquer transição respeita `prefers-reduced-motion`.
- **Sem quebrar o playground:** o `CodeEditor` promovido mantém contrato atual (defaults `readonly=false`, `search=false`, highlight `tok-*` inalterado). Playground segue compilando e com specs verdes.
- **QA:** executor roda `npm.cmd run lint` (0 erros; 4 warnings a11y pré-existentes fora do escopo ok — use `npm.cmd`, não `npm`, pois `npm.ps1` é bloqueado pela execution policy). O controller roda `test:ci`/`build` e commita quando via SDD; se o executor tiver shell próprio pode rodar `npm.cmd run test:ci` direto.
- **Commits:** um por task.

---

### Task 1: Promover `CodeEditor` para `shared/` e estender (json, readonly, search)

**Files:**
- Move: `src/app/features/tools/playground/editor/code-editor.ts` → `src/app/shared/ui/code-editor/code-editor.ts`
- Move: `src/app/features/tools/playground/editor/code-editor.scss` → `src/app/shared/ui/code-editor/code-editor.scss`
- Move: `src/app/features/tools/playground/editor/code-editor.spec.ts` → `src/app/shared/ui/code-editor/code-editor.spec.ts`
- Modify: `src/app/features/tools/playground/playground.ts` (caminho do import)
- Modify: `package.json` / `package-lock.json` (deps `@codemirror/lang-json`, `@codemirror/search`)

**Interfaces:**
- Produces: `CodeEditor` em `shared/ui/code-editor/code-editor` com `@Input() language: 'html'|'css'|'javascript'|'json'`, `@Input() readonly = false`, `@Input() search = false`. Consumido pela Task 4.

- [ ] **Step 1: Mover os arquivos preservando histórico**

```bash
mkdir -p src/app/shared/ui/code-editor
git mv src/app/features/tools/playground/editor/code-editor.ts   src/app/shared/ui/code-editor/code-editor.ts
git mv src/app/features/tools/playground/editor/code-editor.scss src/app/shared/ui/code-editor/code-editor.scss
git mv src/app/features/tools/playground/editor/code-editor.spec.ts src/app/shared/ui/code-editor/code-editor.spec.ts
```

(O `code-editor.spec.ts` importa `./code-editor` — caminho relativo continua válido após mover junto.)

- [ ] **Step 2: Atualizar o import no playground**

Em `src/app/features/tools/playground/playground.ts`, a linha:

```ts
import { CodeEditor } from './editor/code-editor';
```

vira:

```ts
import { CodeEditor } from '../../../shared/ui/code-editor/code-editor';
```

- [ ] **Step 3: Instalar deps do editor**

```bash
npm.cmd install @codemirror/lang-json@^6 @codemirror/search@^6 --save-exact=false
```

Expected: `package.json` ganha `"@codemirror/lang-json": "^6.x"` e `"@codemirror/search": "^6.x"` (mesma major 6 do CodeMirror já presente).

- [ ] **Step 4: Estender a API do `CodeEditor`**

Em `src/app/shared/ui/code-editor/code-editor.ts`:

1. Trocar o tipo de linguagem e adicionar inputs:

```ts
export type EditorLanguage = 'html' | 'css' | 'javascript' | 'json';
```

Adicionar, junto aos `@Input()` existentes:

```ts
  @Input() readonly = false;
  @Input() search = false;
```

2. No template, o fallback textarea recebe `readonly`:

```ts
      <textarea
        class="cm-fallback"
        spellcheck="false"
        [readonly]="readonly"
        [ngModel]="value"
        (ngModelChange)="onFallback($event)"
        (keydown)="onFallbackKeydown($event)"
        [attr.aria-label]="ariaLabel"></textarea>
```

3. Em `loadLanguage()`, adicionar o ramo json (antes do return html):

```ts
  private async loadLanguage(): Promise<Extension> {
    if (this.language === 'css') return (await import('@codemirror/lang-css')).css();
    if (this.language === 'javascript') return (await import('@codemirror/lang-javascript')).javascript();
    if (this.language === 'json') return (await import('@codemirror/lang-json')).json();
    return (await import('@codemirror/lang-html')).html();
  }
```

4. Em `mount()`, montar extensões condicionais e incluí-las no `EditorState.create`. Substituir o trecho a partir de `const startState = ...` por:

```ts
    const extras: Extension[] = [];
    if (this.readonly) {
      extras.push(state.EditorState.readOnly.of(true), EditorView.editable.of(false));
    }
    if (this.search) {
      // `basicSetup` já inclui `searchKeymap` (Ctrl+F funciona sem isto). Aqui só
      // configuramos o painel de busca no topo; NÃO re-vincular o keymap (duplicaria bindings).
      const searchMod = await import('@codemirror/search');
      if (this.destroyed) return;
      extras.push(searchMod.search({ top: true }));
    }
    const startState = state.EditorState.create({
      doc: this.value,
      extensions: [
        cm.basicSetup, langExt, updateListener, runKeymap, EditorView.lineWrapping,
        language.syntaxHighlighting(tokenClasses),
        ...extras,
      ],
    });
    this.view = new EditorView({ state: startState, parent: this.host!.nativeElement }) as unknown as typeof this.view;
```

(`onFallback` num editor `readonly` não é acionável — o textarea readonly não emite input; o comportamento programático via `value`/`ngOnChanges` continua atualizando a saída.)

- [ ] **Step 5: Teste — readonly propaga ao fallback (server path)**

Em `src/app/shared/ui/code-editor/code-editor.spec.ts`, adicionar dentro do `describe`:

```ts
  it('marks the fallback textarea readonly when readonly=true', () => {
    const fixture = make();
    fixture.componentInstance.readonly = true;
    fixture.detectChanges();
    const ta = fixture.nativeElement.querySelector('textarea.cm-fallback') as HTMLTextAreaElement;
    expect(ta.readOnly).toBe(true);
  });
  it('leaves the fallback textarea editable by default', () => {
    const fixture = make();
    fixture.detectChanges();
    const ta = fixture.nativeElement.querySelector('textarea.cm-fallback') as HTMLTextAreaElement;
    expect(ta.readOnly).toBe(false);
  });
```

- [ ] **Step 6: Rodar testes**

Run: `npm.cmd run test:ci`
Expected: verde, incluindo os 2 novos casos + os 3 existentes do `CodeEditor` no novo caminho.

- [ ] **Step 7: Lint + commit**

Run: `npm.cmd run lint` → 0 erros.

```bash
git add src/app/shared/ui/code-editor/ src/app/features/tools/playground/playground.ts package.json package-lock.json
git commit -m "refactor(editor): promote CodeEditor to shared, add json/readonly/search"
```

---

### Task 2: Lógica pura sem dependências (sort, validate, stats, errorToLineCol)

**Files:**
- Modify: `src/app/features/tools/json-tools/json.logic.ts`
- Modify: `src/app/features/tools/json-tools/json.logic.spec.ts`

**Interfaces:**
- Consumes: `JsonResult`, `transform` (helper privado existente), `formatJson`.
- Produces (para a Task 4):
  - `sortJson(input: string, indent: number): JsonResult`
  - `validateJson(input: string): JsonError | null`
  - `jsonStats(text: string): JsonStats`
  - `errorToLineCol(text: string, position: number): { line: number; col: number }`
  - tipos `JsonError { message: string; line: number; col: number }`, `JsonStats { bytes: number; lines: number; nodes: number }`.

- [ ] **Step 1: Escrever os testes que falham**

Adicionar ao fim de `src/app/features/tools/json-tools/json.logic.spec.ts`:

```ts
import {
  sortJson, validateJson, jsonStats, errorToLineCol,
} from './json.logic';

describe('sortJson', () => {
  it('orders object keys recursively, preserving array order', () => {
    const r = sortJson('{"b":1,"a":{"d":2,"c":3},"list":[3,1,2]}', 2);
    expect(r.ok).toBe(true);
    expect(r.output).toBe('{\n  "a": {\n    "c": 3,\n    "d": 2\n  },\n  "b": 1,\n  "list": [\n    3,\n    1,\n    2\n  ]\n}');
  });
  it('reports an error for invalid JSON', () => {
    expect(sortJson('{bad}', 2).ok).toBe(false);
  });
});

describe('validateJson', () => {
  it('returns null for valid JSON', () => {
    expect(validateJson('{"a":1}')).toBe(null);
  });
  it('returns null for empty input', () => {
    expect(validateJson('   ')).toBe(null);
  });
  it('returns an error with a 1-based line/col for invalid JSON', () => {
    const err = validateJson('{\n  "a" 1\n}');
    expect(err !== null).toBe(true);
    expect(typeof err!.message).toBe('string');
    expect(err!.line >= 1).toBe(true);
    expect(err!.col >= 1).toBe(true);
  });
});

describe('errorToLineCol', () => {
  it('maps a character offset to 1-based line and column', () => {
    expect(errorToLineCol('ab\ncd', 4)).toEqual({ line: 2, col: 2 });
  });
  it('clamps a position beyond the text length', () => {
    expect(errorToLineCol('ab', 99)).toEqual({ line: 1, col: 3 });
  });
});

describe('jsonStats', () => {
  it('counts bytes, lines and nodes of valid JSON', () => {
    expect(jsonStats('{"a":1}')).toEqual({ bytes: 7, lines: 1, nodes: 2 });
  });
  it('reports zero nodes for invalid JSON but still counts bytes/lines', () => {
    const s = jsonStats('a\nb');
    expect(s.nodes).toBe(0);
    expect(s.lines).toBe(2);
    expect(s.bytes).toBe(3);
  });
  it('treats empty text as zero lines and zero nodes', () => {
    expect(jsonStats('')).toEqual({ bytes: 0, lines: 0, nodes: 0 });
  });
});
```

- [ ] **Step 2: Rodar — falha esperada**

Run: `npm.cmd run test:ci`
Expected: FAIL (`sortJson`/`validateJson`/`jsonStats`/`errorToLineCol` não exportados).

- [ ] **Step 3: Implementar**

Adicionar ao fim de `src/app/features/tools/json-tools/json.logic.ts`:

```ts
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
  let nodes = 0;
  try { nodes = countNodes(JSON.parse(text)); } catch { nodes = 0; }
  return { bytes, lines, nodes };
}
```

- [ ] **Step 4: Rodar — verde**

Run: `npm.cmd run test:ci`
Expected: PASS.

- [ ] **Step 5: Lint + commit**

Run: `npm.cmd run lint` → 0 erros.

```bash
git add src/app/features/tools/json-tools/json.logic.ts src/app/features/tools/json-tools/json.logic.spec.ts
git commit -m "feat(json-editor): sort/validate/stats/errorToLineCol pure logic (TDD)"
```

---

### Task 3: Repair + Transform (deps `jsonrepair`, `jmespath`)

**Files:**
- Modify: `src/app/features/tools/json-tools/json.logic.ts`
- Modify: `src/app/features/tools/json-tools/json.logic.spec.ts`
- Modify: `package.json` / `package-lock.json`

**Interfaces:**
- Consumes: `JsonResult`, `formatJson`.
- Produces (para a Task 4):
  - `repairJson(input: string, indent: number): JsonResult`
  - `transformJson(input: string, query: string, indent: number): JsonResult`

- [ ] **Step 1: Instalar deps**

```bash
npm.cmd install jsonrepair@^3 jmespath@^0.16 --save-exact=false
npm.cmd install --save-dev @types/jmespath@^0.15
```

Expected: `jsonrepair` e `jmespath` em `dependencies`, `@types/jmespath` em `devDependencies`. (`jsonrepair` traz seus próprios tipos.)

- [ ] **Step 2: Escrever os testes que falham**

Adicionar ao fim de `json.logic.spec.ts`:

```ts
import { repairJson, transformJson } from './json.logic';

describe('repairJson', () => {
  it('repairs common invalid JSON (unquoted keys, trailing comma)', () => {
    const r = repairJson("{a: 1, b: 'x',}", 2);
    expect(r.ok).toBe(true);
    expect(r.output).toBe('{\n  "a": 1,\n  "b": "x"\n}');
  });
  it('treats empty input as ok/empty', () => {
    expect(repairJson('   ', 2)).toEqual({ ok: true, output: '', error: null });
  });
});

describe('transformJson', () => {
  it('applies a JMESPath query and pretty-prints the result', () => {
    const r = transformJson('{"people":[{"name":"Ann"},{"name":"Bob"}]}', 'people[*].name', 2);
    expect(r.ok).toBe(true);
    expect(r.output).toBe('[\n  "Ann",\n  "Bob"\n]');
  });
  it('empty query yields ok/empty output', () => {
    expect(transformJson('{"a":1}', '  ', 2)).toEqual({ ok: true, output: '', error: null });
  });
  it('reports an error for an invalid query', () => {
    expect(transformJson('{"a":1}', 'a[', 2).ok).toBe(false);
  });
  it('reports an error when input JSON is invalid', () => {
    expect(transformJson('{bad}', 'a', 2).ok).toBe(false);
  });
});
```

- [ ] **Step 3: Rodar — falha esperada**

Run: `npm.cmd run test:ci`
Expected: FAIL (`repairJson`/`transformJson` não exportados).

- [ ] **Step 4: Implementar**

No topo de `json.logic.ts`, adicionar os imports:

```ts
import { jsonrepair } from 'jsonrepair';
import { search as jmesSearch } from 'jmespath';
```

Adicionar ao fim do arquivo:

```ts
export function repairJson(input: string, indent: number): JsonResult {
  if (input.trim() === '') return { ok: true, output: '', error: null };
  try {
    return formatJson(jsonrepair(input), indent);
  } catch (e) {
    return { ok: false, output: '', error: (e as Error).message };
  }
}

export function transformJson(input: string, query: string, indent: number): JsonResult {
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

- [ ] **Step 5: Rodar — verde**

Run: `npm.cmd run test:ci`
Expected: PASS.

- [ ] **Step 6: Lint + commit**

Run: `npm.cmd run lint` → 0 erros.

```bash
git add src/app/features/tools/json-tools/json.logic.ts src/app/features/tools/json-tools/json.logic.spec.ts package.json package-lock.json
git commit -m "feat(json-editor): repair (jsonrepair) and transform (jmespath) logic (TDD)"
```

---

### Task 4: Componente Editor JSON — 2 painéis, toolbar, status bar, splitter

**Files:**
- Rewrite: `src/app/features/tools/json-tools/json-tools.ts`
- Rewrite: `src/app/features/tools/json-tools/json-tools.scss`
- Modify: `src/styles/_tokens.scss` (token `--json-ok` light+dark)

**Interfaces:**
- Consumes: `CodeEditor` (Task 1); `formatJson`, `minifyJson`, `sortJson`, `repairJson`, `transformJson`, `validateJson`, `jsonStats`, `JsonResult`, `JsonError` (Tasks 2-3); `ResizeHandle`, `resizeStack`.
- Produces: componente `JsonTools` (mantém o nome da classe — a rota importa `m.JsonTools`).

Nota i18n: marcar todas as strings com `i18n`/`$localize` usando IDs `@@tools.json-editor.*`. **NÃO** rodar `extract-i18n` nesta task — é a Task 5. O reviewer deve saber que a extração/paridade i18n é deferida à Task 5 (não flagar como Important).

- [ ] **Step 1: Token `--json-ok` (validade)**

Em `src/styles/_tokens.scss`, no bloco claro (`:root`), após o grupo `--code-*`:

```scss
  --json-ok: #16A34A;
```

E no bloco dark (`:root[data-theme="dark"]`), após o grupo `--code-*`:

```scss
  --json-ok: #4ADE80;
```

(Erro usa o `--danger` já existente.)

- [ ] **Step 2: Reescrever o componente**

Conteúdo completo de `src/app/features/tools/json-tools/json-tools.ts`:

```ts
import { Component, OnDestroy, computed, inject, signal, PLATFORM_ID } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToolShell } from '../../../shared/ui/tool-shell/tool-shell';
import { CodeEditor } from '../../../shared/ui/code-editor/code-editor';
import { ResizeHandle } from '../../../shared/ui/resizable/resize-handle';
import { resizeStack } from '../../../shared/util/resize';
import {
  formatJson, minifyJson, sortJson, repairJson, transformJson,
  validateJson, jsonStats, JsonResult, JsonError,
} from './json.logic';

@Component({
  selector: 'app-json-tools',
  standalone: true,
  imports: [FormsModule, ToolShell, CodeEditor, ResizeHandle],
  template: `
    <app-tool-shell [title]="titleText" [description]="descText">
      <div class="je-toolbar">
        <div class="je-group">
          <button type="button" class="je-btn" (click)="doFormat()" i18n="@@tools.json-editor.format">Formatar</button>
          <button type="button" class="je-btn" (click)="doMinify()" i18n="@@tools.json-editor.minify">Minificar</button>
          <button type="button" class="je-btn" (click)="doSort()" i18n="@@tools.json-editor.sort">Ordenar</button>
          <button type="button" class="je-btn" (click)="doRepair()" i18n="@@tools.json-editor.repair">Reparar</button>
          <button type="button" class="je-btn" (click)="doValidate()" i18n="@@tools.json-editor.validate">Validar</button>
        </div>

        <div class="je-group">
          <input
            class="je-query"
            [ngModel]="query()"
            (ngModelChange)="query.set($event)"
            [attr.placeholder]="queryPlaceholder"
            [attr.aria-label]="queryLabel" />
          <button type="button" class="je-btn" (click)="doTransform()" i18n="@@tools.json-editor.run">Transformar</button>
        </div>

        <div class="je-group je-io">
          <label class="je-btn je-upload">
            <span i18n="@@tools.json-editor.upload">Abrir arquivo</span>
            <input type="file" accept="application/json,.json,.txt" hidden (change)="onUpload($event)" />
          </label>
          <button type="button" class="je-btn" (click)="copyOutput()" i18n="@@tools.json-editor.copy">Copiar saída</button>
          <button type="button" class="je-btn" (click)="download()" i18n="@@tools.json-editor.download">Baixar</button>
        </div>
      </div>

      <div class="je-body" [style.gridTemplateColumns]="gridCols()">
        <section class="je-pane">
          <p class="je-pane-label" i18n="@@tools.json-editor.inputLabel">Entrada</p>
          <app-code-editor
            language="json"
            [value]="input()"
            [search]="true"
            [ariaLabel]="inputLabel"
            (valueChange)="onInput($event)"></app-code-editor>
        </section>

        <app-resize-handle
          axis="x"
          [label]="splitLabel"
          [value]="cols()[0]"
          (resizeBy)="onResize($event)"
          (reset)="resetSplit()"></app-resize-handle>

        <section class="je-pane">
          <p class="je-pane-label" i18n="@@tools.json-editor.outputLabel">Saída</p>
          <app-code-editor
            language="json"
            [value]="output()"
            [readonly]="true"
            [search]="true"
            [ariaLabel]="outputLabel"></app-code-editor>
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
        <span class="je-metrics">
          <ng-container i18n="@@tools.json-editor.metricsIn">Entrada</ng-container>:
          {{ inStats().bytes }} B · {{ inStats().lines }} <ng-container i18n="@@tools.json-editor.linesUnit">linhas</ng-container>
          · {{ inStats().nodes }} <ng-container i18n="@@tools.json-editor.nodesUnit">nós</ng-container>
        </span>
        <span class="je-metrics">
          <ng-container i18n="@@tools.json-editor.metricsOut">Saída</ng-container>:
          {{ outStats().bytes }} B · {{ outStats().lines }} <ng-container i18n="@@tools.json-editor.linesUnit2">linhas</ng-container>
        </span>
      </div>
    </app-tool-shell>
  `,
  styleUrl: './json-tools.scss',
})
export class JsonTools implements OnDestroy {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly doc = inject(DOCUMENT);

  readonly input = signal('');
  readonly output = signal('');
  readonly error = signal<JsonError | null>(null);
  readonly opError = signal<string | null>(null);
  readonly query = signal('');
  readonly cols = signal<[number, number]>([0.5, 0.5]);

  readonly inStats = computed(() => jsonStats(this.input()));
  readonly outStats = computed(() => jsonStats(this.output()));

  private validateTimer: ReturnType<typeof setTimeout> | null = null;

  readonly titleText = $localize`:@@tools.json-editor.name:Editor JSON`;
  readonly descText = $localize`:@@tools.json-editor.desc:Editor de dois painéis: formatar, ordenar, reparar, validar e transformar JSON.`;
  readonly inputLabel = $localize`:@@tools.json-editor.inputAria:Editor de entrada JSON`;
  readonly outputLabel = $localize`:@@tools.json-editor.outputAria:Resultado JSON (somente leitura)`;
  readonly splitLabel = $localize`:@@tools.json-editor.splitAria:Redimensionar painéis`;
  readonly queryLabel = $localize`:@@tools.json-editor.queryAria:Consulta JMESPath`;
  readonly queryPlaceholder = $localize`:@@tools.json-editor.queryPlaceholder:Consulta JMESPath (ex: people[*].name)`;
  readonly opErrorPrefix = $localize`:@@tools.json-editor.opError:Erro:`;

  gridCols(): string {
    const [a, b] = this.cols();
    return `${a}fr 6px ${b}fr`;
  }

  onInput(value: string): void {
    this.input.set(value);
    if (this.validateTimer) clearTimeout(this.validateTimer);
    this.validateTimer = setTimeout(() => this.error.set(validateJson(this.input())), 150);
  }

  onResize(delta: number): void {
    this.cols.set(resizeStack(this.cols(), 0, delta) as [number, number]);
  }
  resetSplit(): void {
    this.cols.set([0.5, 0.5]);
  }

  private apply(r: JsonResult): void {
    if (r.ok) { this.output.set(r.output); this.opError.set(null); }
    else { this.opError.set(r.error); }
  }
  doFormat(): void { this.apply(formatJson(this.input(), 2)); }
  doMinify(): void { this.apply(minifyJson(this.input())); }
  doSort(): void { this.apply(sortJson(this.input(), 2)); }
  doRepair(): void { this.apply(repairJson(this.input(), 2)); }
  doTransform(): void { this.apply(transformJson(this.input(), this.query(), 2)); }
  doValidate(): void { this.error.set(validateJson(this.input())); }

  copyOutput(): void {
    if (!this.isBrowser) return;
    navigator.clipboard?.writeText(this.output());
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
    if (!file || !this.isBrowser) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.input.set(String(reader.result ?? ''));
      this.error.set(validateJson(this.input()));
    };
    reader.readAsText(file);
  }

  ngOnDestroy(): void {
    if (this.validateTimer) clearTimeout(this.validateTimer);
  }
}
```

- [ ] **Step 3: Reescrever o SCSS**

Conteúdo completo de `src/app/features/tools/json-tools/json-tools.scss`:

```scss
.je-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2) var(--space-3);
  margin: var(--space-3) 0;
  min-width: 0;
}
.je-group { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-2); }
.je-io { margin-left: auto; }

.je-btn {
  display: inline-flex;
  align-items: center;
  padding: 7px 14px;
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
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--ink);
  font-family: var(--code-font, ui-monospace, monospace);
  font-size: 0.8125rem;
  min-width: 200px;
  &:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
}

.je-body {
  display: grid;
  grid-template-columns: 1fr 6px 1fr; /* sobrescrito inline via [style.gridTemplateColumns] */
  height: clamp(420px, calc(100vh - 260px), 900px);
  min-width: 0;
}
.je-pane {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}
.je-pane-label { font-size: 0.75rem; color: var(--muted); margin: 0 0 4px; }
.je-pane app-code-editor { flex: 1; min-height: 0; display: flex; }

.je-status {
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
  .je-body {
    grid-template-columns: 1fr !important;
    height: auto;
    gap: var(--space-3);
  }
  .je-body app-resize-handle { display: none; }
  .je-pane { height: 60vh; }
  .je-io { margin-left: 0; }
}
```

- [ ] **Step 4: Verificar build/test**

Run: `npm.cmd run test:ci` → verde (specs existentes seguem passando; nenhuma spec nova de componente exigida — a lógica é coberta nas Tasks 2-3, e o `CodeEditor` na Task 1).
Run: `npm.cmd run lint` → 0 erros.

- [ ] **Step 5: Commit**

```bash
git add src/app/features/tools/json-tools/ src/styles/_tokens.scss
git commit -m "feat(json-editor): two-pane editor UI with toolbar, splitter and status bar"
```

---

### Task 5: Registro da tool + extração i18n + paridade

**Files:**
- Modify: `src/data/tools.ts` (nome/descrição da ferramenta)
- Modify: `src/locale/messages.xlf` (gerado por extract)
- Modify: `src/locale/messages.en.xlf` (targets em inglês)

- [ ] **Step 1: Atualizar nome/descrição da ferramenta**

Em `src/data/tools.ts`, na entrada `slug: 'json-tools'`, trocar `name`/`description` (mantendo os IDs existentes `@@tools.json-tools.name`/`.desc`):

```ts
  {
    slug: 'json-tools',
    name: $localize`:@@tools.json-tools.name:Editor JSON`,
    description: $localize`:@@tools.json-tools.desc:Editor de dois painéis com formatar, ordenar, reparar, validar e transformar.`,
    group: 'dev', icon: '{ }', status: 'live',
  },
```

- [ ] **Step 2: Extrair i18n**

Run: `npx ng extract-i18n --output-path src/locale`
Expected: `src/locale/messages.xlf` regenerado. Ganha as units `@@tools.json-editor.*` novas; as antigas do componente removido (`@@tools.json-tools.inputLabel/outputLabel/format/minify/placeholder/errorPrefix`) somem. As units da tool (`@@tools.json-tools.name/desc`) permanecem com o texto novo.

- [ ] **Step 3: Preencher os targets em inglês**

Em `src/locale/messages.en.xlf`, garantir `<target>` para cada unit `@@tools.json-editor.*` e para `@@tools.json-tools.name/desc` atualizados. Traduções:

| ID | target (en) |
|---|---|
| `@@tools.json-tools.name` | `JSON Editor` |
| `@@tools.json-tools.desc` | `Two-pane editor with format, sort, repair, validate and transform.` |
| `@@tools.json-editor.name` | `JSON Editor` |
| `@@tools.json-editor.desc` | `Two-pane editor: format, sort, repair, validate and transform JSON.` |
| `@@tools.json-editor.format` | `Format` |
| `@@tools.json-editor.minify` | `Minify` |
| `@@tools.json-editor.sort` | `Sort` |
| `@@tools.json-editor.repair` | `Repair` |
| `@@tools.json-editor.validate` | `Validate` |
| `@@tools.json-editor.run` | `Transform` |
| `@@tools.json-editor.upload` | `Open file` |
| `@@tools.json-editor.copy` | `Copy output` |
| `@@tools.json-editor.download` | `Download` |
| `@@tools.json-editor.inputLabel` | `Input` |
| `@@tools.json-editor.outputLabel` | `Output` |
| `@@tools.json-editor.invalid` | `Invalid JSON` |
| `@@tools.json-editor.at` | `line` |
| `@@tools.json-editor.valid` | `Valid JSON` |
| `@@tools.json-editor.metricsIn` | `Input` |
| `@@tools.json-editor.metricsOut` | `Output` |
| `@@tools.json-editor.linesUnit` | `lines` |
| `@@tools.json-editor.linesUnit2` | `lines` |
| `@@tools.json-editor.nodesUnit` | `nodes` |
| `@@tools.json-editor.inputAria` | `JSON input editor` |
| `@@tools.json-editor.outputAria` | `JSON result (read-only)` |
| `@@tools.json-editor.splitAria` | `Resize panels` |
| `@@tools.json-editor.queryAria` | `JMESPath query` |
| `@@tools.json-editor.queryPlaceholder` | `JMESPath query (e.g. people[*].name)` |
| `@@tools.json-editor.opError` | `Error:` |

(Preservar todos os `<target>` já existentes de outras units.)

- [ ] **Step 4: Verificar paridade nos dois builds**

Run: `npm.cmd run build`
Depois conferir (o grep no Windows falha com acento — usar prefixos sem acento):

```bash
grep -o "JSON Editor" dist/portfolio/browser/en/tools/json-tools/index.html | head -1   # en
grep -o "Editor JSON" dist/portfolio/browser/tools/json-tools/index.html | head -1       # pt-BR
grep -o "Format" dist/portfolio/browser/en/tools/json-tools/index.html | head -1          # en botão
grep -o "Formatar" dist/portfolio/browser/tools/json-tools/index.html | head -1           # pt botão
```

Expected: `/en/` mostra inglês, `/` mostra português; 0 chave crua (`@@tools.json-editor.*` não aparece no HTML renderizado).

- [ ] **Step 5: Commit**

```bash
git add src/data/tools.ts src/locale/messages.xlf src/locale/messages.en.xlf
git commit -m "i18n(json-editor): tool rename + extract strings, en parity"
```

---

### Task 6: Gates finais + evidência visual (controller, inline)

- [ ] **Step 1:** `npm.cmd run lint && npm.cmd run test:ci && npm.cmd run build` — verde; sem warning novo (baseline: 2× pt-BR locale cosmético).
- [ ] **Step 2:** Screenshots dark desktop (1440×1000) e mobile (390×844) da rota `/tools/json-tools` via Edge headless (reusar o `shoot.mjs` do scratchpad: servir `dist/portfolio/browser` com strip do prefixo baseHref `/diogo.a.gulhak.github.io/`, flip do sheet `media=print`→`all`, `data-theme=dark`; navegar para `/diogo.a.gulhak.github.io/tools/json-tools`).
- [ ] **Aceite visual:**
  - Dois painéis de código JSON com gutter/sintaxe legíveis no dark; splitter visível entre eles.
  - Toolbar coesa: Formatar/Minificar/Ordenar/Reparar/Validar, campo de query + Transformar, Abrir/Copiar/Baixar à direita.
  - Status bar: "JSON válido" (verde) ou "inválido — linha X:Y"; Entrada bytes/linhas/**nós**; Saída bytes/linhas.
  - Mobile: painéis empilhados, splitter oculto, sem overflow horizontal (toggle do site visível).
  - Funcional: colar `{"b":1,"a":2}`, clicar Ordenar → saída `{"a":2,"b":1}`; digitar query `a` + Transformar → saída aplica.
- [ ] **Step 3:** Se algum ajuste visual for necessário, corrigir no arquivo correspondente e re-commitar.

---

## Fora deste plano

Tree mode, table mode, validação por JSON Schema, comparação de 2 documentos, persistência — Fases futuras (specs próprias). Ver a spec.
