import { Component } from '@angular/core';
import { Hero } from './hero/hero';
import { About } from './about/about';
import { Skills } from './skills/skills';
import { Projects } from './projects/projects';
import { Experience } from './experience/experience';
import { AboutMe } from './about-me/about-me';

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [Hero, About, Skills, Projects, Experience, AboutMe],
  template: `
    <main id="conteudo">
      <app-hero />
      <app-about />
      <app-skills />
      <app-projects />
      <app-experience />
      <app-about-me />
    </main>
  `,
})
export class Portfolio {}
