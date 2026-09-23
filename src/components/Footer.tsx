import { CONTENT, PALETTES } from '@/content/content.ts';
import { Button } from '@/components/ui/button.tsx';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group.tsx';
import { useDoc, useEngine, useLang } from '@/store/site.tsx';

/* Last updated · palette dots · theme · language · colophon.  Each dot carries
   data-palette, so its colour comes from that palette's own CSS block. */
export function Footer() {
  const engine = useEngine();
  const { theme, palette, font } = useDoc();
  const { ui, lang } = useLang();
  return (
    <footer className="noprint">
      <span>{ui.updated} {CONTENT.meta.updated}</span>
      <div className="foot-right">
        <ToggleGroup type="single" value={palette} onValueChange={v => { if (v) engine.exec('palette ' + v); }} aria-label={ui.paletteLabel} className="swatches gap-1.5 rounded-none">
          {PALETTES.map(p => (
            <ToggleGroupItem key={p} value={p} aria-label={p} title={p} data-palette={p} className="size-[18px] min-w-0 rounded-full border-2 border-transparent bg-[var(--accent)] p-0 hover:bg-[var(--accent)] data-[state=on]:border-ink data-[state=on]:bg-[var(--accent)] first:rounded-full last:rounded-full" />
          ))}
        </ToggleGroup>
        <Button variant="inline" onClick={() => engine.exec('theme')}>{theme === 'dark' ? ui.light : ui.dark}</Button>
        <Button variant="inline" onClick={() => engine.exec('font')} title="font">{font === 'geist' ? ui.fontInter : ui.fontGeist}</Button>
        <Button variant="inline" lang={lang === 'en' ? 'tr' : 'en'} onClick={() => engine.exec('lang')}>{ui.lang}</Button>
        <a href="#colophon">{ui.colophon}</a>
      </div>
    </footer>
  );
}
