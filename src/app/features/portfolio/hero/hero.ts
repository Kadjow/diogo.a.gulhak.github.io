import { Component, OnDestroy, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { LocaleService } from '../../../core/locale.service';
import { SectionHeading } from '../../../shared/ui/section-heading/section-heading';

export interface TypingState {
  phraseIndex: number;
  charIndex: number;
  deleting: boolean;
  text: string;
}

/** Pure function — drives typing rotator; unit-testable without timers. */
export function nextTypingState(
  state: Pick<TypingState, 'phraseIndex' | 'charIndex' | 'deleting'>,
  phrases: string[]
): TypingState {
  const { phraseIndex, charIndex, deleting } = state;
  const phrase = phrases[phraseIndex];

  if (!deleting) {
    if (charIndex >= phrase.length) {
      return { phraseIndex, charIndex, deleting: true, text: phrase };
    }
    const next = charIndex + 1;
    return { phraseIndex, charIndex: next, deleting: false, text: phrase.slice(0, next) };
  } else {
    if (charIndex === 0) {
      return { phraseIndex: (phraseIndex + 1) % phrases.length, charIndex: 0, deleting: false, text: '' };
    }
    const prev = charIndex - 1;
    return { phraseIndex, charIndex: prev, deleting: true, text: phrase.slice(0, prev) };
  }
}

const PHRASES: string[] = [
  $localize`:@@hero.phrase1:um desenvolvedor mobile.`,
  $localize`:@@hero.phrase2:um desenvolvedor full-stack.`,
  $localize`:@@hero.phrase3:um desenvolvedor front-end.`,
  $localize`:@@hero.phrase4:um developer advocate.`,
];

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [SectionHeading],
  template: `
    <section class="hero container" aria-label="Apresentação" i18n-aria-label="@@hero.sectionAria">
      <div class="hero__photo-wrap">
        <img
          class="hero__photo"
          [src]="photoSrc"
          alt="Diogo Arthur Gulhak sorrindo; foto usada como avatar do portfólio"
          i18n-alt="@@hero.photoAlt"
          width="260"
          height="260"
          loading="eager"
          decoding="sync"
        />
      </div>

      <div class="hero__text">
        <app-section-heading number="00" title="Portfólio" i18n-title="@@section.portfolio" />

        <h1 class="hero__headline">Diogo <span class="accent">Gulhak</span></h1>

        <p class="hero__subtitle">
          <span i18n="@@hero.rolePrefix">Sou</span>
          <span class="hero__rotator typing" aria-live="polite">{{ roleText() }}</span>
        </p>

        <p class="hero__bio" i18n="@@hero.bio">
          Construo apps em <strong>Flutter</strong> e <strong>React Native</strong>
          com <strong>arquitetura limpa</strong>, <strong>testes</strong> e
          <strong>CI/CD</strong> estáveis para garantir <strong>performance</strong>,
          <strong>acessibilidade</strong> e uma
          <strong>experiência consistente</strong> para o usuário.
        </p>

        <div class="hero__cta">
          <a
            class="btn"
            href="https://github.com/Kadjow?tab=repositories"
            target="_blank"
            rel="noopener"
            i18n="@@hero.ctaGithub"
          >Ver meus repositórios no GitHub</a>
          <a class="btn ghost" href="#projetos" i18n="@@hero.ctaProjects">Explorar projetos</a>
        </div>

        <ul class="hero__social">
          <li>
            <a rel="me" href="mailto:dgulhak@gmail.com" aria-label="Email" i18n-aria-label="@@a11y.socialEmail">
              Email
            </a>
          </li>
          <li>
            <a rel="me noopener" href="https://github.com/Kadjow" target="_blank"
               aria-label="GitHub" i18n-aria-label="@@a11y.socialGithub">
              GitHub
            </a>
          </li>
          <li>
            <a rel="me noopener" href="https://www.linkedin.com/in/diogo-arthur-gulhak-0bbaa0273/"
               target="_blank"
               aria-label="LinkedIn" i18n-aria-label="@@a11y.socialLinkedin">
              LinkedIn
            </a>
          </li>
        </ul>
      </div>
    </section>
  `,
  styleUrl: './hero.scss',
})
export class Hero implements OnDestroy {
  private readonly locale = inject(LocaleService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly phrases = PHRASES;
  readonly photoSrc = this.locale.assetPath('img/ft_perfil.jpg');
  readonly roleText = signal('');

  private typingState: TypingState = { phraseIndex: 0, charIndex: 0, deleting: false, text: '' };
  private typingTimer: ReturnType<typeof setTimeout> | undefined;
  private intervalTimer: ReturnType<typeof setInterval> | undefined;

  constructor() {
    if (!isPlatformBrowser(this.platformId)) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion) {
      this.roleText.set(this.phrases[0]);
      let idx = 0;
      this.intervalTimer = setInterval(() => {
        idx = (idx + 1) % this.phrases.length;
        this.roleText.set(this.phrases[idx]);
      }, 3000);
    } else {
      this.scheduleNext();
    }
  }

  ngOnDestroy(): void {
    clearTimeout(this.typingTimer);
    clearInterval(this.intervalTimer);
  }

  private scheduleNext(): void {
    const delay = this.typingState.deleting ? 60 : 100;
    this.typingTimer = setTimeout(() => {
      this.typingState = nextTypingState(this.typingState, this.phrases);
      this.roleText.set(this.typingState.text);
      this.scheduleNext();
    }, delay);
  }
}
