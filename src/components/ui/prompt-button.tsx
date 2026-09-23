import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

/* A button in the terminal's own language: mono, a `$` sign, plate colours,
   square corners, optionally a blinking block caret.  Hover inverts to the
   accent (Aceternity's "Invert it" button, restyled).  Used for the hero
   call-to-actions and the top bar's terminal button. */
export function PromptButton({ outline, caret, className, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { outline?: boolean; caret?: boolean; children: ReactNode }) {
  return (
    <button type="button" className={cn('pbtn', outline && 'pbtn-outline', className)} {...props}>
      <span className="pbtn-sign" aria-hidden="true">$</span>
      <span>{children}</span>
      {caret && <span className="pbtn-caret" aria-hidden="true" />}
    </button>
  );
}
