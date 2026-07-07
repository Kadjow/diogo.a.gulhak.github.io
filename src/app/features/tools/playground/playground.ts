import {
  Component, ElementRef, OnDestroy, OnInit, PLATFORM_ID, Renderer2, ViewChild, computed, inject, signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ToolShell } from '../../../shared/ui/tool-shell/tool-shell';
import { CodeEditor } from './editor/code-editor';
import { ConsolePanel } from './console-panel';
import { StorageService } from '../../../core/storage.service';
import { PLAYGROUND_KEY } from '../../../core/storage-keys';
import { debounce } from '../../../shared/util/debounce';
import {
  buildSrcdoc, buildExportDoc, mergeToSingle, splitFromSingle, injectBootstrap,
  DEFAULT_SNIPPET, VIEWPORTS, Viewport, ConsoleLine, Snippet, PlaygroundMode,
} from './playground.logic';

type EditorTab = 'html' | 'css' | 'javascript';

@Component({
  selector: 'app-playground',
  standalone: true,
  imports: [ToolShell, CodeEditor, ConsolePanel],
  template: `
    <app-tool-shell [title]="titleText" [description]="descText">
      <div class="pg">
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
          <div class="pg-editors">
            <div class="pg-editor" [class.hidden-mobile]="tab() !== 'html'">
              <span class="pg-label">HTML</span>
              <app-code-editor language="html" [value]="html()" [ariaLabel]="'HTML'"
                (valueChange)="onHtml($event)" (run)="run()" />
            </div>
            <div class="pg-editor" [class.hidden-mobile]="tab() !== 'css'">
              <span class="pg-label">CSS</span>
              <app-code-editor language="css" [value]="css()" [ariaLabel]="'CSS'"
                (valueChange)="onCss($event)" (run)="run()" />
            </div>
            <div class="pg-editor" [class.hidden-mobile]="tab() !== 'javascript'">
              <span class="pg-label">JS</span>
              <app-code-editor language="javascript" [value]="js()" [ariaLabel]="'JavaScript'"
                (valueChange)="onJs($event)" (run)="run()" />
            </div>
          </div>
        } @else {
          <div class="pg-editors">
            <div class="pg-editor">
              <span class="pg-label">HTML</span>
              <app-code-editor language="html" [value]="single()" [ariaLabel]="'HTML'"
                (valueChange)="onSingle($event)" (run)="run()" />
            </div>
          </div>
        }

        <div class="pg-output">
          <div class="pg-toolbar">
            <div class="pg-modes" role="group" [attr.aria-label]="modeGroupLabel">
              <button type="button" class="pg-mode" [class.active]="mode() === 'split'"
                [attr.aria-pressed]="mode() === 'split'" (click)="setMode('split')"
                i18n="@@tools.playground.modeSplit">Separado</button>
              <button type="button" class="pg-mode" [class.active]="mode() === 'single'"
                [attr.aria-pressed]="mode() === 'single'" (click)="setMode('single')"
                i18n="@@tools.playground.modeSingle">Único</button>
            </div>
            <div class="pg-viewports" role="group" [attr.aria-label]="viewportLabel">
              <button type="button" class="pg-vp" [class.active]="viewport() === 'desktop'"
                (click)="viewport.set('desktop')" [attr.aria-label]="desktopLabel">🖥</button>
              <button type="button" class="pg-vp" [class.active]="viewport() === 'tablet'"
                (click)="viewport.set('tablet')" [attr.aria-label]="tabletLabel">▭</button>
              <button type="button" class="pg-vp" [class.active]="viewport() === 'mobile'"
                (click)="viewport.set('mobile')" [attr.aria-label]="mobileLabel">▯</button>
            </div>
            <div class="pg-actions">
              <button type="button" class="pg-btn" (click)="run()" i18n="@@tools.playground.run">Run</button>
              <button type="button" class="pg-btn" (click)="stop()" i18n="@@tools.playground.stop">Stop</button>
              <label class="pg-auto">
                <input type="checkbox" [checked]="autoRun()" (change)="toggleAutoRun()" />
                <span i18n="@@tools.playground.auto">Auto</span>
              </label>
              <button type="button" class="pg-btn" (click)="export()" i18n="@@tools.playground.export">Export</button>
              <button type="button" class="pg-btn" (click)="reset()" i18n="@@tools.playground.reset">Reset</button>
            </div>
          </div>

          <div class="pg-preview">
            <iframe #frame class="pg-frame" [style.width]="frameWidth()"
              sandbox="allow-scripts" [attr.title]="previewLabel"></iframe>
          </div>

          <app-console-panel [lines]="consoleLines()" (clear)="clearConsole()" />
        </div>
      </div>
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
  readonly consoleLines = signal<ConsoleLine[]>([]);
  readonly viewport = signal<Viewport>('desktop');
  readonly tab = signal<EditorTab>('html');
  readonly mode = signal<PlaygroundMode>('split');
  readonly single = signal('');
  readonly frameWidth = computed(() => {
    const w = VIEWPORTS[this.viewport()];
    return w === null ? '100%' : `${w}px`;
  });

  readonly titleText = $localize`:@@tools.playground.name:Playground HTML/CSS/JS`;
  readonly descText = $localize`:@@tools.playground.desc:Editor ao vivo de HTML, CSS e JS com preview e console.`;
  readonly tabsLabel = $localize`:@@tools.playground.tabs:Editores`;
  readonly viewportLabel = $localize`:@@tools.playground.viewport:Tamanho da tela`;
  readonly desktopLabel = $localize`:@@tools.playground.desktop:Desktop`;
  readonly tabletLabel = $localize`:@@tools.playground.tablet:Tablet`;
  readonly mobileLabel = $localize`:@@tools.playground.mobile:Mobile`;
  readonly previewLabel = $localize`:@@tools.playground.preview:Pré-visualização`;
  readonly modeGroupLabel = $localize`:@@tools.playground.modeGroup:Modo do editor`;

  private unlistenMessage?: () => void;
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
    this.consoleLines.set([]);
    this.frame.nativeElement.srcdoc =
      this.mode() === 'single'
        ? injectBootstrap(this.single())
        : buildSrcdoc(this.html(), this.css(), this.js());
  }

  stop(): void {
    if (!this.frame) return;
    this.frame.nativeElement.srcdoc = '<!doctype html>';
  }

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

  onSingle(value: string): void { this.single.set(value); this.afterChange(); }

  toggleAutoRun(): void {
    this.autoRun.update(v => !v);
    if (this.autoRun()) this.run();
  }

  clearConsole(): void { this.consoleLines.set([]); }

  reset(): void {
    this.html.set(DEFAULT_SNIPPET.html);
    this.css.set(DEFAULT_SNIPPET.css);
    this.js.set(DEFAULT_SNIPPET.js);
    this.save();
    this.run();
  }

  export(): void {
    if (!this.isBrowser) return;
    const doc = buildExportDoc(this.html(), this.css(), this.js());
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
    } catch {
      // ignore corrupt storage
    }
  }

  private save(): void {
    const snippet = {
      html: this.html(), css: this.css(), js: this.js(),
      single: this.single(), mode: this.mode(),
    };
    this.storage.setLocal(PLAYGROUND_KEY, JSON.stringify(snippet));
  }

  ngOnDestroy(): void {
    this.unlistenMessage?.();
    this.scheduleRun.cancel();
    this.scheduleSave.cancel();
  }
}
