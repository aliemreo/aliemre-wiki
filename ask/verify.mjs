/**
 * The grounding check for the debate (pure; `node --test ask/verify.test.mjs`).
 *
 * Every sentence a character says is checked before it is forwarded:
 *   - a citation [src:<id>] to an unknown file is dropped; a known one is
 *     expanded to [src:<id>|<title>|<href>] so the site can label and link it
 *     without carrying the knowledge index;
 *   - every number in a cited sentence must occur in a cited file (after
 *     normalising thousands separators, decimal commas and `100 %`);
 *   - a sentence that states a number without any citation is flagged.
 * A flagged sentence is wrapped as [! … !]; the site shows it muted with an
 * `unverified` tag.  Marker lines (`@@ who`, `== verdict`, `?? follow-up`)
 * pass through untouched, except that an unknown verdict key becomes `unclear`.
 *
 * This is what can be checked deterministically: that each claim points at a
 * real file and that its numbers are really there.  Wording is the model's.
 */

/* knowledge.txt → { id: { title, href, text } } (sections start with `=== id | title | href`) */
export function parseKnowledge(text) {
  const files = {};
  let cur = null;
  for (const line of text.split('\n')) {
    const m = /^=== ([a-z0-9-]+) \| ([^|]*?) \| ?(.*)$/.exec(line);
    if (m) { cur = files[m[1]] = { title: m[2].trim(), href: m[3].trim(), text: '' }; continue; }
    if (cur) cur.text += line + '\n';
  }
  for (const f of Object.values(files)) f.numbers = new Set(numbers(f.text));
  return files;
}

/* the candidates one written number may stand for: 1,000 → 1000 or 1.000 (a Turkish decimal); 0,177 → 0.177; 100 % → 100 and 100% */
function candidates(raw) {
  let n = raw.replace(/\s+/g, '').replace(/[.,]+$/, '');
  const pct = n.endsWith('%'); if (pct) n = n.slice(0, -1);
  let out;
  if (/^\d{1,3}(,\d{3})+$/.test(n)) out = n.startsWith('0,') ? [n.replace(',', '.')] : [n.replace(/,/g, ''), n.replace(',', '.')];
  else if (/^\d+,\d+$/.test(n)) out = [n.replace(',', '.')];
  else out = [n];
  return pct ? out.flatMap(c => [c, c + '%']) : out;
}
/* every number in a text, normalised (all readings) */
export function numbers(text) { return groups(text).flat(); }
/* one array of readings per number written in the text */
export function groups(text) { return [...text.matchAll(/\d[\d.,]*(?:\s?%)?/g)].map(m => candidates(m[0])); }

const SRC = /\[src:([a-z0-9-]+)(?:\|[^\]]*)?\]/g;
const TOKEN = /\[\[(?:go|project|cmd):[^\]\n]+\]\]/g;

/* one sentence: expand or drop citations, then check its numbers */
export function checkSentence(s, files) {
  const ids = [];
  const text = s.replace(SRC, (_, id) => { if (!files[id]) return ''; ids.push(id); return `[src:${id}|${files[id].title}|${files[id].href}]`; }).replace(/ {2,}/g, ' ').replace(/ +([.,;!?])/g, '$1');
  const bare = text.replace(SRC, '').replace(TOKEN, '');
  const nums = groups(bare);
  if (!nums.length) return text;
  if (!ids.length) return `[! ${text.trim()} !]`;
  const ok = nums.every(g => g.some(n => ids.some(id => files[id].numbers.has(n))));
  return ok ? text : `[! ${text.trim()} !]`;
}

const MARKER = /^(@@ |== |\?\? )/;
const BOUNDARY = /[.!?…]["”’)\]]*(?=\s)/g;

/* Streaming verifier: push() returns what may be forwarded now, flush() the rest. */
export class Verifier {
  constructor(files, verdictKeys = []) { this.files = files; this.keys = verdictKeys; this.buf = ''; }
  push(chunk) {
    this.buf += chunk;
    let out = '';
    for (;;) {
      const nl = this.buf.indexOf('\n');
      if (nl < 0) break;
      const line = this.buf.slice(0, nl); this.buf = this.buf.slice(nl + 1);
      out += this.line(line) + '\n';
    }
    /* within the pending line, forward whole sentences (keep the last, possibly unfinished, one) */
    if (this.buf && !MARKER.test(this.buf)) {
      let last = 0; const parts = [];
      for (const m of this.buf.matchAll(BOUNDARY)) { parts.push(this.buf.slice(last, m.index + m[0].length)); last = m.index + m[0].length; }
      if (parts.length) { out += this.sentences(parts.join('')); this.buf = this.buf.slice(last); }
    }
    return out;
  }
  flush() { const rest = this.buf; this.buf = ''; return rest ? this.line(rest) : ''; }
  line(line) {
    if (/^== /.test(line)) { const k = line.slice(3).trim(); return '== ' + (this.keys.length && !this.keys.includes(k) ? 'unclear' : k); }
    if (MARKER.test(line)) return line;
    return this.sentences(line);
  }
  sentences(text) {
    let out = '', last = 0;
    for (const m of text.matchAll(BOUNDARY)) { const end = m.index + m[0].length; out += checkSentence(text.slice(last, end), this.files); last = end; }
    if (last < text.length) out += checkSentence(text.slice(last), this.files);
    return out;
  }
}

/* the transcript as plain prose for the next model call: markers kept, citations shortened, flags removed */
export function plainTranscript(text) {
  return text.replace(/\[src:([a-z0-9-]+)\|[^\]]*\]/g, '[src:$1]').replace(/\[! ?/g, '').replace(/ ?!\]/g, '');
}
