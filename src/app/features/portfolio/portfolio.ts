import { Component } from '@angular/core';
import { Hero } from './hero/hero';
import { About } from './about/about';
import { Skills } from './skills/skills';
import { Projects } from './projects/projects';

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [Hero, About, Skills, Projects],
  template: `
    <main id="conteudo">
      <app-hero />
      <app-about />
      <app-skills />
      <div id="projetos"><app-projects /></div>
    </main>
  `,
})
export class Portfolio {}
