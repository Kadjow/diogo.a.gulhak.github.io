import { Component, computed, signal } from '@angular/core';
import { Project, ProjectTech, PROJECTS } from '../../../../data/projects';
import { SectionHeading } from '../../../shared/ui/section-heading/section-heading';

// ---------------------------------------------------------------------------
// Pure helpers (exported for unit tests)
// ---------------------------------------------------------------------------

export function filterProjects(list: Project[], tech: 'all' | ProjectTech): Project[] {
  if (tech === 'all') return list;
  return list.filter(p => p.techs.includes(tech));
}

export function pageSlice(list: Project[], page: number, perPage = 3): Project[] {
  const start = page * perPage;
  return list.slice(start, start + perPage);
}

export function wrapPage(page: number, total: number): number {
  return ((page % total) + total) % total;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type FilterOption = { label: string; tech: 'all' | ProjectTech };

const FILTERS: FilterOption[] = [
  { label: 'Tudo', tech: 'all' },
  { label: 'Flutter', tech: 'flutter' },
  { label: 'React Native', tech: 'react-native' },
  { label: 'Web', tech: 'web' },
];

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [SectionHeading],
  template: `
    <section class="projects container" id="projetos" aria-labelledby="projects-heading">
      <app-section-heading number="03" title="Projetos" i18n-title="@@section.projects" />

      <!-- Filter tabs -->
      <div class="projects__filters" role="tablist" aria-label="Filtrar por tecnologia">
        @for (f of filters; track f.tech) {
          <button
            role="tab"
            class="projects__filter"
            [class.projects__filter--active]="activeTech() === f.tech"
            [attr.aria-selected]="activeTech() === f.tech"
            [attr.data-tech]="f.tech"
            (click)="setFilter(f.tech)"
          >{{ f.label }}</button>
        }
      </div>

      <!-- Card grid -->
      <div class="projects__grid">
        @for (project of currentPage(); track project.slug; let i = $index) {
          <article class="projects__card projects__card--stagger-{{ i }}" [attr.aria-label]="project.name">
            <span class="projects__card-index">{{ globalIndex(i) }}</span>
            <span class="projects__card-badge">{{ project.badge }}</span>
            <h3 class="projects__card-name">{{ project.name }}</h3>
            <p class="projects__card-desc">{{ project.description }}</p>
            <div class="projects__card-links">
              <a [href]="project.githubUrl" target="_blank" rel="noopener">Repo</a>
              <a [href]="project.readmeUrl" target="_blank" rel="noopener">README</a>
            </div>
          </article>
        }
      </div>

      <!-- Pagination arrows -->
      <div class="projects__pagination" aria-label="Paginação de projetos">
        <button
          class="projects__arrow"
          aria-label="Anterior"
          [disabled]="totalPages() <= 1"
          (click)="prev()"
        >&#8592;</button>
        <span class="projects__page-indicator">{{ page() + 1 }} / {{ totalPages() }}</span>
        <button
          class="projects__arrow"
          aria-label="Próximo"
          [disabled]="totalPages() <= 1"
          (click)="next()"
        >&#8594;</button>
      </div>
    </section>
  `,
  styleUrl: './projects.scss',
})
export class Projects {
  readonly filters = FILTERS;
  readonly activeTech = signal<'all' | ProjectTech>('all');
  readonly page = signal(0);

  readonly filtered = computed(() => filterProjects(PROJECTS, this.activeTech()));
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / 3)));
  readonly currentPage = computed(() => pageSlice(this.filtered(), this.page()));

  globalIndex(localIndex: number): number {
    return this.page() * 3 + localIndex + 1;
  }

  setFilter(tech: 'all' | ProjectTech): void {
    this.activeTech.set(tech);
    this.page.set(0);
  }

  next(): void {
    this.page.set(wrapPage(this.page() + 1, this.totalPages()));
  }

  prev(): void {
    this.page.set(wrapPage(this.page() - 1, this.totalPages()));
  }
}
