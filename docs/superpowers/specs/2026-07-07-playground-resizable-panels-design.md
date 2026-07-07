# Playground — Divisórias Arrastáveis

**Data:** 2026-07-07
**Autor:** Diogo Gulhak (com Claude Code)
**Status:** Aprovado — pronto para plano de implementação

## Contexto

O `playground` (specs de 2026-07-05 e 2026-07-06, implementados) tem layout fixo no
desktop: grid de 2 colunas (editores `1fr` | saída `1.1fr`), com a saída empilhando
toolbar + preview + console. Este é o **sub-projeto 1** de um roadmap de follow-ups que
visa aproximar o playground do `realtimehtml.com`:

1. **Divisórias arrastáveis** ← este spec
2. Importar arquivo
3. Share por URL
4. Múltiplos snippets

O objetivo aqui é permitir o usuário **redimensionar os painéis** arrastando os divisores,
com persistência e acessibilidade de teclado.

## Objetivos e critério de sucesso

1. Três eixos de resize no desktop (≥1024px), via um **único primitivo reutilizável**:
   - Coluna **editores ↔ saída** (stack horizontal de 2).
   - **Preview ↔ console** (stack vertical de 2).
   - Entre os **3 editores** HTML/CSS/JS no modo Separado (stack vertical de 3).
2. Arrastar com mouse/touch (`pointer` events); `min` por painel para nenhum sumir.
3. **Acessível:** separador `role="separator"`, focável, redimensiona por setas, expõe
   `aria-valuenow/min/max` e `aria-orientation`; duplo-clique reseta ao default.
4. **Persistência:** frações salvas no localStorage junto do snippet; restauradas antes
   do primeiro render.
5. **Responsivo:** abaixo de 1024px os separadores somem (sem drag); layout empilhado/tabs
   atual permanece intacto.
6. Lógica de tamanho é **pura e testável** (Vitest). SSR-safe. Estilo só por tokens.
   Lint 0. Testes verdes. 2 builds (pt/en). Respeita `prefers-reduced-motion`.

### Fora de escopo

- Importar arquivo, share por URL, múltiplos snippets (sub-projetos 2-4).
- Resize no modo Único (um editor só; nada a dividir na coluna esquerda — a coluna
  editores↔saída e preview↔console continuam válidos, mas o stack de 3 editores só
  existe no modo Separado).
- Colapsar/expandir painel por botão (só drag + duplo-clique-reset).
- Layout salvo por-perfil ou por-snippet (é global, uma entrada só).

## Arquitetura

### Primitivo reutilizável

Um mecanismo serve os três casos, evitando três implementações. Duas peças:

**Lógica pura** — `src/app/shared/util/resize.ts` (+ `.spec.ts`):

- `type Sizes = number[]` — frações que somam 1 (uma por painel do stack).
- `function resizeStack(sizes: Sizes, index: number, delta: number, min: number): Sizes`
  - Ajusta o par `(index, index+1)` por `delta` (fração), respeitando `min` em ambos;
    os demais painéis não mudam. Soma total preservada (= 1).
- `function clampFraction(value: number, min: number, max: number): number`
  - Helper de clamp usado pelo `resizeStack` e pelo passo de teclado.
- `const KEY_STEP = 0.02` — passo de fração por tecla de seta.

**Componente/diretiva de resize** — `src/app/shared/ui/resizable/` :

- Um separador renderizado entre painéis adjacentes; ao arrastar/teclar, chama
  `resizeStack` e escreve as frações resultantes em **CSS custom properties** do
  container (grid/flex), evitando reflow manual de cada filho.
- Contrato mínimo (a forma exata — componente com projeção multi-slot vs. diretiva
  `pgResizer` no separador — é decidida no plano; o requisito é: um separador acessível
  que atualiza as frações de um container e é reusado nos 3 pontos).
- Emite a nova lista de frações (para o pai persistir) e aceita frações iniciais.

### Integração no `Playground`

- Container `.pg` (desktop grid de 2 colunas): a largura das colunas vira
  `grid-template-columns: var(--pg-cols-a) var(--pg-cols-b)` (frações → `fr`). Separador
  vertical entre elas.
- Coluna de saída `.pg-output`: `grid-template-rows` com `var(--pg-out-a)`/`--pg-out-b`
  para preview/console; separador horizontal.
- `.pg-editors` (modo Separado): `grid-template-rows` com três frações; dois separadores.
- Sinais novos no componente guardam as frações de cada eixo; handlers repassam ao
  primitivo e chamam `save()` (debounced).

### Persistência

- O objeto salvo no `PLAYGROUND_KEY` ganha um campo opcional:
  `layout?: { cols?: Sizes; out?: Sizes; editors?: Sizes }`.
- `restore()` aplica `layout` se presente e válido (arrays numéricos somando ~1);
  ausência/inválido → defaults. Retrocompatível com snippets antigos.
- **Defaults** (frações): `cols = [0.48, 0.52]` (editores | saída, aproxima o `1fr/1.1fr`
  atual), `out = [0.62, 0.38]` (preview | console), `editors = [0.34, 0.33, 0.33]`
  (HTML | CSS | JS).

### SSR e eventos

- `pointer`/`DOMParser`/`window` só sob `isBrowser`. O primitivo não referencia
  `document` no load; listeners de `pointermove`/`pointerup` são adicionados no
  `pointerdown` e removidos no `pointerup`/`OnDestroy` (sem vazamento).
- Cada stack é independente; o separador chama `stopPropagation` para não disparar
  resize de um stack aninhado no outro.

### Responsivo

- Media query `<1024px`: `.pg-resizer { display: none }` e o grid volta ao empilhamento
  atual; as CSS custom properties de fração são ignoradas (colunas/linhas em `auto`/`1fr`).

## Testes

- `resizeStack`:
  - move fração do par vizinho por `delta`, mantém soma = 1;
  - respeita `min` (não deixa painel abaixo do mínimo, clampa o `delta`);
  - stack de 3: mexer no par (0,1) não altera o painel 2;
  - `delta` negativo funciona (encolhe o da esquerda/topo).
- `clampFraction`: abaixo do min → min; acima do max → max; dentro → inalterado.
- (Componente) fumaça de teclado/pointer fica na verificação manual — a matemática
  testável está no módulo puro.

## Riscos assumidos

- Nesting de stacks (coluna editores contém o stack de 3 editores): mitigado por
  `stopPropagation` no separador e stacks com estado independente.
- Precisão de fração após muitos arrastos: normalização (soma = 1) a cada `resizeStack`
  evita drift acumulado.
- Touch em telas ≥1024px (tablets landscape): suportado por `pointer` events; abaixo de
  1024px desabilitado por design.

## i18n

Chaves novas para os `aria-label` dos separadores (IDs `@@tools.playground.*`):
`resizeCols` ("Redimensionar editores e saída"/"Resize editors and output"),
`resizeOutput` ("Redimensionar preview e console"/"Resize preview and console"),
`resizeEditors` ("Redimensionar editores"/"Resize editors").
Fluxo i18n padrão: editar → `extract-i18n` → preencher `<target>` en → verificar
paridade → conferir os 2 builds.
