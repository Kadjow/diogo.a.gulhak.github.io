import { nextTabIndex } from './skills';

describe('nextTabIndex', () => {
  it('wraps right', () => expect(nextTabIndex(3, 'ArrowRight', 4)).toBe(0));
  it('wraps left', () => expect(nextTabIndex(0, 'ArrowLeft', 4)).toBe(3));
  it('Home → 0', () => expect(nextTabIndex(2, 'Home', 4)).toBe(0));
  it('End → last', () => expect(nextTabIndex(0, 'End', 4)).toBe(3));
  it('ignores other keys', () => expect(nextTabIndex(1, 'a', 4)).toBe(1));
});
