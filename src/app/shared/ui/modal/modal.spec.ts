import { TestBed } from '@angular/core/testing';
import { Modal } from './modal';

describe('Modal', () => {
  it('emits close on Escape when open', () => {
    const fixture = TestBed.createComponent(Modal);
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    let closed = false;
    fixture.componentInstance.close.subscribe(() => (closed = true));
    fixture.componentInstance.onKeydown(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(closed).toBe(true);
  });
  it('does not emit close on Escape when closed', () => {
    const fixture = TestBed.createComponent(Modal);
    fixture.componentRef.setInput('open', false);
    fixture.detectChanges();
    let closed = false;
    fixture.componentInstance.close.subscribe(() => (closed = true));
    fixture.componentInstance.onKeydown(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(closed).toBe(false);
  });
  it('clears scroll lock on destroy when open', () => {
    const fixture = TestBed.createComponent(Modal);
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    expect(document.body.style.overflow).toBe('hidden');
    fixture.destroy();
    expect(document.body.style.overflow).toBe('');
  });
});
