import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ConsoleLine } from './playground.logic';

@Component({
  selector: 'app-console-panel',
  standalone: true,
  template: `
    <div class="console">
      <div class="console-head">
        <span class="console-title" i18n="@@tools.playground.console">Console</span>
        <button type="button" class="console-clear" (click)="clear.emit()" i18n="@@tools.playground.clear">
          limpar
        </button>
      </div>
      <div class="console-body">
        @for (line of lines; track $index) {
          <div class="console-line" [class]="'lvl-' + line.level">{{ line.text }}</div>
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
}
