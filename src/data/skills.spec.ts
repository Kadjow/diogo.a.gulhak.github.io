import { SKILL_GROUPS } from './skills';

describe('SKILL_GROUPS data', () => {
  it('has groups with unique ids and non-empty labels', () => {
    expect(SKILL_GROUPS.length).toBeGreaterThan(0);
    const ids = SKILL_GROUPS.map(g => g.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const g of SKILL_GROUPS) {
      expect(g.id).toBeTruthy();
      expect(g.label).toBeTruthy();
    }
  });
  it('every group has icons with class and title', () => {
    for (const g of SKILL_GROUPS) {
      expect(g.icons.length).toBeGreaterThan(0);
      for (const icon of g.icons) {
        expect(icon.cls).toBeTruthy();
        expect(icon.title).toBeTruthy();
      }
    }
  });
});
