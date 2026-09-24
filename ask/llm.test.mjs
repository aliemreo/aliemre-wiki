import { test } from 'node:test';
import assert from 'node:assert/strict';
import { complete, request, stream } from './llm.mjs';

const env = { DEEPSEEK_API_KEY: 'sk-test' };
/* a streamed body cut into arbitrary chunks, as the network delivers it */
const sse = (text, cut = 7) => new ReadableStream({ start(c) { const b = new TextEncoder().encode(text); for (let i = 0; i < b.length; i += cut) c.enqueue(b.slice(i, i + cut)); c.close(); } });
const chunk = delta => 'data: ' + JSON.stringify({ choices: [{ index: 0, delta }] }) + '\n\n';

test('request: bearer key, system first, thinking off, only the options given', () => {
  const { url, init } = request(env, { system: 'S', messages: [{ role: 'user', content: 'q' }], max_tokens: 50, temperature: 0.7, stream: true });
  assert.equal(url, 'https://api.deepseek.com/chat/completions');
  assert.equal(init.headers.authorization, 'Bearer sk-test');
  const b = JSON.parse(init.body);
  assert.deepEqual(b.messages, [{ role: 'system', content: 'S' }, { role: 'user', content: 'q' }]);
  assert.equal(b.model, 'deepseek-flash');
  assert.deepEqual(b.thinking, { type: 'disabled' });
  assert.equal(b.temperature, 0.7);
  assert.equal(b.stream, true);
  assert.equal(b.response_format, undefined);
  assert.equal(JSON.parse(request({ ...env, MODEL: 'deepseek-v4-pro' }, { messages: [] }).init.body).model, 'deepseek-v4-pro');
  assert.throws(() => request({}, { messages: [] }), /no DEEPSEEK_API_KEY/);
});

test('stream: content deltas only, keep-alives and reasoning skipped, stops at [DONE]', async () => {
  const body = ': keep-alive\n\n' + chunk({ role: 'assistant', content: '' }) + chunk({ reasoning_content: 'hmm' }) + chunk({ content: 'Hel' }) + chunk({ content: 'lo, İTÜ' }) + 'data: [DONE]\n\n' + chunk({ content: 'after' });
  globalThis.fetch = async () => new Response(sse(body));
  let out = ''; for await (const t of stream(env, { messages: [] })) out += t;
  assert.equal(out, 'Hello, İTÜ');
});

test('stream: a failed call throws with the status, 402 named', async () => {
  globalThis.fetch = async () => new Response('no', { status: 402 });
  await assert.rejects(async () => { for await (const _ of stream(env, { messages: [] })); }, e => e.status === 402 && /DeepSeek balance/.test(e.message));
});

test('complete: text and finish reason, json mode on request', async () => {
  let sent;
  globalThis.fetch = async (_u, init) => { sent = JSON.parse(init.body); return Response.json({ choices: [{ message: { content: '{"a":1}' }, finish_reason: 'stop' }] }); };
  assert.deepEqual(await complete(env, { messages: [], json: true, temperature: 0 }), { text: '{"a":1}', finish: 'stop' });
  assert.deepEqual(sent.response_format, { type: 'json_object' });
  assert.equal(sent.temperature, 0);
});
