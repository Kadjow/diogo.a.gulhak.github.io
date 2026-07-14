# Editor JSON — Design (v1: text mode two-pane)

**Data:** 2026-07-13
**Status:** aprovado (brainstorming)
**Branch:** `feat/angular-refactor`

## Objetivo

Elevar a ferramenta `json-tools` (hoje: 2 textareas + Formatar/Minificar) para um **Editor JSON** inspirado em [jsoneditoronline.org](https://jsoneditoronline.org/), com foco em **código visível e bastante espaço**. Esta é a **v1 = text mode** com layout de dois painéis entrada→saída. Modos `tree`/`table`, validação por JSON Schema e comparação de 2 documentos ficam para fases futuras (specs próprias).

Escopo decidido no brainstorming:
- **Text mode caprichado** (não tree/table).
- **Dois painéis** entrada→saída (não editor único in-place).
- **Transform/JMESPath incluído** no v1. **JSON Schema NÃO** (fase futura).

## Não-objetivos (v1)

- Modo árvore (tree) interativo, modo tabela (table).
- Validação por JSON Schema.
- Comparação/diff de dois documentos independentes.
- Persistência (hash/URL/arquivo salvo além de upload/download pontual).

## Arquitetura

**Abordagem A (aprovada):** promover o componente CodeMirror do playground para `shared/` e estendê-lo para JSON; `json-tools` consome duas instâncias; toda a lógica de dados fica em funções puras testáveis; Transform via dependência `jmespath`; Repair via `jsonrepair`.

### Promoção do editor para `shared/ui/code-editor/`

Mover `src/app/features/tools/playground/editor/code-editor.{ts,scss}` para `src/app/shared/ui/code-editor/code-editor.{ts,scss}`.

Estender a API pública:

```ts
export type EditorLanguage = 'html' | 'css' | 'javascript' | 'json';

@Input() value = '';
@Input() language: EditorLanguage = 'html';
@Input() ariaLabel = '';
@Input() readonly = false;   // NOVO: painel de saída
@Input() search = false;     // NOVO: habilita @codemirror/search (Ctrl+F)
@Output() valueChange = new EventEmitter<string>();
@Output() run = new EventEmitter<void>();
```

- `loadLanguage()` ganha o ramo `json` → lazy `import('@codemirror/lang-json')` → `json()`.
- `readonly`: quando `true`, adiciona `EditorState.readOnly.of(true)` + `EditorView.editable.of(false)` às extensões; o textarea de fallback SSR recebe `readonly`.
- `search`: quando `true`, adiciona lazy `import('@codemirror/search')` (`search()`, `searchKeymap` via `keymap.of`). Mantém `Mod-Enter` → `run`.
- **Regra crítica de compat:** nenhuma mudança de contrato para os consumidores atuais (playground). Defaults preservam o comportamento existente (`readonly=false`, `search=false`, highlight por classes `tok-*` inalterado).
- Atualizar imports do playground para o novo caminho (`playground.ts` e specs que referenciam `editor/code-editor`).

Racional: o playground também herda `search`/`json`/`readonly` sem duplicar ~130 linhas de `mount()`/tema.

### Estrutura de `features/tools/json-tools/`

```
json-tools/
  json-tools.ts        # componente: 2 code-editor, toolbar, status bar, splitter
  json-tools.scss      # layout full-height, toolbar, status bar, splitter — só tokens
  json.logic.ts        # funções puras (estende o arquivo atual)
  json.logic.spec.ts   # testes (estende)
```

### Componente `json-tools.ts`

Estado por **signals**:

```ts
readonly input   = signal('');
readonly output  = signal('');
readonly error   = signal<JsonError | null>(null);   // validação viva da entrada
readonly query   = signal('');                        // JMESPath
readonly split   = signal(0.5);                        // fração da coluna esquerda
readonly opError = signal<string | null>(null);        // erro da última operação/transform
```

Data flow:
- Entrada editável (`code-editor` esquerdo, `language="json"`, `search`) emite `valueChange` → `input.set()`.
- Ao mudar `input`, com **debounce ~150ms**, roda `validateJson(input())` → `error.set(...)`. Status bar reflete.
- Cada operação (Format/Minify/Sort/Repair) lê `input()`, calcula via função pura, escreve `output.set(...)` ou `opError.set(...)`.
- **Validate** não transforma; só força `error` da entrada e foca o status.
- **Transform:** `Run` aplica `transformJson(input(), query())` → `output`/`opError`.
- Saída (`code-editor` direito, `language="json"`, `readonly`, `search`) espelha `output()` (set programático via `ngOnChanges`).
- **Copy** copia `output()`; **Download** salva `output()` como `.json` (Blob + `<a download>`, guardado por `isPlatformBrowser`); **Upload** lê arquivo (`<input type=file>` / FileReader) → `input.set()`.

Splitter: uma barra vertical entre os painéis; `onPointerDown`/`move`/`up` (via `Renderer2.listen`, limpo em `OnDestroy`) atualiza `split` usando a pura `clampSplit()`. Largura das colunas por binding inline (`[style.gridTemplateColumns]`). No mobile (`<1024px`) empilha (grid de 1 coluna, splitter oculto).

### `json.logic.ts` — funções puras

```ts
export interface JsonResult { ok: boolean; output: string; error: string | null; }
export interface JsonError  { message: string; line: number; col: number; }
export interface JsonStats  { bytes: number; lines: number; nodes: number; }

// existentes
export function formatJson(input: string, indent: number): JsonResult;
export function minifyJson(input: string): JsonResult;

// novas
export function sortJson(input: string, indent: number): JsonResult;      // ordena chaves recursivamente (arrays preservam ordem)
export function repairJson(input: string): JsonResult;                    // jsonrepair -> reformatado
export function transformJson(input: string, query: string): JsonResult;  // jmespath.search(parsed, query)
export function validateJson(input: string): JsonError | null;            // null = válido (vazio conta como válido)
export function jsonStats(text: string): JsonStats;                        // bytes, linhas, e nº de nós
export function errorToLineCol(text: string, position: number): { line: number; col: number };
export function clampSplit(fraction: number): number;                     // clamp p/ [0.2, 0.8]
```

Detalhes:
- `sortJson`: recursivo em objetos (chaves `localeCompare` estável), arrays mantêm ordem, escalares intactos; reindenta com `indent`.
- `repairJson`: `jsonrepair(input)` → se ok, `formatJson(reparado, indent)`; se lançar, `{ ok:false, error }`.
- `transformJson`: parseia entrada, roda `jmespath.search`, `JSON.stringify(resultado, null, indent)`. Query vazia → `{ ok:true, output:'' }` (ou espelha entrada — decidir no plano; default: vazio). Erro de query ou parse → `{ ok:false, error }`.
- `validateJson`: `''`/whitespace → `null` (válido). Em erro de `JSON.parse`, extrai `position` da mensagem (V8: `...at position N` / `...at line L column C`) e chama `errorToLineCol`. Se não houver posição, `line:1,col:1`.
- `jsonStats`: `bytes` = `new TextEncoder().encode(text).length`; `lines` = contagem de `\n` + 1; `nodes` = total de valores no JSON parseado (cada objeto, array, e escalar conta; recursivo). Texto inválido → `nodes: 0`.
- `errorToLineCol`: caminha `text` até `position`, contando `\n`.
- `clampSplit`: `Math.min(0.8, Math.max(0.2, fraction))`.

## UX / Layout

Estrutura vertical (full-height, padrão playground):

```
[ tool-shell header compacto: "Editor JSON" + descrição ]
[ toolbar (linha coesa, wrap ordenado) ]
[ corpo grid 2 colunas: Entrada | splitter | Saída ]   <- clamp de altura como playground
[ status bar ]
```

**Toolbar** (grupos, esquerda→direita, `flex-wrap`, gap por tokens):
- Grupo entrada: **Format · Minify · Sort keys · Repair · Validate**
- Grupo transform: input de query **JMESPath** + **Run**
- Grupo IO: **Upload · Copy · Download**
- Busca: `Ctrl+F` dentro do editor focado (sem botão dedicado; atalho nativo do CM).

Visual dos controles: consistente com o playground (mesma linguagem de botão), porém com SCSS próprio do `json-tools` usando os **tokens existentes** (`--space-*`, `--accent`, `--border`, etc.) — sem acoplar o SCSS scoped do playground. (Se no plano ficar evidente duplicação grande, considerar promover `_buttons.scss` a partial compartilhado — fora do escopo por padrão.)

**Status bar** (rodapé, tokens):
- Indicador **válido / inválido** (cor + ícone) da entrada.
- Se inválido: mensagem + `linha:coluna`.
- **Entrada:** bytes · linhas · **nodes** (node count).
- **Saída:** bytes · linhas.

**Splitter:** default 50/50, arrastável entre 20%/80% (`clampSplit`). Mobile empilha e oculta o splitter.

**Reduced motion:** sem animação no splitter; qualquer transição respeita `prefers-reduced-motion`.

## Dependências novas

Todas são lógica ou extensão de editor (não UI pesada — coerente com a regra do projeto):

- `jsonrepair` — Repair (mesmo autor do jsoneditoronline; fidelidade).
- `jmespath` — Transform/query. (Adicionar `@types/jmespath` se necessário para TS strict.)
- `@codemirror/lang-json` — linguagem JSON no editor.
- `@codemirror/search` — busca Ctrl+F.

## SSR / segurança

- Editores browser-only: o `CodeEditor` já cai no fallback textarea fora do browser; `readonly` propaga ao fallback.
- Ops puras rodam em Node (prerender) sem tocar DOM.
- `Upload`/`Download`/splitter usam `document`/`Blob`/`FileReader`/listeners **apenas** sob guarda `isPlatformBrowser` e limpam listeners em `OnDestroy`.
- Sem `innerHTML`/execução do JSON; JSON só é parseado (`JSON.parse`) — nada de `eval`.

## i18n

- Toda string visível marcada: `i18n`/`i18n-aria-label` no template, `$localize` no TS. IDs estáveis `@@tools.json-editor.*`.
- `extract-i18n` **na última task** do plano; preencher `<target>` em `messages.en.xlf`; verificar paridade nos dois builds (`/` pt-BR, `/en/` inglês).
- Mensagens de erro dinâmicas (`error.message`) vêm de `JSON.parse`/libs — não traduzidas; o **prefixo/rótulo** ao redor é `$localize`.

## Testes

Vitest (TDD para lógica nova): `sortJson`, `repairJson`, `transformJson`, `validateJson`, `jsonStats`, `errorToLineCol`, `clampSplit`. Casos: válido/ inválido, aninhamento, arrays, query JMESPath simples e com erro, JSON quebrado reparável e irreparável, posição→linha:coluna, limites do clamp. `.toBe(true)`/`.toBe(false)`, `toEqual` para objetos. Suíte limpa.

O `CodeEditor` promovido mantém seus specs atuais passando (contrato de fallback/mount inalterado); adicionar cobertura mínima do ramo `json`/`readonly` se viável sem browser (nível de função pura `loadLanguage` não é trivialmente testável — cobertura via lint/build).

## Design tokens

Reusar tokens existentes (`--space-*`, `--accent`, `--border`, `--surface`, `--muted`, `--code-*`). Cores novas (se houver, ex. estado válido/ inválido) entram **só** em `_tokens.scss` como `--json-ok`/`--json-err` (light+dark). Sem hex em SCSS de componente.

## Faseamento futuro (fora desta spec)

- **Tree mode** interativo (expand/collapse, editar chave/valor).
- **Table mode.**
- **JSON Schema** validation (dep `ajv`).
- **Compare** de dois documentos.
- Persistência (hash/URL, arquivos multi-snippet).

## Critério de aceite (v1)

- Rota atual do `json-tools` abre o Editor JSON de dois painéis, full-height, editores de código JSON com sintaxe/gutter (tema por token, light+dark).
- Format, Minify, Sort keys, Repair, Validate, Transform (JMESPath), Upload, Copy, Download funcionando.
- Status bar: válido/inválido + `linha:coluna`; entrada bytes/linhas/**nodes**; saída bytes/linhas.
- Splitter arrastável (desktop) e stack no mobile, sem overflow horizontal.
- Gates: `lint` 0 erros, `test:ci` verde (novas puras cobertas), `build` prerender 2 locales; paridade i18n pt/en; SSR-safe.
