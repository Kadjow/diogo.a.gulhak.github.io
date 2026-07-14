# Playground como Produto — Design / Spec

- **Data:** 2026-07-12
- **Status:** aprovado em brainstorming; pronto para virar plano de implementação
- **Autor do brainstorming:** Opus 4.8
- **Escopo físico:** tudo dentro de `src/app/features/tools/playground/` (mais ajustes pontuais em `shared/ui` e `styles/` quando o design system exigir base reusável)

## 1. Objetivo

Elevar o Playground HTML/CSS/JS de "ferramenta funcional" para **produto exposto** no portfólio, servindo dois alvos com igual peso:

1. **Vitrine de skill** — recrutador/cliente abre e percebe domínio técnico e cuidado de produto na primeira impressão.
2. **Ferramenta real** — dev usa pra testar código rápido, compartilha, volta. Compete em UX com CodePen/JSFiddle no nicho de "rascunho rápido".

Ambos os alvos convergem em: design system coeso, responsividade real, microinterações, features de compartilhamento/persistência e polish de detalhe.

## 2. Constraints inegociáveis

Herdados do `CLAUDE.md` — todo item do plano respeita:

- **100% estático.** GitHub Pages, SSG/prerender, sem servidor runtime. Nenhuma feature pode depender de backend próprio. Persistência/compartilhamento = client-side (URL/hash comprimido) ou API externa com chave BYO (padrão já usado no Groq).
- **SSR-safe.** Prerender roda em Node. Acesso a `window`/`document`/`localStorage` sempre com guarda (`isPlatformBrowser`, `StorageService`, `DOCUMENT`).
- **Estilo só por tokens.** CSS custom properties de `_tokens.scss`. Zero hex/sombra chumbada no SCSS de componente. (Corrigir violações existentes.)
- **i18n paridade pt-BR/en.** Toda string visível marcada (`i18n`/`$localize`, IDs `@@tools.playground.*`). `en.xlf` preenchido e verificado nos dois builds.
- **a11y.** Roles, foco, teclado (segmented controls, tablist com roving-tabindex reusável), `aria-modal`/trap em overlays. Toda animação respeita `prefers-reduced-motion: reduce`.
- **Cleanup.** Todo timer/listener novo limpo em `OnDestroy`.
- **Testável.** Lógica pura extraída e testada em Vitest (`.toBe(true)` — nunca `.toBeTrue()`).

## 3. Estado atual (baseline)

Já existe e funciona:

- Editores CodeMirror (dynamic import) com fallback `<textarea>` SSR/erro.
- Modos **Separado** (HTML/CSS/JS) e **Único** (doc completo), com merge/split.
- Viewports desktop/tablet/mobile; iframe `sandbox="allow-scripts"` (origem opaca).
- Console via `postMessage` (bootstrap injetado no iframe; parent valida `e.source`).
- Resize handles (colunas, output, editores) com layout persistido.
- Auto-run (debounce), Run/Stop, Export HTML, Reset, persistência em `localStorage`.
- Painel de IA Groq (BYO key), markdown renderizado via `marked` + **DOMPurify**.

Dívidas visuais conhecidas: 3 linguagens de botão soltas (`.pg-btn`/`.pg-vp`/`.pg-mode`); `#fff` chumbado em `.pg-preview`/`.pg-frame` (viola tokens, quebra dark); escala de espaçamento ad hoc; emoji como ícone de viewport; labels de editor minúsculos; Auto como checkbox cru.

## 4. Arquitetura & princípios de divisão

- **Design system primeiro.** Uma base de botões/controles/espaçamento reusável antes de qualquer feature — senão cada feature nasce com UI inconsistente.
- **Lógica pura isolada.** Novas capacidades (compartilhar por URL, serialização de snippet, formatação, templates) entram como funções puras testáveis (`playground.logic.ts` ou novos módulos `share.logic.ts`, `snippets.logic.ts`, `format.logic.ts`), separadas da fiação do componente.
- **Features grandes como unidades bem-delimitadas.** Cada uma responde: o que faz, como se usa, do que depende. Ex.: `share` não conhece `templates`; ambos consomem o mesmo `Snippet`.
- **Componente `Playground` não incha.** Quando um bloco cresce (ex.: toolbar, barra de share), vira subcomponente próprio.

## 5. Escopo por fase

Fases ordenadas por dependência. Cada fase é entregável e testável isolada. A fase 0 é base de tudo.

### Fase 0 — Fundação de design system
- Sistema de botões unificado: 3 papéis por token — **primário** (Run, preenchido accent), **secundário** (Stop/Export/Format, outline), **ícone/ghost** (viewports). Mesma altura/raio/padding; hover/focus/disabled consistentes.
- Ícones SVG monoline coesos (substituir emoji 🖥▭▯ e glyphs).
- Escala de espaçamento normalizada (4/8/12/16) substituindo 14/12/10/6/4 ad hoc.
- **Aceite:** um único componente/classe de botão dirige todos os botões do playground; zero emoji de UI; espaçamentos vêm de tokens/escala.

### Fase 1 — Toolbar & controles
- Toolbar com hierarquia: contexto (mode) à esquerda, ações à direita, Run como herói.
- Segmented controls reais para **mode** (Separado|Único) e **viewport**, com roving-tabindex.
- Header de editor: nome da linguagem + ponto de cor por linguagem (HTML/CSS/JS).
- Auto vira toggle switch acessível (não `<input type=checkbox>` cru).
- Reset com confirmação (ação destrutiva).
- **Aceite:** teclado navega os segmented; Run visualmente dominante; Reset pede confirmação.

### Fase 2 — Preview & console
- **Corrigir `#fff` chumbado** → token (`--surface`/dedicado); dark não quebra mais.
- Estados de preview: vazio, carregando, erro de runtime (com linha).
- Console: filtros por nível, contador, timestamps, "limpar" no sistema de botões.
- Indicador de "rodando" + refresh manual.
- Régua de viewport (largura px atual visível).
- Microinterações respeitando `prefers-reduced-motion`.
- **Aceite:** preview correto em light/dark; console filtra e conta; erros de runtime aparecem.

### Fase 3 — Editor (poder)
- **Formatação automática** via Prettier standalone (lazy import), formata todos os editores; sem format-on-run.
- Atalhos visíveis + cheat sheet (Cmd/Ctrl+Enter = Run, etc.).
- Tema do editor casado com dark/light do site.
- Toggle de font-size e wrap.
- **Aceite:** botão Format reindenta HTML/CSS/JS; tema do editor acompanha `data-theme`.

### Fase 4 — Responsividade & layout
- Revisar breakpoints (700/1024) e comportamento tablet.
- Tabs mobile com melhor affordance; revisar resize handles no mobile.
- Modo foco / fullscreen do preview.
- Painel IA vira **drawer lateral à direita em ≥1024px** (toggle na toolbar); abaixo de 1024px permanece empilhado abaixo, colapsado por padrão.
- **Aceite:** utilizável de 320px a desktop largo; foco/fullscreen funciona; IA acessível sem empurrar tudo pra baixo.

### Fase 5 — Compartilhar & persistir (features de produto)
- **Share por URL:** estado comprimido no hash (lz-string). Fallback claro quando exceder limite de URL.
- **Save/Load via GitHub Gist:** BYO token (padrão igual Groq key). Cria/atualiza gist, gera link de share real.
- **Multi-snippet local:** salvar vários, listar, renomear, excluir.
- **Export estendido:** copiar link, download `.html` (já existe) e `.zip`.
- **Embed:** gerar snippet de iframe do playground para colar em outro site.
- **Aceite:** abrir link de share reconstrói o snippet; gist salva/carrega; multi-snippet persiste.

### Fase 6 — Onboarding & templates
- Galeria de templates/starters (vanilla, canvas, fetch demo, animação CSS).
- Dica sutil de primeiro acesso.
- Botão "exemplo aleatório".
- **Aceite:** escolher template carrega código válido; onboarding não atrapalha quem já conhece.

### Fase 7 — Painel de IA
- Alinhar botões ao sistema unificado (Fase 0).
- Ações rápidas: "explica erro do console", "otimiza meu CSS", e **aplicar patch** no editor.
- Streaming da resposta.
- **Aceite:** ações rápidas usam contexto real; aplicar patch edita o snippet; resposta faz streaming.

### Fase 8 — Performance, a11y, SEO + hardening
- Auditar lazy dos pacotes pesados (CodeMirror/Prettier/DOMPurify já são dynamic import — confirmar nenhum vaza pro bundle inicial).
- a11y: foco, roles, `aria-modal` + trap em overlays novos (galeria, fullscreen, share).
- i18n: extrair → preencher `en.xlf` → verificar paridade nos dois builds.
- SEO/OG específico da rota do playground.
- **Hardening de segurança** (itens da auditoria relevantes ao playground — ver §7): CSP `connect-src` para Groq, tratamento da chave.
- **Aceite:** bundle inicial não cresce por libs de ferramenta; paridade i18n 0/0/0; gates de segurança do §7 aplicados.

### Fase 9 — Toques de vitrine
- Screenshot/gravação do preview para compartilhar como imagem.
- Detalhes que mostram cuidado (ex.: contadores sutis).
- Hero/splash da própria ferramenta.
- **Aceite:** screenshot gera imagem do preview; nada disso pesa no caminho crítico.

## 6. Fora de escopo (YAGNI / bloqueado por constraint)

- Qualquer backend próprio, conta de usuário server-side, banco de dados.
- Colaboração em tempo real (precisa de servidor/WebSocket).
- Execução de linguagens além de HTML/CSS/JS (sem transpiler no escopo agora).

## 7. Segurança — itens do checkup que tocam o playground

O checkup completo do projeto (§ auditoria separada) achou postura forte. Itens relevantes a puxar pra Fase 8:

- **CSP:** sem servidor pra header HTTP. **Decisão: adicionar** `<meta http-equiv="Content-Security-Policy">` no `index.html` com `connect-src` limitado a `'self'` + API Groq, mantendo CodeMirror/estilos inline funcionando (`style-src 'unsafe-inline'` necessário; documentar o porquê). Validar nos dois builds antes de fechar.
- **Chave Groq em `localStorage` (texto puro):** BYO e escopada, mas legível por XSS. **Decisão: manter localStorage** (aceito para chave BYO), nunca logar, reforçar o aviso "fica só neste dispositivo". Sem opção de sessão por ora (YAGNI).
- **Sanitização de links da IA:** DOMPurify já bloqueia `javascript:`. **Decisão: adicionar** hook `afterSanitizeAttributes` forçando `target="_blank"` + `rel="noopener"` em `<a>` gerados pela IA/markdown.
- **`npm audit`:** 3 low, todas dev/build (`@babel/core`, `esbuild` via `vite`) — não vão pro bundle de produção. `npm audit fix` (não-breaking) resolve o esbuild; o `@babel/core` exige bump de `@angular/build` (breaking) — avaliar à parte.

## 8. QA & critério de aceite geral

Aplicar a regra de QA do `CLAUDE.md` (Codex prova + Opus revisa) a cada fase:

- `npm run lint` (0 erros), `npm run test:ci` (verde, saída limpa), `npm run build` (2 locales).
- Paridade i18n verificada nos dois builds (0 chave crua, 0 target faltando).
- SSR-safe conferido; cleanup de timers/listeners; tokens-only.
- Nenhuma regressão de a11y/`prefers-reduced-motion`.

## 9. Riscos

- **Escopo grande.** Mitigar com fases entregáveis e independentes; parar e reavaliar após cada fase.
- **Bundle inicial.** Novas libs (lz-string, Prettier, JSZip) devem ser lazy; auditar peso.
- **Limite de URL no share.** Snippets grandes estouram o hash → Gist como caminho alternativo.
- **i18n defasado.** Extrair só no fim de cada fase; preencher en.xlf; verificar paridade antes de fechar.
