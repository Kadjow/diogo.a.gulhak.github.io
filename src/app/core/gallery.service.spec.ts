import { TestBed } from '@angular/core/testing';
import { LOCALE_ID } from '@angular/core';
import { GalleryService } from './gallery.service';

describe('GalleryService', () => {
  let s: GalleryService;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [GalleryService, { provide: LOCALE_ID, useValue: 'pt-BR' }] });
    s = TestBed.inject(GalleryService);
  });
  it('opens a group at index 0', () => {
    s.open('scout');
    expect(s.isOpen()).toBe(true);
    expect(s.index()).toBe(0);
  });
  it('wraps next/prev circularly', () => {
    s.open('tech');
    const total = s.total();
    s.prev();
    expect(s.index()).toBe(total - 1);
    s.next();
    expect(s.index()).toBe(0);
  });
});
