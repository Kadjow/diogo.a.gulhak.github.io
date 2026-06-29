import { Injectable, computed, inject, signal } from '@angular/core';
import { LocaleService } from './locale.service';

export type GalleryGroup = 'scout' | 'tech';

export interface GalleryImage {
  src: string;
  alt: string;
}

const GALLERY_DATA: Record<GalleryGroup, { titleKey: string; images: GalleryImage[] }> = {
  scout: {
    titleKey: 'gallery.groups.scout',
    images: [
      { src: 'img/scout/cover.jpeg',          alt: $localize`:@@gallery.scout.cover:Atividade escoteira em grupo`      },
      { src: 'img/scout/acamp_senior.jpeg',   alt: $localize`:@@gallery.scout.camp:Acampamento sênior do grupo escoteiro`       },
      { src: 'img/scout/congresso.jpeg',      alt: $localize`:@@gallery.scout.congresso1:Congresso escoteiro - registro 1` },
      { src: 'img/scout/congresso2.jpeg',     alt: $localize`:@@gallery.scout.congresso2:Congresso escoteiro - registro 2` },
      { src: 'img/scout/congresso3.jpeg',     alt: $localize`:@@gallery.scout.congresso3:Congresso escoteiro - registro 3` },
      { src: 'img/scout/congresso4.jpeg',     alt: $localize`:@@gallery.scout.congresso4:Congresso escoteiro - registro 4` },
      { src: 'img/scout/pico_caratuva2.jpeg', alt: $localize`:@@gallery.scout.pico:Vista do Pico Caratuva`       },
      { src: 'img/scout/vj_cm.jpeg',          alt: $localize`:@@gallery.scout.cascavel:Atividade escoteira em Cascavel`   },
    ],
  },
  tech: {
    titleKey: 'gallery.groups.tech',
    images: [
      { src: 'img/tech/cover.jpeg',                alt: $localize`:@@gallery.tech.cover:Evento de tecnologia`      },
      { src: 'img/tech/arthur_igreja.jpeg',        alt: $localize`:@@gallery.tech.arthur:Palestra com Arthur Igreja`     },
      { src: 'img/tech/conf1.jpeg',                alt: $localize`:@@gallery.tech.conf1:Conferência de tecnologia 1`      },
      { src: 'img/tech/conf3.jpeg',                alt: $localize`:@@gallery.tech.conf3:Conferência de tecnologia 3`      },
      { src: 'img/tech/elemar.jpeg',               alt: $localize`:@@gallery.tech.elemar:Palestra com Elemar`     },
      { src: 'img/tech/guilherme_cavalcanti.jpeg', alt: $localize`:@@gallery.tech.guilherme:Palestra com Guilherme Cavalcanti`  },
      { src: 'img/tech/juliano.jpeg',              alt: $localize`:@@gallery.tech.juliano:Palestra com Juliano`    },
      { src: 'img/tech/loovi.jpeg',                alt: $localize`:@@gallery.tech.loovi:Evento Loovi`      },
      { src: 'img/tech/meetup.jpeg',               alt: $localize`:@@gallery.tech.meetup:Meetup de tecnologia`     },
      { src: 'img/tech/tdw_palestrantes.jpeg',     alt: $localize`:@@gallery.tech.tdwSpeakers:Palestrantes do TDW`},
      { src: 'img/tech/tdw.jpeg',                  alt: $localize`:@@gallery.tech.tdwPanel:Painel no TDW`   },
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
      alt: img.alt,
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
