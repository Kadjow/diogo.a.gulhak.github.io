# Plataforma de Ferramentas — Design (Levantamento)

**Data:** 2026-07-04
**Autor:** Diogo Gulhak (com Claude Code)
**Status:** Aprovado — pronto para plano de implementação

## Contexto

O site é o portfólio de Diogo Arthur Gulhak, reescrito em Angular 22 SSG (ver
`CLAUDE.md`). A arquitetura já foi preparada para crescer com features lazy. Este
spec define uma **plataforma de ferramentas de uso diário** ("tools") como novo
conjunto de features, sem tocar no portfólio existente.

Este documento é o **levantamento**: descreve a arquitetura da plataforma e o
**catálogo completo** das ferramentas planejadas. A execução é incremental — cada
ferramenta recebe seu próprio ciclo plano → implementação → testes → verificação —
até que todo o catálogo esteja concluído.

Decisões de escopo já tomadas:

- **Ordem geral do projeto maior:** tools primeiro (client-side), migração para
  Vercel + domínio próprio depois (projeto separado, fora deste spec).
- **Client-side apenas:** nenhuma dependência de servidor no MVP. Ferramentas
  pesadas (conversão de imagem) usam WASM carregado sob demanda. Continua rodando
  no GitHub Pages estático até a migração.
- **i18n:** paridade **pt-BR + en**, igual ao portfólio.

### Fora de escopo (deste spec)

- Migração para Vercel e configuração de domínio próprio (projeto seguinte).
- Ferramentas que exijam servidor/serverless (ex.: processamento pesado de PDF no
  backend). Podem voltar ao catálogo após a migração para Vercel.
- Autenticação, persistência remota, contas de usuário.

## Objetivos e critérios de sucesso

1. Um hub `/tools` (e `/en/tools`) que lista as ferramentas disponíveis.
2. Cada ferramenta é uma feature **lazy** isolada, sem acoplamento com o portfólio.
3. Toda string visível é bilíngue (pt-BR + en), verificada nos dois builds.
4. Ferramentas pesadas não entram no bundle inicial (lazy real; budget respeitado).
5. Lógica de cada ferramenta extraída em funções puras testáveis (Vitest/TDD).
6. Padrão de "casca" (`ToolShell`) reusável, para adicionar novas tools com atrito baixo.

## Arquitetura

### Rotas

- `/tools` → `ToolsHub` (lazy): grid de cards a partir do catálogo.
- `/tools/<slug>` → componente da ferramenta (lazy, um por ferramenta).
- Rotas espelham nos dois locales via a infra i18n existente (`/en/tools`,
  `/en/tools/<slug>`).
- O portfólio continua na raiz (`''`), intocado.

`app.routes.ts` ganha as rotas lazy de `tools`. Cada ferramenta importa seu
componente sob demanda (`loadComponent`).

### Estrutura de arquivos

```
src/app/features/tools/
  tools-hub/            # ToolsHub — grid de cards
  <slug>/              # uma pasta por ferramenta (ex.: json-tools/)
    <slug>.ts          # componente (fiação: injeta serviços, estado UI)
    <slug>.logic.ts    # funções puras (ex.: formatJson) — testadas direto
    <slug>.logic.spec.ts
    <slug>.scss
src/app/shared/ui/tool-shell/   # ToolShell — casca comum das tools
src/data/tools.ts               # catálogo tipado (fonte do hub, SEO, sitemap)
```

### Catálogo tipado (`src/data/tools.ts`)

Fonte única de verdade do hub. Cada entrada:

```ts
export interface ToolMeta {
  slug: string;          // 'json-tools'
  name: string;          // $localize — bilíngue
  description: string;   // $localize — bilíngue (card + SEO)
  group: ToolGroup;      // 'dev' | 'media' | 'text'
  icon: string;          // nome/emoji do ícone
  status: 'live' | 'soon'; // controla se o card navega ou fica "em breve"
}
```

O hub lê `TOOLS`, agrupa por `group`, renderiza cards. Cards `soon` aparecem
desabilitados (roadmap visível). `status: 'live'` só quando a ferramenta existe.

> **Nota i18n:** `$localize` resolve em build-time. As strings do catálogo devem
> ser literais `$localize` na definição de `tools.ts` (não guardar chave crua para
> traduzir depois) — mesma regra que já vale para dados do portfólio.

### ToolShell (casca compartilhada)

`shared/ui/tool-shell`: recebe título + descrição + slug, renderiza cabeçalho da
ferramenta (título, descrição, breadcrumb "← Tools") e projeta o conteúdo via
`<ng-content>`. Padroniza layout e navegação de volta ao hub. Estilo só por tokens.

### Navegação / descoberta

- Header ganha um link **"Tools"** (bilíngue, `@@header.tools`), apontando para
  `locale.localePath(...)` + `tools` (base-relativo, respeitando o fix de subpath).
- Footer opcional: link para o hub.

### i18n

- Toda string: `i18n`/`i18n-*` no template ou `$localize` no TS. IDs estáveis
  `@@tools.<slug>.<chave>` e `@@tools.hub.<chave>`.
- Fluxo por ferramenta: editar tudo → `npx ng extract-i18n --output-path src/locale`
  → preencher `<target>` em `messages.en.xlf` → **verificar paridade** (0 faltando,
  0 órfão, 0 sem tradução) → confirmar `/` em pt e `/en/` em inglês no `dist`.

### SSR-safe

- Hub e `ToolShell` pré-renderizam normalmente (só conteúdo estático).
- Ferramentas que usam `File`, `Canvas`, `FileReader`, WebCrypto ou WASM guardam o
  acesso com `isPlatformBrowser(PLATFORM_ID)`; no prerender renderizam um estado
  vazio/placeholder. Nunca acessar `window`/`document` sem guarda.

### Lazy real (bundles pesados)

- WASM de imagem (avif/webp/svg) **não** entra no bundle inicial. Carrega via
  `import()` dinâmico dentro do componente, apenas quando a ferramenta abre.
- Cada ferramenta pesada monitora seu impacto no budget (`initial`
  maximumWarning 500kB / error 1MB — ver `angular.json`). O peso do WASM fica no
  chunk lazy da ferramenta, fora do initial.

## Catálogo completo

Complexidade: **S** (pequena), **M** (média), **L** (grande). Todas client-side.

### Grupo: Dev

| Slug | Faz | IO | Cx |
|---|---|---|---|
| `html-markdown-render` | Editor + preview ao vivo (HTML e Markdown) | texto → preview | S |
| `json-tools` | Format, minify, validar, diff de 2 JSONs | texto → texto | M |
| `base64` | Encode/decode de texto e arquivo | texto/arquivo | S |
| `jwt-decoder` | Decodifica header/payload, mostra `exp` | token → json | S |
| `url-tools` | Encode/decode, parse de querystring | texto | S |
| `regex-tester` | Testa regex, highlight de matches e grupos | regex+texto | M |
| `hash` | md5/sha1/sha256/sha512 (WebCrypto onde possível) | texto → hash | S |
| `diff-text` | Diff lado a lado de dois textos | 2 textos | M |
| `cron-parser` | Explica expressão cron + próximas execuções | cron → texto | M |
| `epoch-converter` | Unix ↔ data humana, timezones | número/data | S |

### Grupo: Imagem / Mídia

| Slug | Faz | IO | Cx |
|---|---|---|---|
| `image-converter` | avif/webp/png/jpg + resize, compress, strip EXIF (WASM) | arquivo → arquivo | L |
| `svg-optimizer` | Minifica SVG (SVGO-wasm) | svg → svg | M |
| `favicon-generator` | Favicons multi-size + manifest a partir de 1 imagem | img → zip | M |
| `qr-generator` | Gera QR de texto/URL, baixa PNG/SVG | texto → img | S |
| `color-tools` | Picker, contraste WCAG, gera paleta, hex/rgb/hsl | cor → cor | M |

### Grupo: Texto / Geradores

| Slug | Faz | IO | Cx |
|---|---|---|---|
| `case-slug` | UPPER/lower/camel/kebab + slugify | texto → texto | S |
| `uuid-generator` | v4 em lote, copiar | — → texto | S |
| `password-generator` | Senha forte configurável + medidor de força | — → texto | S |
| `lorem-ipsum` | Placeholder (palavras/parágrafos) | — → texto | S |
| `word-counter` | Palavras/chars/linhas/tempo de leitura | texto → stats | S |

## Ondas de execução

Cada ferramenta é um ciclo completo (plano → TDD da lógica → componente → i18n →
verificar 2 builds). As ondas apenas ordenam o trabalho.

- **Onda 1 — MVP hub:** infra compartilhada (rotas `tools`, `ToolsHub`,
  `ToolShell`, `src/data/tools.ts`, link "Tools" no header, i18n base) + 3
  ferramentas S para provar o padrão: `html-markdown-render`, `json-tools`, `hash`.
- **Onda 2 — pedidos-chave:** `image-converter` (L, WASM) e `color-tools` (M).
- **Onda 3 — backlog:** demais ferramentas do catálogo, 2–3 por vez.

Reordenar é livre; o catálogo é a lista de pendências até zerar.

## Dependências novas (previstas)

Introduzidas **por onda**, no chunk lazy da ferramenta que as usa (nunca no
initial). Candidatas (a confirmar no plano de cada tool):

- Markdown: `marked` (+ sanitização, ex. `DOMPurify`) para `html-markdown-render`.
- Imagem: `@jsquash/avif`, `@jsquash/webp`, `@jsquash/png`/`jpeg` (WASM) para
  `image-converter`.
- SVG: `svgo` (build WASM/browser) para `svg-optimizer`.
- QR: lib de QR client-side (ex. `qrcode`).
- Hash md5: WebCrypto não faz md5 → lib pequena só para md5; sha* via WebCrypto.

Cada dependência é decidida no plano da ferramenta, não aqui.

## Testes

- **Lógica pura primeiro (TDD):** cada ferramenta expõe suas regras em
  `<slug>.logic.ts` (ex.: `formatJson`, `diffJson`, `convertImageParams`,
  `checkContrast`, `nextCronRuns`, `slugify`) e testa direto com Vitest.
- **Hub/casca:** teste de render do grid e navegação para uma rota de ferramenta.
- Runner Vitest: usar `.toBe(true)` / `.toBe(false)` (nunca `.toBeTrue()`).
- Suíte limpa, sem warnings novos.

## Riscos e mitigações

- **Peso do WASM (image-converter):** mitigar com `import()` dinâmico e loading
  state; medir contra o budget. Se estourar, dividir encoders por formato.
- **Sanitização do HTML render:** preview de HTML arbitrário é vetor de XSS dentro
  da própria página. Renderizar em `iframe sandbox` e/ou sanitizar Markdown com
  DOMPurify. Decidir no plano da ferramenta.
- **Dívida i18n:** rodar `extract-i18n` só ao fim das edições de texto de cada
  ferramenta; verificar paridade antes de fechar a onda.
- **Budget inicial:** confirmar após cada onda que o initial não cresceu (tools são
  lazy; se algo vazar pro initial, investigar o import).

## Definição de pronto (por ferramenta)

1. Lógica pura testada (verde).
2. Componente + `ToolShell`, estilo só por tokens, dark/light ok.
3. Entrada no catálogo com `status: 'live'`.
4. i18n pt-BR + en, paridade verificada nos dois builds.
5. SSR-safe (prerender sem erro).
6. `lint` 0 erros, `test:ci` verde, suíte limpa.
