import { TOOLS } from '@/content/tools.ts';
import { Section, type PlatedDef } from '@/components/Section.tsx';
import { Button } from '@/components/ui/button.tsx';
import { useEngine, useLang } from '@/store/site.tsx';

/* Clicking a usage line pre-fills the prompt with the example. */
export function Tools({ def }: { def: PlatedDef }) {
  const engine = useEngine();
  const { L, ui } = useLang();
  return (
    <Section def={def}>
      <p className="note">{ui.toolsNote}</p>
      {TOOLS.map(t => (
        <div className="row" key={t.names[0]}>
          <Button variant="plain" className="tool-usage" onClick={() => { engine.setInput(t.example); engine.focusBar(); engine.scrollToId('top'); }}>{t.usage}</Button>
          <div className="row-body">
            <div>{L(t.desc)}</div>
            <div className="tool-example">{t.example}</div>
          </div>
        </div>
      ))}
    </Section>
  );
}
