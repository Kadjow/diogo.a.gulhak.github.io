import { Component, OnInit, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { StorageService } from '../../core/storage.service';

const SKIP_KEY = 'portfolio:splash:skip-once';

@Component({
  selector: 'app-splash',
  standalone: true,
  template: `
    @if (visible()) {
      <div class="splash-overlay" aria-hidden="true">
        <span class="splash-brand">DAG.</span>
      </div>
    }
  `,
  styleUrl: './splash.scss',
})
export class Splash implements OnInit {
  private storage = inject(StorageService);
  private platformId = inject(PLATFORM_ID);

  visible = signal(false);

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Skip-once: flag set by locale switch
    if (this.storage.getSession(SKIP_KEY)) {
      this.storage.removeSession(SKIP_KEY);
      this.visible.set(false);
      return;
    }

    // Reduced motion: skip entirely
    if (typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.visible.set(false);
      return;
    }

    // Normal flow: show then hide after ~900ms
    this.visible.set(true);
    setTimeout(() => this.visible.set(false), 900);
  }
}
