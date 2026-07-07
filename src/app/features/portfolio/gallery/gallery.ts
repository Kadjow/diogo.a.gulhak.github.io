import { Component, HostListener, inject } from '@angular/core';
import { Modal } from '../../../shared/ui/modal/modal';
import { GalleryService } from '../../../core/gallery.service';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [Modal],
  template: `
    <app-modal [open]="svc.isOpen()" (close)="svc.close()" labelledby="galleryTitle">
      <h2 id="galleryTitle" class="gallery-title" i18n="@@gallery.title">Galeria</h2>
      <p class="gallery-counter">{{ svc.index() + 1 }} / {{ svc.total() }}</p>
      <img class="gallery-img"
           [src]="svc.current().src"
           [alt]="svc.current().alt" />
      <p class="gallery-caption">{{ svc.current().alt }}</p>
      <div class="gallery-controls">
        <button type="button" class="gallery-prev"
                (click)="svc.prev()"
                i18n-aria-label="@@a11y.previousPhoto"
                aria-label="Foto anterior">&#8592;</button>
        <button type="button" class="gallery-next"
                (click)="svc.next()"
                i18n-aria-label="@@a11y.nextPhoto"
                aria-label="Próxima foto">&#8594;</button>
      </div>
      <p class="gallery-hint" i18n="@@gallery.hint">
        Use as setas ou as setas do teclado para navegar pelas fotos.
      </p>
    </app-modal>
  `,
  styleUrl: './gallery.scss',
})
export class Gallery {
  readonly svc = inject(GalleryService);

  @HostListener('document:keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    if (!this.svc.isOpen()) return;
    if (e.key === 'ArrowRight') this.svc.next();
    if (e.key === 'ArrowLeft')  this.svc.prev();
  }
}
