import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { CodeEditor } from './code-editor';

function make() {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [CodeEditor],
    providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
  });
  return TestBed.createComponent(CodeEditor);
}

describe('CodeEditor (fallback path on server)', () => {
  it('uses the textarea fallback when not in a browser', () => {
    const fixture = make();
    fixture.detectChanges();
    expect(fixture.componentInstance.useFallback).toBe(true);
  });
  it('emits valueChange from the fallback handler', () => {
    const fixture = make();
    let emitted = '';
    fixture.componentInstance.valueChange.subscribe((v: string) => (emitted = v));
    fixture.componentInstance.onFallback('hello');
    expect(emitted).toBe('hello');
  });
  it('emits run on Ctrl+Enter from the fallback textarea, not on plain Enter', () => {
    const fixture = make();
    let ran = 0;
    fixture.componentInstance.run.subscribe(() => (ran += 1));
    fixture.componentInstance.onFallbackKeydown(
      new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true }),
    );
    expect(ran).toBe(1);
    fixture.componentInstance.onFallbackKeydown(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(ran).toBe(1);
  });
  it('marks the fallback textarea readonly when readonly=true', () => {
    const fixture = make();
    fixture.componentInstance.readonly = true;
    fixture.detectChanges();
    const ta = fixture.nativeElement.querySelector('textarea.cm-fallback') as HTMLTextAreaElement;
    expect(ta.readOnly).toBe(true);
  });
  it('leaves the fallback textarea editable by default', () => {
    const fixture = make();
    fixture.detectChanges();
    const ta = fixture.nativeElement.querySelector('textarea.cm-fallback') as HTMLTextAreaElement;
    expect(ta.readOnly).toBe(false);
  });
  it('renders the fallback without error when lint/diagnostics are set (server)', () => {
    const fixture = make();
    fixture.componentInstance.lint = true;
    fixture.componentInstance.diagnostics = [{ from: 0, to: 1, message: 'x', severity: 'error' }];
    fixture.detectChanges();
    expect(fixture.componentInstance.useFallback).toBe(true);
    const ta = fixture.nativeElement.querySelector('textarea.cm-fallback') as HTMLTextAreaElement;
    expect(ta !== null).toBe(true);
  });
});
