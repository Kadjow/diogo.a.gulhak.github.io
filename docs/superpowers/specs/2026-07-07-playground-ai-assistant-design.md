# Playground — Assistente de IA (Groq, BYO key)

**Data:** 2026-07-07
**Autor:** Diogo Gulhak (com Claude Code)
**Status:** Aprovado — pronto para plano de implementação

## Contexto

O `playground` HTML/CSS/JS (specs de 2026-07-05/06/07, implementados) tem editores,
preview em iframe sandbox e console. O objetivo desta frente é adicionar um **assistente
de IA** que enxerga o que está no playground (código + saída do console) e ajuda o
usuário: explicar código, corrigir erros, tirar dúvidas.

É a primeira frente de um leque maior de melhorias do "HTML Render" (as outras — polish de
UX, features de editor, robustez — ficam como sub-projetos separados, fora deste spec).

## Restrição-chave e decisão

O site é **estático no GitHub Pages, sem backend/runtime**. Não há onde esconder uma
chave de API com segurança. Decisão travada: **BYO key** — cada usuário cola a **própria
chave free da Groq**, guardada só no `localStorage` do device dele; o browser chama a API
da Groq direto. Nenhuma chave nossa vai ao bundle. Provedor: **Groq**.

## Objetivos e critério de sucesso

1. Painel "Assistente" recolhível no playground: campo de chave, lista de mensagens, input.
2. **BYO Groq key**: colar/limpar a chave (localStorage via `StorageService`); aviso de que
   fica só no device; link para criar chave free.
3. Ao enviar, a IA recebe **contexto do playground**: HTML+CSS+JS atuais + últimas ~20
   linhas de console + a mensagem do usuário, sob um system prompt fixo.
4. **Quick actions:** "Explicar código" e "Corrigir erros" (esta prefila com os erros do
   console).
5. Resposta renderizada como **Markdown** (reusa `renderMarkdown` + DOMPurify de
   `markdown-preview`); botão **Copiar** por bloco/mensagem. **Sem auto-aplicar** no editor.
6. Tratamento de erro: 401 (chave inválida), 429 (limite), falha de rede — mensagens claras.
7. Lógica pura e testável (montar request, formatar contexto, parsear resposta/erro) isolada
   da chamada de rede. SSR-safe. Estilo só por tokens. i18n pt-BR + en. Lint 0. Testes
   verdes. 2 builds. `prefers-reduced-motion` respeitado.

### Fora de escopo (follow-ups)

- **Streaming** de resposta (MVP é resposta única).
- **Auto-aplicar** o código sugerido nos editores (MVP: só copiar).
- **Seletor de modelo** (MVP fixa um default).
- **Histórico persistido** de conversa (MVP: memória da sessão do componente).
- Outras frentes do HTML Render (polish de UX, features de editor, robustez) — sub-projetos
  separados.

## Arquitetura

### Camadas

**Lógica pura** — `src/app/features/tools/playground/ai/groq.logic.ts` (+ `.spec.ts`):

- `interface ChatMessage { role: 'system' | 'user' | 'assistant'; content: string }`
- `interface PlaygroundContext { html: string; css: string; js: string; console: string[] }`
- `const GROQ_MODEL = 'llama-3.3-70b-versatile'`
- `const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'`
- `function buildMessages(system: string, ctx: PlaygroundContext, userMsg: string): ChatMessage[]`
  — monta `[{role:'system', content:system}, {role:'user', content:formatContext(ctx)+'\n\n'+userMsg}]`.
  Recebe o texto do system prompt como parâmetro (o `$localize` fica no componente, mantendo
  a função pura e i18n no lugar certo).
- `function formatContext(ctx: PlaygroundContext): string` — serializa código + console num
  bloco de texto enxuto (trunca console às últimas ~20 linhas).
- `function buildRequestBody(messages: ChatMessage[]): unknown` — corpo JSON para a Groq
  (`{ model, messages, temperature }`).
- `function parseResponse(json: unknown): string` — extrai `choices[0].message.content`;
  lança/normaliza erro se ausente.
- `function describeError(status: number): 'invalid-key' | 'rate-limit' | 'server' | 'unknown'`
  — mapeia HTTP status para um código tratável (401→invalid-key, 429→rate-limit, 5xx→server).

**Serviço de rede** — `src/app/features/tools/playground/ai/groq-client.ts`:

- `GroqClient.send(key: string, body: unknown): Promise<string>` — `fetch` para `GROQ_URL`
  com `Authorization: Bearer <key>`; em erro HTTP, usa `describeError` e rejeita com um
  `Error` cujo `message` é o código; em sucesso, retorna `parseResponse(json)`.
- Browser-only: chamado só sob `isPlatformBrowser`. Injetável (mock nos testes de componente,
  se houver; a lógica pura cobre o miolo).

**Chave** — nova constante em `src/app/core/storage-keys.ts`:
`export const GROQ_KEY = 'tools.playground.groqKey';`

**Componente do painel** — `src/app/features/tools/playground/ai/ai-panel.ts` + `.scss`:

- Standalone `AiPanel` (selector `app-ai-panel`). Inputs: `context` (getter/função que o
  playground passa para obter o snapshot atual). Estado interno (signals): `key`,
  `messages` (lista renderizada), `input`, `busy`, `error`.
- Renderiza cada mensagem do assistente com `renderMarkdown` + `sanitizeHtml`
  (import de `../markdown-preview/render.logic`), DOMPurify lazy.
- Config de chave: input + botões salvar/limpar (grava/lê `GROQ_KEY` via `StorageService`).
- Quick actions emitem prompts pré-montados; "Corrigir erros" injeta as linhas de console
  com nível `error`.

### Integração no `Playground`

- `Playground` importa `AiPanel` e o coloca no painel de saída (novo track/aba ou seção
  recolhível abaixo do console — decidido no plano; deve caber no grid resizable existente
  sem quebrar o alinhamento de tracks).
- Passa o contexto atual: `{ html: this.html(), css: this.css(), js: this.js(),
  console: this.consoleLines().map(l => `[${l.level}] ${l.text}`) }`. No modo Único,
  usa `single()` como html e css/js vazios.

### Fluxo de envio

1. Usuário digita (ou clica quick action) → componente monta `PlaygroundContext` do snapshot.
2. `buildMessages(systemLocalized, ctx, userMsg)` → `buildRequestBody` → `GroqClient.send(key, body)`.
3. Resposta → `parseResponse` → push como mensagem `assistant` (Markdown renderizado).
4. Erro → mapeia código (`invalid-key`/`rate-limit`/`server`/`unknown`) para mensagem i18n.

### Segurança

- Chave **só** no `localStorage` do usuário; nunca em código/commits/logs. Campo de chave é
  `type="password"`.
- Chamada direta browser→Groq (BYO). Sem proxy, sem chave compartilhada.
- Resposta da IA passa por `sanitizeHtml` (DOMPurify) antes de ir ao DOM via `[innerHTML]`.
- Links externos (criar chave) com `target="_blank" rel="noopener"`.

## Testes

- `formatContext`: inclui html/css/js; trunca console às últimas 20 linhas; lida com console
  vazio.
- `buildMessages`: ordem system→user; user contém o contexto formatado + a mensagem.
- `buildRequestBody`: tem `model = GROQ_MODEL` e as mensagens.
- `parseResponse`: extrai o content; em JSON sem `choices`, lança erro.
- `describeError`: 401→invalid-key, 429→rate-limit, 500/503→server, outro→unknown.
- (Serviço/componente) fumaça fica na verificação manual; o miolo é a lógica pura.

## Riscos assumidos

- **Chave client-side:** é a chave do próprio usuário, no device dele — modelo BYO padrão de
  ferramentas estáticas. Não é segredo nosso.
- **Qualidade/limite do modelo free:** Groq free tem rate-limit; tratado com mensagem 429.
- **Contexto grande:** código longo pode estourar tokens; MVP trunca console e confia no
  limite do modelo (sem chunking — follow-up se necessário).
- **CORS:** a API da Groq permite chamada browser com `Authorization`; se mudar, exigiria
  proxy (fora do escopo BYO).

## i18n

Chaves novas (`@@tools.playground.ai.*`): título do painel, placeholder da chave, aviso de
armazenamento local, label dos botões (salvar/limpar/enviar/copiar), quick actions
(explicar/corrigir), system prompt, e mensagens de erro (invalid-key/rate-limit/server/
unknown). Fluxo padrão: editar → `extract-i18n` → preencher `<target>` en → paridade → 2 builds.
