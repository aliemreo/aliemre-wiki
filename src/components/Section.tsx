import type { ReactNode } from 'react';
import type { PLATED } from '@/content/sections.ts';
import { useLang } from '@/store/site.tsx';
import { FlapCells } from './Cells.tsx';
import { Motif } from './Motif.tsx';
import { cn } from '@/lib/utils.ts';

export type PlatedDef = (typeof PLATED)[number];

/* A section with an enamel plate: split-flap title on the left, the kilim
   motif and an optional right-hand slot (a date, the active filter) on the
   right.  The plate reads `suffix` into the title: PROJECTS · ML. */
export function Section({ def, suffix, meta, children }: { def: PlatedDef; suffix?: string | null; meta?: ReactNode; children: ReactNode }) {
  const { ui, upper } = useLang();
  const label = ui[def.label] + (suffix ? ' · ' + suffix : '');
  return (
    <section id={def.id}>
      <div className={cn('plate', 'tight' in def && def.tight && 'tight')}>
        <h2 className="flap" aria-label={label}><FlapCells text={upper(label)} /></h2>
        <div className="plate-right">
          <Motif k={def.motif} />
          <div className="plate-meta">{meta}</div>
        </div>
      </div>
      <div className="body">{children}</div>
    </section>
  );
}
