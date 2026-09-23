import type { Bi, BiList, Lang } from '@/content/types.ts';

export const isBi = (v: unknown): v is Bi =>
  !!v && typeof v === 'object' && !Array.isArray(v) && 'en' in (v as object);

/* A language-bound resolver: strings and arrays pass through, { en, tr } pairs
   pick the language.  Overloaded so call sites keep their types. */
export interface Resolver {
  (v: string | Bi): string;
  (v: BiList): string[];
  <T>(v: T): T;
}

export function L(v: string | Bi, lang: Lang): string;
export function L(v: BiList, lang: Lang): string[];
export function L<T>(v: T, lang: Lang): T;
export function L(v: unknown, lang: Lang): unknown {
  if (v && typeof v === 'object' && !Array.isArray(v) && 'en' in (v as object)) {
    const o = v as Record<string, unknown>;
    return o[lang] ?? o.en;
  }
  return v;
}

export const resolver = (lang: () => Lang): Resolver => ((v: unknown) => L(v as never, lang())) as Resolver;

/* toLocaleUpperCase('tr') keeps İ/ı correct in Turkish headings. */
export const upper = (s: string, lang: Lang) => (s || '').toLocaleUpperCase(lang);
export const lower = (s: string, lang: Lang) => (s || '').toLocaleLowerCase(lang);
