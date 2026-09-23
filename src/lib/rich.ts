/* [[key]] and [[key|text]] tokens in copy → linked terms (src/content/links.ts). */
import { LINKS } from '@/content/links.ts';

export type RichPart = string | { key: string; text?: string };
const TOKEN = /\[\[([a-z0-9_-]+)(?:\|([^\]]+))?\]\]/g;

export function parseRich(text: string): RichPart[] {
  const parts: RichPart[] = [];
  let last = 0;
  for (const m of text.matchAll(TOKEN)) {
    if (m.index! > last) parts.push(text.slice(last, m.index));
    parts.push({ key: m[1], text: m[2] });
    last = m.index! + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

/* tokens → their visible text, for the pipes, search and any plain rendering */
export const plain = (text: string) => text.replace(TOKEN, (_, key: string, t?: string) => t ?? LINKS[key]?.label ?? key);
export const hasTokens = (text: string) => /\[\[/.test(text);
