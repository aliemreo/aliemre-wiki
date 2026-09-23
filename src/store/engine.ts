/* The site's behaviour, framework-free.  React renders from `doc` and `term`;
   every interaction — clicks on the left, commands on the right, the hash
   router — goes through this object, so everything is logged in the terminal
   and both columns stay in step.  State lives here and is pushed to React
   after each change, which keeps the old synchronous semantics. */
import { BGS, CONTENT, PALETTES, TAGS } from '@/content/content.ts';
import { SECTIONS } from '@/content/sections.ts';
import { TOOLS } from '@/content/tools.ts';
import type { Bg, Lang, Palette, Tag, Theme } from '@/content/types.ts';
import { MSG, UI } from '@/content/ui.ts';
import { clipboard } from '@/lib/clipboard.ts';
import { settleAllFlaps } from '@/lib/flap.ts';
import { resolver } from '@/lib/i18n.ts';
import { reduced } from '@/lib/motion.ts';
import { FONTS, KEYS, DEFAULT_PREFS, TERM_H, TERM_MODES, TERM_W, readPrefs, store, type FontId, type Prefs, type TermMode } from '@/lib/prefs.ts';
import { STAGES, SOURCES, rowText, sourceRows } from '@/lib/pipes.ts';
import { plain } from '@/lib/rich.ts';
import { isPlaceholder, realHref, visible } from '@/lib/placeholder.ts';
import { plainAnswer } from '@/lib/askmd.ts';
import { cast, fallback, triggers } from '../../ask/characters.json';
import { cmds, type Command } from '@/terminal/commands.ts';

export interface PendingGuest { name: string; date: string; message: string; pending: true }
export interface DocState extends Prefs {
  filter: Tag | null;
  readFilter: Tag | null;
  openSlug: string | null;
  copied: boolean;
  pendingGuests: PendingGuest[];
  ready: boolean;           // prefs read from <html>; false during prerender and hydration
  paletteOpen: boolean;     // the ⌘K command palette
  ask: AskState;            // the "ask me a question" panel in the top bar
  askEndpoint: string | null;   // CONTENT.meta.ask (or ?ask= override), null until a real URL is set
  mail: MailState;          // the mail dialog
  mailEndpoint: string | null;  // CONTENT.meta.mail (or ?mail= override), null until a real URL is set
}
export interface AskTurn { id: number; cmd: 'ask' | 'search' | 'debate'; q: string; a: string; done: boolean; fresh?: boolean /* made in this session: reveal it */; stopped?: boolean; interrupted?: boolean /* a debate the visitor cut in on */; error?: string }
export interface AskState { open: boolean; turns: AskTurn[]; status: 'idle' | 'thinking' | 'streaming' | 'done' | 'error' }
export interface MailState { open: boolean; draft: string /* prefill from `mail <text>` */; status: 'idle' | 'sending' | 'sent' | 'error'; error?: string }
export interface MailForm { name: string; email: string; message: string; hp: string }
export interface LogEntry { id: number; cmd: string; args: string; out: string; kind: '' | 'err' | 'ok'; stream?: boolean /* text arrives live: no typing effect */ }
export interface TermState {
  input: string; hist: string[]; histIdx: number; log: LogEntry[]; focused: boolean;
  section: string; hoverHint: string; inProjects: boolean; inReading: boolean;
  expanded: boolean;        // phones: the log is shown only while expanded
  cleared: boolean;         // `clear` wipes the banner and welcome too, like a real screen
}

export const INITIAL_DOC: DocState = { ...DEFAULT_PREFS, filter: null, readFilter: null, openSlug: null, copied: false, pendingGuests: [], ready: false, paletteOpen: false, ask: { open: false, turns: [], status: 'idle' }, askEndpoint: null, mail: { open: false, draft: '', status: 'idle' }, mailEndpoint: null };
export const INITIAL_TERM: TermState = { input: '', hist: [], histIdx: -1, log: [], focused: false, section: '', hoverHint: '', inProjects: false, inReading: false, expanded: false, cleared: false };

const ERR_RE = /^(command not found|komut bulunamadı|no |could not|usage|kullanım|only numbers|henüz|cevap alınamadı|gönderilemedi|.* diye bir|.* yok\b)/;
const OK_RE = /^(→|copied|kopyalandı|e-posta|posted|gönderildi|theme|tema|language|dil|font|yazı tipi|palette|palet|background|arka plan)/;
const HIST_KEY = 'aeo-hist', EXPANDED_KEY = 'aeo-term-expanded', ASK_KEY = 'aeo-ask-thread';
/* a hiring question goes to the debate (§5.14): the trigger words of characters.json in every language, or a character's first name */
const HIRING = new RegExp([...Object.values(triggers).flat(), ...Object.values(cast).map(c => (typeof c.name === 'string' ? c.name.split(' ')[0] : '')).filter(Boolean)].map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'i');
export const isHiring = (q: string) => HIRING.test(q.toLocaleLowerCase('tr')) || HIRING.test(q);
const session = { get: (k: string) => { try { return sessionStorage.getItem(k); } catch { return null; } }, set: (k: string, v: string) => { try { sessionStorage.setItem(k, v); } catch { /* private mode */ } } };
const LOG_CAP = 60;
const isTag = (t: string): t is Tag => (TAGS as readonly string[]).includes(t);

export class Engine {
  doc: DocState = INITIAL_DOC;
  term: TermState = INITIAL_TERM;
  private input: HTMLInputElement | null = null;
  private wantFocus = false;     // focus the prompt as soon as the terminal mounts
  private pendingId: number | null = null;
  private askInput: HTMLInputElement | null = null;
  private askCtl: AbortController | null = null;
  private askStopped = false;
  private askSeq = 1;
  private mailOpenedAt = 0;
  private mailCtl: AbortController | null = null;
  private nextId = 1;
  private copyT = 0;
  private pushDoc: (d: DocState) => void;
  private pushTerm: (t: TermState) => void;
  /* resolve an { en, tr } pair in the current language */
  L = resolver(() => this.doc.lang);

  constructor(pushDoc: (d: DocState) => void, pushTerm: (t: TermState) => void) {
    this.pushDoc = pushDoc;
    this.pushTerm = pushTerm;
  }

  private setDoc(patch: Partial<DocState>) { this.doc = { ...this.doc, ...patch }; this.pushDoc(this.doc); }
  private setTerm(patch: Partial<TermState>) { this.term = { ...this.term, ...patch }; this.pushTerm(this.term); }

  ui() { return UI[this.doc.lang]; }
  msg() { return MSG[this.doc.lang]; }

  /* ---- boot: runs once on the client, after hydration --------------------- */
  boot() {
    this.setDoc({ ...readPrefs(), ready: true });
    /* history and the phone header state survive a reload within the tab */
    try { const h = JSON.parse(session.get(HIST_KEY) || '[]'); if (Array.isArray(h)) this.setTerm({ hist: h.filter(x => typeof x === 'string').slice(-50), expanded: session.get(EXPANDED_KEY) === '1' }); } catch { /* ignore */ }
    this.normalisePath();
    this.applyHash(true);
    /* the answering endpoint: ?ask=<url> (a debugging aid) beats CONTENT.meta.ask; a placeholder means no field */
    const over = new URLSearchParams(location.search).get('ask');
    const conf = CONTENT.meta.ask || '';
    this.setDoc({ askEndpoint: over && /^https?:\/\//.test(over) ? over : realHref(conf) && /^https?:\/\//.test(conf) ? conf : null });
    /* the mail endpoint, the same way: ?mail=<url> beats CONTENT.meta.mail */
    const mOver = new URLSearchParams(location.search).get('mail'), mConf = CONTENT.meta.mail || '';
    this.setDoc({ mailEndpoint: mOver && /^https?:\/\//.test(mOver) ? mOver : realHref(mConf) && /^https?:\/\//.test(mConf) ? mConf : null });
    /* the conversation survives a reload within the tab */
    try { const t = JSON.parse(session.get(ASK_KEY) || '[]'); if (Array.isArray(t)) this.setAsk({ turns: t.filter(x => x && typeof x.q === 'string' && typeof x.a === 'string').slice(-8).map(x => ({ id: this.askSeq++, cmd: x.cmd === 'search' || x.cmd === 'debate' ? x.cmd : 'ask', q: x.q, a: x.a, done: true })) }); } catch { /* ignore */ }
  }
  attach(): () => void {
    const onHash = () => this.applyHash(false);
    const onKey = (e: KeyboardEvent) => this.onGlobalKey(e);
    const mq = window.matchMedia ? window.matchMedia('print') : null;
    const onPrint = (e: MediaQueryListEvent) => { if (e.matches) settleAllFlaps(); };
    window.addEventListener('hashchange', onHash);
    window.addEventListener('keydown', onKey);
    window.addEventListener('beforeprint', settleAllFlaps);
    mq?.addEventListener?.('change', onPrint);
    return () => {
      window.removeEventListener('hashchange', onHash);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('beforeprint', settleAllFlaps);
      mq?.removeEventListener?.('change', onPrint);
    };
  }

  /* ---- terminal plumbing --------------------------------------------------- */
  registerInput(el: HTMLInputElement | null) { this.input = el; if (el && this.wantFocus) { this.wantFocus = false; el.focus(); } }
  focusBar() { if (this.doc.term === 'folded') { this.wantFocus = true; this.openTerm(); return; } if (this.input) this.input.focus(); else this.wantFocus = true; }

  /* ---- the terminal window: folded, open, wide, full, or mini (floating) --- */
  setTermMode(term: TermMode) {
    if (term === this.doc.term) return;
    this.setDoc({ term });
    document.documentElement.setAttribute('data-term', term);
    store(KEYS.term, term);
  }
  openTerm() { if (this.doc.term === 'folded') this.setTermMode('open'); }
  foldTerm() { this.setTermMode('folded'); }
  /* yellow dot: minimize to a small floating window bottom-right; again restores */
  minimizeTerm() { this.setTermMode(this.doc.term === 'mini' ? 'open' : 'mini'); }
  /* the green dot cycles open → wide → full → open; from mini it restores open */
  toggleWide() { this.setTermMode(this.doc.term === 'open' ? 'wide' : this.doc.term === 'wide' ? 'full' : 'open'); }
  /* dragged sizes: a custom width (desktop) or log height (phones), or null to reset */
  setTermWidth(px: number | null, persist = true) {
    const root = document.documentElement;
    if (px === null) root.style.removeProperty('--term-w');
    else root.style.setProperty('--term-w', Math.round(Math.min(Math.max(px, TERM_W.min), window.innerWidth * TERM_W.maxVw)) + 'px');
    if (persist) { try { if (px === null) localStorage.removeItem(TERM_W.key); else store(TERM_W.key, root.style.getPropertyValue('--term-w').replace('px', '')); } catch { /* private mode */ } }
    if (this.doc.term === 'folded' || this.doc.term === 'full' || this.doc.term === 'mini') this.setTermMode('open');
  }
  termWidth(): number { const v = parseInt(document.documentElement.style.getPropertyValue('--term-w'), 10); return v > 0 ? v : (document.querySelector('.term')?.getBoundingClientRect().width ?? 0); }
  setTermHeight(px: number | null, persist = true) {
    const root = document.documentElement;
    if (px === null) { root.style.removeProperty('--term-h'); root.removeAttribute('data-term-h'); }
    else { root.style.setProperty('--term-h', Math.round(Math.min(Math.max(px, TERM_H.min), window.innerHeight * TERM_H.maxVh)) + 'px'); root.setAttribute('data-term-h', ''); }
    if (persist) { try { if (px === null) localStorage.removeItem(TERM_H.key); else store(TERM_H.key, root.style.getPropertyValue('--term-h').replace('px', '')); } catch { /* private mode */ } }
  }
  /* `term [open|wide|full|mini|fold|<px>]` */
  termCmd(arg: string) {
    const m = this.msg();
    if (!arg) { this.out(m.termState(this.doc.term, Math.round(this.termWidth()))); return; }
    if (arg === 'fold' || arg === 'folded' || arg === 'kapat') { this.out(m.termMode('folded')); this.foldTerm(); return; }
    if (arg === 'min' || arg === 'küçült') arg = 'mini';
    if ((TERM_MODES as readonly string[]).includes(arg)) { this.setTermMode(arg as TermMode); this.out(m.termMode(arg)); return; }
    const px = parseInt(arg, 10);
    if (px > 0) { this.setTermWidth(px); this.out(m.termWidth(Math.round(this.termWidth()))); return; }
    this.out(m.noTermMode(arg));
  }

  /* ---- typeface set (faces are self-hosted; only data-font changes) --------- */
  setFont(f?: string) {
    const font: FontId = f && (FONTS as readonly string[]).includes(f) ? (f as FontId) : f ? 'geist' : this.doc.font === 'geist' ? 'inter' : 'geist';
    if (f && !(FONTS as readonly string[]).includes(f)) { this.out(this.msg().noFont(f, FONTS.join(', '))); return; }
    this.setDoc({ font });
    document.documentElement.setAttribute('data-font', font);
    store(KEYS.font, font);
    this.out(this.msg().font(font));
  }
  setFocused(focused: boolean) { this.setTerm(focused ? { focused, expanded: true } : { focused }); if (focused) session.set(EXPANDED_KEY, '1'); }
  collapse() { if (this.term.expanded) { this.setTerm({ expanded: false }); session.set(EXPANDED_KEY, '0'); } }
  toggleExpanded() { const expanded = !this.term.expanded; this.setTerm({ expanded }); session.set(EXPANDED_KEY, expanded ? '1' : '0'); }
  setInput(input: string) { this.setTerm({ input, histIdx: -1 }); }
  hover(section: string, hoverHint: string) {
    const patch: Partial<TermState> = {};
    if (section && section !== this.term.section) patch.section = section;
    if (hoverHint !== this.term.hoverHint) patch.hoverHint = hoverHint;
    if (Object.keys(patch).length) this.setTerm(patch);
  }
  setSection(section: string) { if (section !== this.term.section) this.setTerm({ section }); }
  setContext(patch: { inProjects?: boolean; inReading?: boolean }) {
    if ((patch.inProjects ?? this.term.inProjects) !== this.term.inProjects || (patch.inReading ?? this.term.inReading) !== this.term.inReading) this.setTerm(patch);
  }

  private addEntry(cmd: string, args: string): LogEntry {
    const entry: LogEntry = { id: this.nextId++, cmd, args, out: '', kind: '' };
    this.setTerm({ log: [...this.term.log, entry].slice(-LOG_CAP) });
    return entry;
  }
  out(text: string) {
    const kind: LogEntry['kind'] = ERR_RE.test(text) ? 'err' : OK_RE.test(text) ? 'ok' : '';
    const id = this.pendingId;
    this.pendingId = null;
    if (id !== null && this.term.log.some(e => e.id === id)) {
      this.setTerm({ log: this.term.log.map(e => (e.id === id ? { ...e, out: text, kind } : e)), expanded: true });
    } else {
      const entry: LogEntry = { id: this.nextId++, cmd: '', args: '', out: text, kind };
      this.setTerm({ log: [...this.term.log, entry].slice(-LOG_CAP), expanded: true });
    }
  }
  clearLog() { this.pendingId = null; this.setTerm({ log: [], cleared: true }); }

  /* ---- commands ------------------------------------------------------------ */
  cmds(): Command[] { return cmds(this); }
  findCmd(name: string) { return this.cmds().find(c => c.names.includes(name)); }
  allNames(): string[] {
    return [...new Set([...this.cmds().filter(c => !c.hidden).flatMap(c => c.names.filter(n => n !== '?')), ...TOOLS.map(t => t.names[0])])];
  }
  isKnownPrefix(word: string) { return !word || !!this.findCmd(word) || this.allNames().some(n => n.indexOf(word) === 0); }
  primaryName(c: Command) { return this.doc.lang === 'tr' && c.names[1] && !c.hidden ? c.names[1] : c.names[0]; }
  helpText() {
    const m = this.msg();
    const rows = this.cmds().filter(c => !c.hidden).map(c => `  ${this.primaryName(c).padEnd(12)} ${this.L(c.desc!)}`);
    return [m.help, ...rows, m.helpTail].join('\n');
  }
  /* `help <command>`: names, arguments, and for a tool its usage and example */
  helpOne(name: string): string {
    const m = this.msg();
    const cmd = this.findCmd(name);
    if (!cmd) return m.notFound(name, this.suggest(name));
    const tool = TOOLS.find(t => t.names === cmd.names);
    const lines = [cmd.names.filter(n => n !== '?').join(' / ')];
    if (cmd.desc) lines.push('  ' + this.L(cmd.desc));
    if (tool) { lines.push('  ' + this.L(tool.desc)); lines.push(`  ${m.helpUsage}  ${tool.usage}`); lines.push(`  ${m.helpExample}  ${tool.example}`); }
    if (cmd.args?.length) lines.push(`  ${m.helpArgs}  ${cmd.args.join(' | ')}`);
    return lines.join('\n');
  }

  /* inline ghost: what Tab (or → at the end of the line) would add */
  suggestion(): string {
    const val = this.term.input;
    if (!val || /\s$/.test(val)) return '';
    if (val.includes('|')) {
      const seg = val.slice(val.lastIndexOf('|') + 1).trimStart();
      if (!seg || seg.includes(' ')) return '';
      const m = Object.keys(STAGES).find(s => s.startsWith(seg.toLowerCase()));
      return m ? m.slice(seg.length) + ' ' : '';
    }
    const parts = val.split(/\s+/);
    if (parts.length === 1) { const m = this.allNames().find(n => n.startsWith(parts[0].toLowerCase()) && n !== parts[0].toLowerCase()); return m ? m.slice(parts[0].length) + ' ' : ''; }
    if (parts.length === 2) { const cmd = this.findCmd(parts[0].toLowerCase()); const m = (cmd?.args || []).find(a => a.startsWith(parts[1].toLowerCase()) && a !== parts[1].toLowerCase()); return m ? m.slice(parts[1].length) : ''; }
    return '';
  }
  acceptSuggestion(): boolean { const s = this.suggestion(); if (!s) return false; this.setInput(this.term.input + s); return true; }

  private suggest(word: string): string | null {
    const lev = (a: string, b: string) => {
      const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)]);
      for (let j = 1; j <= b.length; j++) d[0][j] = j;
      for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      return d[a.length][b.length];
    };
    let best: string | null = null, bd = 3;
    for (const n of this.allNames()) { const d = n.indexOf(word) === 0 ? 0 : lev(word, n); if (d < bd) { bd = d; best = n; } }
    return best;
  }

  exec(raw: string) {
    let line = (raw || '').trim();
    if (!line) return;
    /* shell history expansion: !! is the last command, !n the n-th of `history` */
    const bang = line.match(/^!(!|\d+)$/);
    if (bang) {
      const h = this.term.hist, pick = bang[1] === '!' ? h[h.length - 1] : h[parseInt(bang[1], 10) - 1];
      if (!pick) { this.setTerm({ input: '' }); this.out(this.msg().noHistory); return; }
      line = pick;
    }
    const [name, ...rest] = line.split(/\s+/);
    const hist = [...this.term.hist, line].slice(-50);
    this.setTerm({ hist, histIdx: -1, hoverHint: '', input: '' });
    session.set(HIST_KEY, JSON.stringify(hist));
    this.pendingId = this.addEntry(name, line.slice(name.length)).id;
    const key = name.toLowerCase(), arg = rest.join(' ').toLowerCase();
    try {
      if (line.includes('|')) { this.pipeline(line); return; }
      const cmd = this.findCmd(key);
      if (!cmd) { this.out(this.msg().notFound(name, this.suggest(key))); return; }
      cmd.run(arg, line);
    } catch {
      this.out(this.msg().crashed(name));
    }
  }

  /* `projeler | stack` must work exactly like `projects | stack`, so aliases
     come from the command table rather than a second list that can drift. */
  private sourceName(name: string) {
    if (SOURCES.includes(name)) return name;
    const cmd = this.findCmd(name);
    const primary = cmd && cmd.names[0];
    return primary && SOURCES.includes(primary) ? primary : name;
  }
  rows(name: string, arg: string) { return sourceRows(this.sourceName(name), arg, { lang: this.doc.lang, hist: this.term.hist }); }
  private pipeline(line: string) {
    const m = this.msg();
    const stages = line.split(/\s*\|\s*/).filter(Boolean);
    const [srcName, ...srcArgs] = stages[0].split(/\s+/);
    let rows = this.rows(srcName.toLowerCase(), srcArgs.join(' ').toLowerCase());
    if (!rows) { this.out(m.noSource(srcName, SOURCES.join(', '))); return; }
    try {
      for (const st of stages.slice(1)) {
        const [n, ...a] = st.split(/\s+/);
        const fn = STAGES[n.toLowerCase()];
        if (!fn) throw m.noStage(n, Object.keys(STAGES).join(', '));
        rows = fn(rows, a.join(' '));
      }
    } catch (e) { this.out(typeof e === 'string' ? e : m.crashed(srcName)); return; }
    if (!rows.length) { this.out(m.noRows); return; }
    const lines = rows.slice(0, 200).map(rowText);
    this.out(lines.join('\n') + (rows.length > 200 ? `\n… ${rows.length - 200} more` : ''));
  }

  complete() {
    const val = this.term.input;
    if (val.includes('|')) {
      const i = val.lastIndexOf('|'), seg = val.slice(i + 1).trimStart(), q = seg.split(/\s+/)[0].toLowerCase();
      if (seg.includes(' ')) return;
      const ms = Object.keys(STAGES).filter(s => s.indexOf(q) === 0);
      if (ms.length === 1) this.setInput(val.slice(0, i + 1) + ' ' + ms[0] + ' ');
      else if (ms.length > 1) this.out(ms.join('  '));
      return;
    }
    const parts = val.split(/\s+/);
    if (parts.length <= 1) {
      const q = val.toLowerCase(), ms = this.allNames().filter(n => n.indexOf(q) === 0);
      if (ms.length === 1) this.setInput(ms[0] + ' ');
      else if (ms.length > 1) { let p = ms[0]; for (const x of ms) while (x.indexOf(p) !== 0) p = p.slice(0, -1); this.setInput(p); this.out(ms.join('  ')); }
    } else {
      const cmd = this.findCmd(parts[0].toLowerCase());
      const ms = ((cmd && cmd.args) || []).filter(o => o.indexOf(parts[1].toLowerCase()) === 0);
      if (ms.length === 1) this.setInput(parts[0] + ' ' + ms[0]);
      else if (ms.length > 1) this.out(ms.join('  '));
    }
  }

  onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    const t = this.term;
    const el = e.target as HTMLInputElement;
    if (e.key === 'Enter') { e.preventDefault(); this.exec(t.input || t.hoverHint); }
    else if (e.key === 'Tab') { e.preventDefault(); if (!t.input && t.hoverHint) this.setInput(t.hoverHint + ' '); else if (!this.acceptSuggestion()) this.complete(); }
    else if (e.key === 'ArrowRight' && el.selectionStart === el.value.length && this.suggestion()) { e.preventDefault(); this.acceptSuggestion(); }
    else if (e.key === 'Escape') { if (t.input) this.setInput(''); else el.blur(); }
    else if (e.ctrlKey && e.key.toLowerCase() === 'l') { e.preventDefault(); this.clearLog(); }
    else if (e.ctrlKey && e.key.toLowerCase() === 'u') { e.preventDefault(); this.setInput(''); }
    else if (e.ctrlKey && e.key.toLowerCase() === 'c') { e.preventDefault(); if (t.input) { this.setTerm({ input: '', histIdx: -1, log: [...t.log, { id: this.nextId++, cmd: t.input, args: '', out: '^C', kind: '' as const }].slice(-LOG_CAP) }); } }
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!t.hist.length) return;
      const histIdx = t.histIdx < 0 ? t.hist.length - 1 : Math.max(0, t.histIdx - 1);
      this.setTerm({ histIdx, input: t.hist[histIdx] });
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (t.histIdx < 0) return;
      const histIdx = t.histIdx + 1;
      if (histIdx >= t.hist.length) this.setTerm({ histIdx: -1, input: '' }); else this.setTerm({ histIdx, input: t.hist[histIdx] });
    }
  }
  /* ---- ⌘K palette ----------------------------------------------------------- */
  /* ---- ask me a question: streamed from the owner's endpoint (§5.12) ------- */
  registerAskInput(el: HTMLInputElement | null) { this.askInput = el; }
  private setAsk(patch: Partial<AskState>) { this.setDoc({ ask: { ...this.doc.ask, ...patch } }); }
  private patchTurn(id: number, patch: Partial<AskTurn>) { this.setAsk({ turns: this.doc.ask.turns.map(t => (t.id === id ? { ...t, ...patch } : t)) }); }
  private saveThread() { session.set(ASK_KEY, JSON.stringify(this.doc.ask.turns.filter(t => t.done && !t.error).slice(-8).map(({ cmd, q, a }) => ({ cmd, q, a })))); }
  /* the top-bar field: a question for the endpoint when there is one, otherwise the site search — each one a turn in the same thread.
     A hiring question, a follow-up to the characters (`mode`), or Enter while a debate streams goes to the debate. */
  submitField(raw: string, mode?: 'debate') {
    const q = (raw || '').trim();
    if (!q) return;
    if (this.doc.askEndpoint) { const last = this.lastTurn(); void (mode === 'debate' || (last?.cmd === 'debate' && !last.done) || isHiring(q) ? this.debate(q) : this.ask(q)); return; }
    this.exec('search ' + q);
    const turn: AskTurn = { id: this.askSeq++, cmd: 'search', q, a: this.searchText(q), done: true, fresh: true };
    this.setAsk({ open: true, status: 'done', turns: [...this.doc.ask.turns, turn].slice(-8) });
    this.saveThread();
  }
  lastTurn(): AskTurn | undefined { const t = this.doc.ask.turns; return t[t.length - 1]; }
  focusAsk() { this.askInput?.focus(); }
  openAsk() { if (!this.doc.ask.open) this.setAsk({ open: true }); }
  closeAsk() { if (this.doc.ask.open) this.setAsk({ open: false }); }
  abortAsk() { this.askCtl?.abort(); this.askCtl = null; }
  /* stop: keep what has arrived, mark the turn */
  stopAsk() { if (this.askCtl) { this.askStopped = true; this.askCtl.abort(); } }
  clearAsk() { this.abortAsk(); this.setAsk({ turns: [], status: 'idle' }); session.set(ASK_KEY, '[]'); }
  lastQuestion(): string { const t = this.doc.ask.turns; return t.length ? t[t.length - 1].q : ''; }
  /* an action token in an answer: [[go:section]] [[project:slug]] [[cmd:command]] — only known targets */
  askActionValid(kind: string, value: string): boolean {
    if (kind === 'go') return SECTIONS.includes(value);
    if (kind === 'project') return CONTENT.projects.some(p => p.slug === value);
    if (kind === 'cmd') { const name = value.split(/\s+/)[0]; const c = this.findCmd(name); return !!c && !c.hidden; }
    return false;
  }
  runAskAction(kind: string, value: string) {
    if (kind === 'href') { this.routeHash(value); return; }
    if (!this.askActionValid(kind, value)) return;
    if (kind === 'go') { this.closeAsk(); this.exec(value); }
    else if (kind === 'project') { this.closeAsk(); this.exec('project ' + value); }
    else this.exec(value);
  }
  /* a citation's `#section`, `#projects/<slug>` or `#projects/<tag>` as the command it stands for (logged like every other click) */
  routeHash(hash: string) {
    const [sec, arg] = hash.replace(/^#/, '').split('/');
    const cmd = sec === 'projects' && arg ? (CONTENT.projects.some(p => p.slug === arg) ? 'project ' + arg : isTag(arg) ? 'projects ' + arg : 'projects') : SECTIONS.includes(sec) ? sec : '';
    if (!cmd) return;
    this.closeAsk(); this.exec(cmd);
  }
  ask(raw: string) {
    const m = this.msg(), q = (raw || '').trim().slice(0, 300);
    if (!q) { this.out(m.askUsage); return; }
    /* context: the last four answered turns, as plain prose */
    const history = this.doc.ask.turns.filter(t => t.cmd === 'ask' && t.done && !t.error && t.a).slice(-4).map(t => ({ q: t.q.slice(0, 300), a: plainAnswer(t.a).slice(0, 600) }));
    void this.stream('ask', q, { question: q, lang: this.doc.lang, history });
  }
  /* the debate (§5.14): Defne and Tolga argue the question, the bench rules.  With earlier debate turns in the thread the
     characters get the transcript and answer the visitor's follow-up in one round; Enter while one streams interrupts it. */
  debate(raw: string) {
    const m = this.msg(), q = (raw || '').trim().slice(0, 300);
    if (!q) { this.out(m.debateUsage); return; }
    const last = this.lastTurn();
    if (last?.cmd === 'debate' && !last.done && this.askCtl) { this.patchTurn(last.id, { done: true, interrupted: true }); this.abortAsk(); this.saveThread(); }
    const transcript = this.doc.ask.turns.filter(t => t.cmd === 'debate' && !t.error && t.a).map(t => `visitor: ${t.q}\n${plainAnswer(t.a, true)}`).join('\n\n').slice(-3000);
    void this.stream('debate', q, { question: q, lang: this.doc.lang, mode: 'debate', transcript });
  }
  /* one streamed turn: a log entry filled live, thinking until the first byte, the thread saved when done; 30s idle timeout */
  private async stream(cmd: 'ask' | 'debate', q: string, body: object) {
    const m = this.msg(), url = this.doc.askEndpoint;
    const id = this.askSeq++;
    const turn: AskTurn = { id, cmd, q, a: '', done: false, fresh: true };
    if (!url) { this.out(m.askUnset); this.setAsk({ open: true, status: 'error', turns: [...this.doc.ask.turns, { ...turn, done: true, error: m.askUnset }].slice(-8) }); return; }
    this.abortAsk(); this.askStopped = false;
    const ctl = new AbortController(); this.askCtl = ctl;
    let timer = setTimeout(() => ctl.abort(), 30000);
    const tick = () => { clearTimeout(timer); timer = setTimeout(() => ctl.abort(), 30000); };
    /* one log entry, filled as the text arrives (exec() has already made it when the command came from the prompt) */
    let logId = this.pendingId; this.pendingId = null;
    if (logId === null || !this.term.log.some(e => e.id === logId)) logId = this.addEntry(cmd, ' ' + q).id;
    this.setTerm({ log: this.term.log.map(e => (e.id === logId ? { ...e, stream: true, out: '' } : e)), expanded: true });
    this.setAsk({ open: true, status: 'thinking', turns: [...this.doc.ask.turns, turn].slice(-8) });
    let answer = '';
    const push = () => { this.patchTurn(id, { a: answer }); this.setTerm({ log: this.term.log.map(e => (e.id === logId ? { ...e, out: plainAnswer(answer) } : e)) }); };
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: ctl.signal });
      if (!res.ok || !res.body) throw new Error('HTTP ' + res.status);
      const reader = res.body.getReader(), dec = new TextDecoder();
      for (;;) { const { value, done } = await reader.read(); if (done) break; tick(); if (this.doc.ask.status === 'thinking') this.setAsk({ status: 'streaming' }); answer += dec.decode(value, { stream: true }); push(); }
      answer += dec.decode(); push();
      if (this.askCtl === ctl) { this.patchTurn(id, { done: true }); this.setAsk({ status: 'done' }); this.saveThread(); }
    } catch (e) {
      if (ctl.signal.aborted && this.askStopped && this.askCtl === ctl) { this.askStopped = false; this.patchTurn(id, { done: true, stopped: true }); this.setAsk({ status: 'done' }); this.saveThread(); return; }
      if (ctl.signal.aborted && this.askCtl !== ctl) return;   // replaced by a newer question, interrupted, or closed
      const msg = m.askError(ctl.signal.aborted ? 'timeout' : (e as Error).message || 'network');
      /* a debate that could not start still ends with the bench's fixed fallback (the client's copy of the Worker's) */
      if (cmd === 'debate' && !/^@@ bench/m.test(answer)) answer += `${answer && !answer.endsWith('\n') ? '\n' : ''}@@ bench\n== unclear\n${fallback[this.doc.lang] || fallback.en}\n`;
      this.patchTurn(id, { a: answer, done: true, error: msg }); this.setAsk({ status: 'error' });
      this.setTerm({ log: this.term.log.map(e => (e.id === logId ? { ...e, out: (answer ? plainAnswer(answer) + '\n' : '') + msg, kind: 'err' } : e)) });
    } finally { clearTimeout(timer); if (this.askCtl === ctl) this.askCtl = null; }
  }

  openPalette() { if (!this.doc.paletteOpen) this.setDoc({ paletteOpen: true }); }
  closePalette() { if (this.doc.paletteOpen) this.setDoc({ paletteOpen: false }); }
  togglePalette() { this.setDoc({ paletteOpen: !this.doc.paletteOpen }); }

  private onGlobalKey(e: KeyboardEvent) {
    if (this.doc.mail.open) return;   /* the modal dialog owns the keyboard, Escape included */
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); if (e.shiftKey) this.focusAsk(); else this.togglePalette(); return; }
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    if (e.key === '/') { e.preventDefault(); this.focusBar(); }
    else if (e.key === '?') { e.preventDefault(); this.out(this.helpText()); this.focusBar(); }
    else if (e.key === 'Escape') { if (document.querySelector('.lp-content[data-state="open"]')) return; /* the card closes itself */ if (this.doc.ask.open) { this.closeAsk(); return; } if (this.doc.openSlug) this.closeProject(); else if (this.doc.term === 'full') this.setTermMode('open'); else if (this.doc.term !== 'folded') this.foldTerm(); }
  }

  /* ---- navigation ---------------------------------------------------------- */
  private headerOffset() {
    const wide = window.matchMedia && window.matchMedia('(min-width: 1024px)').matches;
    const term = document.querySelector('.term');
    const bar = document.querySelector('.topbar');
    const barH = bar && getComputedStyle(bar).position === 'sticky' ? bar.getBoundingClientRect().height : 0;
    return (term && !wide ? term.getBoundingClientRect().height : 0) + barH + 16;
  }
  scrollToId(id: string, behavior?: ScrollBehavior) {
    const node = document.getElementById(id);
    if (!node) return;
    const top = node.getBoundingClientRect().top + window.scrollY - this.headerOffset();
    window.scrollTo({ top: Math.max(0, top), behavior: behavior || (reduced() ? 'auto' : 'smooth') });
  }
  private setHash(h: string) { try { history.replaceState(null, '', h ? '#' + h : location.pathname + location.search); } catch { /* sandboxed */ } }
  goto(sec: string) { this.setHash(sec === 'top' ? '' : sec); this.scrollToId(sec); this.out(this.msg().goto(sec)); }

  /* GitHub Pages serves 404.html for an unknown path and sends us here with the
     last path segment as a hash; that segment may be a section name.  Everything
     is measured against whatever the base is, so this is correct at a domain
     root and under a project-site subpath like /<repo>/ alike. */
  private normalisePath() {
    if (location.protocol !== 'http:' && location.protocol !== 'https:') return;
    const path = location.pathname.replace(/index\.html$/, '');
    if (path.endsWith('/')) return;
    let seg = path.split('/').pop() || '';
    try { seg = decodeURIComponent(seg); } catch { /* a malformed path must not break boot */ }
    const base = path.slice(0, path.length - seg.length) || '/';
    const known = SECTIONS.includes(seg);
    try { history.replaceState(null, '', known ? base + '#' + seg : base + location.hash); } catch { /* sandboxed */ }
    if (!known) this.out(this.msg().notAPage(path));
  }
  private applyHash(initial: boolean) {
    let h = '';
    try { h = decodeURIComponent(location.hash.replace(/^#/, '')); } catch { return; }
    if (!h) return;
    const [sec, arg] = h.split('/');
    const behavior: ScrollBehavior | undefined = initial ? 'auto' : undefined;
    const later = (fn: () => void) => setTimeout(fn, initial ? 150 : 0);   // let fonts settle before measuring
    if (sec === 'projects' && arg) {
      if (isTag(arg)) { this.setDoc({ filter: arg, openSlug: null }); later(() => this.scrollToId('projects', behavior)); }
      else if (CONTENT.projects.some(p => p.slug === arg)) {
        /* a filter that hides the project would leave nothing to open */
        const hidden = this.doc.filter && !CONTENT.projects.find(p => p.slug === arg)!.tags.includes(this.doc.filter);
        this.setDoc(hidden ? { openSlug: arg, filter: null } : { openSlug: arg });
        later(() => this.scrollToId('project-' + arg, behavior));
      }
      else later(() => this.scrollToId(sec, behavior));
    } else if (sec === 'reading' && arg && isTag(arg)) {
      this.setDoc({ readFilter: arg }); later(() => this.scrollToId('reading', behavior));
    } else if (SECTIONS.includes(sec)) {
      later(() => this.scrollToId(sec, behavior));
    } else if (initial) {
      /* 404.html sends an unknown path here as a hash; say so and land at the top */
      this.setHash('');
      this.out(this.msg().notAPage('/' + h));
    }
  }

  /* ---- actions ------------------------------------------------------------- */
  filterTo(tag: string) {
    if (!isTag(tag)) { this.out(this.msg().noTag(tag)); return; }
    const n = CONTENT.projects.filter(p => p.tags.includes(tag)).length;
    this.setDoc({ filter: tag, openSlug: null });
    this.setHash('projects/' + tag); this.scrollToId('projects');
    this.out(this.msg().filtered(n, tag));
  }
  clearFilter() { this.setDoc({ filter: null }); this.setHash('projects'); this.out(this.msg().allProjects); }
  readingTo(tag: string) {
    if (!isTag(tag)) { this.out(this.msg().noTag(tag)); return; }
    const n = CONTENT.reading.filter(r => r.tags.includes(tag)).length;
    this.setDoc({ readFilter: tag });
    this.setHash('reading/' + tag); this.scrollToId('reading');
    this.out(this.msg().readFiltered(n, tag));
  }
  clearReadingFilter() { this.setDoc({ readFilter: null }); this.setHash('reading'); this.out(this.msg().allReading); }
  openProject(slug: string) {
    const p = CONTENT.projects.find(x => x.slug === slug);
    if (!p) { this.out(this.msg().noProject(slug)); return; }
    const patch: Partial<DocState> = { openSlug: slug };
    if (this.doc.filter && !p.tags.includes(this.doc.filter)) patch.filter = null;
    this.setDoc(patch);
    this.setHash('projects/' + slug);
    setTimeout(() => this.scrollToId('project-' + slug), 30);
    this.out(this.msg().opened(slug));
  }
  closeProject() {
    if (!this.doc.openSlug) { if (this.doc.filter) { this.clearFilter(); return; } this.out(this.msg().nothingOpen); return; }
    this.setDoc({ openSlug: null });
    this.setHash(this.doc.filter ? 'projects/' + this.doc.filter : 'projects');
    this.out(this.msg().closed);
  }
  setTheme(t?: string) {
    let theme = t === 'koyu' ? 'dark' : t === 'açık' ? 'light' : t;
    if (theme !== 'dark' && theme !== 'light') theme = this.doc.theme === 'dark' ? 'light' : 'dark';
    this.setDoc({ theme: theme as Theme });
    document.documentElement.setAttribute('data-theme', theme);
    store(KEYS.theme, theme);
    this.out(this.msg().theme(theme));
  }
  setPalette(p: string) {
    if (!(PALETTES as readonly string[]).includes(p)) { this.out(this.msg().noPalette(p, PALETTES.join(', '))); return; }
    this.setDoc({ palette: p as Palette });
    document.documentElement.setAttribute('data-palette', p);
    store(KEYS.palette, p);
    this.out(this.msg().palette(p));
  }
  cyclePalette() { this.setPalette(PALETTES[(PALETTES.indexOf(this.doc.palette) + 1) % PALETTES.length]); }
  setBg(b?: string) {
    const bg = b || (this.doc.bg === 'scan' ? 'flat' : 'scan');
    if (!(BGS as readonly string[]).includes(bg)) { this.out(this.msg().noBg(bg, BGS.join(', '))); return; }
    this.setDoc({ bg: bg as Bg });
    document.documentElement.setAttribute('data-bg', bg);
    store(KEYS.bg, bg);
    this.out(this.msg().bg(bg));
  }
  setLang(l?: string) {
    const lang: Lang = l === 'en' || l === 'tr' ? l : this.doc.lang === 'en' ? 'tr' : 'en';
    this.setDoc({ lang });
    document.documentElement.lang = lang;
    store(KEYS.lang, lang);
    this.out(this.msg().lang);
  }
  /* ---- the mail dialog -------------------------------------------------------- */
  /* `mail [text]`: the dialog, pre-filled; without an endpoint, copy the address as before */
  openMail(draft = '') {
    if (!this.doc.mailEndpoint) { this.out(this.msg().mailUnset); this.copyEmail(); return; }
    this.out(this.msg().mailOpen);
    this.mailOpenedAt = Date.now();
    this.setDoc({ mail: { open: true, draft, status: 'idle' } });
  }
  closeMail() { if (this.doc.mail.open) { this.mailCtl?.abort(); this.setDoc({ mail: { ...this.doc.mail, open: false, status: this.doc.mail.status === 'sending' ? 'idle' : this.doc.mail.status } }); } }
  async sendMail(f: MailForm) {
    const url = this.doc.mailEndpoint, m = this.msg();
    if (!url || this.doc.mail.status === 'sending') return;
    this.setDoc({ mail: { ...this.doc.mail, status: 'sending', error: undefined } });
    const ctl = new AbortController(); this.mailCtl = ctl;
    const timer = setTimeout(() => ctl.abort(), 15000);
    const logId = this.addEntry('mail', ' ' + (f.name || 'anonymous')).id;
    const log = (text: string) => { this.pendingId = logId; this.out(text); };
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, signal: ctl.signal,
        body: JSON.stringify({ name: f.name, email: f.email, message: f.message, hp: f.hp, lang: this.doc.lang, t: Date.now() - this.mailOpenedAt }) });
      if (!res.ok) throw new Error((await res.text().catch(() => '')).slice(0, 80) || 'HTTP ' + res.status);
      log(m.mailSent);
      this.setDoc({ mail: { ...this.doc.mail, status: 'sent' } });
    } catch (e) {
      if (ctl.signal.aborted && !this.doc.mail.open) { log(m.mailError('cancelled')); return; }
      const msg = ctl.signal.aborted ? 'timeout' : (e as Error).message || 'network';
      log(m.mailError(msg));
      this.setDoc({ mail: { ...this.doc.mail, status: 'error', error: m.mailError(msg) } });
    } finally { clearTimeout(timer); if (this.mailCtl === ctl) this.mailCtl = null; }
  }
  copyEmail() {
    const address = CONTENT.meta.email;
    clipboard(address).then(() => {
      this.setDoc({ copied: true });
      this.out(this.msg().copied);
      clearTimeout(this.copyT);
      this.copyT = window.setTimeout(() => this.setDoc({ copied: false }), 2500);
    }, () => this.out(this.msg().copyFail(address)));
  }
  /* `share` copies the URL of whatever is on screen — filter and open project included */
  shareLink() {
    const url = location.href;
    clipboard(url).then(() => this.out(this.msg().copiedLink), () => this.out(this.msg().copyLinkFail(url)));
  }
  /* `search` greps every pipe source plus the prose the pipes cannot see */
  search(query: string) { this.out(this.searchText(query)); }
  searchText(query: string): string {
    const m = this.msg(), q = query.trim();
    if (!q) return m.searchUsage;
    let re: RegExp;
    try { re = new RegExp(q, 'i'); } catch { re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'); }
    const groups: [string, string[]][] = [];
    ['projects', 'reading', 'writing', 'skills', 'experience', 'education', 'tools'].forEach(src => {
      const hits = (this.rows(src, '') || []).filter(r => { const t = rowText(r); return re.test(t) && !/Placeholder:/.test(t); });   /* unfinished copy never surfaces in search */
      if (hits.length) groups.push([m.searchIn[src], hits.slice(0, 8).map(rowText)]);
    });
    const c = CONTENT;
    const vis = (s: string) => (isPlaceholder(s) ? '' : s);   /* unfinished copy never surfaces in search */
    const prose: [string, string][] = ([
      ['now', vis(this.L(c.now.text))],
      ['about', visible(this.L(c.about)).join(' ')],
      ['top', [c.hero.line1, c.hero.line2, c.hero.avail].map(x => vis(this.L(x))).join(' ')],
      ['contact', vis(this.L(c.contact.note))],
      ['colophon', visible(this.L(c.colophon)).join(' ')],
    ] as [string, string][]).map(([id, text]) => [id, plain(text)] as [string, string]).filter(([, text]) => re.test(text));
    if (prose.length) groups.push([m.searchIn.text, prose.map(([id, text]) => {
      const at = Math.max(0, text.search(re) - 30);
      return `${id.padEnd(10)} …${text.slice(at, at + 90).trim()}…`;
    })]);
    if (!groups.length) return m.noMatch(q);
    return groups.map(([label, rows]) => [label + ':', ...rows.map(r => '  ' + r)].join('\n')).join('\n');
  }
  openLink(href: string, label: string) {
    this.out(this.msg().opening(label));
    if (href && href !== '#') window.open(href, '_blank', 'noopener');
  }
  print() { settleAllFlaps(); this.out(this.msg().printing); setTimeout(() => window.print(), 80); }
  echoLine(raw: string) {
    const text = (raw || '').trim();
    if (!text) { this.out(this.msg().echoUsage); return; }
    let name = '', message = text;
    const m = text.match(/^([^:]{1,40}):\s*(.+)$/);
    if (m) { name = m[1].trim(); message = m[2].trim(); }
    this.postGuest(name, message);
  }
  postGuest(name: string, message: string) {
    if (!message) { this.out(this.msg().echoUsage); return; }
    const entry: PendingGuest = { name: name || 'anonymous', date: new Date().toISOString().slice(0, 10), message, pending: true };
    this.setDoc({ pendingGuests: [entry, ...this.doc.pendingGuests] });
    const repo = CONTENT.guestbook.repo;
    if (repo && repo.indexOf('placeholder') !== 0) {
      const url = `https://github.com/${repo}/issues/new?title=${encodeURIComponent('guestbook: ' + (name || 'anonymous'))}&body=${encodeURIComponent(message)}`;
      this.out(this.msg().echoOpen);
      window.open(url, '_blank', 'noopener');
    } else this.out(this.msg().echoed);
  }
  history() { return this.term.hist; }
}
