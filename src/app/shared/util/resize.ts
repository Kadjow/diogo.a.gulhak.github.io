/** Minimum fraction any resizable panel may occupy. */
export const MIN_FRACTION = 0.15;

/** Fraction step applied per arrow-key press on a resize handle. */
export const KEY_STEP = 0.02;

export function clampFraction(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Moves `delta` (fraction of the whole stack) from panel `index+1` to panel
 * `index`. Only the adjacent pair changes; the total sum is preserved and
 * neither panel of the pair goes below `min`.
 */
export function resizeStack(
  sizes: number[],
  index: number,
  delta: number,
  min = MIN_FRACTION,
): number[] {
  const pair = sizes[index] + sizes[index + 1];
  const first = clampFraction(sizes[index] + delta, min, pair - min);
  const next = sizes.slice();
  next[index] = first;
  next[index + 1] = pair - first;
  return next;
}

/** Validates layout fractions restored from storage. */
export function isValidSizes(value: unknown, length: number): value is number[] {
  if (!Array.isArray(value) || value.length !== length) return false;
  if (!value.every(v => typeof v === 'number' && Number.isFinite(v) && v > 0 && v < 1)) {
    return false;
  }
  const sum = value.reduce((a, b) => a + b, 0);
  return Math.abs(sum - 1) < 0.01;
}
