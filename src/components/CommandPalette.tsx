import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { CONTENT, PALETTES } from '@/content/content.ts';
import { LINKS } from '@/content/links.ts';
import { PLATED } from '@/content/sections.ts';
import { FONTS } from '@/lib/prefs.ts';
import { useDoc, useEngine, useLang } from '@/store/site.tsx';

/* ⌘K command palette on the native <dialog> (focus trap, Escape and backdrop
   come with it — no cmdk, no Radix Dialog, so the size budget holds).  Every
   row runs through engine.exec(), so the terminal logs it. */
interface Item { group: string; label: string; hint?: string; run: () => void }

function score(label: string, q: string): number {
  const l = label.toLowerCase(), s = q.toLowerCase();
  if (!s) return 1;
  if (l.startsWith(s)) return 4;
  if (l.split(/[\s·/]+/).some(w => w.startsWith(s))) return 3;
  if (l.includes(s)) return 2;
  let i = 0; for (const ch of l) { if (ch === s[i]) i++; if (i === s.length) return 1; }
  return 0;
}

export function CommandPalette() {
  const engine = useEngine();
  const { paletteOpen, theme, lang, askEndpoint } = useDoc();
  const { ui, L, lower } = useLang();
  const ref = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);

  const items = useMemo<Item[]>(() => [
    ...PLATED.map(d => ({ group: ui.gSections, label: lower(ui[d.label]), hint: '#' + d.id, run: () => engine.exec(d.id) })),
    ...CONTENT.projects.map(p => ({ group: ui.gProjects, label: L(p.name), hint: p.slug, run: () => engine.exec('project ' + p.slug) })),
    ...engine.cmds().filter(c => !c.hidden && c.desc).map(c => ({ group: ui.gCommands, label: engine.primaryName(c), hint: L(c.desc!), run: () => engine.exec(engine.primaryName(c)) })),
    ...(askEndpoint ? [{ group: ui.gCommands, label: ui.askOpen, hint: '⌘⇧K', run: () => engine.focusAsk() }, { group: ui.gCommands, label: ui.debateOpen, hint: 'debate', run: () => { engine.focusAsk(); engine.exec('debate ' + L(CONTENT.meta.debateStarter)); } }] : []),
    ...Object.values(LINKS).filter(d => d.href).map(d => ({ group: ui.gPlaces, label: d.label, hint: L(d.blurb), run: () => engine.openLink(d.href!, d.label) })),
    { group: ui.gPrefs, label: theme === 'dark' ? ui.light : ui.dark, hint: 'theme', run: () => engine.exec('theme') },
    ...PALETTES.map(p => ({ group: ui.gPrefs, label: p, hint: 'palette', run: () => engine.exec('palette ' + p) })),
    ...FONTS.map(f => ({ group: ui.gPrefs, label: f === 'geist' ? ui.fontGeist : ui.fontInter, hint: 'font', run: () => engine.exec('font ' + f) })),
    { group: ui.gPrefs, label: ui.lang, hint: 'lang', run: () => engine.exec('lang') },
    ...(['open', 'wide', 'full', 'mini', 'fold'] as const).map(mode => ({ group: ui.gPrefs, label: `terminal ${mode}`, hint: 'term', run: () => engine.exec('term ' + mode) })),
  ], [engine, ui, L, lower, theme, lang, askEndpoint]);

  const results = useMemo(() => {
    const ranked = items.map(it => ({ it, s: score(it.label, q) })).filter(r => r.s > 0).sort((a, b) => b.s - a.s).slice(0, q ? 12 : 40).map(r => r.it);
    if (q.trim() && !ranked.some(r => r.label.toLowerCase() === q.trim().toLowerCase())) ranked.push({ group: ui.cmdkRun, label: q.trim(), hint: '$', run: () => engine.exec(q.trim()) });
    return ranked;
  }, [items, q, engine, ui.cmdkRun]);

  useEffect(() => {
    const d = ref.current; if (!d) return;
    if (paletteOpen && !d.open) { setQ(''); setSel(0); d.showModal(); input.current?.focus(); }
    else if (!paletteOpen && d.open) d.close();
  }, [paletteOpen]);
  useEffect(() => { setSel(0); }, [q]);

  const choose = (it: Item) => { engine.closePalette(); it.run(); };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel(s => Math.min(results.length - 1, s + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel(s => Math.max(0, s - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (results[sel]) choose(results[sel]); }
    else if (e.key === 'Escape') { e.preventDefault(); engine.closePalette(); }   // besides the dialog's own cancel
  };

  let lastGroup = '';
  return (
    <dialog ref={ref} className="palette" aria-label={ui.cmdkLabel} onClose={() => engine.closePalette()} onClick={e => { if (e.target === ref.current) engine.closePalette(); }}>
      <div className="palette-box">
        <input ref={input} className="palette-input" value={q} placeholder={ui.cmdkPlaceholder} aria-label={ui.cmdkLabel} autoComplete="off" spellCheck={false}
          onChange={e => setQ(e.target.value)} onKeyDown={onKey} role="combobox" aria-expanded="true" aria-controls="palette-list" aria-activedescendant={results[sel] ? 'palette-' + sel : undefined} />
        <ul className="palette-list" id="palette-list" role="listbox">
          {results.map((it, i) => {
            const head = it.group !== lastGroup; lastGroup = it.group;
            return (
              <li key={it.group + it.label + i} id={'palette-' + i} role="option" aria-selected={i === sel} data-selected={i === sel || undefined}
                onMouseEnter={() => setSel(i)} onClick={() => choose(it)}>
                {head && <span className="palette-group">{it.group}</span>}
                <span className="palette-label">{it.label}</span>
                {it.hint && <span className="palette-hint">{it.hint}</span>}
              </li>
            );
          })}
        </ul>
        <div className="palette-foot">{ui.cmdkHint}</div>
      </div>
    </dialog>
  );
}
