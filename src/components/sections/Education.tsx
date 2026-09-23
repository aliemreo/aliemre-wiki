import { CONTENT } from '@/content/content.ts';
import { Section, type PlatedDef } from '@/components/Section.tsx';
import { BoardRows } from './Experience.tsx';

export function Education({ def }: { def: PlatedDef }) {
  return <Section def={def}><BoardRows rows={CONTENT.education} /></Section>;
}
