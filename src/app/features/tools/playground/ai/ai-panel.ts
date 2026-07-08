import {
  Component, Input, PLATFORM_ID, inject, signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';
import { StorageService } from '../../../../core/storage.service';
import { GROQ_KEY } from '../../../../core/storage-keys';
import { GroqClient } from './groq-client';
import { buildMessages, buildRequestBody, PlaygroundContext, GroqError } from './groq.logic';
import { renderMarkdown, sanitizeHtml } from '../../markdown-preview/render.logic';

interface Bubble { role: 'user' | 'assistant'; html: string; raw: string }

@Component({
  selector: 'app-ai-panel',
  standalone: true,
  imports: [FormsModule],
  template: `
    <details class="ai" [open]="open()">
      <summary class="ai-summary" (click)="toggle($event)">
        <span i18n="@@tools.playground.ai.title">Assistente de IA</span>
      </summary>

      <div class="ai-body">
        @if (!hasKey()) {
          <div class="ai-keyrow">
            <input class="ai-key" type="password" autocomplete="off" [ngModel]="keyInput()"
              (ngModelChange)="keyInput.set($event)"
              [attr.placeholder]="keyPlaceholder" [attr.aria-label]="keyPlaceholder" />
            <button type="button" class="ai-btn" (click)="saveKey()"
              i18n="@@tools.playground.ai.saveKey">Salvar chave</button>
          </div>
          <p class="ai-hint">
            <span i18n="@@tools.playground.ai.keyHint">Sua chave fica só neste dispositivo.</span>
            <a href="https://console.groq.com/keys" target="_blank" rel="noopener"
              i18n="@@tools.playground.ai.getKey">Criar chave grátis</a>
          </p>
        } @else {
          <div class="ai-actions">
            <button type="button" class="ai-chip" (click)="quick('explain')" [disabled]="busy()"
              i18n="@@tools.playground.ai.explain">Explicar código</button>
            <button type="button" class="ai-chip" (click)="quick('fix')" [disabled]="busy()"
              i18n="@@tools.playground.ai.fix">Corrigir erros</button>
            <button type="button" class="ai-chip ai-clearkey" (click)="clearKey()" [disabled]="busy()"
              i18n="@@tools.playground.ai.clearKey">Trocar chave</button>
          </div>

          <div class="ai-messages">
            @for (m of bubbles(); track $index) {
              <div class="ai-msg" [class.user]="m.role === 'user'">
                <div [innerHTML]="m.html"></div>
                @if (m.role === 'assistant') {
                  <button type="button" class="ai-copy" (click)="copy(m.raw)"
                    i18n="@@tools.playground.ai.copy">Copiar</button>
                }
              </div>
            } @empty {
              <p class="ai-empty" i18n="@@tools.playground.ai.empty">Pergunte algo sobre seu código.</p>
            }
          </div>

          @if (error()) {
            <p class="ai-error">{{ errorText(error()!) }}</p>
          }

          <div class="ai-inputrow">
            <input class="ai-input" [ngModel]="input()" (ngModelChange)="input.set($event)"
              (keydown.enter)="send()" [disabled]="busy()"
              [attr.placeholder]="inputPlaceholder" [attr.aria-label]="inputPlaceholder" />
            <button type="button" class="ai-btn" (click)="send()" [disabled]="busy()"
              i18n="@@tools.playground.ai.send">Enviar</button>
          </div>
        }
      </div>
    </details>
  `,
  styleUrl: './ai-panel.scss',
})
export class AiPanel {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly storage = inject(StorageService);
  private readonly client = inject(GroqClient);

  @Input() context: () => PlaygroundContext = () => ({ html: '', css: '', js: '', console: [] });

  readonly open = signal(false);
  readonly keyInput = signal('');
  readonly hasKey = signal(false);
  readonly input = signal('');
  readonly bubbles = signal<Bubble[]>([]);
  readonly busy = signal(false);
  readonly error = signal<GroqError | null>(null);

  readonly keyPlaceholder = $localize`:@@tools.playground.ai.keyPlaceholder:Cole sua chave Groq`;
  readonly inputPlaceholder = $localize`:@@tools.playground.ai.inputPlaceholder:Pergunte sobre o código…`;
  private readonly systemPrompt = $localize`:@@tools.playground.ai.system:Você é um assistente de programação. O usuário está num playground HTML/CSS/JS. Responda em Markdown, focando no código e no console fornecidos.`;
  private readonly explainPrompt = $localize`:@@tools.playground.ai.explainPrompt:Explique o que este código faz.`;
  private readonly fixPrompt = $localize`:@@tools.playground.ai.fixPrompt:Aponte e corrija os erros deste código.`;

  private readonly errInvalid = $localize`:@@tools.playground.ai.errInvalid:Chave inválida. Confira e salve de novo.`;
  private readonly errRate = $localize`:@@tools.playground.ai.errRate:Limite atingido. Tente de novo em instantes.`;
  private readonly errServer = $localize`:@@tools.playground.ai.errServer:Erro no servidor da IA. Tente de novo.`;
  private readonly errUnknown = $localize`:@@tools.playground.ai.errUnknown:Falha ao falar com a IA.`;

  constructor() {
    if (this.isBrowser) this.hasKey.set(!!this.storage.getLocal(GROQ_KEY));
  }

  toggle(e: Event): void {
    e.preventDefault();
    this.open.update(v => !v);
  }

  saveKey(): void {
    const k = this.keyInput().trim();
    if (!k) return;
    this.storage.setLocal(GROQ_KEY, k);
    this.hasKey.set(true);
    this.keyInput.set('');
  }

  clearKey(): void {
    this.storage.setLocal(GROQ_KEY, '');
    this.hasKey.set(false);
    this.bubbles.set([]);
  }

  copy(text: string): void {
    if (this.isBrowser && navigator.clipboard) void navigator.clipboard.writeText(text);
  }

  quick(kind: 'explain' | 'fix'): void {
    this.input.set(kind === 'explain' ? this.explainPrompt : this.fixPrompt);
    void this.send();
  }

  errorText(kind: GroqError): string {
    if (kind === 'invalid-key') return this.errInvalid;
    if (kind === 'rate-limit') return this.errRate;
    if (kind === 'server') return this.errServer;
    return this.errUnknown;
  }

  async send(): Promise<void> {
    if (!this.isBrowser || this.busy()) return;
    const userMsg = this.input().trim();
    if (!userMsg) return;
    const key = this.storage.getLocal(GROQ_KEY);
    if (!key) { this.hasKey.set(false); return; }

    this.error.set(null);
    this.busy.set(true);
    this.input.set('');
    await this.pushBubble('user', userMsg);

    try {
      const messages = buildMessages(this.systemPrompt, this.context(), userMsg);
      const content = await this.client.send(key, buildRequestBody(messages));
      await this.pushBubble('assistant', content);
    } catch (e) {
      const kind = (e as Error).message as GroqError;
      this.error.set(
        kind === 'invalid-key' || kind === 'rate-limit' || kind === 'server' ? kind : 'unknown',
      );
    } finally {
      this.busy.set(false);
    }
  }

  private async pushBubble(role: 'user' | 'assistant', markdown: string): Promise<void> {
    const rendered = await renderMarkdown(markdown);
    const { default: DOMPurify } = await import('dompurify');
    const html = sanitizeHtml(rendered, DOMPurify);
    this.bubbles.update(list => [...list, { role, html, raw: markdown }]);
  }
}
