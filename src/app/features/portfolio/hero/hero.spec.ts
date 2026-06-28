import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { Hero, nextTypingState } from './hero';
import { LocaleService } from '../../../core/locale.service';

describe('nextTypingState', () => {
  const phrases = ['ab', 'cd'];
  it('types forward one char', () => {
    const s = nextTypingState({ phraseIndex: 0, charIndex: 0, deleting: false }, phrases);
    expect(s.text).toBe('a'); expect(s.charIndex).toBe(1);
  });
  it('starts deleting after full word', () => {
    const s = nextTypingState({ phraseIndex: 0, charIndex: 2, deleting: false }, phrases);
    expect(s.deleting).toBe(true);
  });
  it('advances to next phrase after fully deleting', () => {
    const s = nextTypingState({ phraseIndex: 0, charIndex: 0, deleting: true }, phrases);
    expect(s.phraseIndex).toBe(1); expect(s.deleting).toBe(false);
  });
});

describe('Hero component — destroy cleanup', () => {
  let fixture: ComponentFixture<Hero>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Hero],
      providers: [
        { provide: PLATFORM_ID, useValue: 'server' },
        {
          provide: LocaleService,
          useValue: { assetPath: (p: string) => `/${p}` },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(Hero);
  });

  it('creates without error', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('destroy does not throw', () => {
    fixture.detectChanges();
    expect(() => fixture.destroy()).not.toThrow();
  });

  it('destroy is idempotent — second call does not throw', () => {
    fixture.detectChanges();
    fixture.destroy();
    expect(() => fixture.componentInstance.ngOnDestroy()).not.toThrow();
  });
});
