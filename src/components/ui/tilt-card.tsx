import { useRef, type ElementType, type HTMLAttributes, type PointerEvent, type ReactNode } from 'react';
import { reduced } from '@/lib/motion.ts';
import { cn } from '@/lib/utils';

/* Aceternity UI's 3D card (CardContainer / CardBody / CardItem), adapted: the
   tilt is written as CSS variables on the body through a ref, so a pointer move
   never re-renders; the angle is clamped to ±4° so the text stays readable; only
   a mouse tilts it (no touch, no keyboard), and reduced motion disables it.
   `TiltItem` layers lift in Z (translateZ(--z)) while the card is hovered. */
const MAX = 4;
const clamp = (v: number) => Math.max(-MAX, Math.min(MAX, v));

export function TiltCard({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  const body = useRef<HTMLDivElement>(null);
  const live = (e: PointerEvent) => e.pointerType === 'mouse' && !reduced();
  const move = (e: PointerEvent<HTMLDivElement>) => {
    const el = body.current;
    if (!el || !live(e)) return;
    const r = el.getBoundingClientRect();
    const ry = clamp((e.clientX - (r.left + r.width / 2)) / (r.width / 8));
    const rx = clamp(-(e.clientY - (r.top + r.height / 2)) / (r.height / 8));
    el.style.setProperty('--rx', rx.toFixed(2) + 'deg');
    el.style.setProperty('--ry', ry.toFixed(2) + 'deg');
    el.setAttribute('data-hover', '');   /* a move is a hover too: enter can arrive before hydration */
  };
  const enter = (e: PointerEvent<HTMLDivElement>) => { if (live(e)) body.current?.setAttribute('data-hover', ''); };
  const leave = () => {
    const el = body.current;
    if (!el) return;
    el.removeAttribute('data-hover');
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  };
  return (
    <div className={cn('tilt', className)} onPointerMove={move} onPointerEnter={enter} onPointerLeave={leave} {...props}>
      <div ref={body} className="tilt-body">{children}</div>
    </div>
  );
}

export function TiltItem({ as: Tag = 'div', depth = 0, className, children, ...props }: { as?: ElementType; depth?: number; className?: string; children?: ReactNode } & HTMLAttributes<HTMLElement>) {
  return <Tag className={cn('tilt-item', className)} style={{ '--z': depth + 'px' }} {...props}>{children}</Tag>;
}
