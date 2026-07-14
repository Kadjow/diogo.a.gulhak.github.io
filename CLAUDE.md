# CLAUDE.md

Guia para o Claude Code atuar neste repositório. Leia antes de qualquer mudança.

## O que é

Portfólio pessoal de **Diogo Arthur Gulhak**, publicado no GitHub Pages como **user page** na raiz do domínio `diogo.a.gulhak.github.io`. Foi reescrito de um site estático (HTML/CSS/JS vanilla) para **Angular 22 SSG**, mantendo **paridade 1:1 de funcionalidades**. O objetivo de longo prazo é evoluir o projeto com novas ferramentas — a arquitetura já está preparada para isso (rotas lazy, design tokens, camadas separadas).

Spec e plano da reescrita:
- `docs/superpowers/specs/2026-06-27-angular-portfolio-refactor-design.md`
- `docs/superpowers/plans/2026-06-27-angular-portfolio-refactor.md`

## Stack

- **Angular 22**, componentes **standalone**, TypeScript strict.
- **Signals** para estado de UI (tema, locale, filtros, galeria, modais).
- **SCSS** com **design tokens** (CSS custom properties).
- **SSG / prerender** via `@angular/ssr` (`outputMode: static`) — sem servidor em runtime.
- **i18n** com `@angular/localize`.
- **Vitest** (`@angular/build:unit-test`, jsdom) como test runner.
- Sem bibliotecas de UI pesadas — componentes próprios.

## Comandos

```bash
npm run build            # build de produção: prerender dos 2 locales -> dist/portfolio/browser (/ e /en/)
npm start                # dev server em http://localhost:4200
npm run test:ci          # roda a suíte Vitest uma vez (headless, sem browser)
npm run lint             # ESLint (angular-eslint) — 0 erros exigido; warnings de padrões a11y intencionais ok
npm run format           # prettier --write em src
npm run format:check     # prettier --check (sem escrever)
```

CI (`pages.yml`) roda `lint` + `test:ci` antes do `build` no push para `main`.

Saída do build: `dist/portfolio/browser/` (pt-BR na raiz) e `dist/portfolio/browser/en/` (inglês).

## Estrutura

```
src/app/
  core/        # serviços singleton: theme, locale, seo, gallery, storage, ui-state
  shared/ui/   # componentes reutilizáveis: modal, section-heading, theme-toggle
  layout/      # header, footer, splash
  features/
    portfolio/ # seções: hero, about, skills, projects, experience, about-me, gallery, contact, back-to-top
                 # portfolio.ts compõe a página; é a rota raiz (lazy)
  app.ts / app.config.ts / app.routes.ts
src/data/      # dados tipados: projects.ts, skills.ts, experience.ts
src/styles/    # _tokens.scss, _typography.scss, _base.scss (importados em styles.scss)
src/locale/    # messages.xlf (fonte pt-BR) + messages.en.xlf (traduções en)
public/        # assets estáticos servidos na raiz (img/, .nojekyll)
```

Novas ferramentas futuras entram como **features lazy** em `src/app/features/`, com sua própria rota — sem tocar no portfólio.

## i18n — regras críticas

- Locales: **pt-BR** (source, em `/`) e **en** (em `/en/`). A estrutura de URL precisa continuar assim.
- **Toda string visível ao usuário** deve ser marcada para tradução: `i18n`/`i18n-aria-label` no template ou `$localize` no TypeScript. Use IDs estáveis `@@namespace.chave`.
- **`$localize` resolve no momento da definição** (build-time). Não guarde uma chave i18n numa propriedade para "traduzir depois" em runtime — isso renderiza a chave crua. Strings dinâmicas (ex: alt de imagem por item) devem ser literais `$localize` na definição dos dados.
- Strings literais dentro de expressões de template (`{{ cond ? 'A' : 'B' }}`) **não são extraídas** — mova para o componente como `$localize`.
- Ao adicionar/alterar texto: rode `npx ng extract-i18n --output-path src/locale`, depois preencha o `<target>` correspondente em `messages.en.xlf` (preserve os targets existentes).
- **Sempre verifique os dois builds** após mexer em texto: confirme que `/en/` mostra inglês e `/` mostra português (`grep` no `dist`).

## Convenções

- **Paridade de conteúdo:** o conteúdo (textos, projetos, experiência, links, contatos) deve bater com o site legado. Nunca invente texto. O histórico git tem as fontes originais (`js/i18n/locales/pt-BR.js`, `js/i18n/locales/en.js`, `index.html` — removidos no commit `50cb294e`, recuperáveis com `git show 50cb294e^:<caminho>`).
- **SSR-safe:** prerender roda em Node. Nunca acesse `window`/`document`/`localStorage` direto sem guarda. Use `isPlatformBrowser(PLATFORM_ID)`, `DOCUMENT` injetado, ou o `StorageService` (que já trata isso).
- **Cleanup:** todo componente com timer (`setTimeout`/`setInterval`) ou listener (`Renderer2.listen`, `addEventListener`) deve implementar `OnDestroy` e limpar. Sem exceção.
- **Estilo só por tokens:** use as CSS custom properties de `_tokens.scss` (`var(--bg)`, `var(--accent)`, etc.). Não chumbe hex/sombras no SCSS dos componentes.
- **Links externos:** `target="_blank"` sempre com `rel="noopener"` (atributo único, sem `rel` duplicado).
- **Lógica testável:** extraia regras puras em funções exportadas (ex: `filterProjects`, `nextTabIndex`, `buildHreflangs`) e teste-as direto, separando da fiação do componente.

## Testes

- Runner é **Vitest**, não Jasmine. Use `.toBe(true)` / `.toBe(false)` — **nunca** `.toBeTrue()` / `.toBeFalse()` (não existem no Vitest).
- TDD para lógica nova: escreva o teste que falha, veja vermelho, implemente, veja verde.
- Saída da suíte deve ficar limpa (sem warnings novos).

## Design / visual

- Paleta **"Branco & Azul-elétrico"**, claro default + dark casado (alterna via atributo `data-theme` no `<html>`).
  - Claro: bg `#FBFBFC`, surface `#F2F4F7`, ink `#0B1220`, accent `#2563EB`, border `#E6E8EC`.
  - Dark: bg `#0A0E1A`, surface `#0F1626`, text `#EAEEF7`, accent `#5B9CFF`, border `#1A2236`.
- Fontes: **Space Grotesk** (display/títulos) + **Inter** (corpo).
- Numeração editorial de seção ("00 — Portfólio", "01 — Sobre"…).
- Toda animação respeita `prefers-reduced-motion: reduce`.
- Para trabalho visual novo, use a skill `frontend-design`.

## Deploy

- GitHub Actions (`.github/workflows/pages.yml`): `npm ci` → `npm run build` → publica `dist/portfolio/browser` no Pages, no push para `main`.
- Versionamento de asset é o hashing nativo do Angular (`outputHashing`). `public/.nojekyll` garante que arquivos `_`-prefixados sejam servidos.

## Fluxo de trabalho

- Para mudanças não-triviais: brainstorming → spec → plano → execução (ver as skills `superpowers:*`). Specs/planos vivem em `docs/superpowers/`.
- Branch de trabalho atual da reescrita: `feat/angular-refactor`. `main` é a base dos PRs.
- Commits/PRs só quando o usuário pedir; se estiver em `main`, criar branch antes.

### Papéis: Opus planeja, Codex executa, QA separado

Divisão de responsabilidade obrigatória em tarefas não-triviais:

1. **Opus (Claude Code) planeja.** Entra em Plan Mode, cria a spec/plano, define escopo, arquivos permitidos/proibidos e critério de aceite. Não codifica direto tarefa grande sem plano aprovado.
2. **Codex executa** como sub-agent. Recebe a tarefa fechada (objetivo, contexto, arquivos, regras, testes, comandos, critério de aceite, quando parar). Só implementa — nunca decide arquitetura, produto ou escopo.
3. **QA = Codex prova + Opus revisa.** O executor não é o dono final do QA — separação de responsabilidade, sem conflito.
   - **Codex anexa prova.** Ao devolver a tarefa, roda e cola a saída dos gates locais deste projeto:
     - `npm run lint` — 0 erros (warnings a11y intencionais ok).
     - `npm run test:ci` — suíte Vitest verde, saída limpa.
     - `npm run build` — prerender dos 2 locales sem falhar.
     - **Paridade i18n:** `grep` no `dist` confirmando `/` em pt-BR e `/en/` em inglês (0 chave crua, 0 target faltando).
     - **SSR-safe:** sem acesso a `window`/`document`/`localStorage` sem guarda.
   - **Opus revisa e decide.** Revisão independente da prova + do diff (usar `/code-review`). Decide merge só com evidência — sem prova anexada = QA não passou, devolve pro Codex. Nunca aceitar "passou" sem a saída dos comandos.

## Armadilhas & lições (aprendidas no hardening)

Coisas que já custaram tempo — não repita:

- **ESLint flat config, plugin de template:** regras `@angular-eslint/template/*` só valem no bloco `files: ['**/*.html']` (que carrega `templateRecommended`/`templateAccessibility`). Colocá-las no bloco `**/*.ts` quebra com `Could not find plugin "@angular-eslint/template"`.
- **`ng test` sem flag = watch mode** e trava a CI. Sempre `test:ci` (`ng test --watch=false`) em pipeline/headless.
- **Corpo de função vazio reprova no lint** (`no-empty-function`). Em mocks de teste use `() => undefined`, não `() => {}`.
- **Ordem do i18n importa:** rode `extract-i18n` **depois** de todas as edições de texto — se rodar no meio, IDs novos ficam de fora e a fonte (`messages.xlf`) fica defasada da tradução (`messages.en.xlf`). Fluxo: editar tudo → extrair → preencher `<target>` no en.xlf → **verificar paridade** (0 faltando, 0 órfão, 0 sem tradução) antes de fechar.
- **2 warnings de a11y de template são intencionais** (`interactive-supports-focus`, `click-events-have-key-events`): tablist com roving-tabindex delega tecla ao container; backdrop do modal fecha por `Escape` global. Ficam como `warn`, não `error` — não "conserte" adicionando handler redundante.
- **Warnings de build pré-existentes são cosméticos** (dados de locale pt-BR caindo em `pt`; import direto de `@angular/localize/init`). Não vêm das suas mudanças — não caçe.
- **Modal `ngOnChanges`:** pule `firstChange` na lógica de foco, senão rouba foco na montagem inicial.
- **Padrão a11y de teclado é reusável:** `shared/a11y/roving-tabindex` (`nextTabIndex`) serve qualquer tablist (skills, projects). Extraia lógica pura pra lá em vez de reimplementar por componente. Acesso a `document.getElementById(...)?.focus()` sempre com guarda SSR (`typeof document !== 'undefined'`).

## Follow-ups conhecidos (não bloqueiam, mas valem)

Resolvidos no hardening pré-features:
- ✅ Focus trap/restore e `aria-modal` no modal (`shared/ui/modal`).
- ✅ `ThemeService` valida o valor do storage antes do cast (`isTheme`).
- ✅ Chave de skip do splash centralizada em `core/storage-keys.ts`.
- ✅ Navegação por teclado nos filtros de Projects (reusa `shared/a11y/roving-tabindex`).
- ✅ `aria-label` em Contact e nas figures de About-me; guarda SSR em `skills`.
- ✅ SEO: `og:image`/`og:url`/`twitter:*`, `public/robots.txt`, `public/sitemap.xml`.
- ✅ Tooling: ESLint, scripts `lint`/`format`/`test:ci`, gate de CI.

Abertos:
- Galeria/modal: revisar `aria-modal` + trap também no overlay de galeria, se houver.
