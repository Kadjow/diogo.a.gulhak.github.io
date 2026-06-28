import { Injectable, computed, inject, signal } from '@angular/core';
import { LocaleService } from './locale.service';

export type GalleryGroup = 'scout' | 'tech';

export interface GalleryImage {
  src: string;
  altKey: string;
}

const GALLERY_DATA: Record<GalleryGroup, { titleKey: string; images: GalleryImage[] }> = {
  scout: {
    titleKey: 'gallery.groups.scout',
    images: [
      { src: 'img/scout/cover.jpeg',          altKey: 'gallery.scout.cover'      },
      { src: 'img/scout/acamp_senior.jpeg',   altKey: 'gallery.scout.camp'       },
      { src: 'img/scout/congresso.jpeg',      altKey: 'gallery.scout.congresso1' },
      { src: 'img/scout/congresso2.jpeg',     altKey: 'gallery.scout.congresso2' },
      { src: 'img/scout/congresso3.jpeg',     altKey: 'gallery.scout.congresso3' },
      { src: 'img/scout/congresso4.jpeg',     altKey: 'gallery.scout.congresso4' },
      { src: 'img/scout/pico_caratuva2.jpeg', altKey: 'gallery.scout.pico'       },
      { src: 'img/scout/vj_cm.jpeg',          altKey: 'gallery.scout.cascavel'   },
    ],
  },
  tech: {
    titleKey: 'gallery.groups.tech',
    images: [
      { src: 'img/tech/cover.jpeg',                altKey: 'gallery.tech.cover'      },
      { src: 'img/tech/arthur_igreja.jpeg',        altKey: 'gallery.tech.arthur'     },
      { src: 'img/tech/conf1.jpeg',                altKey: 'gallery.tech.conf1'      },
      { src: 'img/tech/conf3.jpeg',                altKey: 'gallery.tech.conf3'      },
      { src: 'img/tech/elemar.jpeg',               altKey: 'gallery.tech.elemar'     },
      { src: 'img/tech/guilherme_cavalcanti.jpeg', altKey: 'gallery.tech.guilherme'  },
      { src: 'img/tech/juliano.jpeg',              altKey: 'gallery.tech.juliano'    },
      { src: 'img/tech/loovi.jpeg',                altKey: 'gallery.tech.loovi'      },
      { src: 'img/tech/meetup.jpeg',               altKey: 'gallery.tech.meetup'     },
      { src: 'img/tech/tdw_palestrantes.jpeg',     altKey: 'gallery.tech.tdwSpeakers'},
      { src: 'img/tech/tdw.jpeg',                  altKey: 'gallery.tech.tdwPanel'   },
    ],
  },
};

@Injectable({ providedIn: 'root' })
export class GalleryService {
  private readonly locale = inject(LocaleService);

  readonly isOpen = signal(false);
  readonly group  = signal<GalleryGroup>('scout');
  readonly index  = signal(0);

  total(): number {
    return GALLERY_DATA[this.group()].images.length;
  }

  readonly current = computed(() => {
    const g = this.group();
    const i = this.index();
    const img = GALLERY_DATA[g].images[i];
    return {
      src: this.locale.assetPath(img.src),
      altKey: img.altKey,
    };
  });

  open(group: GalleryGroup): void {
    this.group.set(group);
    this.index.set(0);
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }

  next(): void {
    const total = this.total();
    this.index.set((this.index() + 1) % total);
  }

  prev(): void {
    const total = this.total();
    this.index.set((this.index() - 1 + total) % total);
  }
}
