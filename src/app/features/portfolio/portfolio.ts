import { Component } from '@angular/core';
import { Hero } from './hero/hero';
import { About } from './about/about';
import { Skills } from './skills/skills';

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [Hero, About, Skills],
  template: `
    <main id="conteudo">
      <app-hero />
      <app-about />
      <app-skills />
    </main>
  `,
})
export class Portfolio {}
