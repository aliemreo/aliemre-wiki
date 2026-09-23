import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runDebate, steps } from './debate.mjs';
import { parseKnowledge } from './verify.mjs';

const config = JSON.parse(readFileSync(new URL('./characters.json', import.meta.url), 'utf8'));
const files = parseKnowledge('=== cv | CV | https://x/cv\nLed a six-person team for 5 weeks.\n=== throwing | write-up | #projects/throwing\n0.177 m mean miss.\n');
const collect = async gen => { let out = ''; for await (const t of gen) out += t; return out; };
async function* scripted(system, user) { yield /bench/.test(user) ? '== hire-caveats\nMeasured 0.177 m [src:throwing]. ' : 'Six people, 5 weeks [src:cv]. '; yield 'No production system.\n?? Next?'; }

test('steps: two rounds then the bench; an interruption is one round and a re-ruling', () => {
  assert.deepEqual(steps(config, false).map(s => s.join('.')), ['defne.open', 'tolga.answer', 'defne.press', 'tolga.close', 'bench.rule']);
  assert.deepEqual(steps(config, true).map(s => s.join('.')), ['defne.interrupt', 'tolga.interrupt', 'bench.rerule']);
});

test('runDebate streams the line protocol with expanded citations and a verdict', async () => {
  const out = await collect(runDebate({ question: 'hire him?', files, config, call: scripted }));
  const speakers = [...out.matchAll(/^@@ (\w+)$/gm)].map(m => m[1]);
  assert.deepEqual(speakers, ['defne', 'tolga', 'defne', 'tolga', 'bench']);
  assert.match(out, /\[src:cv\|CV\|https:\/\/x\/cv\]/);
  assert.match(out, /^== hire-caveats$/m);
  assert.match(out, /^\?\? Next\?$/m);
  assert.doesNotMatch(out, /\[src:cv\]/);   /* every citation was expanded */
});

test('the system prompt carries the voice, the files and the word limit; the user turn carries the transcript', async () => {
  const seen = [];
  async function* spy(system, user) { seen.push({ system, user }); yield 'Fine.\n'; }
  await collect(runDebate({ question: 'q', files, config, call: spy }));
  assert.match(seen[0].system, /Defne Karaca/); assert.match(seen[0].system, /=== cv \| CV/); assert.match(seen[0].system, /80 words/);
  assert.match(seen[1].user, /Transcript so far:\nDefne Karaca: Fine\./);
  assert.match(seen[4].system, /You are the bench/);
});

test('a failing model call ends with the bench ruling unclear and the fixed fallback', async () => {
  let n = 0;
  async function* flaky() { if (++n === 2) throw new Error('boom'); yield 'Said.\n'; }
  const out = await collect(runDebate({ question: 'q', lang: 'tr', files, config, call: flaky }));
  assert.match(out, /@@ defne\nSaid\.\n@@ tolga\n@@ bench\n== unclear\nKurul toplanamadı/);
  assert.doesNotMatch(out, /@@ bench[\s\S]*@@ defne/);   /* nothing after the ruling */
});
