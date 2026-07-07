import { Injectable, LOCALE_ID, DOCUMENT, inject } from '@angular/core';

export type AppLocale = 'pt-BR' | 'en';

/**
 * Derives the deploy root path (locale-agnostic) from the document `<base href>`.
 * The app ships as a GitHub Pages *project page*, so it is served under a
 * subpath (e.g. `/diogo.a.gulhak.github.io/`). The English build sets its base
 * href to `<root>/en/`; strip that trailing locale segment so both locales
 * resolve to the same root. Always returns a path with leading + trailing `/`.
 */
export function deployRootFromBase(baseHref: string | null | undefined): string {
  let path: string;
  try {
    path = new URL(baseHref || '/', 'http://x/').pathname;
  } catch {
    path = '/';
  }
  if (!path.startsWith('/')) path = '/' + path;
  if (!path.endsWith('/')) path += '/';
  // Drop a trailing `en/` locale segment (anchored to a path boundary).
  path = path.replace(/(?:^|\/)en\/$/, '/');
  if (!path.endsWith('/')) path += '/';
  return path;
}

@Injectable({ providedIn: 'root' })
export class LocaleService {
  private readonly id = inject(LOCALE_ID);
  private readonly doc = inject(DOCUMENT);
  readonly locale: AppLocale = this.id.toLowerCase().startsWith('en') ? 'en' : 'pt-BR';
  /** Locale-agnostic deploy root, e.g. `/` in dev or `/diogo.a.gulhak.github.io/` in prod. */
  readonly root = deployRootFromBase(this.doc.querySelector('base')?.getAttribute('href'));

  localePath(locale: AppLocale): string {
    return locale === 'en' ? `${this.root}en/` : this.root;
  }
  otherLocale(): AppLocale {
    return this.locale === 'en' ? 'pt-BR' : 'en';
  }
  assetPath(rel: string): string {
    return `${this.root}${rel.replace(/^\/+/, '')}`;
  }
  path(rel: string): string {
    return `${this.localePath(this.locale)}${rel.replace(/^\/+/, '')}`;
  }
}
