import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';
import { StorageService } from './storage.service';

describe('ThemeService', () => {
  let svc: ThemeService;
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    TestBed.configureTestingModule({ providers: [ThemeService, StorageService] });
    svc = TestBed.inject(ThemeService);
  });

  it('defaults to a valid theme on init', () => {
    svc.init();
    expect(['light','dark']).toContain(svc.theme());
  });
  it('toggle flips and persists', () => {
    svc.init();
    const before = svc.theme();
    svc.toggle();
    expect(svc.theme()).not.toBe(before);
    expect(localStorage.getItem('theme')).toBe(svc.theme());
  });
  it('applies data-theme attribute', () => {
    svc.init(); svc.toggle();
    expect(document.documentElement.getAttribute('data-theme')).toBe(svc.theme());
  });
  it('respects a stored preference', () => {
    localStorage.setItem('theme','dark');
    svc.init();
    expect(svc.theme()).toBe('dark');
  });
});
