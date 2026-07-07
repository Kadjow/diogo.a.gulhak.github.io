import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  template: `
    <footer class="site-footer">
      <div class="container">
        <p class="footer-copy">&copy; {{ year }} Diogo Arthur Gulhak</p>
      </div>
    </footer>`,
  styles: [`
    .site-footer {
      border-top: 1px solid var(--border);
      padding: 24px 0;
      background: var(--bg);
    }
    .footer-copy {
      font-size: 0.8125rem;
      color: var(--muted);
      margin: 0;
      text-align: center;
    }
  `],
})
export class Footer {
  readonly year = new Date().getFullYear();
}
