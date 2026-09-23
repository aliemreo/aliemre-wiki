import { LinkPreview } from '@/components/ui/link-preview.tsx';
import { MOTIFS, motifLabel, motifMask, type MotifKey } from '@/lib/motifs.ts';
import { useLang } from '@/store/site.tsx';

/* The six masks are emitted once as CSS rules rather than inline on every
   motif, which keeps the prerendered HTML small. */
const css = (Object.keys(MOTIFS) as MotifKey[])
  .map(k => `.motif[data-motif="${k}"]{-webkit-mask-image:${motifMask(MOTIFS[k].grid)};mask-image:${motifMask(MOTIFS[k].grid)}}`)
  .join('\n');

export function MotifStyles() {
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}

/* A plate motif: a link to its reference with a preview card that shows the
   motif large, its name and what it means. */
export function Motif({ k }: { k: MotifKey }) {
  const { L } = useLang();
  const m = MOTIFS[k];
  const label = motifLabel(k);
  return (
    <LinkPreview
      href={L(m.href)}
      blurb={L(m.blurb)}
      className="motif-link"
      preview={<><span className="motif lp-motif" data-motif={k} aria-hidden="true" /><span className="lp-motif-name">{m.name}</span></>}
    >
      <span className="motif" data-motif={k} role="img" aria-label={label} />
    </LinkPreview>
  );
}
