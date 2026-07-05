import { digestHex, HASH_ALGOS } from './hash.logic';

describe('digestHex', () => {
  it('lists the four supported algos', () => {
    expect(HASH_ALGOS).toEqual(['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512']);
  });
  it('computes SHA-256 of "abc" (known vector)', async () => {
    const hex = await digestHex('SHA-256', 'abc');
    expect(hex).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });
  it('computes SHA-1 of "abc" (known vector)', async () => {
    const hex = await digestHex('SHA-1', 'abc');
    expect(hex).toBe('a9993e364706816aba3e25717850c26c9cd0d89d');
  });
  it('returns empty string for empty input', async () => {
    expect(await digestHex('SHA-256', '')).toBe('');
  });
});
