import { Component } from '@angular/core';
import { EXPERIENCE } from '../../../../data/experience';
import { SectionHeading } from '../../../shared/ui/section-heading/section-heading';

@Component({
  selector: 'app-experience',
  standalone: true,
  imports: [SectionHeading],
  template: `
    <section class="experience container" id="experiencia" aria-labelledby="experience-heading">
      <app-section-heading
        number="04"
        title="Experiência selecionada"
        i18n-title="@@sections.experienceTitle"
        headingId="experience-heading"
      />

      <div class="experience__cards">
        @for (item of items; track item.title) {
          <article class="experience__card">
            <h3 class="experience__card-title">
              {{ item.title }}
              @if (item.period) {
                <small class="experience__card-period">{{ item.period }}</small>
              }
            </h3>
            <ul class="experience__card-bullets">
              @for (bullet of item.bullets; track bullet) {
                <li>{{ bullet }}</li>
              }
            </ul>
          </article>
        }
      </div>
    </section>
  `,
  styleUrl: './experience.scss',
})
export class Experience {
  readonly items = EXPERIENCE;
}
