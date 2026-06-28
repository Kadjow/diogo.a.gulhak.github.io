import { Component, inject, OnInit, signal } from '@angular/core';
import { StorageService } from '../../../core/storage.service';
import { GalleryService } from '../../../core/gallery.service';
import { SectionHeading } from '../../../shared/ui/section-heading/section-heading';

const STORAGE_KEY = 'about-open';

@Component({
  selector: 'app-about-me',
  standalone: true,
  imports: [SectionHeading],
  template: `
    <section class="about-me container" id="sobre-mim" aria-labelledby="about-me-heading">
      <app-section-heading
        number="05"
        title="Quem sou eu (fora do código)"
        i18n-title="@@sections.aboutMeTitle"
      />

      <button
        class="about-me__toggle"
        [attr.aria-expanded]="open()"
        (click)="toggle()"
        i18n="@@sections.aboutToggleShow"
      >
        {{ open()
          ? ('Esconder sobre mim')
          : ('Mostrar sobre mim') }}
      </button>

      @if (open()) {
        <div class="about-me__body">
          <!-- About cards -->
          <div class="about-me__cards">

            <!-- Escotismo -->
            <article class="about-me__card">
              <h3 class="about-me__card-title" i18n="@@aboutCards.scoutingTitle">Escotismo - GEAV</h3>
              <ul class="about-me__card-list">
                <li i18n="@@aboutCards.scoutingItem1">
                  Faço parte do <strong>Grupo Escoteiro Aldeia Verde</strong>, em Cascavel/PR, desde <strong>2016</strong>. O movimento escoteiro sempre foi meu ponto de equilíbrio: natureza, serviço à comunidade e trabalho em equipe.
                </li>
                <li i18n="@@aboutCards.scoutingItem2">
                  Conquistei a <strong>Insígnia de Escoteiro da Pátria</strong> no ramo Sênior, que é o reconhecimento máximo dessa etapa. Sigo ativo no grupo até hoje, ajudando na organização e no apoio das atividades.
                </li>
              </ul>
            </article>

            <!-- Natureza & Rotina -->
            <article class="about-me__card">
              <h3 class="about-me__card-title" i18n="@@aboutCards.natureTitle">Natureza &amp; Rotina</h3>
              <ul class="about-me__card-list">
                <li i18n="@@aboutCards.natureItem1">
                  Trilhas, acampamentos e tempo ao ar livre são o meu jeito de sair da frente da tela. É onde eu recarrego as baterias depois de semanas codando e resolvendo problemas.
                </li>
                <li i18n="@@aboutCards.natureItem2">
                  No dia a dia, mantenho uma rotina de treinos e leitura para segurar foco e disciplina. Tento equilibrar o lado técnico com sono em dia, movimento e um pouco de calma no meio do caos.
                </li>
              </ul>
            </article>

            <!-- Café & Hobbies -->
            <article class="about-me__card">
              <h3 class="about-me__card-title" i18n="@@aboutCards.coffeeTitle">Café &amp; Hobbies</h3>
              <ul class="about-me__card-list">
                <li i18n="@@aboutCards.coffeeItem1">
                  O café acabou virando bem mais do que uma bebida pra mim: é uma forma de conexão. Gosto de preparar café pra galera, trocar ideia em volta da xícara e ver como isso aproxima as pessoas. Tem muito de amor, união e até de networking aí no meio: algumas das melhores conversas e oportunidades que tive começaram com um "bora tomar um café?".
                </li>
              </ul>
            </article>
          </div>

          <!-- Media grid -->
          <div class="about-me__media">
            <h4 class="about-me__media-title" i18n="@@media.title">Alguns registros</h4>
            <div class="about-me__media-grid">

              <figure
                class="about-me__figure"
                role="button"
                tabindex="0"
                (click)="gallery.open('scout')"
                (keydown)="onFigureKey($event, 'scout')"
              >
                <div class="about-me__figure-placeholder about-me__figure-placeholder--scout"></div>
                <figcaption i18n="@@media.scoutCaption">Escotismo &amp; atividades</figcaption>
              </figure>

              <figure
                class="about-me__figure"
                role="button"
                tabindex="0"
                (click)="gallery.open('tech')"
                (keydown)="onFigureKey($event, 'tech')"
              >
                <div class="about-me__figure-placeholder about-me__figure-placeholder--tech"></div>
                <figcaption i18n="@@media.techCaption">Tecnologia &amp; comunidade</figcaption>
              </figure>
            </div>
            <p class="about-me__media-note" i18n="@@media.note">
              Clique em cada tema para ver as fotos em tela cheia.
            </p>
          </div>
        </div>
      }
    </section>
  `,
  styleUrl: './about-me.scss',
})
export class AboutMe implements OnInit {
  private readonly storage = inject(StorageService);
  readonly gallery = inject(GalleryService);

  readonly open = signal(false);

  ngOnInit(): void {
    const stored = this.storage.getLocal(STORAGE_KEY);
    if (stored === 'true') {
      this.open.set(true);
    }
  }

  toggle(): void {
    this.open.set(!this.open());
    this.storage.setLocal(STORAGE_KEY, String(this.open()));
  }

  onFigureKey(event: KeyboardEvent, group: 'scout' | 'tech'): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.gallery.open(group);
    }
  }
}
