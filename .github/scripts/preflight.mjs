#!/usr/bin/env node
/**
 * Preflight for public/index.html.
 *
 * The content rules live in the page itself, between the `preflight:start` and
 * `preflight:end` markers, so the browser dev check and CI run one
 * implementation.  This script slices that region out, runs it in a vm, and
 * adds the checks that need the filesystem or git.
 *
 * Zero dependencies and no package.json, per CLAUDE.md §9.  Run it from
 * anywhere:  node .github/scripts/preflight.mjs
 */
import { readFileSync, appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import { gzipSync } from 'node:zlib';
import { execFileSync } from 'node:child_process';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const PAGE = 'public/index.html';
const GZIP_BUDGET = 60 * 1024;      // 37.6 KB today; this catches accidents, not growth

const problems = [];
const notes = [];
const fail = (title, detail, items) => problems.push({ title, detail, items: items || [] });

/* ---------- the shared region ------------------------------------------ */
const sliceRegion = text => {
  const start = text.indexOf('/* --- preflight:start');
  const end = text.indexOf('/* --- preflight:end');
  return start < 0 || end < 0 || end < start ? null : text.slice(start, end);
};

const src = readFileSync(ROOT + PAGE, 'utf8');
const region = sliceRegion(src);
if (!region) {
  console.error(`preflight: the preflight:start / preflight:end markers are missing from ${PAGE}.`);
  console.error('They are what lets CI reuse the page\'s own content checks — put them back.');
  process.exit(1);
}

let CONTENT, contentReport;
try {
  ({ CONTENT, contentReport } = runInNewContext(region + '\n;({ CONTENT, contentReport })'));
} catch (e) {
  console.error(`preflight: could not evaluate the shared region in ${PAGE} — ${e.message}`);
  console.error('Only CONTENT and the pure check functions belong between the markers: no DOM, no other globals.');
  process.exit(1);
}

/* ---------- content rules (shared with the browser) --------------------- */
const noscript = (src.match(/<noscript>([\s\S]*?)<\/noscript>/) || [])[1] || '';
if (!noscript) fail('The <noscript> mirror is missing', 'Without it the page is blank for a visitor with JavaScript off (CLAUDE.md §1, §6).');

const report = contentReport(CONTENT, noscript);

if (report.untranslated.length) {
  fail(
    `${report.untranslated.length} English string${report.untranslated.length === 1 ? '' : 's'} with no Turkish sibling`,
    'CLAUDE.md §7: never add an `en` string without its `tr` sibling. A `Placeholder:` Turkish string is fine for now; a missing one is not.',
    report.untranslated,
  );
}
if (report.missingFromMirror.length) {
  fail(
    `${report.missingFromMirror.length} string${report.missingFromMirror.length === 1 ? '' : 's'} missing from the <noscript> mirror`,
    'Copy these into the <noscript> block in public/index.html so the page stays readable without JavaScript.',
    report.missingFromMirror.map(s => (s.length > 100 ? s.slice(0, 97) + '…' : s)),
  );
}
notes.push(`${report.placeholders.length} placeholder strings in CONTENT (intentional at handoff — see README).`);

/* ---------- size ------------------------------------------------------- */
const gzip = gzipSync(Buffer.from(src, 'utf8'), { level: 9 }).length;
const kb = n => (n / 1024).toFixed(1) + ' KB';
if (gzip > GZIP_BUDGET) {
  fail(
    `${PAGE} is ${kb(gzip)} gzipped, over the ${kb(GZIP_BUDGET)} budget`,
    'Something large got pasted in. CLAUDE.md §6 puts the whole page under 120 KB of transfer without fonts.',
  );
} else {
  notes.push(`${PAGE} is ${kb(gzip)} gzipped, ${kb(GZIP_BUDGET - gzip)} under budget.`);
}

/* ---------- meta.updated ----------------------------------------------- */
const updatedIn = text => (text.match(/updated:\s*'([^']+)'/) || [])[1];
const git = args => {
  try { return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); }
  catch { return null; }
};
/* PREFLIGHT_BASE is set by the workflow to github.event.before, so a push of
   several commits is compared against where the branch actually started. */
const baseRef = process.env.PREFLIGHT_BASE
  || (process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : 'HEAD^');
const newBranch = /^0+$/.test(baseRef);            // first push of a branch: nothing to compare
const before = newBranch ? null : git(['show', `${baseRef}:${PAGE}`]);

if (newBranch) {
  notes.push('meta.updated check skipped — first push of this branch.');
} else if (before === null) {
  const why = `no ${PAGE} at ${baseRef} to compare against`;
  /* Outside CI this is normal — a shallow clone, a first commit, a local run.
     Inside CI it means the check did not actually run, so say so loudly. */
  if (process.env.GITHUB_ACTIONS) fail('meta.updated could not be checked', `${why}. Make sure the checkout step uses fetch-depth: 0.`);
  else notes.push(`meta.updated check skipped — ${why}.`);
} else if (sliceRegion(before) === region) {
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
