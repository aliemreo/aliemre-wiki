#!/usr/bin/env node
/**
 * Social card — run by the owner after the hero headline or the lead changes:
 *   npm run og   -> public/og.png (1200×630)
 * Renders an inline template with the local Chrome (CDP); fonts come from
 * public/fonts, colours are the light amber tokens.
 */
import { spawn } from 'node:child_process';
import { writeFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const { CONTENT } = await import(ROOT + 'src/content/content.ts');
const { LINKS } = await import(ROOT + 'src/content/links.ts');
const plain = t => t.replace(/\[\[([a-z0-9_-]+)(?:\|([^\]]+))?\]\]/g, (_, k, x) => x ?? LINKS[k]?.label ?? k);
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const h = CONTENT.hero;
const headline = `${h.headline.before.en} <em>${h.headline.rotating.en[0]}</em>${h.headline.after.en ? ' ' + h.headline.after.en : ''}`;
const font = f => `file://${ROOT}public/fonts/${f}.woff2`;
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  @font-face { font-family: Geist; src: url(${font('geist-latin')}) format('woff2'); font-weight: 100 900 }
  @font-face { font-family: Geist; src: url(${font('geist-latin-ext')}) format('woff2'); font-weight: 100 900; unicode-range: U+0100-02BA }
  @font-face { font-family: 'Geist Mono'; src: url(${font('geist-mono-latin')}) format('woff2'); font-weight: 100 900 }
  html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden }
  body { background: #F7F6F1; color: #17160F; font-family: Geist, system-ui, sans-serif; position: relative; isolation: isolate }
  .dots { position: absolute; inset: 0; z-index: -1; background-image: radial-gradient(rgba(23,22,15,.13) 1.2px, transparent 1.4px); background-size: 24px 24px;
    -webkit-mask-image: radial-gradient(ellipse 85% 100% at 50% 0%, black 40%, transparent 100%) }
  .glow { position: absolute; left: 50%; top: -55%; width: 1300px; height: 650px; transform: translateX(-50%); z-index: -1;
    background: radial-gradient(ellipse at center, rgba(143,86,0,.36), transparent 70%); filter: blur(40px) }
  .wrap { position: absolute; left: 88px; right: 88px; top: 96px; bottom: 72px; display: flex; flex-direction: column }
  .k { font-family: 'Geist Mono', monospace; font-size: 20px; letter-spacing: .1em; text-transform: uppercase; color: #575450; margin: 0 0 30px }
  h1 { font-size: 104px; font-weight: 600; letter-spacing: -.035em; line-height: 1; margin: 0 0 36px }
  h1 em { font-style: normal; font-weight: 500; color: #8F5600 }
  p { font-size: 30px; line-height: 1.4; margin: 0; max-width: 900px; color: #17160F }
  .url { position: absolute; left: 88px; bottom: 64px; font-family: 'Geist Mono', monospace; font-size: 20px; color: #575450 }
</style></head><body><div class="dots"></div><div class="glow"></div>
<div class="wrap"><p class="k">${esc(CONTENT.meta.name)}</p><h1>${headline}</h1><p>${esc(plain(h.line1.en))}</p></div>
<div class="url">aliemreozcan.com</div></body></html>`;

const port = 9600 + Math.floor(Math.random() * 300);
const proc = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', '--hide-scrollbars', '--allow-file-access-from-files', `--remote-debugging-port=${port}`, '--window-size=1200,630', `--user-data-dir=/tmp/og-${port}`, 'about:blank'], { stdio: 'ignore' });
let list;
for (let i = 0; i < 60 && !list?.some(t => t.type === 'page'); i++) { try { list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); } catch { /* not up */ } await new Promise(r => setTimeout(r, 100)); }
const ws = new WebSocket(list.find(t => t.type === 'page').webSocketDebuggerUrl);
await new Promise(r => (ws.onopen = r));
let id = 0; const pending = new Map();
ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { const { res, rej } = pending.get(m.id); pending.delete(m.id); m.error ? rej(new Error(m.error.message)) : res(m.result); } };
const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1200, height: 630, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: 'data:text/html;charset=utf-8,' + encodeURIComponent(html) });
await new Promise(r => setTimeout(r, 1500));
const shot = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 1200, height: 630, scale: 1 } });
writeFileSync(ROOT + 'public/og.png', Buffer.from(shot.data, 'base64'));
ws.close(); proc.kill();
console.log(`og: wrote public/og.png (${(statSync(ROOT + 'public/og.png').size / 1024).toFixed(0)} KB)`);
