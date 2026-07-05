import { Component, PLATFORM_ID, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';
import { ToolShell } from '../../../shared/ui/tool-shell/tool-shell';
import { RenderMode, renderMarkdown, sanitizeHtml } from './render.logic';

@Component({
  selector: 'app-html-markdown-render',
  standalone: true,
  imports: [FormsModule, ToolShell],
  template: `
    <app-tool-shell [title]="titleText" [description]="descText">
      <div class="mode-switch" role="group" [attr.aria-label]="modeGroupLabel">
        <button
          type="button"
          class="mode-btn"
          [class.active]="mode() === 'markdown'"
          (click)="setMode('markdown')"
          i18n="@@tools.render.modeMd">Markdown</button>
        <button
          type="button"
          class="mode-btn"
          [class.active]="mode() === 'html'"
          (click)="setMode('html')"
          i18n="@@tools.render.modeHtml">HTML</button>
      </div>

      <div class="split">
        <textarea
          class="field"
          rows="16"
          [ngModel]="source()"
          (ngModelChange)="onInput($event)"
          [attr.placeholder]="placeholderText"
          [attr.aria-label]="editorLabel"></textarea>
        <div class="preview" [innerHTML]="preview()" [attr.aria-label]="previewLabel"></div>
      </div>
    </app-tool-shell>
  `,
  styleUrl: './html-markdown-render.scss',
})
export class HtmlMarkdownRender {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly mode = signal<RenderMode>('markdown');
  readonly source = signal('');
  readonly preview = signal('');

  readonly titleText = $localize`:@@tools.html-markdown-render.name:Render HTML/Markdown`;
  readonly descText = $localize`:@@tools.html-markdown-render.desc:Edite HTML ou Markdown e veja o preview ao vivo.`;
  readonly placeholderText = $localize`:@@tools.render.placeholder:Escreva aqui…`;
  readonly modeGroupLabel = $localize`:@@tools.render.modeGroup:Modo de renderização`;
  readonly editorLabel = $localize`:@@tools.render.editor:Editor`;
  readonly previewLabel = $localize`:@@tools.render.preview:Pré-visualização`;

  setMode(mode: RenderMode): void {
    this.mode.set(mode);
    void this.rerender();
  }

  onInput(value: string): void {
    this.source.set(value);
    void this.rerender();
  }

  private async rerender(): Promise<void> {
    if (!this.isBrowser) return;
    const raw =
      this.mode() === 'markdown' ? await renderMarkdown(this.source()) : this.source();
    const { default: DOMPurify } = await import('dompurify');
    this.preview.set(sanitizeHtml(raw, DOMPurify));
  }
}
