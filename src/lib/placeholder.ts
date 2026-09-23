/* Unfinished copy starts with "Placeholder:" (CLAUDE.md §2.4).  The dev server
   shows it, in italics, so the owner sees what is missing; the production build
   hides it, so a reader never meets a broken line.  scripts/verify-dist.mjs fails
   the deploy if any placeholder reaches the prerendered HTML. */
export const isPlaceholder = (v: unknown): boolean => typeof v === 'string' && v.startsWith('Placeholder');
export const SHOW_PLACEHOLDERS: boolean = import.meta.env.DEV;
export const shown = (v: string) => SHOW_PLACEHOLDERS || !isPlaceholder(v);
export const visible = (list: string[]) => list.filter(shown);
/* a link whose href is still '#' or points at a placeholder profile */
export const realHref = (href: string) => !!href && href !== '#' && !/placeholder/i.test(href);
