import { EXPERIENCE } from './experience';

describe('EXPERIENCE data', () => {
  it('has items with a title and at least one bullet', () => {
    expect(EXPERIENCE.length).toBeGreaterThan(0);
    for (const item of EXPERIENCE) {
      expect(item.title).toBeTruthy();
      expect(item.bullets.length).toBeGreaterThan(0);
      for (const b of item.bullets) expect(b).toBeTruthy();
    }
  });
});
