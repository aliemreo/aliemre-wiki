/* The grammar of a streamed answer (§5.12).  Pure, safe on partial text: an
   unterminated **run**, `code` or [[token]] stays plain text until it closes.
   - paragraphs (blank line), bullet lists (`- `), **bold**, `code`
   - [label](https://…) links, kept only when `allow(href)` says so
   - action tokens the model places: [[go:<section>]] [[project:<slug>]] [[cmd:<command>]]
   - follow-up questions the model ends with: lines starting with `?? `
   The debate (§5.14) adds a line protocol on top — `@@ <who>` starts an
   utterance, `== <key>` is the bench's verdict — and two inline forms the
   Worker's verifier writes: `[src:<id>|<title>|<href>]` citations and
   `[! … !]` around a sentence it could not ground. */
export type ActionKind = 'go' | 'project' | 'cmd';
export type Run =
  | { t: 'text'; s: string }
  | { t: 'b'; s: string }
  | { t: 'code'; s: string }
  | { t: 'link'; s: string; href: string }
  | { t: 'action'; kind: ActionKind; value: string }
  | { t: 'src'; id: string; title: string; href: string }
  | { t: 'flag'; runs: Run[] };
export type Block = { t: 'p'; runs: Run[] } | { t: 'ul'; items: Run[][] };
export interface Parsed { blocks: Block[]; followups: string[] }
export interface Utterance { who: string; blocks: Block[] }
export interface Debate { utterances: Utterance[]; verdict: string; followups: string[] }

const INLINE = /\[\[(go|project|cmd):([^\]\n]+)\]\]|\*\*([^*\n]+)\*\*|`([^`\n]+)`|\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)|\[src:([a-z0-9-]+)(?:\|([^|\]\n]*)\|([^\]\n]*))?\]/g;
const FLAG = /\[! ?([\s\S]*?)(?: ?!\]|$)/g;

function inline(line: string, allow: (href: string) => boolean): Run[] {
  const out: Run[] = [];
  let i = 0;
  for (const m of line.matchAll(INLINE)) {
    if (m.index! > i) out.push({ t: 'text', s: line.slice(i, m.index) });
    if (m[1]) out.push({ t: 'action', kind: m[1] as ActionKind, value: m[2].trim() });
    else if (m[3]) out.push({ t: 'b', s: m[3] });
    else if (m[4]) out.push({ t: 'code', s: m[4] });
    else if (m[5]) out.push(allow(m[6]) ? { t: 'link', s: m[5], href: m[6] } : { t: 'text', s: m[5] });
    else out.push({ t: 'src', id: m[7], title: (m[8] || m[7]).trim(), href: (m[9] || '').trim() });
    i = m.index! + m[0].length;
  }
  if (i < line.length) out.push({ t: 'text', s: line.slice(i) });
  return out;
}

/* an unclosed `[!` at the end is a flag still arriving: shown as one */
export function runs(line: string, allow: (href: string) => boolean): Run[] {
  const out: Run[] = [];
  let i = 0;
  for (const m of line.matchAll(FLAG)) {
    if (m.index! > i) out.push(...inline(line.slice(i, m.index), allow));
    out.push({ t: 'flag', runs: inline(m[1], allow) });
    i = m.index! + m[0].length;
  }
  if (i < line.length) out.push(...inline(line.slice(i), allow));
  return out;
}

export function parseAnswer(text: string, allow: (href: string) => boolean = () => false): Parsed {
  const blocks: Block[] = [], followups: string[] = [];
  let para: string[] = [], list: Run[][] = [];
  const flushP = () => { if (para.length) { blocks.push({ t: 'p', runs: runs(para.join('\n'), allow) }); para = []; } };
  const flushL = () => { if (list.length) { blocks.push({ t: 'ul', items: list }); list = []; } };
  for (const raw of text.split('\n')) {
    const line = raw.trimEnd();
    if (/^\?\?\s/.test(line)) { flushP(); flushL(); followups.push(line.replace(/^\?\?\s+/, '').trim()); continue; }
    if (/^[-•*]\s+/.test(line)) { flushP(); list.push(runs(line.replace(/^[-•*]\s+/, ''), allow)); continue; }
    flushL();
    if (!line.trim()) { flushP(); continue; }
    para.push(line);
  }
  flushP(); flushL();
  return { blocks, followups: followups.filter(Boolean) };
}

/* the debate transcript: utterances in order, the bench's verdict key (the last `== ` line), the follow-ups */
export function parseDebate(text: string, allow: (href: string) => boolean = () => false): Debate {
  const parts: { who: string; lines: string[] }[] = [];
  let verdict = '';
  for (const line of text.split('\n')) {
    const who = /^@@\s+(\S+)\s*$/.exec(line);
    if (who) { parts.push({ who: who[1], lines: [] }); continue; }
    const v = /^==\s+(\S+)\s*$/.exec(line);
    if (v) { verdict = v[1]; continue; }
    if (!parts.length) parts.push({ who: '', lines: [] });
    parts[parts.length - 1].lines.push(line);
  }
  const followups: string[] = [];
  const utterances = parts.map(p => { const a = parseAnswer(p.lines.join('\n'), allow); followups.push(...a.followups); return { who: p.who, blocks: a.blocks }; }).filter(u => u.who || u.blocks.length);
  return { utterances, verdict, followups };
}

/* the answer as plain prose: tokens dropped, follow-ups removed, speaker lines as `who: `, flags unwrapped, citations dropped (or kept short with `cite`) — for the clipboard, the history sent back, the terminal, the transcript */
export function plainAnswer(text: string, cite = false): string {
  const lines = text.split('\n');
  /* a last line still arriving that starts a marker or a token is held back */
  if (lines.length && /^(@@|==|\?\?|\[!|\[src:|\[\[)/.test(lines[lines.length - 1]) && !/\n$/.test(text)) lines.pop();
  const out: string[] = [];
  let who = '';
  for (const l of lines) {
    if (/^\?\?\s/.test(l)) continue;
    const w = /^@@\s+(\S+)/.exec(l); if (w) { who = w[1]; continue; }
    const v = /^==\s+(\S+)/.exec(l); if (v) { out.push(`verdict: ${v[1]}`); continue; }
    if (!l.trim()) { out.push(l); continue; }
    out.push(who ? `${who}: ${l}` : l); who = '';
  }
  return out.join('\n')
    .replace(/\[(?:src:|!)[^\]]*$/, '').replace(/\[\[[^\]]*$/, '')
    .replace(/\[\[(?:go|project|cmd):[^\]\n]+\]\]/g, '').replace(/\*\*([^*\n]+)\*\*/g, '$1')
    .replace(/\[src:([a-z0-9-]+)(?:\|[^\]]*)?\]/g, cite ? '[src:$1]' : '').replace(/\[! ?/g, '').replace(/ ?!\]/g, '')
    .replace(/ +([.,;!?])/g, '$1').replace(/[ \t]{2,}/g, ' ').trim();
}
