# Editor JSON v1.1 — Design (polish: toolbars por painel + quick wins)

**Data:** 2026-07-14
**Status:** aprovado (brainstorming)
**Branch:** `feat/angular-refactor`
**Base:** Editor JSON v1 (`docs/superpowers/specs/2026-07-13-json-editor-design.md`, commits `ce054997..7ba1c1e4`).

## Objetivo

Polir o Editor JSON v1 (text mode, dois painéis) com melhorias de UX de baixo esforço e reorganizar os botões em **cabeçalhos por painel** (cada ação encostada no editor que opera). Sem novos modos (tree/table) nem JSON Schema — isso segue nas fases futuras.

Escopo decidido no brainstorming:
1. **Toolbars por painel** — Entrada leva ops+query+Abrir+Limpar+indentação; Saída leva Copiar+Baixar.
2. **Erro sublinhado no editor** (CodeMirror lint) além do `linha:col` no status bar.
3. **Persistir entrada + indentação** (localStorage) + botão **Limpar**.
4. **Feedback do Copiar** ("Copiado!"/"Falhou").
5. **Status bar sempre visível** (corrige o fold do v1).
6. **Seletor de indentação** `2 / 4 / Tab`.
7. **Drag & drop de arquivo** na Entrada.
8. **Atalhos** `Ctrl+Enter` = Formatar, `Ctrl+S` = Baixar (`Ctrl+F` busca já existe).
9. **Limpeza:** remover dead selector `.je-metrics` (minor do v1).

## Não-objetivos

- Tree mode, table mode, JSON Schema, compare de 2 documentos, share por URL — fases futuras.
- Transform ao vivo (mantém botão Transformar).
- Web Worker para docs gigantes.

## Arquitetura

Muda o componente `JsonTools` (template/estado/scss) e estende o `CodeEditor` compartilhado com suporte a **diagnostics** (lint). Lógica pura ganha `pos` no erro e passa a receber o indent. Persistência via `StorageService` (já SSR-safe) com chaves em `core/storage-keys.ts`.

### `shared/ui/code-editor/code-editor.ts` — input `diagnostics`

Adicionar:

```ts
export interface EditorDiagnostic { from: number; to: number; message: string; severity: 'error' | 'warning'; }

@Input() diagnostics: EditorDiagnostic[] | null = null;
```

- No `mount()`, quando `search`/`readonly` etc., incluir a extensão de lint: importar `@codemirror/lint` (lazy, dentro do `mount()` browser-only). Usar o campo de estado do lint (`setDiagnostics`) + `lintGutter()`.
- Estratégia: guardar `import('@codemirror/lint')` como `this.lintMod`; ao montar, adicionar `lintMod.lintGutter()` às extensões. Aplicar `diagnostics` iniciais e, em `ngOnChanges` de `diagnostics`, despachar `view.dispatch(this.lintMod.setDiagnostics(view.state, this.mapDiagnostics()))` (mapear `EditorDiagnostic[]` para o formato do CM: `{from,to,severity,message}`). `null`/`[]` limpa.
- SSR: `diagnostics` só é aplicado no caminho `mount()` (browser). O fallback textarea ignora.
- **Compat:** default `null` → nenhuma extensão de lint adicionada além do gutter neutro; playground não passa `diagnostics`, comportamento inalterado. (Se `lintGutter` sempre presente incomodar o playground visualmente, condicionar a extensão a `this.diagnostics !== null || this.lintEnabled` — decidir no plano; default: só adicionar o gutter quando o consumidor usa diagnostics, via um `@Input() lint = false`.)

**Decisão explícita:** adicionar `@Input() lint = false`. Só quando `lint` é `true` o editor carrega `@codemirror/lint` e habilita gutter+diagnostics. `JsonTools` passa `lint=true` na Entrada. Playground não passa → zero mudança.

### `json.logic.ts` — `pos` no erro + indent tipado

- `JsonError` ganha `pos: number | null` (offset do caractere; `null` quando a mensagem não trouxe posição).
- `validateJson` preenche `pos` (o mesmo número que hoje alimenta `errorToLineCol`; `null` se ausente).
- Introduzir o tipo de indentação e helper:

```ts
export type IndentSetting = 2 | 4 | 'tab';
export function indentValue(setting: IndentSetting): number | string {
  return setting === 'tab' ? '\t' : setting;
}
```

- `formatJson`, `sortJson`, `repairJson`, `transformJson` continuam recebendo `indent: number` — o **componente** passa `indentValue(setting)` (que pode ser `'\t'`). Ajustar as assinaturas para `indent: number | string` (o `JSON.stringify` aceita string de indentação). `minifyJson` inalterado.
- `isIndentSetting(v: unknown): v is IndentSetting` para validar valor restaurado do storage.

### `JsonTools` — template/estado

Novos signals:

```ts
readonly indent = signal<IndentSetting>(2);
readonly copied = signal<'idle' | 'ok' | 'fail'>('idle');
readonly errorDiag = computed<EditorDiagnostic[] | null>(() => {
  const e = this.error();
  if (!e || e.pos === null) return null;
  return [{ from: e.pos, to: e.pos + 1, message: e.message, severity: 'error' }];
});
```

- **Persistência:** injetar `StorageService`. No construtor/init, restaurar `input` de `JSON_EDITOR_INPUT_KEY` e `indent` de `JSON_EDITOR_INDENT_KEY` (validado por `isIndentSetting`). Ao mudar `input`/`indent`, gravar (debounce do input já existe — gravar junto do validate; indent grava no set).
- **Limpar:** `clearAll()` → `input.set('')`, `output.set('')`, `error.set(null)`, `opError.set(null)`, remove a chave do input no storage.
- **Ops** usam `indentValue(this.indent())` no lugar do `2` fixo.
- **Copiar:** `copyOutput()` → `navigator.clipboard.writeText(...)` com `.then(()=>flash('ok')).catch(()=>flash('fail'))`; `flash` seta `copied` e agenda volta a `'idle'` em ~1200ms (timer limpo em `OnDestroy`).
- **Atalhos:** `run` do CodeEditor (Ctrl+Enter) → `doFormat()`. `Ctrl+S`: listener via `Renderer2.listen(document,'keydown',...)` guardado por `isBrowser`, `preventDefault` + `download()`, limpo em `OnDestroy`.
- **Drag & drop:** no wrapper da Entrada, `(dragover)` previne default e `(drop)` lê `dataTransfer.files[0]` com FileReader (guardado SSR), seta `input`. Reusar a mesma leitura do `onUpload`.
- **Entrada** recebe `[lint]="true"` e `[diagnostics]="errorDiag()"`.

### Layout (SCSS) — cabeçalhos por painel + status fixa

- Cada painel: `.je-pane` com um `.je-pane-head` (título + botões da ação) e o `app-code-editor` (`flex:1`).
- **Toolbar da Entrada** (`.je-pane-head`): botões `Formatar/Minificar/Ordenar/Reparar/Validar/Abrir/Limpar`, segmented de indentação `2/4/Tab`, e uma linha com `[query] Transformar`. `flex-wrap`, gap por tokens.
- **Toolbar da Saída:** `Copiar/Baixar`.
- **Status sempre visível:** o host vira coluna flex de altura contida (`height: clamp(520px, calc(100vh - 220px), 1040px)`); `.je-body` `flex: 1; min-height: 0`; `.je-status` fica após o corpo, sempre no viewport. Remove o `.je-metrics` (usar spans sem classe própria ou dar regra — decisão: remover a classe do template).
- Mobile (`<1024px`): painéis empilham, cabeçalhos quebram, splitter oculto (como no v1).
- Segmented de indentação e botões: tokens existentes; sem hex novo. (Feedback do Copiar muda só o rótulo/entonação via `--json-ok`/`--danger`.)

### `core/storage-keys.ts`

```ts
/** localStorage: conteúdo da entrada do Editor JSON. */
export const JSON_EDITOR_INPUT_KEY = 'tools.json-editor.input';
/** localStorage: indentação escolhida no Editor JSON (2 | 4 | tab). */
export const JSON_EDITOR_INDENT_KEY = 'tools.json-editor.indent';
```

## Dependências novas

- `@codemirror/lint@^6` — sublinhado de erro + lint gutter. (Ecossistema CodeMirror, major 6.)

## SSR / segurança

- `@codemirror/lint` importado lazy dentro do `mount()` (browser-only).
- localStorage via `StorageService` (já guardado). Drop/`Ctrl+S`/clipboard atrás de `isPlatformBrowser`. Listener e timers limpos em `OnDestroy`.
- Persistência é local (não sai do navegador). Sem execução de JSON.

## i18n

- Strings novas marcadas com IDs `@@tools.json-editor.*`: `Limpar`, `Copiado!`, `Falhou`, rótulos de indentação (`2`, `4`, `Tab` — os numéricos podem ficar literais; `Tab` marcado), aria do drop-zone (`Solte um arquivo JSON aqui`), aria do segmented de indentação.
- `extract-i18n` na última task do plano; preencher `<target>` em `messages.en.xlf`; verificar paridade nos dois builds.

## Testes

Vitest (TDD para lógica nova):
- `validateJson` retorna `pos` (offset) para JSON inválido com posição; `pos: null` quando ausente; `null` para válido/vazio.
- `indentValue(2|4|'tab')` → `2 | 4 | '\t'`.
- `isIndentSetting` aceita `2/4/'tab'`, rejeita o resto.
- `formatJson`/`sortJson` com indent `'\t'` produzem saída tabulada.
- Componente segue coberto pela lógica + verificação visual (sem spec de componente nova exigida).

O `CodeEditor` promovido mantém specs atuais passando; adicionar, se viável no path server, um teste de que `lint`/`diagnostics` default (`false`/`null`) não altera o fallback.

## Design tokens

Reusar tokens existentes (`--json-ok`, `--danger`, `--space-*`, `--accent`, `--border`, `--muted`, `--code-*`). Sem hex novo em SCSS de componente.

## Critério de aceite (v1.1)

- Botões em cabeçalhos por painel (Entrada: ops+query+Abrir+Limpar+indentação; Saída: Copiar/Baixar).
- JSON inválido: ponto do erro **sublinhado** no editor + marcador no gutter, além do `linha:col`.
- Entrada e indentação **persistem** no refresh; **Limpar** zera.
- **Copiar** dá feedback visível.
- **Status bar visível** sem rolar (desktop e mobile).
- Indentação `2/4/Tab` aplica em Format/Sort/Repair/Transform.
- **Drag & drop** de arquivo na Entrada carrega o conteúdo.
- `Ctrl+Enter` formata; `Ctrl+S` baixa.
- Gates: `lint` 0 erros, `test:ci` verde, `build` 2 locales; paridade i18n; SSR-safe; playground inalterado.
