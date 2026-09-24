import { useId, useState, type FormEvent } from 'react';
import GUESTBOOK from '@/content/guestbook.json';
import type { GuestEntry } from '@/content/types.ts';
import { Section, type PlatedDef } from '@/components/Section.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import { useDoc, useEngine, useLang } from '@/store/site.tsx';

/* Entries plus a small form.  A new entry shows at once as "awaiting review";
   the Worker (ask/guestbook.mjs) moderates it, commits approved ones to
   guestbook.json — the next deploy shows them — and emails the owner.  The form
   exists only on the client and only while an endpoint is set. */
const ENTRIES = GUESTBOOK as GuestEntry[];
export function Guestbook({ def }: { def: PlatedDef }) {
  const engine = useEngine();
  const { pendingGuests, guestEndpoint } = useDoc();
  const { ui } = useLang();
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [hp, setHp] = useState('');   /* honeypot: hidden from people, filled by bots */
  const id = useId();
  const entries = [
    ...pendingGuests,
    ...ENTRIES.map(g => ({ ...g, pending: false })),
  ];
  const submit = (e: FormEvent) => {
    e.preventDefault();
    void engine.postGuest(name.trim(), message.trim(), hp);
    setName(''); setMessage('');
  };
  return (
    <Section def={def}>
      <p className="note">{ui.guestbookNote}</p>
      {entries.map((g, i) => (
        <article className="row" key={i} lang={'lang' in g ? g.lang : undefined}>
          <div className="row-label"><span className="who">{g.name}</span><time>{g.date}</time></div>
          <div className="row-body">
            <p>{g.message}</p>
            {g.pending && <span className="pending">{ui.pending}</span>}
          </div>
        </article>
      ))}
      {guestEndpoint && <form className="guest-form" onSubmit={submit}>
        <Label htmlFor={id + '-name'} className="sr-only">{ui.guestName}</Label>
        <Input id={id + '-name'} className="h-auto flex-[0_1_140px] rounded-[4px] px-2.5 py-1.5 font-mono text-[13px] shadow-none placeholder:text-muted-ink md:text-[13px]" placeholder={ui.guestName} value={name} onChange={e => setName(e.target.value)} />
        <Label htmlFor={id + '-msg'} className="sr-only">{ui.guestMsg}</Label>
        <Input id={id + '-msg'} className="h-auto flex-[1_1_220px] rounded-[4px] px-2.5 py-1.5 font-mono text-[13px] shadow-none placeholder:text-muted-ink md:text-[13px]" placeholder={ui.guestMsg} maxLength={200} value={message} onChange={e => setMessage(e.target.value)} />
        <input className="mail-hp" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" value={hp} onChange={e => setHp(e.target.value)} />
        <Button type="submit" className="h-auto rounded-[4px] border border-primary px-3.5 py-1.5 font-mono text-[13px] font-normal">echo</Button>
      </form>}
    </Section>
  );
}
