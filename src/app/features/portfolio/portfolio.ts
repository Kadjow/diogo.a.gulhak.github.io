import { Component } from '@angular/core';
import { Hero } from './hero/hero';

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [Hero],
  template: `
    <main id="conteudo">
      <app-hero />
      <!-- sections added in later tasks -->
    </main>
  `,
})
export class Portfolio {}
