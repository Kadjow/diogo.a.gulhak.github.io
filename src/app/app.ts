import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/theme.service';
import { Header } from './layout/header/header';
import { Footer } from './layout/footer/footer';
import { Splash } from './layout/splash/splash';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Header, Footer, Splash],
  template: `
    <app-splash />
    <app-header />
    <router-outlet />
    <app-footer />
  `,
})
export class App {
  constructor() { inject(ThemeService).init(); }
}
