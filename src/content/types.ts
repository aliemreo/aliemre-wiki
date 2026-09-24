/* Shapes for src/content/content.ts.  Any user-visible string is either a
   plain string or an { en, tr } pair; L() picks the language. */
import type { TAGS, PALETTES } from './content.ts';
import type { SECTION_DEFS } from './sections.ts';

export type Lang = 'en' | 'tr';
export type Bi = { en: string; tr: string };
export type BiList = { en: string[]; tr: string[] };
export type Text = string | Bi;

export type Tag = (typeof TAGS)[number];
export type Palette = (typeof PALETTES)[number];
export type SectionId = (typeof SECTION_DEFS)[number]['id'];
export type Theme = 'dark' | 'light';
export type Bg = 'scan' | 'flat';

export interface Experience {
  dates: Bi;
  board: string;          // the year shown in split-flap cells
  status: Bi;             // now / until 2027 / past
  title: Bi;
  org: Text;
  bullets: BiList;
}

export interface Project {
  slug: string;           // lowercase ASCII: it is the command argument and the URL
  featured?: boolean;
  name: Bi;
  tags: Tag[];
  stack: string[];
  problem: Bi;
  outcome: Bi;
  links: { label: Bi; href: string }[];
  writeup: BiList;
  differently: Bi;
}

export interface Reading {
  date: string;           // YYYY-MM
  kind: 'paper' | 'book' | 'post';
  title: Bi;
  authors: string;
  tags: Tag[];
  href: string;
  note: Bi;
}

export interface Writing { date: string; title: Bi; href: string }

export interface SkillGroup {
  group: Bi;
  items: { label: Text; tag?: Tag }[];
}

/* a visitor's own entry, in the one language they wrote it in; lives in guestbook.json, written by the Worker */
export interface GuestEntry { id: string; name: string; date: string; lang: Lang; message: string }

export interface Content {
  meta: {
    name: string;
    role: Bi;
    email: string;
    github: string; githubLabel: string;
    linkedin: string; linkedinLabel: string;
    cv: string;
    ask?: string;         // the answering endpoint (ask/worker.mjs deployed); a placeholder keeps the field in search mode
    askStarters: Bi[];   // the questions offered when the ask panel opens empty (a hiring one starts the debate, §5.14)
    debateStarter: Bi;   // the question the palette's "Debate my fit" row asks
    mail?: string;        // the mail dialog's endpoint (ask/worker.mjs, /mail); a placeholder leaves `mail` copying the address
    updated: string;      // YYYY-MM-DD, the single "Last updated" source
  };
  hero: {
    line1: Bi; line2: Bi; avail: Bi;
    headline: { before: Bi; rotating: BiList; after: Bi };   // "I build <rotating>" / "<rotating> geliştiriyorum"
  };
  now: { date: Bi; text: Bi };
  about: BiList;
  experience: Experience[];
  education: Experience[];     // same row shape, its own section
  projects: Project[];
  reading: Reading[];
  writing: Writing[];
  skills: SkillGroup[];
  guestbook: { endpoint?: string };   // ask/guestbook.mjs deployed; a placeholder hides the form. Entries: src/content/guestbook.json
  contact: { note: Bi };
  colophon: BiList;
}
