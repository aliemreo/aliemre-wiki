import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { CONTENT } from '@/content/content.ts';
import { PromptButton } from '@/components/ui/prompt-button.tsx';
import { useDoc, useEngine, useLang } from '@/store/site.tsx';

/* The mail dialog (§5.13) on the native <dialog>, like the ⌘K palette: name,
   address, message, send.  The engine posts it to CONTENT.meta.mail; the
   Worker delivers it with the visitor's address as Reply-To.  The fields live
   here, so a draft survives closing the dialog; `mail <text>` pre-fills the
   message.  `website` is a honeypot: hidden from people, filled by bots. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function MailDialog() {
  const engine = useEngine();
  const { mail } = useDoc();
  const { ui } = useLang();
  const id = useId();
  const ref = useRef<HTMLDialogElement>(null);
  const [f, setF] = useState({ name: '', email: '', message: '', hp: '' });
  const [err, setErr] = useState<{ email?: string; message?: string }>({});
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => { setF(v => ({ ...v, [k]: e.target.value })); setErr(x => ({ ...x, [k]: undefined })); };

  useEffect(() => {
    const d = ref.current; if (!d) return;
    if (mail.open && !d.open) {
      if (mail.draft) setF(v => ({ ...v, message: mail.draft }));
      d.showModal();
      const first = d.querySelector<HTMLElement>('input:not([tabindex="-1"]):placeholder-shown, textarea:placeholder-shown');
      first?.focus();
    } else if (!mail.open && d.open) d.close();
  }, [mail.open, mail.draft]);
  /* sent: clear the draft, close after a moment */
  useEffect(() => {
    if (mail.status !== 'sent' || !mail.open) return;
    setF(v => ({ ...v, message: '' }));
    const t = setTimeout(() => engine.closeMail(), 1500);
    return () => clearTimeout(t);
  }, [mail.status, mail.open, engine]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const bad = { email: EMAIL_RE.test(f.email.trim()) ? undefined : ui.mailBadEmail, message: f.message.trim().length >= 10 ? undefined : ui.mailShort };
    setErr(bad);
    if (bad.email || bad.message) { ref.current?.querySelector<HTMLElement>(bad.email ? 'input[type=email]' : 'textarea')?.focus(); return; }
    void engine.sendMail({ name: f.name.trim(), email: f.email.trim(), message: f.message.trim(), hp: f.hp });
  };
  const sending = mail.status === 'sending';
  const first = CONTENT.meta.name.split(' ')[0].toLowerCase();
  return (
    <dialog ref={ref} className="palette mail" aria-labelledby={id + '-t'} onClose={() => engine.closeMail()} onClick={e => { if (e.target === ref.current) engine.closeMail(); }}>
      <form className="palette-box mail-box" onSubmit={submit} noValidate>
        <div className="mail-head">
          <span className="mono" aria-hidden="true">$ mail {first}</span>
          <button type="button" className="ask-close" aria-label={ui.mailCancel} onClick={() => engine.closeMail()}>×</button>
        </div>
        <h2 className="mail-title" id={id + '-t'}>{ui.mailTitle}</h2>
        <label className="mail-field"><span>{ui.mailName}</span>
          <input value={f.name} onChange={set('name')} maxLength={80} autoComplete="name" placeholder=" " />
        </label>
        <label className="mail-field"><span>{ui.mailEmail}</span>
          <input type="email" value={f.email} onChange={set('email')} maxLength={200} autoComplete="email" placeholder=" " required
            aria-invalid={!!err.email} aria-describedby={err.email ? id + '-e' : undefined} />
        </label>
        {err.email && <p className="mail-err" id={id + '-e'}>{err.email}</p>}
        <label className="mail-field"><span>{ui.mailMessage}</span>
          <textarea value={f.message} onChange={set('message')} rows={6} maxLength={2000} placeholder=" " required
            aria-invalid={!!err.message} aria-describedby={err.message ? id + '-m' : undefined} />
        </label>
        {err.message && <p className="mail-err" id={id + '-m'}>{err.message}</p>}
        <div className="mail-hp" aria-hidden="true">
          <input name="website" tabIndex={-1} autoComplete="off" value={f.hp} onChange={set('hp')} />
        </div>
        <div className="mail-foot" aria-live="polite">
          {mail.status === 'sent' ? <span className="mail-ok">{ui.mailSent}</span>
            : mail.status === 'error' ? <span className="mail-err">{mail.error} · <button type="button" className="ask-link" onClick={() => engine.exec('contact email')}>{ui.mailCopyInstead}</button></span>
            : <span>{ui.mailReplyNote}</span>}
          <span className="mail-actions">
            <PromptButton outline className="pbtn-sm" onClick={() => engine.closeMail()}>{ui.mailCancel}</PromptButton>
            <PromptButton type="submit" className="pbtn-sm" caret={!sending} disabled={sending || mail.status === 'sent'}>{sending ? ui.mailSending : ui.mailSend}</PromptButton>
          </span>
        </div>
      </form>
    </dialog>
  );
}
