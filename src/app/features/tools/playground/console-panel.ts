import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { ConsoleLine, filterConsoleLines, countByLevel } from './playground.logic';

@Component({
  selector: 'app-console-panel',
  standalone: true,
  template: `
    <div class="console">
      <div class="console-head">
        <span class="console-title" i18n="@@tools.playground.console">Console</span>
        <div class="console-filters" role="group" [attr.aria-label]="filtersLabel">
          @for (level of levels; track level) {
            <button type="button" class="console-filter" [class.active]="active().has(level)"
              [attr.aria-pressed]="active().has(level)" (click)="toggle(level)">
              {{ level }}<span class="console-count">{{ counts[level] }}</span>
            </button>
          }
        </div>
        <button type="button" class="pgc-btn pgc-btn--ghost console-clear" (click)="clear.emit()"
          i18n="@@tools.playground.clear">
          limpar
        </button>
      </div>
      <div class="console-body">
        @for (line of filtered; track $index) {
          <div class="console-line" [class]="'lvl-' + line.level">
            @if (line.time) {
              <span class="console-time">{{ line.time }}</span>
            }{{ line.text }}
          </div>
        } @empty {
          <div class="console-empty" i18n="@@tools.playground.consoleEmpty">Sem saída ainda.</div>
        }
      </div>
    </div>
  `,
  styleUrl: './console-panel.scss',
})
export class ConsolePanel {
  @Input() lines: ConsoleLine[] = [];
  @Output() clear = new EventEmitter<void>();

  readonly levels: ConsoleLine['level'][] = ['log', 'info', 'warn', 'error'];
  readonly active = signal<ReadonlySet<ConsoleLine['level']>>(new Set(this.levels));
  readonly filtersLabel = $localize`:@@tools.playground.consoleFilters:Filtrar por nível`;

  toggle(level: ConsoleLine['level']): void {
    this.active.update(s => {
      const next = new Set(s);
      if (next.has(level)) next.delete(level);
      else next.add(level);
      return next;
    });
  }

  get filtered(): ConsoleLine[] { return filterConsoleLines(this.lines, this.active()); }
  get counts(): Record<ConsoleLine['level'], number> { return countByLevel(this.lines); }
}
