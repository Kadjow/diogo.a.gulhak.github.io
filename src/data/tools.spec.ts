import { TOOLS, toolsByGroup, ToolMeta } from './tools';

describe('TOOLS catalog', () => {
  it('has unique slugs', () => {
    const slugs = TOOLS.map(t => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
  it('slugs are url-safe kebab', () => {
    for (const t of TOOLS) {
      expect(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(t.slug)).toBe(true);
    }
  });
  it('marks the three MVP tools live, rest soon', () => {
    const live = TOOLS.filter(t => t.status === 'live').map(t => t.slug).sort();
    expect(live).toEqual(['hash', 'html-markdown-render', 'json-tools']);
  });
});

describe('toolsByGroup', () => {
  it('groups in fixed order dev, media, text', () => {
    const sample: ToolMeta[] = [
      { slug: 'a', name: 'A', description: '', group: 'text', icon: '', status: 'soon' },
      { slug: 'b', name: 'B', description: '', group: 'dev', icon: '', status: 'live' },
    ];
    const groups = toolsByGroup(sample).map(g => g.group);
    expect(groups).toEqual(['dev', 'text']);
  });
});
