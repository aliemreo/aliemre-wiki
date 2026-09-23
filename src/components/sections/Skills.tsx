import { CONTENT } from '@/content/content.ts';
import { Section, type PlatedDef } from '@/components/Section.tsx';
import { Button } from '@/components/ui/button.tsx';
import { useEngine, useLang } from '@/store/site.tsx';

/* A skill with a tag runs `projects <tag>`. */
export function Skills({ def }: { def: PlatedDef }) {
  const engine = useEngine();
  const { L, ui } = useLang();
  return (
    <Section def={def}>
      <p className="note">{ui.skillsNote}</p>
      <dl>
        {CONTENT.skills.map((g, i) => (
          <div className="row" key={i}>
            <dt>{L(g.group)}</dt>
            <dd>
              {g.items.map((s, j) => s.tag
                ? <Button key={j} variant="inline" className="text-inherit decoration-rule hover:text-primary hover:decoration-primary" onClick={() => engine.exec('projects ' + s.tag)}>{L(s.label)}</Button>
                : <span key={j}>{L(s.label)}</span>)}
            </dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}
