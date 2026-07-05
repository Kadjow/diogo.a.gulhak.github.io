import { Routes } from '@angular/router';
export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/portfolio/portfolio').then(m => m.Portfolio) },
  { path: 'tools', loadComponent: () => import('./features/tools/tools-hub/tools-hub').then(m => m.ToolsHub) },
  {
    path: 'tools/hash',
    loadComponent: () => import('./features/tools/hash/hash').then(m => m.HashTool),
  },
  {
    path: 'tools/json-tools',
    loadComponent: () => import('./features/tools/json-tools/json-tools').then(m => m.JsonTools),
  },
  {
    path: 'tools/html-markdown-render',
    loadComponent: () =>
      import('./features/tools/html-markdown-render/html-markdown-render').then(m => m.HtmlMarkdownRender),
  },
];
