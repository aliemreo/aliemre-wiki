import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react';
import { CONTENT } from '@/content/content.ts';
import { LINKS } from '@/content/links.ts';
import { PLATED } from '@/content/sections.ts';
import { Board } from '@/components/Cells.tsx';
import { ExtLink } from '@/components/ExtLink.tsx';
import { LinkPreview } from '@/components/ui/link-preview.tsx';
import { parseAnswer, parseDebate, plainAnswer, type Run } from '@/lib/askmd.ts';
import { clipboard } from '@/lib/clipboard.ts';
import { reduced } from '@/lib/motion.ts';
import { shown } from '@/lib/placeholder.ts';
import { useDoc, useEngine, useLang } from '@/store/site.tsx';
import type { AskTurn } from '@/store/engine.ts';
import { cast, verdicts } from '../../ask/characters.json';

/* The top-bar field and its conversation panel (§5.12).  Ask mode (an endpoint
   is configured): focus opens the panel with three starter questions; Enter
   appends a turn, shows thinking dots until the first byte, then reveals the
   answer character by character at a steady rate as it streams; the model's
   [[go:…]] / [[project:…]] / [[cmd:…]] tokens become chips that drive the site,
   its `?? ` lines become follow-up chips, and follow-ups carry the thread as
   context.  A hiring question becomes a debate turn (§5.14): a transcript of
   labelled rows, citation chips, the bench's verdict on board cells.  Search
   mode (no endpoint): each search is a turn in the same panel.  Esc, the veil
   or × close; the thread survives a reload in the tab. */
export function AskBar() {
  const engine = useEngine();
  const { ask, askEndpoint, ready, lang } = useDoc();
  const { ui, L } = useLang();
  const [q, setQ] = useState('');
  const [copied, setCopied] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const thread = useRef<HTMLDivElement>(null);
  const pinned = useRef(true);
  const busy = ask.status === 'thinking' || ask.status === 'streaming';
  useEffect(() => { engine.registerAskInput(input.current); return () => engine.registerAskInput(null); }, [engine, ready]);
  useEffect(() => {
    if (!ask.open) return;
    const onDown = (e: PointerEvent) => { if (!form.current?.contains(e.target as Node) && !(e.target as Element).closest?.('.lp-content')) engine.closeAsk(); };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [ask.open, engine]);
  /* while the panel is open the rest of the page blurs and dims behind a veil (html[data-asking]) */
  useEffect(() => { document.documentElement.toggleAttribute('data-asking', ask.open); return () => document.documentElement.removeAttribute('data-asking'); }, [ask.open]);
  /* the thread follows the stream unless the reader scrolled up */
  useEffect(() => {
    if (!busy) return;
    const t = setInterval(() => { const el = thread.current; if (el && pinned.current) el.scrollTop = el.scrollHeight; }, 80);
    return () => clearInterval(t);
  }, [busy]);
  useEffect(() => { const el = thread.current; if (el) el.scrollTop = el.scrollHeight; pinned.current = true; }, [ask.turns.length, ask.open]);
  if (!ready) return null;
  const mode = askEndpoint ? 'ask' : 'search';
  const send = (text: string, to?: 'debate') => { const t = text.trim(); if (!t) return; engine.submitField(t, to); setQ(''); input.current?.focus(); };
  const submit = (e: FormEvent) => { e.preventDefault(); send(q); };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); send(q); return; }   /* not left to implicit submission */
    if (e.key === 'ArrowUp' && !q) { const last = engine.lastQuestion(); if (last) { e.preventDefault(); setQ(last); } return; }
    if (e.key !== 'Escape') return;
    e.stopPropagation();
    if (ask.open) engine.closeAsk(); else setQ('');
  };
  const starters = mode === 'ask' ? CONTENT.meta.askStarters.map(s => L(s)).filter(s => shown(s)) : [];
  const last = ask.turns[ask.turns.length - 1];
  const debating = last?.cmd === 'debate';
  const copy = () => { if (!last) return; clipboard(plainAnswer(last.a)).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }, () => {}); };
  /* focus, a click in the field or typing brings the panel back (with the starters or the thread) */
  const reopen = () => { if (mode === 'ask' && (starters.length || ask.turns.length)) engine.openAsk(); };
  const onScroll = () => { const el = thread.current; if (el) pinned.current = el.scrollTop + el.clientHeight >= el.scrollHeight - 40; };
  return (
    <form ref={form} className="ask" role="search" data-open={ask.open || undefined} data-mode={mode} onSubmit={submit}>
      <label className="ask-field">
        <span className="ask-sign" aria-hidden="true">{mode === 'ask' ? '$ ?' : '$ /'}</span>
        <input ref={input} type="search" value={q} onChange={e => { setQ(e.target.value); reopen(); }} onKeyDown={onKey} onFocus={reopen} onClick={reopen}
          placeholder={debating && last.done ? ui.debateAskThem : ui.askPlaceholder} aria-label={mode === 'ask' ? ui.askLabel : ui.searchLabel} maxLength={300} autoComplete="off" enterKeyHint="send" aria-expanded={ask.open} aria-controls="ask-panel" />
      </label>
      <div className="ask-veil" aria-hidden="true" />   {/* fixed, z -1 inside the bar's stacking context: under the bar's controls, over the page */}
      {ask.open && (
        <div id="ask-panel" className="ask-panel" role="dialog" aria-label={mode === 'ask' ? ui.askLabel : ui.searchLabel}>
          <button type="button" className="ask-close" aria-label={ui.askClose} title={ui.askClose} onClick={() => engine.closeAsk()}>×</button>
          {!ask.turns.length && starters.length > 0 && (
            <div className="ask-starters">
              <span className="ask-foot">{ui.askStarters}</span>
              {starters.map(s => <button key={s} type="button" className="ask-chip" onClick={() => send(s)}>{s}</button>)}
            </div>
          )}
          {ask.turns.length > 0 && (
            <div className="ask-thread" ref={thread} onScroll={onScroll}>
              {ask.turns.map((t, i) => <Turn key={t.id} t={t} live={!!t.fresh} last={i === ask.turns.length - 1} first={t.cmd === 'debate' && ask.turns.findIndex(x => x.cmd === 'debate') === i} lang={lang} onAsk={send} />)}
              {ask.status === 'thinking' && <div className="ask-think" aria-label="…"><i /><i /><i />{debating && <span className="ask-foot">{ui.debateThinking}</span>}</div>}
            </div>
          )}
          <div className="ask-foot-row">
            {busy ? <button type="button" className="ask-link" onClick={() => engine.stopAsk()}>{ui.askStop}</button> : (
              <>
                {last && last.cmd !== 'search' && last.a && <button type="button" className="ask-link" onClick={copy}>{copied ? ui.copied : ui.askCopy}</button>}
                {ask.turns.length > 0 && <button type="button" className="ask-link" onClick={() => engine.clearAsk()}>{ui.askClear}</button>}
                <span>{ui.askFoot}</span>
              </>
            )}
          </div>
        </div>
      )}
    </form>
  );
}

/* reveal an answer at a steady reading pace even though it arrives in chunks:
   60 characters a second, accelerating once more than 120 characters are
   waiting, so it never stutters and catches up shortly after the stream ends */
function useReveal(text: string, live: boolean, pace: 'stream' | 'done' | 'stopped', settledAtMount = false): number {
  const [n, setN] = useState(live && !settledAtMount ? 0 : text.length);   /* a finished turn shown again (the panel reopened) does not replay */
  const cur = useRef(n);
  useEffect(() => {
    if (!live || reduced()) { cur.current = text.length; setN(text.length); return; }
    let raf = 0, last = performance.now(), acc = 0;
    const step = (now: number) => {
      const backlog = text.length - cur.current;
      if (backlog > 0) {
        const rate = pace === 'stopped' ? 900 : pace === 'done' ? 150 + backlog * 2 : 60 + Math.max(0, backlog - 120) * 4;   /* reading pace while streaming; settle quickly once the stream is over, at once after a stop */
        acc += rate * (now - last) / 1000;
        const adv = Math.floor(acc); acc -= adv;
        if (adv > 0) { cur.current = Math.min(text.length, cur.current + adv); setN(cur.current); }
      }
      last = now;
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [text, live, pace]);
  return live ? Math.min(n, text.length) : text.length;
}

const HOSTS = new Set([...Object.values(LINKS).map(d => d.href), CONTENT.meta.github, CONTENT.meta.linkedin, CONTENT.meta.cv].filter((h): h is string => !!h && /^https?:/.test(h)).map(h => new URL(h).host.replace(/^www\./, '')));
const allowLink = (href: string) => { try { return HOSTS.has(new URL(href).host.replace(/^www\./, '')); } catch { return false; } };

/* while revealing, hold back what is still arriving: an unclosed [[token, [src: citation or **run, a marker line without its newline */
function holdBack(text: string): string {
  const tok = text.lastIndexOf('[['); if (tok >= 0 && text.indexOf(']]', tok) < 0) text = text.slice(0, tok);
  const src = text.lastIndexOf('[src:'); if (src >= 0 && text.indexOf(']', src) < 0) text = text.slice(0, src);
  const stars = text.split('**').length - 1; if (stars % 2 === 1) text = text.slice(0, text.lastIndexOf('**'));
  const nl = text.lastIndexOf('\n'); if (/^(@@|==|\?\?)/.test(text.slice(nl + 1))) text = text.slice(0, nl + 1);
  return text;
}

type Cast = Record<string, { name: string | { en: string; tr: string }; role: { en: string; tr: string }; motif: string; bio: { en: string; tr: string } }>;
const CAST = cast as Cast;

/* a character's label: the motif and the name; a click opens the character card (the plate motifs' card: motif at 64px, name, role, the bio) */
function Who({ id }: { id: string }) {
  const { L } = useLang();
  const c = CAST[id];
  if (!c) return <span className="ask-who">{id}</span>;
  const name = typeof c.name === 'string' ? c.name : L(c.name);
  return (
    <LinkPreview blurb={L(c.bio)} className="ask-who" preview={<><span className="motif lp-motif" data-motif={c.motif} aria-hidden="true" /><span className="lp-who"><span className="lp-motif-name">{name}</span><span className="lp-role">{L(c.role)}</span></span></>}>
      <span className="motif" data-motif={c.motif} aria-hidden="true" /><span>{name}</span>
    </LinkPreview>
  );
}

function Turn({ t, live, last, first, lang, onAsk }: { t: AskTurn; live: boolean; last: boolean; first: boolean; lang: string; onAsk: (q: string, to?: 'debate') => void }) {
  const engine = useEngine();
  const { ui, L, lower } = useLang();
  const n = useReveal(t.a, live, t.stopped || t.interrupted ? 'stopped' : t.done ? 'done' : 'stream', t.done);
  const revealing = live && n < t.a.length;
  const text = revealing ? holdBack(t.a.slice(0, n)) : t.a;
  const settled = !revealing;
  const debate = t.cmd === 'debate';
  const parsed = useMemo(() => (t.cmd === 'ask' ? parseAnswer(text, allowLink) : null), [text, t.cmd]);
  const deb = useMemo(() => (debate ? parseDebate(text, allowLink) : null), [text, debate]);
  const chip = (r: Run & { t: 'action' }, k: number) => {
    if (!engine.askActionValid(r.kind, r.value)) return <span key={k}>{r.value}</span>;
    const label = r.kind === 'go' ? '→ ' + (PLATED.find(d => d.id === r.value) ? lower(ui[PLATED.find(d => d.id === r.value)!.label]) : r.value)
      : r.kind === 'project' ? '→ ' + L(CONTENT.projects.find(p => p.slug === r.value)!.name)
      : '$ ' + r.value;
    return <button key={k} type="button" className="ask-chip ask-action" onClick={() => engine.runAskAction(r.kind, r.value)}>{label}</button>;
  };
  /* a citation: the file's title; a site source runs its route, an external one opens the preview card like every outbound link */
  const cite = (r: Run & { t: 'src' }, k: number) => r.href.startsWith('#')
    ? <button key={k} type="button" className="ask-cite" onClick={() => engine.runAskAction('href', r.href)}>{r.title}</button>
    : /^https?:/.test(r.href) ? <ExtLink key={k} href={r.href} blurb={r.title} className="ask-cite">{r.title}</ExtLink>
    : <span key={k} className="ask-cite">{r.title}</span>;
  const render = (runs: Run[]): ReactNode[] => runs.map((r, k) => r.t === 'text' ? r.s : r.t === 'b' ? <strong key={k}>{r.s}</strong> : r.t === 'code' ? <code key={k}>{r.s}</code>
    : r.t === 'link' ? <a key={k} href={r.href} target="_blank" rel="noopener">{r.s}</a> : r.t === 'src' ? cite(r, k)
    : r.t === 'flag' ? <span key={k} className="ask-flag">{render(r.runs)}<span className="ask-tag">{ui.debateUnverified}</span></span> : chip(r, k));
  const blocks = (bs: { t: 'p'; runs: Run[] }[] | ReturnType<typeof parseAnswer>['blocks']) => bs.map((b, i) => b.t === 'p' ? <p key={i}>{render(b.runs)}</p> : <ul key={i}>{b.items.map((it, j) => <li key={j}>{render(it)}</li>)}</ul>);
  const followups = (debate ? deb!.followups : parsed ? parsed.followups : []).slice(0, 2);
  const verdict = deb?.verdict && (verdicts as Record<string, { en: string; tr: string }>)[deb.verdict];
  return (
    <div className="ask-turn" data-cmd={t.cmd} lang={lang}>
      <div className="ask-q">$ {t.cmd} {t.q}</div>
      {t.cmd === 'search' ? <pre className="ask-a mono">{t.a}</pre> : (
        <div className="ask-a" aria-live={live && last ? 'polite' : undefined}>
          {debate && first && (
            <div className="ask-cast">   {/* who is about to speak: the first debate turn in the thread introduces the cast */}
              {(CAST.bench ? Object.keys(CAST).filter(k => k !== 'bench') : Object.keys(CAST)).map(k => <span key={k}><Who id={k} />, {L(CAST[k].role)}</span>)}
              <span>{ui.debateBench}</span>
            </div>
          )}
          {debate ? deb!.utterances.map((u, i) => {
            return (
              <div key={i} className="ask-row">
                <Who id={u.who} />
                <div className="ask-say">
                  {u.who === 'bench' && verdict && <div className="ask-verdict"><span className="ask-foot">{ui.debateVerdict}</span><Board text={L(verdict)} className="status" label={`${ui.debateVerdict}: ${L(verdict)}`} /></div>}
                  {blocks(u.blocks)}
                  {!settled && i === deb!.utterances.length - 1 && <span className="ask-caret" aria-hidden="true" />}   {/* the caret sits at the end of the speaker's text */}
                </div>
              </div>
            );
          }) : blocks(parsed!.blocks)}
          {!settled && (!debate || !deb!.utterances.length) && <span className="ask-caret" aria-hidden="true" />}
          {t.stopped && settled && <span className="ask-note"> — {ui.askStopped}</span>}
          {t.interrupted && settled && <span className="ask-note"> — {ui.debateInterrupted}</span>}
          {t.error && <p className="err">{t.error}</p>}
        </div>
      )}
      {t.done && settled && followups.length > 0 && (
        <div className="ask-follow">
          {debate && <span className="ask-foot">{ui.debateAskThem}</span>}
          {followups.map(f => <button key={f} type="button" className="ask-chip" onClick={() => onAsk(f, debate ? 'debate' : undefined)}>{f}</button>)}
        </div>
      )}
    </div>
  );
}
