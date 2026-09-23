import { useEffect, useState } from 'react';
import { BranchedMenu } from '@/components/ui/branched-menu.tsx';
import { GROUPS, PLATED } from '@/content/sections.ts';
import { useEngine, useLang, useTerm } from '@/store/site.tsx';

/* The branched section menu in the left rail (wide screens only, see
   globals.css).  Groups and members come from SECTION_DEFS.  Branches start
   folded and unfold as the reader scrolls into their first section — the
   active branch follows the same signal the status line uses; a header click
   opens or closes a branch early.  Without JavaScript every branch is open
   (html:not(.js) [data-fold] in globals.css). */
export function SectionTree() {
  const engine = useEngine();
  const { section } = useTerm();
  const { ui, lower } = useLang();
  const [openGroups, setOpenGroups] = useState<Set<number>>(() => new Set());

  useEffect(() => {
    const def = PLATED.find(d => d.id === section);
    const i = def ? GROUPS.findIndex(g => g.id === def.group) : -1;
    if (i >= 0 && !openGroups.has(i)) setOpenGroups(prev => new Set(prev).add(i));
  }, [section, openGroups]);

  const items = GROUPS.map(g => ({
    label: ui[g.label],
    value: g.id,
    children: PLATED.filter(d => d.group === g.id).map(d => ({ value: d.id, label: lower(ui[d.label]) })),
  }));
  return (
    <aside className="rail noprint">
      <BranchedMenu
        items={items}
        open={[...openGroups]}
        onToggle={(i, isOpen) => setOpenGroups(prev => { const next = new Set(prev); if (isOpen) next.add(i); else next.delete(i); return next; })}
        active={section}
        href={id => '#' + id}
        onSelect={id => engine.exec(id)}
        width={200} rowHeight={28} indent={30} trunk={12} radius={8} fontSize={12.5} lineWidth={1.25}
        aria-label={ui.indexLabel}
        className="font-mono"
      />
    </aside>
  );
}
