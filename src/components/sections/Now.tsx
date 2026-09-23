import { CONTENT } from '@/content/content.ts';
import { Section, type PlatedDef } from '@/components/Section.tsx';
import { useLang } from '@/store/site.tsx';
import { Copy } from '@/components/Copy.tsx';
import { shown } from '@/lib/placeholder.ts';

export function Now({ def }: { def: PlatedDef }) {
  const { L, ui } = useLang();
  const text = L(CONTENT.now.text);
  return (
    <Section def={def} meta={<time>{L(CONTENT.now.date)}</time>}>
      {shown(text) ? <Copy text={text} /> : <p className="empty">{ui.emptySection}</p>}
    </Section>
  );
}
