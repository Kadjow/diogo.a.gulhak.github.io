import { Component, OnDestroy, computed, inject, signal, PLATFORM_ID } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToolShell } from '../../../shared/ui/tool-shell/tool-shell';
import { CodeEditor } from '../../../shared/ui/code-editor/code-editor';
import { ResizeHandle } from '../../../shared/ui/resizable/resize-handle';
import { resizeStack } from '../../../shared/util/resize';
import {
  formatJson, minifyJson, sortJson, repairJson, transformJson,
  validateJson, jsonStats, JsonResult, JsonError,
} from './json.logic';

@Component({
  selector: 'app-json-tools',
  standalone: true,
  imports: [FormsModule, ToolShell, CodeEditor, ResizeHandle],
  template: `
    <app-tool-shell [title]="titleText" [description]="descText">
      <div class="je-toolbar">
        <div class="je-group">
          <button type="button" class="je-btn" (click)="doFormat()" i18n="@@tools.json-editor.format">Formatar</button>
          <button type="button" class="je-btn" (click)="doMinify()" i18n="@@tools.json-editor.minify">Minificar</button>
          <button type="button" class="je-btn" (click)="doSort()" i18n="@@tools.json-editor.sort">Ordenar</button>
          <button type="button" class="je-btn" (click)="doRepair()" i18n="@@tools.json-editor.repair">Reparar</button>
          <button type="button" class="je-btn" (click)="doValidate()" i18n="@@tools.json-editor.validate">Validar</button>
        </div>

        <div class="je-group">
          <input
            class="je-query"
            [ngModel]="query()"
            (ngModelChange)="query.set($event)"
            [attr.placeholder]="queryPlaceholder"
            [attr.aria-label]="queryLabel" />
          <button type="button" class="je-btn" (click)="doTransform()" i18n="@@tools.json-editor.run">Transformar</button>
        </div>

        <div class="je-group je-io">
          <label class="je-btn je-upload">
            <span i18n="@@tools.json-editor.upload">Abrir arquivo</span>
            <input type="file" accept="application/json,.json,.txt" hidden (change)="onUpload($event)" />
          </label>
          <button type="button" class="je-btn" (click)="copyOutput()" i18n="@@tools.json-editor.copy">Copiar saída</button>
          <button type="button" class="je-btn" (click)="download()" i18n="@@tools.json-editor.download">Baixar</button>
        </div>
      </div>

      <div class="je-body" [style.gridTemplateColumns]="gridCols()">
        <section class="je-pane">
          <p class="je-pane-label" i18n="@@tools.json-editor.inputLabel">Entrada</p>
          <app-code-editor
            language="json"
            [value]="input()"
            [search]="true"
            [ariaLabel]="inputLabel"
            (valueChange)="onInput($event)"></app-code-editor>
        </section>

        <app-resize-handle
          axis="x"
          [label]="splitLabel"
          [value]="cols()[0]"
          (resizeBy)="onResize($event)"
          (reset)="resetSplit()"></app-resize-handle>

        <section class="je-pane">
          <p class="je-pane-label" i18n="@@tools.json-editor.outputLabel">Saída</p>
          <app-code-editor
            language="json"
            [value]="output()"
            [readonly]="true"
            [search]="true"
            [ariaLabel]="outputLabel"></app-code-editor>
        </section>
      </div>

      <div class="je-status" role="status">
        @if (error(); as e) {
          <span class="je-invalid">
            <ng-container i18n="@@tools.json-editor.invalid">JSON inválido</ng-container>
            — <ng-container i18n="@@tools.json-editor.at">linha</ng-container> {{ e.line }}:{{ e.col }}
          </span>
        } @else {
          <span class="je-valid" i18n="@@tools.json-editor.valid">JSON válido</span>
        }
        @if (opError(); as oe) {
          <span class="je-invalid">{{ opErrorPrefix }} {{ oe }}</span>
        }
        <span class="je-metrics">
          <ng-container i18n="@@tools.json-editor.metricsIn">Entrada</ng-container>:
          {{ inStats().bytes }} B · {{ inStats().lines }} <ng-container i18n="@@tools.json-editor.linesUnit">linhas</ng-container>
          · {{ inStats().nodes }} <ng-container i18n="@@tools.json-editor.nodesUnit">nós</ng-container>
        </span>
        <span class="je-metrics">
          <ng-container i18n="@@tools.json-editor.metricsOut">Saída</ng-container>:
          {{ outStats().bytes }} B · {{ outStats().lines }} <ng-container i18n="@@tools.json-editor.linesUnit2">linhas</ng-container>
        </span>
      </div>
    </app-tool-shell>
  `,
  styleUrl: './json-tools.scss',
})
export class JsonTools implements OnDestroy {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly doc = inject(DOCUMENT);

  readonly input = signal('');
  readonly output = signal('');
  readonly error = signal<JsonError | null>(null);
  readonly opError = signal<string | null>(null);
  readonly query = signal('');
  readonly cols = signal<[number, number]>([0.5, 0.5]);

  readonly inStats = computed(() => jsonStats(this.input()));
  readonly outStats = computed(() => jsonStats(this.output()));

  private validateTimer: ReturnType<typeof setTimeout> | null = null;

  readonly titleText = $localize`:@@tools.json-editor.name:Editor JSON`;
  readonly descText = $localize`:@@tools.json-editor.desc:Editor de dois painéis: formatar, ordenar, reparar, validar e transformar JSON.`;
  readonly inputLabel = $localize`:@@tools.json-editor.inputAria:Editor de entrada JSON`;
  readonly outputLabel = $localize`:@@tools.json-editor.outputAria:Resultado JSON (somente leitura)`;
  readonly splitLabel = $localize`:@@tools.json-editor.splitAria:Redimensionar painéis`;
  readonly queryLabel = $localize`:@@tools.json-editor.queryAria:Consulta JMESPath`;
  readonly queryPlaceholder = $localize`:@@tools.json-editor.queryPlaceholder:Consulta JMESPath (ex: people[*].name)`;
  readonly opErrorPrefix = $localize`:@@tools.json-editor.opError:Erro:`;

  gridCols(): string {
    const [a, b] = this.cols();
    return `${a}fr 6px ${b}fr`;
  }

  onInput(value: string): void {
    this.input.set(value);
    if (this.validateTimer) clearTimeout(this.validateTimer);
    this.validateTimer = setTimeout(() => this.error.set(validateJson(this.input())), 150);
  }

  onResize(delta: number): void {
    this.cols.set(resizeStack(this.cols(), 0, delta) as [number, number]);
  }
  resetSplit(): void {
    this.cols.set([0.5, 0.5]);
  }

  private apply(r: JsonResult): void {
    if (r.ok) { this.output.set(r.output); this.opError.set(null); }
    else { this.opError.set(r.error); }
  }
  doFormat(): void { this.apply(formatJson(this.input(), 2)); }
  doMinify(): void { this.apply(minifyJson(this.input())); }
  doSort(): void { this.apply(sortJson(this.input(), 2)); }
  doRepair(): void { this.apply(repairJson(this.input(), 2)); }
  doTransform(): void { this.apply(transformJson(this.input(), this.query(), 2)); }
  doValidate(): void { this.error.set(validateJson(this.input())); }

  copyOutput(): void {
    if (!this.isBrowser) return;
    navigator.clipboard?.writeText(this.output());
  }
  download(): void {
    if (!this.isBrowser) return;
    const blob = new Blob([this.output()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = this.doc.createElement('a');
    a.href = url;
    a.download = 'data.json';
    a.click();
    URL.revokeObjectURL(url);
  }
  onUpload(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file || !this.isBrowser) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.input.set(String(reader.result ?? ''));
      this.error.set(validateJson(this.input()));
    };
    reader.readAsText(file);
  }

  ngOnDestroy(): void {
    if (this.validateTimer) clearTimeout(this.validateTimer);
  }
}
