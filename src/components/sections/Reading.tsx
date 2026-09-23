import { CONTENT } from '@/content/content.ts';
import { Section, type PlatedDef } from '@/components/Section.tsx';
import { Tag } from '@/components/Tag.tsx';
import { useDoc, useLang } from '@/store/site.tsx';
import { Copy } from '@/components/Copy.tsx';
import { realHref, shown } from '@/lib/placeholder.ts';
import { FilterMeta } from './Projects.tsx';
import { ExtLink } from '@/components/ExtLink.tsx';

export function Reading({ def }: { def: PlatedDef }) {
  const { readFilter } = useDoc();
  const { L, ui, msg } = useLang();
  const list = CONTENT.reading.filter(r => shown(L(r.title))).filter(r => !readFilter || r.tags.includes(readFilter));
  return (
    <Section def={def} suffix={readFilter} meta={readFilter && <FilterMeta label={msg.readFiltered(list.length, readFilter)} clear="reading all" />}>
      <p className="note">{ui.readingNote}</p>
      {list.map((r, i) => (
        <article className="row" key={i}>
          <div className="row-label"><time>{r.date}</time><span className="kind">{r.kind}</span></div>
          <div className="row-body">
            {realHref(r.href) ? <ExtLink href={r.href} blurb={shown(L(r.note)) ? L(r.note) : r.authors}>{L(r.title)}</ExtLink> : <span>{L(r.title)}</span>}
            <span className="byline"> · {r.authors}</span>
            <Copy text={L(r.note)} />
            <div className="taglist">{r.tags.map(t => <Tag key={t} tag={t} cmd="reading" />)}</div>
          </div>
        </article>
      ))}
      {!list.length && <p className="empty">{readFilter ? ui.noReading : ui.emptySection}</p>}
    </Section>
  );
}
