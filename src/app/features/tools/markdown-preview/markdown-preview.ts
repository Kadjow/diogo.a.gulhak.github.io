import { Component, PLATFORM_ID, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';
import { ToolShell } from '../../../shared/ui/tool-shell/tool-shell';
import { renderMarkdown, sanitizeHtml } from './render.logic';

@Component({
  selector: 'app-markdown-preview',
  standalone: true,
  imports: [FormsModule, ToolShell],
  template: `
    <app-tool-shell [title]="titleText" [description]="descText">
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
  styleUrl: './markdown-preview.scss',
})
export class MarkdownPreview {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly source = signal('');
  readonly preview = signal('');

  readonly titleText = $localize`:@@tools.markdown-preview.name:Markdown Preview`;
  readonly descText = $localize`:@@tools.markdown-preview.desc:Escreva Markdown e veja o preview ao vivo.`;
  readonly placeholderText = $localize`:@@tools.markdown-preview.placeholder:Escreva Markdown…`;
  readonly editorLabel = $localize`:@@tools.markdown-preview.editor:Editor`;
  readonly previewLabel = $localize`:@@tools.markdown-preview.preview:Pré-visualização`;

  onInput(value: string): void {
    this.source.set(value);
    void this.rerender();
  }

  private async rerender(): Promise<void> {
    if (!this.isBrowser) return;
    const raw = await renderMarkdown(this.source());
    const { default: DOMPurify } = await import('dompurify');
    this.preview.set(sanitizeHtml(raw, DOMPurify));
  }
}
