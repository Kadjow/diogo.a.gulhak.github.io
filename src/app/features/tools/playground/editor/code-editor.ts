import {
  AfterViewInit, Component, ElementRef, EventEmitter, Input, NgZone, OnChanges,
  OnDestroy, Output, PLATFORM_ID, SimpleChanges, ViewChild, inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { Extension } from '@codemirror/state';

export type EditorLanguage = 'html' | 'css' | 'javascript';

@Component({
  selector: 'app-code-editor',
  standalone: true,
  imports: [FormsModule],
  template: `
    @if (useFallback) {
      <textarea
        class="cm-fallback"
        spellcheck="false"
        [ngModel]="value"
        (ngModelChange)="onFallback($event)"
        (keydown)="onFallbackKeydown($event)"
        [attr.aria-label]="ariaLabel"></textarea>
    } @else {
      <div class="cm-host" #host [attr.aria-label]="ariaLabel"></div>
    }
  `,
  styleUrl: './code-editor.scss',
})
export class CodeEditor implements AfterViewInit, OnChanges, OnDestroy {
  @Input() value = '';
  @Input() language: EditorLanguage = 'html';
  @Input() ariaLabel = '';
  @Output() valueChange = new EventEmitter<string>();
  @Output() run = new EventEmitter<void>();
  @ViewChild('host') host?: ElementRef<HTMLElement>;

  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly zone = inject(NgZone);
  useFallback = !this.isBrowser;
  // Typed loosely: CodeMirror types are only available after the dynamic import.
  private view: { state: { doc: { toString(): string; length: number } }; dispatch(t: unknown): void; destroy(): void } | undefined;
  private lastEmitted = '';
  private destroyed = false;

  async ngAfterViewInit(): Promise<void> {
    if (!this.isBrowser) return;
    try {
      await this.mount();
    } catch {
      this.useFallback = true;
    }
  }

  private async mount(): Promise<void> {
    const [cm, view, state, language, lezerHighlight] = await Promise.all([
      import('codemirror'),
      import('@codemirror/view'),
      import('@codemirror/state'),
      import('@codemirror/language'),
      import('@lezer/highlight'),
    ]);
    const langExt = await this.loadLanguage();
    if (this.destroyed) return;
    const EditorView = cm.EditorView;
    // Highlight só com classes (tok-*) — cores vêm do CSS por tokens, tema troca com data-theme.
    const tokenClasses = language.HighlightStyle.define([
      { tag: lezerHighlight.tags.keyword, class: 'tok-keyword' },
      { tag: [lezerHighlight.tags.string, lezerHighlight.tags.special(lezerHighlight.tags.string)], class: 'tok-string' },
      { tag: [lezerHighlight.tags.number, lezerHighlight.tags.bool, lezerHighlight.tags.atom, lezerHighlight.tags.null], class: 'tok-number' },
      { tag: lezerHighlight.tags.comment, class: 'tok-comment' },
      { tag: lezerHighlight.tags.tagName, class: 'tok-tag' },
      { tag: lezerHighlight.tags.attributeName, class: 'tok-attr' },
      { tag: [lezerHighlight.tags.propertyName, lezerHighlight.tags.definition(lezerHighlight.tags.propertyName)], class: 'tok-prop' },
      { tag: [lezerHighlight.tags.className, lezerHighlight.tags.typeName], class: 'tok-type' },
      { tag: [lezerHighlight.tags.operator, lezerHighlight.tags.punctuation, lezerHighlight.tags.bracket], class: 'tok-punct' },
      { tag: [lezerHighlight.tags.function(lezerHighlight.tags.variableName), lezerHighlight.tags.function(lezerHighlight.tags.propertyName)], class: 'tok-fn' },
    ]);
    const updateListener = EditorView.updateListener.of(u => {
      if (u.docChanged) {
        const text = u.state.doc.toString();
        this.lastEmitted = text;
        this.zone.run(() => this.valueChange.emit(text));
      }
    });
    const runKeymap = view.keymap.of([
      { key: 'Mod-Enter', run: () => { this.zone.run(() => this.run.emit()); return true; } },
    ]);
    const startState = state.EditorState.create({
      doc: this.value,
      extensions: [
        cm.basicSetup, langExt, updateListener, runKeymap, EditorView.lineWrapping,
        language.syntaxHighlighting(tokenClasses),
      ],
    });
    this.view = new EditorView({ state: startState, parent: this.host!.nativeElement }) as unknown as typeof this.view;
  }

  private async loadLanguage(): Promise<Extension> {
    if (this.language === 'css') return (await import('@codemirror/lang-css')).css();
    if (this.language === 'javascript') return (await import('@codemirror/lang-javascript')).javascript();
    return (await import('@codemirror/lang-html')).html();
  }

  onFallback(value: string): void {
    this.lastEmitted = value;
    this.valueChange.emit(value);
  }

  onFallbackKeydown(e: KeyboardEvent): void {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      this.run.emit();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['value'] || !this.view) return;
    if (this.value === this.lastEmitted) return;
    const current = this.view.state.doc.toString();
    if (current === this.value) return;
    this.view.dispatch({ changes: { from: 0, to: current.length, insert: this.value } });
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.view?.destroy();
  }
}
