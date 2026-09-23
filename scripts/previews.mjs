#!/usr/bin/env node
/**
 * Screenshots for the link preview cards — run by the owner, not by CI:
 *   npm run previews            writes public/previews/<key>.webp for LINKS entries without one,
 *                               and previews/u-<hash>.webp for every other external link
 *                               (contact profiles, project links, reading, writing)
 *   npm run previews -- --force rewrites them all
 *
 * Uses the local Chrome over the DevTools protocol (set CHROME to its binary if
 * it is not the macOS default).  480×300 WebP, quality 70, roughly 15–30 KB each;
 * the files are committed, so the deployed site never calls a screenshot service.
 * A site that blocks headless capture is reported and skipped; its card then
 * shows the explanation without an image.
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const OUT = ROOT + 'public/previews/';
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const force = process.argv.includes('--force');
const { LINKS } = await import(ROOT + 'src/content/links.ts');
const { CONTENT } = await import(ROOT + 'src/content/content.ts');
const { previewName } = await import(ROOT + 'src/lib/preview.ts');
const real = h => typeof h === 'string' && /^https?:\/\//.test(h) && !/placeholder/i.test(h);   /* mirrors realHref() in src/lib/placeholder.ts */
const extra = [CONTENT.meta.github, CONTENT.meta.linkedin, CONTENT.meta.cv, ...CONTENT.projects.flatMap(p => p.links.map(l => l.href)), ...CONTENT.reading.map(r => r.href), ...CONTENT.writing.map(w => w.href)].filter(real);
const jobs = [...Object.entries(LINKS).filter(([, d]) => !d.preview && d.href).map(([key, def]) => [key, def.href, key]), ...[...new Set(extra)].map(h => [h.replace(/^https?:\/\/(www\.)?/, '').slice(0, 10), h, previewName(h)])];

if (!existsSync(CHROME)) { console.error(`previews: Chrome not found at ${CHROME} — set CHROME=/path/to/chrome`); process.exit(1); }
mkdirSync(OUT, { recursive: true });

const port = 9300 + Math.floor(Math.random() * 300);
const proc = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', '--hide-scrollbars', `--remote-debugging-port=${port}`, '--window-size=1200,750', `--user-data-dir=/tmp/previews-${port}`, 'about:blank'], { stdio: 'ignore' });
let list;
for (let i = 0; i < 60 && !list?.some(t => t.type === 'page'); i++) { try { list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); } catch { /* not up yet */ } await new Promise(r => setTimeout(r, 100)); }
const ws = new WebSocket(list.find(t => t.type === 'page').webSocketDebuggerUrl);
await new Promise(r => (ws.onopen = r));
let id = 0; const pending = new Map(); const listeners = [];
ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { const { res, rej } = pending.get(m.id); pending.delete(m.id); m.error ? rej(new Error(m.error.message)) : res(m.result); } else if (m.method) listeners.forEach(l => l(m)); };
const send = (method, params = {}, timeout = 20000) => new Promise((res, rej) => { const i = ++id; const t = setTimeout(() => { pending.delete(i); rej(new Error('timeout ' + method)); }, timeout); pending.set(i, { res: v => { clearTimeout(t); res(v); }, rej: e => { clearTimeout(t); rej(e); } }); ws.send(JSON.stringify({ id: i, method, params })); });
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1200, height: 750, deviceScaleFactor: 1, mobile: false });

let written = 0, skipped = 0, failed = [];
for (const [key, href, name] of jobs) {
  const def = { href };
  const file = OUT + name + '.webp';
  if (existsSync(file) && !force) { skipped++; continue; }
  try {
    const loaded = new Promise(r => { listeners.push(m => { if (m.method === 'Page.loadEventFired') r(); }); setTimeout(r, 12000); });
    const nav = await send('Page.navigate', { url: def.href });
    if (nav.errorText) throw new Error(nav.errorText);
    await loaded; await new Promise(r => setTimeout(r, 1500));   // let fonts and hero images settle
    const shot = await send('Page.captureScreenshot', { format: 'webp', quality: 70, clip: { x: 0, y: 0, width: 1200, height: 750, scale: 0.4 } });
    writeFileSync(file, Buffer.from(shot.data, 'base64'));
    console.log(`  ${key.padEnd(10)} ${def.href.padEnd(40)} ${(statSync(file).size / 1024).toFixed(0)} KB`);
    written++;
  } catch (e) { failed.push(`${key} (${e.message})`); }
}
ws.close(); proc.kill();
console.log(`previews: ${written} written, ${skipped} kept${failed.length ? `, failed: ${failed.join(', ')}` : ''}`);
