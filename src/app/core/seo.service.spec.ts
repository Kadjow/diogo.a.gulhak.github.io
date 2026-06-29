import { buildHreflangs } from './seo.service';

describe('buildHreflangs', () => {
  it('builds pt, en and x-default', () => {
    const h = buildHreflangs('https://diogo.a.gulhak.github.io');
    const langs = h.map(x => x.hreflang).sort();
    expect(langs).toEqual(['en', 'pt-BR', 'x-default']);
    expect(h.find(x => x.hreflang === 'en')!.href).toContain('/en/');
  });
});
