/* One row per section, in page order.  The DOM, the heading plates, the
   section index, the kilim motifs, the `ls` output and the hash router are all
   derived from this table — it is the only place the section list is written.
   `label` names the UI string for the plate; `top` and `colophon` have none
   because they are hand-built.  Do not add a section without asking. */
import type { MotifKey } from '@/lib/motifs.ts';

export interface SectionDef {
  id: string;
  motif?: MotifKey;
  label?: 'now' | 'about' | 'experience' | 'education' | 'projects' | 'reading' | 'writing' | 'tools' | 'skills' | 'guestbook' | 'contact';
  group?: GroupId;        // branch of the section tree in the wide-screen rail
  tight?: boolean;        // plate sits closer to a list than to prose
}

/* The four branches of the section tree, in order.  `label` names the UI string. */
export const GROUPS = [
  { id: 'me',    label: 'groupMe' },
  { id: 'work',  label: 'groupWork' },
  { id: 'shell', label: 'groupShell' },
  { id: 'hello', label: 'groupHello' },
] as const;
export type GroupId = (typeof GROUPS)[number]['id'];

export const SECTION_DEFS = [
  { id: 'top' },
  { id: 'now',        motif: 'suyolu',     label: 'now',        group: 'me' },
  { id: 'about',      motif: 'elibelinde', label: 'about',      group: 'me' },
  { id: 'experience', motif: 'kocboynuzu', label: 'experience', group: 'me',    tight: true },
  { id: 'education',  motif: 'yildiz',     label: 'education',  group: 'me',    tight: true },
  { id: 'projects',   motif: 'yildiz',     label: 'projects',   group: 'work',  tight: true },
  { id: 'reading',    motif: 'pitrak',     label: 'reading',    group: 'work',  tight: true },
  { id: 'writing',    motif: 'suyolu',     label: 'writing',    group: 'work',  tight: true },
  { id: 'tools',      motif: 'kocboynuzu', label: 'tools',      group: 'shell', tight: true },
  { id: 'skills',     motif: 'pitrak',     label: 'skills',     group: 'shell', tight: true },
  { id: 'guestbook',  motif: 'goz',        label: 'guestbook',  group: 'hello', tight: true },
  { id: 'contact',    motif: 'goz',        label: 'contact',    group: 'hello' },
  { id: 'colophon' },
] as const satisfies readonly SectionDef[];

export const SECTIONS: string[] = SECTION_DEFS.map(d => d.id);
export const PLATED = SECTION_DEFS.filter(d => 'label' in d) as Extract<(typeof SECTION_DEFS)[number], { label: string }>[];
export const defOf = (id: string) => SECTION_DEFS.find(d => d.id === id);
