/**
 * The answering endpoint for the "ask me a question" field — a Cloudflare Worker.
 * Deploy once (see README.md), paste its URL into CONTENT.meta.ask.
 *
 *   POST { question: string, lang: 'en' | 'tr', history?: { q, a }[] }  →  text/plain, streamed
 *
 * Only the visitor's question travels here; the Anthropic key stays a Worker
 * secret.  Origin is checked against ALLOWED_ORIGINS, questions are capped at
 * 300 characters, and an optional rate-limit binding (LIMITER) throttles per IP.
 * The knowledge the model answers from is knowledge.txt, rendered from
 * content.ts and the files in ask/knowledge/ by `node ask/build-prompt.mjs`.
 *
 *   POST { question, lang, mode: 'debate', transcript? }  →  text/plain, streamed
 *
 * A hiring question: Defne and Tolga argue it in short rounds over the same
 * files and the bench rules (debate.mjs; the cast is characters.json).  Every
 * sentence passes the grounding check in verify.mjs before it leaves.  With a
 * `transcript` the visitor interrupted an earlier debate: one round on their
 * question, then the bench rules again.
 *
 *   POST /mail { name, email, message, lang, hp, t }  →  text/plain "ok"
 *
 * The mail dialog's endpoint: the visitor's message is delivered to MAIL_TO
 * through Resend with the visitor's address as Reply-To.  A filled honeypot
 * (`hp`) or a form sent within 3s of opening (`t`, ms the dialog was open —
 * elapsed, so the visitor's clock does not matter) is accepted and dropped;
 * MAIL_LIMITER throttles per IP.  The Resend key is a secret (RESEND_API_KEY).
 */
import KNOWLEDGE from './knowledge.txt';
import CONFIG from './characters.json';
import { parseKnowledge } from './verify.mjs';
import { runDebate } from './debate.mjs';

const FILES = parseKnowledge(KNOWLEDGE);

const RULES = `You are answering on behalf of Ali Emre Özcan, on his personal site, as him, in the first person.
Answer only from the files above. If the profile does not cover the question, say so briefly and point to the email address or a section of the site.
Keep answers under 120 words, plain sentences, no markdown headings or lists unless asked. Never invent employers, dates, projects or contact details.
Never share phone numbers or anything not in the profile.
When a section or project of the site answers the question, point to it with a token on its own, at most two per answer:
[[go:<section id>]] for a section, [[project:<slug>]] for a project, [[cmd:<terminal command>]] for a command — only ids, slugs and commands from the site map below.
End with up to two short follow-up questions the visitor might ask next, each on its own line starting with "?? ".`;

const cors = (origin, ok) => ({
  'access-control-allow-origin': ok ? origin : 'null',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'content-type',
  'vary': 'origin',
});

export default {
  async fetch(req, env) {
    const origin = req.headers.get('origin') || '';
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
    const ok = allowed.includes(origin);
    const h = cors(origin, ok);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });
    if (req.method !== 'POST') return new Response('POST only', { status: 405, headers: h });
    if (!ok) return new Response('origin not allowed', { status: 403, headers: h });
    if (new URL(req.url).pathname === '/mail') return mail(req, env, h);
    if (env.LIMITER) {
      const { success } = await env.LIMITER.limit({ key: req.headers.get('cf-connecting-ip') || 'anon' });
      if (!success) return new Response('too many questions — try again in a minute', { status: 429, headers: h });
    }
    let body;
    try { body = await req.json(); } catch { return new Response('bad request', { status: 400, headers: h }); }
    const question = String(body?.question || '').trim().slice(0, 300);
    const lang = body?.lang === 'tr' ? 'tr' : 'en';
    /* the thread so far, as alternating turns (clamped) */
    const history = (Array.isArray(body?.history) ? body.history : []).slice(-4).flatMap(t => (t && typeof t.q === 'string' && typeof t.a === 'string' && t.q.trim() && t.a.trim()) ? [{ role: 'user', content: t.q.trim().slice(0, 300) }, { role: 'assistant', content: t.a.trim().slice(0, 600) }] : []);
    if (!question) return new Response('empty question', { status: 400, headers: h });
    const text = { ...h, 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' };

    if (body?.mode === 'debate') {
      /* the debate streams utterance by utterance; the headers and the first speaker leave before the later model calls run */
      const transcript = String(body?.transcript || '').slice(0, 3000);
      const call = (system, user, max_tokens) => deltas(env, { model: env.MODEL || 'claude-haiku-4-5-20251001', max_tokens, stream: true, system, messages: [{ role: 'user', content: user }] });
      const { readable, writable } = new TransformStream();
      const w = writable.getWriter(), enc = new TextEncoder();
      (async () => {
        try { for await (const t of runDebate({ question, lang, transcript, interrupt: !!transcript, files: FILES, config: CONFIG, call })) await w.write(enc.encode(t)); }
        catch { /* the visitor left */ }
        finally { try { await w.close(); } catch { /* already closed */ } }
      })();
      return new Response(readable, { headers: text });
    }

    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: env.MODEL || 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        stream: true,
        system: `${KNOWLEDGE}\n\n${RULES}\n${lang === 'tr' ? 'Answer in Turkish.' : 'Answer in the language of the question (English by default).'}`,
        messages: [...history, { role: 'user', content: question }],
      }),
    });
    if (!upstream.ok || !upstream.body) return new Response('upstream error ' + upstream.status, { status: 502, headers: h });

    /* unwrap Anthropic's SSE into plain text as it arrives */
    const dec = new TextDecoder(), enc = new TextEncoder();
    let buf = '';
    const unwrap = new TransformStream({
      transform(chunk, ctrl) {
        buf += dec.decode(chunk, { stream: true });
        const lines = buf.split('\n'); buf = lines.pop();
        for (const l of lines) {
          if (!l.startsWith('data: ')) continue;
          try { const ev = JSON.parse(l.slice(6)); if (ev.type === 'content_block_delta' && ev.delta?.text) ctrl.enqueue(enc.encode(ev.delta.text)); } catch { /* keep-alive or partial */ }
        }
      },
    });
    return new Response(upstream.body.pipeThrough(unwrap), { headers: text });
  },
};

/* one streamed Messages call as an async iterable of text deltas (20s to first byte, then as it arrives) */
async function* deltas(env, payload) {
  const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), 20000);
  let res;
  try {
    res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', signal: ctl.signal,
      headers: { 'content-type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify(payload),
    });
  } finally { clearTimeout(timer); }
  if (!res.ok || !res.body) throw new Error('upstream ' + res.status);
  const dec = new TextDecoder(); let buf = '';
  for await (const chunk of res.body) {
    buf += dec.decode(chunk, { stream: true });
    const lines = buf.split('\n'); buf = lines.pop();
    for (const l of lines) {
      if (!l.startsWith('data: ')) continue;
      try { const ev = JSON.parse(l.slice(6)); if (ev.type === 'content_block_delta' && ev.delta?.text) yield ev.delta.text; } catch { /* keep-alive or partial */ }
    }
  }
}

/* one line, no header injection */
const line = (v, n) => String(v || '').replace(/[\r\n]+/g, ' ').trim().slice(0, n);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function mail(req, env, h) {
  const text = (body, status = 200) => new Response(body, { status, headers: { ...h, 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' } });
  let body;
  try { body = await req.json(); } catch { return text('bad request', 400); }
  /* bots: accept and drop, so they learn nothing */
  if (body?.hp || !(Number(body?.t) >= 3000)) return text('ok');
  const name = line(body?.name, 80) || 'anonymous';
  const email = line(body?.email, 200);
  const message = String(body?.message || '').trim().slice(0, 2000);
  const lang = body?.lang === 'tr' ? 'tr' : 'en';
  if (!EMAIL_RE.test(email)) return text('bad email', 400);
  if (message.length < 10) return text('message too short', 400);
  if (env.MAIL_LIMITER) {
    const { success } = await env.MAIL_LIMITER.limit({ key: req.headers.get('cf-connecting-ip') || 'anon' });
    if (!success) return text('too many messages — try again later', 429);
  }
  if (!env.RESEND_API_KEY || !env.MAIL_TO) return text('mail is not configured', 503);
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: 'Bearer ' + env.RESEND_API_KEY },
    body: JSON.stringify({
      from: env.MAIL_FROM || 'Site <onboarding@resend.dev>',
      to: [env.MAIL_TO],
      reply_to: email,
      subject: 'site: ' + name,
      text: `${message}\n\n— ${name} <${email}> · ${lang} · sent from the site`,
    }),
  });
  if (!res.ok) return text('upstream error ' + res.status, 502);
  return text('ok');
}
