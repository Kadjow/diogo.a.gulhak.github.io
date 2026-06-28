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
      <div id="projetos"><app-projects /></div>
      <div id="experiencia"><app-experience /></div>
      <div id="sobre-mim"><app-about-me /></div>
    </main>
  `,
})
export class Portfolio {}
