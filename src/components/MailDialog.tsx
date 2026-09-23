import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { CONTENT } from '@/content/content.ts';
import { FlapCells } from '@/components/Cells.tsx';
import { PromptButton } from '@/components/ui/prompt-button.tsx';
import { FLAP_CHARS } from '@/lib/flap.ts';
import { reduced } from '@/lib/motion.ts';
import { useDoc, useEngine, useLang } from '@/store/site.tsx';

/* The mail dialog (§5.13) on the native <dialog>, like the ⌘K palette: name,
   address, message, send.  The engine posts it to CONTENT.meta.mail; the
   Worker delivers it with the visitor's address as Reply-To.  The fields live
   here, so a draft survives closing the dialog; `mail <text>` pre-fills the
   message.  `website` is a honeypot: hidden from people, filled by bots. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* each letter 4–7 places before its target on the drum, so the flip is short */
const back = (to: string) => [...to].map(ch => { const i = FLAP_CHARS.indexOf(ch); return i <= 0 ? ch : FLAP_CHARS[(i - 4 - Math.floor(Math.random() * 4) + FLAP_CHARS.length) % FLAP_CHARS.length]; }).join('');

/* the first of these that is on screen */
const onScreen = (...es: (Element | null | undefined)[]) => es.find(e => { const r = e?.getBoundingClientRect(); return r && r.width && r.bottom > 0 && r.top < innerHeight; }) as HTMLElement | undefined;

/* Sent: the window folds back into what opened it, like a macOS minimise into
   the Dock — it scales toward the `$ email me` button (the opener; else the
   hero's button, the terminal prompt, the top bar's `$ terminal`) while the
   edge facing it narrows, the backdrop fades, and the target pulses once. */
function genie(d: HTMLDialogElement, from: Element | null, done: () => void): Animation | undefined {
  const box = d.firstElementChild as HTMLElement;
  const t = onScreen(from, document.querySelector('[data-mail-home]'), document.querySelector('.term input')?.parentElement, document.querySelector('.topbar-cta'));
  if (!t) { done(); return; }
  const b = box.getBoundingClientRect(), r = t.getBoundingClientRect();
  const ox = r.left + r.width / 2 - b.left, oy = r.top + r.height / 2 - b.top;
  const px = Math.min(96, Math.max(4, ox / b.width * 100)), py = Math.min(96, Math.max(4, oy / b.height * 100));
  const dx = ox / b.width - .5, dy = oy / b.height - .5;
  const side = Math.abs(dy) > Math.abs(dx) ? (dy < 0 ? 0 : 2) : (dx > 0 ? 1 : 3);   /* top right bottom left */
  const L = (a: number, z: number, k: number) => a + (z - a) * k;
  /* corners TL TR BR BL; the two on the facing edge close in on the target */
  const poly = (k: number) => {
    const c = [[0, 0], [100, 0], [100, 100], [0, 100]];
    const [i, j] = [side, (side + 1) % 4], vert = side % 2 === 0, p = vert ? px : py;
    const axis = vert ? 0 : 1;   /* top/bottom edges run along x, left/right along y */
    c[i][axis] = L(c[i][axis], p + (c[i][axis] < 50 ? -4 : 4), k);
    c[j][axis] = L(c[j][axis], p + (c[j][axis] < 50 ? -4 : 4), k);
    return `polygon(${c.map(([x, y]) => `${x}% ${y}%`).join(',')})`;
  };
  box.style.transformOrigin = `${ox}px ${oy}px`;
  d.setAttribute('data-closing', '');
  const a = box.animate([
    { transform: 'none', clipPath: poly(0), opacity: 1 },
    { offset: .3, transform: 'scale(.96,.9)', clipPath: poly(.7) },
    { offset: .75, transform: 'scale(.3)', clipPath: poly(1), opacity: .9 },
    { transform: 'scale(.02)', clipPath: poly(1), opacity: 0 },
  ], { duration: 800, easing: 'cubic-bezier(.45,0,.55,1)', fill: 'forwards' });   /* even pace: the fold is watched, not a vanish */
  a.onfinish = () => {
    d.close();   /* in this frame, before the cancel below restores the box; onClose tells the engine */
    d.removeAttribute('data-closing'); a.cancel();
    t.setAttribute('data-arrive', ''); setTimeout(() => t.removeAttribute('data-arrive'), 500);
  };
  return a;
}

export function MailDialog() {
  const engine = useEngine();
  const { mail, lang } = useDoc();
  const { ui, upper } = useLang();
  const [flap, setFlap] = useState<string | null>(null);   /* the plate text while sending off; null = the title */
  const [flapKey, setFlapKey] = useState(0);
  const opener = useRef<Element | null>(null);   /* what had focus when the dialog opened: the fold returns there */
  const id = useId();
  const ref = useRef<HTMLDialogElement>(null);
  const [f, setF] = useState({ name: '', email: '', message: '', hp: '' });
  const [err, setErr] = useState<{ email?: string; message?: string }>({});
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => { setF(v => ({ ...v, [k]: e.target.value })); setErr(x => ({ ...x, [k]: undefined })); };

  useEffect(() => {
    const d = ref.current; if (!d) return;
    if (mail.open && !d.open) {
      if (mail.draft) setF(v => ({ ...v, message: mail.draft }));
      opener.current = document.activeElement;
      setFlap(null); setFlapKey(k => k + 1);   /* remount: the title returns at once, no flip back */
      d.showModal();
      const first = d.querySelector<HTMLElement>('input:not([tabindex="-1"]):placeholder-shown, textarea:placeholder-shown');
      first?.focus();
    } else if (!mail.open && d.open) d.close();
  }, [mail.open, mail.draft]);
  /* sent: clear the draft, flip the plate to SENT ✓, then fold into the terminal */
  useEffect(() => {
    const d = ref.current;
    if (mail.status !== 'sent' || !mail.open || !d) return;
    setF(v => ({ ...v, message: '' }));
    const to = ui.mailSentFlap.toLocaleUpperCase(lang), still = reduced(), T: number[] = [];
    let a: Animation | undefined;
    if (still) setFlap(to);
    else { setFlap(back(to)); setFlapKey(k => k + 1); T.push(window.setTimeout(() => setFlap(to), 40)); }
    T.push(window.setTimeout(() => { a = still ? void engine.closeMail() : genie(d, opener.current, () => engine.closeMail()); }, still ? 1200 : 1300));
    return () => { T.forEach(clearTimeout); a?.cancel(); d.removeAttribute('data-closing'); };
  }, [mail.status, mail.open, engine, lang, ui.mailSentFlap]);   /* not upper(): a new function every render would restart this */

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
        <div className="plate mail-plate">
          <h2 className="flap" id={id + '-t'} aria-label={flap ? ui.mailSentFlap : ui.mailTitle}><FlapCells key={flapKey} text={flap ?? upper(ui.mailTitle)} /></h2>
        </div>
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
