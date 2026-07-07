import { Component, inject } from '@angular/core';
import { ThemeService } from '../../../core/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  template: `
    <button type="button" class="theme-switch" role="switch"
            [attr.aria-checked]="theme.theme() === 'dark'"
            aria-label="Alternar tema" i18n-aria-label="@@a11y.themeToggle"
            (click)="theme.toggle()">
      <span class="track" [class.on]="theme.theme() === 'dark'"><span class="thumb"></span></span>
    </button>`,
  styleUrl: './theme-toggle.scss',
})
export class ThemeToggle {
  theme = inject(ThemeService);
}
