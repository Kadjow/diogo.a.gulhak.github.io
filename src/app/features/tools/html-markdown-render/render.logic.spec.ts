import { sanitizeHtml, renderMarkdown } from './render.logic';

describe('sanitizeHtml', () => {
  it('delegates to the injected purifier', () => {
    const purify = { sanitize: (s: string) => s.replace(/<script>.*?<\/script>/g, '') };
    expect(sanitizeHtml('<b>x</b><script>evil()</script>', purify)).toBe('<b>x</b>');
  });
});

describe('renderMarkdown', () => {
  it('renders headings and emphasis to HTML', async () => {
    const html = await renderMarkdown('# Hi\n\n**bold**');
    expect(html.includes('<h1')).toBe(true);
    expect(html.includes('<strong>bold</strong>')).toBe(true);
  });
  it('returns empty string for empty input', async () => {
    expect(await renderMarkdown('')).toBe('');
  });
});
