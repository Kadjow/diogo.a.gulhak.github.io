import { formatJson, minifyJson } from './json.logic';

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
