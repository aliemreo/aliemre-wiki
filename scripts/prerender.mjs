#!/usr/bin/env node
/* Renders the React tree to static HTML and writes it into dist/index.html, so
   the deployed page is readable with JavaScript off and search engines see the
   content without executing anything.  Runs after both Vite builds:
     vite build && vite build --ssr src/entry-server.tsx --outDir dist-ssr && node scripts/prerender.mjs */
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const page = ROOT + 'dist/index.html';
const template = readFileSync(page, 'utf8');
if (!template.includes('<!--app-html-->')) {
  console.error('prerender: dist/index.html has no <!--app-html--> placeholder.');
  process.exit(1);
}
const { render } = await import(ROOT + 'dist-ssr/entry-server.js');
const html = render();
if (!html.includes('id="top"') || !html.includes('id="contact"')) {
  console.error('prerender: the rendered document is missing sections — refusing to write it.');
  process.exit(1);
}
const { CONTENT } = await import(ROOT + 'src/content/content.ts');
const site = (template.match(/rel="canonical" href="([^"]+)"/) || [])[1] || './';
writeFileSync(page, template.replace('<!--app-html-->', html).replace('__GITHUB__', CONTENT.meta.github));

/* sitemap: one URL with its two language variants */
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
writeFileSync(ROOT + 'dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>${esc(site)}</loc>
    <lastmod>${CONTENT.meta.updated}</lastmod>
    <xhtml:link rel="alternate" hreflang="en" href="${esc(site)}?lang=en"/>
    <xhtml:link rel="alternate" hreflang="tr" href="${esc(site)}?lang=tr"/>
  </url>
</urlset>
`);

/* RSS for writing: real entries only (placeholders and '#' links are skipped) */
const posts = CONTENT.writing.filter(w => !w.title.en.startsWith('Placeholder') && w.href && w.href !== '#');
const items = posts.map(w => `    <item>
      <title>${esc(w.title.en)}</title>
      <link>${esc(w.href)}</link>
      <guid>${esc(w.href)}</guid>
      <pubDate>${new Date(w.date + '-01T00:00:00Z').toUTCString()}</pubDate>
    </item>`).join('\n');
writeFileSync(ROOT + 'dist/writing.xml', `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(CONTENT.meta.name)} — writing</title>
    <link>${esc(site)}#writing</link>
    <description>Posts and notes by ${esc(CONTENT.meta.name)}</description>
    <language>en</language>
    <atom:link href="${esc(site)}writing.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>
`);
rmSync(ROOT + 'dist-ssr', { recursive: true, force: true });
console.log(`prerender: sitemap.xml and writing.xml (${posts.length} post${posts.length === 1 ? '' : 's'}) written`);
console.log(`prerender: wrote ${(html.length / 1024).toFixed(1)} KB of static HTML into dist/index.html`);
