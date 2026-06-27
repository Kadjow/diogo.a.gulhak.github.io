import { Injectable, signal, inject } from '@angular/core';
import { StorageService } from './storage.service';

type Theme = 'light' | 'dark';
const KEY = 'theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private storage = inject(StorageService);
  private _theme = signal<Theme>('light');
  readonly theme = this._theme.asReadonly();

  init(): void {
    const stored = this.storage.getLocal(KEY) as Theme | null;
    const prefersDark = typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    const theme: Theme = stored ?? (prefersDark ? 'dark' : 'light');
    this.apply(theme);
  }

  toggle(): void {
    this.apply(this._theme() === 'dark' ? 'light' : 'dark');
    this.storage.setLocal(KEY, this._theme());
  }

  private apply(theme: Theme): void {
    this._theme.set(theme);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }
}
