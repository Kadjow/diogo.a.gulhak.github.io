import { nextTypingState } from './hero';

describe('nextTypingState', () => {
  const phrases = ['ab', 'cd'];
  it('types forward one char', () => {
    const s = nextTypingState({ phraseIndex: 0, charIndex: 0, deleting: false }, phrases);
    expect(s.text).toBe('a'); expect(s.charIndex).toBe(1);
  });
  it('starts deleting after full word', () => {
    const s = nextTypingState({ phraseIndex: 0, charIndex: 2, deleting: false }, phrases);
    expect(s.deleting).toBe(true);
  });
  it('advances to next phrase after fully deleting', () => {
    const s = nextTypingState({ phraseIndex: 0, charIndex: 0, deleting: true }, phrases);
    expect(s.phraseIndex).toBe(1); expect(s.deleting).toBe(false);
  });
});
