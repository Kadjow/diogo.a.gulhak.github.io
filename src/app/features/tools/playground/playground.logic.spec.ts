import {
  buildSrcdoc, buildExportDoc, formatConsoleArg, CONSOLE_BOOTSTRAP, VIEWPORTS, DEFAULT_SNIPPET,
  DEFAULT_LAYOUT, MODE_OPTIONS, VIEWPORT_OPTIONS,
} from './playground.logic';

describe('buildSrcdoc', () => {
  it('embeds css, html, bootstrap and user js in order', () => {
    const doc = buildSrcdoc('<h1>hi</h1>', 'h1{color:red}', 'var UNIQUE_USER_JS=1;');
    expect(doc.includes('<style>h1{color:red}</style>')).toBe(true);
    expect(doc.includes('<h1>hi</h1>')).toBe(true);
    expect(doc.includes(CONSOLE_BOOTSTRAP)).toBe(true);
    expect(doc.includes('var UNIQUE_USER_JS=1;')).toBe(true);
    // bootstrap must come before the user js so early logs are captured
    expect(doc.indexOf(CONSOLE_BOOTSTRAP) < doc.indexOf('var UNIQUE_USER_JS=1;')).toBe(true);
  });
});

describe('buildExportDoc', () => {
  it('embeds the three parts but NOT the console bootstrap', () => {
    const doc = buildExportDoc('<p>x</p>', 'p{margin:0}', 'console.log(1)');
    expect(doc.includes('<p>x</p>')).toBe(true);
    expect(doc.includes('<style>p{margin:0}</style>')).toBe(true);
    expect(doc.includes('console.log(1)')).toBe(true);
    expect(doc.includes(CONSOLE_BOOTSTRAP)).toBe(false);
  });
});

describe('formatConsoleArg', () => {
  it('formats primitives', () => {
    expect(formatConsoleArg('hi')).toBe('hi');
    expect(formatConsoleArg(42)).toBe('42');
    expect(formatConsoleArg(true)).toBe('true');
    expect(formatConsoleArg(undefined)).toBe('undefined');
    expect(formatConsoleArg(null)).toBe('null');
  });
  it('formats objects, arrays and errors', () => {
    expect(formatConsoleArg({ a: 1 })).toBe('{"a":1}');
    expect(formatConsoleArg([1, 2])).toBe('[1,2]');
    expect(formatConsoleArg(new Error('boom'))).toBe('Error: boom');
  });
  it('does not throw on circular references', () => {
    const o: Record<string, unknown> = {};
    o['self'] = o;
    expect(() => formatConsoleArg(o)).not.toThrow();
  });
  it('formats functions', () => {
    expect(formatConsoleArg(function foo() { return undefined; })).toBe('ƒ foo()');
  });
});

describe('constants', () => {
  it('VIEWPORTS has desktop null, tablet 768, mobile 375', () => {
    expect(VIEWPORTS.desktop).toBe(null);
    expect(VIEWPORTS.tablet).toBe(768);
    expect(VIEWPORTS.mobile).toBe(375);
  });
  it('DEFAULT_SNIPPET has all three parts as strings', () => {
    expect(typeof DEFAULT_SNIPPET.html).toBe('string');
    expect(typeof DEFAULT_SNIPPET.css).toBe('string');
    expect(typeof DEFAULT_SNIPPET.js).toBe('string');
  });
});

describe('segmented options', () => {
  it('expõe as opções na ordem da UI', () => {
    expect(MODE_OPTIONS).toEqual(['split', 'single']);
    expect(VIEWPORT_OPTIONS).toEqual(['desktop', 'tablet', 'mobile']);
  });
});

import {
  mergeToSingle, splitFromSingle, injectBootstrap, CONSOLE_BOOTSTRAP as BOOT,
} from './playground.logic';

const parse = (html: string): Document =>
  new DOMParser().parseFromString(html, 'text/html');

describe('mergeToSingle', () => {
  it('embeds css in <style>, html in body and js in <script>', () => {
    const doc = mergeToSingle('<h1>hi</h1>', 'h1{color:red}', 'var X=1;');
    expect(doc.includes('<style>h1{color:red}</style>')).toBe(true);
    expect(doc.includes('<h1>hi</h1>')).toBe(true);
    expect(doc.includes('<script>var X=1;</script>')).toBe(true);
    expect(doc.indexOf('<style>') < doc.indexOf('var X=1;')).toBe(true);
  });
});

describe('splitFromSingle', () => {
  it('extracts css from all <style> blocks', () => {
    const doc = '<style>a{color:red}</style><style>b{color:blue}</style><p>x</p>';
    expect(splitFromSingle(doc, parse).css).toBe('a{color:red}\nb{color:blue}');
  });
  it('extracts js only from <script> without src', () => {
    const doc = '<script src="x.js"></script><script>var Y=2;</script><p>x</p>';
    expect(splitFromSingle(doc, parse).js).toBe('var Y=2;');
  });
  it('returns body html without style/script tags', () => {
    const doc = '<style>a{}</style><p>keep</p><script>1</script>';
    const out = splitFromSingle(doc, parse);
    expect(out.html.includes('<p>keep</p>')).toBe(true);
    expect(out.html.includes('<style')).toBe(false);
    expect(out.html.includes('<script')).toBe(false);
  });
  it('round-trips merge -> split for typical content', () => {
    const merged = mergeToSingle('<h1>hi</h1>', 'h1{color:red}', 'var X=1;');
    const out = splitFromSingle(merged, parse);
    expect(out.html).toBe('<h1>hi</h1>');
    expect(out.css).toBe('h1{color:red}');
    expect(out.js).toBe('var X=1;');
  });
});

describe('DEFAULT_LAYOUT', () => {
  it('has the spec fractions, each axis summing to 1', () => {
    expect(DEFAULT_LAYOUT.cols).toEqual([0.48, 0.52]);
    expect(DEFAULT_LAYOUT.out).toEqual([0.62, 0.38]);
    expect(DEFAULT_LAYOUT.editors).toEqual([0.34, 0.33, 0.33]);
  });
});

describe('injectBootstrap', () => {
  it('injects the bootstrap right after <head>', () => {
    const out = injectBootstrap('<!doctype html><html><head></head><body></body></html>');
    expect(out.includes(BOOT)).toBe(true);
    expect(out.indexOf('<head>') < out.indexOf(BOOT)).toBe(true);
    expect(out.indexOf(BOOT) < out.indexOf('<body>')).toBe(true);
  });
  it('falls back to after <html> when no <head>', () => {
    const out = injectBootstrap('<html><body>x</body></html>');
    expect(out.includes(BOOT)).toBe(true);
    expect(out.indexOf('<html>') < out.indexOf(BOOT)).toBe(true);
  });
  it('prepends when neither head nor html present', () => {
    const out = injectBootstrap('<p>x</p>');
    expect(out.startsWith('<script>')).toBe(true);
    expect(out.includes(BOOT)).toBe(true);
  });
});
