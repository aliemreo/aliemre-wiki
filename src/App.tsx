import { useEffect, useState, type MouseEvent } from 'react';
import { Document } from '@/components/sections/index.tsx';
import { Footer } from '@/components/Footer.tsx';
import { MotifStyles } from '@/components/Motif.tsx';
import { SectionTree } from '@/components/SectionTree.tsx';
import { TopBar } from '@/components/TopBar.tsx';
import { HeroBackdrop } from '@/components/HeroBackdrop.tsx';
import { CommandPalette } from '@/components/CommandPalette.tsx';
import { MailDialog } from '@/components/MailDialog.tsx';
import { CONTENT } from '@/content/content.ts';
import { contentReport } from '@/lib/contentReport.ts';
import { SiteProvider, useDoc, useEngine } from '@/store/site.tsx';
import { Terminal } from '@/terminal/Terminal.tsx';

export function App() {
  return (
    <SiteProvider>
      <Shell />
    </SiteProvider>
  );
}

/* false during prerender and hydration, so the terminal is never in the static
   HTML and the first client render matches the server's */
function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

function Shell() {
  const engine = useEngine();
  const { term } = useDoc();
  const mounted = useMounted();

  /* hovering a section or a project on the left ghosts its command in the prompt */
  const onMouseOver = (e: MouseEvent<HTMLDivElement>) => {
    const t = e.target as HTMLElement;
    const sec = t.closest('main > section');
    const art = t.closest('article[data-slug]');
    const hint = art ? 'project ' + art.getAttribute('data-slug') : sec && sec.id !== 'top' ? sec.id : '';
    engine.hover(sec ? sec.id : '', hint);
  };

  useEffect(() => {
    if (!mounted) return;
    const secs = Array.from(document.querySelectorAll<HTMLElement>('main > section'));
    const revealed = [...secs, ...Array.from(document.querySelectorAll<HTMLElement>('.rail'))];
    if (!('IntersectionObserver' in window)) { revealed.forEach(s => s.setAttribute('data-in', '')); return; }
    /* reveal on first scroll into view — sections and the rail alike */
    const reveal = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.setAttribute('data-in', ''); reveal.unobserve(e.target); }
    }), { rootMargin: '0px 0px -8% 0px' });
    revealed.forEach(s => reveal.observe(s));
    const fallback = setTimeout(() => revealed.forEach(s => s.setAttribute('data-in', '')), 3000);
    /* which section the reader is in: the status line path follows it */
    const current = new IntersectionObserver(es => {
      const hit = es.find(e => e.isIntersecting);
      if (hit) engine.setSection(hit.target.id);
    }, { rootMargin: '-45% 0px -50% 0px' });
    secs.forEach(s => current.observe(s));
    /* projects / reading in view: the chips become tag filters */
    const projects = document.getElementById('projects'), reading = document.getElementById('reading');
    const ctx = new IntersectionObserver(es => {
      const patch: { inProjects?: boolean; inReading?: boolean } = {};
      es.forEach(e => {
        if (e.target === projects) patch.inProjects = e.isIntersecting;
        if (e.target === reading) patch.inReading = e.isIntersecting;
      });
      engine.setContext(patch);
    }, { rootMargin: '-140px 0px -45% 0px' });
    if (projects) ctx.observe(projects);
    if (reading) ctx.observe(reading);
    return () => { reveal.disconnect(); current.disconnect(); ctx.disconnect(); clearTimeout(fallback); };
  }, [mounted, engine]);

  /* dev only: the same report scripts/preflight.mjs runs in CI */
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const r = contentReport(CONTENT);
    if (r.placeholders.length) console.warn(`[content] ${r.placeholders.length} placeholder strings still in CONTENT. Fill them, or list them in README.`, r.placeholders);
    if (r.untranslated.length) console.warn(`[lang] ${r.untranslated.length} CONTENT entries have an English string with no Turkish sibling.`, r.untranslated);
  }, []);

  return (
    <div className="shell" id="shell">
      <MotifStyles />
      <div className="doc" id="doc" onMouseOver={onMouseOver}>
        <HeroBackdrop />
        <TopBar />
        <div className="doc-grid">
          <SectionTree />
          <div className="doc-main">
            <Document />
            <Footer />
          </div>
        </div>
      </div>
      {mounted && term !== 'folded' && <Terminal />}
      {mounted && <CommandPalette />}
      {mounted && <MailDialog />}
    </div>
  );
}
