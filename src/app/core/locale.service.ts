import { Injectable, LOCALE_ID, inject } from '@angular/core';

export type AppLocale = 'pt-BR' | 'en';

@Injectable({ providedIn: 'root' })
export class LocaleService {
  private readonly id = inject(LOCALE_ID);
  readonly locale: AppLocale = this.id.toLowerCase().startsWith('en') ? 'en' : 'pt-BR';

  localePath(locale: AppLocale): string {
    return locale === 'en' ? '/en/' : '/';
  }
  otherLocale(): AppLocale {
    return this.locale === 'en' ? 'pt-BR' : 'en';
  }
  assetPath(rel: string): string {
    return `/${rel.replace(/^\/+/, '')}`;
  }
}
