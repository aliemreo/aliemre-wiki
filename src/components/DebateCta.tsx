import { CONTENT } from '@/content/content.ts';
import { PromptButton } from '@/components/ui/prompt-button.tsx';
import { useDoc, useEngine, useLang } from '@/store/site.tsx';

/* The visible entry point to the debate (§5.14): an outline prompt button that
   asks the starter question, and one line saying what will happen.  Rendered
   only once the answering endpoint is set — never in the prerender. */
export function DebateCta({ hint, className }: { hint?: 'before' | 'after'; className?: string }) {
  const engine = useEngine();
  const { askEndpoint } = useDoc();
  const { ui, L } = useLang();
  if (!askEndpoint) return null;
  const start = () => { engine.focusAsk(); engine.exec('debate ' + L(CONTENT.meta.debateStarter)); };
  const line = <p className="cta-hint">{ui.debateExplain}</p>;
  return (
    <div className={className}>
      {hint === 'before' && line}
      <PromptButton outline onClick={start}>{ui.ctaDebate}</PromptButton>
      {hint === 'after' && line}
    </div>
  );
}
