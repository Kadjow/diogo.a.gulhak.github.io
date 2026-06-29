import { Component, HostListener, inject, OnInit } from '@angular/core';
import { Hero } from './hero/hero';
import { About } from './about/about';
import { Skills } from './skills/skills';
import { Projects } from './projects/projects';
import { Experience } from './experience/experience';
import { AboutMe } from './about-me/about-me';
import { SeoService } from '../../core/seo.service';

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
export class Portfolio implements OnInit {
  private readonly seo = inject(SeoService);

  ngOnInit(): void {
    this.seo.applyForLocale();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const anchor = (event.target as HTMLElement).closest('a[href^="#"]') as HTMLAnchorElement | null;
    if (!anchor) return;
    const hash = anchor.getAttribute('href');
    if (hash) this.seo.setSectionTitle(hash);
  }
}
