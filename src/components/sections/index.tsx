/* Section id -> component.  SECTION_DEFS (src/content/sections.ts) decides
   the order; this table decides what renders.  Adding a section = one row in
   each, plus a UI label in both languages and a command. */
import type { ComponentType } from 'react';
import { SECTION_DEFS } from '@/content/sections.ts';
import type { PlatedDef } from '@/components/Section.tsx';
import { About } from './About.tsx';
import { Colophon } from './Colophon.tsx';
import { Contact } from './Contact.tsx';
import { Education } from './Education.tsx';
import { Experience } from './Experience.tsx';
import { Guestbook } from './Guestbook.tsx';
import { Now } from './Now.tsx';
import { Projects } from './Projects.tsx';
import { Reading } from './Reading.tsx';
import { Skills } from './Skills.tsx';
import { Tools } from './Tools.tsx';
import { Top } from './Top.tsx';
import { Writing } from './Writing.tsx';

const PLATED_COMPONENTS: Record<PlatedDef['id'], ComponentType<{ def: PlatedDef }>> = {
  now: Now, about: About, experience: Experience, education: Education, projects: Projects, reading: Reading,
  writing: Writing, tools: Tools, skills: Skills, guestbook: Guestbook, contact: Contact,
};
const PLAIN_COMPONENTS: Record<string, ComponentType> = { top: Top, colophon: Colophon };

export function Document() {
  return (
    <main>
      {SECTION_DEFS.map(def => {
        if ('label' in def) { const C = PLATED_COMPONENTS[def.id]; return <C key={def.id} def={def} />; }
        const C = PLAIN_COMPONENTS[def.id];
        return C ? <C key={def.id} /> : null;
      })}
    </main>
  );
}
