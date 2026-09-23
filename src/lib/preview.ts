/* Preview image name for any URL: public/previews/u-<hash>.webp, written by
   `npm run previews`.  Pure and import-free: scripts/previews.mjs and
   scripts/verify-dist.mjs load it with Node. */
export function previewName(href: string): string {
  let h = 5381;
  for (let i = 0; i < href.length; i++) h = ((h * 33) ^ href.charCodeAt(i)) >>> 0;
  return 'u-' + h.toString(16).padStart(8, '0');
}
export const previewSrc = (href: string) => `./previews/${previewName(href)}.webp`;
