import { Component } from '@angular/core';
import { SectionHeading } from '../../../shared/ui/section-heading/section-heading';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [SectionHeading],
  template: `
    <section class="about container" id="sobre" aria-labelledby="sobre-heading">
      <app-section-heading number="01" title="Sobre" i18n-title="@@section.sobre" />

      <p class="about__text" i18n="@@about.p1">
        Desenho e publico apps em Flutter end-to-end: APIs, autenticação, cache/offline, push e CI/CD confiável (Actions/Codemagic). Experiência em whitelabel (visual e identidade por cliente) e uso de WebView quando acelera o time-to-market. Cobertura extra em Angular/React e NestJS/Node + PostgreSQL.
      </p>

      <p class="about__text" i18n="@@about.p2">
        Resultado esperado: produto no ar, manutenção simples e evolução contínua. Gosto de processos claros, automação e foco na experiência do usuário.
      </p>
    </section>
  `,
  styleUrl: './about.scss',
})
export class About {}
