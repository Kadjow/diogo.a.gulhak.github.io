import { TestBed } from '@angular/core/testing';
import { LOCALE_ID } from '@angular/core';
import { LocaleService } from './locale.service';

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
