import { useEffect, useState } from 'react';
import { CONTENT } from '@/content/content.ts';
import { KEYS } from '@/lib/prefs.ts';
import { reduced } from '@/lib/motion.ts';
import { pixelRows } from '@/lib/pixelfont.ts';

const LINES = ['ALI EMRE', 'OZCAN'].flatMap((t, i) => (i ? [''] : []).concat(pixelRows(t)));
const CELLS: number[] = [];
LINES.forEach((r, y) => { for (let x = 0; x < r.length; x++) if (r[x] === '█') CELLS.push(y * 1000 + x); });

function shuffled() {
  const order = CELLS.slice();
  for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  return order;
}

/* "ALI EMRE / OZCAN" in the pixel font; pixels appear in random order over
   ~1.1s on the first visit of a tab session, instantly after that. */
export function Banner() {
  const [order] = useState(shuffled);
  const [n, setN] = useState(() => {
    let seen = false;
    try { seen = sessionStorage.getItem(KEYS.banner) === '1'; sessionStorage.setItem(KEYS.banner, '1'); } catch { /* private mode */ }
    return seen || reduced() ? order.length : 0;
  });
  useEffect(() => {
    if (n >= order.length) return;
    const step = Math.max(3, Math.ceil(order.length / 70));
    const t = setInterval(() => setN(k => { const next = Math.min(order.length, k + step); if (next >= order.length) clearInterval(t); return next; }), 16);
    return () => clearInterval(t);
  }, [n, order.length]);
  const on = new Set(order.slice(0, n));
  return (
    <div className="banner" role="img" aria-label={CONTENT.meta.name}>
      {LINES.map((r, y) => (
        <div key={y} style={{ color: `color-mix(in oklch, var(--prompt) ${Math.round(100 - (y / Math.max(1, LINES.length - 1)) * 70)}%, var(--bar-muted))` }}>
          {r ? r.split('').map((c, x) => (c === '█' && !on.has(y * 1000 + x) ? ' ' : c)).join('') : ' '}
        </div>
      ))}
    </div>
  );
}
