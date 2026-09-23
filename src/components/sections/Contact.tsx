import type { ReactNode } from 'react';
import { CONTENT } from '@/content/content.ts';
import { Section, type PlatedDef } from '@/components/Section.tsx';
import { Button } from '@/components/ui/button.tsx';
import { useDoc, useEngine, useLang } from '@/store/site.tsx';
import { Copy } from '@/components/Copy.tsx';
import { realHref } from '@/lib/placeholder.ts';
import { ExtLink } from '@/components/ExtLink.tsx';
import { DebateCta } from '@/components/DebateCta.tsx';

function Line({ label, children }: { label: string; children: ReactNode }) {
  return <div className="row"><span className="row-label">{label}</span><div className="row-body">{children}</div></div>;
}

export function Contact({ def }: { def: PlatedDef }) {
  const engine = useEngine();
  const { copied, mailEndpoint } = useDoc();
  const { L, ui } = useLang();
  const meta = CONTENT.meta;
  return (
    <Section def={def}>
      <div className="contact-list">
        <Line label={ui.email}>
          <Button variant="inline" title={ui.copyHint} onClick={() => engine.exec('contact email')}>{meta.email}</Button>
          <span className="copied" aria-live="polite">{copied ? ui.copied : ''}</span>
          {mailEndpoint && <> · <Button variant="inline" onClick={() => engine.exec('mail')}>{ui.mailWrite}</Button></>}
        </Line>
        {realHref(meta.github) && <Line label="GitHub"><ExtLink href={meta.github} blurb={ui.blurbGithub}>{meta.githubLabel}</ExtLink></Line>}
        {realHref(meta.linkedin) && <Line label="LinkedIn"><ExtLink href={meta.linkedin} blurb={ui.blurbLinkedin}>{meta.linkedinLabel}</ExtLink></Line>}
        {realHref(meta.cv) && <Line label="CV"><ExtLink href={meta.cv} blurb={ui.blurbCv}>{ui.cvDownload}</ExtLink></Line>}
      </div>
      <Copy className="note" text={L(CONTENT.contact.note)} />
      <DebateCta hint="before" className="contact-debate" />
    </Section>
  );
}
