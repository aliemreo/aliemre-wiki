/* The rules that keep the content honest.  Pure and dependency-free: it runs
   in the browser (dev only) and in Node (scripts/preflight.mjs).
     placeholders   copy that has not been written yet (a count, never fatal)
     untranslated   an English string with no Turkish sibling  (CLAUDE.md §7) */
export interface ContentReport { placeholders: string[]; untranslated: string[] }

export function contentReport(content: unknown): ContentReport {
  const placeholders: string[] = [];
  JSON.stringify(content, (_k, v) => {
    if (typeof v === 'string' && v.indexOf('Placeholder') === 0) placeholders.push(v);
    return v;
  });

  const untranslated: string[] = [];
  const pairs = (v: unknown, path: string) => {
    if (!v || typeof v !== 'object') return;
    if (Array.isArray(v)) { v.forEach((x, i) => pairs(x, path + '[' + i + ']')); return; }
    const o = v as Record<string, unknown>;
    if ('en' in o && !('tr' in o)) untranslated.push(path || '(root)');
    for (const k in o) pairs(o[k], path ? path + '.' + k : k);
  };
  pairs(content, '');

  return { placeholders, untranslated };
}
