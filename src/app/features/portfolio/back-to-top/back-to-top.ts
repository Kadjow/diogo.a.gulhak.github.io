import { Component, OnDestroy, PLATFORM_ID, Renderer2, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/** Pure helper — exported for unit tests. */
export function shouldShowBackToTop(scrollY: number): boolean {
  return scrollY > 400;
}

@Component({
  selector: 'app-back-to-top',
  standalone: true,
  template: `
    @if (visible()) {
      <button
        class="back-to-top"
        aria-label="Voltar ao topo"
        i18n-aria-label="@@a11y.backToTop"
        (click)="scrollToTop()"
      >
        ↑
      </button>
    }
  `,
  styleUrl: './back-to-top.scss',
})
export class BackToTop implements OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly renderer = inject(Renderer2);

  readonly visible = signal(false);

  /** Renderer2.listen() returns an unlisten function — stored for cleanup. */
  private readonly unlisten?: () => void;

  constructor() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.unlisten = this.renderer.listen('window', 'scroll', () => {
      this.visible.set(shouldShowBackToTop(window.scrollY));
    });
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  ngOnDestroy(): void {
    this.unlisten?.();
  }
}
