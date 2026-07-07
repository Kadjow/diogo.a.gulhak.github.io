import { Component, PLATFORM_ID, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';
import { ToolShell } from '../../../shared/ui/tool-shell/tool-shell';
import { HASH_ALGOS, HashAlgo, digestHex } from './hash.logic';

@Component({
  selector: 'app-hash-tool',
  standalone: true,
  imports: [FormsModule, ToolShell],
  template: `
    <app-tool-shell
      [title]="titleText"
      [description]="descText">
      <label class="field-label" for="hash-in" i18n="@@tools.hash.inputLabel">Texto</label>
      <textarea
        id="hash-in"
        class="field"
        rows="5"
        [ngModel]="input()"
        (ngModelChange)="onInput($event)"
        [attr.placeholder]="placeholderText"></textarea>

      <div class="results">
        @for (algo of algos; track algo) {
          <div class="result-row">
            <span class="result-algo">{{ algo }}</span>
            <code class="result-hex">{{ hashes()[algo] }}</code>
          </div>
        }
      </div>
    </app-tool-shell>
  `,
  styleUrl: './hash.scss',
})
export class HashTool {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly algos = HASH_ALGOS;
  readonly input = signal('');
  readonly hashes = signal<Record<HashAlgo, string>>({
    'SHA-1': '', 'SHA-256': '', 'SHA-384': '', 'SHA-512': '',
  });

  readonly titleText = $localize`:@@tools.hash.name:Gerador de Hash`;
  readonly descText = $localize`:@@tools.hash.desc:SHA-1, SHA-256, SHA-384 e SHA-512 de um texto.`;
  readonly placeholderText = $localize`:@@tools.hash.placeholder:Digite o texto…`;

  onInput(value: string): void {
    this.input.set(value);
    if (!this.isBrowser) return;
    void this.recompute(value);
  }

  private async recompute(value: string): Promise<void> {
    const entries = await Promise.all(
      this.algos.map(async algo => [algo, await digestHex(algo, value)] as const),
    );
    this.hashes.set(Object.fromEntries(entries) as Record<HashAlgo, string>);
  }
}
