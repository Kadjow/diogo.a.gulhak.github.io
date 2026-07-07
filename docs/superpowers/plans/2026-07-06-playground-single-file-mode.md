# Playground Single-File Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar um toggle `Separado | Único` ao playground, com conversão bidirecional entre 3 editores (HTML/CSS/JS) e um único documento HTML "chumbado".

**Architecture:** Lógica pura nova em `playground.logic.ts` (`mergeToSingle`, `splitFromSingle`, `injectBootstrap`, tipo `PlaygroundMode`), testada isolada. O componente `Playground` ganha signals `mode` e `single`, ramifica preview/persistência por modo, e o template alterna entre os três editores e um único. Split-back via `DOMParser` injetado (SSR-safe).

**Tech Stack:** Angular 22 standalone + signals, TypeScript strict, SCSS tokens, `@angular/localize` (pt-BR + en), Vitest (jsdom). Sem novas dependências.

## Global Constraints

- Angular 22 standalone; estado de UI com **signals**. (CLAUDE.md)
- **SSR-safe:** `DOMParser`/`iframe` só sob `isPlatformBrowser(PLATFORM_ID)`. (CLAUDE.md)
- **Cleanup:** debounces com `.cancel()` no `OnDestroy` (já existe; não regredir). (CLAUDE.md)
- **Estilo só por tokens** de `_tokens.scss`. Sem hex chumbado. (CLAUDE.md)
- **i18n:** toda string visível marcada, IDs `@@tools.playground.<chave>`. `$localize` resolve em build-time. (CLAUDE.md)
- **Vitest:** `.toBe(true)`/`.toBe(false)` — nunca `.toBeTrue()`. Mock de corpo vazio = `() => undefined`. (CLAUDE.md)
- **Segurança:** iframe segue `sandbox="allow-scripts"` sem `allow-same-origin`; console só via `postMessage`/`__pg`. (spec anterior)
- **Comandos:** `npm run lint` (0 erros), `npm run test:ci` (verde), `npm run build` (2 locales). (CLAUDE.md)
- **i18n fluxo:** editar tudo → `npx ng extract-i18n --output-path src/locale` → preencher `<target>` en → verificar paridade → conferir pt em `/` e en em `/en/`. (CLAUDE.md)

---

## File Structure

- `src/app/features/tools/playground/playground.logic.ts` — **modificar**: add `PlaygroundMode`, `DomParse`, `mergeToSingle`, `splitFromSingle`, `injectBootstrap`.
- `src/app/features/tools/playground/playground.logic.spec.ts` — **modificar**: testes das novas funções.
- `src/app/features/tools/playground/playground.ts` — **modificar**: signals `mode`/`single`, handlers, run branch, template, persistência.
- `src/app/features/tools/playground/playground.scss` — **modificar**: estilo do grupo de modo + editor único.
- `src/locale/messages.xlf` / `messages.en.xlf` — **modificar** (Task 3).

---

### Task 1: Lógica pura de conversão

**Files:**
- Modify: `src/app/features/tools/playground/playground.logic.ts`
- Test: `src/app/features/tools/playground/playground.logic.spec.ts`

**Interfaces:**
- Consumes: `buildExportDoc(html,css,js)`, `CONSOLE_BOOTSTRAP`, `Snippet` (já existem no arquivo).
- Produces:
  - `type PlaygroundMode = 'split' | 'single'`
  - `type DomParse = (html: string) => Document`
  - `function mergeToSingle(html: string, css: string, js: string): string`
  - `function splitFromSingle(doc: string, parse: DomParse): Snippet`
  - `function injectBootstrap(doc: string): string`

- [ ] **Step 1: Write the failing tests**

Adicione ao fim de `src/app/features/tools/playground/playground.logic.spec.ts`:

```ts
import {
  mergeToSingle, splitFromSingle, injectBootstrap, CONSOLE_BOOTSTRAP as BOOT,
} from './playground.logic';

const parse = (html: string): Document =>
  new DOMParser().parseFromString(html, 'text/html');

describe('mergeToSingle', () => {
  it('embeds css in <style>, html in body and js in <script>', () => {
    const doc = mergeToSingle('<h1>hi</h1>', 'h1{color:red}', 'var X=1;');
    expect(doc.includes('<style>h1{color:red}</style>')).toBe(true);
    expect(doc.includes('<h1>hi</h1>')).toBe(true);
    expect(doc.includes('<script>var X=1;</script>')).toBe(true);
    expect(doc.indexOf('<style>') < doc.indexOf('var X=1;')).toBe(true);
  });
});

describe('splitFromSingle', () => {
  it('extracts css from all <style> blocks', () => {
    const doc = '<style>a{color:red}</style><style>b{color:blue}</style><p>x</p>';
    expect(splitFromSingle(doc, parse).css).toBe('a{color:red}\nb{color:blue}');
  });
  it('extracts js only from <script> without src', () => {
    const doc = '<script src="x.js"></script><script>var Y=2;</script><p>x</p>';
    expect(splitFromSingle(doc, parse).js).toBe('var Y=2;');
  });
  it('returns body html without style/script tags', () => {
    const doc = '<style>a{}</style><p>keep</p><script>1</script>';
    const out = splitFromSingle(doc, parse);
    expect(out.html.includes('<p>keep</p>')).toBe(true);
    expect(out.html.includes('<style')).toBe(false);
    expect(out.html.includes('<script')).toBe(false);
  });
  it('round-trips merge -> split for typical content', () => {
    const merged = mergeToSingle('<h1>hi</h1>', 'h1{color:red}', 'var X=1;');
    const out = splitFromSingle(merged, parse);
    expect(out.html).toBe('<h1>hi</h1>');
    expect(out.css).toBe('h1{color:red}');
    expect(out.js).toBe('var X=1;');
  });
});

describe('injectBootstrap', () => {
  it('injects the bootstrap right after <head>', () => {
    const out = injectBootstrap('<!doctype html><html><head></head><body></body></html>');
    expect(out.includes(BOOT)).toBe(true);
    expect(out.indexOf('<head>') < out.indexOf(BOOT)).toBe(true);
    expect(out.indexOf(BOOT) < out.indexOf('<body>')).toBe(true);
  });
  it('falls back to after <html> when no <head>', () => {
    const out = injectBootstrap('<html><body>x</body></html>');
    expect(out.includes(BOOT)).toBe(true);
    expect(out.indexOf('<html>') < out.indexOf(BOOT)).toBe(true);
  });
  it('prepends when neither head nor html present', () => {
    const out = injectBootstrap('<p>x</p>');
    expect(out.startsWith('<script>')).toBe(true);
    expect(out.includes(BOOT)).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:ci -- src/app/features/tools/playground/playground.logic.spec.ts`
Expected: FAIL — `mergeToSingle`/`splitFromSingle`/`injectBootstrap` não exportados.

- [ ] **Step 3: Write the implementation**

Adicione ao fim de `src/app/features/tools/playground/playground.logic.ts`:

```ts
export type PlaygroundMode = 'split' | 'single';

export type DomParse = (html: string) => Document;

export function mergeToSingle(html: string, css: string, js: string): string {
  return buildExportDoc(html, css, js);
}

export function splitFromSingle(doc: string, parse: DomParse): Snippet {
  const parsed = parse(doc);
  const css = Array.from(parsed.querySelectorAll('style'))
    .map(el => el.textContent ?? '')
    .join('\n')
    .trim();
  const js = Array.from(parsed.querySelectorAll('script'))
    .filter(el => !el.hasAttribute('src'))
    .map(el => el.textContent ?? '')
    .join('\n')
    .trim();
  parsed.querySelectorAll('style, script').forEach(el => el.remove());
  const html = (parsed.body?.innerHTML ?? parsed.documentElement?.innerHTML ?? '').trim();
  return { html, css, js };
}

export function injectBootstrap(doc: string): string {
  const script = `<script>${CONSOLE_BOOTSTRAP}</script>`;
  const head = doc.match(/<head[^>]*>/i);
  if (head) return doc.replace(head[0], head[0] + script);
  const html = doc.match(/<html[^>]*>/i);
  if (html) return doc.replace(html[0], html[0] + script);
  return script + doc;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:ci -- src/app/features/tools/playground/playground.logic.spec.ts`
Expected: PASS.

- [ ] **Step 5: Lint**

Run: `npm run lint`
Expected: 0 erros.

- [ ] **Step 6: Commit**

```bash
git add src/app/features/tools/playground/playground.logic.ts src/app/features/tools/playground/playground.logic.spec.ts
git commit -m "feat(playground): pure logic for single/split conversion"
```

---

### Task 2: Wire mode toggle into `Playground`

**Files:**
- Modify: `src/app/features/tools/playground/playground.ts`
- Modify: `src/app/features/tools/playground/playground.scss`

**Interfaces:**
- Consumes: `mergeToSingle`, `splitFromSingle`, `injectBootstrap`, `PlaygroundMode`, `DomParse` (Task 1); `buildSrcdoc`, `CodeEditor`, `StorageService`, `PLAYGROUND_KEY` (existentes).
- Produces: componente com `mode`/`single` signals e `setMode(m)`.

> Não há teste unitário de componente aqui (a lógica testável ficou na Task 1). O gate é lint + build + verificação manual na Task 4.

- [ ] **Step 1: Update imports and signals**

Em `src/app/features/tools/playground/playground.ts`, no import da logic, acrescente os novos símbolos:

```ts
import {
  buildSrcdoc, buildExportDoc, mergeToSingle, splitFromSingle, injectBootstrap,
  DEFAULT_SNIPPET, VIEWPORTS, Viewport, ConsoleLine, Snippet, PlaygroundMode,
} from './playground.logic';
```

Logo após o signal `tab`, adicione:

```ts
  readonly mode = signal<PlaygroundMode>('split');
  readonly single = signal('');
```

- [ ] **Step 2: Add the mode toggle handler**

Adicione o método `setMode` (por exemplo, logo antes de `toggleAutoRun`):

```ts
  setMode(next: PlaygroundMode): void {
    if (next === this.mode()) return;
    if (next === 'single') {
      this.single.set(mergeToSingle(this.html(), this.css(), this.js()));
    } else if (typeof DOMParser !== 'undefined') {
      const parse = (h: string) => new DOMParser().parseFromString(h, 'text/html');
      const s = splitFromSingle(this.single(), parse);
      this.html.set(s.html);
      this.css.set(s.css);
      this.js.set(s.js);
    }
    this.mode.set(next);
    this.afterChange();
  }

  onSingle(value: string): void { this.single.set(value); this.afterChange(); }
```

- [ ] **Step 3: Branch `run()` by mode**

Substitua o corpo de `run()` por:

```ts
  run(): void {
    if (!this.isBrowser || !this.frame) return;
    this.consoleLines.set([]);
    this.frame.nativeElement.srcdoc =
      this.mode() === 'single'
        ? injectBootstrap(this.single())
        : buildSrcdoc(this.html(), this.css(), this.js());
  }
```

- [ ] **Step 4: Persist and restore the mode**

Substitua `save()` por:

```ts
  private save(): void {
    const snippet = {
      html: this.html(), css: this.css(), js: this.js(),
      single: this.single(), mode: this.mode(),
    };
    this.storage.setLocal(PLAYGROUND_KEY, JSON.stringify(snippet));
  }
```

Em `restore()`, dentro do `try`, após as três atribuições de html/css/js, adicione:

```ts
      const st = s as Partial<Snippet> & { single?: string; mode?: PlaygroundMode };
      if (typeof st.single === 'string') this.single.set(st.single);
      if (st.mode === 'single' || st.mode === 'split') this.mode.set(st.mode);
```

(Ajuste o cast do `JSON.parse` para `Partial<Snippet> & { single?: string; mode?: PlaygroundMode }` se preferir; o `s` já existe como `Partial<Snippet>`.)

- [ ] **Step 5: Add the toggle to the template**

No `pg-toolbar`, antes de `pg-viewports`, adicione o grupo de modo:

```html
            <div class="pg-modes" role="group" [attr.aria-label]="modeGroupLabel">
              <button type="button" class="pg-mode" [class.active]="mode() === 'split'"
                [attr.aria-pressed]="mode() === 'split'" (click)="setMode('split')"
                i18n="@@tools.playground.modeSplit">Separado</button>
              <button type="button" class="pg-mode" [class.active]="mode() === 'single'"
                [attr.aria-pressed]="mode() === 'single'" (click)="setMode('single')"
                i18n="@@tools.playground.modeSingle">Único</button>
            </div>
```

Envolva o bloco atual dos três editores num `@if` e adicione o editor único. Troque a `<div class="pg-editors">…</div>` inteira por:

```html
        @if (mode() === 'split') {
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
        } @else {
          <div class="pg-editors">
            <div class="pg-editor">
              <span class="pg-label">HTML</span>
              <app-code-editor language="html" [value]="single()" [ariaLabel]="'HTML'"
                (valueChange)="onSingle($event)" (run)="run()" />
            </div>
          </div>
        }
```

(A `<div class="pg-tabs">` original que ficava fora fica **removida** — ela agora vive dentro do ramo `@if`, como acima.)

- [ ] **Step 6: Add the i18n labels**

Junto dos outros `$localize` do componente, adicione:

```ts
  readonly modeGroupLabel = $localize`:@@tools.playground.modeGroup:Modo do editor`;
```

- [ ] **Step 7: Style the mode group**

Em `src/app/features/tools/playground/playground.scss`, reusando o padrão dos botões `pg-vp`, adicione:

```scss
.pg-modes { display: flex; gap: 4px; }
.pg-mode {
  padding: 4px 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg);
  color: var(--ink);
  font-size: 0.75rem;
  cursor: pointer;
  &.active { background: var(--accent); color: var(--btn-fg); border-color: var(--accent); }
  &:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
}
```

- [ ] **Step 8: Lint**

Run: `npm run lint`
Expected: 0 erros (warnings a11y pré-existentes ok).

- [ ] **Step 9: Commit**

```bash
git add src/app/features/tools/playground/playground.ts src/app/features/tools/playground/playground.scss
git commit -m "feat(playground): single/split editor mode toggle"
```

---

### Task 3: i18n — extração, tradução en e verificação

**Files:**
- Modify: `src/locale/messages.xlf`
- Modify: `src/locale/messages.en.xlf`

**Interfaces:** N/A (só recursos de tradução).

- [ ] **Step 1: Extract**

Run: `npx ng extract-i18n --output-path src/locale`
Expected: novos ids `tools.playground.modeGroup`, `tools.playground.modeSplit`, `tools.playground.modeSingle` na fonte `messages.xlf`.

- [ ] **Step 2: Fill English targets**

Em `src/locale/messages.en.xlf`, adicione (mesmo estilo dos outros units — `source` + `target`):

```xml
      <trans-unit id="tools.playground.modeGroup" datatype="html">
        <source>Modo do editor</source>
        <target state="translated">Editor mode</target>
      </trans-unit>
      <trans-unit id="tools.playground.modeSplit" datatype="html">
        <source>Separado</source>
        <target state="translated">Split</target>
      </trans-unit>
      <trans-unit id="tools.playground.modeSingle" datatype="html">
        <source>Único</source>
        <target state="translated">Single</target>
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
git commit -m "i18n(playground): editor mode toggle labels"
```

---

### Task 4: Verificação final

**Files:** N/A (só verificação).

- [ ] **Step 1: Suite + lint**

Run: `npm run test:ci && npm run lint`
Expected: testes verdes; lint 0 erros (4 warnings a11y pré-existentes ok).

- [ ] **Step 2: Build 2 locales**

Run: `npm run build`
Expected: build completo, rotas prerenderizadas, sem novos erros de budget.

- [ ] **Step 3: Verify locale text**

Run (bash):
```bash
grep -o "Separado\|Único" dist/portfolio/browser/tools/playground/index.html | sort -u
grep -o "Split\|Single" dist/portfolio/browser/en/tools/playground/index.html | sort -u
```
Expected: pt mostra `Separado`/`Único`; en mostra `Split`/`Single`.

- [ ] **Step 4: Manual smoke (dev server)**

Descreva no PR/checklist: `npm start`, abrir `/tools/playground`, digitar nos 3 painéis, trocar para **Único** (deve virar um HTML combinado), editar, voltar para **Separado** (deve reabrir os 3 painéis com o conteúdo), confirmar console e preview funcionando nos dois modos.
