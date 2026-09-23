import { CONTENT } from '@/content/content.ts';
import { Section, type PlatedDef } from '@/components/Section.tsx';
import { useLang } from '@/store/site.tsx';
import { Rich } from '@/components/Rich.tsx';

export function About({ def }: { def: PlatedDef }) {
  const { L } = useLang();
  return (
    <Section def={def}>
      {L(CONTENT.about).map((t, i) => <p key={i}><Rich text={t} /></p>)}
    </Section>
  );
}
