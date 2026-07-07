export type Viewport = 'desktop' | 'tablet' | 'mobile';

export interface ConsoleLine {
  level: 'log' | 'info' | 'warn' | 'error';
  text: string;
}

export interface Snippet {
  html: string;
  css: string;
  js: string;
}

export const VIEWPORTS: Record<Viewport, number | null> = {
  desktop: null,
  tablet: 768,
  mobile: 375,
};

export const DEFAULT_SNIPPET: Snippet = {
  html: '<h1>Olá 👋</h1>\n<p>Edite HTML, CSS e JS ao lado.</p>',
  css: 'body { font-family: system-ui, sans-serif; padding: 1rem; }\nh1 { color: #2563eb; }',
  js: "console.log('Playground pronto');",
};

export function formatConsoleArg(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }
  if (typeof value === 'function') {
    return `ƒ ${(value as { name?: string }).name || 'anonymous'}()`;
  }
  if (value instanceof Error) return `${value.name}: ${value.message}`;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

// Injected INSIDE the sandboxed iframe. Cannot reference anything from the parent.
// Overrides console.* and error events, serializes args, postMessages to the parent.
export const CONSOLE_BOOTSTRAP = [
  '(function(){',
  'var ser=function(v){try{',
  "if(typeof v==='string')return v;",
  "if(v instanceof Error)return v.name+': '+v.message;",
  "if(typeof v==='function')return 'ƒ '+(v.name||'anonymous')+'()';",
  "if(typeof v==='object'&&v!==null)return JSON.stringify(v);",
  'return String(v);',
  '}catch(e){return String(v);}};',
  'var send=function(level,args){try{parent.postMessage({__pg:true,level:level,',
  "text:Array.prototype.map.call(args,ser).join(' ')},'*');}catch(e){}};",
  "['log','info','warn','error'].forEach(function(m){var o=console[m];",
  'console[m]=function(){send(m,arguments);try{o.apply(console,arguments);}catch(e){}};});',
  "window.addEventListener('error',function(e){send('error',[e.message]);});",
  "window.addEventListener('unhandledrejection',function(e){send('error',[String(e.reason)]);});",
  '})();',
].join('');

export function buildSrcdoc(html: string, css: string, js: string): string {
  return (
    '<!doctype html><html><head><meta charset="utf-8">' +
    `<style>${css}</style></head><body>${html}` +
    `<script>${CONSOLE_BOOTSTRAP}</script>` +
    `<script>${js}</script></body></html>`
  );
}

export function buildExportDoc(html: string, css: string, js: string): string {
  return (
    '<!doctype html><html><head><meta charset="utf-8">' +
    `<style>${css}</style></head><body>${html}` +
    `<script>${js}</script></body></html>`
  );
}

export type PlaygroundMode = 'split' | 'single';

export type DomParse = (html: string) => Document;

export function mergeToSingle(html: string, css: string, js: string): string {
  return buildExportDoc(html, css, js);
}

export function splitFromSingle(doc: string, parse: DomParse): Snippet {
  const parsed = parse(doc);
  const css = Array.from(parsed.querySelectorAll('style'))
    .map(el => el.textContent ?? '')
    .join('\n')
    .trim();
  const js = Array.from(parsed.querySelectorAll('script'))
    .filter(el => !el.hasAttribute('src'))
    .map(el => el.textContent ?? '')
    .join('\n')
    .trim();
  parsed.querySelectorAll('style, script').forEach(el => el.remove());
  const html = (parsed.body?.innerHTML ?? parsed.documentElement?.innerHTML ?? '').trim();
  return { html, css, js };
}

/** Panel fractions per resizable axis. Each array sums to 1. */
export interface PlaygroundLayout {
  cols: number[];
  out: number[];
  editors: number[];
}

export const DEFAULT_LAYOUT: PlaygroundLayout = {
  cols: [0.48, 0.52],
  out: [0.62, 0.38],
  editors: [0.34, 0.33, 0.33],
};

export function injectBootstrap(doc: string): string {
  const script = `<script>${CONSOLE_BOOTSTRAP}</script>`;
  const head = doc.match(/<head[^>]*>/i);
  if (head) return doc.replace(head[0], head[0] + script);
  const html = doc.match(/<html[^>]*>/i);
  if (html) return doc.replace(html[0], html[0] + script);
  return script + doc;
}
