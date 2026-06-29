import { Injectable, DOCUMENT, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { LocaleService } from './locale.service';

export interface HreflangEntry {
  rel: 'alternate';
  hreflang: string;
  href: string;
}

const DEFAULT_ORIGIN = 'https://diogo.a.gulhak.github.io';

export function buildHreflangs(origin: string): HreflangEntry[] {
  return [
    { rel: 'alternate', hreflang: 'pt-BR', href: `${origin}/` },
    { rel: 'alternate', hreflang: 'en', href: `${origin}/en/` },
    { rel: 'alternate', hreflang: 'x-default', href: `${origin}/` },
  ];
}

const SEO_PT: Record<string, string> = {
  title: $localize`Diogo Gulhak - Portfólio`,
  description: $localize`Portfólio de Diogo Arthur Gulhak - Desenvolvedor Mobile (Flutter/React Native). Projetos, skills, experiência e quem sou eu.`,
  ogTitle: $localize`Diogo Gulhak - Portfólio`,
  ogDescription: $localize`Flutter - React Native - Angular - NestJS`,
};

export const NAV_TITLES: Record<string, string> = {
  '#sobre':       $localize`Sobre - Diogo Gulhak`,
  '#skills':      $localize`Skills - Diogo Gulhak`,
  '#projetos':    $localize`Projetos - Diogo Gulhak`,
  '#experiencia': $localize`Experiência - Diogo Gulhak`,
  '#sobre-mim':   $localize`Quem sou eu - Diogo Gulhak`,
};

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly titleSvc = inject(Title);
  private readonly meta = inject(Meta);
  private readonly doc = inject(DOCUMENT);
  private readonly locale = inject(LocaleService);
  private readonly origin: string;

  constructor() {
    this.origin = DEFAULT_ORIGIN;
  }

  applyForLocale(): void {
    const seo = SEO_PT;
    const ogLocale = this.locale.locale === 'en' ? 'en_US' : 'pt_BR';
    this.titleSvc.setTitle(seo['title']);
    this.meta.updateTag({ name: 'description', content: seo['description'] });
    this.meta.updateTag({ property: 'og:title', content: seo['ogTitle'] });
    this.meta.updateTag({ property: 'og:description', content: seo['ogDescription'] });
    this.meta.updateTag({ property: 'og:locale', content: ogLocale });

    this._setCanonical();
    this._setHreflangs();
  }

  setSectionTitle(hash: string): void {
    const title = NAV_TITLES[hash];
    if (title) this.titleSvc.setTitle(title);
  }

  private _setCanonical(): void {
    const path = this.locale.localePath(this.locale.locale);
    const href = `${this.origin}${path}`;
    let link: HTMLLinkElement | null = this.doc.querySelector('link[rel="canonical"]');
    if (!link) {
      link = this.doc.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.doc.head.appendChild(link);
    }
    link.setAttribute('href', href);
  }

  private _setHreflangs(): void {
    // Remove existing hreflang links
    this.doc.querySelectorAll('link[rel="alternate"][hreflang]').forEach(el => el.remove());
    const entries = buildHreflangs(this.origin);
    entries.forEach(entry => {
      const link = this.doc.createElement('link');
      link.setAttribute('rel', 'alternate');
      link.setAttribute('hreflang', entry.hreflang);
      link.setAttribute('href', entry.href);
      this.doc.head.appendChild(link);
    });
  }
}
