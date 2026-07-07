import { Component, Input, inject } from '@angular/core';
import { LocaleService } from '../../../core/locale.service';

@Component({
  selector: 'app-tool-shell',
  standalone: true,
  template: `
    <section class="tool-shell container">
      <a class="tool-back" [href]="locale.path('tools')" i18n="@@tools.shell.back">← Tools</a>
      <h1 class="tool-title">{{ title }}</h1>
      <p class="tool-desc">{{ description }}</p>
      <div class="tool-body">
        <ng-content />
      </div>
    </section>
  `,
  styleUrl: './tool-shell.scss',
})
export class ToolShell {
  @Input() title = '';
  @Input() description = '';
  locale = inject(LocaleService);
}
