import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-section-heading',
  standalone: true,
  template: `
    <p class="snum">{{ number }} — …</p>
    <h2>{{ title }}</h2>`,
  styles: [`
    .snum {
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--accent);
      margin-bottom: 0.25rem;
    }
    h2 {
      font-size: clamp(1.5rem, 3vw, 2.25rem);
      font-weight: 700;
      color: var(--ink);
      margin: 0;
    }
  `],
})
export class SectionHeading {
  @Input() number = '';
  @Input() title = '';
}
