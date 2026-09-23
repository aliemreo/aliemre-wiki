import { useEffect, useState } from 'react';
import { reduced } from '@/lib/motion.ts';

/* A phrase typed out, held, deleted and replaced by the next one, with a
   caret that blinks while holding.  The first word is fully typed from the
   first render (so the prerender and hydration agree); the cycle starts with a
   hold.  All words are laid out invisibly in the same grid cell so the line
   never reflows.  Reduced motion: the first word, static, no caret. */
const TYPE = 55, DELETE = 30, HOLD = 1600, PAUSE = 250;

export function TypeWriter({ words }: { words: string[] }) {
  const [i, setI] = useState(0);
  const [len, setLen] = useState(words[0]?.length ?? 0);
  const [phase, setPhase] = useState<'hold' | 'deleting' | 'typing'>('hold');
  const [still, setStill] = useState(false);

  useEffect(() => { if (reduced()) setStill(true); }, []);
  useEffect(() => {
    if (still || words.length < 2) return;
    const word = words[i];
    let t = 0;
    if (phase === 'hold') t = window.setTimeout(() => setPhase('deleting'), HOLD);
    else if (phase === 'deleting') {
      if (len > 0) t = window.setTimeout(() => setLen(l => l - 1), DELETE);
      else t = window.setTimeout(() => { setI(k => (k + 1) % words.length); setPhase('typing'); }, PAUSE);
    } else if (len < word.length) t = window.setTimeout(() => setLen(l => l + 1), TYPE);
    else t = window.setTimeout(() => setPhase('hold'), 0);
    return () => clearTimeout(t);
  }, [still, words, i, len, phase]);

  return (
    <span className="tw" aria-hidden="true">
      {words.map((w, k) => <span key={'m' + k} className="tw-measure">{w}</span>)}
      <span className="tw-live">
        <span className="tw-text">{words[i].slice(0, len)}</span>
        {!still && <span className="tw-caret" data-hold={phase === 'hold' ? '' : undefined} />}
      </span>
    </span>
  );
}
