import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private safe<T>(fn: () => T, fallback: T): T {
    try { return fn(); } catch { return fallback; }
  }
  getLocal(key: string): string | null {
    return this.safe(() => (typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null), null);
  }
  setLocal(key: string, value: string): void {
    this.safe(() => { if (typeof localStorage !== 'undefined') localStorage.setItem(key, value); }, undefined);
  }
  getSession(key: string): string | null {
    return this.safe(() => (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(key) : null), null);
  }
  setSession(key: string, value: string): void {
    this.safe(() => { if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(key, value); }, undefined);
  }
  removeSession(key: string): void {
    this.safe(() => { if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(key); }, undefined);
  }
}
