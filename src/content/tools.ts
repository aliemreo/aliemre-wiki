/* TOOLS: each run() is a pure function returning the output string.
   Adding one = append an object here.  It becomes a command, a row in the
   Tools section, and a row in the `tools` pipe source. */
import type { Bi, Lang } from './types.ts';

export interface ToolCtx { lang: Lang; pipesHelp: string }
export interface Tool {
  names: string[];
  usage: string;
  desc: Bi;
  example: string;
  run: (arg: string, ctx: ToolCtx) => string;
}

export const TOOLS: Tool[] = [
  { names: ['tokens', 'token'], usage: 'tokens <text>', desc: { en: 'Rough token count for a piece of text, using the ~4 characters per token rule.', tr: 'Bir metin için kabaca token sayısı, ~4 karakter/token kuralıyla.' }, example: 'tokens the quick brown fox',
    run: a => { if (!a) return 'usage: tokens <text>'; const chars = a.length, words = a.split(/\s+/).filter(Boolean).length, t = Math.max(1, Math.round(chars / 4)); return `${chars} chars · ${words} words · ~${t} tokens`; } },
  { names: ['tr', 'ascii'], usage: 'tr <text>', desc: { en: 'Turkish characters to ASCII (ç→c, ş→s, ı→i). Handy for slugs and filenames.', tr: 'Türkçe karakterleri ASCII\'ye çevirir (ç→c, ş→s, ı→i). Slug ve dosya adları için.' }, example: 'tr İstanbul Boğazı',
    run: a => { if (!a) return 'usage: tr <text>'; const map: Record<string, string> = { ç: 'c', Ç: 'C', ğ: 'g', Ğ: 'G', ı: 'i', İ: 'I', ö: 'o', Ö: 'O', ş: 's', Ş: 'S', ü: 'u', Ü: 'U' }; return a.replace(/[çÇğĞıİöÖşŞüÜ]/g, c => map[c]); } },
  { names: ['cron'], usage: 'cron <expr>', desc: { en: 'Explains a five-field cron expression in plain words.', tr: 'Beş alanlı bir cron ifadesini düz sözcüklerle açıklar.' }, example: 'cron 0 9 * * 1-5',
    run: a => {
      const f = a.trim().split(/\s+/); if (f.length !== 5) return 'usage: cron <min> <hour> <day> <month> <weekday>';
      const [mi, h, d, mo, w] = f, days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const name = (v: string, arr: string[]) => v.replace(/\d+/g, n => arr[+n] ?? n);
      const every = (v: string, unit: string) => (v === '*' ? `every ${unit}` : v.startsWith('*/') ? `every ${v.slice(2)} ${unit}s` : null);
      let when: string;
      if (mi === '*' && h === '*') when = 'every minute';
      else if (every(mi, 'minute') && h === '*') when = every(mi, 'minute') as string;
      else if (h === '*') when = `at minute ${mi} of every hour`;
      else if (every(h, 'hour')) when = `${every(h, 'hour')} at minute ${mi === '*' ? '0' : mi}`;
      else when = `at ${h.split(',').map(x => x.padStart(2, '0')).join(', ')}:${(mi === '*' ? '0' : mi).padStart(2, '0')}`;
      const parts = [when];
      if (d !== '*') parts.push(`on day ${d} of the month`);
      if (mo !== '*') parts.push(`in month ${mo}`);
      if (w !== '*') parts.push(`on ${name(w, days).replace('-', ' to ').replace(/,/g, ', ')}`);
      return parts.join(' ');
    } },
  { names: ['ts', 'epoch'], usage: 'ts [n|date]', desc: { en: 'Unix timestamp to ISO date and back. No argument gives now.', tr: 'Unix zaman damgasını ISO tarihe ve tersine çevirir. Parametresiz şu anı verir.' }, example: 'ts 1767225600',
    run: a => { let d: Date; if (!a) d = new Date(); else if (/^\d+$/.test(a)) d = new Date(+a * (a.length > 10 ? 1 : 1000)); else d = new Date(a); if (isNaN(d.getTime())) return `could not parse: ${a}`; return `${Math.floor(d.getTime() / 1000)}  ${d.toISOString()}  ${d.toLocaleString()}`; } },
  { names: ['calc', '='], usage: 'calc <expr>', desc: { en: 'Arithmetic with + − × ÷ ^ and parentheses. Nothing is evaluated as code.', tr: '+ − × ÷ ^ ve parantezle aritmetik. Hiçbir şey kod olarak çalıştırılmaz.' }, example: 'calc (1024*8)/1e6',
    run: a => { if (!a) return 'usage: calc <expr>'; const s = a.replace(/×/g, '*').replace(/÷/g, '/').replace(/\^/g, '**').replace(/\s+/g, ''); if (!/^[\d.()+\-*/e%]+$/.test(s)) return 'only numbers and + - * / ^ ( ) allowed'; try { const v = Function('"use strict";return (' + s + ')')() as number; return Number.isFinite(v) ? `${a} = ${+v.toPrecision(12)}` : 'not a number'; } catch { return `could not evaluate: ${a}`; } } },
  { names: ['pipes', 'borular'], usage: 'a | b | c', desc: { en: 'Unix-style pipes over everything on this page: filter, sort, count, open.', tr: 'Sayfadaki her şey üzerinde Unix tarzı borular: filtrele, sırala, say, aç.' }, example: 'projects | stack | sort | uniq', run: (_a, ctx) => ctx.pipesHelp },
];
