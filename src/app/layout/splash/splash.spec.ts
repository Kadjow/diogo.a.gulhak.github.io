import { TestBed } from '@angular/core/testing';
import { Splash } from './splash';

describe('Splash', () => {
  beforeEach(() => sessionStorage.clear());

  it('skips when skip-once flag present', () => {
    sessionStorage.setItem('portfolio:splash:skip-once', 'locale-switch');
    const f = TestBed.createComponent(Splash);
    f.detectChanges();
    expect(f.componentInstance.visible()).toBe(false);
    expect(sessionStorage.getItem('portfolio:splash:skip-once')).toBeNull();
  });
});
