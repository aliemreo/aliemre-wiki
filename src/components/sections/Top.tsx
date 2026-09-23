import { CONTENT } from '@/content/content.ts';
import { Copy } from '@/components/Copy.tsx';
import { Rich } from '@/components/Rich.tsx';
import { BlurText } from '@/components/hero/BlurText.tsx';
import { Marquee } from '@/components/hero/Marquee.tsx';
import { TypeWriter } from '@/components/hero/TypeWriter.tsx';
import { DebateCta } from '@/components/DebateCta.tsx';
import { PromptButton } from '@/components/ui/prompt-button.tsx';
import { pixelRows } from '@/lib/pixelfont.ts';
import { useEngine, useLang } from '@/store/site.tsx';

const PIX = pixelRows('ALİ EMRE ÖZCAN').join('\n');

/* The hero: name as a mono kicker (with the pixel-font hover), a display
   headline with a typewriter phrase, the lead, two CTAs and the marquee.  The
   backdrop behind it is <HeroBackdrop>, mounted at the top of .doc in App. */
export function Top() {
  const engine = useEngine();
  const { L, ui } = useLang();
  const h = CONTENT.hero;
  const before = L(h.headline.before), after = L(h.headline.after), words = L(h.headline.rotating);
  const nBefore = before.split(' ').filter(Boolean).length;
  return (
    <section id="top" className="hero" aria-label={ui.intro}>
      <p className="hero-name" tabIndex={0}>
        <span className="h1-plain">{CONTENT.meta.name}</span>
        <span className="h1-pix" aria-hidden="true">{PIX}</span>
      </p>
      <h1 className="hero-title" aria-label={[before, words[0], after].filter(Boolean).join(' ')}>
        {before && <><BlurText text={before} />{' '}</>}
        <TypeWriter words={words} />
        {after && <>{' '}<BlurText text={after} from={nBefore + 1} /></>}
      </h1>
      <p className="hero-lead"><Rich text={L(h.line1)} /></p>
      <Copy className="sub" text={L(h.line2)} />
      <Copy className="avail" text={L(h.avail)}><span className="dot" aria-hidden="true" /><Rich text={L(h.avail)} /></Copy>
      <div className="hero-cta">
        <PromptButton caret onClick={() => engine.focusBar()}>{ui.ctaTerminal}</PromptButton>
        <PromptButton outline data-mail-home onClick={() => engine.exec('mail')}>{ui.ctaEmail}</PromptButton>
      </div>
      <DebateCta hint="after" className="hero-debate" />
      <Marquee />
    </section>
  );
}
