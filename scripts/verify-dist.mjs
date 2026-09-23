#!/usr/bin/env node
/**
 * Checks the built site in dist/ before it is uploaded (CLAUDE.md §6):
 *   - the prerender is present: the static HTML carries every section and the h1
 *   - total transfer without fonts (html + js + css, gzipped) is under budget
 *   - the files GitHub Pages needs are there: 404.html, favicon.svg, og.png, robots.txt
 */
import { readdirSync, readFileSync, statSync, existsSync, appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const DIST = ROOT + 'dist/';
/* CLAUDE.md §6.  React + ReactDOM are about 60 KB of this on their own. */
const BUDGET = 160 * 1024;
const problems = [], notes = [];
const fail = (t, d) => problems.push(d ? `${t}\n  ${d}` : t);
const kb = n => (n / 1024).toFixed(1) + ' KB';

if (!existsSync(DIST + 'index.html')) { console.error('verify-dist: dist/index.html is missing — run `npm run build` first.'); process.exit(1); }

const { SECTIONS } = await import(ROOT + 'src/content/sections.ts');
const { CONTENT } = await import(ROOT + 'src/content/content.ts');

/* ---------- prerender ---------------------------------------------------- */
const html = readFileSync(DIST + 'index.html', 'utf8');
if (html.includes('<!--app-html-->')) fail('dist/index.html was not prerendered', 'scripts/prerender.mjs did not run or did not write; the page would be empty without JavaScript.');
const missing = SECTIONS.filter(id => !html.includes(`id="${id}"`));
if (missing.length) fail(`prerender is missing section${missing.length === 1 ? '' : 's'}: ${missing.join(', ')}`);
if (!html.includes(CONTENT.meta.name)) fail('prerender does not contain the h1 name');
if (html.includes('class="term')) fail('the terminal was prerendered', 'it must render only on the client (CLAUDE.md §1: with JS off the terminal does not render).');
if (!/<title>[^<]+<\/title>/.test(html)) fail('<title> is missing');
if (html.includes('[[')) fail('a [[link token]] reached the prerendered HTML', 'a component renders copy without <Rich>/plain() (src/lib/rich.ts).');
if (html.includes('Placeholder:')) fail('placeholder copy reached the prerendered HTML', 'CLAUDE.md §2.4: placeholders are hidden in production. A component is rendering a string without the Copy/shown helpers in src/lib/placeholder.ts.');

/* ---------- budget --------------------------------------------------------- */
const walk = dir => readdirSync(dir).flatMap(f => { const p = dir + f; return statSync(p).isDirectory() ? walk(p + '/') : [p]; });
const files = walk(DIST).filter(f => /\.(html|js|css)$/.test(f));
let total = 0;
const rows = files.map(f => { const g = gzipSync(readFileSync(f), { level: 9 }).length; total += g; return `${kb(g).padStart(9)}  ${f.slice(DIST.length)}`; });
notes.push('gzipped transfer (fonts excluded):', ...rows.map(r => '  ' + r), `  ${kb(total).padStart(9)}  total, budget ${kb(BUDGET)}`);
if (total > BUDGET) fail(`transfer is ${kb(total)} gzipped, over the ${kb(BUDGET)} budget (CLAUDE.md §6)`);

/* ---------- preview images (warn only: a blocked site must not stop a deploy) */
const { LINKS } = await import(ROOT + 'src/content/links.ts');
const { previewName } = await import(ROOT + 'src/lib/preview.ts');
const realUrl = h => typeof h === 'string' && /^https?:\/\//.test(h) && !/placeholder/i.test(h);
const extLinks = [...new Set([CONTENT.meta.github, CONTENT.meta.linkedin, CONTENT.meta.cv, ...CONTENT.projects.flatMap(p => p.links.map(l => l.href)), ...CONTENT.reading.map(r => r.href), ...CONTENT.writing.map(w => w.href)].filter(realUrl))];
const missingPreviews = [...Object.entries(LINKS).filter(([k, d]) => d.href && !d.preview && !existsSync(DIST + 'previews/' + k + '.webp')).map(([k]) => k), ...extLinks.filter(h => !existsSync(DIST + 'previews/' + previewName(h) + '.webp'))];
if (missingPreviews.length) notes.push(`preview images missing (cards show the blurb only): ${missingPreviews.join(', ')} — run npm run previews`);

/* ---------- static files --------------------------------------------------- */
for (const f of ['404.html', 'favicon.svg', 'og.png', 'robots.txt', 'sitemap.xml', 'writing.xml']) if (!existsSync(DIST + f)) fail(`dist/${f} is missing`);
for (const f of ['sitemap.xml', 'writing.xml']) if (existsSync(DIST + f) && !readFileSync(DIST + f, 'utf8').startsWith('<?xml')) fail(`dist/${f} is not XML`);
/* fonts are self-hosted: at least the 8 latin/latin-ext faces, and no third-party font request */
const fontFiles = existsSync(DIST + 'fonts/') ? readdirSync(DIST + 'fonts/').filter(f => f.endsWith('.woff2')).length : 0;
if (fontFiles < 8) fail(`dist/fonts has ${fontFiles} woff2 files, expected at least 8 — run npm run fonts`);
if (/fonts\.googleapis\.com|fonts\.gstatic\.com/.test(html)) fail('dist/index.html still references Google Fonts', 'fonts are self-hosted from public/fonts (CLAUDE.md §1)');

/* ---------- report ---------------------------------------------------------- */
const out = [...problems.map(p => '✗ ' + p), ...(problems.length ? [''] : []), ...notes, '', problems.length ? `verify-dist failed: ${problems.length} problem${problems.length === 1 ? '' : 's'}.` : 'verify-dist passed.'].join('\n');
console.log(out);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, '## Build\n\n```\n' + out + '\n```\n');
process.exit(problems.length ? 1 : 0);
