import { Component, EventEmitter, HostListener, Input, OnChanges, OnDestroy, Output } from '@angular/core';

@Component({
  selector: 'app-modal',
  standalone: true,
  template: `
    <div class="modal-overlay" [class.is-open]="open" [attr.aria-hidden]="!open"
         (click)="onOverlay($event)">
      <div class="modal-card" role="dialog" [attr.aria-labelledby]="labelledby">
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

  ngOnChanges(): void {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = this.open ? 'hidden' : '';
    }
  }

  ngOnDestroy(): void {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
  }

  onOverlay(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) {
      this.close.emit();
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    if (this.open && e.key === 'Escape') {
      this.close.emit();
    }
  }
}
