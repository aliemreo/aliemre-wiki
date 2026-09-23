import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

/* LinkPreview, adapted from Aceternity UI (ui.aceternity.com/components/link-preview):
   a linked term that shows a small preview card.  Changes from the original:
   the card opens on click, tap or Enter — never on hover (the owner found hover
   cards popping up everywhere); it is a 40-line fixed-position popover of its
   own (no Radix, no floating-ui: with a click-controlled card the positioning
   engine was 12 KB for nothing); motion is CSS (no framer-motion); and the
   preview is a static image committed to the repo (`npm run previews`) or any
   ReactNode — nothing is fetched from a third party.  The trigger stays a real
   <a href>, so the prerender and the no-JS page have plain links, and a
   modifier or middle click still goes straight to the site. */
export interface LinkPreviewProps {
  href?: string;                  // without one the term is plain text with a card
  blurb: string;
  preview?: string | ReactNode;   // image src, or custom content (the motif cards)
  className?: string;
  children: ReactNode;
}

const GAP = 10, PAD = 12, EXIT = 150;

export function LinkPreview({ href, blurb, preview, className, children }: LinkPreviewProps) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<'open' | 'closed'>('closed');   // 'closed' while the exit animation plays
  const [x, setX] = useState(0);
  const [broken, setBroken] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; side: 'top' | 'bottom' } | null>(null);
  const [mounted, setMounted] = useState(false);
  const trigger = useRef<HTMLElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const id = useId();

  const toggle = (e: MouseEvent<HTMLElement>) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;   // let the browser open the site
    e.preventDefault();
    const r = e.currentTarget.getBoundingClientRect();
    /* nudge the card toward the click, but only for a real pointer click on the term (a keyboard click has no position) */
    const onTerm = e.clientX >= r.left && e.clientX <= r.right;
    setX(onTerm ? Math.max(-40, Math.min(40, (e.clientX - r.left - r.width / 2) / 2)) : 0);
    setOpen(o => !o);
  };
  const onKey = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(o => !o); }
    else if (e.key === 'Tab' && open && !e.shiftKey) { const a = card.current?.querySelector<HTMLElement>('a, [tabindex]'); if (a) { e.preventDefault(); a.focus(); } }
  };

  /* place the card above the term (below if there is no room), centred and
     kept inside the viewport; follow scroll and resize while open */
  useLayoutEffect(() => {
    if (!open || !mounted) return;
    const place = () => {
      const t = trigger.current?.getBoundingClientRect(), el = card.current;
      if (!t || !el) return;
      const h = el.offsetHeight, w = el.offsetWidth;   /* layout size: the bounding box is shrunk by the enter animation */
      const side = t.top - GAP - h >= PAD ? 'top' : 'bottom';
      const top = side === 'top' ? t.top - GAP - h : t.bottom + GAP;
      const left = Math.min(Math.max(t.left + t.width / 2 - w / 2, PAD), window.innerWidth - w - PAD);
      setPos({ top, left, side });
    };
    place();
    window.addEventListener('scroll', place, { passive: true, capture: true });
    window.addEventListener('resize', place);
    return () => { window.removeEventListener('scroll', place, { capture: true }); window.removeEventListener('resize', place); };
  }, [open, mounted]);

  /* Escape, a click outside, or Tab out of the card close it */
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => { const n = e.target as Node; if (!card.current?.contains(n) && !trigger.current?.contains(n)) setOpen(false); };
    const onKeyDown = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); trigger.current?.focus(); } };
    const onFocus = (e: FocusEvent) => { const n = e.target as Node; if (!card.current?.contains(n) && !trigger.current?.contains(n)) setOpen(false); };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('focusin', onFocus);
    return () => { document.removeEventListener('pointerdown', onDown); document.removeEventListener('keydown', onKeyDown, true); document.removeEventListener('focusin', onFocus); };
  }, [open]);
  /* mount on open; on close keep the card mounted for the out animation */
  useEffect(() => {
    if (open) { setMounted(true); setState('open'); return; }
    setState('closed');
    const t = setTimeout(() => { setMounted(false); setPos(null); }, EXIT);
    return () => clearTimeout(t);
  }, [open]);

  const domain = href ? href.replace(/^https?:\/\/(www\.)?/, '').split('/')[0] : '';
  const image = typeof preview === 'string';
  const Card = href ? 'a' : 'div';
  const shared = { 'data-state': open ? 'open' : 'closed', 'aria-expanded': open, 'aria-haspopup': 'dialog' as const, 'aria-controls': mounted ? id : undefined, onClick: toggle, onKeyDown: onKey };
  return (
    <>
      {href
        ? <a ref={trigger as RefObject<HTMLAnchorElement>} href={href} target="_blank" rel="noopener" className={cn('lp-trigger', className)} {...shared}>{children}</a>
        : <span ref={trigger as RefObject<HTMLSpanElement>} tabIndex={0} role="button" className={cn('lp-trigger lp-term', className)} {...shared}>{children}</span>}
      {mounted && createPortal(
        <div ref={card} id={id} role="dialog" className="lp-content" data-slot="link-preview" data-state={state} data-side={pos?.side ?? 'top'}
          style={{ position: 'fixed', top: pos?.top ?? 0, left: pos?.left ?? 0, visibility: pos ? 'visible' : 'hidden' }}>
          <div className="lp-follow" style={{ '--lp-x': `${x}px` } as CSSProperties}>
            <Card {...(href ? { href, target: '_blank', rel: 'noopener' } : {})} className="lp-card" onKeyDown={(e: KeyboardEvent) => { if (e.key === 'Tab') { e.preventDefault(); setOpen(false); trigger.current?.focus(); } }}>
              {image && !broken ? <img src={preview} width={200} height={125} alt="" className="lp-img" loading="lazy" onError={() => setBroken(true)} /> : null}
              {!image && preview ? <div className="lp-custom">{preview}</div> : null}
              <div className="lp-caption">
                <span className="lp-blurb">{blurb}</span>
                {domain && <span className="lp-domain">{domain}</span>}
              </div>
            </Card>
          </div>
        </div>,
        document.body)}
    </>
  );
}
