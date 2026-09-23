import { useLayoutEffect, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/* BranchedMenu, adapted from React Bits (reactbits.dev/micro/branched-menu):
   sections that fold, children on curved branches, an accent line that draws
   itself to the active child and a marker that glides to its section.
   Changes from the original: `active` and `open` can be controlled, children render as
   links when `href` is given (so the menu works without JavaScript), icons are
   plain ReactNodes, and every colour defaults to a site token. */
export interface BranchedMenuChild { value: string; label: string; icon?: ReactNode }
export interface BranchedMenuItem { label: string; value?: string; children?: BranchedMenuChild[] }

export interface BranchedMenuProps {
  items: BranchedMenuItem[];
  defaultOpen?: number | number[];
  defaultActive?: string;
  active?: string;                       // controlled: the selected child value
  open?: number[];                       // controlled: indices of unfolded sections
  href?: (value: string) => string;      // render children as <a href>
  onSelect?: (value: string, item: BranchedMenuChild | BranchedMenuItem) => void;
  onToggle?: (index: number, open: boolean) => void;
  color?: string; accentColor?: string; lineColor?: string;
  width?: number; rowHeight?: number; indent?: number; trunk?: number; radius?: number; lineWidth?: number;
  fontSize?: number; drawDuration?: number; foldDuration?: number;
  className?: string;
  'aria-label'?: string;
}

const PAD = 6;
const MARK = 16;
const toSet = (open: number | number[]) => new Set(Array.isArray(open) ? open : open >= 0 ? [open] : []);
const line = 'fill-none [stroke-width:var(--bm-line-w)] [stroke-linecap:round] [stroke-linejoin:round]';

export function BranchedMenu({
  items, defaultOpen = 0, defaultActive = '', active: controlled, open: controlledOpen, href, onSelect, onToggle,
  color = 'var(--ink)', accentColor = 'var(--accent)', lineColor = 'var(--rule)',
  width = 240, rowHeight = 36, indent = 40, trunk = 14, radius = 10, lineWidth = 1.5,
  fontSize = 14, drawDuration = 400, foldDuration = 300, className, 'aria-label': ariaLabel,
}: BranchedMenuProps) {
  const [uncontrolledOpen, setOpen] = useState<Set<number>>(() => toSet(defaultOpen));
  const open = controlledOpen ? new Set(controlledOpen) : uncontrolledOpen;
  const [uncontrolled, setUncontrolled] = useState(() => {
    if (defaultActive) return defaultActive;
    const first = items.find((it, i) => it.children && toSet(defaultOpen).has(i));
    return first?.children?.[0]?.value ?? '';
  });
  const active = controlled ?? uncontrolled;
  const navRef = useRef<HTMLElement>(null);
  const heads = useRef<(HTMLButtonElement | null)[]>([]);
  const markerRef = useRef<HTMLSpanElement>(null);

  const activeSection = items.findIndex(it => it.children?.some(kid => kid.value === active));
  const markerShown = activeSection >= 0 && open.has(activeSection);
  useLayoutEffect(() => {
    const place = (glide: boolean) => {
      const m = markerRef.current, el = heads.current[activeSection];
      if (!m) return;
      const on = markerShown && el;
      if (!glide) m.style.transition = 'none';
      if (on) m.style.top = `${el.offsetTop + (el.offsetHeight - MARK) / 2}px`;
      m.toggleAttribute('data-on', Boolean(on));
      if (!glide) { void m.offsetHeight; m.style.transition = ''; }
    };
    place(true);
    let first = true;
    const ro = new ResizeObserver(() => { if (first) { first = false; return; } place(false); });
    if (navRef.current) ro.observe(navRef.current);
    return () => ro.disconnect();
  }, [activeSection, markerShown, items, fontSize, rowHeight]);

  const select = (value: string, item: BranchedMenuChild | BranchedMenuItem) => {
    if (controlled === undefined) setUncontrolled(value);
    onSelect?.(value, item);
  };
  const toggle = (i: number) => {
    const isOpen = !open.has(i);
    if (controlledOpen === undefined) {
      setOpen(prev => { const next = new Set(prev); if (isOpen) next.add(i); else next.delete(i); return next; });
    }
    onToggle?.(i, isOpen);
  };

  const r = Math.min(radius, rowHeight / 2 - 2);
  const endX = indent - 8;
  const rowY = (k: number) => PAD + k * rowHeight + rowHeight / 2;
  const branch = (k: number) => `M ${trunk} ${rowY(k) - r} A ${r} ${r} 0 0 0 ${trunk + r} ${rowY(k)} H ${endX}`;
  const reach = (k: number) => `M ${trunk} 0 V ${rowY(k) - r} A ${r} ${r} 0 0 0 ${trunk + r} ${rowY(k)} H ${endX}`;
  const length = (k: number) => rowY(k) - r + (Math.PI * r) / 2 + (endX - trunk - r);

  const childClass = 'm-0 box-border flex w-full cursor-pointer items-center gap-2 border-0 bg-transparent py-0 pr-0 text-left no-underline outline-none [height:var(--bm-row)] [padding-left:var(--bm-indent)] [color:var(--bm-muted)] [font-family:inherit] [transition:color_200ms_ease] hover:[color:var(--bm-ink)] data-[active]:font-medium data-[active]:[color:var(--bm-accent)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:[outline-color:var(--bm-accent)]';

  return (
    <nav
      ref={navRef}
      aria-label={ariaLabel}
      className={cn("relative flex w-fit max-w-[min(var(--bm-w),100%)] flex-col pl-3.5 leading-[1.2] [color:var(--bm-ink)] [font-size:var(--bm-font)] before:absolute before:top-2 before:bottom-0 before:left-0 before:w-0.5 before:rounded-[1px] before:[background:linear-gradient(to_bottom,var(--bm-line)_0%,var(--bm-line)_55%,transparent_100%)] before:content-['']", className)}
      style={{
        '--bm-w': `${width}px`, '--bm-ink': color, '--bm-accent': accentColor, '--bm-line': lineColor,
        '--bm-font': `${fontSize}px`, '--bm-row': `${rowHeight}px`, '--bm-indent': `${indent}px`, '--bm-line-w': lineWidth,
        '--bm-draw': `${drawDuration}ms`, '--bm-muted': `color-mix(in srgb, ${color} 55%, transparent)`, '--bm-fold': `${foldDuration}ms`,
      } as CSSProperties}
    >
      <span
        ref={markerRef}
        className="absolute -top-px left-0 z-[1] h-4 w-0.5 rounded-[1px] opacity-0 [background:var(--bm-accent)] [transition:top_220ms_cubic-bezier(0.23,1,0.32,1),opacity_150ms_ease] data-[on]:opacity-100 motion-reduce:[transition:opacity_150ms_ease]"
        aria-hidden="true"
      />
      {items.map((item, i) => {
        const kids = item.children;
        const isOpen = kids ? open.has(i) : false;
        const leafValue = item.value ?? item.label;
        const leafActive = !kids && leafValue === active;
        const bodyH = kids ? PAD * 2 + kids.length * rowHeight : 0;
        return (
          <div key={item.value ?? item.label} className="group/section flex flex-col" data-open={isOpen ? '' : undefined}>
            <button
              ref={el => { heads.current[i] = el; }}
              type="button"
              className="m-0 block cursor-pointer border-0 bg-transparent py-[9px] text-left font-medium outline-none [color:var(--bm-muted)] [font-family:inherit] [font-size:calc(var(--bm-font)+1px)] [transition:color_200ms_ease] group-data-[open]/section:[color:var(--bm-ink)] data-[active]:[color:var(--bm-ink)] hover:[color:var(--bm-ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--bm-accent)]"
              aria-expanded={kids ? isOpen : undefined}
              aria-current={leafActive ? 'true' : undefined}
              data-active={leafActive ? '' : undefined}
              onClick={() => (kids ? toggle(i) : select(leafValue, item))}
            >
              {item.label}
            </button>
            {kids ? (
              <div data-fold="" className="grid [grid-template-rows:0fr] [transition:grid-template-rows_var(--bm-fold)_cubic-bezier(0.23,1,0.32,1)] group-data-[open]/section:[grid-template-rows:1fr] motion-reduce:transition-none">
                <div className="min-h-0 overflow-hidden">
                  <div className="relative box-border py-1.5" style={{ height: bodyH }}>
                    <svg className="pointer-events-none absolute top-0 left-0 overflow-visible opacity-0 [transition:opacity_200ms_ease] group-data-[open]/section:opacity-100 group-data-[open]/section:[transition:opacity_250ms_ease_100ms]" width={indent} height={bodyH} aria-hidden="true">
                      <path className={cn(line, '[stroke:var(--bm-line)]')} d={`M ${trunk} 0 V ${rowY(kids.length - 1) - r}`} />
                      {kids.map((kid, k) => <path key={kid.value} className={cn(line, '[stroke:var(--bm-line)]')} d={branch(k)} />)}
                      {kids.map((kid, k) => (
                        <path
                          key={kid.value}
                          className={cn(line, '[stroke:var(--bm-accent)] [transition:stroke-dashoffset_var(--bm-draw)_cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none')}
                          d={reach(k)}
                          style={{ strokeDasharray: length(k), strokeDashoffset: kid.value === active ? 0 : length(k) }}
                        />
                      ))}
                    </svg>
                    {kids.map(kid => {
                      const isActive = kid.value === active;
                      const common = {
                        className: childClass,
                        'aria-current': isActive ? ('true' as const) : undefined,
                        'data-active': isActive ? '' : undefined,
                        tabIndex: isOpen ? 0 : -1,
                      };
                      const body = (
                        <>
                          {kid.icon ? <span className="inline-flex flex-none" aria-hidden="true">{kid.icon}</span> : null}
                          <span className="whitespace-nowrap">{kid.label}</span>
                        </>
                      );
                      return href ? (
                        <a key={kid.value} {...common} href={href(kid.value)} onClick={(e: MouseEvent) => { e.preventDefault(); select(kid.value, kid); }}>{body}</a>
                      ) : (
                        <button key={kid.value} {...common} type="button" onClick={() => select(kid.value, kid)}>{body}</button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}
