import type { ReactNode } from 'react';
import { LinkPreview } from '@/components/ui/link-preview.tsx';
import { previewSrc } from '@/lib/preview.ts';

/* Every external link on the site follows one convention: a click opens its
   preview card, a click on the card opens the site (a modifier-click goes
   straight there).  Contact profiles, project links, reading and writing
   entries use this; [[terms]] in copy go through <Rich>. */
export function ExtLink({ href, blurb, className, children }: { href: string; blurb: string; className?: string; children: ReactNode }) {
  return <LinkPreview href={href} blurb={blurb} preview={previewSrc(href)} className={className}>{children}</LinkPreview>;
}
