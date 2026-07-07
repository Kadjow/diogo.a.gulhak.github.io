import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { BackToTop, shouldShowBackToTop } from './back-to-top';

describe('shouldShowBackToTop', () => {
  it('returns false at scrollY 0', () => {
    expect(shouldShowBackToTop(0)).toBe(false);
  });

  it('returns false at scrollY 400 (boundary not inclusive)', () => {
    expect(shouldShowBackToTop(400)).toBe(false);
  });

  it('returns true at scrollY 401', () => {
    expect(shouldShowBackToTop(401)).toBe(true);
  });

  it('returns true at large scrollY', () => {
    expect(shouldShowBackToTop(2000)).toBe(true);
  });
});

describe('BackToTop component', () => {
  let fixture: ComponentFixture<BackToTop>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BackToTop],
      providers: [
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(BackToTop);
  });

  it('creates without error', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('visible is false initially (no scroll event in server mode)', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance.visible()).toBe(false);
  });

  it('destroy does not throw', () => {
    fixture.detectChanges();
    expect(() => fixture.destroy()).not.toThrow();
  });

  it('destroy is idempotent', () => {
    fixture.detectChanges();
    fixture.destroy();
    expect(() => fixture.componentInstance.ngOnDestroy()).not.toThrow();
  });
});
