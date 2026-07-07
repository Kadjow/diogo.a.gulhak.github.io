/** Pure keyboard-navigation helper for a roving-tabindex tablist (WAI-ARIA). */
export function nextTabIndex(current: number, key: string, len: number): number {
  switch (key) {
    case 'ArrowRight': return (current + 1) % len;
    case 'ArrowLeft':  return (current - 1 + len) % len;
    case 'Home':       return 0;
    case 'End':        return len - 1;
    default:           return current;
  }
}
