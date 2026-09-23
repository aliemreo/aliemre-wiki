import { useEffect, useState } from 'react';
import { CONTENT } from '@/content/content.ts';
import { PLATED } from '@/content/sections.ts';
import { PromptButton } from '@/components/ui/prompt-button.tsx';
import { AskBar } from '@/components/AskBar.tsx';
import { useEngine, useLang, useTerm } from '@/store/site.tsx';

/* Sticky top bar: name, the search / ask field, ⌘K, a terminal button.
   Transparent over the hero, frosted glass once the reader has scrolled past
   it.  The section links are rendered only for the no-JavaScript page (the rail,
   the palette, the field and the terminal cover navigation once JS runs). */
export function TopBar() {
  const engine = useEngine();
  const { section } = useTerm();
  const { ui, lower } = useLang();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    let raf = 0;
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; setScrolled(window.scrollY > 240); }); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, []);
  return (
    <nav className="topbar noprint" data-scrolled={scrolled ? 'true' : 'false'} aria-label={ui.indexLabel}>
      <div className="topbar-inner">
        <a className="topbar-brand" href="#top" onClick={e => { e.preventDefault(); engine.exec('top'); }}>{CONTENT.meta.name}</a>
        <div className="topbar-links" data-nojs="">
          {PLATED.map(d => (
            <a key={d.id} href={'#' + d.id} data-active={section === d.id ? '' : undefined} onClick={e => { e.preventDefault(); engine.exec(d.id); }}>{lower(ui[d.label])}</a>
          ))}
        </div>
        <AskBar />
        <button type="button" className="topbar-search" aria-label={ui.cmdkLabel} title={ui.cmdkLabel} onClick={() => engine.openPalette()}><span className="topbar-search-k">⌘K</span><span className="topbar-search-i" aria-hidden="true">⌕</span></button>
        <PromptButton outline className="topbar-cta pbtn-sm" onClick={() => engine.focusBar()}>{ui.termTab}</PromptButton>
      </div>
    </nav>
  );
}
