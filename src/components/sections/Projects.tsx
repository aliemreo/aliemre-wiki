import { CONTENT } from '@/content/content.ts';
import type { Project } from '@/content/types.ts';
import { Copy } from '@/components/Copy.tsx';
import { Rich } from '@/components/Rich.tsx';
import { Section, type PlatedDef } from '@/components/Section.tsx';
import { Tag } from '@/components/Tag.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible.tsx';
import { TiltCard, TiltItem } from '@/components/ui/tilt-card.tsx';
import { ExtLink } from '@/components/ExtLink.tsx';
import { SHOW_PLACEHOLDERS, realHref, shown, visible } from '@/lib/placeholder.ts';
import { useDoc, useEngine, useLang } from '@/store/site.tsx';

export function FilterMeta({ label, clear }: { label: string; clear: string }) {
  const engine = useEngine();
  const { ui } = useLang();
  return (
    <>
      <span>{label}</span>
      <Button variant="plain" className="text-prompt" onClick={() => engine.exec(clear)}>{ui.clear}</Button>
    </>
  );
}

/* A project expands only when it has something to show: a visible write-up or
   the "what I'd do differently" line.  Otherwise the name is plain text. */
function ProjectItem({ p, open }: { p: Project; open: boolean }) {
  const engine = useEngine();
  const { L, ui } = useLang();
  const writeup = visible(L(p.writeup) || []);
  const differently = L(p.differently);
  const expandable = writeup.length > 0 || shown(differently);
  const links = p.links.filter(k => realHref(k.href));
  const meta = (
    <div className="proj-meta">
      <div className="tags">{p.tags.map(t => <Tag key={t} tag={t} cmd="projects" />)}</div>
      {p.stack.length > 0 && <span className="stack">{p.stack.join(' · ')}</span>}
      {links.length > 0 && <div className="links">{links.map((k, i) => <ExtLink key={i} href={k.href} blurb={`${L(p.name)} · ${L(k.label)}`}>{L(k.label)}</ExtLink>)}</div>}
    </div>
  );
  const body = (
    <>
      <Copy className="proj-problem" text={L(p.problem)} />
      <Copy className="proj-outcome" text={L(p.outcome)} />
      {meta}
    </>
  );
  return (
    <article className="proj" id={'project-' + p.slug} data-slug={expandable ? p.slug : undefined} data-featured={p.featured ? 'true' : 'false'}>
      {expandable ? (
        <Collapsible open={open} onOpenChange={o => engine.exec(o ? 'project ' + p.slug : 'back')}>
          <h3>
            <CollapsibleTrigger asChild>
              <Button variant="inline" className="proj-name -mx-[3px] px-[3px] font-semibold hover:bg-primary hover:text-primary-foreground hover:no-underline">
                {L(p.name)}
              </Button>
            </CollapsibleTrigger>
          </h3>
          {body}
          <CollapsibleContent className="expand">
            <TiltCard className="proj-card">
              <TiltItem as="span" depth={40} className="proj-kicker">{ui.writeup}</TiltItem>
              {writeup.map((t, i) => <p key={i}><Rich text={t} /></p>)}
              {SHOW_PLACEHOLDERS && <div className="slot">{ui.imageSlot}</div>}
              {shown(differently) && <TiltItem depth={60} className="differently"><Copy text={differently}><span className="byline">{ui.differently}</span> <Rich text={differently} /></Copy></TiltItem>}
              <TiltItem depth={20}><Button variant="inline" className="back font-mono text-[12.5px] no-underline" onClick={() => engine.exec('back')}>{ui.back}</Button></TiltItem>
            </TiltCard>
          </CollapsibleContent>
        </Collapsible>
      ) : (
        <>
          <h3><span className="proj-name-static">{L(p.name)}</span></h3>
          {body}
        </>
      )}
    </article>
  );
}

export function Projects({ def }: { def: PlatedDef }) {
  const { filter, openSlug } = useDoc();
  const { ui, msg } = useLang();
  const list = CONTENT.projects.filter(p => !filter || p.tags.includes(filter));
  return (
    <Section def={def} suffix={filter} meta={filter && <FilterMeta label={msg.filtered(list.length, filter)} clear="projects all" />}>
      {list.map(p => <ProjectItem key={p.slug} p={p} open={openSlug === p.slug} />)}
      {!list.length && <p className="empty">{ui.noProjects}</p>}
    </Section>
  );
}
