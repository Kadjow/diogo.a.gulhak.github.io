import { TestBed } from '@angular/core/testing';
import { ThemeService, isTheme } from './theme.service';
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
  it('ignores a corrupted stored value and falls back to a valid theme', () => {
    localStorage.setItem('theme','banana');
    svc.init();
    expect(['light','dark']).toContain(svc.theme());
  });

  describe('isTheme', () => {
    it('accepts valid themes', () => {
      expect(isTheme('light')).toBe(true);
      expect(isTheme('dark')).toBe(true);
    });
    it('rejects invalid values', () => {
      expect(isTheme('banana')).toBe(false);
      expect(isTheme(null)).toBe(false);
      expect(isTheme(undefined)).toBe(false);
      expect(isTheme(1)).toBe(false);
    });
  });
});
