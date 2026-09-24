import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addEntry, guestbookAdmin, parseDecision, prefilter, removeEntry, serialise, sign, signGuestbook, verify } from './guestbook.mjs';

/* ---- pure helpers ----------------------------------------------------------- */
test('prefilter holds links, addresses and phone numbers, not ordinary notes', () => {
  assert.equal(prefilter('see https://spam.example'), 'contains a link');
  assert.equal(prefilter('visit cheap-pills.com today'), 'contains a link');
  assert.equal(prefilter('write me at a@b.co'), 'contains an email address');
  assert.equal(prefilter('call +90 532 123 45 67'), 'looks like a phone number');
  assert.equal(prefilter('Great site! Loved the terminal, see you at İTÜ in 2026.'), null);
});

test('parseDecision is strict', () => {
  assert.deepEqual(parseDecision('{"decision":"approve","reason":"friendly"}'), { decision: 'approve', reason: 'friendly' });
  assert.equal(parseDecision('{"decision":"yes","reason":"x"}'), null);
  assert.equal(parseDecision('{"decision":"approve"}'), null);
  assert.equal(parseDecision('approve'), null);
  assert.equal(parseDecision('[{"decision":"approve","reason":"x"}]'), null);
});

test('signed links verify, and reject tampering and expiry', async () => {
  const { d, s } = await sign('k', { a: 'publish', e: { id: 'x1', name: 'Ayşe', message: 'merhaba' } }, 1000);
  assert.equal((await verify('k', d, s, 2000)).e.name, 'Ayşe');
  assert.equal(await verify('other', d, s, 2000), null);
  assert.equal(await verify('k', d.slice(0, -2) + 'AA', s, 2000), null);
  assert.equal(await verify('k', d, s, 1000 + 31 * 864e5), null);
  assert.equal(await verify('', d, s, 2000), null);
});

test('entries file: prepend, dedupe, remove, one entry per line', () => {
  const a = { id: 'a', name: 'A', date: '2026-09-23', lang: 'en', message: 'hi' }, b = { ...a, id: 'b' };
  assert.deepEqual(addEntry([a], b).map(x => x.id), ['b', 'a']);
  assert.deepEqual(addEntry([a], a), [a]);
  assert.deepEqual(removeEntry([b, a], 'b'), [a]);
  assert.equal(serialise([]), '[\n]\n');
  assert.equal(serialise([b, a]).split('\n').length, 5);
  assert.deepEqual(JSON.parse(serialise([b, a])), [b, a]);
});

/* ---- handlers, with fetch stubbed for DeepSeek, Resend and GitHub ----------- */
function stub({ decision = 'approve', reason = 'a friendly note', model } = {}) {
  let file = '[\n]\n', sha = 's0';
  const calls = { model: 0, bodies: [], mails: [], puts: [] };
  globalThis.fetch = async (url, init = {}) => {
    url = String(url);
    if (url === 'https://api.deepseek.com/chat/completions') {
      calls.model++; calls.bodies.push(JSON.parse(init.body));
      if (model) return model();
      return Response.json({ choices: [{ message: { role: 'assistant', content: JSON.stringify({ decision, reason }) }, finish_reason: 'stop' }] });
    }
    if (url.startsWith('https://api.resend.com')) { calls.mails.push(JSON.parse(init.body)); return Response.json({ id: 'm' }); }
    if (url.startsWith('https://api.github.com')) {
      if ((init.method || 'GET') === 'GET') return Response.json({ sha, content: Buffer.from(file).toString('base64').replace(/(.{60})/g, '$1\n') });
      const b = JSON.parse(init.body); calls.puts.push(b);
      file = Buffer.from(b.content, 'base64').toString(); sha = 's' + calls.puts.length;
      return Response.json({ content: { sha } });
    }
    throw new Error('unexpected fetch ' + url);
  };
  return { calls, file: () => JSON.parse(file) };
}
const env = { DEEPSEEK_API_KEY: 'k', GITHUB_TOKEN: 'g', GITHUB_REPO: 'o/r', GUESTBOOK_SECRET: 'sec', RESEND_API_KEY: 'r', MAIL_TO: 'me@x.com', MAIL_FROM: 'Site <s@x.com>' };
const post = body => new Request('https://w.dev/guestbook', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
const sign1 = (s, body, e = env) => signGuestbook(post({ name: 'Ayşe', message: 'Loved the split-flap headings!', lang: 'tr', hp: '', t: 9000, ...body }), e, {}).then(r => r.json());
const linkIn = mail => new URL(mail.text.match(/https:\/\/\S+/)[0]);

test('approved: committed, emailed with a Remove link', async () => {
  const s = stub();
  assert.deepEqual(await sign1(s), { status: 'approved' });
  assert.equal(s.calls.puts.length, 1);
  assert.match(s.calls.puts[0].message, /^content: guestbook entry from Ayşe$/);
  assert.equal(s.file()[0].message, 'Loved the split-flap headings!');
  assert.equal(s.file()[0].lang, 'tr');
  const m = s.calls.mails[0];
  assert.match(m.subject, /^guestbook: approved — Ayşe$/);
  assert.match(m.text, /Remove it: https:\/\/w\.dev\/guestbook\/admin\?d=/);
  assert.match(m.text, /a friendly note \(DeepSeek\)/);
});

test('held by the model: no commit, emailed with a Publish link', async () => {
  const s = stub({ decision: 'hold', reason: 'self-promotion' });
  assert.deepEqual(await sign1(s), { status: 'held' });
  assert.equal(s.calls.puts.length, 0);
  assert.match(s.calls.mails[0].subject, /^guestbook: held — Ayşe$/);
  assert.match(s.calls.mails[0].text, /Publish it anyway: https:/);
});

const reply = (content, finish_reason = 'stop') => () => Response.json({ choices: [{ message: { content }, finish_reason }] });
test('junk, empty content, a content filter or an API error: held', async () => {
  for (const model of [
    reply('sure, approve'),
    reply(''),
    reply('{"decision":"approve","reason":"x"}', 'content_filter'),
    () => new Response('unavailable', { status: 503 }),
  ]) {
    const s = stub({ model });
    assert.deepEqual(await sign1(s), { status: 'held' });
    assert.equal(s.calls.puts.length, 0);
  }
});

test('a link is held by the filter, without a model call', async () => {
  const s = stub();
  assert.deepEqual(await sign1(s, { message: 'check out https://spam.example' }), { status: 'held' });
  assert.equal(s.calls.model, 0);
  assert.match(s.calls.mails[0].text, /contains a link \(filter\)/);
});

test('no API key: held and emailed, not published', async () => {
  const s = stub();
  assert.deepEqual(await sign1(s, {}, { ...env, DEEPSEEK_API_KEY: '' }), { status: 'held' });
  assert.equal(s.calls.model, 0);
  assert.equal(s.calls.puts.length, 0);
  assert.equal(s.calls.mails.length, 1);
});

test('honeypot or a too-fast form: nothing happens', async () => {
  for (const body of [{ hp: 'x' }, { t: 500 }]) {
    const s = stub();
    assert.deepEqual(await sign1(s, body), { status: 'held' });
    assert.equal(s.calls.model + s.calls.mails.length + s.calls.puts.length, 0);
  }
});

test('rate limit: 429 after the limiter says no', async () => {
  stub();
  let n = 0; const limited = { ...env, GUEST_LIMITER: { limit: async () => ({ success: ++n <= 3 }) } };
  for (let i = 0; i < 3; i++) await sign1(null, {}, limited);
  const r = await signGuestbook(post({ name: 'x', message: 'hello there', hp: '', t: 9000 }), limited, {});
  assert.equal(r.status, 429);
});

test('admin: GET only confirms, POST publishes; tampered or expired links are refused', async () => {
  const s = stub({ decision: 'hold', reason: 'unsure' });
  await sign1(s);
  const u = linkIn(s.calls.mails[0]);
  const get = await guestbookAdmin(new Request(u), env);
  assert.equal(get.status, 200);
  assert.match(await get.text(), /<form method="post">[\s\S]*Publish this entry/);
  assert.equal(s.calls.puts.length, 0, 'GET must not publish (mail scanners follow links)');
  const form = new URLSearchParams({ d: u.searchParams.get('d'), s: u.searchParams.get('s') });
  const done = await guestbookAdmin(new Request(u.origin + u.pathname, { method: 'POST', body: form }), env);
  assert.equal(done.status, 200);
  assert.match(await done.text(), /Published/);
  assert.equal(s.file().length, 1);
  const bad = new URLSearchParams({ d: u.searchParams.get('d'), s: 'x' + u.searchParams.get('s').slice(1) });
  assert.equal((await guestbookAdmin(new Request(u.origin + u.pathname, { method: 'POST', body: bad }), env)).status, 403);
  assert.equal(s.calls.puts.length, 1);
});

test('admin: Remove from an approved entry takes it off again', async () => {
  const s = stub();
  await sign1(s);
  assert.equal(s.file().length, 1);
  const u = linkIn(s.calls.mails[0]);
  const form = new URLSearchParams({ d: u.searchParams.get('d'), s: u.searchParams.get('s') });
  const r = await guestbookAdmin(new Request(u.origin + u.pathname, { method: 'POST', body: form }), env);
  assert.match(await r.text(), /Removed/);
  assert.deepEqual(s.file(), []);
  assert.match(s.calls.puts[1].message, /^content: remove guestbook entry /);
});

test('the entry is shown escaped on the admin page', async () => {
  const s = stub({ decision: 'hold', reason: 'x' });
  await sign1(s, { name: '<b>x</b>', message: '<script>alert(1)</script> hi' });
  const html = await (await guestbookAdmin(new Request(linkIn(s.calls.mails[0])), env)).text();
  assert.ok(!html.includes('<script>alert'));
  assert.ok(html.includes('&lt;script&gt;'));
});

test('moderation request: deepseek-flash, thinking off, temperature 0, json mode with the word json', async () => {
  const s = stub();
  await sign1(s);
  const b = s.calls.bodies[0];
  assert.equal(b.model, 'deepseek-flash');
  assert.deepEqual(b.thinking, { type: 'disabled' });
  assert.equal(b.temperature, 0);
  assert.deepEqual(b.response_format, { type: 'json_object' });
  assert.match(b.messages[0].content, /json/);
  assert.equal(b.messages[0].role, 'system');
  assert.match(b.messages[1].content, /^<entry>\nname: Ayşe/);
});

test('an empty DeepSeek balance is named in the email', async () => {
  const s = stub({ model: () => new Response('Insufficient Balance', { status: 402 }) });
  assert.deepEqual(await sign1(s), { status: 'held' });
  assert.match(s.calls.mails[0].text, /402 — DeepSeek balance/);
});
