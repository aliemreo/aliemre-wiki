import { useCallback, useEffect, useRef, useState } from 'react';
import { FLAP_CHARS, registerSettle } from '@/lib/flap.ts';
import { reduced } from '@/lib/motion.ts';

/* One split-flap cell per character.  The key carries the character, so a
   change re-mounts the cell and replays the `flapin` animation. */
export function Cells({ text }: { text: string }) {
  return (
    <>
      {[...text].map((ch, i) =>
        ch === ' '
          ? <span key={`${i}:space`} className="cell space" aria-hidden="true" />
          : <span key={`${i}:${ch}`} className="cell" aria-hidden="true">{ch}</span>,
      )}
    </>
  );
}

/* Static departure-board cells (experience year and status). */
export function Board({ text, className, label }: { text: string; className?: string; label?: string }) {
  return (
    <div className={`flap board ${className ?? ''}`.trim()} aria-label={label} aria-hidden={label ? undefined : 'true'}>
      <Cells text={text} />
    </div>
  );
}

/* Heading letters on quiet split-flap cells.  They render as the real text
   from the first frame (that is what a reader without JavaScript gets).  After
   hydration, the first time a heading's section scrolls into view every letter
   cycles through a few characters and settles, left to right, once (~0.8 s);
   later the same flip runs letter by letter when the text changes for another
   reason (a filter, a language switch).  Reduced motion: static. */
export function FlapCells({ text }: { text: string }) {
  const [shown, setShown] = useState(text);
  const [flipping, setFlipping] = useState(false);
  const host = useRef<HTMLSpanElement>(null);
  const target = useRef(text); target.current = text;
  const shownRef = useRef(text); shownRef.current = shown;
  const timer = useRef(0);
  const prev = useRef(text);

  /* 40ms per step, 1.5-step stagger per letter; each letter cycles forward
     through the drum until it shows its target character */
  const flipTo = useCallback((to: string, from: string) => {
    clearInterval(timer.current);
    const C = FLAP_CHARS, n = to.length;
    const cur = [...from.padEnd(n, ' ').slice(0, n)].map((c, i) => (to[i] === ' ' ? ' ' : C.includes(c) ? c : C[1]));
    let t = 0;
    timer.current = window.setInterval(() => {
      t++; let finished = true;
      for (let i = 0; i < n; i++) {
        if (t < i * 1.5) { finished = false; continue; }
        if (cur[i] === to[i]) continue;
        const ti = C.indexOf(to[i]);
        cur[i] = ti < 0 ? to[i] : C[(C.indexOf(cur[i]) + 1) % C.length];
        if (cur[i] !== to[i]) finished = false;
      }
      setShown(cur.join(''));
      if (finished) clearInterval(timer.current);
    }, 40);
  }, []);

  useEffect(() => {
    const unregister = registerSettle(() => { clearInterval(timer.current); setShown(target.current); });
    return () => { unregister(); clearInterval(timer.current); };
  }, []);

  /* first reveal: start every letter 4–7 characters before its target */
  useEffect(() => {
    if (reduced()) return;
    const sec = host.current?.closest('section');
    if (!sec || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(es => {
      if (!es.some(e => e.isIntersecting)) return;
      io.disconnect();
      const C = FLAP_CHARS, to = target.current;
      const from = [...to].map(ch => {
        if (ch === ' ') return ' ';
        const ti = C.indexOf(ch); if (ti < 0) return ch;
        return C[(ti - (4 + Math.floor(Math.random() * 4)) + C.length) % C.length];
      }).join('');
      setFlipping(true);
      flipTo(to, from);
    }, { threshold: 0.15 });
    io.observe(sec);
    return () => io.disconnect();
  }, [flipTo]);

  /* text changed: filter or language */
  useEffect(() => {
    if (prev.current === text) return;
    prev.current = text;
    if (reduced()) { setShown(text); return; }
    setFlipping(true);
    flipTo(text, shownRef.current);
  }, [text, flipTo]);

  return <span ref={host} className="contents" data-flipping={flipping ? '' : undefined}><Cells text={shown} /></span>;
}
