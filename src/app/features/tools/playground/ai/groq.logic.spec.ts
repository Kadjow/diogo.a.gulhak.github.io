import {
  formatContext, buildMessages, buildRequestBody, parseResponse, describeError,
  GROQ_MODEL, CONSOLE_TAIL, PlaygroundContext,
} from './groq.logic';

const ctx: PlaygroundContext = {
  html: '<h1>hi</h1>', css: 'h1{color:red}', js: 'console.log(1)', console: ['[log] 1'],
};

describe('formatContext', () => {
  it('includes html, css and js', () => {
    const out = formatContext(ctx);
    expect(out.includes('<h1>hi</h1>')).toBe(true);
    expect(out.includes('h1{color:red}')).toBe(true);
    expect(out.includes('console.log(1)')).toBe(true);
  });
  it('keeps only the last CONSOLE_TAIL console lines', () => {
    const many = Array.from({ length: CONSOLE_TAIL + 5 }, (_, i) => `[log] ${i}`);
    const out = formatContext({ ...ctx, console: many });
    expect(out.includes(`[log] ${CONSOLE_TAIL + 4}`)).toBe(true);
    expect(out.includes('[log] 0')).toBe(false);
  });
  it('handles empty console', () => {
    expect(() => formatContext({ ...ctx, console: [] })).not.toThrow();
  });
});

describe('buildMessages', () => {
  it('orders system then user, user carrying context + message', () => {
    const msgs = buildMessages('SYS', ctx, 'why red?');
    expect(msgs[0].role).toBe('system');
    expect(msgs[0].content).toBe('SYS');
    expect(msgs[1].role).toBe('user');
    expect(msgs[1].content.includes('why red?')).toBe(true);
    expect(msgs[1].content.includes('<h1>hi</h1>')).toBe(true);
  });
});

describe('buildRequestBody', () => {
  it('uses the model and carries the messages', () => {
    const body = buildRequestBody(buildMessages('SYS', ctx, 'hi'));
    expect(body.model).toBe(GROQ_MODEL);
    expect(body.messages.length).toBe(2);
    expect(typeof body.temperature).toBe('number');
  });
});

describe('parseResponse', () => {
  it('extracts the assistant content', () => {
    const json = { choices: [{ message: { role: 'assistant', content: 'hello' } }] };
    expect(parseResponse(json)).toBe('hello');
  });
  it('throws when choices are missing', () => {
    expect(() => parseResponse({})).toThrow();
    expect(() => parseResponse({ choices: [] })).toThrow();
  });
});

describe('describeError', () => {
  it('maps status codes to error kinds', () => {
    expect(describeError(401)).toBe('invalid-key');
    expect(describeError(429)).toBe('rate-limit');
    expect(describeError(500)).toBe('server');
    expect(describeError(503)).toBe('server');
    expect(describeError(418)).toBe('unknown');
  });
});
