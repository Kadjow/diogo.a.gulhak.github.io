import { TestBed } from '@angular/core/testing';
import { LOCALE_ID } from '@angular/core';
import { LocaleService, deployRootFromBase } from './locale.service';

function make(locale: string) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [LocaleService, { provide: LOCALE_ID, useValue: locale }] });
  return TestBed.inject(LocaleService);
}

describe('LocaleService', () => {
  it('maps pt-BR locale', () => {
    const s = make('pt-BR');
    expect(s.locale).toBe('pt-BR');
    expect(s.localePath('pt-BR')).toBe('/');
    expect(s.localePath('en')).toBe('/en/');
    expect(s.otherLocale()).toBe('en');
  });
  it('maps en locale', () => {
    const s = make('en-US');
    expect(s.locale).toBe('en');
    expect(s.otherLocale()).toBe('pt-BR');
  });
});

describe('deployRootFromBase', () => {
  it('defaults to root when base is "/" or empty', () => {
    expect(deployRootFromBase('/')).toBe('/');
    expect(deployRootFromBase('')).toBe('/');
    expect(deployRootFromBase(null)).toBe('/');
  });
  it('keeps a project subpath', () => {
    expect(deployRootFromBase('/diogo.a.gulhak.github.io/')).toBe('/diogo.a.gulhak.github.io/');
  });
  it('strips the trailing en/ locale segment', () => {
    expect(deployRootFromBase('/en/')).toBe('/');
    expect(deployRootFromBase('/diogo.a.gulhak.github.io/en/')).toBe('/diogo.a.gulhak.github.io/');
  });
  it('does not strip en/ mid-word', () => {
    expect(deployRootFromBase('/garden/')).toBe('/garden/');
  });
  it('accepts an absolute base href and returns the path only', () => {
    expect(deployRootFromBase('https://kadjow.github.io/diogo.a.gulhak.github.io/en/')).toBe(
      '/diogo.a.gulhak.github.io/',
    );
  });
  it('normalizes a missing trailing slash', () => {
    expect(deployRootFromBase('/sub')).toBe('/sub/');
  });
});
