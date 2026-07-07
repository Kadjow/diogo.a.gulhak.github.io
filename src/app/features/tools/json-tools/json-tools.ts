import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToolShell } from '../../../shared/ui/tool-shell/tool-shell';
import { formatJson, minifyJson, JsonResult } from './json.logic';

@Component({
  selector: 'app-json-tools',
  standalone: true,
  imports: [FormsModule, ToolShell],
  template: `
    <app-tool-shell [title]="titleText" [description]="descText">
      <label class="field-label" for="json-in" i18n="@@tools.json-tools.inputLabel">Entrada</label>
      <textarea
        id="json-in"
        class="field"
        rows="10"
        [ngModel]="input()"
        (ngModelChange)="input.set($event)"
        [attr.placeholder]="placeholderText"></textarea>

      <div class="actions">
        <button type="button" class="btn" (click)="doFormat()" i18n="@@tools.json-tools.format">Formatar</button>
        <button type="button" class="btn" (click)="doMinify()" i18n="@@tools.json-tools.minify">Minificar</button>
      </div>

      @if (result(); as r) {
        @if (r.ok) {
          <label class="field-label" for="json-out" i18n="@@tools.json-tools.outputLabel">Saída</label>
          <textarea id="json-out" class="field" rows="10" readonly [value]="r.output"></textarea>
        } @else {
          <p class="error" role="alert">{{ errorPrefix }} {{ r.error }}</p>
        }
      }
    </app-tool-shell>
  `,
  styleUrl: './json-tools.scss',
})
export class JsonTools {
  readonly input = signal('');
  readonly result = signal<JsonResult | null>(null);

  readonly titleText = $localize`:@@tools.json-tools.name:Ferramentas JSON`;
  readonly descText = $localize`:@@tools.json-tools.desc:Formatar, minificar e validar JSON.`;
  readonly placeholderText = $localize`:@@tools.json-tools.placeholder:Cole seu JSON aqui…`;
  readonly errorPrefix = $localize`:@@tools.json-tools.errorPrefix:JSON inválido:`;

  doFormat(): void { this.result.set(formatJson(this.input(), 2)); }
  doMinify(): void { this.result.set(minifyJson(this.input())); }
}
