import {
  Component, ElementRef, EventEmitter, Input, OnDestroy, Output, inject,
} from '@angular/core';
import { KEY_STEP, MIN_FRACTION } from '../../util/resize';

/**
 * Accessible drag handle between two panels of a grid "stack".
 * Emits fraction deltas; the parent owns the sizes and the grid template.
 * Must be placed as a direct child of the grid container it resizes.
 */
@Component({
  selector: 'app-resize-handle',
  standalone: true,
  template: `
    <div
      class="handle"
      [class.axis-x]="axis === 'x'"
      [class.axis-y]="axis === 'y'"
      role="separator"
      tabindex="0"
      [attr.aria-orientation]="axis === 'x' ? 'vertical' : 'horizontal'"
      [attr.aria-label]="label"
      [attr.aria-valuenow]="valueNow"
      [attr.aria-valuemin]="valueMin"
      [attr.aria-valuemax]="valueMax"
      (pointerdown)="onPointerDown($event)"
      (keydown)="onKeyDown($event)"
      (dblclick)="reset.emit()"
    ></div>
  `,
  styleUrl: './resize-handle.scss',
})
export class ResizeHandle implements OnDestroy {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);

  @Input() axis: 'x' | 'y' = 'x';
  @Input() label = '';
  @Input() value = 0.5;
  @Output() resizeBy = new EventEmitter<number>();
  @Output() reset = new EventEmitter<void>();

  private detach?: () => void;

  get valueNow(): number {
    return Math.round(this.value * 100);
  }
  get valueMin(): number {
    return Math.round(MIN_FRACTION * 100);
  }
  get valueMax(): number {
    return Math.round((1 - MIN_FRACTION) * 100);
  }

  onPointerDown(e: PointerEvent): void {
    e.preventDefault();
    e.stopPropagation();
    const container = this.el.nativeElement.parentElement;
    if (!container) return;
    const total = this.axis === 'x' ? container.clientWidth : container.clientHeight;
    if (total <= 0) return;
    const target = e.target as HTMLElement;
    let last = this.axis === 'x' ? e.clientX : e.clientY;
    const onMove = (ev: PointerEvent): void => {
      const pos = this.axis === 'x' ? ev.clientX : ev.clientY;
      if (pos === last) return;
      this.resizeBy.emit((pos - last) / total);
      last = pos;
    };
    const onUp = (): void => {
      target.removeEventListener('pointermove', onMove);
      target.removeEventListener('pointerup', onUp);
      target.removeEventListener('pointercancel', onUp);
      this.detach = undefined;
    };
    target.setPointerCapture(e.pointerId);
    target.addEventListener('pointermove', onMove);
    target.addEventListener('pointerup', onUp);
    target.addEventListener('pointercancel', onUp);
    this.detach = onUp;
  }

  onKeyDown(e: KeyboardEvent): void {
    const dec = this.axis === 'x' ? 'ArrowLeft' : 'ArrowUp';
    const inc = this.axis === 'x' ? 'ArrowRight' : 'ArrowDown';
    if (e.key === dec) {
      e.preventDefault();
      this.resizeBy.emit(-KEY_STEP);
    } else if (e.key === inc) {
      e.preventDefault();
      this.resizeBy.emit(KEY_STEP);
    }
  }

  ngOnDestroy(): void {
    this.detach?.();
  }
}
