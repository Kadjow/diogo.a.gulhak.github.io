import { TestBed } from '@angular/core/testing';
import { LOCALE_ID } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { buildHreflangs, SeoService, NAV_TITLES } from './seo.service';
import { LocaleService } from './locale.service';

describe('buildHreflangs', () => {
  it('builds pt, en and x-default', () => {
    const h = buildHreflangs('https://kadjow.github.io/diogo.a.gulhak.github.io/');
    const langs = h.map(x => x.hreflang).sort();
    expect(langs).toEqual(['en', 'pt-BR', 'x-default']);
    expect(h.find(x => x.hreflang === 'pt-BR')!.href).toBe(
      'https://kadjow.github.io/diogo.a.gulhak.github.io/',
    );
    expect(h.find(x => x.hreflang === 'en')!.href).toBe(
      'https://kadjow.github.io/diogo.a.gulhak.github.io/en/',
    );
  });
});

describe('NAV_TITLES', () => {
  it('maps all five sections', () => {
    expect(Object.keys(NAV_TITLES)).toHaveLength(5);
    expect(NAV_TITLES['#projetos']).toBe('Projetos - Diogo Gulhak');
    expect(NAV_TITLES['#sobre']).toBe('Sobre - Diogo Gulhak');
    expect(NAV_TITLES['#skills']).toBe('Skills - Diogo Gulhak');
    expect(NAV_TITLES['#experiencia']).toBe('Experiência - Diogo Gulhak');
    expect(NAV_TITLES['#sobre-mim']).toBe('Quem sou eu - Diogo Gulhak');
  });
});

describe('SeoService.setSectionTitle', () => {
  let svc: SeoService;
  let lastTitle: string;

  beforeEach(() => {
    lastTitle = '';
    TestBed.configureTestingModule({
      providers: [
        SeoService,
        LocaleService,
        { provide: LOCALE_ID, useValue: 'pt-BR' },
        { provide: Title, useValue: { setTitle: (t: string) => { lastTitle = t; } } },
        { provide: Meta, useValue: { updateTag: () => undefined } },
      ],
    });
    svc = TestBed.inject(SeoService);
  });

  it('setSectionTitle("#projetos") sets "Projetos - Diogo Gulhak" via Title', () => {
    svc.setSectionTitle('#projetos');
    expect(lastTitle).toBe('Projetos - Diogo Gulhak');
  });

  it('setSectionTitle("#sobre") sets "Sobre - Diogo Gulhak"', () => {
    svc.setSectionTitle('#sobre');
    expect(lastTitle).toBe('Sobre - Diogo Gulhak');
  });

  it('setSectionTitle with unknown hash does nothing', () => {
    svc.setSectionTitle('#unknown');
    expect(lastTitle).toBe('');
  });
});
