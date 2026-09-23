import { CONTENT } from '@/content/content.ts';
import { Section, type PlatedDef } from '@/components/Section.tsx';
import { useLang } from '@/store/site.tsx';
import { realHref, shown } from '@/lib/placeholder.ts';
import { ExtLink } from '@/components/ExtLink.tsx';

export function Writing({ def }: { def: PlatedDef }) {
  const { L, ui } = useLang();
  const list = CONTENT.writing.filter(w => shown(L(w.title)));
  return (
    <Section def={def}>
      {list.map((w, i) => (
        <article className="row" key={i}>
          <time className="row-label">{w.date}</time>
          {realHref(w.href) ? <ExtLink className="row-body" href={w.href} blurb={ui.blurbWriting}>{L(w.title)}</ExtLink> : <span className="row-body">{L(w.title)}</span>}
        </article>
      ))}
      {!list.length && <p className="empty">{ui.emptySection}</p>}
    </Section>
  );
}
