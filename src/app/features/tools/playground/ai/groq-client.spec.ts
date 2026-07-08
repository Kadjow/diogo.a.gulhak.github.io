import { GroqClient, FetchFn } from './groq-client';

function fakeFetch(status: number, payload: unknown): FetchFn {
  return () =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(payload),
    });
}

describe('GroqClient.send', () => {
  it('resolves with the assistant content on success', async () => {
    const client = new GroqClient();
    const ok = fakeFetch(200, { choices: [{ message: { content: 'hi there' } }] });
    await expect(client.send('key', {}, ok)).resolves.toBe('hi there');
  });
  it('rejects with invalid-key on 401', async () => {
    const client = new GroqClient();
    await expect(client.send('bad', {}, fakeFetch(401, {}))).rejects.toThrow('invalid-key');
  });
  it('rejects with rate-limit on 429', async () => {
    const client = new GroqClient();
    await expect(client.send('key', {}, fakeFetch(429, {}))).rejects.toThrow('rate-limit');
  });
});
