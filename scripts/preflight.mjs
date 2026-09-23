#!/usr/bin/env node
/**
 * Preflight: the content rules from CLAUDE.md §2 and §7, enforced.
 *
 *   node scripts/preflight.mjs
 *
 * It imports src/content/content.ts and src/lib/contentReport.ts directly —
 * Node strips the types (>= 22.18) — so the browser dev check and CI run one
 * implementation.  Hard failures: an `en` string with no `tr` sibling, and
 * content changed without bumping meta.updated.  Placeholders are reported.
 * Bundle size and the prerender are checked after the build by verify-dist.mjs.
 */
import { readFileSync, appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const CONTENT_FILE = 'src/content/content.ts';

const { CONTENT } = await import(ROOT + CONTENT_FILE);
const { contentReport } = await import(ROOT + 'src/lib/contentReport.ts');

const problems = [];
const notes = [];
const fail = (title, detail, items) => problems.push({ title, detail, items: items || [] });

/* ---------- content rules (shared with the browser) --------------------- */
const report = contentReport(CONTENT);
if (report.untranslated.length) {
  fail(
    `${report.untranslated.length} English string${report.untranslated.length === 1 ? '' : 's'} with no Turkish sibling`,
    'CLAUDE.md §7: never add an `en` string without its `tr` sibling. A `Placeholder:` Turkish string is fine for now; a missing one is not.',
    report.untranslated,
  );
}
notes.push(`${report.placeholders.length} placeholder strings in CONTENT (intentional at handoff — see README).`);

/* ---------- ask/knowledge.txt (the Worker's knowledge base) must not lag behind content.ts or ask/knowledge/ */
{
  const { existsSync, statSync, readdirSync } = await import('node:fs');
  const p = ROOT + 'ask/knowledge.txt';
  if (existsSync(p)) {
    const built = statSync(p).mtimeMs;
    const dir = ROOT + 'ask/knowledge/';
    const newest = Math.max(statSync(ROOT + 'src/content/content.ts').mtimeMs, ...(existsSync(dir) ? readdirSync(dir).filter(f => f.endsWith('.md') && f !== 'profile.md').map(f => statSync(dir + f).mtimeMs) : []));
    if (built < newest) notes.push('ask/knowledge.txt is older than content.ts or a file in ask/knowledge/ — run npm run ask:prompt and redeploy the Worker (ask/README.md).');
  }
}

/* ---------- meta.updated ----------------------------------------------- */
const src = readFileSync(ROOT + CONTENT_FILE, 'utf8');
const updatedIn = text => (text.match(/updated:\s*'([^']+)'/) || [])[1];
const git = args => {
  try { return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); }
  catch { return null; }
};
/* PREFLIGHT_BASE is set by the workflow to github.event.before, so a push of
   several commits is compared against where the branch actually started. */
const baseRef = process.env.PREFLIGHT_BASE
  || (process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : 'HEAD');
const newBranch = /^0+$/.test(baseRef);            // first push of a branch: nothing to compare
const before = newBranch ? null : git(['show', `${baseRef}:${CONTENT_FILE}`]);

if (newBranch) {
  notes.push('meta.updated check skipped — first push of this branch.');
} else if (before === null) {
  const why = `no ${CONTENT_FILE} at ${baseRef} to compare against`;
  /* Outside CI this is normal — a shallow clone, a first commit, a local run.
     Inside CI it means the check did not actually run, so say so loudly. */
  if (process.env.GITHUB_ACTIONS) fail('meta.updated could not be checked', `${why}. Make sure the checkout step uses fetch-depth: 0.`);
  else notes.push(`meta.updated check skipped — ${why}.`);
} else if (before === src) {
  notes.push('meta.updated check skipped — CONTENT is unchanged.');
} else if (updatedIn(before) === updatedIn(src)) {
  fail(
    `CONTENT changed but meta.updated is still ${updatedIn(src)}`,
    'CLAUDE.md §2.6: meta.updated is the single "Last updated" source and is bumped on every content change.',
  );
} else {
  notes.push(`meta.updated bumped ${updatedIn(before)} → ${updatedIn(src)}.`);
}

/* ---------- report ------------------------------------------------------ */
const lines = [];
problems.forEach(p => {
  lines.push(`✗ ${p.title}`);
  if (p.detail) lines.push(`  ${p.detail}`);
  p.items.slice(0, 20).forEach(i => lines.push(`    · ${i}`));
  if (p.items.length > 20) lines.push(`    … and ${p.items.length - 20} more`);
  lines.push('');
});
notes.forEach(n => lines.push(`· ${n}`));
lines.push('');
lines.push(problems.length ? `preflight failed: ${problems.length} problem${problems.length === 1 ? '' : 's'}.` : 'preflight passed.');

const out = lines.join('\n');
console.log(out);
if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, '## Preflight\n\n```\n' + out + '\n```\n');
}
process.exit(problems.length ? 1 : 0);
