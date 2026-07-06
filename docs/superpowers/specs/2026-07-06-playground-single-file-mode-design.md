# Playground — Modo Único vs Separado

**Data:** 2026-07-06
**Autor:** Diogo Gulhak (com Claude Code)
**Status:** Aprovado — pronto para plano de implementação

## Contexto

O `playground` (ver `docs/superpowers/specs/2026-07-05-html-playground-design.md`,
implementado) hoje sempre expõe três editores separados: HTML, CSS e JS. O usuário
quer poder escolher entre esse modo **Separado** e um modo **Único**, onde tudo fica
"chumbado" dentro de um único documento HTML (com `<style>` e `<script>` inline), no
espírito do `realtimehtml.com` clássico. A troca entre modos deve **converter** o
conteúdo nos dois sentidos, para o usuário não perder o que já digitou.

Este spec cobre **apenas** essa funcionalidade de modo. Não mexe em viewport, export,
persistência de snippet (além de guardar o modo), nem no editor CodeMirror.

## Objetivos e critério de sucesso

1. Toggle `Separado | Único` no toolbar do playground (i18n pt-BR + en).
2. Modo **Separado**: comportamento atual (3 editores; tabs no mobile). É o **padrão**.
3. Modo **Único**: um único editor HTML ocupando o lugar dos três; o usuário controla
   o documento inteiro (`<!doctype>`, `<head>`, `<style>`, `<body>`, `<script>`).
4. Troca de modo **converte o conteúdo nos dois sentidos** (bidirecional):
   - Separado → Único: monta um HTML completo com CSS em `<style>` e JS em `<script>`.
   - Único → Separado: extrai `<style>`/`<script>`/corpo de volta para os três painéis
     (best-effort).
5. Console funciona **nos dois modos**: um bootstrap de captura é injetado no documento
   antes de rodar, mesmo quando o usuário controla o `<head>`.
6. O modo escolhido é **persistido** junto do snippet no `localStorage`.
7. Lógica de conversão/injeção é **pura e testável** (Vitest). SSR-safe. Estilo só por
   tokens. Lint 0. Testes verdes. 2 builds (pt/en).

### Fora de escopo

- Parsing "mágico" que reconstrói HTML complexo 100% no split-back (é best-effort).
- `<script src="…">` externo: ignorado no split-back (raro no playground; ver Riscos).
- Pré-processadores, múltiplos snippets, share por URL (já fora de escopo do playground).
- Mudanças em viewport, export (o export já produz um HTML único e continua igual).

## Decisões de design (travadas no brainstorming)

- **Conversão bidirecional** (não buffers independentes, não seed-uma-vez).
- **Console:** injeta o bootstrap sempre, nos dois modos.
- **Padrão:** Separado (mantém o comportamento atual ao abrir).

## Arquitetura

### Estado (componente `Playground`)

- Novo signal `mode = signal<PlaygroundMode>('split')` onde
  `type PlaygroundMode = 'split' | 'single'`.
- Novo signal `single = signal<string>('')` — o documento do modo único.
- Ao trocar de modo, o handler converte e popula o(s) signal(s) de destino antes de
  mudar `mode`.

### Lógica pura (`playground.logic.ts`)

Novas funções exportadas (com testes em `playground.logic.spec.ts`):

- `mergeToSingle(html: string, css: string, js: string): string`
  - Reusa/compartilha a montagem de `buildExportDoc` (documento HTML completo com
    `<style>{css}</style>` no head e `{js}` num `<script>` no fim do body).
- `splitFromSingle(doc: string, parse: DomParse): Snippet`
  - `DomParse` é uma interface mínima injetada (`(html: string) => Document`) para manter
    a função pura e testável sem depender direto de `DOMParser` global.
  - Regras:
    - **CSS** = concatenação (por `\n`) do `textContent` de todos os `<style>`.
    - **JS** = concatenação (por `\n`) do `textContent` de todos os `<script>` **sem**
      atributo `src`.
    - **HTML** = `innerHTML` do `<body>` após remover todos os `<style>`/`<script>`;
      se não houver `<body>`, usa o documento inteiro menos `<style>`/`<script>`.
    - Trim final em cada parte.
- `injectBootstrap(doc: string): string`
  - Insere `<script>{CONSOLE_BOOTSTRAP}</script>` logo após a primeira ocorrência de
    `<head>`; se não houver `<head>`, após `<html>`; se não houver nenhum, prepend no
    início do documento. Retorna o doc pronto para virar `srcdoc`.

### Fluxo do toggle (componente)

- `setMode('single')`: se `mode()==='split'`, `single.set(mergeToSingle(html,css,js))`.
- `setMode('split')`: se `mode()==='single'`, aplica `splitFromSingle(single(), parse)`
  nos signals `html/css/js`. `parse` guardado sob `isBrowser` (usa `DOMParser`).
- Depois seta `mode`, salva (debounced) e roda (respeitando `autoRun`).

### Preview / console

- Modo Separado: `srcdoc = buildSrcdoc(html, css, js)` (igual hoje — já injeta bootstrap).
- Modo Único: `srcdoc = injectBootstrap(single())`.
- `run()` ramifica por `mode()`. Console `postMessage`/`__pg` inalterado.

### Template

- Toolbar: novo grupo `role="group"` com dois botões (`Separado`, `Único`),
  `aria-pressed`/`active` por `mode()`.
- Editores: `@if (mode()==='split')` mostra o bloco atual dos três editores;
  `@else` mostra um único `<app-code-editor language="html">` ligado a `single()`.
- As tabs mobile só aparecem no modo Separado.

### Persistência

- `Snippet` ganha campos opcionais para não quebrar dados salvos antigos:
  `interface StoredState extends Snippet { mode?: PlaygroundMode; single?: string }`.
- `save()` grava `{ html, css, js, single, mode }`.
- `restore()` lê `mode`/`single` se presentes; ausência → `'split'` / `''`.

## Testes

- `mergeToSingle`: contém `<style>{css}</style>`, o html no body e o js num `<script>`;
  ordem correta (css no head, js depois do corpo).
- `splitFromSingle` (com um `parse` fake baseado em `DOMParser` do jsdom):
  - extrai css de múltiplos `<style>`;
  - extrai js só de `<script>` sem `src`;
  - html volta sem as tags `<style>`/`<script>`;
  - round-trip: `splitFromSingle(mergeToSingle(h,c,j))` ≈ `{h,c,j}` (trim).
- `injectBootstrap`: injeta após `<head>`; sem `<head>` injeta após `<html>`; sem ambos
  faz prepend; o `CONSOLE_BOOTSTRAP` aparece antes do fechamento do doc.

## Riscos assumidos

- **Split-back é best-effort.** HTML malformado, comentários fora do body, `<head>` com
  conteúdo não-CSS/JS, ou `<script src>` externo podem não reconstruir 100%. Documentado;
  sem heurística mágica. O caminho Separado→Único→Separado com conteúdo típico do
  playground é estável (coberto por teste de round-trip).
- Injetar o bootstrap num doc que o usuário controla tem risco pequeno de conflito de
  nomes; mitigado por a IIFE do bootstrap já ser encapsulada.

## i18n

Novas chaves (`@@tools.playground.*`): `modeSplit` ("Separado"/"Split"),
`modeSingle` ("Único"/"Single"), `modeGroup` ("Modo do editor"/"Editor mode").
Fluxo padrão: editar → `extract-i18n` → preencher `<target>` en → verificar paridade →
conferir os 2 builds.
