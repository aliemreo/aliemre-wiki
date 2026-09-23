import type { CSSProperties } from 'react';

/* Words that blur and rise into place on load, one after another.  The
   animation is defined only under html.js, so without JavaScript the text is
   simply there.  `from` offsets the stagger when several BlurTexts share a line. */
export function BlurText({ text, from = 0 }: { text: string; from?: number }) {
  const words = text.split(' ').filter(Boolean);
  return (
    <>
      {words.map((w, i) => (
        <span key={i}><span className="blur-w" style={{ '--i': from + i } as CSSProperties}>{w}</span>{i < words.length - 1 ? ' ' : ''}</span>
      ))}
    </>
  );
}
