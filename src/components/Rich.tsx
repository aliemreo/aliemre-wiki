import { LINKS } from '@/content/links.ts';
import { LinkPreview } from '@/components/ui/link-preview.tsx';
import { parseRich } from '@/lib/rich.ts';
import { useLang } from '@/store/site.tsx';

/* Copy with [[key]] tokens.  Each token becomes a LinkPreview whose card opens
   on click (never on hover); `cards={false}` renders ordinary links instead
   (`.rich-link`) for a place that must stay quiet.  An unknown key renders as
   its text so a typo never breaks a sentence. */
export function Rich({ text, cards = true }: { text: string; cards?: boolean }) {
  const { L } = useLang();
  const parts = parseRich(text);
  if (parts.length === 1 && typeof parts[0] === 'string') return <>{text}</>;
  return (
    <>
      {parts.map((p, i) => {
        if (typeof p === 'string') return p;
        const def = LINKS[p.key];
        if (!def) return p.text ?? p.key;
        const label = p.text ?? def.label;
        if (!cards) return def.href ? <a key={i} href={def.href} target="_blank" rel="noopener" className="rich-link">{label}</a> : label;
        return (
          <LinkPreview key={i} href={def.href} blurb={L(def.blurb)} preview={def.preview ?? `./previews/${p.key}.webp`}>
            {label}
          </LinkPreview>
        );
      })}
    </>
  );
}
