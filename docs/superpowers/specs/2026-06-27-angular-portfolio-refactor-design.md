# Refactor do Portfólio para Angular — Design

**Data:** 2026-06-27
**Autor:** Diogo Gulhak (com Claude Code)
**Status:** Aprovado para planejamento

## Objetivo

Reescrever o portfólio estático atual (HTML/CSS/JS vanilla, deploy GitHub Pages) em **Angular**, preservando **todas as funcionalidades e conteúdo 1:1**. A única mudança de comportamento permitida é a **estética visual**, que será renovada. A arquitetura deve ficar preparada para evoluir com novas ferramentas no futuro, sem construí-las agora.

## Não-objetivos (YAGNI)

- Não construir nenhuma ferramenta/feature nova além do portfólio.
- Não criar área logada, backend ou autenticação.
- Não mudar o conteúdo textual nem a estrutura de seções.
- Não trocar a hospedagem (continua GitHub Pages).

## Escopo de funcionalidades (paridade 1:1 com o site atual)

Todas portadas com o mesmo comportamento:

1. **Splash screen** na carga, com skip-once ao trocar idioma (via `sessionStorage`).
2. **Theme toggle** dark/light com persistência em `localStorage` e respeito a `prefers-color-scheme`.
3. **Hero** com foto, headline, **typing rotator** de papéis (respeita `prefers-reduced-motion`), bio, CTAs e links sociais.
4. **Sobre** (dois parágrafos).
5. **Skills** em abas (Mobile / Web / Back-end & DB / DevOps) com animação de troca e navegação por teclado (setas/Home/End). Ícones devicon.
6. **Projetos** com filtro por tech (Tudo/Flutter/React Native/Web) e **carrossel paginado** (3 por página, wrap circular, prev/next).
7. **Experiência selecionada** (lista de cards, conteúdo via i18n).
8. **Quem sou eu** colapsável com persistência do estado aberto/fechado; cards (Escotismo / Natureza / Café) + grid de mídia.
9. **Galeria modal** (grupos scout/tech) com navegação por setas, teclado (Esc/←/→), contador e legendas i18n.
10. **Contato modal** (Email / WhatsApp / LinkedIn) com mailto e link de WhatsApp montados via i18n.
11. **Back-to-top** que aparece após scroll.
12. **SEO dinâmico:** title, meta description, og tags, canonical e hreflang (pt-BR / en / x-default) por idioma e por seção navegada.
13. **Acessibilidade:** roles ARIA, `aria-label`/`aria-selected`/`aria-current`, foco gerenciado, `prefers-reduced-motion` em todas as animações.

## Arquitetura

### Stack
- **Angular** (última versão stable), componentes **standalone**, TypeScript em modo strict.
- **Signals** para estado de UI (tema, locale ativo, filtro de projetos, página do carrossel, estado da galeria/modais).
- **SCSS** com **design tokens** via CSS custom properties (tema claro/escuro trocando variáveis no `:root`/`[data-theme]`).
- Sem bibliotecas de UI pesadas — componentes próprios. Animações via Angular Animations + CSS.

### Renderização (SSG)
- Build com **prerendering** (`@angular/ssr` no modo prerender, **sem servidor em runtime**).
- Gera HTML estático por rota e por idioma, servível direto pelo GitHub Pages.
- Meta tags/SEO reais no HTML pré-renderizado (não dependem de JS no cliente).

### i18n
- **`@angular/localize`** (i18n nativo do Angular).
- Dois locales: **pt-BR** (default, na raiz `/`) e **en** (em `/en/`) — mesma estrutura de URLs do site atual.
- Troca de idioma = navegação para a outra rota (mantém o comportamento atual, incluindo o skip-once do splash).
- Mensagens extraídas para arquivos de tradução; build por locale.

### Estrutura de pastas (preparada para crescer)
```
src/app/
  core/        → ThemeService, LocaleService, SeoService, StorageService
  shared/      → componentes UI reutilizáveis (button, modal, tabs, card, toggle…), tokens SCSS
  features/
    portfolio/ → seções: hero, sobre, skills, projetos, experiencia, sobre-mim
                 (cada seção é um componente isolado, testável)
    (futuro)   → novas ferramentas entram aqui como features lazy-loaded
  layout/      → header, footer, splash
src/data/      → projects.ts, experience.ts, skills.ts (tipados)
src/assets/    → imagens (migradas de img/)
```
- **Rotas lazy desde já:** o portfólio é a rota raiz; uma ferramenta futura vira nova rota lazy sem tocar no resto.
- Cada componente de seção tem responsabilidade única, interface clara (inputs/outputs) e é testável isoladamente.

### Dados
- `projects.ts`: porta o array atual (slug, nameKey, descriptionKey, techs, badge, githubUrl, readmeUrl, accentClass) tipado.
- `experience.ts` e `skills.ts`: extraídos para dados tipados em vez de HTML hardcoded.

## Direção visual (a renovação)

Paleta **05 — Branco & Azul-elétrico** (aprovada via mockup), com dark mode casado.

### Tipografia
- **Display:** Space Grotesk (títulos, headline, números de seção, badges).
- **Corpo:** Inter.
- Numeração de seção estilo editorial ("00 — Portfólio", "01 — Sobre"…).

### Cores
**Modo claro (default):**
- Fundo `#FBFBFC`, superfície/card `#F2F4F7`, tinta `#0B1220`, muted `#5B6472`.
- Accent azul-elétrico `#2563EB`. Borda `#E6E8EC`.

**Modo escuro (casado):**
- Fundo `#0A0E1A`, card `#0F1626`, texto `#EAEEF7`, muted `#8B93A7`.
- Accent azul luminoso `#5B9CFF` (brilha sem cansar). Borda `#1A2236` / `#283149`.
- Glow azul sutil no topo do hero.

### Detalhes de estilo
- Sombra-bloco tátil (offset sólido no accent) no avatar/foto.
- Cards de projeto como ficha catalográfica: índice numerado, badge tipográfico, hover com lift sutil.
- Botão primário com glow suave do accent.
- Tudo respeitando `prefers-reduced-motion`.

O refino fino de tokens e componentes usará o plugin **frontend-design** na implementação.

## Deploy

- **GitHub Actions** substitui o workflow atual:
  1. `npm ci`
  2. Build Angular com prerender para os 2 locales (saída: `/` pt-BR, `/en/` en).
  3. Publica o `dist` no GitHub Pages (`upload-pages-artifact` + `deploy-pages`).
- **Asset versioning:** o hashing nativo do Angular (`main.[hash].js`, `styles.[hash].css`) substitui o hack de `sed ?v=sha` do workflow atual.
- Continua sendo user page na raiz do domínio (`diogo.a.gulhak.github.io`).

## Testes

- **Unit (Karma/Jasmine ou Vitest, o padrão do schematic):**
  - ThemeService: toggle, persistência, leitura de preferência do sistema.
  - LocaleService / SeoService: montagem de paths e tags por locale.
  - Projetos: filtro por tech e paginação circular (wrap nas bordas).
  - Galeria: navegação next/prev circular e índice.
- **Componentes:** render das seções, estados de aba ativa, abertura/fechamento de modais, navegação por teclado.
- **Acessibilidade:** asserts de atributos ARIA nos componentes interativos.
- **Smoke de build:** o build de prerender gera `/index.html` e `/en/index.html` com as meta tags corretas.

## Riscos / pontos de atenção

- **Paridade de SEO:** garantir que prerender emite as mesmas meta/hreflang por idioma que o site atual gera via JS.
- **Splash + troca de idioma:** replicar o skip-once entre navegações de locale.
- **Devicon:** mantido via CDN como hoje; avaliar tratamento monocromático no accent para coesão (opcional, não bloqueia).
- **Migração de assets:** imagens de `img/` vão para `src/assets/`; conferir todos os caminhos da galeria.

## Critério de aceite

- Site Angular no ar no GitHub Pages, rotas `/` e `/en/` funcionando.
- Todas as 13 funcionalidades acima presentes e equivalentes ao site atual.
- Visual da paleta 05 (claro + dark) aplicado.
- Lighthouse de SEO/acessibilidade igual ou melhor que o atual.
- Testes passando no CI.
