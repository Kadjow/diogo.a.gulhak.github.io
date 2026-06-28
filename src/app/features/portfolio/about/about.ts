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
        Sou Diogo Gulhak, desenvolvedor mobile e full-stack com foco em
        <strong>Flutter</strong>, <strong>React Native</strong> e
        <strong>Angular</strong>. Tenho experiência construindo aplicações do
        zero — do design à entrega na loja — sempre priorizando
        <strong>clean architecture</strong>, <strong>testes automatizados</strong>
        e <strong>CI/CD</strong> sólido.
      </p>

      <p class="about__text" i18n="@@about.p2">
        Acredito que bom software é aquele que o usuário mal percebe que existe:
        rápido, acessível e confiável. Fora do editor, me encontro aprendendo
        sobre sistemas distribuídos, contribuindo com projetos open-source
        ou explorando trilhas perto de casa.
      </p>
    </section>
  `,
  styleUrl: './about.scss',
})
export class About {}
