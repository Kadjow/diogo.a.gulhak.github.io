# HTML Playground — Design

**Data:** 2026-07-05
**Autor:** Diogo Gulhak (com Claude Code)
**Status:** Aprovado — pronto para plano de implementação

## Contexto

A plataforma de ferramentas (ver `docs/superpowers/specs/2026-07-04-tools-platform-design.md`,
Onda 1 concluída) tem hoje uma tool `html-markdown-render` que faz preview de
Markdown **e** de HTML via `[innerHTML]` sanitizado. O usuário usa esse tipo de
ferramenta no dia a dia e quer evoluí-la para um **playground real HTML + CSS + JS**
com preview ao vivo, no espírito de `realtimehtml.com`, mas com melhorias de UI/UX,
console estilo DevTools, troca de viewport (Desktop/Tablet/Mobile) e responsividade
total.

Este spec cobre **apenas o playground** (sub-projeto B). O redesign de identidade/UX
da plataforma (sub-projeto A) e o clone do `color.review` são projetos separados,
fora deste spec (ver "Backlog relacionado").

## Objetivos e critério de sucesso

1. Tool `playground`: editores HTML, CSS e JS com preview ao vivo executando JS real.
2. Execução isolada e segura (iframe `sandbox="allow-scripts"`, sem `allow-same-origin`).
3. Console pane capturando `console.*` e erros do código do usuário.
4. Auto-run com debounce + toggle para Run manual (Ctrl+Enter) + Stop.
5. Toggle de viewport do preview: Desktop / Tablet (768) / Mobile (375).
6. Syntax highlighting (CodeMirror 6, lazy) com fallback textarea.
7. Persistência local (localStorage) + Export para `.html` único.
8. Responsivo: desktop com painéis; mobile com editores em tabs, preview/console abaixo.
9. i18n pt-BR + en; SSR-safe; estilo só por tokens; lint 0; testes verdes; 2 builds.
10. O Markdown preview atual é extraído para uma tool própria `markdown-preview`.

### Fora de escopo

- Redesign geral da plataforma / popup informativo por tool / nova identidade visual
  (sub-projeto A, spec separado).
- Clone do `color.review` (`color-tools`, onda futura).
- Divisórias arrastáveis (drag-resize) — follow-up; MVP usa split fixo.
- Múltiplos snippets/abas salvas, compartilhamento por URL, importar de arquivo.
- Pré-processadores (SCSS/TS/JSX), autocomplete, formatação automática.

## Mudanças no catálogo (`src/data/tools.ts`)

- **Remover** `html-markdown-render`.
- **Adicionar** `playground` (grupo `dev`, `status:'live'`, ícone `</>`):
  - name: "Playground HTML/CSS/JS" / en "HTML/CSS/JS Playground"
  - desc: "Editor ao vivo de HTML, CSS e JS com preview e console." / en "Live HTML,
    CSS and JS editor with preview and console."
- **Adicionar** `markdown-preview` (grupo `dev`, `status:'live'`, ícone `📝`):
  - name: "Markdown Preview" / en "Markdown Preview"
  - desc: "Escreva Markdown e veja o preview ao vivo." / en "Write Markdown and see the
    live preview."
- **Atualizar** `color-tools` (mantém `soon`): desc menciona checador de contraste no
  estilo `color.review` (backlog).

Rotas em `app.routes.ts`: remover `tools/html-markdown-render`; adicionar
`tools/playground` e `tools/markdown-preview` (lazy). Pasta antiga
`features/tools/html-markdown-render/` é removida; sua lógica de markdown migra para
`features/tools/markdown-preview/`.

## Arquitetura

### Estrutura de arquivos

```
src/app/features/tools/playground/
  playground.ts                 # componente (fiação, signals, iframe, listeners)
  playground.scss
  playground.logic.ts           # puro: buildSrcdoc, buildExportDoc, formatConsoleArg,
                                 #        CONSOLE_BOOTSTRAP, DEFAULT_SNIPPET, VIEWPORTS
  playground.logic.spec.ts
  editor/
    code-editor.ts              # wrapper CodeMirror 6 lazy + fallback textarea
    code-editor.spec.ts         # (fallback/contract)
  console-panel.ts              # apresentação do console (recebe linhas, emite clear)
src/app/features/tools/markdown-preview/
  markdown-preview.ts           # extraído do antigo html-markdown-render (só markdown)
  markdown-preview.scss
  render.logic.ts               # renderMarkdown + sanitizeHtml (movidos)
  render.logic.spec.ts          # movidos
```

### Estado (signals, no componente `Playground`)

- `html = signal<string>`, `css = signal<string>`, `js = signal<string>`
- `autoRun = signal<boolean>(true)`
- `consoleLines = signal<ConsoleLine[]>([])` onde
  `interface ConsoleLine { level: 'log'|'info'|'warn'|'error'; text: string }`
- `viewport = signal<Viewport>('desktop')` — `type Viewport = 'desktop'|'tablet'|'mobile'`
- `activeTab = signal<'html'|'css'|'js'>('html')` (usado só no layout mobile)

### Lógica pura (`playground.logic.ts`)

- `const CONSOLE_BOOTSTRAP: string` — script injetado no iframe. Faz override de
  `console.log/info/warn/error`, `window.onerror`, `window.onunhandledrejection`;
  serializa argumentos com uma função equivalente a `formatConsoleArg`; envia
  `parent.postMessage({ __pg: true, level, text }, '*')`. Não depende de nada do pai.
- `buildSrcdoc(html: string, css: string, js: string): string` — retorna documento
  HTML completo: `<!doctype html><html><head><meta charset><style>${css}</style></head>
  <body>${html}<script>${CONSOLE_BOOTSTRAP}</script><script>${js}</script></body></html>`.
  A ordem importa: bootstrap **antes** do JS do usuário (para capturar logs desde o
  início). O JS do usuário fica em seu próprio `<script>` para que um erro de parse
  não derrube o bootstrap.
- `buildExportDoc(html, css, js): string` — igual ao `buildSrcdoc` **sem** o
  `CONSOLE_BOOTSTRAP` (arquivo limpo para o usuário levar).
- `formatConsoleArg(value: unknown): string` — serializa para exibição: strings como
  estão; números/booleans via `String()`; `undefined`/`null` literais; `Error` →
  `name: message`; objetos/arrays via `JSON.stringify` com fallback para `String()` em
  referências circulares (try/catch); funções → `ƒ name()`.
- `const VIEWPORTS: Record<Viewport, number | null>` — `desktop: null` (100%),
  `tablet: 768`, `mobile: 375`.
- `const DEFAULT_SNIPPET: { html: string; css: string; js: string }` — exemplo inicial
  simples (um `<h1>`, cor via CSS, um `console.log`).

### Execução e ciclo de vida (`playground.ts`)

- **Montagem do preview:** ao (re)rodar, o componente escreve `buildSrcdoc(...)` no
  atributo `srcdoc` do iframe. Trocar `srcdoc` recria o documento e mata o JS anterior.
- **Auto-run:** um debounce de 300ms (helper puro `debounce` ou reuso) dispara o
  rebuild quando `autoRun()` é `true` e qualquer editor muda. Com `autoRun()` `false`,
  só o botão **Run** (ou `Ctrl+Enter` no editor) reconstrói. **Stop** escreve um
  `srcdoc` vazio (`<!doctype html>`) para encerrar loops.
- **Console:** listener global `message` (via `Renderer2.listen` no `window`),
  registrado só no browser. Aceita a mensagem apenas se
  `event.source === iframe.contentWindow` **e** `event.data?.__pg === true`; então
  faz `consoleLines.update(l => [...l, { level, text }])` (limitado a, ex., 200 linhas).
  Botão limpar zera `consoleLines`.
- **Persistência:** `effect()` (ou no handler de mudança) grava `{html,css,js}` no
  `StorageService` com debounce; no `ngOnInit`/constructor (browser) restaura. Chave em
  `core/storage-keys.ts` (ex.: `PLAYGROUND_KEY = 'tools.playground.snippet'`).
- **Export:** `buildExportDoc` → `Blob(['...'], {type:'text/html'})` → `URL.createObjectURL`
  → `<a download="playground.html">` click → `revokeObjectURL`. Só no browser.
- **Cleanup (`OnDestroy`):** remover o listener de `message`, cancelar o timer de
  debounce, revogar qualquer object URL pendente. (Regra de cleanup do CLAUDE.md.)
- **SSR-safe:** iframe, `postMessage`, `localStorage`, `Blob`/`URL` só sob
  `isPlatformBrowser`. No prerender, renderiza a casca (editores como textarea vazia,
  preview/console vazios).

### Editor (`editor/code-editor.ts`)

- Componente `CodeEditor` (selector `app-code-editor`): inputs `value`, `language`
  (`'html'|'css'|'javascript'`), `ariaLabel`; output `valueChange`.
- No browser, `import()` dinâmico do CodeMirror 6 (`@codemirror/state`,
  `@codemirror/view`, `@codemirror/lang-html|css|javascript`, tema básico) e monta o
  editor num `<div>`. Emite `valueChange` no update. Atalho `Ctrl+Enter` propaga um
  output `run` para o pai.
- **Fallback:** se o `import()` falhar ou não for browser, renderiza um `<textarea>`
  ligado ao mesmo `value`/`valueChange`. A tool funciona sem o CodeMirror.
- Lazy real: CodeMirror **não** entra no bundle inicial — só no chunk de
  `code-editor`, carregado quando o playground abre.
- Tema do editor: cores derivadas dos tokens onde viável; senão, um tema mínimo claro/dark
  casado com `data-theme`.

### Console panel (`console-panel.ts`)

- Componente `ConsolePanel` (selector `app-console-panel`): input `lines: ConsoleLine[]`;
  output `clear`. Apresentação apenas — sem lógica. Cada linha estilizada por `level`
  (log = ink, warn = amarelo-token, error = `--danger`). Área rolável, monospace.

### Layout e responsividade (`playground.scss`)

- **Desktop (≥1024px):** grid 2 colunas. Esquerda: 3 editores empilhados (HTML/CSS/JS)
  com rótulo. Direita: barra do preview (toggle viewport D/T/M + Run/Stop + autoRun +
  Export) → iframe → console colapsável abaixo.
- **Tablet (700–1023px):** editores podem ir para tabs; preview + console abaixo.
- **Mobile (<700px):** editores viram tabs (`activeTab`); abaixo o preview (com toggle
  viewport) e o console colapsável.
- **Viewport toggle:** define a largura do wrapper do iframe conforme `VIEWPORTS`
  (centralizado; `desktop` = 100%). Serve para testar responsividade do código do usuário.
- Estilo 100% por tokens; dark/light; toda transição respeita
  `prefers-reduced-motion: reduce`.

## Dependências novas

- `@codemirror/state`, `@codemirror/view`, `@codemirror/commands`,
  `@codemirror/lang-html`, `@codemirror/lang-css`, `@codemirror/lang-javascript`
  (e o que o basic-setup exigir). Todas carregadas **lazy** dentro de `code-editor`.
  Versões fixadas no plano.

## Segurança

- `sandbox="allow-scripts"` **sem** `allow-same-origin`: o JS do usuário roda em origem
  opaca, sem acesso a cookies, `localStorage` do app, nem ao DOM do pai.
- Sem `allow-same-origin` ⇒ o iframe não pode fazer requisições same-origin ao site.
- Console via `postMessage` só é aceito de `iframe.contentWindow` com marcador `__pg`.
- O app **nunca** executa o código do usuário no seu próprio contexto (sem `eval`, sem
  `[innerHTML]` do código). Isolamento, não sanitização.
- Export é geração local de arquivo; nada trafega para a rede.

## Testes (Vitest / TDD)

- `buildSrcdoc`: contém css em `<style>`, html no body, bootstrap **antes** do js do
  usuário, js em `<script>` separado.
- `buildExportDoc`: contém as 3 partes e **não** contém o `CONSOLE_BOOTSTRAP`.
- `formatConsoleArg`: string, número, boolean, `undefined`, `null`, objeto simples,
  array, `Error`, referência circular (não lança), função.
- `VIEWPORTS`/`DEFAULT_SNIPPET`: invariantes básicas.
- `debounce` (se novo): agrupa chamadas, dispara uma vez após o intervalo.
- `CodeEditor`: contrato de fallback (sem browser/lazy → textarea reflete
  `value`/emite `valueChange`).
- `markdown-preview`: os testes de `renderMarkdown`/`sanitizeHtml` movidos continuam
  verdes na nova pasta.
- Suíte limpa; `.toBe(true)`/`.toBe(false)`.

## Definição de pronto

1. `playground` live: 3 editores CodeMirror lazy (fallback textarea), auto-run+toggle+
   Run/Stop, console DevTools, viewport D/T/M, persistência, export `.html`, responsivo
   mobile+desktop.
2. `markdown-preview` live com a lógica de markdown extraída; `html-markdown-render`
   removido (catálogo, rota, pasta).
3. Lógica pura testada; componentes SSR-safe; cleanup em `OnDestroy`.
4. i18n pt-BR + en, paridade verificada nos 2 builds.
5. Estilo só por tokens; dark/light; `prefers-reduced-motion`.
6. CodeMirror fora do bundle inicial (budget respeitado).
7. `lint` 0 erros, `test:ci` verde, `build` 2 locales.

## Backlog relacionado (não neste spec)

- **Sub-projeto A:** redesign da plataforma, popup informativo por tool, identidade
  visual, responsividade geral do hub.
- **`color-tools` = clone do `color.review`:** checador de contraste WCAG com seleção
  de FG/BG, razão de contraste, AA/AAA para texto normal/grande, sliders e amostra ao
  vivo. Onda futura da plataforma.
- **Playground follow-ups:** divisórias arrastáveis; múltiplos snippets; share por URL;
  pré-processadores.
