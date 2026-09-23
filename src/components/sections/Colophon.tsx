import { CONTENT } from '@/content/content.ts';
import { useLang } from '@/store/site.tsx';

export function Colophon() {
  const { L, ui } = useLang();
  return (
    <section id="colophon">
      <h2>{ui.colophon}</h2>
      <div className="body">{L(CONTENT.colophon).map((t, i) => <p key={i}>{t}</p>)}</div>
    </section>
  );
}
