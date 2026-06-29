import { Component, inject } from '@angular/core';
import { Modal } from '../../../shared/ui/modal/modal';
import { UiStateService } from '../../../core/ui-state.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [Modal],
  template: `
    <app-modal [open]="ui.contactOpen()" (close)="ui.contactOpen.set(false)" labelledby="contactTitle">
      <h2 id="contactTitle" i18n="@@contact.title">Vamos conversar?</h2>
      <p class="muted" i18n="@@contact.subtitle">Escolha o melhor canal para falar comigo.</p>

      <ul class="contact-list">
        <li class="contact-item">
          <a href="mailto:dgulhak@gmail.com?subject=Contato%20via%20Portf%C3%B3lio"
             class="contact-link">
            <span class="contact-icon">✉️</span>
            <div>
              <strong>dgulhak@gmail.com</strong>
            </div>
          </a>
        </li>
        <li class="contact-item">
          <a href="https://wa.me/5545998549198?text=Ol%C3%A1%20Diogo%21%20Vim%20do%20seu%20portf%C3%B3lio."
             target="_blank"
             rel="noopener"
             class="contact-link">
            <span class="contact-icon">💬</span>
            <div>
              <strong i18n="@@contact.whatsappLabel">WhatsApp</strong>
              <span i18n="@@contact.whatsappSubtitle">Mensagem rápida</span>
            </div>
          </a>
        </li>
        <li class="contact-item">
          <a href="https://www.linkedin.com/in/diogo-arthur-gulhak-0bbaa0273/"
             target="_blank"
             rel="noopener"
             class="contact-link">
            <span class="contact-icon">💼</span>
            <div>
              <strong i18n="@@contact.linkedinLabel">LinkedIn</strong>
              <span i18n="@@contact.linkedinSubtitle">Conectar ou enviar mensagem</span>
            </div>
          </a>
        </li>
      </ul>
    </app-modal>
  `,
  styleUrl: './contact.scss',
})
export class Contact {
  readonly ui = inject(UiStateService);
}
