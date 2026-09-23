import { Badge } from '@/components/ui/badge.tsx';
import { useEngine } from '@/store/site.tsx';

/* `#ml` — a tag pill that runs `projects <tag>` or `reading <tag>`. */
export function Tag({ tag, cmd }: { tag: string; cmd: 'projects' | 'reading' }) {
  const engine = useEngine();
  return (
    <Badge asChild variant="ghost" className="tag -mx-1 rounded-[2px] border-0 px-1 py-0 font-mono text-[13.5px] font-normal text-primary hover:bg-accent">
      <button type="button" onClick={() => engine.exec(`${cmd} ${tag}`)}>#{tag}</button>
    </Badge>
  );
}
