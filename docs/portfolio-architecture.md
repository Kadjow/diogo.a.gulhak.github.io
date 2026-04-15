# Arquitetura do novo portfólio

## Direção traduzida da referência

O `21st.dev/home` serviu como referência de composição, não de cópia. A tradução adotada para este portfólio foi:

- homepage modular, com seções bem demarcadas e leitura muito rápida
- densidade informacional controlada por cards
- hierarquia tipográfica forte e objetiva
- CTA claro desde o primeiro bloco
- sensação de sistema visual consistente, com componentes reutilizáveis
- narrativa centrada em competência profissional, não em gimmicks de portfólio

## Estrutura de páginas e seções

O site foi desenhado como uma homepage única com navegação por âncoras:

1. `Hero`
   - headline forte
   - subtítulo profissional
   - CTAs principais
   - card lateral com contexto profissional
2. `Proof Strip`
   - provas rápidas sobre mobile, Angular, CI/CD e arquitetura
3. `Cases`
   - cards com problema, solução, stack, impacto e ações
4. `Experiência / Como eu atuo`
   - princípios de trabalho e experiência selecionada
5. `Capabilities`
   - grupos por contexto de atuação
6. `CTA final`
   - convite para contato com canais diretos

## Arquitetura de pastas

```text
src/
  app/
    globals.css
    layout.tsx
    page.tsx
  components/
    site/
      approach-section.tsx
      capabilities-section.tsx
      case-card.tsx
      cases-section.tsx
      final-cta.tsx
      hero.tsx
      proof-strip.tsx
      section-heading.tsx
      site-footer.tsx
      site-header.tsx
    ui/
      badge.tsx
      button.tsx
      card.tsx
  data/
    portfolio.ts
  lib/
    utils.ts
public/
  images/
    diogo-gulhak.jpg
docs/
  portfolio-architecture.md
```

## Componentes reutilizáveis

- `SiteHeader`: navegação e CTA global
- `SectionHeading`: cabeçalho consistente das seções
- `Hero`: bloco principal com narrativa inicial
- `ProofStrip`: provas rápidas em grid
- `CaseCard`: card de case com alta densidade informacional
- `CasesSection`: composição do grid principal de cases
- `ApproachSection`: princípios de atuação + experiência
- `CapabilitiesSection`: grupos de competências
- `FinalCta`: fechamento comercial
- `Button`, `Badge`, `Card`: primitives visuais no padrão `shadcn/ui`

## Modelo de dados dos cases

Cada case segue uma estrutura orientada à narrativa de conversão:

```ts
type CaseStudy = {
  slug: string
  label: string
  name: string
  headline: string
  problem: string
  solution: string
  stack: string[]
  impact: string
  actions: {
    label: string
    href: string
    external?: boolean
    variant?: "default" | "secondary" | "ghost"
  }[]
}
```

Isso permite manter o conteúdo organizado por dados, evoluir os cards sem duplicação e priorizar só os projetos que reforçam posicionamento profissional.

