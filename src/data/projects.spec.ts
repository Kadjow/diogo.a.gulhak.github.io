import { PROJECTS } from './projects';

describe('PROJECTS data', () => {
  it('has 10 projects with required fields', () => {
    expect(PROJECTS.length).toBe(10);
    for (const p of PROJECTS) {
      expect(p.slug).toBeTruthy();
      expect(p.githubUrl).toMatch(/^https:\/\/github\.com\//);
      expect(p.techs.length).toBeGreaterThan(0);
    }
  });
  it('only uses known techs', () => {
    const known = new Set(['flutter','react-native','web']);
    for (const p of PROJECTS) for (const t of p.techs) expect(known.has(t)).toBe(true);
  });
});
