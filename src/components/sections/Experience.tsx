import { CONTENT } from '@/content/content.ts';
import type { Experience as Row } from '@/content/types.ts';
import { Board } from '@/components/Cells.tsx';
import { Section, type PlatedDef } from '@/components/Section.tsx';
import { shown, visible } from '@/lib/placeholder.ts';
import { useLang } from '@/store/site.tsx';
import { Rich } from '@/components/Rich.tsx';

/* Departure-board rows, shared by Experience and Education: the year in static
   flap cells above the human date range, the status (NOW / UNTIL 2027 / PAST)
   right-aligned in the title row.  Placeholder rows and bullets are hidden in
   production. */
export function BoardRows({ rows }: { rows: Row[] }) {
  const { L, upper } = useLang();
  return (
    <>
      {rows.filter(e => shown(L(e.title))).map((e, i) => {
        const bullets = visible(L(e.bullets) || []);
        return (
          <article className="row" key={i}>
            <div className="row-label">
              <Board text={upper(e.board)} />
              <span>{L(e.dates)}</span>
            </div>
            <div className="row-body">
              <div className="exp-head">
                <h3>{L(e.title)}</h3>
                <Board className="status" text={upper(L(e.status))} label={L(e.status)} />
              </div>
              <div className="org"><Rich text={L(e.org)} /></div>
              {bullets.length > 0 && <ul className="bullets">{bullets.map((b, j) => <li key={j}><Rich text={b} /></li>)}</ul>}
            </div>
          </article>
        );
      })}
    </>
  );
}

export function Experience({ def }: { def: PlatedDef }) {
  return <Section def={def}><BoardRows rows={CONTENT.experience} /></Section>;
}
