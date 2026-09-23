import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

/* The site is served from a subpath on GitHub Pages (/aliemre-wiki/) and may
   move to a domain root later.  A relative base keeps every asset URL correct
   in both places without touching this file. */
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: {
    target: 'es2022',
    modulePreload: { polyfill: false },
    cssMinify: true,
    rollupOptions: { output: { manualChunks: undefined } },
  },
  ssr: { noExternal: true },
});
