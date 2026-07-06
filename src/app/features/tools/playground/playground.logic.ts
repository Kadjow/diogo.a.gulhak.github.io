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
