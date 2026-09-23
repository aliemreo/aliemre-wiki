import { LINKS } from '@/content/links.ts';
import { LinkPreview } from '@/components/ui/link-preview.tsx';
import { useLang } from '@/store/site.tsx';

/* The places I have worked and studied, as a slow marquee of mono pills.  Every
   pill is a LinkPreview, so the hover cards work here too.  The row is
   duplicated once for a seamless loop; the copy is aria-hidden. */
export function Marquee() {
  const { L, ui } = useLang();
  const items = Object.entries(LINKS).filter(([, d]) => d.href);
  const row = (hidden: boolean) => (
    <div className="marquee-row" aria-hidden={hidden || undefined}>
      {items.map(([k, d]) => (
        <LinkPreview key={k} href={d.href} blurb={L(d.blurb)} preview={d.preview ?? `./previews/${k}.webp`} className="marquee-pill">{d.label}</LinkPreview>
      ))}
    </div>
  );
  return (
    <div className="marquee" role="group" aria-label={ui.marqueeLabel}>
      <div className="marquee-track">{row(false)}{row(true)}</div>
    </div>
  );
}
