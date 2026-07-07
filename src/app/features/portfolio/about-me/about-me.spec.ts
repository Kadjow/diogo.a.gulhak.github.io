import { TestBed } from '@angular/core/testing';
import { AboutMe } from './about-me';

describe('AboutMe persistence', () => {
  beforeEach(() => localStorage.clear());

  it('restores open state from storage', () => {
    localStorage.setItem('about-open', 'true');
    const f = TestBed.createComponent(AboutMe);
    f.detectChanges();
    expect(f.componentInstance.open()).toBe(true);
  });

  it('persists toggled state', () => {
    const f = TestBed.createComponent(AboutMe);
    f.detectChanges();
    f.componentInstance.toggle();
    expect(localStorage.getItem('about-open')).toBe(String(f.componentInstance.open()));
  });
});
