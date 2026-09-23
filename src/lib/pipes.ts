/* PIPES: sources produce rows, stages transform them.
   `projects | grep agents | stack | uniq -c` */
import { CONTENT } from '@/content/content.ts';
import { SECTIONS } from '@/content/sections.ts';
import { TOOLS } from '@/content/tools.ts';
import type { Lang } from '@/content/types.ts';
import { L } from './i18n.ts';
import { plain } from './rich.ts';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = Record<string, any> | string | number;

export const rowText = (r: Row): string => {
  if (typeof r !== 'object' || r === null) return String(r);
  switch (r._t) {
    case 'project': return `${r.slug.padEnd(10)} ${r.name}  [${r.tags.join(',')}]  ${r.stack.join(', ')}`;
    case 'reading': return `${r.date}  ${r.kind.padEnd(5)} ${r.title} — ${r.authors}  [${r.tags.join(',')}]`;
    case 'skill': return `${r.group.padEnd(22)} ${r.skill}${r.tag ? '  [' + r.tag + ']' : ''}`;
    case 'experience': return `${r.dates.padEnd(20)} ${r.title} — ${r.org}`;
    case 'writing': return `${r.date}  ${r.title}`;
    case 'history': return `${String(r.n).padStart(3)}  ${r.cmd}`;
    case 'tool': return `${r.usage.padEnd(14)} ${r.desc}`;
    default: return JSON.stringify(r);
  }
};

const fieldOf = (r: Row, f: string): unknown => {
  if (typeof r !== 'object' || r === null) return r;
  if (f in r) return r[f];
  if (f + 's' in r) return r[f + 's'];
  if (f.endsWith('s') && f.slice(0, -1) in r) return r[f.slice(0, -1)];
  return undefined;
};
const cmpVal = (v: unknown, op: string, want: string): boolean => {
  if (Array.isArray(v)) return op === '!=' ? !v.map(String).includes(want) : v.map(String).some(x => (op === '~' ? new RegExp(want, 'i').test(x) : x === want));
  if (v === undefined || v === null) return op === '!=';
  const s = String(v), n = parseFloat(s), w = parseFloat(want), num = !isNaN(n) && !isNaN(w);
  switch (op) {
    case '=': return s.toLowerCase() === want.toLowerCase();
    case '!=': return s.toLowerCase() !== want.toLowerCase();
    case '~': return new RegExp(want, 'i').test(s);
    case '>': return num ? n > w : s > want;
    case '<': return num ? n < w : s < want;
    case '>=': return num ? n >= w : s >= want;
    case '<=': return num ? n <= w : s <= want;
  }
  return false;
};
const explode = (rows: Row[], key: string): Row[] => rows.flatMap(r => { const v = fieldOf(r, key); return Array.isArray(v) ? v : v === undefined ? [] : [v as Row]; });

/* `2026-09` must not sort as the number 2026, so only whole numeric strings compare numerically */
const isNum = (v: unknown) => typeof v === 'number' || (typeof v === 'string' && /^-?\d+(\.\d+)?$/.test(v.trim()));
type Stage = (rows: Row[], a: string) => Row[];
/* A stage throws a plain string for a usage error; that string is shown as-is. */
export const STAGES: Record<string, Stage> = {
  grep: (rows, a) => { if (!a) throw 'usage: grep <pattern>'; let inv = false; if (a.startsWith('-v ')) { inv = true; a = a.slice(3); } const re = new RegExp(a, 'i'); return rows.filter(r => re.test(rowText(r)) !== inv); },
  where: (rows, a) => { const m = a.match(/^(\w+)\s*(!=|>=|<=|=|>|<|~)\s*(.+)$/); if (!m) throw 'usage: where <field><op><value>   ops: = != > < >= <= ~'; return rows.filter(r => cmpVal(fieldOf(r, m[1]), m[2], m[3].trim())); },
  sort: (rows, a) => { const rev = /(^|\s)-r(\s|$)/.test(a); const f = a.replace(/-r/, '').trim(); const key = (r: Row) => (f ? fieldOf(r, f) : rowText(r)); const out = [...rows].sort((x, y) => { const kx = key(x), ky = key(y); if (isNum(kx) && isNum(ky)) return Number(kx) - Number(ky); return String(kx ?? '').localeCompare(String(ky ?? '')); }); return rev ? out.reverse() : out; },
  uniq: (rows, a) => { const counts = new Map<string, number>(); rows.forEach(r => { const k = rowText(r); counts.set(k, (counts.get(k) || 0) + 1); }); const ks = [...counts.keys()]; return a.includes('-c') ? ks.map(k => `${String(counts.get(k)).padStart(3)}  ${k}`).sort((x, y) => parseInt(y) - parseInt(x)) : ks; },
  head: (rows, a) => rows.slice(0, parseInt(a) || 5),
  tail: (rows, a) => rows.slice(-(parseInt(a) || 5)),
  count: rows => [rows.length],
  wc: rows => [rows.length],
  tags: rows => explode(rows, 'tags'),
  stack: rows => explode(rows, 'stack'),
  fields: (rows, a) => { if (!a) throw 'usage: fields <a,b,c>'; const fs = a.split(/[,\s]+/).filter(Boolean); return rows.map(r => fs.map(f => { const v = fieldOf(r, f); return Array.isArray(v) ? v.join(',') : String(v ?? ''); }).join('  ')); },
  cols: (rows, a) => STAGES.fields(rows, a),
  json: rows => [JSON.stringify(rows.map(r => { if (typeof r !== 'object') return r; const { _t, ...o } = r; void _t; return o; }), null, 1)],
  first: rows => rows.slice(0, 1),
  last: rows => rows.slice(-1),
  shuf: rows => [...rows].sort(() => Math.random() - 0.5),
  rev: rows => [...rows].reverse(),
};
export const SOURCES = ['projects', 'reading', 'skills', 'experience', 'education', 'writing', 'history', 'tools', 'ls'];

export interface SourceCtx { lang: Lang; hist: string[] }
/* `name` must already be a primary source name; the terminal resolves aliases. */
export function sourceRows(name: string, arg: string, ctx: SourceCtx): Row[] | null {
  const lang = ctx.lang;
  const P = (v: Parameters<typeof L>[0]) => plain(L(v as string, lang) as string);   // [[tokens]] → text
  switch (name) {
    case 'projects': return CONTENT.projects.filter(p => !arg || (p.tags as string[]).includes(arg) || p.slug === arg).map(p => ({ _t: 'project', slug: p.slug, name: P(p.name), tags: p.tags, stack: p.stack, featured: !!p.featured, problem: P(p.problem), outcome: P(p.outcome) }));
    case 'reading': return CONTENT.reading.filter(r => !arg || (r.tags as string[]).includes(arg) || r.kind === arg).map(r => ({ _t: 'reading', date: r.date, year: r.date.slice(0, 4), kind: r.kind, title: P(r.title), authors: r.authors, tags: r.tags, note: P(r.note) }));
    case 'skills': return CONTENT.skills.flatMap(g => g.items.map(s => ({ _t: 'skill', group: L(g.group, lang), skill: L(s.label, lang), tag: s.tag || '' }))).filter(s => !arg || s.tag === arg);
    case 'experience': return CONTENT.experience.map(e => ({ _t: 'experience', dates: P(e.dates), title: P(e.title), org: P(e.org) }));
    case 'education': return CONTENT.education.map(e => ({ _t: 'experience', dates: P(e.dates), title: P(e.title), org: P(e.org) }));
    case 'writing': return CONTENT.writing.map(w => ({ _t: 'writing', date: w.date, year: w.date.slice(0, 4), title: L(w.title, lang) }));
    case 'history': return ctx.hist.map((c, i) => ({ _t: 'history', n: i + 1, cmd: c }));
    case 'tools': return TOOLS.map(t => ({ _t: 'tool', usage: t.usage, name: t.names[0], desc: L(t.desc, lang) }));
    case 'ls': return SECTIONS.slice();
    default: return null;
  }
}
