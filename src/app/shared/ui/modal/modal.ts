import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

@Component({
  selector: 'app-modal',
  standalone: true,
  template: `
    <div class="modal-overlay" [class.is-open]="open" [attr.aria-hidden]="!open"
         (click)="onOverlay($event)">
      <div class="modal-card" role="dialog" aria-modal="true" [attr.aria-labelledby]="labelledby">
        <button class="modal-close" type="button" (click)="close.emit()" aria-label="Fechar" i18n-aria-label="@@a11y.close">✕</button>
        <ng-content />
      </div>
    </div>`,
  styleUrl: './modal.scss',
})
export class Modal implements OnChanges, OnDestroy {
  @Input() open = false;
  @Input() labelledby = '';
  @Output() close = new EventEmitter<void>();

  private readonly host = inject(ElementRef<HTMLElement>);
  private previouslyFocused: HTMLElement | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = this.open ? 'hidden' : '';
    }

    if (!changes['open'] || changes['open'].firstChange) return;

    if (this.open) {
      this.onOpened();
    } else {
      this.restoreFocus();
    }
  }

  ngOnDestroy(): void {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
    this.restoreFocus();
  }

  onOverlay(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) {
      this.close.emit();
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    if (!this.open) return;
    if (e.key === 'Escape') {
      this.close.emit();
      return;
    }
    if (e.key === 'Tab') {
      this.trapTab(e);
    }
  }

  /** Save the trigger, then move focus into the dialog once content is rendered. */
  private onOpened(): void {
    if (typeof document === 'undefined') return;
    this.previouslyFocused = document.activeElement as HTMLElement | null;
    // Defer so projected content is in the DOM before we query it.
    setTimeout(() => {
      const focusables = this.getFocusable();
      (focusables[0] ?? this.closeButton())?.focus();
    });
  }

  private restoreFocus(): void {
    this.previouslyFocused?.focus?.();
    this.previouslyFocused = null;
  }

  private trapTab(e: KeyboardEvent): void {
    const focusables = this.getFocusable();
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = typeof document !== 'undefined' ? document.activeElement : null;

    if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }

  private getFocusable(): HTMLElement[] {
    const card = this.host.nativeElement.querySelector('.modal-card') as HTMLElement | null;
    if (!card) return [];
    return Array.from(card.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
      el => el.offsetParent !== null || el === document.activeElement,
    );
  }

  private closeButton(): HTMLElement | null {
    return this.host.nativeElement.querySelector('.modal-close') as HTMLElement | null;
  }
}
