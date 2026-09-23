/* Split-flap shared bits: the character drum and a registry so printing can
   settle every heading at once (a heading must never print mid-flip). */
export const FLAP_CHARS = ' ABCDEFGHIJKLMNOPQRSTUVWXYZÇĞİÖŞÜ0123456789·–&';

const settlers = new Set<() => void>();
export function registerSettle(fn: () => void) { settlers.add(fn); return () => { settlers.delete(fn); }; }
export function settleAllFlaps() { settlers.forEach(fn => fn()); }
