import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UiStateService {
  readonly contactOpen = signal(false);
  readonly galleryOpen = signal(false);
}
