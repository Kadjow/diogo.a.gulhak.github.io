import {
  buildSrcdoc, buildExportDoc, formatConsoleArg, CONSOLE_BOOTSTRAP, VIEWPORTS, DEFAULT_SNIPPET,
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
