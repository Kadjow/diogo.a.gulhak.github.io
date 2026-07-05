import { Injectable, DOCUMENT, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { LocaleService } from './locale.service';

export interface HreflangEntry {
  rel: 'alternate';
  hreflang: string;
  href: string;
}

const DEFAULT_ORIGIN = 'https://kadjow.github.io';

/** `rootUrl` is the absolute, locale-agnostic site root, e.g. `https://host/sub/`. */
export function buildHreflangs(rootUrl: string): HreflangEntry[] {
  const root = rootUrl.endsWith('/') ? rootUrl : `${rootUrl}/`;
  return [
    { rel: 'alternate', hreflang: 'pt-BR', href: root },
    { rel: 'alternate', hreflang: 'en', href: `${root}en/` },
    { rel: 'alternate', hreflang: 'x-default', href: root },
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
    const url = `${this.origin}${this.locale.localePath(this.locale.locale)}`;
    const image = `${this.origin}${this.locale.assetPath('img/ft_perfil.jpg')}`;
    this.titleSvc.setTitle(seo['title']);
    this.meta.updateTag({ name: 'description', content: seo['description'] });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:title', content: seo['ogTitle'] });
    this.meta.updateTag({ property: 'og:description', content: seo['ogDescription'] });
    this.meta.updateTag({ property: 'og:locale', content: ogLocale });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:image', content: image });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: seo['ogTitle'] });
    this.meta.updateTag({ name: 'twitter:description', content: seo['ogDescription'] });
    this.meta.updateTag({ name: 'twitter:image', content: image });

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
    const rootUrl = `${this.origin}${this.locale.localePath('pt-BR')}`;
    const entries = buildHreflangs(rootUrl);
    entries.forEach(entry => {
      const link = this.doc.createElement('link');
      link.setAttribute('rel', 'alternate');
      link.setAttribute('hreflang', entry.hreflang);
      link.setAttribute('href', entry.href);
      this.doc.head.appendChild(link);
    });
  }
}
