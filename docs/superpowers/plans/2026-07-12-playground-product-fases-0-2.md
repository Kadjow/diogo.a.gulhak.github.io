# Playground Produto — Fases 0-2 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fundação visual do Playground como produto — design system de controles, toolbar com hierarquia, preview/console de nível produto (Fases 0-2 da spec `docs/superpowers/specs/2026-07-12-playground-product-design.md`).

**Architecture:** Um partial SCSS (`_controls.scss`) define o sistema de botões/segmented/switch, consumido via `@use` pelos SCSS dos componentes do playground. Lógica nova (filtro de console, contagem) entra como funções puras em `playground.logic.ts` com TDD. Template do `Playground` é reestruturado por regiões (toolbar → editores → preview → console) em tasks separadas.

**Tech Stack:** Angular 22 standalone + signals, SCSS com tokens, Vitest.

## Global Constraints

- **Tokens-only:** cores/sombras SÓ via CSS custom properties de `src/styles/_tokens.scss`. Zero hex em SCSS de componente (hex novos entram como token).
- **SSR-safe:** `document`/`window` sempre com guarda (`typeof document !== 'undefined'` ou `isPlatformBrowser`).
- **Cleanup:** todo `setTimeout`/listener novo limpo em `ngOnDestroy`.
- **i18n:** toda string visível nova = `i18n`/`$localize` com ID `@@tools.playground.*`. String condicional em template (`{{ cond ? 'A' : 'B' }}`) NÃO extrai — mover pra propriedade `$localize` no componente. `extract-i18n` roda SÓ na Task 9 (depois de todas as edições de texto).
- **Vitest:** `.toBe(true)`/`.toBe(false)` — nunca `.toBeTrue()`/`.toBeFalse()`. Mocks vazios = `() => undefined`.
- **Reduced motion:** toda transição nova dentro de `@media (prefers-reduced-motion: reduce) { ... transition: none; }`.
- **QA (CLAUDE.md):** executor anexa saída de `npm run lint` + `npm run test:ci` em cada task; Task 9 roda gates completos (build 2 locales + paridade i18n).
- **Commits:** um por task, mensagem indicada na task (execução do plano foi aprovada pelo usuário — commits fazem parte).

---

### Task 1: Tokens novos (espaçamento, linguagens, preview)

**Files:**
- Modify: `src/styles/_tokens.scss`

**Interfaces:**
- Produces: `--space-1..4`, `--lang-html`, `--lang-css`, `--lang-js`, `--preview-bg` — consumidos pelas Tasks 2-8.

- [ ] **Step 1: Adicionar tokens**

Em `:root` (bloco claro), após a linha `--radius: 12px; --radius-lg: 18px;`:

```scss
  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px;
  /* Preview é um "mini-browser": páginas assumem fundo branco default nos 2 temas. */
  --preview-bg: #fff;
  /* Cores de marca das linguagens (dots dos editores) — iguais nos 2 temas. */
  --lang-html: #E44D26; --lang-css: #2965F1; --lang-js: #F7DF1E;
```

Em `:root[data-theme="dark"]`, após `--warn: #fbbf24;`:

```scss
  --preview-bg: #fff;
  --lang-html: #E44D26; --lang-css: #2965F1; --lang-js: #F7DF1E;
```

- [ ] **Step 2: Verificar build**

Run: `npm run lint && npm run test:ci`
Expected: lint 0 erros; suíte verde.

- [ ] **Step 3: Commit**

```bash
git add src/styles/_tokens.scss
git commit -m "feat(playground): design tokens for spacing, language dots and preview bg"
```

---

### Task 2: Partial `_controls.scss` — sistema de controles

**Files:**
- Create: `src/app/features/tools/playground/_controls.scss`

**Interfaces:**
- Produces (classes CSS): `.pgc-btn`, `.pgc-btn--primary`, `.pgc-btn--secondary`, `.pgc-btn--ghost`, `.pgc-btn--danger`, `.pgc-seg`, `.pgc-seg-btn`, `.pgc-seg-btn--icon`, `.pgc-switch` (+ `-track`/`-thumb`/`-label`). Consumidas nas Tasks 3-8 via `@use 'controls';` (mesmo dir) ou `@use '../controls';` (ai-panel).

- [ ] **Step 1: Criar o partial**

```scss
// Sistema de controles do playground — 3 papéis de botão, segmented control, switch.
// Só consome tokens de _tokens.scss. Nenhum hex aqui.

.pgc-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  height: 34px;
  padding: 0 var(--space-4);
  border: 1.5px solid transparent;
  border-radius: 999px;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease, filter 0.15s ease;
  &:disabled { opacity: 0.5; cursor: default; }
  &:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
}
.pgc-btn--primary {
  background: var(--accent);
  color: var(--btn-fg);
  border-color: var(--accent);
  &:hover:not(:disabled) { filter: brightness(1.08); }
}
.pgc-btn--secondary {
  background: transparent;
  color: var(--ink);
  border-color: var(--ink);
  &:hover:not(:disabled) { background: var(--ink); color: var(--bg); }
}
.pgc-btn--ghost {
  background: transparent;
  color: var(--muted);
  padding: 0 var(--space-2);
  &:hover:not(:disabled) { color: var(--ink); }
}
.pgc-btn--danger {
  background: var(--danger);
  color: var(--btn-fg);
  border-color: var(--danger);
}

.pgc-seg {
  display: inline-flex;
  gap: 2px;
  padding: 2px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
}
.pgc-seg-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  height: 28px;
  padding: 0 var(--space-2);
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--muted);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
  &.active { background: var(--bg); color: var(--ink); box-shadow: inset 0 0 0 1px var(--border); }
  &:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
}
.pgc-seg-btn--icon { width: 30px; padding: 0; }

.pgc-switch {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  border: 0;
  background: transparent;
  color: var(--muted);
  font-size: 0.8125rem;
  cursor: pointer;
  &:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
}
.pgc-switch-track {
  position: relative;
  width: 30px;
  height: 16px;
  border-radius: 999px;
  background: var(--border);
  transition: background 0.15s ease;
}
.pgc-switch-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--bg);
  transition: transform 0.15s ease;
}
.pgc-switch[aria-checked='true'] .pgc-switch-track { background: var(--accent); }
.pgc-switch[aria-checked='true'] .pgc-switch-thumb { transform: translateX(14px); }

@media (prefers-reduced-motion: reduce) {
  .pgc-btn, .pgc-seg-btn, .pgc-switch-track, .pgc-switch-thumb { transition: none; }
}
```

- [ ] **Step 2: Verificar que compila (partial ainda sem consumidor)**

Run: `npm run lint`
Expected: 0 erros (partial `_`-prefixado não compila sozinho — lint passa é o suficiente aqui).

- [ ] **Step 3: Commit**

```bash
git add src/app/features/tools/playground/_controls.scss
git commit -m "feat(playground): unified control system partial (buttons, segmented, switch)"
```

---

### Task 3: Toolbar — segmented controls (mode + viewport) com SVG e teclado

**Files:**
- Modify: `src/app/features/tools/playground/playground.ts` (template: bloco `.pg-toolbar`; classe: handler de teclado)
- Modify: `src/app/features/tools/playground/playground.scss`
- Modify: `src/app/features/tools/playground/playground.logic.ts` (constantes de opções)

**Interfaces:**
- Consumes: `.pgc-seg`/`.pgc-seg-btn` (Task 2), `nextTabIndex(current: number, key: string, len: number): number` de `src/app/shared/a11y/roving-tabindex.ts`.
- Produces: `MODE_OPTIONS: PlaygroundMode[]`, `VIEWPORT_OPTIONS: Viewport[]` em `playground.logic.ts`; método `onSegKeydown(e: KeyboardEvent, group: 'mode' | 'viewport'): void` no componente. IDs DOM `pg-mode-<valor>` / `pg-viewport-<valor>`.

- [ ] **Step 1: Teste das constantes (falha primeiro)**

Em `src/app/features/tools/playground/playground.logic.spec.ts`, adicionar:

```ts
import { MODE_OPTIONS, VIEWPORT_OPTIONS } from './playground.logic';

describe('segmented options', () => {
  it('expõe as opções na ordem da UI', () => {
    expect(MODE_OPTIONS).toEqual(['split', 'single']);
    expect(VIEWPORT_OPTIONS).toEqual(['desktop', 'tablet', 'mobile']);
  });
});
```

Run: `npm run test:ci` → Expected: FAIL (`MODE_OPTIONS` não exportado).

- [ ] **Step 2: Exportar constantes em `playground.logic.ts`**

Após `export type PlaygroundMode = 'split' | 'single';`:

```ts
export const MODE_OPTIONS: PlaygroundMode[] = ['split', 'single'];
export const VIEWPORT_OPTIONS: Viewport[] = ['desktop', 'tablet', 'mobile'];
```

Run: `npm run test:ci` → Expected: PASS.

- [ ] **Step 3: Reescrever os grupos mode/viewport no template**

Substituir os blocos `.pg-modes` e `.pg-viewports` dentro de `.pg-toolbar` por:

```html
<div class="pgc-seg" role="group" [attr.aria-label]="modeGroupLabel"
  (keydown)="onSegKeydown($event, 'mode')">
  <button type="button" class="pgc-seg-btn" id="pg-mode-split"
    [class.active]="mode() === 'split'" [attr.aria-pressed]="mode() === 'split'"
    [tabindex]="mode() === 'split' ? 0 : -1" (click)="setMode('split')"
    i18n="@@tools.playground.modeSplit">Separado</button>
  <button type="button" class="pgc-seg-btn" id="pg-mode-single"
    [class.active]="mode() === 'single'" [attr.aria-pressed]="mode() === 'single'"
    [tabindex]="mode() === 'single' ? 0 : -1" (click)="setMode('single')"
    i18n="@@tools.playground.modeSingle">Único</button>
</div>
<div class="pg-view">
  <div class="pgc-seg" role="group" [attr.aria-label]="viewportLabel"
    (keydown)="onSegKeydown($event, 'viewport')">
    <button type="button" class="pgc-seg-btn pgc-seg-btn--icon" id="pg-viewport-desktop"
      [class.active]="viewport() === 'desktop'" [attr.aria-pressed]="viewport() === 'desktop'"
      [tabindex]="viewport() === 'desktop' ? 0 : -1" (click)="viewport.set('desktop')"
      [attr.aria-label]="desktopLabel">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
        stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>
      </svg>
    </button>
    <button type="button" class="pgc-seg-btn pgc-seg-btn--icon" id="pg-viewport-tablet"
      [class.active]="viewport() === 'tablet'" [attr.aria-pressed]="viewport() === 'tablet'"
      [tabindex]="viewport() === 'tablet' ? 0 : -1" (click)="viewport.set('tablet')"
      [attr.aria-label]="tabletLabel">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
        stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect x="4" y="2" width="16" height="20" rx="2"/><path d="M12 18h.01"/>
      </svg>
    </button>
    <button type="button" class="pgc-seg-btn pgc-seg-btn--icon" id="pg-viewport-mobile"
      [class.active]="viewport() === 'mobile'" [attr.aria-pressed]="viewport() === 'mobile'"
      [tabindex]="viewport() === 'mobile' ? 0 : -1" (click)="viewport.set('mobile')"
      [attr.aria-label]="mobileLabel">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
        stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect x="7" y="2" width="10" height="20" rx="2"/><path d="M12 18h.01"/>
      </svg>
    </button>
  </div>
  <span class="pg-ruler">{{ frameWidth() }}</span>
</div>
```

- [ ] **Step 4: Handler de teclado no componente**

Imports: adicionar `MODE_OPTIONS, VIEWPORT_OPTIONS` ao import de `./playground.logic` e `import { nextTabIndex } from '../../../shared/a11y/roving-tabindex';`. Método novo:

```ts
onSegKeydown(e: KeyboardEvent, group: 'mode' | 'viewport'): void {
  const opts: readonly string[] = group === 'mode' ? MODE_OPTIONS : VIEWPORT_OPTIONS;
  const current = opts.indexOf(group === 'mode' ? this.mode() : this.viewport());
  const next = nextTabIndex(current, e.key, opts.length);
  if (next === current) return;
  e.preventDefault();
  if (group === 'mode') this.setMode(MODE_OPTIONS[next]);
  else this.viewport.set(VIEWPORT_OPTIONS[next]);
  if (typeof document !== 'undefined') {
    document.getElementById(`pg-${group}-${opts[next]}`)?.focus();
  }
}
```

- [ ] **Step 5: SCSS — remover estilos velhos, adicionar novos**

Em `playground.scss`: primeira linha vira `@use 'controls';`. Remover os blocos `.pg-modes`, `.pg-mode`, `.pg-viewports`, `.pg-vp`. Adicionar:

```scss
.pg-view { display: flex; align-items: center; gap: var(--space-2); }
.pg-ruler {
  font-size: 0.6875rem;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
  min-width: 40px;
}
```

- [ ] **Step 6: Verificar**

Run: `npm run lint && npm run test:ci`
Expected: 0 erros / verde. Manual (`npm start`): setas ←→ navegam mode e viewport; foco segue; ruler mostra `100%`/`768px`/`375px`.

- [ ] **Step 7: Commit**

```bash
git add src/app/features/tools/playground/
git commit -m "feat(playground): segmented controls with SVG icons, roving tabindex and viewport ruler"
```

---

### Task 4: Toolbar — ações (Run herói, Reset com confirmação, Auto switch)

**Files:**
- Modify: `src/app/features/tools/playground/playground.ts` (template: bloco `.pg-actions`; classe: reset pendente + labels)
- Modify: `src/app/features/tools/playground/playground.scss`

**Interfaces:**
- Consumes: `.pgc-btn*`, `.pgc-switch*` (Task 2).
- Produces: `resetPending: WritableSignal<boolean>`, `onReset(): void`, labels `resetLabel`/`resetConfirmLabel` no componente.

- [ ] **Step 1: Substituir `.pg-actions` no template**

```html
<div class="pg-actions">
  <button type="button" class="pgc-btn pgc-btn--primary" (click)="run()">
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z"/>
    </svg>
    <ng-container i18n="@@tools.playground.run">Run</ng-container>
  </button>
  <button type="button" class="pgc-btn pgc-btn--secondary" (click)="stop()"
    i18n="@@tools.playground.stop">Stop</button>
  <button type="button" class="pgc-btn pgc-btn--secondary" (click)="export()"
    i18n="@@tools.playground.export">Export</button>
  <button type="button" class="pgc-btn"
    [class.pgc-btn--ghost]="!resetPending()" [class.pgc-btn--danger]="resetPending()"
    (click)="onReset()">{{ resetPending() ? resetConfirmLabel : resetLabel }}</button>
  <button type="button" class="pgc-switch" role="switch" [attr.aria-checked]="autoRun()"
    (click)="toggleAutoRun()">
    <span class="pgc-switch-track"><span class="pgc-switch-thumb"></span></span>
    <span i18n="@@tools.playground.auto">Auto</span>
  </button>
</div>
```

Nota: o botão Reset perde o atributo `i18n` do template (string condicional não extrai) — labels viram `$localize` na classe, preservando os IDs.

- [ ] **Step 2: Classe — estado de confirmação + labels + cleanup**

```ts
readonly resetPending = signal(false);
private resetTimer?: ReturnType<typeof setTimeout>;

readonly resetLabel = $localize`:@@tools.playground.reset:Reset`;
readonly resetConfirmLabel = $localize`:@@tools.playground.resetConfirm:Confirmar?`;

onReset(): void {
  if (!this.resetPending()) {
    this.resetPending.set(true);
    this.resetTimer = setTimeout(() => this.resetPending.set(false), 4000);
    return;
  }
  clearTimeout(this.resetTimer);
  this.resetPending.set(false);
  this.reset();
}
```

Em `ngOnDestroy()`, adicionar: `clearTimeout(this.resetTimer);`

- [ ] **Step 3: SCSS — limpar estilos velhos**

Remover de `playground.scss` os blocos `.pg-btn` e `.pg-auto`. Ajustar `.pg-actions`:

```scss
.pg-actions { display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap; }
```

- [ ] **Step 4: Verificar**

Run: `npm run lint && npm run test:ci`
Expected: 0 erros / verde. Manual: Run preenchido (herói); Reset 1º clique vira "Confirmar?" vermelho, reverte em 4s sem clique; Auto é switch com thumb animado (sem animação com reduced-motion).

- [ ] **Step 5: Commit**

```bash
git add src/app/features/tools/playground/
git commit -m "feat(playground): action cluster with primary Run, confirm-to-reset and Auto switch"
```

---

### Task 5: Headers dos editores com dot de linguagem

**Files:**
- Modify: `src/app/features/tools/playground/playground.ts` (template: os 4 `<span class="pg-label">`)
- Modify: `src/app/features/tools/playground/playground.scss`

**Interfaces:**
- Consumes: tokens `--lang-*` (Task 1).

- [ ] **Step 1: Substituir os labels no template**

Cada `<span class="pg-label">HTML</span>` (e CSS/JS, e o do modo Único) vira:

```html
<span class="pg-editor-head">
  <i class="pg-lang-dot pg-lang-dot--html" aria-hidden="true"></i>HTML
</span>
```

CSS usa `pg-lang-dot--css` + texto `CSS`; JS usa `pg-lang-dot--js` + texto `JS`. Modo Único usa o dot de HTML.

- [ ] **Step 2: SCSS**

Substituir o bloco `.pg-label` por:

```scss
.pg-editor-head {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--muted);
}
.pg-lang-dot { width: 8px; height: 8px; border-radius: 50%; }
.pg-lang-dot--html { background: var(--lang-html); }
.pg-lang-dot--css { background: var(--lang-css); }
.pg-lang-dot--js { background: var(--lang-js); }
```

Na media query `(max-width: 699px)`, trocar `.pg-editor .pg-label { display: none; }` por `.pg-editor .pg-editor-head { display: none; }`.

- [ ] **Step 3: Verificar + commit**

Run: `npm run lint && npm run test:ci` → 0 erros / verde.

```bash
git add src/app/features/tools/playground/
git commit -m "feat(playground): editor headers with language color dots"
```

---

### Task 6: Preview — token de fundo, estados e ritmo de espaçamento

**Files:**
- Modify: `src/app/features/tools/playground/playground.ts` (template: bloco `.pg-preview`; classe: `running`/`stopped`)
- Modify: `src/app/features/tools/playground/playground.scss`

**Interfaces:**
- Consumes: `--preview-bg`, `--space-*` (Task 1).
- Produces: signals `running`, `stopped`; método `onFrameLoad(): void`; label `stoppedMsg`.

- [ ] **Step 1: Template do preview**

```html
<div class="pg-preview" [class.is-loading]="running()">
  <iframe #frame class="pg-frame" [style.width]="frameWidth()" (load)="onFrameLoad()"
    sandbox="allow-scripts" [attr.title]="previewLabel"></iframe>
  @if (stopped()) {
    <p class="pg-preview-msg">{{ stoppedMsg }}</p>
  }
</div>
```

- [ ] **Step 2: Classe**

```ts
readonly running = signal(false);
readonly stopped = signal(false);
readonly stoppedMsg = $localize`:@@tools.playground.stoppedMsg:Preview parado. Aperte Run para recomeçar.`;

onFrameLoad(): void { this.running.set(false); }
```

Em `run()`: primeira linha do corpo (após os guards) adicionar `this.running.set(true); this.stopped.set(false);`
Em `stop()`: após setar o srcdoc, adicionar `this.stopped.set(true); this.running.set(false);`

- [ ] **Step 3: SCSS — matar `#fff`, estados, espaçamento**

Substituir `.pg-preview` e `.pg-frame`:

```scss
.pg-preview {
  position: relative;
  display: flex;
  justify-content: center;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--preview-bg);
  overflow: auto;
  min-height: 260px;
}
.pg-frame {
  height: 320px;
  max-width: 100%;
  border: 0;
  background: var(--preview-bg);
  transition: opacity 0.15s ease;
}
.pg-preview.is-loading .pg-frame { opacity: 0.4; }
.pg-preview-msg {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  font-size: 0.8125rem;
  color: var(--muted);
  background: var(--surface);
}
```

Normalizar o ritmo (escala 4/8/12/16) no mesmo arquivo:

```scss
.pg { /* gap: 14px */ gap: var(--space-4); }
.pg-tabs { /* gap: 6px */ gap: var(--space-2); }
.pg-editors { /* gap: 10px */ gap: var(--space-3); }
.pg-editor { /* gap: 4px */ gap: var(--space-1); }
.pg-output { /* gap: 12px */ gap: var(--space-3); }
.pg-toolbar { /* gap: 10px */ gap: var(--space-3); }
.pg-ai { /* margin-top: 14px */ margin-top: var(--space-4); }
```

E substituir o bloco `prefers-reduced-motion` existente (que cita `.pg-vp`/`.pg-btn`, classes removidas) por:

```scss
@media (prefers-reduced-motion: reduce) {
  .pg-tab, .pg-frame { transition: none; }
}
```

- [ ] **Step 4: Verificar + commit**

Run: `npm run lint && npm run test:ci` → 0 erros / verde. Manual: dark theme sem quebra no preview; Stop mostra mensagem; durante run o frame esmaece.

```bash
git add src/app/features/tools/playground/
git commit -m "feat(playground): preview bg token, run/stop states and normalized spacing scale"
```

---

### Task 7: Console — filtros, contadores, timestamps, linha do erro (TDD)

**Files:**
- Modify: `src/app/features/tools/playground/playground.logic.ts`
- Modify: `src/app/features/tools/playground/playground.logic.spec.ts`
- Modify: `src/app/features/tools/playground/playground.ts` (`onMessage` gera `time`)
- Modify: `src/app/features/tools/playground/console-panel.ts`
- Modify: `src/app/features/tools/playground/console-panel.scss`

**Interfaces:**
- Produces: `ConsoleLine.time?: string`; `filterConsoleLines(lines: ConsoleLine[], active: ReadonlySet<ConsoleLine['level']>): ConsoleLine[]`; `countByLevel(lines: ConsoleLine[]): Record<ConsoleLine['level'], number>`; `CONSOLE_BOOTSTRAP` reporta `(lineno:colno)` em erros.

- [ ] **Step 1: Testes que falham**

Em `playground.logic.spec.ts`:

```ts
import { filterConsoleLines, countByLevel, CONSOLE_BOOTSTRAP } from './playground.logic';
import type { ConsoleLine } from './playground.logic';

describe('console filtering', () => {
  const lines: ConsoleLine[] = [
    { level: 'log', text: 'a' },
    { level: 'error', text: 'b' },
    { level: 'warn', text: 'c' },
    { level: 'error', text: 'd' },
  ];

  it('filtra por níveis ativos', () => {
    const out = filterConsoleLines(lines, new Set(['error']));
    expect(out.length).toBe(2);
    expect(out.every(l => l.level === 'error')).toBe(true);
  });

  it('conjunto vazio esconde tudo', () => {
    expect(filterConsoleLines(lines, new Set()).length).toBe(0);
  });

  it('conta por nível', () => {
    expect(countByLevel(lines)).toEqual({ log: 1, info: 0, warn: 1, error: 2 });
  });

  it('bootstrap reporta linha e coluna do erro', () => {
    expect(CONSOLE_BOOTSTRAP.includes('e.lineno')).toBe(true);
    expect(CONSOLE_BOOTSTRAP.includes('e.colno')).toBe(true);
  });
});
```

Run: `npm run test:ci` → Expected: FAIL (funções não existem; bootstrap sem lineno).

- [ ] **Step 2: Implementar em `playground.logic.ts`**

`ConsoleLine` ganha campo opcional:

```ts
export interface ConsoleLine {
  level: 'log' | 'info' | 'warn' | 'error';
  text: string;
  time?: string;
}
```

Funções novas (após `formatConsoleArg`):

```ts
export function filterConsoleLines(
  lines: ConsoleLine[],
  active: ReadonlySet<ConsoleLine['level']>,
): ConsoleLine[] {
  return lines.filter(l => active.has(l.level));
}

export function countByLevel(lines: ConsoleLine[]): Record<ConsoleLine['level'], number> {
  const counts: Record<ConsoleLine['level'], number> = { log: 0, info: 0, warn: 0, error: 0 };
  for (const l of lines) counts[l.level] += 1;
  return counts;
}
```

No `CONSOLE_BOOTSTRAP`, trocar a linha do listener de erro por:

```ts
  "window.addEventListener('error',function(e){send('error',[e.message+' ('+(e.lineno||0)+':'+(e.colno||0)+')']);});",
```

Run: `npm run test:ci` → Expected: PASS.

- [ ] **Step 3: `onMessage` gera timestamp**

Em `playground.ts`, na criação da linha:

```ts
const line: ConsoleLine = {
  level: data.level,
  text: String(data.text),
  time: new Date().toTimeString().slice(0, 8),
};
```

- [ ] **Step 4: Console panel — filtros + contadores + timestamps**

`console-panel.ts` completo:

```ts
import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { ConsoleLine, filterConsoleLines, countByLevel } from './playground.logic';

@Component({
  selector: 'app-console-panel',
  standalone: true,
  template: `
    <div class="console">
      <div class="console-head">
        <span class="console-title" i18n="@@tools.playground.console">Console</span>
        <div class="console-filters" role="group" [attr.aria-label]="filtersLabel">
          @for (level of levels; track level) {
            <button type="button" class="console-filter" [class.active]="active().has(level)"
              [attr.aria-pressed]="active().has(level)" (click)="toggle(level)">
              {{ level }}<span class="console-count">{{ counts[level] }}</span>
            </button>
          }
        </div>
        <button type="button" class="pgc-btn pgc-btn--ghost console-clear" (click)="clear.emit()"
          i18n="@@tools.playground.clear">
          limpar
        </button>
      </div>
      <div class="console-body">
        @for (line of filtered; track $index) {
          <div class="console-line" [class]="'lvl-' + line.level">
            @if (line.time) {
              <span class="console-time">{{ line.time }}</span>
            }{{ line.text }}
          </div>
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

  readonly levels: ConsoleLine['level'][] = ['log', 'info', 'warn', 'error'];
  readonly active = signal<ReadonlySet<ConsoleLine['level']>>(new Set(this.levels));
  readonly filtersLabel = $localize`:@@tools.playground.consoleFilters:Filtrar por nível`;

  toggle(level: ConsoleLine['level']): void {
    this.active.update(s => {
      const next = new Set(s);
      if (next.has(level)) next.delete(level);
      else next.add(level);
      return next;
    });
  }

  get filtered(): ConsoleLine[] { return filterConsoleLines(this.lines, this.active()); }
  get counts(): Record<ConsoleLine['level'], number> { return countByLevel(this.lines); }
}
```

- [ ] **Step 5: SCSS do console**

Primeira linha de `console-panel.scss`: `@use 'controls';`. Remover o bloco `.console-clear` antigo e adicionar:

```scss
.console-clear { height: 24px; font-size: 0.75rem; }
.console-filters { display: flex; gap: var(--space-1); flex-wrap: wrap; }
.console-filter {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 1px var(--space-2);
  border: 1px solid var(--border);
  border-radius: 999px;
  background: transparent;
  color: var(--muted);
  font-size: 0.6875rem;
  cursor: pointer;
  &.active { border-color: var(--accent); color: var(--ink); }
  &:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
}
.console-count { font-variant-numeric: tabular-nums; color: var(--muted); }
.console-time {
  margin-right: var(--space-2);
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}
```

- [ ] **Step 6: Verificar + commit**

Run: `npm run lint && npm run test:ci` → 0 erros / verde. Manual: `console.error` no snippet aparece com hora e `(linha:coluna)`; chips filtram; contadores batem.

```bash
git add src/app/features/tools/playground/
git commit -m "feat(playground): console filters, counters, timestamps and error line numbers"
```

---

### Task 8: Painel de IA alinhado ao sistema

**Files:**
- Modify: `src/app/features/tools/playground/ai/ai-panel.ts` (só classes CSS no template)
- Modify: `src/app/features/tools/playground/ai/ai-panel.scss`

**Interfaces:**
- Consumes: `.pgc-btn*` (Task 2) via `@use '../controls';`.

- [ ] **Step 1: Trocar classes no template**

- `class="ai-btn"` (2 ocorrências: "Salvar chave", "Enviar") → `class="pgc-btn pgc-btn--secondary"`.
- `class="ai-chip"` → `class="pgc-btn pgc-btn--ghost ai-chip"` (mantém `ai-chip` só p/ tamanho); `ai-clearkey` permanece.

- [ ] **Step 2: SCSS**

Primeira linha de `ai-panel.scss`: `@use '../controls';`. Remover os blocos `.ai-btn` e as propriedades visuais de `.ai-chip` (border/background/color/cursor/focus), deixando só o ajuste de escala:

```scss
.ai-chip { height: 28px; font-size: 0.75rem; }
.ai-clearkey { margin-left: auto; }
```

- [ ] **Step 3: Verificar + commit**

Run: `npm run lint && npm run test:ci` → 0 erros / verde.

```bash
git add src/app/features/tools/playground/ai/
git commit -m "refactor(playground): align AI panel buttons to unified control system"
```

---

### Task 9: i18n + gates finais (QA da fase)

**Files:**
- Modify: `src/locale/messages.xlf` (gerado), `src/locale/messages.en.xlf` (manual)

**Interfaces:**
- Consumes: IDs novos — `@@tools.playground.resetConfirm`, `@@tools.playground.stoppedMsg`, `@@tools.playground.consoleFilters`.

- [ ] **Step 1: Extrair**

Run: `npx ng extract-i18n --output-path src/locale`

- [ ] **Step 2: Preencher `messages.en.xlf`** (preservando targets existentes)

| ID | Target en |
|---|---|
| `tools.playground.resetConfirm` | `Confirm?` |
| `tools.playground.stoppedMsg` | `Preview stopped. Press Run to start again.` |
| `tools.playground.consoleFilters` | `Filter by level` |

- [ ] **Step 3: Verificar paridade** — 0 faltando, 0 órfão, 0 sem tradução (comparar `trans-unit` ids entre os dois xlf).

- [ ] **Step 4: Gates completos**

```bash
npm run lint && npm run test:ci && npm run build
```

Expected: tudo verde. Depois conferir os 2 locales no dist:

```bash
grep -r "Confirm?" dist/portfolio/browser/en/ --include="*.js" -l
grep -r "Confirmar?" dist/portfolio/browser/ --include="*.js" -l --exclude-dir=en
```

Expected: cada grep acha ≥1 arquivo no locale certo.

- [ ] **Step 5: Commit**

```bash
git add src/locale/
git commit -m "i18n(playground): fases 0-2 strings (reset confirm, preview state, console filters)"
```

---

## Fora deste plano

Fases 3-9 da spec (formatação Prettier, responsividade/drawer IA, share/Gist, templates, IA avançada, hardening CSP, vitrine) — planos próprios depois desta fundação aterrissar.
