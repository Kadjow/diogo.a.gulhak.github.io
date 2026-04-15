export type ButtonVariant = "primary" | "secondary" | "ghost";

export type NavItem = {
  label: string;
  href: string;
};

export type ActionLink = {
  label: string;
  href: string;
  external?: boolean;
  variant?: ButtonVariant;
};

export type HeroHighlight = {
  title: string;
  description: string;
};

export type HeroAsideDetail = {
  label: string;
  value: string;
};

export type CaseDetail = {
  label: string;
  value: string;
};

export type ProofItem = {
  title: string;
  description: string;
};

export type CaseStudy = {
  slug: string;
  label: string;
  name: string;
  headline: string;
  context: string;
  details: CaseDetail[];
  highlights: string[];
  stack: string[];
  outcome: string;
  actions: ActionLink[];
};

export type WorkPrinciple = {
  title: string;
  description: string;
};

export type ExperienceItem = {
  role: string;
  company: string;
  period: string;
  summary: string;
};

export type CapabilityGroup = {
  title: string;
  description: string;
  items: string[];
};

export type ContactMethod = {
  label: string;
  value: string;
  description: string;
  href: string;
};

export type HomeContent = {
  metadata: {
    title: string;
    description: string;
  };
  common: {
    skipToContent: string;
  };
  links: {
    email: string;
    whatsapp: string;
    linkedin: string;
    github: string;
  };
  header: {
    brand: string;
    monogram: string;
    statusLabel: string;
    status: string;
    nav: NavItem[];
    cta: ActionLink;
    localeSwitchLabel: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    description: string;
    primaryCta: ActionLink;
    secondaryCta: ActionLink;
    highlights: HeroHighlight[];
    aside: {
      eyebrow: string;
      title: string;
      description: string;
      imageAlt: string;
      details: HeroAsideDetail[];
    };
  };
  proofStrip: {
    eyebrow: string;
    items: ProofItem[];
  };
  cases: {
    eyebrow: string;
    title: string;
    description: string;
    contextLabel: string;
    highlightsLabel: string;
    stackLabel: string;
    outcomeLabel: string;
    items: CaseStudy[];
  };
  approach: {
    eyebrow: string;
    title: string;
    description: string;
    principles: WorkPrinciple[];
    experienceEyebrow: string;
    experienceTitle: string;
    experienceItems: ExperienceItem[];
  };
  capabilities: {
    eyebrow: string;
    title: string;
    description: string;
    groups: CapabilityGroup[];
  };
  finalCta: {
    eyebrow: string;
    title: string;
    description: string;
    primaryCta: ActionLink;
    secondaryCta: ActionLink;
    methods: ContactMethod[];
  };
  footer: {
    name: string;
    role: string;
    description: string;
    navigationLabel: string;
    navigationLinks: ActionLink[];
    connectLabel: string;
    connectLinks: ActionLink[];
    note: string;
  };
};
