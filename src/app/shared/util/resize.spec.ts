import { clampFraction, resizeStack, isValidSizes, MIN_FRACTION, KEY_STEP } from './resize';

describe('clampFraction', () => {
  it('clamps below min and above max, passes through inside', () => {
    expect(clampFraction(0.05, 0.15, 0.85)).toBe(0.15);
    expect(clampFraction(0.95, 0.15, 0.85)).toBe(0.85);
    expect(clampFraction(0.5, 0.15, 0.85)).toBe(0.5);
  });
});

describe('resizeStack', () => {
  it('moves fraction between the adjacent pair, preserving the sum', () => {
    const out = resizeStack([0.5, 0.5], 0, 0.1);
    expect(out[0]).toBeCloseTo(0.6);
    expect(out[1]).toBeCloseTo(0.4);
    expect(out[0] + out[1]).toBeCloseTo(1);
  });
  it('accepts negative delta (shrinks the first of the pair)', () => {
    const out = resizeStack([0.5, 0.5], 0, -0.2);
    expect(out[0]).toBeCloseTo(0.3);
    expect(out[1]).toBeCloseTo(0.7);
  });
  it('clamps so neither panel of the pair goes under min', () => {
    const out = resizeStack([0.5, 0.5], 0, 0.9, 0.15);
    expect(out[0]).toBeCloseTo(0.85);
    expect(out[1]).toBeCloseTo(0.15);
    const out2 = resizeStack([0.5, 0.5], 0, -0.9, 0.15);
    expect(out2[0]).toBeCloseTo(0.15);
    expect(out2[1]).toBeCloseTo(0.85);
  });
  it('does not touch panels outside the pair in a 3-stack', () => {
    const out = resizeStack([0.34, 0.33, 0.33], 0, 0.1);
    expect(out[2]).toBeCloseTo(0.33);
    expect(out[0] + out[1] + out[2]).toBeCloseTo(1);
  });
  it('resizes the second pair of a 3-stack', () => {
    const out = resizeStack([0.34, 0.33, 0.33], 1, 0.05);
    expect(out[0]).toBeCloseTo(0.34);
    expect(out[1]).toBeCloseTo(0.38);
    expect(out[2]).toBeCloseTo(0.28);
  });
  it('does not mutate the input array', () => {
    const input = [0.5, 0.5];
    resizeStack(input, 0, 0.1);
    expect(input[0]).toBe(0.5);
  });
});

describe('isValidSizes', () => {
  it('accepts arrays of the right length summing to ~1', () => {
    expect(isValidSizes([0.48, 0.52], 2)).toBe(true);
    expect(isValidSizes([0.34, 0.33, 0.33], 3)).toBe(true);
  });
  it('rejects wrong length, non-arrays, bad numbers and bad sums', () => {
    expect(isValidSizes([0.5, 0.5], 3)).toBe(false);
    expect(isValidSizes('nope', 2)).toBe(false);
    expect(isValidSizes([0.5, NaN], 2)).toBe(false);
    expect(isValidSizes([1.2, -0.2], 2)).toBe(false);
    expect(isValidSizes([0.3, 0.3], 2)).toBe(false);
  });
});

describe('constants', () => {
  it('exports the spec values', () => {
    expect(MIN_FRACTION).toBe(0.15);
    expect(KEY_STEP).toBe(0.02);
  });
});
