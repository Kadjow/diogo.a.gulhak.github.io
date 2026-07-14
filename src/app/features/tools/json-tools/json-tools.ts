import { Component, OnDestroy, Renderer2, computed, inject, signal, PLATFORM_ID } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToolShell } from '../../../shared/ui/tool-shell/tool-shell';
import { CodeEditor, EditorDiagnostic } from '../../../shared/ui/code-editor/code-editor';
import { ResizeHandle } from '../../../shared/ui/resizable/resize-handle';
import { resizeStack } from '../../../shared/util/resize';
import { StorageService } from '../../../core/storage.service';
import { JSON_EDITOR_INPUT_KEY, JSON_EDITOR_INDENT_KEY } from '../../../core/storage-keys';
import {
  formatJson, minifyJson, sortJson, repairJson, transformJson,
  validateJson, jsonStats, indentValue, isIndentSetting,
  IndentSetting, JsonResult, JsonError,
} from './json.logic';

@Component({
  selector: 'app-json-tools',
  standalone: true,
  imports: [FormsModule, ToolShell, CodeEditor, ResizeHandle],
  template: `
    <app-tool-shell [title]="titleText" [description]="descText">
      <div class="je-wrap">
        <div class="je-body" [style.gridTemplateColumns]="gridCols()">
          <section class="je-pane">
            <div class="je-pane-head">
              <div class="je-head-row">
                <span class="je-pane-title" i18n="@@tools.json-editor.inputLabel">Entrada</span>
                <button type="button" class="je-btn" (click)="doFormat()" i18n="@@tools.json-editor.format">Formatar</button>
                <button type="button" class="je-btn" (click)="doMinify()" i18n="@@tools.json-editor.minify">Minificar</button>
                <button type="button" class="je-btn" (click)="doSort()" i18n="@@tools.json-editor.sort">Ordenar</button>
                <button type="button" class="je-btn" (click)="doRepair()" i18n="@@tools.json-editor.repair">Reparar</button>
                <button type="button" class="je-btn" (click)="doValidate()" i18n="@@tools.json-editor.validate">Validar</button>
                <label class="je-btn je-upload">
                  <span i18n="@@tools.json-editor.upload">Abrir arquivo</span>
                  <input type="file" accept="application/json,.json,.txt" hidden (change)="onUpload($event)" />
                </label>
                <button type="button" class="je-btn" (click)="clearAll()" i18n="@@tools.json-editor.clear">Limpar</button>
                <div class="je-seg" role="group" [attr.aria-label]="indentAria">
                  <button type="button" [class.is-on]="indent() === 2" (click)="setIndent(2)">2</button>
                  <button type="button" [class.is-on]="indent() === 4" (click)="setIndent(4)">4</button>
                  <button type="button" [class.is-on]="indent() === 'tab'" (click)="setIndent('tab')" i18n="@@tools.json-editor.indentTab">Tab</button>
                </div>
              </div>
              <div class="je-head-row">
                <input
                  class="je-query"
                  [ngModel]="query()"
                  (ngModelChange)="query.set($event)"
                  [attr.placeholder]="queryPlaceholder"
                  [attr.aria-label]="queryLabel" />
                <button type="button" class="je-btn" (click)="doTransform()" i18n="@@tools.json-editor.run">Transformar</button>
              </div>
            </div>
            <div class="je-drop" (dragover)="onDragOver($event)" (drop)="onDrop($event)" [attr.aria-label]="dropAria">
              <app-code-editor
                language="json"
                [value]="input()"
                [search]="true"
                [lint]="true"
                [diagnostics]="errorDiag()"
                [ariaLabel]="inputAria"
                (valueChange)="onInput($event)"
                (run)="doFormat()"></app-code-editor>
            </div>
          </section>

          <app-resize-handle
            axis="x"
            [label]="splitLabel"
            [value]="cols()[0]"
            (resizeBy)="onResize($event)"
            (reset)="resetSplit()"></app-resize-handle>

          <section class="je-pane">
            <div class="je-pane-head">
              <div class="je-head-row">
                <span class="je-pane-title" i18n="@@tools.json-editor.outputLabel">Saída</span>
                <button type="button" class="je-btn" (click)="copyOutput()">{{ copyLabel() }}</button>
                <button type="button" class="je-btn" (click)="download()" i18n="@@tools.json-editor.download">Baixar</button>
              </div>
            </div>
            <app-code-editor
              language="json"
              [value]="output()"
              [readonly]="true"
              [search]="true"
              [ariaLabel]="outputAria"></app-code-editor>
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
          <span>
            <ng-container i18n="@@tools.json-editor.metricsIn">Entrada</ng-container>:
            {{ inStats().bytes }} B · {{ inStats().lines }} <ng-container i18n="@@tools.json-editor.linesUnit">linhas</ng-container>
            · {{ inStats().nodes }} <ng-container i18n="@@tools.json-editor.nodesUnit">nós</ng-container>
          </span>
          <span>
            <ng-container i18n="@@tools.json-editor.metricsOut">Saída</ng-container>:
            {{ outStats().bytes }} B · {{ outStats().lines }} <ng-container i18n="@@tools.json-editor.linesUnit2">linhas</ng-container>
          </span>
        </div>
      </div>
    </app-tool-shell>
  `,
  styleUrl: './json-tools.scss',
})
export class JsonTools implements OnDestroy {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly doc = inject(DOCUMENT);
  private readonly storage = inject(StorageService);
  private readonly renderer = inject(Renderer2);

  readonly input = signal('');
  readonly output = signal('');
  readonly error = signal<JsonError | null>(null);
  readonly opError = signal<string | null>(null);
  readonly query = signal('');
  readonly cols = signal<[number, number]>([0.5, 0.5]);
  readonly indent = signal<IndentSetting>(2);
  readonly copied = signal<'idle' | 'ok' | 'fail'>('idle');

  readonly inStats = computed(() => jsonStats(this.input()));
  readonly outStats = computed(() => jsonStats(this.output()));
  readonly errorDiag = computed<EditorDiagnostic[] | null>(() => {
    const e = this.error();
    if (!e || e.pos === null) return null;
    return [{ from: e.pos, to: e.pos + 1, message: e.message, severity: 'error' }];
  });
  readonly copyLabel = computed(() => {
    const c = this.copied();
    return c === 'ok' ? this.copiedText : c === 'fail' ? this.copyFailText : this.copyText;
  });

  private validateTimer: ReturnType<typeof setTimeout> | null = null;
  private copyTimer: ReturnType<typeof setTimeout> | null = null;
  private unlistenKey?: () => void;

  readonly titleText = $localize`:@@tools.json-editor.name:Editor JSON`;
  readonly descText = $localize`:@@tools.json-editor.desc:Editor de dois painéis: formatar, ordenar, reparar, validar e transformar JSON.`;
  readonly inputAria = $localize`:@@tools.json-editor.inputAria:Editor de entrada JSON`;
  readonly outputAria = $localize`:@@tools.json-editor.outputAria:Resultado JSON (somente leitura)`;
  readonly splitLabel = $localize`:@@tools.json-editor.splitAria:Redimensionar painéis`;
  readonly queryLabel = $localize`:@@tools.json-editor.queryAria:Consulta JMESPath`;
  readonly queryPlaceholder = $localize`:@@tools.json-editor.queryPlaceholder:Consulta JMESPath (ex: people[*].name)`;
  readonly opErrorPrefix = $localize`:@@tools.json-editor.opError:Erro:`;
  readonly indentAria = $localize`:@@tools.json-editor.indentAria:Indentação`;
  readonly dropAria = $localize`:@@tools.json-editor.dropAria:Solte um arquivo JSON aqui`;
  readonly copyText = $localize`:@@tools.json-editor.copy:Copiar saída`;
  readonly copiedText = $localize`:@@tools.json-editor.copied:Copiado!`;
  readonly copyFailText = $localize`:@@tools.json-editor.copyFail:Falhou`;

  constructor() {
    const savedInput = this.storage.getLocal(JSON_EDITOR_INPUT_KEY);
    if (savedInput) {
      this.input.set(savedInput);
      this.error.set(validateJson(savedInput));
    }
    const savedIndent = this.storage.getLocal(JSON_EDITOR_INDENT_KEY);
    const parsed = savedIndent === 'tab' ? 'tab' : Number(savedIndent);
    if (isIndentSetting(parsed)) this.indent.set(parsed);
    if (this.isBrowser) {
      this.unlistenKey = this.renderer.listen('document', 'keydown', (e: KeyboardEvent) => this.onGlobalKey(e));
    }
  }

  gridCols(): string {
    const [a, b] = this.cols();
    return `${a}fr 6px ${b}fr`;
  }

  onInput(value: string): void {
    this.input.set(value);
    if (this.validateTimer) clearTimeout(this.validateTimer);
    this.validateTimer = setTimeout(() => {
      this.error.set(validateJson(this.input()));
      this.storage.setLocal(JSON_EDITOR_INPUT_KEY, this.input());
    }, 150);
  }

  onResize(delta: number): void {
    this.cols.set(resizeStack(this.cols(), 0, delta) as [number, number]);
  }
  resetSplit(): void {
    this.cols.set([0.5, 0.5]);
  }

  setIndent(v: IndentSetting): void {
    this.indent.set(v);
    this.storage.setLocal(JSON_EDITOR_INDENT_KEY, String(v));
  }

  private apply(r: JsonResult): void {
    if (r.ok) { this.output.set(r.output); this.opError.set(null); }
    else { this.opError.set(r.error); }
  }
  doFormat(): void { this.apply(formatJson(this.input(), indentValue(this.indent()))); }
  doMinify(): void { this.apply(minifyJson(this.input())); }
  doSort(): void { this.apply(sortJson(this.input(), indentValue(this.indent()))); }
  doRepair(): void { this.apply(repairJson(this.input(), indentValue(this.indent()))); }
  doTransform(): void { this.apply(transformJson(this.input(), this.query(), indentValue(this.indent()))); }
  doValidate(): void { this.error.set(validateJson(this.input())); }

  clearAll(): void {
    this.input.set('');
    this.output.set('');
    this.error.set(null);
    this.opError.set(null);
    this.storage.setLocal(JSON_EDITOR_INPUT_KEY, '');
  }

  copyOutput(): void {
    if (!this.isBrowser) return;
    navigator.clipboard.writeText(this.output())
      .then(() => this.flashCopy('ok'))
      .catch(() => this.flashCopy('fail'));
  }
  private flashCopy(state: 'ok' | 'fail'): void {
    this.copied.set(state);
    if (this.copyTimer) clearTimeout(this.copyTimer);
    this.copyTimer = setTimeout(() => this.copied.set('idle'), 1200);
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
    if (file) this.loadFile(file);
  }
  onDragOver(e: DragEvent): void { e.preventDefault(); }
  onDrop(e: DragEvent): void {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file) this.loadFile(file);
  }
  private loadFile(file: File): void {
    if (!this.isBrowser) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      this.input.set(text);
      this.error.set(validateJson(text));
      this.storage.setLocal(JSON_EDITOR_INPUT_KEY, text);
    };
    reader.readAsText(file);
  }

  private onGlobalKey(e: KeyboardEvent): void {
    if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
      e.preventDefault();
      this.download();
    }
  }

  ngOnDestroy(): void {
    if (this.validateTimer) clearTimeout(this.validateTimer);
    if (this.copyTimer) clearTimeout(this.copyTimer);
    this.unlistenKey?.();
  }
}
