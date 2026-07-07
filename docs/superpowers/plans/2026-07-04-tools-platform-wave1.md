# Plataforma de Ferramentas — Onda 1 (Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar o hub `/tools` e 3 ferramentas client-side (`hash`, `json-tools`, `html-markdown-render`), provando o padrão reusável de features de ferramentas.

**Architecture:** Cada ferramenta é uma feature lazy isolada em `src/app/features/tools/<slug>/`, com a lógica pura em `<slug>.logic.ts` (testada direto no Vitest) separada da fiação do componente. Um catálogo tipado (`src/data/tools.ts`) alimenta o `ToolsHub`. Uma casca comum `ToolShell` padroniza o layout. Tudo reusa tokens, tema e i18n do portfólio; nada toca o portfólio.

**Tech Stack:** Angular 22 standalone + signals, TypeScript strict, SCSS design tokens, `@angular/localize` (pt-BR + en), Vitest (jsdom). Sem servidor. `marked` + `DOMPurify` (só no chunk lazy do render de markdown). Hash via WebCrypto (sem dependência).

## Global Constraints

- Angular 22 standalone; estado de UI com **signals**. (CLAUDE.md)
- **SSR-safe:** prerender roda em Node. Acesso a `window`/`document`/`File`/`Canvas`/`crypto.subtle` só com guarda `isPlatformBrowser(PLATFORM_ID)` ou `DOCUMENT` injetado. (CLAUDE.md)
- **Cleanup:** componente com timer/listener implementa `OnDestroy` e limpa. (CLAUDE.md)
- **Estilo só por tokens** de `_tokens.scss` (`var(--bg)`, `var(--accent)`, …). Sem hex/sombra chumbada. (CLAUDE.md)
- **i18n:** toda string visível marcada (`i18n`/`i18n-*` ou `$localize`), IDs estáveis `@@tools.<escopo>.<chave>`. `$localize` resolve em build-time — nunca guardar chave crua para traduzir em runtime. (CLAUDE.md)
- **Links externos:** `target="_blank"` sempre com `rel="noopener"`. (CLAUDE.md)
- **Vitest:** usar `.toBe(true)`/`.toBe(false)` — nunca `.toBeTrue()`/`.toBeFalse()`. Corpo de função vazio em mock = `() => undefined`. (CLAUDE.md)
- **Lógica testável:** regras puras em funções exportadas, testadas isoladas do componente. (CLAUDE.md)
- **Comandos:** `npm run lint` (0 erros), `npm run test:ci` (verde), `npm run build` (2 locales). CI roda lint + test:ci antes do build. (CLAUDE.md)
- **i18n fluxo:** editar todo texto → `npx ng extract-i18n --output-path src/locale` → preencher `<target>` em `messages.en.xlf` → verificar paridade (0 faltando/órfão/sem tradução) → confirmar pt em `/` e en em `/en/` no `dist`. (CLAUDE.md)
- **base-relativo:** o site roda em subpath (project page). Nunca hardcode `/` absoluto para links internos/rotas — usar `LocaleService` (ver Task 1). (fix de subpath já aplicado)

---

## File Structure

- `src/data/tools.ts` — catálogo tipado (`ToolMeta`, `TOOLS`). Fonte do hub.
- `src/data/tools.spec.ts` — testa invariantes do catálogo.
- `src/app/core/locale.service.ts` — **modificar**: adicionar `path(rel)`.
- `src/app/shared/ui/tool-shell/tool-shell.ts` — casca comum das tools.
- `src/app/features/tools/tools-hub/tools-hub.ts` — grid de cards.
- `src/app/features/tools/hash/hash.logic.ts` + `.spec.ts` + `hash.ts` — ferramenta hash.
- `src/app/features/tools/json-tools/json.logic.ts` + `.spec.ts` + `json-tools.ts`.
- `src/app/features/tools/html-markdown-render/render.logic.ts` + `.spec.ts` + `html-markdown-render.ts`.
- `src/app/app.routes.ts` — **modificar**: rotas lazy de tools.
- `src/app/layout/header/header.ts` — **modificar**: link "Tools".
- `src/locale/messages.xlf` / `messages.en.xlf` — **modificar** (extract + targets).

**Nota de escopo (conhecida, não bloqueia):** `app.ts` renderiza overlays do portfólio (`app-gallery`, `app-contact`, `app-back-to-top`, `app-splash`) globalmente. Nas rotas `/tools` eles ficam inertes (só ativam por interação; contact abre pelo botão do header). Mantidos como estão nesta onda; isolá-los por rota é follow-up.

---

### Task 1: `LocaleService.path()` para rotas internas base-relativas

**Files:**
- Modify: `src/app/core/locale.service.ts`
- Test: `src/app/core/locale.service.spec.ts`

**Interfaces:**
- Consumes: `LocaleService.localePath(locale)`, `LocaleService.locale` (já existem).
- Produces: `LocaleService.path(rel: string): string` — caminho interno no locale atual, ex.: `path('tools')` → `/<root>/tools`, `path('tools/hash')` → `/<root>/tools/hash`. Sem barra final adicionada.

- [ ] **Step 1: Write the failing test**

Adicionar ao final de `src/app/core/locale.service.spec.ts`:

```ts
describe('LocaleService.path', () => {
  it('prefixes rel with the current-locale root (pt-BR)', () => {
    const s = make('pt-BR');
    expect(s.path('tools')).toBe('/tools');
    expect(s.path('tools/hash')).toBe('/tools/hash');
  });
  it('prefixes rel with the en root', () => {
    const s = make('en-US');
    expect(s.path('tools')).toBe('/en/tools');
  });
  it('strips a leading slash on rel', () => {
    const s = make('pt-BR');
    expect(s.path('/tools')).toBe('/tools');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:ci -- src/app/core/locale.service.spec.ts`
Expected: FAIL — `s.path is not a function`.

- [ ] **Step 3: Write minimal implementation**

Em `src/app/core/locale.service.ts`, adicionar o método dentro da classe `LocaleService` (após `assetPath`):

```ts
  path(rel: string): string {
    return `${this.localePath(this.locale)}${rel.replace(/^\/+/, '')}`;
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:ci -- src/app/core/locale.service.spec.ts`
Expected: PASS (todos os describes do arquivo).

- [ ] **Step 5: Commit**

```bash
git add src/app/core/locale.service.ts src/app/core/locale.service.spec.ts
git commit -m "feat(tools): add LocaleService.path for internal route links"
```

---

### Task 2: Catálogo tipado `src/data/tools.ts`

**Files:**
- Create: `src/data/tools.ts`
- Test: `src/data/tools.spec.ts`

**Interfaces:**
- Produces:
  - `type ToolGroup = 'dev' | 'media' | 'text'`
  - `type ToolStatus = 'live' | 'soon'`
  - `interface ToolMeta { slug: string; name: string; description: string; group: ToolGroup; icon: string; status: ToolStatus; }`
  - `const TOOLS: readonly ToolMeta[]`
  - `function toolsByGroup(tools: readonly ToolMeta[]): { group: ToolGroup; items: ToolMeta[] }[]` — agrupa preservando a ordem `['dev','media','text']`.

- [ ] **Step 1: Write the failing test**

Create `src/data/tools.spec.ts`:

```ts
import { TOOLS, toolsByGroup, ToolMeta } from './tools';

describe('TOOLS catalog', () => {
  it('has unique slugs', () => {
    const slugs = TOOLS.map(t => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
  it('slugs are url-safe kebab', () => {
    for (const t of TOOLS) {
      expect(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(t.slug)).toBe(true);
    }
  });
  it('marks the three MVP tools live, rest soon', () => {
    const live = TOOLS.filter(t => t.status === 'live').map(t => t.slug).sort();
    expect(live).toEqual(['hash', 'html-markdown-render', 'json-tools']);
  });
});

describe('toolsByGroup', () => {
  it('groups in fixed order dev, media, text', () => {
    const sample: ToolMeta[] = [
      { slug: 'a', name: 'A', description: '', group: 'text', icon: '', status: 'soon' },
      { slug: 'b', name: 'B', description: '', group: 'dev', icon: '', status: 'live' },
    ];
    const groups = toolsByGroup(sample).map(g => g.group);
    expect(groups).toEqual(['dev', 'text']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:ci -- src/data/tools.spec.ts`
Expected: FAIL — cannot find module `./tools`.

- [ ] **Step 3: Write minimal implementation**

Create `src/data/tools.ts`. As strings `name`/`description` são literais `$localize` (build-time, bilíngue):

```ts
export type ToolGroup = 'dev' | 'media' | 'text';
export type ToolStatus = 'live' | 'soon';

export interface ToolMeta {
  slug: string;
  name: string;
  description: string;
  group: ToolGroup;
  icon: string;
  status: ToolStatus;
}

const GROUP_ORDER: ToolGroup[] = ['dev', 'media', 'text'];

export const TOOLS: readonly ToolMeta[] = [
  {
    slug: 'html-markdown-render',
    name: $localize`:@@tools.html-markdown-render.name:Render HTML/Markdown`,
    description: $localize`:@@tools.html-markdown-render.desc:Edite HTML ou Markdown e veja o preview ao vivo.`,
    group: 'dev', icon: '📝', status: 'live',
  },
  {
    slug: 'json-tools',
    name: $localize`:@@tools.json-tools.name:Ferramentas JSON`,
    description: $localize`:@@tools.json-tools.desc:Formatar, minificar e validar JSON.`,
    group: 'dev', icon: '{ }', status: 'live',
  },
  {
    slug: 'hash',
    name: $localize`:@@tools.hash.name:Gerador de Hash`,
    description: $localize`:@@tools.hash.desc:SHA-1, SHA-256, SHA-384 e SHA-512 de um texto.`,
    group: 'dev', icon: '#', status: 'live',
  },
  {
    slug: 'image-converter',
    name: $localize`:@@tools.image-converter.name:Conversor de Imagem`,
    description: $localize`:@@tools.image-converter.desc:Converte para AVIF, WebP, PNG e JPG no navegador.`,
    group: 'media', icon: '🖼️', status: 'soon',
  },
  {
    slug: 'color-tools',
    name: $localize`:@@tools.color-tools.name:Ferramentas de Cor`,
    description: $localize`:@@tools.color-tools.desc:Contraste WCAG, paletas e conversão de formatos.`,
    group: 'media', icon: '🎨', status: 'soon',
  },
];

export function toolsByGroup(
  tools: readonly ToolMeta[],
): { group: ToolGroup; items: ToolMeta[] }[] {
  return GROUP_ORDER
    .map(group => ({ group, items: tools.filter(t => t.group === group) }))
    .filter(g => g.items.length > 0);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:ci -- src/data/tools.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/tools.ts src/data/tools.spec.ts
git commit -m "feat(tools): typed tools catalog with grouping helper"
```

---

### Task 3: `ToolShell` (casca comum)

**Files:**
- Create: `src/app/shared/ui/tool-shell/tool-shell.ts`
- Create: `src/app/shared/ui/tool-shell/tool-shell.scss`

**Interfaces:**
- Consumes: `LocaleService.path` (Task 1).
- Produces: componente `ToolShell` (selector `app-tool-shell`), inputs `title: string`, `description: string`; projeta conteúdo via `<ng-content>`; renderiza breadcrumb "← Tools" para `path('tools')`.

- [ ] **Step 1: Create the component**

Create `src/app/shared/ui/tool-shell/tool-shell.ts`:

```ts
import { Component, Input, inject } from '@angular/core';
import { LocaleService } from '../../../core/locale.service';

@Component({
  selector: 'app-tool-shell',
  standalone: true,
  template: `
    <section class="tool-shell container">
      <a class="tool-back" [href]="locale.path('tools')" i18n="@@tools.shell.back">← Tools</a>
      <h1 class="tool-title">{{ title }}</h1>
      <p class="tool-desc">{{ description }}</p>
      <div class="tool-body">
        <ng-content />
      </div>
    </section>
  `,
  styleUrl: './tool-shell.scss',
})
export class ToolShell {
  @Input() title = '';
  @Input() description = '';
  locale = inject(LocaleService);
}
```

- [ ] **Step 2: Create the styles**

Create `src/app/shared/ui/tool-shell/tool-shell.scss`:

```scss
.tool-shell {
  padding: 32px 0 64px;
}
.tool-back {
  display: inline-block;
  margin-bottom: 20px;
  color: var(--muted);
  text-decoration: none;
  font-size: 0.875rem;
  &:hover { color: var(--accent); }
}
.tool-title {
  font-size: 1.75rem;
  letter-spacing: -0.02em;
  color: var(--ink);
  margin: 0 0 6px;
}
.tool-desc {
  color: var(--muted);
  margin: 0 0 28px;
}
.tool-body {
  display: block;
}
```

- [ ] **Step 3: Verify it compiles via lint**

Run: `npm run lint`
Expected: 0 erros (os 4 warnings a11y pré-existentes do portfólio podem aparecer; nenhum novo neste arquivo).

- [ ] **Step 4: Commit**

```bash
git add src/app/shared/ui/tool-shell/
git commit -m "feat(tools): shared ToolShell layout with breadcrumb"
```

---

### Task 4: `ToolsHub` + rotas + link no header

**Files:**
- Create: `src/app/features/tools/tools-hub/tools-hub.ts`
- Create: `src/app/features/tools/tools-hub/tools-hub.scss`
- Modify: `src/app/app.routes.ts`
- Modify: `src/app/layout/header/header.ts`

**Interfaces:**
- Consumes: `TOOLS`, `toolsByGroup` (Task 2); `LocaleService.path` (Task 1).
- Produces: rota `tools` → `ToolsHub`; rotas `tools/hash`, `tools/json-tools`, `tools/html-markdown-render` (componentes criados nas Tasks 5-7 — os `loadComponent` já são declarados aqui e passam a resolver quando os arquivos existirem).

- [ ] **Step 1: Create the hub component**

Create `src/app/features/tools/tools-hub/tools-hub.ts`:

```ts
import { Component, inject } from '@angular/core';
import { TOOLS, toolsByGroup } from '../../../../data/tools';
import { LocaleService } from '../../../core/locale.service';

@Component({
  selector: 'app-tools-hub',
  standalone: true,
  template: `
    <section class="hub container">
      <header class="hub-head">
        <h1 class="hub-title" i18n="@@tools.hub.title">Ferramentas</h1>
        <p class="hub-sub" i18n="@@tools.hub.sub">Utilitários do dia a dia, direto no navegador.</p>
      </header>

      @for (g of groups; track g.group) {
        <div class="hub-group">
          <div class="hub-grid">
            @for (t of g.items; track t.slug) {
              @if (t.status === 'live') {
                <a class="tool-card" [href]="locale.path('tools/' + t.slug)">
                  <span class="tool-icon" aria-hidden="true">{{ t.icon }}</span>
                  <span class="tool-name">{{ t.name }}</span>
                  <span class="tool-card-desc">{{ t.description }}</span>
                </a>
              } @else {
                <div class="tool-card is-soon" aria-disabled="true">
                  <span class="tool-icon" aria-hidden="true">{{ t.icon }}</span>
                  <span class="tool-name">{{ t.name }}</span>
                  <span class="tool-card-desc">{{ t.description }}</span>
                  <span class="tool-soon" i18n="@@tools.hub.soon">em breve</span>
                </div>
              }
            }
          </div>
        </div>
      }
    </section>
  `,
  styleUrl: './tools-hub.scss',
})
export class ToolsHub {
  locale = inject(LocaleService);
  groups = toolsByGroup(TOOLS);
}
```

- [ ] **Step 2: Create the hub styles**

Create `src/app/features/tools/tools-hub/tools-hub.scss`:

```scss
.hub { padding: 40px 0 64px; }
.hub-head { margin-bottom: 32px; }
.hub-title { font-size: 2rem; letter-spacing: -0.03em; color: var(--ink); margin: 0 0 6px; }
.hub-sub { color: var(--muted); margin: 0; }
.hub-group { margin-bottom: 28px; }
.hub-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}
.tool-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 18px;
  border-radius: 14px;
  border: 1px solid var(--border);
  background: var(--surface);
  text-decoration: none;
  color: var(--ink);
  transition: border-color 0.15s ease, transform 0.15s ease;
  &:hover { border-color: var(--accent); transform: translateY(-2px); }
  &.is-soon { opacity: 0.55; }
}
.tool-icon { font-size: 1.25rem; }
.tool-name { font-weight: 600; }
.tool-card-desc { font-size: 0.8125rem; color: var(--muted); }
.tool-soon {
  align-self: flex-start;
  margin-top: 4px;
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--accent);
}
@media (prefers-reduced-motion: reduce) {
  .tool-card { transition: none; }
  .tool-card:hover { transform: none; }
}
```

- [ ] **Step 3: Wire the routes**

Replace `src/app/app.routes.ts` with:

```ts
import { Routes } from '@angular/router';
export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/portfolio/portfolio').then(m => m.Portfolio) },
  { path: 'tools', loadComponent: () => import('./features/tools/tools-hub/tools-hub').then(m => m.ToolsHub) },
  {
    path: 'tools/hash',
    loadComponent: () => import('./features/tools/hash/hash').then(m => m.HashTool),
  },
  {
    path: 'tools/json-tools',
    loadComponent: () => import('./features/tools/json-tools/json-tools').then(m => m.JsonTools),
  },
  {
    path: 'tools/html-markdown-render',
    loadComponent: () =>
      import('./features/tools/html-markdown-render/html-markdown-render').then(m => m.HtmlMarkdownRender),
  },
];
```

- [ ] **Step 4: Add the "Tools" link to the header**

Em `src/app/layout/header/header.ts`, dentro de `<nav class="header-nav">`, **antes** de `<app-theme-toggle />`, adicionar:

```html
          <a class="nav-link" [href]="locale.path('tools')" i18n="@@header.tools">Tools</a>
```

E adicionar ao `header.scss` (final do arquivo):

```scss
.nav-link {
  color: var(--muted);
  text-decoration: none;
  font-size: 0.8125rem;
  font-weight: 500;
  &:hover { color: var(--ink); }
}
```

- [ ] **Step 5: Verify build prerenders the hub route**

Run: `npm run build`
Expected: build conclui; existem `dist/portfolio/browser/tools/index.html` e `dist/portfolio/browser/en/tools/index.html`.
Verificar: `ls dist/portfolio/browser/tools dist/portfolio/browser/en/tools`

> Se as rotas de `tools/hash` etc. ainda não existirem como arquivos nesta etapa, o build falha no `loadComponent`. Por isso as Tasks 5-7 vêm logo em seguida; execute a Task 4 e as 5-7 na mesma sessão antes de rodar o build final. Para checar só o hub isoladamente, comente temporariamente as 3 rotas de ferramenta, rode o build, e descomente. (Preferível: seguir direto para as Tasks 5-7.)

- [ ] **Step 6: Commit**

```bash
git add src/app/features/tools/tools-hub/ src/app/app.routes.ts src/app/layout/header/header.ts src/app/layout/header/header.scss
git commit -m "feat(tools): tools hub, lazy routes and header link"
```

---

### Task 5: Ferramenta `hash` (WebCrypto)

**Files:**
- Create: `src/app/features/tools/hash/hash.logic.ts`
- Test: `src/app/features/tools/hash/hash.logic.spec.ts`
- Create: `src/app/features/tools/hash/hash.ts`
- Create: `src/app/features/tools/hash/hash.scss`

**Interfaces:**
- Consumes: `ToolShell` (Task 3).
- Produces:
  - `type HashAlgo = 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512'`
  - `const HASH_ALGOS: HashAlgo[]`
  - `async function digestHex(algo: HashAlgo, text: string, subtle?: SubtleCrypto): Promise<string>` — hex minúsculo.
  - componente `HashTool` (exporta `HashTool`).

- [ ] **Step 1: Write the failing test**

Create `src/app/features/tools/hash/hash.logic.spec.ts`:

```ts
import { digestHex, HASH_ALGOS } from './hash.logic';

describe('digestHex', () => {
  it('lists the four supported algos', () => {
    expect(HASH_ALGOS).toEqual(['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512']);
  });
  it('computes SHA-256 of "abc" (known vector)', async () => {
    const hex = await digestHex('SHA-256', 'abc');
    expect(hex).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });
  it('computes SHA-1 of "abc" (known vector)', async () => {
    const hex = await digestHex('SHA-1', 'abc');
    expect(hex).toBe('a9993e364706816aba3e25717850c26c9cd0d89d');
  });
  it('returns empty string for empty input', async () => {
    expect(await digestHex('SHA-256', '')).toBe('');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:ci -- src/app/features/tools/hash/hash.logic.spec.ts`
Expected: FAIL — cannot find module `./hash.logic`.

- [ ] **Step 3: Write minimal implementation**

Create `src/app/features/tools/hash/hash.logic.ts`:

```ts
export type HashAlgo = 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';

export const HASH_ALGOS: HashAlgo[] = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];

export async function digestHex(
  algo: HashAlgo,
  text: string,
  subtle: SubtleCrypto | undefined = globalThis.crypto?.subtle,
): Promise<string> {
  if (text === '') return '';
  if (!subtle) throw new Error('WebCrypto SubtleCrypto unavailable');
  const bytes = new TextEncoder().encode(text);
  const buf = await subtle.digest(algo, bytes);
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:ci -- src/app/features/tools/hash/hash.logic.spec.ts`
Expected: PASS (Node 20 expõe `globalThis.crypto.subtle`).

- [ ] **Step 5: Create the component**

Create `src/app/features/tools/hash/hash.ts`:

```ts
import { Component, PLATFORM_ID, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';
import { ToolShell } from '../../../shared/ui/tool-shell/tool-shell';
import { HASH_ALGOS, HashAlgo, digestHex } from './hash.logic';

@Component({
  selector: 'app-hash-tool',
  standalone: true,
  imports: [FormsModule, ToolShell],
  template: `
    <app-tool-shell
      [title]="titleText"
      [description]="descText">
      <label class="field-label" for="hash-in" i18n="@@tools.hash.inputLabel">Texto</label>
      <textarea
        id="hash-in"
        class="field"
        rows="5"
        [ngModel]="input()"
        (ngModelChange)="onInput($event)"
        [attr.placeholder]="placeholderText"></textarea>

      <div class="results">
        @for (algo of algos; track algo) {
          <div class="result-row">
            <span class="result-algo">{{ algo }}</span>
            <code class="result-hex">{{ hashes()[algo] }}</code>
          </div>
        }
      </div>
    </app-tool-shell>
  `,
  styleUrl: './hash.scss',
})
export class HashTool {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly algos = HASH_ALGOS;
  readonly input = signal('');
  readonly hashes = signal<Record<HashAlgo, string>>({
    'SHA-1': '', 'SHA-256': '', 'SHA-384': '', 'SHA-512': '',
  });

  readonly titleText = $localize`:@@tools.hash.name:Gerador de Hash`;
  readonly descText = $localize`:@@tools.hash.desc:SHA-1, SHA-256, SHA-384 e SHA-512 de um texto.`;
  readonly placeholderText = $localize`:@@tools.hash.placeholder:Digite o texto…`;

  onInput(value: string): void {
    this.input.set(value);
    if (!this.isBrowser) return;
    void this.recompute(value);
  }

  private async recompute(value: string): Promise<void> {
    const entries = await Promise.all(
      this.algos.map(async algo => [algo, await digestHex(algo, value)] as const),
    );
    this.hashes.set(Object.fromEntries(entries) as Record<HashAlgo, string>);
  }
}
```

- [ ] **Step 6: Create the styles**

Create `src/app/features/tools/hash/hash.scss`:

```scss
.field-label { display: block; font-size: 0.8125rem; color: var(--muted); margin-bottom: 6px; }
.field {
  width: 100%;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--ink);
  font-family: inherit;
  resize: vertical;
  &:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
}
.results { margin-top: 20px; display: flex; flex-direction: column; gap: 10px; }
.result-row { display: flex; flex-direction: column; gap: 4px; }
.result-algo { font-size: 0.75rem; font-weight: 600; color: var(--muted); }
.result-hex {
  font-size: 0.8125rem;
  word-break: break-all;
  color: var(--ink);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px 10px;
  min-height: 1.5rem;
}
```

- [ ] **Step 7: Run tests + lint**

Run: `npm run test:ci -- src/app/features/tools/hash/ && npm run lint`
Expected: testes verdes; lint 0 erros.

- [ ] **Step 8: Commit**

```bash
git add src/app/features/tools/hash/
git commit -m "feat(tools): hash tool with WebCrypto (SHA-1/256/384/512)"
```

---

### Task 6: Ferramenta `json-tools`

**Files:**
- Create: `src/app/features/tools/json-tools/json.logic.ts`
- Test: `src/app/features/tools/json-tools/json.logic.spec.ts`
- Create: `src/app/features/tools/json-tools/json-tools.ts`
- Create: `src/app/features/tools/json-tools/json-tools.scss`

**Interfaces:**
- Consumes: `ToolShell` (Task 3).
- Produces:
  - `interface JsonResult { ok: boolean; output: string; error: string | null; }`
  - `function formatJson(input: string, indent: number): JsonResult`
  - `function minifyJson(input: string): JsonResult`
  - componente `JsonTools` (exporta `JsonTools`).

- [ ] **Step 1: Write the failing test**

Create `src/app/features/tools/json-tools/json.logic.spec.ts`:

```ts
import { formatJson, minifyJson } from './json.logic';

describe('formatJson', () => {
  it('pretty-prints valid JSON with the given indent', () => {
    const r = formatJson('{"a":1}', 2);
    expect(r.ok).toBe(true);
    expect(r.output).toBe('{\n  "a": 1\n}');
    expect(r.error).toBe(null);
  });
  it('reports an error for invalid JSON', () => {
    const r = formatJson('{a:1}', 2);
    expect(r.ok).toBe(false);
    expect(r.output).toBe('');
    expect(typeof r.error).toBe('string');
    expect(r.error!.length > 0).toBe(true);
  });
  it('treats empty input as ok with empty output', () => {
    const r = formatJson('   ', 2);
    expect(r.ok).toBe(true);
    expect(r.output).toBe('');
  });
});

describe('minifyJson', () => {
  it('removes whitespace from valid JSON', () => {
    const r = minifyJson('{\n  "a": 1\n}');
    expect(r.ok).toBe(true);
    expect(r.output).toBe('{"a":1}');
  });
  it('reports an error for invalid JSON', () => {
    const r = minifyJson('nope');
    expect(r.ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:ci -- src/app/features/tools/json-tools/json.logic.spec.ts`
Expected: FAIL — cannot find module `./json.logic`.

- [ ] **Step 3: Write minimal implementation**

Create `src/app/features/tools/json-tools/json.logic.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:ci -- src/app/features/tools/json-tools/json.logic.spec.ts`
Expected: PASS.

- [ ] **Step 5: Create the component**

Create `src/app/features/tools/json-tools/json-tools.ts`:

```ts
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToolShell } from '../../../shared/ui/tool-shell/tool-shell';
import { formatJson, minifyJson, JsonResult } from './json.logic';

@Component({
  selector: 'app-json-tools',
  standalone: true,
  imports: [FormsModule, ToolShell],
  template: `
    <app-tool-shell [title]="titleText" [description]="descText">
      <label class="field-label" for="json-in" i18n="@@tools.json-tools.inputLabel">Entrada</label>
      <textarea
        id="json-in"
        class="field"
        rows="10"
        [ngModel]="input()"
        (ngModelChange)="input.set($event)"
        [attr.placeholder]="placeholderText"></textarea>

      <div class="actions">
        <button type="button" class="btn" (click)="doFormat()" i18n="@@tools.json-tools.format">Formatar</button>
        <button type="button" class="btn" (click)="doMinify()" i18n="@@tools.json-tools.minify">Minificar</button>
      </div>

      @if (result(); as r) {
        @if (r.ok) {
          <label class="field-label" for="json-out" i18n="@@tools.json-tools.outputLabel">Saída</label>
          <textarea id="json-out" class="field" rows="10" readonly [value]="r.output"></textarea>
        } @else {
          <p class="error" role="alert">{{ errorPrefix }} {{ r.error }}</p>
        }
      }
    </app-tool-shell>
  `,
  styleUrl: './json-tools.scss',
})
export class JsonTools {
  readonly input = signal('');
  readonly result = signal<JsonResult | null>(null);

  readonly titleText = $localize`:@@tools.json-tools.name:Ferramentas JSON`;
  readonly descText = $localize`:@@tools.json-tools.desc:Formatar, minificar e validar JSON.`;
  readonly placeholderText = $localize`:@@tools.json-tools.placeholder:Cole seu JSON aqui…`;
  readonly errorPrefix = $localize`:@@tools.json-tools.errorPrefix:JSON inválido:`;

  doFormat(): void { this.result.set(formatJson(this.input(), 2)); }
  doMinify(): void { this.result.set(minifyJson(this.input())); }
}
```

- [ ] **Step 6: Create the styles**

Create `src/app/features/tools/json-tools/json-tools.scss`:

```scss
.field-label { display: block; font-size: 0.8125rem; color: var(--muted); margin: 12px 0 6px; }
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
.actions { display: flex; gap: 10px; margin: 14px 0; }
.btn {
  padding: 7px 16px;
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
.error { color: #dc2626; font-size: 0.875rem; }
```

> O `#dc2626` é a única cor fora de token permitida aqui? Não — checar `_tokens.scss` por um token de erro (ex.: `var(--danger)`); se existir, usar. Se não existir, adicionar `--danger` em `_tokens.scss` (claro e dark) e usar `var(--danger)`. Não deixar hex chumbado.

- [ ] **Step 7: Run tests + lint**

Run: `npm run test:ci -- src/app/features/tools/json-tools/ && npm run lint`
Expected: testes verdes; lint 0 erros.

- [ ] **Step 8: Commit**

```bash
git add src/app/features/tools/json-tools/ src/styles/_tokens.scss
git commit -m "feat(tools): json format/minify/validate tool"
```

---

### Task 7: Ferramenta `html-markdown-render` (marked + DOMPurify)

**Files:**
- Modify: `package.json` (deps)
- Create: `src/app/features/tools/html-markdown-render/render.logic.ts`
- Test: `src/app/features/tools/html-markdown-render/render.logic.spec.ts`
- Create: `src/app/features/tools/html-markdown-render/html-markdown-render.ts`
- Create: `src/app/features/tools/html-markdown-render/html-markdown-render.scss`

**Interfaces:**
- Consumes: `ToolShell` (Task 3); libs `marked`, `dompurify`.
- Produces:
  - `type RenderMode = 'markdown' | 'html'`
  - `function sanitizeHtml(raw: string, purify: { sanitize(s: string): string }): string`
  - `async function renderMarkdown(md: string): Promise<string>` (usa `marked`)
  - componente `HtmlMarkdownRender` (exporta `HtmlMarkdownRender`).

- [ ] **Step 1: Install dependencies**

Run:
```bash
npm install marked dompurify
npm install -D @types/dompurify
```
Expected: `package.json` ganha `marked` e `dompurify` em dependencies, `@types/dompurify` em devDependencies.

- [ ] **Step 2: Write the failing test**

Create `src/app/features/tools/html-markdown-render/render.logic.spec.ts`:

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

- [ ] **Step 3: Run test to verify it fails**

Run: `npm run test:ci -- src/app/features/tools/html-markdown-render/render.logic.spec.ts`
Expected: FAIL — cannot find module `./render.logic`.

- [ ] **Step 4: Write minimal implementation**

Create `src/app/features/tools/html-markdown-render/render.logic.ts`:

```ts
import { marked } from 'marked';

export type RenderMode = 'markdown' | 'html';

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

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test:ci -- src/app/features/tools/html-markdown-render/render.logic.spec.ts`
Expected: PASS.

- [ ] **Step 6: Create the component**

O preview de HTML/Markdown arbitrário é vetor de XSS. Mitigação: sanitizar com DOMPurify (carregado dinamicamente, só no browser) e injetar o resultado via `[innerHTML]` do Angular (que re-sanitiza). DOMPurify importado via `import()` dinâmico para não pesar o initial nem quebrar o prerender (usa `window`).

Create `src/app/features/tools/html-markdown-render/html-markdown-render.ts`:

```ts
import { Component, PLATFORM_ID, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';
import { ToolShell } from '../../../shared/ui/tool-shell/tool-shell';
import { RenderMode, renderMarkdown, sanitizeHtml } from './render.logic';

@Component({
  selector: 'app-html-markdown-render',
  standalone: true,
  imports: [FormsModule, ToolShell],
  template: `
    <app-tool-shell [title]="titleText" [description]="descText">
      <div class="mode-switch" role="group" [attr.aria-label]="modeGroupLabel">
        <button
          type="button"
          class="mode-btn"
          [class.active]="mode() === 'markdown'"
          (click)="setMode('markdown')"
          i18n="@@tools.render.modeMd">Markdown</button>
        <button
          type="button"
          class="mode-btn"
          [class.active]="mode() === 'html'"
          (click)="setMode('html')"
          i18n="@@tools.render.modeHtml">HTML</button>
      </div>

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
  styleUrl: './html-markdown-render.scss',
})
export class HtmlMarkdownRender {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly mode = signal<RenderMode>('markdown');
  readonly source = signal('');
  readonly preview = signal('');

  readonly titleText = $localize`:@@tools.html-markdown-render.name:Render HTML/Markdown`;
  readonly descText = $localize`:@@tools.html-markdown-render.desc:Edite HTML ou Markdown e veja o preview ao vivo.`;
  readonly placeholderText = $localize`:@@tools.render.placeholder:Escreva aqui…`;
  readonly modeGroupLabel = $localize`:@@tools.render.modeGroup:Modo de renderização`;
  readonly editorLabel = $localize`:@@tools.render.editor:Editor`;
  readonly previewLabel = $localize`:@@tools.render.preview:Pré-visualização`;

  setMode(mode: RenderMode): void {
    this.mode.set(mode);
    void this.rerender();
  }

  onInput(value: string): void {
    this.source.set(value);
    void this.rerender();
  }

  private async rerender(): Promise<void> {
    if (!this.isBrowser) return;
    const raw =
      this.mode() === 'markdown' ? await renderMarkdown(this.source()) : this.source();
    const { default: DOMPurify } = await import('dompurify');
    this.preview.set(sanitizeHtml(raw, DOMPurify));
  }
}
```

- [ ] **Step 7: Create the styles**

Create `src/app/features/tools/html-markdown-render/html-markdown-render.scss`:

```scss
.mode-switch { display: flex; gap: 6px; margin-bottom: 14px; }
.mode-btn {
  padding: 6px 14px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--muted);
  font-size: 0.8125rem;
  cursor: pointer;
  &.active { border-color: var(--accent); color: var(--ink); }
  &:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
}
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

- [ ] **Step 8: Run tests + lint**

Run: `npm run test:ci -- src/app/features/tools/html-markdown-render/ && npm run lint`
Expected: testes verdes; lint 0 erros.

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json src/app/features/tools/html-markdown-render/
git commit -m "feat(tools): html/markdown live render with DOMPurify sanitization"
```

---

### Task 8: i18n — extração, tradução en e verificação de paridade

**Files:**
- Modify: `src/locale/messages.xlf` (regenerado)
- Modify: `src/locale/messages.en.xlf` (targets en)

**Interfaces:**
- Consumes: todos os IDs `@@tools.*` e `@@header.tools` criados nas Tasks 2-7.

- [ ] **Step 1: Extract i18n (só depois de todo o texto pronto)**

Run: `npx ng extract-i18n --output-path src/locale`
Expected: `src/locale/messages.xlf` regenerado com todos os novos IDs `@@tools.*`, `@@header.tools`, `@@tools.hub.*`, `@@tools.shell.back`.

- [ ] **Step 2: Preencher os `<target>` em inglês**

Em `src/locale/messages.en.xlf`, para cada novo `<trans-unit>`, preencher `<target>` (preservando os targets existentes). Traduções:

| ID | target (en) |
|---|---|
| `@@header.tools` | `Tools` |
| `@@tools.hub.title` | `Tools` |
| `@@tools.hub.sub` | `Everyday utilities, right in your browser.` |
| `@@tools.hub.soon` | `soon` |
| `@@tools.shell.back` | `← Tools` |
| `@@tools.html-markdown-render.name` | `HTML/Markdown Render` |
| `@@tools.html-markdown-render.desc` | `Edit HTML or Markdown and see the live preview.` |
| `@@tools.json-tools.name` | `JSON Tools` |
| `@@tools.json-tools.desc` | `Format, minify and validate JSON.` |
| `@@tools.hash.name` | `Hash Generator` |
| `@@tools.hash.desc` | `SHA-1, SHA-256, SHA-384 and SHA-512 of a text.` |
| `@@tools.image-converter.name` | `Image Converter` |
| `@@tools.image-converter.desc` | `Convert to AVIF, WebP, PNG and JPG in the browser.` |
| `@@tools.color-tools.name` | `Color Tools` |
| `@@tools.color-tools.desc` | `WCAG contrast, palettes and format conversion.` |
| `@@tools.hash.inputLabel` | `Text` |
| `@@tools.hash.placeholder` | `Type the text…` |
| `@@tools.json-tools.inputLabel` | `Input` |
| `@@tools.json-tools.outputLabel` | `Output` |
| `@@tools.json-tools.format` | `Format` |
| `@@tools.json-tools.minify` | `Minify` |
| `@@tools.json-tools.placeholder` | `Paste your JSON here…` |
| `@@tools.json-tools.errorPrefix` | `Invalid JSON:` |
| `@@tools.render.modeMd` | `Markdown` |
| `@@tools.render.modeHtml` | `HTML` |
| `@@tools.render.placeholder` | `Write here…` |
| `@@tools.render.modeGroup` | `Render mode` |
| `@@tools.render.editor` | `Editor` |
| `@@tools.render.preview` | `Preview` |

- [ ] **Step 3: Verificar paridade**

Run: `npm run build`
Expected: build conclui sem erro de tradução faltando. Se o Angular reclamar de target ausente, preencher o que faltou.

Verificar contagem (0 faltando):
```bash
grep -c '<target' src/locale/messages.en.xlf
grep -c '<source' src/locale/messages.xlf
```
Expected: os dois números batem (todo source tem target).

- [ ] **Step 4: Verificar os dois builds renderizam o idioma certo**

Run:
```bash
grep -o 'Ferramentas\|Tools' dist/portfolio/browser/tools/index.html | head -1
grep -o 'Ferramentas\|Tools' dist/portfolio/browser/en/tools/index.html | head -1
```
Expected: pt mostra `Ferramentas`, en mostra `Tools`.

- [ ] **Step 5: Commit**

```bash
git add src/locale/messages.xlf src/locale/messages.en.xlf
git commit -m "i18n(tools): extract and translate tools platform strings"
```

---

### Task 9: Verificação final da onda

- [ ] **Step 1: Suíte completa + lint + build**

Run: `npm run lint && npm run test:ci && npm run build`
Expected: lint 0 erros (só os 4 warnings a11y pré-existentes); todos os testes verdes; build dos 2 locales conclui.

- [ ] **Step 2: Conferir rotas prerenderizadas**

Run:
```bash
ls dist/portfolio/browser/tools dist/portfolio/browser/tools/hash dist/portfolio/browser/tools/json-tools dist/portfolio/browser/tools/html-markdown-render
ls dist/portfolio/browser/en/tools/hash
```
Expected: `index.html` em cada rota, nos dois locales.

- [ ] **Step 3: Conferir que o budget inicial não vazou**

Verificar a saída do build: nenhum warning novo de budget `initial`. O peso de `marked`/`dompurify` deve aparecer em chunks lazy, não no initial.

- [ ] **Step 4: Finalizar**

Usar a skill `superpowers:finishing-a-development-branch` para decidir merge/PR.

---

## Self-Review (autor do plano)

**Cobertura do spec (Onda 1):**
- Hub `/tools` bilíngue → Task 4 + Task 8. ✓
- Feature lazy isolada por tool → Tasks 4-7 (rotas lazy). ✓
- Catálogo tipado alimentando hub → Task 2. ✓
- ToolShell reusável → Task 3. ✓
- 3 tools MVP (`hash`, `json-tools`, `html-markdown-render`) → Tasks 5-7. ✓
- Lógica pura testada (TDD) → `.logic.spec.ts` em cada tool. ✓
- SSR-safe (WebCrypto/DOMPurify guardados) → Tasks 5, 7 (`isPlatformBrowser`). ✓
- Lazy real do WASM/deps pesadas → `import('dompurify')` dinâmico (Task 7). ✓
- i18n paridade pt/en + verificação → Task 8. ✓
- Link "Tools" no header → Task 4. ✓
- base-relativo (sem `/` absoluto) → `LocaleService.path` (Task 1). ✓

**Fora da Onda 1 (planos futuros):** `image-converter`, `color-tools` e demais do catálogo (aparecem como `soon` no hub); isolamento dos overlays do portfólio por rota; migração Vercel + domínio.

**Placeholder scan:** sem TBD/TODO; todo step de código tem código real. Único ponto condicional (token `--danger` no Task 6 Step 6) traz instrução explícita de como resolver — não é placeholder de implementação.

**Consistência de tipos:** `ToolMeta`/`TOOLS`/`toolsByGroup` (Task 2) usados igual no hub (Task 4). `LocaleService.path` (Task 1) usado em Tasks 3, 4. `digestHex`/`HASH_ALGOS` (Task 5), `formatJson`/`minifyJson`/`JsonResult` (Task 6), `renderMarkdown`/`sanitizeHtml`/`RenderMode` (Task 7) batem entre `.logic.ts`, spec e componente. Nomes de export dos componentes (`ToolsHub`, `HashTool`, `JsonTools`, `HtmlMarkdownRender`) batem com os `loadComponent` da Task 4.
