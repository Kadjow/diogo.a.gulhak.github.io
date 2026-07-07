# Playground Resizable Panels Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Divisórias arrastáveis no playground em 3 eixos (editores↔saída, preview↔console, entre os 3 editores), com teclado, persistência e reset.

**Architecture:** Matemática de frações em módulo puro (`shared/util/resize.ts`). Um componente reutilizável `ResizeHandle` (separador acessível, pointer + teclado) emite deltas de fração; o `Playground` guarda as frações em signals e as aplica via `grid-template-columns/rows` inline (só têm efeito no desktop, onde o container é grid). Persistência estende o objeto salvo com `layout`.

**Tech Stack:** Angular 22 standalone + signals, TypeScript strict, SCSS tokens, `@angular/localize` (pt-BR + en), Vitest (jsdom). Sem novas dependências.

## Global Constraints

- Angular 22 standalone; estado de UI com **signals**. (CLAUDE.md)
- **SSR-safe:** pointer/`clientWidth` só em handlers de evento (nunca no load); `run()`/storage já guardados. (CLAUDE.md)
- **Cleanup:** listeners de `pointermove/pointerup` removidos no `pointerup` e no `OnDestroy`. (CLAUDE.md)
- **Estilo só por tokens** de `_tokens.scss` (`var(--border)`, `var(--accent)`, etc.). Sem hex chumbado. (CLAUDE.md)
- **i18n:** IDs `@@tools.playground.resizeCols|resizeOutput|resizeEditors`. `$localize` resolve em build-time. (CLAUDE.md)
- **Vitest:** `.toBe(true)`/`.toBe(false)` — nunca `.toBeTrue()`. Mock de corpo vazio = `() => undefined`. (CLAUDE.md)
- **A11y:** separador `role="separator"`, `tabindex="0"`, `aria-orientation`, `aria-valuenow/min/max`, setas redimensionam, duplo-clique reseta. (spec)
- **Responsivo:** abaixo de 1024px os separadores somem e o layout empilhado/tabs atual fica intacto. (spec)
- **Defaults:** `cols=[0.48,0.52]`, `out=[0.62,0.38]`, `editors=[0.34,0.33,0.33]`; `MIN_FRACTION=0.15`; `KEY_STEP=0.02`. (spec)
- `prefers-reduced-motion: reduce` respeitado (sem transições novas fora do guard existente).
- **Comandos:** `npm run lint` (0 erros; 4 warnings a11y pré-existentes ok), `npm run test:ci`, `npm run build`. (CLAUDE.md)

---

## File Structure

- `src/app/shared/util/resize.ts` (+ `.spec.ts`) — **novo**: matemática pura de frações.
- `src/app/shared/ui/resizable/resize-handle.ts` + `resize-handle.scss` — **novo**: separador acessível reutilizável.
- `src/app/features/tools/playground/playground.logic.ts` (+ spec) — **modificar**: `PlaygroundLayout`, `DEFAULT_LAYOUT`.
- `src/app/features/tools/playground/playground.ts` — **modificar**: signals de layout, handlers, template, persistência, labels.
- `src/app/features/tools/playground/playground.scss` — **modificar**: grid com alturas, fills, esconder handles no mobile.
- `src/app/features/tools/playground/editor/code-editor.scss` — **modificar**: editor preenche a altura dada.
- `src/app/features/tools/playground/console-panel.scss` — **modificar**: console preenche a altura dada no desktop.
- `src/locale/messages.xlf` / `messages.en.xlf` — **modificar** (Task 4).

---

### Task 1: Matemática pura de resize

**Files:**
- Create: `src/app/shared/util/resize.ts`
- Test: `src/app/shared/util/resize.spec.ts`

**Interfaces:**
- Produces:
  - `const MIN_FRACTION = 0.15`
  - `const KEY_STEP = 0.02`
  - `function clampFraction(value: number, min: number, max: number): number`
  - `function resizeStack(sizes: number[], index: number, delta: number, min?: number): number[]`
  - `function isValidSizes(value: unknown, length: number): value is number[]`

- [ ] **Step 1: Write the failing tests**

Create `src/app/shared/util/resize.spec.ts`:

```ts
import { clampFraction, resizeStack, isValidSizes, MIN_FRACTION, KEY_STEP } from './resize';

describe('clampFraction', () => {
  it('clamps below min and above max, passes through inside', () => {
    expect(clampFraction(0.05, 0.15, 0.85)).toBe(0.15);
    expect(clampFraction(0.95, 0.15, 0.85)).toBe(0.85);
    expect(clampFraction(0.5, 0.15, 0.85)).toBe(0.5);
  });
});

describe('resizeStack', () => {
  it('moves fraction between the adjacent pair, preserving the sum', () => {
    const out = resizeStack([0.5, 0.5], 0, 0.1);
    expect(out[0]).toBeCloseTo(0.6);
    expect(out[1]).toBeCloseTo(0.4);
    expect(out[0] + out[1]).toBeCloseTo(1);
  });
  it('accepts negative delta (shrinks the first of the pair)', () => {
    const out = resizeStack([0.5, 0.5], 0, -0.2);
    expect(out[0]).toBeCloseTo(0.3);
    expect(out[1]).toBeCloseTo(0.7);
  });
  it('clamps so neither panel of the pair goes under min', () => {
    const out = resizeStack([0.5, 0.5], 0, 0.9, 0.15);
    expect(out[0]).toBeCloseTo(0.85);
    expect(out[1]).toBeCloseTo(0.15);
    const out2 = resizeStack([0.5, 0.5], 0, -0.9, 0.15);
    expect(out2[0]).toBeCloseTo(0.15);
    expect(out2[1]).toBeCloseTo(0.85);
  });
  it('does not touch panels outside the pair in a 3-stack', () => {
    const out = resizeStack([0.34, 0.33, 0.33], 0, 0.1);
    expect(out[2]).toBeCloseTo(0.33);
    expect(out[0] + out[1] + out[2]).toBeCloseTo(1);
  });
  it('resizes the second pair of a 3-stack', () => {
    const out = resizeStack([0.34, 0.33, 0.33], 1, 0.05);
    expect(out[0]).toBeCloseTo(0.34);
    expect(out[1]).toBeCloseTo(0.38);
    expect(out[2]).toBeCloseTo(0.28);
  });
  it('does not mutate the input array', () => {
    const input = [0.5, 0.5];
    resizeStack(input, 0, 0.1);
    expect(input[0]).toBe(0.5);
  });
});

describe('isValidSizes', () => {
  it('accepts arrays of the right length summing to ~1', () => {
    expect(isValidSizes([0.48, 0.52], 2)).toBe(true);
    expect(isValidSizes([0.34, 0.33, 0.33], 3)).toBe(true);
  });
  it('rejects wrong length, non-arrays, bad numbers and bad sums', () => {
    expect(isValidSizes([0.5, 0.5], 3)).toBe(false);
    expect(isValidSizes('nope', 2)).toBe(false);
    expect(isValidSizes([0.5, NaN], 2)).toBe(false);
    expect(isValidSizes([1.2, -0.2], 2)).toBe(false);
    expect(isValidSizes([0.3, 0.3], 2)).toBe(false);
  });
});

describe('constants', () => {
  it('exports the spec values', () => {
    expect(MIN_FRACTION).toBe(0.15);
    expect(KEY_STEP).toBe(0.02);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:ci -- src/app/shared/util/resize.spec.ts`
Expected: FAIL — módulo `./resize` não existe.

- [ ] **Step 3: Write the implementation**

Create `src/app/shared/util/resize.ts`:

```ts
/** Minimum fraction any resizable panel may occupy. */
export const MIN_FRACTION = 0.15;

/** Fraction step applied per arrow-key press on a resize handle. */
export const KEY_STEP = 0.02;

export function clampFraction(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Moves `delta` (fraction of the whole stack) from panel `index+1` to panel
 * `index`. Only the adjacent pair changes; the total sum is preserved and
 * neither panel of the pair goes below `min`.
 */
export function resizeStack(
  sizes: number[],
  index: number,
  delta: number,
  min = MIN_FRACTION,
): number[] {
  const pair = sizes[index] + sizes[index + 1];
  const first = clampFraction(sizes[index] + delta, min, pair - min);
  const next = sizes.slice();
  next[index] = first;
  next[index + 1] = pair - first;
  return next;
}

/** Validates layout fractions restored from storage. */
export function isValidSizes(value: unknown, length: number): value is number[] {
  if (!Array.isArray(value) || value.length !== length) return false;
  if (!value.every(v => typeof v === 'number' && Number.isFinite(v) && v > 0 && v < 1)) {
    return false;
  }
  const sum = value.reduce((a, b) => a + b, 0);
  return Math.abs(sum - 1) < 0.01;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:ci -- src/app/shared/util/resize.spec.ts`
Expected: PASS.

- [ ] **Step 5: Lint**

Run: `npm run lint`
Expected: 0 erros.

- [ ] **Step 6: Commit**

```bash
git add src/app/shared/util/resize.ts src/app/shared/util/resize.spec.ts
git commit -m "feat(util): pure fraction math for resizable stacks"
```

---

### Task 2: Componente `ResizeHandle`

**Files:**
- Create: `src/app/shared/ui/resizable/resize-handle.ts`
- Create: `src/app/shared/ui/resizable/resize-handle.scss`

**Interfaces:**
- Consumes: `KEY_STEP`, `MIN_FRACTION` de `src/app/shared/util/resize` (Task 1).
- Produces: componente `ResizeHandle` (selector `app-resize-handle`) com:
  - `@Input() axis: 'x' | 'y'` — `x` ajusta larguras (barra vertical), `y` ajusta alturas (barra horizontal).
  - `@Input() label = ''` — aria-label traduzido.
  - `@Input() value = 0.5` — fração atual do painel anterior (para `aria-valuenow`).
  - `@Output() resizeBy: EventEmitter<number>` — delta em fração (pointer ou tecla).
  - `@Output() reset: EventEmitter<void>` — duplo-clique.

> Sem teste unitário próprio: a matemática está na Task 1; este componente é fiação de eventos (mesmo critério do `ConsolePanel`). Gate: lint + verificação manual na Task 5.

- [ ] **Step 1: Create the component**

Create `src/app/shared/ui/resizable/resize-handle.ts`:

```ts
import {
  Component, ElementRef, EventEmitter, Input, OnDestroy, Output, inject,
} from '@angular/core';
import { KEY_STEP, MIN_FRACTION } from '../../util/resize';

/**
 * Accessible drag handle between two panels of a grid "stack".
 * Emits fraction deltas; the parent owns the sizes and the grid template.
 * Must be placed as a direct child of the grid container it resizes.
 */
@Component({
  selector: 'app-resize-handle',
  standalone: true,
  template: `
    <div
      class="handle"
      [class.axis-x]="axis === 'x'"
      [class.axis-y]="axis === 'y'"
      role="separator"
      tabindex="0"
      [attr.aria-orientation]="axis === 'x' ? 'vertical' : 'horizontal'"
      [attr.aria-label]="label"
      [attr.aria-valuenow]="valueNow"
      [attr.aria-valuemin]="valueMin"
      [attr.aria-valuemax]="valueMax"
      (pointerdown)="onPointerDown($event)"
      (keydown)="onKeyDown($event)"
      (dblclick)="reset.emit()"
    ></div>
  `,
  styleUrl: './resize-handle.scss',
})
export class ResizeHandle implements OnDestroy {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);

  @Input() axis: 'x' | 'y' = 'x';
  @Input() label = '';
  @Input() value = 0.5;
  @Output() resizeBy = new EventEmitter<number>();
  @Output() reset = new EventEmitter<void>();

  private detach?: () => void;

  get valueNow(): number {
    return Math.round(this.value * 100);
  }
  get valueMin(): number {
    return Math.round(MIN_FRACTION * 100);
  }
  get valueMax(): number {
    return Math.round((1 - MIN_FRACTION) * 100);
  }

  onPointerDown(e: PointerEvent): void {
    e.preventDefault();
    e.stopPropagation();
    const container = this.el.nativeElement.parentElement;
    if (!container) return;
    const total = this.axis === 'x' ? container.clientWidth : container.clientHeight;
    if (total <= 0) return;
    const target = e.target as HTMLElement;
    let last = this.axis === 'x' ? e.clientX : e.clientY;
    const onMove = (ev: PointerEvent): void => {
      const pos = this.axis === 'x' ? ev.clientX : ev.clientY;
      if (pos === last) return;
      this.resizeBy.emit((pos - last) / total);
      last = pos;
    };
    const onUp = (): void => {
      target.removeEventListener('pointermove', onMove);
      target.removeEventListener('pointerup', onUp);
      target.removeEventListener('pointercancel', onUp);
      this.detach = undefined;
    };
    target.setPointerCapture(e.pointerId);
    target.addEventListener('pointermove', onMove);
    target.addEventListener('pointerup', onUp);
    target.addEventListener('pointercancel', onUp);
    this.detach = onUp;
  }

  onKeyDown(e: KeyboardEvent): void {
    const dec = this.axis === 'x' ? 'ArrowLeft' : 'ArrowUp';
    const inc = this.axis === 'x' ? 'ArrowRight' : 'ArrowDown';
    if (e.key === dec) {
      e.preventDefault();
      this.resizeBy.emit(-KEY_STEP);
    } else if (e.key === inc) {
      e.preventDefault();
      this.resizeBy.emit(KEY_STEP);
    }
  }

  ngOnDestroy(): void {
    this.detach?.();
  }
}
```

- [ ] **Step 2: Create the styles**

Create `src/app/shared/ui/resizable/resize-handle.scss`:

```scss
:host { display: block; min-width: 0; min-height: 0; }

.handle {
  position: relative;
  width: 100%;
  height: 100%;
  min-width: 10px;
  min-height: 10px;
  border-radius: 5px;
  background: transparent;
  touch-action: none;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    margin: auto;
    border-radius: 2px;
    background: var(--border);
  }
  &.axis-x { cursor: col-resize; }
  &.axis-x::after { width: 3px; height: 36px; }
  &.axis-y { cursor: row-resize; }
  &.axis-y::after { height: 3px; width: 36px; }

  &:hover::after { background: var(--accent); }
  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: -2px;
    &::after { background: var(--accent); }
  }
}
```

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: 0 erros.

- [ ] **Step 4: Commit**

```bash
git add src/app/shared/ui/resizable/
git commit -m "feat(ui): accessible resize handle component"
```

---

### Task 3: Integrar no `Playground`

**Files:**
- Modify: `src/app/features/tools/playground/playground.logic.ts`
- Modify: `src/app/features/tools/playground/playground.logic.spec.ts`
- Modify: `src/app/features/tools/playground/playground.ts`
- Modify: `src/app/features/tools/playground/playground.scss`
- Modify: `src/app/features/tools/playground/editor/code-editor.scss`
- Modify: `src/app/features/tools/playground/console-panel.scss`

**Interfaces:**
- Consumes: `resizeStack`, `isValidSizes` (Task 1); `ResizeHandle` (Task 2, import de `../../../shared/ui/resizable/resize-handle`).
- Produces: `PlaygroundLayout`, `DEFAULT_LAYOUT` em `playground.logic.ts`.

- [ ] **Step 1: Add layout types to the logic (test first)**

Append to `src/app/features/tools/playground/playground.logic.spec.ts` (dentro do bloco de imports existente no topo, acrescente `DEFAULT_LAYOUT`):

```ts
describe('DEFAULT_LAYOUT', () => {
  it('has the spec fractions, each axis summing to 1', () => {
    expect(DEFAULT_LAYOUT.cols).toEqual([0.48, 0.52]);
    expect(DEFAULT_LAYOUT.out).toEqual([0.62, 0.38]);
    expect(DEFAULT_LAYOUT.editors).toEqual([0.34, 0.33, 0.33]);
  });
});
```

Append to `src/app/features/tools/playground/playground.logic.ts`:

```ts
/** Panel fractions per resizable axis. Each array sums to 1. */
export interface PlaygroundLayout {
  cols: number[];
  out: number[];
  editors: number[];
}

export const DEFAULT_LAYOUT: PlaygroundLayout = {
  cols: [0.48, 0.52],
  out: [0.62, 0.38],
  editors: [0.34, 0.33, 0.33],
};
```

Run: `npm run test:ci -- src/app/features/tools/playground/playground.logic.spec.ts`
Expected: PASS.

- [ ] **Step 2: Add signals, computed styles and handlers to the component**

Em `src/app/features/tools/playground/playground.ts`:

Imports — acrescente ao import da logic: `PlaygroundLayout, DEFAULT_LAYOUT`; e adicione:

```ts
import { ResizeHandle } from '../../../shared/ui/resizable/resize-handle';
import { resizeStack, isValidSizes } from '../../../shared/util/resize';
```

No decorator, acrescente `ResizeHandle` a `imports: [...]`.

Logo após o signal `single`, adicione:

```ts
  readonly cols = signal<number[]>([...DEFAULT_LAYOUT.cols]);
  readonly out = signal<number[]>([...DEFAULT_LAYOUT.out]);
  readonly editorRows = signal<number[]>([...DEFAULT_LAYOUT.editors]);
  readonly colsStyle = computed(
    () => `minmax(0, ${this.cols()[0]}fr) auto minmax(0, ${this.cols()[1]}fr)`,
  );
  readonly outStyle = computed(
    () => `auto minmax(0, ${this.out()[0]}fr) auto minmax(0, ${this.out()[1]}fr)`,
  );
  readonly editorRowsStyle = computed(() => {
    const [a, b, c] = this.editorRows();
    return `minmax(0, ${a}fr) auto minmax(0, ${b}fr) auto minmax(0, ${c}fr)`;
  });
```

Junto dos outros labels `$localize`:

```ts
  readonly resizeColsLabel = $localize`:@@tools.playground.resizeCols:Redimensionar editores e saída`;
  readonly resizeOutputLabel = $localize`:@@tools.playground.resizeOutput:Redimensionar preview e console`;
  readonly resizeEditorsLabel = $localize`:@@tools.playground.resizeEditors:Redimensionar editores`;
```

Handlers (por exemplo, após `setMode`):

```ts
  onResizeCols(delta: number): void {
    this.cols.set(resizeStack(this.cols(), 0, delta));
    this.scheduleSave();
  }

  onResizeOutput(delta: number): void {
    this.out.set(resizeStack(this.out(), 0, delta));
    this.scheduleSave();
  }

  onResizeEditors(index: number, delta: number): void {
    this.editorRows.set(resizeStack(this.editorRows(), index, delta));
    this.scheduleSave();
  }

  resetLayout(axis: keyof PlaygroundLayout): void {
    if (axis === 'cols') this.cols.set([...DEFAULT_LAYOUT.cols]);
    else if (axis === 'out') this.out.set([...DEFAULT_LAYOUT.out]);
    else this.editorRows.set([...DEFAULT_LAYOUT.editors]);
    this.scheduleSave();
  }
```

> `scheduleSave` é o debounce privado existente. Se o nome no arquivo for `this.scheduleSave` como campo privado, mantenha o acesso direto (mesma classe).

- [ ] **Step 3: Persist and restore the layout**

Em `save()`, acrescente ao objeto gravado:

```ts
      layout: { cols: this.cols(), out: this.out(), editors: this.editorRows() },
```

Em `restore()`, dentro do `try`, após a restauração de `single`/`mode`:

```ts
      const layout = (s as { layout?: Partial<PlaygroundLayout> }).layout;
      if (layout) {
        if (isValidSizes(layout.cols, 2)) this.cols.set(layout.cols);
        if (isValidSizes(layout.out, 2)) this.out.set(layout.out);
        if (isValidSizes(layout.editors, 3)) this.editorRows.set(layout.editors);
      }
```

- [ ] **Step 4: Update the template**

Substitua a raiz `<div class="pg">` por `<div class="pg" [style.gridTemplateColumns]="colsStyle()">`.

No ramo `@if (mode() === 'split')`, a `<div class="pg-editors">` vira
`<div class="pg-editors" [style.gridTemplateRows]="editorRowsStyle()">` e ganha dois
handles entre os editores:

```html
          <div class="pg-editors" [style.gridTemplateRows]="editorRowsStyle()">
            <div class="pg-editor" [class.hidden-mobile]="tab() !== 'html'">
              <span class="pg-label">HTML</span>
              <app-code-editor language="html" [value]="html()" [ariaLabel]="'HTML'"
                (valueChange)="onHtml($event)" (run)="run()" />
            </div>
            <app-resize-handle axis="y" [label]="resizeEditorsLabel" [value]="editorRows()[0]"
              (resizeBy)="onResizeEditors(0, $event)" (reset)="resetLayout('editors')" />
            <div class="pg-editor" [class.hidden-mobile]="tab() !== 'css'">
              <span class="pg-label">CSS</span>
              <app-code-editor language="css" [value]="css()" [ariaLabel]="'CSS'"
                (valueChange)="onCss($event)" (run)="run()" />
            </div>
            <app-resize-handle axis="y" [label]="resizeEditorsLabel" [value]="editorRows()[1]"
              (resizeBy)="onResizeEditors(1, $event)" (reset)="resetLayout('editors')" />
            <div class="pg-editor" [class.hidden-mobile]="tab() !== 'javascript'">
              <span class="pg-label">JS</span>
              <app-code-editor language="javascript" [value]="js()" [ariaLabel]="'JavaScript'"
                (valueChange)="onJs($event)" (run)="run()" />
            </div>
          </div>
```

Entre o fim do bloco `@if/@else` dos editores e a `<div class="pg-output">`, adicione o
handle de colunas (filho direto de `.pg`):

```html
        <app-resize-handle axis="x" [label]="resizeColsLabel" [value]="cols()[0]"
          (resizeBy)="onResizeCols($event)" (reset)="resetLayout('cols')" />
```

Na `<div class="pg-output">`, vire
`<div class="pg-output" [style.gridTemplateRows]="outStyle()">` e adicione o handle entre
preview e console:

```html
          <div class="pg-preview">
            <iframe #frame class="pg-frame" [style.width]="frameWidth()"
              sandbox="allow-scripts" [attr.title]="previewLabel"></iframe>
          </div>

          <app-resize-handle axis="y" [label]="resizeOutputLabel" [value]="out()[0]"
            (resizeBy)="onResizeOutput($event)" (reset)="resetLayout('out')" />

          <app-console-panel [lines]="consoleLines()" (clear)="clearConsole()" />
```

- [ ] **Step 5: Update the playground styles**

Em `src/app/features/tools/playground/playground.scss`, substitua o bloco
`@media (min-width: 1024px)` inteiro por:

```scss
@media (min-width: 1024px) {
  .pg {
    display: grid;
    // colunas vêm do binding inline [style.gridTemplateColumns]
    height: clamp(480px, calc(100vh - 240px), 900px);
  }
  .pg-editors {
    display: grid;
    // linhas vêm do binding inline [style.gridTemplateRows] (modo Separado)
    min-height: 0;
    gap: 0;
  }
  .pg-editor { min-height: 0; }
  .pg-editor app-code-editor { flex: 1; min-height: 0; }
  .pg-output {
    display: grid;
    // linhas vêm do binding inline [style.gridTemplateRows]
    min-height: 0;
    gap: 0;
  }
  .pg-preview { min-height: 0; }
  .pg-frame { height: 100%; }
  app-console-panel { min-height: 0; }
}

@media (max-width: 1023px) {
  app-resize-handle { display: none; }
}
```

> Nota: o modo Único tem um editor só em `.pg-editors`; o binding `gridTemplateRows`
> só é aplicado no ramo split, então no Único a grade usa a linha única implícita.

- [ ] **Step 6: Make the editor and console fill their tracks**

Em `src/app/features/tools/playground/editor/code-editor.scss`, substitua o conteúdo por:

```scss
:host {
  display: flex;
  flex-direction: column;
  min-height: 0;
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
  background: var(--bg);
}
.cm-fallback {
  flex: 1;
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
  flex: 1;
  min-height: 120px;
  overflow: hidden;
  font-size: 0.8125rem;
}
:host ::ng-deep .cm-editor { height: 100%; }
:host ::ng-deep .cm-scroller { overflow: auto; }
:host ::ng-deep .cm-editor.cm-focused { outline: 2px solid var(--accent); outline-offset: -2px; }
```

Em `src/app/features/tools/playground/console-panel.scss`, substitua o bloco `.console` por:

```scss
:host { display: block; min-height: 0; }
.console {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
  min-height: 120px;
  height: 100%;
}
@media (max-width: 1023px) {
  .console { height: auto; max-height: 220px; }
}
```

(As demais regras do arquivo ficam como estão.)

- [ ] **Step 7: Lint**

Run: `npm run lint`
Expected: 0 erros (4 warnings a11y pré-existentes ok). **Não rode build** — targets en entram na Task 4.

- [ ] **Step 8: Run the full test suite**

Run: `npm run test:ci`
Expected: verde (nenhum teste existente quebra).

- [ ] **Step 9: Commit**

```bash
git add src/app/features/tools/playground/ src/app/shared/
git commit -m "feat(playground): draggable resize handles on 3 axes with persistence"
```

---

### Task 4: i18n — extração, tradução en e verificação

**Files:**
- Modify: `src/locale/messages.xlf`
- Modify: `src/locale/messages.en.xlf`

**Interfaces:** N/A.

- [ ] **Step 1: Extract**

Run: `npx ng extract-i18n --output-path src/locale`
Expected: novos ids `tools.playground.resizeCols`, `tools.playground.resizeOutput`,
`tools.playground.resizeEditors` em `messages.xlf`. (Warnings `pt-BR`→`pt` e
`localize/init` são pré-existentes e cosméticos.)

- [ ] **Step 2: Fill English targets**

Em `src/locale/messages.en.xlf`, junto dos outros units `tools.playground.*`, adicione:

```xml
      <trans-unit id="tools.playground.resizeCols" datatype="html">
        <source>Redimensionar editores e saída</source>
        <target state="translated">Resize editors and output</target>
      </trans-unit>
      <trans-unit id="tools.playground.resizeOutput" datatype="html">
        <source>Redimensionar preview e console</source>
        <target state="translated">Resize preview and console</target>
      </trans-unit>
      <trans-unit id="tools.playground.resizeEditors" datatype="html">
        <source>Redimensionar editores</source>
        <target state="translated">Resize editors</target>
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
Expected: `missing:` vazio, `orphan:` vazio, `units` == `targets` (181/181).

- [ ] **Step 4: Commit**

```bash
git add src/locale/messages.xlf src/locale/messages.en.xlf
git commit -m "i18n(playground): resize handle labels"
```

---

### Task 5: Verificação final

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
grep -o "Redimensionar[^\"<]*" dist/portfolio/browser/tools/playground/index.html | sort -u
grep -o "Resize[^\"<]*" dist/portfolio/browser/en/tools/playground/index.html | sort -u
```
Expected: pt mostra os 3 labels `Redimensionar…`; en mostra os 3 `Resize…`.

- [ ] **Step 4: Manual smoke (dev server)**

`npm start` → `/tools/playground` em viewport ≥1024px:
- arrastar o divisor central (editores↔saída) redimensiona as colunas;
- arrastar o divisor preview↔console redimensiona as alturas;
- arrastar os divisores entre HTML/CSS/JS redimensiona os editores;
- Tab foca um divisor; setas redimensionam; duplo-clique reseta o eixo;
- recarregar a página restaura as frações;
- estreitar a janela (<1024px) esconde os divisores e volta ao layout empilhado/tabs;
- modo Único continua funcional (divisor central e preview↔console seguem ativos).
