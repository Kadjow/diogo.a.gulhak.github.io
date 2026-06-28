import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class GalleryService {
  readonly isOpen = signal(false);

  open(group: 'scout' | 'tech'): void {
    this.isOpen.set(true);
  }
}
