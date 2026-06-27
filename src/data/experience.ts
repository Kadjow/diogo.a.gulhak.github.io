export interface ExperienceItem {
  title: string;
  period?: string;
  bullets: string[];
}

export const EXPERIENCE: ExperienceItem[] = [
  {
    title: $localize`:@@xp.atlas.title:Software Engineer (Mobile Flutter) - Atlas`,
    period: $localize`:@@xp.atlas.period:(nov/2024 - atual)`,
    bullets: [
      $localize`:@@xp.atlas.b1:Entrega e publicação de 4 apps na Play Store e App Store, do desenvolvimento à produção.`,
      $localize`:@@xp.atlas.b2:White label / multi-tenant para 3 clientes em uma única base de código.`,
      $localize`:@@xp.atlas.b3:CI/CD com CodeMagic e GitHub Actions, além de arquitetura modular e integrações REST/OAuth.`,
    ],
  },
  {
    title: $localize`:@@xp.slingui.title:Desenvolvedor Web (Angular) - Slingui`,
    period: $localize`:@@xp.slingui.period:(jan/2025 - mar/2026)`,
    bullets: [
      $localize`:@@xp.slingui.b1:Evolução de aplicação SaaS multi-tenant com foco em onboarding, autenticação e navegação.`,
      $localize`:@@xp.slingui.b2:White label dinâmico com temas, logos e design tokens escaláveis.`,
      $localize`:@@xp.slingui.b3:Refatoração de componentes, melhorias de i18n, UX e estabilidade da interface.`,
    ],
  },
  {
    title: $localize`:@@xp.marcondes.title:Gestor de Tráfego - Marcondes Comunicação`,
    period: $localize`:@@xp.marcondes.period:(fev/2024 - ago/2024)`,
    bullets: [
      $localize`:@@xp.marcondes.b1:Google Ads & Meta Ads, GA e testes A/B focados em ROI.`,
      $localize`:@@xp.marcondes.b2:Dashboards e acompanhamento do funil de marketing.`,
    ],
  },
  {
    title: $localize`:@@xp.academic.title:Projetos Acadêmicos`,
    bullets: [
      $localize`:@@xp.academic.b1:Sistema de Vendas (C#, Flutter, API Python): app mobile, estoque em tempo real e dashboard.`,
      $localize`:@@xp.academic.b2:Planejamento de Sistema: requisitos, UML, protótipos e Scrum.`,
    ],
  },
];
