# Angular Portfolio Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the existing static portfolio (vanilla HTML/CSS/JS on GitHub Pages) as an Angular SSG app with 1:1 feature parity and a renewed visual direction (palette 05: light + dark).

**Architecture:** Standalone Angular components with Signals for UI state, SCSS design tokens for theming, `@angular/ssr` prerendering for static output, and `@angular/localize` for two locales (pt-BR at `/`, en at `/en/`). Each portfolio section is an isolated, testable component. Routes are lazy so future tools plug in without touching the portfolio.

**Tech Stack:** Angular (latest stable), TypeScript strict, SCSS, Angular Animations, `@angular/ssr` (prerender), `@angular/localize`, Karma/Jasmine (CLI default), GitHub Actions + GitHub Pages.

## Global Constraints

- 1:1 feature parity with the current site — no behavior change except visual style.
- Locales: pt-BR (default, `/`) and en (`/en/`). URL structure must match current.
- All animations must respect `prefers-reduced-motion: reduce`.
- Theme: persist in `localStorage` key `theme` (values `light`/`dark`); default follows `prefers-color-scheme`.
- Splash skip-once on locale switch via `sessionStorage` key `portfolio:splash:skip-once`.
- Display font: Space Grotesk. Body font: Inter. Devicon via existing CDN.
- Palette light: bg `#FBFBFC`, card `#F2F4F7`, ink `#0B1220`, muted `#5B6472`, accent `#2563EB`, border `#E6E8EC`.
- Palette dark: bg `#0A0E1A`, card `#0F1626`, text `#EAEEF7`, muted `#8B93A7`, accent `#5B9CFF`, border `#1A2236`/`#283149`.
- Hosting stays GitHub Pages (user page, domain root). Asset versioning via Angular's native content hashing.
- Frequent commits: one per task minimum. Conventional Commits style.

---

## File Structure

```
angular.json, package.json, tsconfig*.json     → workspace config
src/main.ts, src/main.server.ts, src/server.ts → bootstrap (prerender)
src/index.html                                 → app shell
src/styles/
  _tokens.scss      → CSS custom properties (light + dark)
  _typography.scss  → font faces, scale
  _base.scss        → reset, body, a11y helpers
  styles.scss       → entrypoint importing the above
src/app/
  app.config.ts, app.routes.ts, app.ts         → root standalone bootstrap
  core/
    theme.service.ts        → theme signal, persistence, system pref
    theme.service.spec.ts
    locale.service.ts       → current locale, path helpers, asset paths
    locale.service.spec.ts
    seo.service.ts          → title/meta/hreflang per locale & section
    seo.service.spec.ts
    storage.service.ts      → safe localStorage/sessionStorage wrapper
    storage.service.spec.ts
  shared/ui/
    theme-toggle/           → theme switch button
    modal/                  → reusable modal shell (overlay, esc, focus)
    section-heading/        → "NN — Title" editorial heading
  layout/
    header/                 → nav, brand, toggle, contact btn, lang switch
    footer/
    splash/                 → splash screen + skip-once
  features/portfolio/
    portfolio.ts            → page composing all sections (route component)
    hero/                   → hero + typing rotator
    about/                  → "Sobre"
    skills/                 → tabs + devicon panels
    projects/               → filter + paginated carousel
    experience/             → experience cards
    about-me/               → collapsible + about cards + media grid
    gallery/                → fullscreen gallery modal
    contact/                → contact modal
    back-to-top/
src/data/
  projects.ts     → typed project list
  experience.ts   → typed experience list
  skills.ts       → typed skill groups
src/assets/img/   → migrated images
src/locale/
  messages.xlf       → extracted source (pt-BR)
  messages.en.xlf    → english translations
.github/workflows/pages.yml → Angular build + Pages deploy
```

---

## Task 1: Scaffold Angular workspace with SSR/prerender

**Files:**
- Create: `package.json`, `angular.json`, `tsconfig.json`, `tsconfig.app.json`, `src/main.ts`, `src/main.server.ts`, `src/server.ts`, `src/index.html`, `src/app/app.ts`, `src/app/app.config.ts`, `src/app/app.routes.ts`

**Interfaces:**
- Produces: an Angular workspace named `portfolio` with SSR enabled, that builds and prerenders to `dist/portfolio/browser`.

**Note on existing files:** The current static site (`index.html`, `css/`, `js/`, `en/`) stays untouched during the build-out and is removed only in Task 18 once the Angular output replaces it. Generate the Angular app at repo root (use a temp subfolder if the CLI refuses a non-empty dir, then move files).

- [ ] **Step 1: Generate the workspace**

Run (answer prompts: SCSS, SSR = yes):
```bash
npx -p @angular/cli@latest ng new portfolio --style=scss --ssr=true --routing=true --directory=. --skip-git
```
If the CLI refuses the non-empty directory, generate in `../portfolio-tmp` and move `src/`, `angular.json`, `package.json`, `tsconfig*.json`, `public/` into the repo root.

- [ ] **Step 2: Enable prerender + verify build**

Confirm `angular.json` `architect.build.options.outputMode` is `static` (or add `"prerender": true`). Then:
```bash
npm run build
```
Expected: build succeeds, produces `dist/portfolio/browser/index.html` with real DOM content (not empty `<app-root>`).

- [ ] **Step 3: Run the dev server smoke test**

```bash
npm start
```
Expected: app serves at `http://localhost:4200` showing the default Angular page. Stop the server.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: scaffold Angular workspace with SSR prerender"
```

---

## Task 2: Design tokens and global styles

**Files:**
- Create: `src/styles/_tokens.scss`, `src/styles/_typography.scss`, `src/styles/_base.scss`
- Modify: `src/styles.scss`, `src/index.html` (font preconnect/links)

**Interfaces:**
- Produces: CSS custom properties available globally. Light is default on `:root`; dark applies when `<html data-theme="dark">`. Token names: `--bg`, `--surface`, `--ink`, `--muted`, `--accent`, `--accent-strong`, `--border`, `--glow`, `--btn-fg`, `--shadow-block`.

- [ ] **Step 1: Write tokens**

`src/styles/_tokens.scss`:
```scss
:root {
  --bg: #FBFBFC; --surface: #F2F4F7; --ink: #0B1220; --muted: #5B6472;
  --accent: #2563EB; --accent-strong: #0B1220; --border: #E6E8EC;
  --glow: rgba(37,99,235,.08); --btn-fg: #fff; --shadow-block: #0B1220;
  --radius: 12px; --radius-lg: 18px;
  --maxw: 1080px;
}
:root[data-theme="dark"] {
  --bg: #0A0E1A; --surface: #0F1626; --ink: #EAEEF7; --muted: #8B93A7;
  --accent: #5B9CFF; --accent-strong: #5B9CFF; --border: #1A2236;
  --glow: rgba(91,156,255,.14); --btn-fg: #06080F; --shadow-block: #5B9CFF;
}
```

- [ ] **Step 2: Typography + base**

`src/styles/_typography.scss`:
```scss
:root { --font-display: "Space Grotesk", system-ui, sans-serif; --font-body: "Inter", system-ui, sans-serif; }
h1,h2,h3,h4,.display { font-family: var(--font-display); letter-spacing: -.01em; }
body { font-family: var(--font-body); }
```
`src/styles/_base.scss`:
```scss
* { box-sizing: border-box; }
html, body { margin: 0; }
body { background: var(--bg); color: var(--ink); line-height: 1.55; -webkit-font-smoothing: antialiased; }
.container { max-width: var(--maxw); margin: 0 auto; padding: 0 24px; }
.visually-hidden { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap; border:0; }
a { color: inherit; }
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration:.001ms !important; transition-duration:.001ms !important; } }
```

- [ ] **Step 3: Wire entrypoint + fonts**

`src/styles.scss`:
```scss
@use "styles/tokens";
@use "styles/typography";
@use "styles/base";
```
In `src/index.html` `<head>` add:
```html
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/devicons/devicon@master/devicon.min.css">
```

- [ ] **Step 4: Verify + commit**

```bash
npm run build
git add -A && git commit -m "feat: add design tokens, typography and base styles"
```
Expected: build passes.

---

## Task 3: StorageService

**Files:**
- Create: `src/app/core/storage.service.ts`, `src/app/core/storage.service.spec.ts`

**Interfaces:**
- Produces: `StorageService` with `getLocal(key: string): string | null`, `setLocal(key: string, value: string): void`, `getSession(key)`, `setSession(key, value)`, `removeSession(key)`. All swallow exceptions and no-op when `window`/storage is unavailable (SSR-safe).

- [ ] **Step 1: Write the failing test**

`src/app/core/storage.service.spec.ts`:
```ts
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let svc: StorageService;
  beforeEach(() => { localStorage.clear(); sessionStorage.clear(); svc = new StorageService(); });

  it('round-trips local values', () => {
    svc.setLocal('k', 'v');
    expect(svc.getLocal('k')).toBe('v');
  });
  it('returns null for missing local key', () => {
    expect(svc.getLocal('nope')).toBeNull();
  });
  it('round-trips and removes session values', () => {
    svc.setSession('s', 'x');
    expect(svc.getSession('s')).toBe('x');
    svc.removeSession('s');
    expect(svc.getSession('s')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test, verify fail**

Run: `npm test -- --watch=false`
Expected: FAIL (cannot find `./storage.service`).

- [ ] **Step 3: Implement**

`src/app/core/storage.service.ts`:
```ts
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private safe<T>(fn: () => T, fallback: T): T {
    try { return fn(); } catch { return fallback; }
  }
  getLocal(key: string): string | null {
    return this.safe(() => (typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null), null);
  }
  setLocal(key: string, value: string): void {
    this.safe(() => { if (typeof localStorage !== 'undefined') localStorage.setItem(key, value); }, undefined);
  }
  getSession(key: string): string | null {
    return this.safe(() => (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(key) : null), null);
  }
  setSession(key: string, value: string): void {
    this.safe(() => { if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(key, value); }, undefined);
  }
  removeSession(key: string): void {
    this.safe(() => { if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(key); }, undefined);
  }
}
```

- [ ] **Step 4: Run test, verify pass**

Run: `npm test -- --watch=false`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add SSR-safe StorageService"
```

---

## Task 4: ThemeService

**Files:**
- Create: `src/app/core/theme.service.ts`, `src/app/core/theme.service.spec.ts`

**Interfaces:**
- Consumes: `StorageService` (Task 3).
- Produces: `ThemeService` with `readonly theme: Signal<'light'|'dark'>`, `toggle(): void`, `init(): void`. `init()` reads stored theme or system preference and applies `data-theme` on `document.documentElement`. `toggle()` flips, persists to `localStorage['theme']`, updates attribute.

- [ ] **Step 1: Write the failing test**

`src/app/core/theme.service.spec.ts`:
```ts
import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';
import { StorageService } from './storage.service';

describe('ThemeService', () => {
  let svc: ThemeService;
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    TestBed.configureTestingModule({ providers: [ThemeService, StorageService] });
    svc = TestBed.inject(ThemeService);
  });

  it('defaults to a valid theme on init', () => {
    svc.init();
    expect(['light','dark']).toContain(svc.theme());
  });
  it('toggle flips and persists', () => {
    svc.init();
    const before = svc.theme();
    svc.toggle();
    expect(svc.theme()).not.toBe(before);
    expect(localStorage.getItem('theme')).toBe(svc.theme());
  });
  it('applies data-theme attribute', () => {
    svc.init(); svc.toggle();
    expect(document.documentElement.getAttribute('data-theme')).toBe(svc.theme());
  });
  it('respects a stored preference', () => {
    localStorage.setItem('theme','dark');
    svc.init();
    expect(svc.theme()).toBe('dark');
  });
});
```

- [ ] **Step 2: Run test, verify fail**

Run: `npm test -- --watch=false` → FAIL (no `theme.service`).

- [ ] **Step 3: Implement**

`src/app/core/theme.service.ts`:
```ts
import { Injectable, signal, inject } from '@angular/core';
import { StorageService } from './storage.service';

type Theme = 'light' | 'dark';
const KEY = 'theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private storage = inject(StorageService);
  private _theme = signal<Theme>('light');
  readonly theme = this._theme.asReadonly();

  init(): void {
    const stored = this.storage.getLocal(KEY) as Theme | null;
    const prefersDark = typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    const theme: Theme = stored ?? (prefersDark ? 'dark' : 'light');
    this.apply(theme);
  }

  toggle(): void {
    this.apply(this._theme() === 'dark' ? 'light' : 'dark');
    this.storage.setLocal(KEY, this._theme());
  }

  private apply(theme: Theme): void {
    this._theme.set(theme);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }
}
```

- [ ] **Step 4: Run test, verify pass** → `npm test -- --watch=false` PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add ThemeService with signal state and persistence"
```

---

## Task 5: LocaleService

**Files:**
- Create: `src/app/core/locale.service.ts`, `src/app/core/locale.service.spec.ts`

**Interfaces:**
- Consumes: Angular `LOCALE_ID`.
- Produces: `LocaleService` with `readonly locale: 'pt-BR'|'en'`, `localePath(locale): string` (returns `/` for pt-BR, `/en/` for en, honoring a configurable base href), `otherLocale(): 'pt-BR'|'en'`, `assetPath(rel): string`. Locale derives from injected `LOCALE_ID` (`en` when it starts with `en`, else `pt-BR`).

- [ ] **Step 1: Write the failing test**

`src/app/core/locale.service.spec.ts`:
```ts
import { TestBed } from '@angular/core/testing';
import { LOCALE_ID } from '@angular/core';
import { LocaleService } from './locale.service';

function make(locale: string) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [LocaleService, { provide: LOCALE_ID, useValue: locale }] });
  return TestBed.inject(LocaleService);
}

describe('LocaleService', () => {
  it('maps pt-BR locale', () => {
    const s = make('pt-BR');
    expect(s.locale).toBe('pt-BR');
    expect(s.localePath('pt-BR')).toBe('/');
    expect(s.localePath('en')).toBe('/en/');
    expect(s.otherLocale()).toBe('en');
  });
  it('maps en locale', () => {
    const s = make('en-US');
    expect(s.locale).toBe('en');
    expect(s.otherLocale()).toBe('pt-BR');
  });
});
```

- [ ] **Step 2: Run, verify fail** → FAIL.

- [ ] **Step 3: Implement**

`src/app/core/locale.service.ts`:
```ts
import { Injectable, LOCALE_ID, inject } from '@angular/core';

export type AppLocale = 'pt-BR' | 'en';

@Injectable({ providedIn: 'root' })
export class LocaleService {
  private readonly id = inject(LOCALE_ID);
  readonly locale: AppLocale = this.id.toLowerCase().startsWith('en') ? 'en' : 'pt-BR';

  localePath(locale: AppLocale): string {
    return locale === 'en' ? '/en/' : '/';
  }
  otherLocale(): AppLocale {
    return this.locale === 'en' ? 'pt-BR' : 'en';
  }
  assetPath(rel: string): string {
    return `/${rel.replace(/^\/+/, '')}`;
  }
}
```

- [ ] **Step 4: Run, verify pass** → PASS.

- [ ] **Step 5: Commit** → `git commit -m "feat: add LocaleService"`

---

## Task 6: Typed data files

**Files:**
- Create: `src/data/projects.ts`, `src/data/experience.ts`, `src/data/skills.ts`, `src/data/projects.spec.ts`

**Interfaces:**
- Produces:
  - `type ProjectTech = 'flutter'|'react-native'|'web'`
  - `interface Project { slug; name; description; techs: ProjectTech[]; badge; githubUrl; readmeUrl; }`
  - `const PROJECTS: Project[]` (port all 10 entries from `js/projects/projects.js`, with `name`/`description` filled per locale via i18n at the component layer — store keys as default pt-BR strings using `$localize`).
  - `interface SkillGroup { id; label; icons: { cls: string; title: string }[] }`, `const SKILL_GROUPS: SkillGroup[]`.
  - `interface ExperienceItem { title; period?; bullets: string[] }`, `const EXPERIENCE: ExperienceItem[]`.

- [ ] **Step 1: Write the failing test**

`src/data/projects.spec.ts`:
```ts
import { PROJECTS } from './projects';

describe('PROJECTS data', () => {
  it('has 10 projects with required fields', () => {
    expect(PROJECTS.length).toBe(10);
    for (const p of PROJECTS) {
      expect(p.slug).toBeTruthy();
      expect(p.githubUrl).toMatch(/^https:\/\/github\.com\//);
      expect(p.techs.length).toBeGreaterThan(0);
    }
  });
  it('only uses known techs', () => {
    const known = new Set(['flutter','react-native','web']);
    for (const p of PROJECTS) for (const t of p.techs) expect(known.has(t)).toBeTrue();
  });
});
```

- [ ] **Step 2: Run, verify fail** → FAIL.

- [ ] **Step 3: Implement** (port content from `js/projects/projects.js`, `js/i18n/locales/pt-BR.js`, and the experience/skills HTML in `index.html`)

`src/data/projects.ts` (showing 2 of 10 — port the rest identically from the source files):
```ts
export type ProjectTech = 'flutter' | 'react-native' | 'web';
export interface Project {
  slug: string; name: string; description: string;
  techs: ProjectTech[]; badge: string; githubUrl: string; readmeUrl: string;
}
export const PROJECTS: Project[] = [
  {
    slug: 'rick-and-morty-api',
    name: $localize`:@@proj.rickAndMorty.name:Rick and Morty API`,
    description: $localize`:@@proj.rickAndMorty.desc:App consumindo a API pública, listagem e detalhes com cache.`,
    techs: ['flutter'], badge: 'Flutter',
    githubUrl: 'https://github.com/Kadjow/Rick-and-Morty-Project-with-API-',
    readmeUrl: 'https://github.com/Kadjow/Rick-and-Morty-Project-with-API-#readme',
  },
  {
    slug: 'sobcontrole-app',
    name: $localize`:@@proj.sobControle.name:SobControle`,
    description: $localize`:@@proj.sobControle.desc:Controle financeiro pessoal, foco em UX e offline-first.`,
    techs: ['react-native'], badge: 'React Native',
    githubUrl: 'https://github.com/Kadjow/sobcontrole-app',
    readmeUrl: 'https://github.com/Kadjow/sobcontrole-app#readme',
  },
  // ... port the remaining 8 entries from js/projects/projects.js verbatim
];
```
`src/data/skills.ts` and `src/data/experience.ts`: port the `SKILL_GROUPS` (icon classes from `index.html` panels) and `EXPERIENCE` items (titles/periods/bullets from `index.html` `#experiencia`), using `$localize` for human text.

- [ ] **Step 4: Run, verify pass** → PASS.

- [ ] **Step 5: Commit** → `git commit -m "feat: add typed project, skill and experience data"`

---

## Task 7: Root shell, routes and app bootstrap

**Files:**
- Modify: `src/app/app.ts`, `src/app/app.routes.ts`, `src/app/app.config.ts`, `src/main.ts`

**Interfaces:**
- Consumes: `ThemeService.init()` (Task 4).
- Produces: root `App` component that calls `themeService.init()` in constructor and renders `<app-header/> <router-outlet/> <app-footer/> <app-splash/> <app-back-to-top/>` (components stubbed empty for now, filled in later tasks). Route `''` lazy-loads `features/portfolio/portfolio.ts`. `provideRouter` with an in-memory scrolling config that smooth-scrolls to anchors.

- [ ] **Step 1: Define lazy route**

`src/app/app.routes.ts`:
```ts
import { Routes } from '@angular/router';
export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/portfolio/portfolio').then(m => m.Portfolio) },
];
```

- [ ] **Step 2: Create the portfolio placeholder**

`src/app/features/portfolio/portfolio.ts`:
```ts
import { Component } from '@angular/core';
@Component({ selector: 'app-portfolio', standalone: true, template: `<main id="conteudo"><!-- sections added in later tasks --></main>` })
export class Portfolio {}
```

- [ ] **Step 3: Root component calls theme init**

`src/app/app.ts`:
```ts
import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/theme.service';

@Component({
  selector: 'app-root', standalone: true, imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class App {
  constructor() { inject(ThemeService).init(); }
}
```
(Header/footer/splash/back-to-top added to this template as their tasks land.)

- [ ] **Step 4: Build + commit**

```bash
npm run build
git add -A && git commit -m "feat: wire lazy portfolio route and theme init"
```
Expected: build passes, prerenders `/`.

---

## Task 8: Reusable SectionHeading and Modal shell

**Files:**
- Create: `src/app/shared/ui/section-heading/section-heading.ts`, `src/app/shared/ui/modal/modal.ts`, `src/app/shared/ui/modal/modal.spec.ts`

**Interfaces:**
- Produces:
  - `SectionHeading` — inputs `number: string`, `title: string`; renders `<p class="snum">{{number}} — …</p><h2>{{title}}</h2>`.
  - `Modal` — input `open: boolean`, input `labelledby: string`, output `close = new EventEmitter<void>()`. Renders an overlay + card; emits `close` on overlay click, Esc key, and `.modal-close` click. Locks body scroll while open. Content projected via `<ng-content>`.

- [ ] **Step 1: Write the failing test**

`src/app/shared/ui/modal/modal.spec.ts`:
```ts
import { TestBed } from '@angular/core/testing';
import { Modal } from './modal';

describe('Modal', () => {
  it('emits close on Escape when open', () => {
    const fixture = TestBed.createComponent(Modal);
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    let closed = false;
    fixture.componentInstance.close.subscribe(() => (closed = true));
    fixture.componentInstance.onKeydown(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(closed).toBeTrue();
  });
  it('does not emit close on Escape when closed', () => {
    const fixture = TestBed.createComponent(Modal);
    fixture.componentRef.setInput('open', false);
    fixture.detectChanges();
    let closed = false;
    fixture.componentInstance.close.subscribe(() => (closed = true));
    fixture.componentInstance.onKeydown(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(closed).toBeFalse();
  });
});
```

- [ ] **Step 2: Run, verify fail** → FAIL.

- [ ] **Step 3: Implement**

`src/app/shared/ui/modal/modal.ts`:
```ts
import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';

@Component({
  selector: 'app-modal', standalone: true,
  template: `
    <div class="modal-overlay" [class.is-open]="open" [attr.aria-hidden]="!open"
         role="dialog" [attr.aria-labelledby]="labelledby" (click)="onOverlay($event)">
      <div class="modal-card" role="document">
        <button class="modal-close" type="button" (click)="close.emit()" aria-label="Close">✕</button>
        <ng-content />
      </div>
    </div>`,
  styleUrl: './modal.scss',
})
export class Modal {
  @Input() open = false;
  @Input() labelledby = '';
  @Output() close = new EventEmitter<void>();

  onOverlay(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) this.close.emit();
  }
  @HostListener('document:keydown', ['$event'])
  onKeydown(e: KeyboardEvent) {
    if (this.open && e.key === 'Escape') this.close.emit();
  }
}
```
`src/app/shared/ui/modal/modal.scss`: overlay (fixed, backdrop, centered), `.is-open` shows it, `.modal-card` uses `--surface`/`--border`. `SectionHeading` is a trivial presentational component (no test needed beyond build).

- [ ] **Step 4: Run, verify pass** → PASS.

- [ ] **Step 5: Commit** → `git commit -m "feat: add SectionHeading and Modal shell"`

---

## Task 9: ThemeToggle + Header + Footer

**Files:**
- Create: `src/app/shared/ui/theme-toggle/theme-toggle.ts`, `src/app/layout/header/header.ts` (+`.scss`), `src/app/layout/footer/footer.ts`
- Modify: `src/app/app.ts` (add `<app-header>`/`<app-footer>`)

**Interfaces:**
- Consumes: `ThemeService` (Task 4), `LocaleService` (Task 5).
- Produces: `Header` rendering brand `DAG.`, `ThemeToggle`, a contact button that emits/dispatches an "open contact" action (use a shared signal service `UiState` with `contactOpen` signal — create `src/app/core/ui-state.service.ts` with `contactOpen = signal(false)` and `galleryOpen`), and the language switch (`PT · EN`) using `localeService.localePath`. `Footer` shows `© {year} Diogo Arthur Gulhak`.

- [ ] **Step 1: Create UiState service**

`src/app/core/ui-state.service.ts`:
```ts
import { Injectable, signal } from '@angular/core';
@Injectable({ providedIn: 'root' })
export class UiStateService {
  readonly contactOpen = signal(false);
}
```

- [ ] **Step 2: ThemeToggle**

`src/app/shared/ui/theme-toggle/theme-toggle.ts`:
```ts
import { Component, inject } from '@angular/core';
import { ThemeService } from '../../../core/theme.service';
@Component({
  selector: 'app-theme-toggle', standalone: true,
  template: `
    <button type="button" class="theme-switch" role="switch"
            [attr.aria-checked]="theme.theme() === 'dark'"
            aria-label="Alternar tema" i18n-aria-label="@@a11y.themeToggle"
            (click)="theme.toggle()">
      <span class="track" [class.on]="theme.theme() === 'dark'"><span class="thumb"></span></span>
    </button>`,
  styleUrl: './theme-toggle.scss',
})
export class ThemeToggle { theme = inject(ThemeService); }
```

- [ ] **Step 3: Header + Footer** (lang switch uses real `<a>` to `localePath(otherLocale)`; contact button sets `ui.contactOpen.set(true)`). Add both to `App` template alongside `<router-outlet/>`.

- [ ] **Step 4: Build + commit**

```bash
npm run build
git add -A && git commit -m "feat: add header, footer, theme toggle and UI state"
```

---

## Task 10: Splash screen with skip-once

**Files:**
- Create: `src/app/layout/splash/splash.ts` (+`.scss`), `src/app/layout/splash/splash.spec.ts`
- Modify: `src/app/app.ts`

**Interfaces:**
- Consumes: `StorageService` (Task 3).
- Produces: `Splash` component with `visible = signal(boolean)`. On init: if `sessionStorage['portfolio:splash:skip-once']` is set, remove it and set `visible=false`; else show splash and hide after ~900ms (skip entirely if `prefers-reduced-motion`). Language switch links (Task 9) set the skip key before navigating.

- [ ] **Step 1: Write the failing test**

`src/app/layout/splash/splash.spec.ts`:
```ts
import { TestBed } from '@angular/core/testing';
import { Splash } from './splash';
import { StorageService } from '../../core/storage.service';

describe('Splash', () => {
  beforeEach(() => sessionStorage.clear());
  it('skips when skip-once flag present', () => {
    sessionStorage.setItem('portfolio:splash:skip-once', 'locale-switch');
    const f = TestBed.createComponent(Splash);
    f.detectChanges();
    expect(f.componentInstance.visible()).toBeFalse();
    expect(sessionStorage.getItem('portfolio:splash:skip-once')).toBeNull();
  });
});
```

- [ ] **Step 2: Run, verify fail** → FAIL.

- [ ] **Step 3: Implement** the component honoring the flag, reduced-motion, and a timed hide. Add `<app-splash/>` to `App`.

- [ ] **Step 4: Run, verify pass** → PASS.

- [ ] **Step 5: Commit** → `git commit -m "feat: add splash screen with locale-switch skip-once"`

---

## Task 11: Hero with typing rotator

**Files:**
- Create: `src/app/features/portfolio/hero/hero.ts` (+`.scss`), `src/app/features/portfolio/hero/hero.spec.ts`
- Modify: `src/app/features/portfolio/portfolio.ts`

**Interfaces:**
- Produces: `Hero` rendering avatar photo, section number, headline `Diogo Gulhak` (accent on surname), role prefix + `roleText = signal('')` rotator, bio (i18n), CTAs, social links. Rotator logic in a pure helper `nextTypingState(state, phrases)` returning the next `{ phraseIndex, charIndex, deleting, text }` so it is unit-testable without timers. Reduced-motion shows full phrase, cycling on an interval.

- [ ] **Step 1: Write the failing test**

`src/app/features/portfolio/hero/hero.spec.ts`:
```ts
import { nextTypingState } from './hero';

describe('nextTypingState', () => {
  const phrases = ['ab', 'cd'];
  it('types forward one char', () => {
    const s = nextTypingState({ phraseIndex: 0, charIndex: 0, deleting: false }, phrases);
    expect(s.text).toBe('a'); expect(s.charIndex).toBe(1);
  });
  it('starts deleting after full word', () => {
    const s = nextTypingState({ phraseIndex: 0, charIndex: 2, deleting: false }, phrases);
    expect(s.deleting).toBeTrue();
  });
  it('advances to next phrase after fully deleting', () => {
    const s = nextTypingState({ phraseIndex: 0, charIndex: 0, deleting: true }, phrases);
    expect(s.phraseIndex).toBe(1); expect(s.deleting).toBeFalse();
  });
});
```

- [ ] **Step 2: Run, verify fail** → FAIL.

- [ ] **Step 3: Implement** `nextTypingState` (exported pure fn) + the `Hero` component driving it via `setTimeout`/`effect`, guarded by reduced-motion and `isPlatformBrowser`. Add `<app-hero/>` to portfolio. Render the section heading "00 — Portfólio".

- [ ] **Step 4: Run, verify pass** → PASS.

- [ ] **Step 5: Commit** → `git commit -m "feat: add hero with testable typing rotator"`

---

## Task 12: About + Skills tabs

**Files:**
- Create: `about/about.ts`, `skills/skills.ts` (+`.scss`), `skills/skills.spec.ts` under `src/app/features/portfolio/`
- Modify: `portfolio.ts`

**Interfaces:**
- Consumes: `SKILL_GROUPS` (Task 6).
- Produces: `About` (static two-paragraph section, "01 — Sobre"). `Skills` (heading "02 — Skills") with tablist; `activeId = signal(groupId)`; `selectTab(id)`, `onKeydown(e)` implementing ArrowRight/ArrowLeft/Home/End wrap navigation. Active panel renders devicon `<i>` icons. CSS class transition for swap (reduced-motion aware).

- [ ] **Step 1: Write the failing test**

`skills/skills.spec.ts`:
```ts
import { nextTabIndex } from './skills';
describe('nextTabIndex', () => {
  it('wraps right', () => expect(nextTabIndex(3, 'ArrowRight', 4)).toBe(0));
  it('wraps left', () => expect(nextTabIndex(0, 'ArrowLeft', 4)).toBe(3));
  it('Home → 0', () => expect(nextTabIndex(2, 'Home', 4)).toBe(0));
  it('End → last', () => expect(nextTabIndex(0, 'End', 4)).toBe(3));
  it('ignores other keys', () => expect(nextTabIndex(1, 'a', 4)).toBe(1));
});
```

- [ ] **Step 2: Run, verify fail** → FAIL.

- [ ] **Step 3: Implement** exported `nextTabIndex(current, key, len)` + `Skills`/`About` components. Wire into portfolio.

- [ ] **Step 4: Run, verify pass** → PASS.

- [ ] **Step 5: Commit** → `git commit -m "feat: add about section and accessible skills tabs"`

---

## Task 13: Projects (filter + paginated carousel)

**Files:**
- Create: `projects/projects.ts` (+`.scss`), `projects/projects.spec.ts`
- Modify: `portfolio.ts`

**Interfaces:**
- Consumes: `PROJECTS` (Task 6).
- Produces: `Projects` (heading "03 — Projetos"). Pure helpers (exported, tested):
  - `filterProjects(list, tech: 'all'|ProjectTech): Project[]`
  - `pageSlice(list, page, perPage=3): Project[]`
  - `wrapPage(page, total): number` (circular). Component holds `activeTech`, `page` signals; `setFilter(tech)` resets page to 0; `next()/prev()` wrap. Cards show index, badge, name, description, repo/README links.

- [ ] **Step 1: Write the failing test**

`projects/projects.spec.ts`:
```ts
import { PROJECTS } from '../../../data/projects';
import { filterProjects, pageSlice, wrapPage } from './projects';

describe('projects logic', () => {
  it('filters by tech', () => {
    const web = filterProjects(PROJECTS, 'web');
    expect(web.every(p => p.techs.includes('web'))).toBeTrue();
  });
  it('all returns full list', () => {
    expect(filterProjects(PROJECTS, 'all').length).toBe(PROJECTS.length);
  });
  it('pageSlice returns at most 3', () => {
    expect(pageSlice(PROJECTS, 0, 3).length).toBe(3);
  });
  it('wrapPage is circular', () => {
    expect(wrapPage(-1, 3)).toBe(2);
    expect(wrapPage(3, 3)).toBe(0);
  });
});
```

- [ ] **Step 2: Run, verify fail** → FAIL.

- [ ] **Step 3: Implement** the three pure helpers + `Projects` component (filter buttons as tablist, prev/next arrows, card grid with entrance stagger via CSS). Disable arrows when `totalPages <= 1`.

- [ ] **Step 4: Run, verify pass** → PASS.

- [ ] **Step 5: Commit** → `git commit -m "feat: add projects with filtering and circular pagination"`

---

## Task 14: Experience + About-me (collapsible + media grid)

**Files:**
- Create: `experience/experience.ts`, `about-me/about-me.ts` (+`.scss`), `about-me/about-me.spec.ts`
- Modify: `portfolio.ts`

**Interfaces:**
- Consumes: `EXPERIENCE` (Task 6), `StorageService`, `UiStateService`.
- Produces: `Experience` (heading "04 — Experiência") rendering cards from `EXPERIENCE`. `AboutMe` (heading "05 — Quem sou eu") with a `<details>`-style collapsible whose open state persists to `localStorage['about-open']`; about cards (Escotismo/Natureza/Café) + media grid with two figures (`scout`, `tech`) that, on click/Enter/Space, call a gallery service to open (Task 15).

- [ ] **Step 1: Write the failing test**

`about-me/about-me.spec.ts`:
```ts
import { TestBed } from '@angular/core/testing';
import { AboutMe } from './about-me';
import { StorageService } from '../../../core/storage.service';

describe('AboutMe persistence', () => {
  beforeEach(() => localStorage.clear());
  it('restores open state from storage', () => {
    localStorage.setItem('about-open', 'true');
    const f = TestBed.createComponent(AboutMe);
    f.detectChanges();
    expect(f.componentInstance.open()).toBeTrue();
  });
  it('persists toggled state', () => {
    const f = TestBed.createComponent(AboutMe);
    f.detectChanges();
    f.componentInstance.toggle();
    expect(localStorage.getItem('about-open')).toBe(String(f.componentInstance.open()));
  });
});
```

- [ ] **Step 2: Run, verify fail** → FAIL.

- [ ] **Step 3: Implement** both components; wire into portfolio. Media figures call `GalleryService.open('scout'|'tech')` (service created in Task 15 — import its interface; if executing strictly in order, create a minimal `GalleryService` stub here and flesh out in Task 15).

- [ ] **Step 4: Run, verify pass** → PASS.

- [ ] **Step 5: Commit** → `git commit -m "feat: add experience and persistent about-me sections"`

---

## Task 15: Gallery modal + Contact modal

**Files:**
- Create: `src/app/core/gallery.service.ts` (+`.spec.ts`), `features/portfolio/gallery/gallery.ts` (+`.scss`), `features/portfolio/contact/contact.ts`
- Modify: `src/app/app.ts` (mount `<app-gallery/>` and `<app-contact/>`)

**Interfaces:**
- Consumes: `LocaleService.assetPath`, `UiStateService`, `StorageService`.
- Produces:
  - `GalleryService` with `open(group: 'scout'|'tech')`, `close()`, `next()`, `prev()`, signals `isOpen`, `group`, `index`, computed `current` (image src + alt). Image lists ported from `js/main.js` `galleries`.
  - `Gallery` component (uses `Modal` shell) bound to the service, keyboard ←/→/Esc, counter `index+1 / total`.
  - `Contact` component (uses `Modal`) bound to `UiStateService.contactOpen`; email/WhatsApp/LinkedIn items with i18n-built mailto + wa.me links.

- [ ] **Step 1: Write the failing test**

`src/app/core/gallery.service.spec.ts`:
```ts
import { TestBed } from '@angular/core/testing';
import { LOCALE_ID } from '@angular/core';
import { GalleryService } from './gallery.service';

describe('GalleryService', () => {
  let s: GalleryService;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [GalleryService, { provide: LOCALE_ID, useValue: 'pt-BR' }] });
    s = TestBed.inject(GalleryService);
  });
  it('opens a group at index 0', () => {
    s.open('scout');
    expect(s.isOpen()).toBeTrue(); expect(s.index()).toBe(0);
  });
  it('wraps next/prev circularly', () => {
    s.open('tech');
    const total = s.total();
    s.prev();
    expect(s.index()).toBe(total - 1);
    s.next();
    expect(s.index()).toBe(0);
  });
});
```

- [ ] **Step 2: Run, verify fail** → FAIL.

- [ ] **Step 3: Implement** `GalleryService` (port image arrays), `Gallery` + `Contact` components, mount both in `App`. Replace the Task 14 stub.

- [ ] **Step 4: Run, verify pass** → PASS.

- [ ] **Step 5: Commit** → `git commit -m "feat: add gallery service, gallery modal and contact modal"`

---

## Task 16: Back-to-top + assemble full portfolio page

**Files:**
- Create: `features/portfolio/back-to-top/back-to-top.ts`
- Modify: `app.ts`, `portfolio.ts` (ensure section order: hero, about, skills, projects, experience, about-me)

**Interfaces:**
- Produces: `BackToTop` button visible after `window.scrollY > 400`, smooth-scrolls to top. Final portfolio composes all sections in order with anchors `#sobre`, `#skills`, `#projetos`, `#experiencia`, `#sobre-mim`.

- [ ] **Step 1: Implement** `BackToTop` (scroll listener guarded by `isPlatformBrowser`), mount in `App`.
- [ ] **Step 2: Verify section order + anchors** match the nav links.
- [ ] **Step 3: Build smoke test**

```bash
npm run build
```
Expected: prerendered `/` contains all section headings.

- [ ] **Step 4: Commit** → `git commit -m "feat: add back-to-top and assemble portfolio page"`

---

## Task 17: SeoService (title, meta, hreflang per locale & section)

**Files:**
- Create: `src/app/core/seo.service.ts`, `src/app/core/seo.service.spec.ts`
- Modify: `portfolio.ts` (call `seo.applyForLocale()` on init; bind section title updates on anchor nav)

**Interfaces:**
- Consumes: `LocaleService`, Angular `Title`, `Meta`, `DOCUMENT`.
- Produces: `SeoService` with `applyForLocale()` setting `document.title`, description, og tags, canonical + hreflang links (`pt-BR`, `en`, `x-default`) using `localeService` + a configurable origin; `setSectionTitle(section)` for nav-driven title changes. Pure helper `buildHreflangs(origin)` returns the 3 `{ rel, hreflang, href }` entries — unit-tested.

- [ ] **Step 1: Write the failing test**

`src/app/core/seo.service.spec.ts`:
```ts
import { buildHreflangs } from './seo.service';
describe('buildHreflangs', () => {
  it('builds pt, en and x-default', () => {
    const h = buildHreflangs('https://diogo.a.gulhak.github.io');
    const langs = h.map(x => x.hreflang).sort();
    expect(langs).toEqual(['en','pt-BR','x-default']);
    expect(h.find(x => x.hreflang === 'en')!.href).toContain('/en/');
  });
});
```

- [ ] **Step 2: Run, verify fail** → FAIL.

- [ ] **Step 3: Implement** `buildHreflangs` + `SeoService`; call it from `Portfolio`. Provide localized SEO strings via `$localize`.

- [ ] **Step 4: Run, verify pass** → PASS.

- [ ] **Step 5: Commit** → `git commit -m "feat: add SeoService with per-locale hreflang"`

---

## Task 18: i18n configuration and English build

**Files:**
- Modify: `angular.json` (i18n `locales`, `localize` builds), `package.json` (scripts)
- Create: `src/locale/messages.xlf`, `src/locale/messages.en.xlf`
- Delete: old static files (`index.html`, `css/`, `js/`, `en/`, `img/` after migrating to `src/assets/img/`)

**Interfaces:**
- Produces: build that outputs pt-BR at root and en under `/en/`, matching the old URL structure. All `$localize`/`i18n` markers translated in `messages.en.xlf`.

- [ ] **Step 1: Configure i18n**

In `angular.json` add:
```json
"i18n": {
  "sourceLocale": "pt-BR",
  "locales": { "en": { "translation": "src/locale/messages.en.xlf", "subPath": "en" } }
}
```
Set `"localize": true` on the production build and `"outputMode": "static"`.

- [ ] **Step 2: Extract messages**

```bash
npx ng extract-i18n --output-path src/locale
```
Expected: `src/locale/messages.xlf` created with all `@@`-tagged units.

- [ ] **Step 3: Translate** — copy to `messages.en.xlf`, fill `<target>` for every unit from `js/i18n/locales/en.js`.

- [ ] **Step 4: Build both locales + verify**

```bash
npm run build
```
Expected: `dist/portfolio/browser/index.html` (pt-BR) and `dist/portfolio/browser/en/index.html` exist; the en one has English content and `lang="en"`.

- [ ] **Step 5: Migrate assets + remove old site**

```bash
git rm -r index.html css js en
git mv img src/assets/img   # if not already moved; otherwise copy and rm
```
Fix any asset paths to `assets/img/...`.

- [ ] **Step 6: Commit** → `git commit -m "feat: configure i18n, add English build, remove legacy static site"`

---

## Task 19: GitHub Actions deploy

**Files:**
- Modify: `.github/workflows/pages.yml`

**Interfaces:**
- Produces: workflow that installs deps, builds the localized prerender, and deploys `dist/portfolio/browser` to GitHub Pages.

- [ ] **Step 1: Replace the workflow**

`.github/workflows/pages.yml`:
```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [ main ]
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: "pages"
  cancel-in-progress: false
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist/portfolio/browser }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Add a `.nojekyll`** to `public/` so Pages serves Angular's `_`-prefixed files. Confirm `public/` is copied into `dist/portfolio/browser`.

- [ ] **Step 3: Commit** → `git commit -m "ci: deploy Angular prerender to GitHub Pages"`

---

## Task 20: Final verification

**Files:** none (verification only)

- [ ] **Step 1: Full test suite**

```bash
npm test -- --watch=false
```
Expected: all specs pass.

- [ ] **Step 2: Production build**

```bash
npm run build
```
Expected: success; both locales prerendered.

- [ ] **Step 3: Serve and manual smoke**

```bash
npx http-server dist/portfolio/browser -p 8080
```
Manually verify on `http://localhost:8080/` and `/en/`: theme toggle persists, splash shows once, typing rotator runs, skills tabs + keyboard, project filter + pagination, gallery keyboard nav, contact modal links, back-to-top, language switch skips splash. Confirm meta/hreflang in page source.

- [ ] **Step 4: Lighthouse** — run on the served pages; confirm SEO and a11y scores ≥ the legacy site.

- [ ] **Step 5: Final commit / open PR**

```bash
git commit --allow-empty -m "chore: verify Angular portfolio refactor"
```
Then open a PR from `feat/angular-refactor` to `main`.

---

## Self-Review

**Spec coverage:** All 13 features mapped — splash (T10), theme (T4/T9), hero+rotator (T11), about (T12), skills tabs (T12), projects filter/carousel (T13), experience (T14), about-me collapsible+media (T14), gallery (T15), contact (T15), back-to-top (T16), SEO/hreflang (T17), a11y (across components). Architecture (standalone+signals+SSG+localize), data files (T6), deploy (T19), tests (per-task) all covered.

**Type consistency:** Service/method names used consistently — `ThemeService.theme()/toggle()/init()`, `LocaleService.localePath/otherLocale/assetPath`, `GalleryService.open/next/prev/isOpen/index/total`, pure helpers `nextTypingState`, `nextTabIndex`, `filterProjects/pageSlice/wrapPage`, `buildHreflangs`.

**Note for executor:** Tasks 14↔15 have a forward reference (media grid → GalleryService). Build the minimal `GalleryService` in T14 and complete it in T15, or reorder to create the service first.
