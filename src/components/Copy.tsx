import type { ReactNode } from 'react';
import { SHOW_PLACEHOLDERS, isPlaceholder } from '@/lib/placeholder.ts';
import { Rich } from '@/components/Rich.tsx';

/* One piece of copy.  Hidden in production while it is still a placeholder;
   marked with data-placeholder (italic, muted) on the dev server. */
export function Copy({ as = 'p', text, className, children }: { as?: 'p' | 'span' | 'li' | 'div'; text: string; className?: string; children?: ReactNode }) {
  const ph = isPlaceholder(text);
  if (ph && !SHOW_PLACEHOLDERS) return null;
  const Tag = as;
  return <Tag className={className} data-placeholder={ph ? '' : undefined}>{children ?? <Rich text={text} />}</Tag>;
}
