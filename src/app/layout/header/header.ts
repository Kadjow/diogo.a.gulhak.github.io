import { Component, inject } from '@angular/core';
import { ThemeToggle } from '../../shared/ui/theme-toggle/theme-toggle';
import { LocaleService } from '../../core/locale.service';
import { UiStateService } from '../../core/ui-state.service';
import { StorageService } from '../../core/storage.service';
import { SPLASH_SKIP_KEY } from '../../core/storage-keys';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [ThemeToggle],
  template: `
    <header class="site-header">
      <div class="container header-inner">
        <a [href]="locale.localePath('pt-BR')" class="brand" aria-label="Topo" i18n-aria-label="@@a11y.top">DAG.</a>

        <nav class="header-nav" aria-label="navegação principal" i18n-aria-label="@@a11y.navMain">
          <div class="lang-switch">
            <a
              [href]="locale.localePath('pt-BR')"
              [attr.aria-current]="locale.locale === 'pt-BR' ? 'true' : null"
              [class.active]="locale.locale === 'pt-BR'"
              hreflang="pt-BR"
              (click)="setSplashSkip()">PT</a>
            <span class="lang-sep" aria-hidden="true">·</span>
            <a
              [href]="locale.localePath('en')"
              [attr.aria-current]="locale.locale === 'en' ? 'true' : null"
              [class.active]="locale.locale === 'en'"
              hreflang="en"
              (click)="setSplashSkip()">EN</a>
          </div>

          <app-theme-toggle />

          <button
            type="button"
            class="btn-contact"
            i18n="@@header.contact"
            (click)="ui.contactOpen.set(true)">
            Contact
          </button>
        </nav>
      </div>
    </header>`,
  styleUrl: './header.scss',
})
export class Header {
  locale = inject(LocaleService);
  ui = inject(UiStateService);
  private storage = inject(StorageService);

  setSplashSkip(): void {
    this.storage.setSession(SPLASH_SKIP_KEY, 'locale-switch');
  }
}
