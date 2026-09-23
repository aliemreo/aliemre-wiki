import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { TERM_W } from '@/lib/prefs.ts';
import { TAGS } from '@/content/content.ts';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group.tsx';
import { Button } from '@/components/ui/button.tsx';
import { clipboard } from '@/lib/clipboard.ts';
import { reduced } from '@/lib/motion.ts';
import type { LogEntry } from '@/store/engine.ts';
import { useDoc, useEngine, useLang, useTerm } from '@/store/site.tsx';
import { Banner } from './Banner.tsx';

/* The right column: status line, scrolling log, context chips, prompt.
   Rendered only on the client — with JavaScript off it does not exist. */
export function Terminal() {
  const engine = useEngine();
  const { ui } = useLang();
  const { expanded, focused } = useTerm();
  /* phones: the log shows while the prompt is in use or after a command, and
     folds away again once the reader scrolls on */
  const anchor = useRef(0);
  useEffect(() => { if (expanded) anchor.current = window.scrollY; }, [expanded]);
  useEffect(() => {
    const narrow = window.matchMedia('(max-width: 1023px)');
    const onScroll = () => {
      if (!narrow.matches || focused) return;
      if (Math.abs(window.scrollY - anchor.current) > 40) engine.collapse();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [engine, focused]);
  return (
    <aside className="term noprint" aria-label={ui.terminalLabel} data-collapsed={expanded ? 'false' : 'true'}>
      <ResizeHandle />
      <TitleBar />
      <Log />
      {expanded && <LogHandle />}
      <Chips />
      <Prompt />
    </aside>
  );
}

/* Desktop: drag the terminal's left edge to any width; double-click resets,
   arrow keys nudge, Home resets.  The width lives in --term-w on <html>. */
function ResizeHandle() {
  const engine = useEngine();
  const { ui } = useLang();
  const [w, setW] = useState(0);
  useEffect(() => { setW(Math.round(engine.termWidth())); }, [engine]);
  const drag = (e: PointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget; el.setPointerCapture(e.pointerId);
    document.documentElement.setAttribute('data-resizing', '');
    const move = (ev: globalThis.PointerEvent) => { engine.setTermWidth(window.innerWidth - ev.clientX, false); setW(Math.round(engine.termWidth())); };
    const up = () => { document.documentElement.removeAttribute('data-resizing'); engine.setTermWidth(engine.termWidth()); el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); };
    el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  };
  const key = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 96 : 24;
    if (e.key === 'ArrowLeft') { e.preventDefault(); engine.setTermWidth(engine.termWidth() + step); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); engine.setTermWidth(engine.termWidth() - step); }
    else if (e.key === 'Home') { e.preventDefault(); engine.setTermWidth(null); }
    else return;
    setW(Math.round(engine.termWidth()));
  };
  return <div className="term-resize" role="separator" aria-orientation="vertical" aria-label={ui.resizeTerm} title={ui.resizeTerm} tabIndex={0}
    aria-valuemin={TERM_W.min} aria-valuenow={w} onPointerDown={drag} onDoubleClick={() => { engine.setTermWidth(null); setW(Math.round(engine.termWidth())); }} onKeyDown={key} />;
}

/* Phones: drag the bar under the log to set how tall it may grow; double-tap resets. */
function LogHandle() {
  const engine = useEngine();
  const { ui } = useLang();
  const drag = (e: PointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget; el.setPointerCapture(e.pointerId);
    const log = el.previousElementSibling as HTMLElement | null; if (!log) return;
    const startY = e.clientY, startH = log.getBoundingClientRect().height;
    document.documentElement.setAttribute('data-resizing', '');
    const move = (ev: globalThis.PointerEvent) => engine.setTermHeight(startH + (ev.clientY - startY), false);
    const up = () => { document.documentElement.removeAttribute('data-resizing'); const h = parseInt(document.documentElement.style.getPropertyValue('--term-h'), 10); if (h > 0) engine.setTermHeight(h); el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); };
    el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  };
  return <div className="term-handle" role="separator" aria-orientation="horizontal" aria-label={ui.resizeLog} onPointerDown={drag} onDoubleClick={() => engine.setTermHeight(null)}><span /></div>;
}

/* A window title bar with the mac convention: red closes (folds), yellow
   minimizes (a small floating window bottom-right; again restores), green
   zooms (wide, then full).  Real mac colours,
   glyphs on hover.  The current path sits in the middle, the keyboard hint right. */
function TitleBar() {
  const engine = useEngine();
  const { term } = useDoc();
  const { section } = useTerm();
  const { ui } = useLang();
  return (
    <div className="term-title">
      <div className="dots">
        <button type="button" className="dot fold" aria-label={ui.foldTerm} title={ui.foldTerm} onClick={() => engine.foldTerm()} />
        <button type="button" className="dot minimize" aria-label={term === 'mini' ? ui.restoreTerm : ui.minimizeTerm} title={term === 'mini' ? ui.restoreTerm : ui.minimizeTerm} aria-pressed={term === 'mini'} onClick={() => engine.minimizeTerm()} />
        <button type="button" className="dot zoom" aria-label={ui.termModeNext[term] ?? ui.zoomTerm} title={ui.termModeNext[term] ?? ui.zoomTerm} aria-pressed={term !== 'open'} onClick={() => engine.toggleWide()} />
      </div>
      <span className="title">ali@site <span className="path">{'~' + (section && section !== 'top' ? '/' + section : '')}</span></span>
      <span className="kbd">{ui.kbd}</span>
    </div>
  );
}

function Log() {
  const { log, cleared } = useTerm();
  const { ui } = useLang();
  const ref = useRef<HTMLDivElement>(null);
  const scroll = useRef(() => { const n = ref.current; if (n) n.scrollTop = n.scrollHeight; });
  useEffect(() => scroll.current(), [log]);
  return (
    <div className="log" role="log" aria-live="polite" ref={ref}>
      {!cleared && <Banner />}
      {!cleared && <div className="welcome">{ui.welcome}</div>}
      {log.map((e, i) => <Entry key={e.id} entry={e} live={i === log.length - 1} onProgress={scroll} />)}
    </div>
  );
}

/* Output is typed in over ~40 frames unless reduced motion is on or a newer
   entry has arrived.  The live region hears it once, at the end. */
function Entry({ entry, live, onProgress }: { entry: LogEntry; live: boolean; onProgress: React.RefObject<() => void> }) {
  const [shown, setShown] = useState(() => (reduced() ? entry.out.length : 0));
  const [copied, setCopied] = useState(false);
  const { ui } = useLang();
  const text = entry.out;
  useEffect(() => {
    if (!text) return;
    if (!live || reduced() || entry.stream) { setShown(text.length); return; }
    const step = Math.max(2, Math.ceil(text.length / 40));
    let n = 0;
    setShown(0);
    const t = setInterval(() => {
      n = Math.min(text.length, n + step);
      setShown(n); onProgress.current();
      if (n >= text.length) clearInterval(t);
    }, 16);
    return () => clearInterval(t);
  }, [text, live, onProgress]);
  const typing = text && shown < text.length;
  const copy = () => {
    const body = (entry.cmd ? `$ ${entry.cmd}${entry.args}\n` : '') + text;
    clipboard(body).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }, () => {});
  };
  return (
    <div className="entry">
      {(entry.cmd || text) && <button type="button" className="entry-copy" onClick={copy} aria-label={ui.copyEntry}>{copied ? ui.copied : ui.copyEntry}</button>}
      {entry.cmd && (
        <div className="entry-cmd">
          <span className="sigil" aria-hidden="true">$</span>
          <span className="said"><span className="cmd">{entry.cmd}</span><span className="args">{entry.args}</span></span>
        </div>
      )}
      <div className={'entry-out' + (entry.kind ? ' ' + entry.kind : '')} aria-hidden={typing ? 'true' : undefined}>
        {typing ? text.slice(0, shown) : text}
      </div>
    </div>
  );
}

const chipClass = 'chip h-auto min-w-0 rounded-full border border-rule bg-transparent px-2.5 py-0.5 font-mono text-xs font-normal leading-normal text-bar-muted hover:border-prompt hover:bg-transparent hover:text-prompt data-[state=on]:border-prompt data-[state=on]:bg-prompt data-[state=on]:text-black first:rounded-full last:rounded-full';

/* Default chips run a command; while projects or reading is in view they turn
   into that section's tag filter. */
function Chips() {
  const engine = useEngine();
  const { filter, readFilter, openSlug, theme, lang } = useDoc();
  const { inProjects, inReading } = useTerm();
  const { ui } = useLang();
  const projectsCtx = inProjects || !!openSlug || (!!filter && !inReading);
  const readingCtx = !projectsCtx && (inReading || !!readFilter);
  if (projectsCtx || readingCtx) {
    const active = (readingCtx ? readFilter : filter) ?? 'all';
    const cmd = readingCtx ? 'reading ' : 'projects ';
    return (
      <ToggleGroup type="single" value={active} onValueChange={v => { if (v) engine.exec(cmd + v); }} className="chips w-auto justify-start rounded-none" aria-label={readingCtx ? ui.reading : ui.projects}>
        <ToggleGroupItem value="all" className={chipClass}>{ui.all}</ToggleGroupItem>
        {TAGS.map(t => <ToggleGroupItem key={t} value={t} className={chipClass}>{t}</ToggleGroupItem>)}
      </ToggleGroup>
    );
  }
  const pn = (en: string, tr: string) => (lang === 'tr' ? tr : en);
  const chips = [
    pn('projects', 'projeler'), pn('about', 'hakkında'), pn('contact email', 'iletişim email'),
    theme === 'dark' ? pn('theme light', 'tema açık') : pn('theme dark', 'tema koyu'),
    pn('palette', 'renk'), pn('help', 'yardım'),
  ];
  return (
    <div className="chips">
      {chips.map(c => <Button key={c} variant="plain" className={chipClass} onClick={() => { engine.exec(c); engine.focusBar(); }}>{c}</Button>)}
    </div>
  );
}

/* The input's own text is transparent; a mirror span renders it with syntax
   colours, then the block cursor, then a muted hint. */
function Prompt() {
  const engine = useEngine();
  const { input, focused, hoverHint, expanded } = useTerm();
  const { ui } = useLang();
  const m = input.match(/^(\s*\S*)([\s\S]*)$/) || ['', input, ''];
  const word = m[1].trim().toLowerCase();
  const known = engine.isKnownPrefix(word);
  const ghost = input ? engine.suggestion() : hoverHint ? hoverHint + '  ↵' : ui.hintEmpty;
  const inputEl = useRef<HTMLInputElement | null>(null);
  const mirror = useRef<HTMLSpanElement>(null);
  /* the mirror must scroll with the real input so long lines stay aligned */
  const sync = () => { if (inputEl.current && mirror.current) mirror.current.scrollLeft = inputEl.current.scrollLeft; };
  useEffect(sync, [input]);
  return (
    <div className="bar" data-focused={focused ? 'true' : 'false'} onClick={() => engine.focusBar()}>
      <span className="sigil" aria-hidden="true">$</span>
      <div className="bar-field">
        <input
          ref={el => { inputEl.current = el; engine.registerInput(el); }}
          value={input}
          aria-label={ui.barLabel}
          autoComplete="off" autoCapitalize="off" spellCheck={false}
          onChange={e => engine.setInput(e.target.value)}
          onKeyDown={e => engine.onKey(e)}
          onScroll={sync}
          onFocus={() => engine.setFocused(true)}
          onBlur={() => engine.setFocused(false)}
        />
        <span className="mirror" aria-hidden="true" ref={mirror}>
          <span className={known ? 'cmd' : 'cmd unknown'}>{m[1]}</span>
          <span className="args">{m[2]}</span>
          <span className="caret" />
          <span className={'hint' + (input ? ' ghost' : '')}>{ghost}</span>
        </span>
      </div>
      <button type="button" className="term-toggle" aria-expanded={expanded} aria-label={expanded ? ui.hideLog : ui.showLog}
        onClick={e => { e.stopPropagation(); engine.toggleExpanded(); }}>{expanded ? '▾' : '▴'}</button>
    </div>
  );
}
