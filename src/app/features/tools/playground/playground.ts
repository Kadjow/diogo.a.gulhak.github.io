import {
  Component, ElementRef, OnDestroy, OnInit, PLATFORM_ID, Renderer2, ViewChild, computed, inject, signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ToolShell } from '../../../shared/ui/tool-shell/tool-shell';
import { CodeEditor } from './editor/code-editor';
import { ConsolePanel } from './console-panel';
import { AiPanel } from './ai/ai-panel';
import { PlaygroundContext } from './ai/groq.logic';
import { StorageService } from '../../../core/storage.service';
import { PLAYGROUND_KEY } from '../../../core/storage-keys';
import { debounce } from '../../../shared/util/debounce';
import { ResizeHandle } from '../../../shared/ui/resizable/resize-handle';
import { resizeStack, isValidSizes } from '../../../shared/util/resize';
import { nextTabIndex } from '../../../shared/a11y/roving-tabindex';
import {
  buildSrcdoc, buildExportDoc, mergeToSingle, splitFromSingle, injectBootstrap,
  DEFAULT_SNIPPET, VIEWPORTS, Viewport, ConsoleLine, Snippet, PlaygroundMode,
  PlaygroundLayout, DEFAULT_LAYOUT, MODE_OPTIONS, VIEWPORT_OPTIONS,
} from './playground.logic';

type EditorTab = 'html' | 'css' | 'javascript';

@Component({
  selector: 'app-playground',
  standalone: true,
  imports: [ToolShell, CodeEditor, ConsolePanel, AiPanel, ResizeHandle],
  template: `
    <app-tool-shell [title]="titleText" [description]="descText">
      <div class="pg" [style.gridTemplateColumns]="colsStyle()">
        @if (mode() === 'split') {
          <!-- Mobile tabs -->
          <div class="pg-tabs" role="tablist" [attr.aria-label]="tabsLabel">
            <button type="button" role="tab" class="pg-tab" [class.active]="tab() === 'html'"
              [attr.aria-selected]="tab() === 'html'" (click)="tab.set('html')">HTML</button>
            <button type="button" role="tab" class="pg-tab" [class.active]="tab() === 'css'"
              [attr.aria-selected]="tab() === 'css'" (click)="tab.set('css')">CSS</button>
            <button type="button" role="tab" class="pg-tab" [class.active]="tab() === 'javascript'"
              [attr.aria-selected]="tab() === 'javascript'" (click)="tab.set('javascript')">JS</button>
          </div>
          <div class="pg-editors" [style.gridTemplateRows]="editorRowsStyle()">
            <div class="pg-editor" [class.hidden-mobile]="tab() !== 'html'">
              <span class="pg-editor-head">
                <i class="pg-lang-dot pg-lang-dot--html" aria-hidden="true"></i>HTML
              </span>
              <app-code-editor language="html" [value]="html()" [ariaLabel]="'HTML'"
                (valueChange)="onHtml($event)" (run)="run()" />
            </div>
            <app-resize-handle axis="y" [label]="resizeEditorsLabel" [value]="editorRows()[0]"
              (resizeBy)="onResizeEditors(0, $event)" (reset)="resetLayout('editors')" />
            <div class="pg-editor" [class.hidden-mobile]="tab() !== 'css'">
              <span class="pg-editor-head">
                <i class="pg-lang-dot pg-lang-dot--css" aria-hidden="true"></i>CSS
              </span>
              <app-code-editor language="css" [value]="css()" [ariaLabel]="'CSS'"
                (valueChange)="onCss($event)" (run)="run()" />
            </div>
            <app-resize-handle axis="y" [label]="resizeEditorsLabel" [value]="editorRows()[1]"
              (resizeBy)="onResizeEditors(1, $event)" (reset)="resetLayout('editors')" />
            <div class="pg-editor" [class.hidden-mobile]="tab() !== 'javascript'">
              <span class="pg-editor-head">
                <i class="pg-lang-dot pg-lang-dot--js" aria-hidden="true"></i>JS
              </span>
              <app-code-editor language="javascript" [value]="js()" [ariaLabel]="'JavaScript'"
                (valueChange)="onJs($event)" (run)="run()" />
            </div>
          </div>
        } @else {
          <div class="pg-editors">
            <div class="pg-editor">
              <span class="pg-editor-head">
                <i class="pg-lang-dot pg-lang-dot--html" aria-hidden="true"></i>HTML
              </span>
              <app-code-editor language="html" [value]="single()" [ariaLabel]="'HTML'"
                (valueChange)="onSingle($event)" (run)="run()" />
            </div>
          </div>
        }

        <app-resize-handle axis="x" [label]="resizeColsLabel" [value]="cols()[0]"
          (resizeBy)="onResizeCols($event)" (reset)="resetLayout('cols')" />

        <div class="pg-output" [style.gridTemplateRows]="outStyle()">
          <div class="pg-toolbar">
            <div class="pgc-seg" role="group" [attr.aria-label]="modeGroupLabel"
              (keydown)="onSegKeydown($event, 'mode')">
              <button type="button" class="pgc-seg-btn" id="pg-mode-split"
                [class.active]="mode() === 'split'" [attr.aria-pressed]="mode() === 'split'"
                [tabindex]="mode() === 'split' ? 0 : -1" (click)="setMode('split')"
                i18n="@@tools.playground.modeSplit">Separado</button>
              <button type="button" class="pgc-seg-btn" id="pg-mode-single"
                [class.active]="mode() === 'single'" [attr.aria-pressed]="mode() === 'single'"
                [tabindex]="mode() === 'single' ? 0 : -1" (click)="setMode('single')"
                i18n="@@tools.playground.modeSingle">Único</button>
            </div>
            <div class="pg-view">
              <div class="pgc-seg" role="group" [attr.aria-label]="viewportLabel"
                (keydown)="onSegKeydown($event, 'viewport')">
                <button type="button" class="pgc-seg-btn pgc-seg-btn--icon" id="pg-viewport-desktop"
                  [class.active]="viewport() === 'desktop'" [attr.aria-pressed]="viewport() === 'desktop'"
                  [tabindex]="viewport() === 'desktop' ? 0 : -1" (click)="viewport.set('desktop')"
                  [attr.aria-label]="desktopLabel">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>
                  </svg>
                </button>
                <button type="button" class="pgc-seg-btn pgc-seg-btn--icon" id="pg-viewport-tablet"
                  [class.active]="viewport() === 'tablet'" [attr.aria-pressed]="viewport() === 'tablet'"
                  [tabindex]="viewport() === 'tablet' ? 0 : -1" (click)="viewport.set('tablet')"
                  [attr.aria-label]="tabletLabel">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <rect x="4" y="2" width="16" height="20" rx="2"/><path d="M12 18h.01"/>
                  </svg>
                </button>
                <button type="button" class="pgc-seg-btn pgc-seg-btn--icon" id="pg-viewport-mobile"
                  [class.active]="viewport() === 'mobile'" [attr.aria-pressed]="viewport() === 'mobile'"
                  [tabindex]="viewport() === 'mobile' ? 0 : -1" (click)="viewport.set('mobile')"
                  [attr.aria-label]="mobileLabel">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <rect x="7" y="2" width="10" height="20" rx="2"/><path d="M12 18h.01"/>
                  </svg>
                </button>
              </div>
              <span class="pg-ruler">{{ frameWidth() }}</span>
            </div>
            <div class="pg-actions">
              <button type="button" class="pgc-btn pgc-btn--primary" (click)="run()">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                <ng-container i18n="@@tools.playground.run">Run</ng-container>
              </button>
              <button type="button" class="pgc-btn pgc-btn--secondary" (click)="stop()"
                i18n="@@tools.playground.stop">Stop</button>
              <button type="button" class="pgc-btn pgc-btn--secondary" (click)="export()"
                i18n="@@tools.playground.export">Export</button>
              <button type="button" class="pgc-btn"
                [class.pgc-btn--ghost]="!resetPending()" [class.pgc-btn--danger]="resetPending()"
                (click)="onReset()">{{ resetPending() ? resetConfirmLabel : resetLabel }}</button>
              <button type="button" class="pgc-switch" role="switch" [attr.aria-checked]="autoRun()"
                (click)="toggleAutoRun()">
                <span class="pgc-switch-track"><span class="pgc-switch-thumb"></span></span>
                <span i18n="@@tools.playground.auto">Auto</span>
              </button>
            </div>
          </div>

          <div class="pg-preview" [class.is-loading]="running()">
            <iframe #frame class="pg-frame" [style.width]="frameWidth()" (load)="onFrameLoad()"
              sandbox="allow-scripts" [attr.title]="previewLabel"></iframe>
            @if (stopped()) {
              <p class="pg-preview-msg">{{ stoppedMsg }}</p>
            }
          </div>

          <app-resize-handle axis="y" [label]="resizeOutputLabel" [value]="out()[0]"
            (resizeBy)="onResizeOutput($event)" (reset)="resetLayout('out')" />

          <app-console-panel [lines]="consoleLines()" (clear)="clearConsole()" />
        </div>
      </div>

      <app-ai-panel class="pg-ai" [context]="aiContext" />
    </app-tool-shell>
  `,
  styleUrl: './playground.scss',
})
export class Playground implements OnInit, OnDestroy {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly storage = inject(StorageService);
  private readonly renderer = inject(Renderer2);
  @ViewChild('frame') frame?: ElementRef<HTMLIFrameElement>;

  readonly html = signal(DEFAULT_SNIPPET.html);
  readonly css = signal(DEFAULT_SNIPPET.css);
  readonly js = signal(DEFAULT_SNIPPET.js);
  readonly autoRun = signal(true);
  readonly running = signal(false);
  readonly stopped = signal(false);
  readonly resetPending = signal(false);
  readonly consoleLines = signal<ConsoleLine[]>([]);
  readonly viewport = signal<Viewport>('desktop');
  readonly tab = signal<EditorTab>('html');
  readonly mode = signal<PlaygroundMode>('split');
  readonly single = signal('');
  readonly frameWidth = computed(() => {
    const w = VIEWPORTS[this.viewport()];
    return w === null ? '100%' : `${w}px`;
  });

  readonly cols = signal<number[]>([...DEFAULT_LAYOUT.cols]);
  readonly out = signal<number[]>([...DEFAULT_LAYOUT.out]);
  readonly editorRows = signal<number[]>([...DEFAULT_LAYOUT.editors]);
  readonly colsStyle = computed(
    () => `minmax(0, ${this.cols()[0]}fr) auto minmax(0, ${this.cols()[1]}fr)`,
  );
  readonly outStyle = computed(
    () => `auto minmax(0, ${this.out()[0]}fr) auto minmax(0, ${this.out()[1]}fr)`,
  );
  readonly editorRowsStyle = computed(() => {
    const [a, b, c] = this.editorRows();
    return `minmax(0, ${a}fr) auto minmax(0, ${b}fr) auto minmax(0, ${c}fr)`;
  });

  readonly titleText = $localize`:@@tools.playground.name:Playground HTML/CSS/JS`;
  readonly descText = $localize`:@@tools.playground.desc:Editor ao vivo de HTML, CSS e JS com preview e console.`;
  readonly tabsLabel = $localize`:@@tools.playground.tabs:Editores`;
  readonly viewportLabel = $localize`:@@tools.playground.viewport:Tamanho da tela`;
  readonly desktopLabel = $localize`:@@tools.playground.desktop:Desktop`;
  readonly tabletLabel = $localize`:@@tools.playground.tablet:Tablet`;
  readonly mobileLabel = $localize`:@@tools.playground.mobile:Mobile`;
  readonly previewLabel = $localize`:@@tools.playground.preview:Pré-visualização`;
  readonly stoppedMsg = $localize`:@@tools.playground.stoppedMsg:Preview parado. Aperte Run para recomeçar.`;
  readonly modeGroupLabel = $localize`:@@tools.playground.modeGroup:Modo do editor`;
  readonly resizeColsLabel = $localize`:@@tools.playground.resizeCols:Redimensionar editores e saída`;
  readonly resizeOutputLabel = $localize`:@@tools.playground.resizeOutput:Redimensionar preview e console`;
  readonly resizeEditorsLabel = $localize`:@@tools.playground.resizeEditors:Redimensionar editores`;
  readonly resetLabel = $localize`:@@tools.playground.reset:Reset`;
  readonly resetConfirmLabel = $localize`:@@tools.playground.resetConfirm:Confirmar?`;

  private unlistenMessage?: () => void;
  private resetTimer?: ReturnType<typeof setTimeout>;
  private readonly scheduleRun = debounce(() => this.run(), 300);
  private readonly scheduleSave = debounce(() => this.save(), 500);

  ngOnInit(): void {
    if (!this.isBrowser) return;
    this.restore();
    this.unlistenMessage = this.renderer.listen('window', 'message', (e: Event) =>
      this.onMessage(e as MessageEvent),
    );
    queueMicrotask(() => this.run());
  }

  onHtml(value: string): void { this.html.set(value); this.afterChange(); }
  onCss(value: string): void { this.css.set(value); this.afterChange(); }
  onJs(value: string): void { this.js.set(value); this.afterChange(); }

  private afterChange(): void {
    this.scheduleSave();
    if (this.autoRun()) this.scheduleRun();
  }

  run(): void {
    if (!this.isBrowser || !this.frame) return;
    this.running.set(true); this.stopped.set(false);
    this.consoleLines.set([]);
    this.frame.nativeElement.srcdoc =
      this.mode() === 'single'
        ? injectBootstrap(this.single())
        : buildSrcdoc(this.html(), this.css(), this.js());
  }

  stop(): void {
    if (!this.frame) return;
    this.frame.nativeElement.srcdoc = '<!doctype html>';
    this.stopped.set(true); this.running.set(false);
  }

  onFrameLoad(): void { this.running.set(false); }

  setMode(next: PlaygroundMode): void {
    if (next === this.mode()) return;
    if (next === 'single') {
      this.single.set(mergeToSingle(this.html(), this.css(), this.js()));
    } else if (typeof DOMParser !== 'undefined') {
      const parse = (h: string) => new DOMParser().parseFromString(h, 'text/html');
      const s = splitFromSingle(this.single(), parse);
      this.html.set(s.html);
      this.css.set(s.css);
      this.js.set(s.js);
    }
    this.mode.set(next);
    this.afterChange();
  }

  onSegKeydown(e: KeyboardEvent, group: 'mode' | 'viewport'): void {
    const opts: readonly string[] = group === 'mode' ? MODE_OPTIONS : VIEWPORT_OPTIONS;
    const current = opts.indexOf(group === 'mode' ? this.mode() : this.viewport());
    const next = nextTabIndex(current, e.key, opts.length);
    if (next === current) return;
    e.preventDefault();
    if (group === 'mode') this.setMode(MODE_OPTIONS[next]);
    else this.viewport.set(VIEWPORT_OPTIONS[next]);
    if (typeof document !== 'undefined') {
      document.getElementById(`pg-${group}-${opts[next]}`)?.focus();
    }
  }

  onSingle(value: string): void { this.single.set(value); this.afterChange(); }

  onResizeCols(delta: number): void {
    this.cols.set(resizeStack(this.cols(), 0, delta));
    this.scheduleSave();
  }

  onResizeOutput(delta: number): void {
    this.out.set(resizeStack(this.out(), 0, delta));
    this.scheduleSave();
  }

  onResizeEditors(index: number, delta: number): void {
    this.editorRows.set(resizeStack(this.editorRows(), index, delta));
    this.scheduleSave();
  }

  resetLayout(axis: keyof PlaygroundLayout): void {
    if (axis === 'cols') this.cols.set([...DEFAULT_LAYOUT.cols]);
    else if (axis === 'out') this.out.set([...DEFAULT_LAYOUT.out]);
    else this.editorRows.set([...DEFAULT_LAYOUT.editors]);
    this.scheduleSave();
  }

  toggleAutoRun(): void {
    this.autoRun.update(v => !v);
    if (this.autoRun()) this.run();
  }

  onReset(): void {
    if (!this.resetPending()) {
      this.resetPending.set(true);
      this.resetTimer = setTimeout(() => this.resetPending.set(false), 4000);
      return;
    }
    clearTimeout(this.resetTimer);
    this.resetPending.set(false);
    this.reset();
  }

  clearConsole(): void { this.consoleLines.set([]); }

  readonly aiContext = (): PlaygroundContext => ({
    html: this.mode() === 'single' ? this.single() : this.html(),
    css: this.mode() === 'single' ? '' : this.css(),
    js: this.mode() === 'single' ? '' : this.js(),
    console: this.consoleLines().map(l => `[${l.level}] ${l.text}`),
  });

  reset(): void {
    this.html.set(DEFAULT_SNIPPET.html);
    this.css.set(DEFAULT_SNIPPET.css);
    this.js.set(DEFAULT_SNIPPET.js);
    if (this.mode() === 'single') {
      this.single.set(mergeToSingle(DEFAULT_SNIPPET.html, DEFAULT_SNIPPET.css, DEFAULT_SNIPPET.js));
    }
    this.save();
    this.run();
  }

  export(): void {
    if (!this.isBrowser) return;
    const doc =
      this.mode() === 'single'
        ? this.single()
        : buildExportDoc(this.html(), this.css(), this.js());
    const blob = new Blob([doc], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = this.renderer.createElement('a') as HTMLAnchorElement;
    a.href = url;
    a.download = 'playground.html';
    a.click();
    URL.revokeObjectURL(url);
  }

  private onMessage(e: MessageEvent): void {
    if (!this.frame) return;
    if (e.source !== this.frame.nativeElement.contentWindow) return;
    const data = e.data as { __pg?: boolean; level?: ConsoleLine['level']; text?: unknown } | null;
    if (!data || data.__pg !== true || !data.level) return;
    const line: ConsoleLine = { level: data.level, text: String(data.text) };
    this.consoleLines.update(lines => [...lines, line].slice(-200));
  }

  private restore(): void {
    const raw = this.storage.getLocal(PLAYGROUND_KEY);
    if (!raw) return;
    try {
      const s = JSON.parse(raw) as Partial<Snippet>;
      if (typeof s.html === 'string') this.html.set(s.html);
      if (typeof s.css === 'string') this.css.set(s.css);
      if (typeof s.js === 'string') this.js.set(s.js);
      const st = s as Partial<Snippet> & { single?: string; mode?: PlaygroundMode };
      if (typeof st.single === 'string') this.single.set(st.single);
      if (st.mode === 'single' || st.mode === 'split') this.mode.set(st.mode);
      const layout = (s as { layout?: Partial<PlaygroundLayout> }).layout;
      if (layout) {
        if (isValidSizes(layout.cols, 2)) this.cols.set(layout.cols);
        if (isValidSizes(layout.out, 2)) this.out.set(layout.out);
        if (isValidSizes(layout.editors, 3)) this.editorRows.set(layout.editors);
      }
    } catch {
      // ignore corrupt storage
    }
  }

  private save(): void {
    const snippet = {
      html: this.html(), css: this.css(), js: this.js(),
      single: this.single(), mode: this.mode(),
      layout: { cols: this.cols(), out: this.out(), editors: this.editorRows() },
    };
    this.storage.setLocal(PLAYGROUND_KEY, JSON.stringify(snippet));
  }

  ngOnDestroy(): void {
    this.unlistenMessage?.();
    clearTimeout(this.resetTimer);
    this.scheduleRun.cancel();
    this.scheduleSave.cancel();
  }
}
