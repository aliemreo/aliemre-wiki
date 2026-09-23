import { BGS, PALETTES } from '@/content/content.ts';
import type { Bg, Lang, Palette, Theme } from '@/content/types.ts';

export type TermMode = 'folded' | 'open' | 'wide' | 'full' | 'mini';
export type FontId = 'geist' | 'inter';
export const FONTS: readonly FontId[] = ['geist', 'inter'];
/* Faces are self-hosted (public/fonts, src/styles/fonts.css); a set is just data-font. */
/* mini = a small floating window at the bottom right (the yellow dot) */
export const TERM_MODES: readonly TermMode[] = ['folded', 'open', 'wide', 'full', 'mini'];
/* custom terminal width (desktop) and log height (phones), px; set by dragging */
export const TERM_W = { key: 'aeo-term-w', min: 320, maxVw: 0.75 } as const;
export const TERM_H = { key: 'aeo-term-h', min: 120, maxVh: 0.7 } as const;

/* localStorage keys — the inline boot script in index.html reads the same ones
   before first paint, so a change here must be mirrored there. */
export const KEYS = { theme: 'aeo-theme-v2', palette: 'aeo-palette', lang: 'aeo-lang', bg: 'aeo-bg', term: 'aeo-term', font: 'aeo-font', banner: 'aeo-banner' } as const;

export const store = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } };

export interface Prefs { theme: Theme; palette: Palette; bg: Bg; lang: Lang; term: TermMode; font: FontId }
export const DEFAULT_PREFS: Prefs = { theme: 'light', palette: 'amber', bg: 'scan', lang: 'en', term: 'folded', font: 'geist' };

/* The boot script has already decided; React just reads the <html> attributes. */
export function readPrefs(): Prefs {
  const d = document.documentElement;
  const palette = d.getAttribute('data-palette') as Palette | null;
  const bg = d.getAttribute('data-bg') as Bg | null;
  const term = d.getAttribute('data-term') as TermMode | null;
  const font = d.getAttribute('data-font') as FontId | null;
  return {
    theme: d.getAttribute('data-theme') === 'dark' ? 'dark' : 'light',
    palette: palette && (PALETTES as readonly string[]).includes(palette) ? palette : 'amber',
    bg: bg && (BGS as readonly string[]).includes(bg) ? bg : 'scan',
    lang: d.lang === 'tr' ? 'tr' : 'en',
    term: term && TERM_MODES.includes(term) ? term : 'folded',
    font: font && FONTS.includes(font) ? font : 'geist',
  };
}
