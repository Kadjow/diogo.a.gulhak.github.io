import { Component, inject } from '@angular/core';
import { TOOLS, toolsByGroup } from '../../../../data/tools';
import { LocaleService } from '../../../core/locale.service';

@Component({
  selector: 'app-tools-hub',
  standalone: true,
  template: `
    <section class="hub container">
      <header class="hub-head">
        <h1 class="hub-title" i18n="@@tools.hub.title">Ferramentas</h1>
        <p class="hub-sub" i18n="@@tools.hub.sub">Utilitários do dia a dia, direto no navegador.</p>
      </header>

      @for (g of groups; track g.group) {
        <div class="hub-group">
          <div class="hub-grid">
            @for (t of g.items; track t.slug) {
              @if (t.status === 'live') {
                <a class="tool-card" [href]="locale.path('tools/' + t.slug)">
                  <span class="tool-icon" aria-hidden="true">{{ t.icon }}</span>
                  <span class="tool-name">{{ t.name }}</span>
                  <span class="tool-card-desc">{{ t.description }}</span>
                </a>
              } @else {
                <div class="tool-card is-soon" aria-disabled="true">
                  <span class="tool-icon" aria-hidden="true">{{ t.icon }}</span>
                  <span class="tool-name">{{ t.name }}</span>
                  <span class="tool-card-desc">{{ t.description }}</span>
                  <span class="tool-soon" i18n="@@tools.hub.soon">em breve</span>
                </div>
              }
            }
          </div>
        </div>
      }
    </section>
  `,
  styleUrl: './tools-hub.scss',
})
export class ToolsHub {
  locale = inject(LocaleService);
  groups = toolsByGroup(TOOLS);
}
