import {
  formatJson, minifyJson, sortJson, validateJson, jsonStats, errorToLineCol,
} from './json.logic';
import { repairJson, transformJson } from './json.logic';

describe('formatJson', () => {
  it('pretty-prints valid JSON with the given indent', () => {
    const r = formatJson('{"a":1}', 2);
    expect(r.ok).toBe(true);
    expect(r.output).toBe('{\n  "a": 1\n}');
    expect(r.error).toBe(null);
  });
  it('reports an error for invalid JSON', () => {
    const r = formatJson('{a:1}', 2);
    expect(r.ok).toBe(false);
    expect(r.output).toBe('');
    expect(typeof r.error).toBe('string');
    expect(r.error!.length > 0).toBe(true);
  });
  it('treats empty input as ok with empty output', () => {
    const r = formatJson('   ', 2);
    expect(r.ok).toBe(true);
    expect(r.output).toBe('');
  });
});

describe('minifyJson', () => {
  it('removes whitespace from valid JSON', () => {
    const r = minifyJson('{\n  "a": 1\n}');
    expect(r.ok).toBe(true);
    expect(r.output).toBe('{"a":1}');
  });
  it('reports an error for invalid JSON', () => {
    const r = minifyJson('nope');
    expect(r.ok).toBe(false);
  });
});

describe('sortJson', () => {
  it('orders object keys recursively, preserving array order', () => {
    const r = sortJson('{"b":1,"a":{"d":2,"c":3},"list":[3,1,2]}', 2);
    expect(r.ok).toBe(true);
    expect(r.output).toBe('{\n  "a": {\n    "c": 3,\n    "d": 2\n  },\n  "b": 1,\n  "list": [\n    3,\n    1,\n    2\n  ]\n}');
  });
  it('reports an error for invalid JSON', () => {
    expect(sortJson('{bad}', 2).ok).toBe(false);
  });
});

describe('validateJson', () => {
  it('returns null for valid JSON', () => {
    expect(validateJson('{"a":1}')).toBe(null);
  });
  it('returns null for empty input', () => {
    expect(validateJson('   ')).toBe(null);
  });
  it('returns an error with a 1-based line/col for invalid JSON', () => {
    const err = validateJson('{\n  "a" 1\n}');
    expect(err !== null).toBe(true);
    expect(typeof err!.message).toBe('string');
    expect(err!.line >= 1).toBe(true);
    expect(err!.col >= 1).toBe(true);
  });
});

describe('errorToLineCol', () => {
  it('maps a character offset to 1-based line and column', () => {
    expect(errorToLineCol('ab\ncd', 4)).toEqual({ line: 2, col: 2 });
  });
  it('clamps a position beyond the text length', () => {
    expect(errorToLineCol('ab', 99)).toEqual({ line: 1, col: 3 });
  });
});

describe('jsonStats', () => {
  it('counts bytes, lines and nodes of valid JSON', () => {
    expect(jsonStats('{"a":1}')).toEqual({ bytes: 7, lines: 1, nodes: 2 });
  });
  it('reports zero nodes for invalid JSON but still counts bytes/lines', () => {
    const s = jsonStats('a\nb');
    expect(s.nodes).toBe(0);
    expect(s.lines).toBe(2);
    expect(s.bytes).toBe(3);
  });
  it('treats empty text as zero lines and zero nodes', () => {
    expect(jsonStats('')).toEqual({ bytes: 0, lines: 0, nodes: 0 });
  });
});

describe('repairJson', () => {
  it('repairs common invalid JSON (unquoted keys, trailing comma)', () => {
    const r = repairJson("{a: 1, b: 'x',}", 2);
    expect(r.ok).toBe(true);
    expect(r.output).toBe('{\n  "a": 1,\n  "b": "x"\n}');
  });
  it('treats empty input as ok/empty', () => {
    expect(repairJson('   ', 2)).toEqual({ ok: true, output: '', error: null });
  });
});

describe('transformJson', () => {
  it('applies a JMESPath query and pretty-prints the result', () => {
    const r = transformJson('{"people":[{"name":"Ann"},{"name":"Bob"}]}', 'people[*].name', 2);
    expect(r.ok).toBe(true);
    expect(r.output).toBe('[\n  "Ann",\n  "Bob"\n]');
  });
  it('empty query yields ok/empty output', () => {
    expect(transformJson('{"a":1}', '  ', 2)).toEqual({ ok: true, output: '', error: null });
  });
  it('reports an error for an invalid query', () => {
    expect(transformJson('{"a":1}', 'a[', 2).ok).toBe(false);
  });
  it('reports an error when input JSON is invalid', () => {
    expect(transformJson('{bad}', 'a', 2).ok).toBe(false);
  });
});
