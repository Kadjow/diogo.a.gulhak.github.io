import { vi } from 'vitest';
import { debounce } from './debounce';

describe('debounce', () => {
  it('calls fn once after the delay, not per call', () => {
    vi.useFakeTimers();
    let calls = 0;
    const d = debounce(() => { calls++; }, 300);
    d(); d(); d();
    expect(calls).toBe(0);
    vi.advanceTimersByTime(300);
    expect(calls).toBe(1);
    vi.useRealTimers();
  });
  it('cancel() prevents a pending call', () => {
    vi.useFakeTimers();
    let calls = 0;
    const d = debounce(() => { calls++; }, 300);
    d();
    d.cancel();
    vi.advanceTimersByTime(300);
    expect(calls).toBe(0);
    vi.useRealTimers();
  });
});
