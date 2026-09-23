import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Verifier, checkSentence, numbers, parseKnowledge, plainTranscript } from './verify.mjs';

const K = parseKnowledge(`# head
=== cv | CV (2026) | https://example.com/cv.pdf
Led a six-person team for 5 weeks. GPA 3.94/4.00. Mean miss 0.177 m; 100% within 0.5 m. Budget 1,000 EUR.
=== throwing | write-up | #projects/throwing
TD3 over PPO. Final policy 0.177 m, 100 % of targets within 0.5 m.
`);
const keys = ['hire', 'hire-caveats', 'unclear'];

test('parseKnowledge reads title, href and numbers', () => {
  assert.equal(K.cv.title, 'CV (2026)');
  assert.equal(K.throwing.href, '#projects/throwing');
  assert.ok(K.cv.numbers.has('1000'));
  assert.ok(K.throwing.numbers.has('100%'));
});

test('numbers normalise separators and percent', () => {
  assert.deepEqual(numbers('0,177 m and 1,000 and 100 % and 2026.'), ['0.177', '1000', '1.000', '100', '100%', '2026']);
});

test('a cited number that exists passes and the citation is expanded', () => {
  assert.equal(checkSentence('Six people, five weeks — 5 weeks [src:cv].', K), 'Six people, five weeks — 5 weeks [src:cv|CV (2026)|https://example.com/cv.pdf].');
});

test('a cited number missing from the file is flagged', () => {
  assert.match(checkSentence('He led twelve people for 8 weeks [src:cv].', K), /^\[! .* !\]$/);
});

test('a number without any citation is flagged', () => {
  assert.equal(checkSentence('The policy missed by 0.177 m.', K), '[! The policy missed by 0.177 m. !]');
});

test('an unknown citation is dropped, and the sentence then counts as uncited', () => {
  assert.equal(checkSentence('No numbers here [src:nope].', K), 'No numbers here.');
  assert.match(checkSentence('5 weeks [src:nope].', K), /^\[! 5 weeks\. !\]$/);
});

test('turkish decimals match the file', () => {
  assert.equal(checkSentence('Ortalama sapma 0,177 m [src:throwing].', K), 'Ortalama sapma 0,177 m [src:throwing|write-up|#projects/throwing].');
});

test('markers pass through; an unknown verdict key becomes unclear', () => {
  const v = new Verifier(K, keys);
  assert.equal(v.push('@@ defne\n'), '@@ defne\n');
  assert.equal(v.push('== maybe\n'), '== unclear\n');
  assert.equal(v.push('== hire-caveats\n'), '== hire-caveats\n');
  assert.equal(v.push('?? What about 2027?\n'), '?? What about 2027?\n');
});

test('sentences are buffered across chunk boundaries and flushed', () => {
  const v = new Verifier(K, keys);
  let out = v.push('The CV says "led" [src:');
  assert.equal(out, '');
  out += v.push('cv]. Six people, 5 weeks [src:cv]. That is coordina');
  assert.equal(out, 'The CV says "led" [src:cv|CV (2026)|https://example.com/cv.pdf]. Six people, 5 weeks [src:cv|CV (2026)|https://example.com/cv.pdf].');
  out += v.push('tion, not 8 years of management.');
  assert.equal(out.endsWith('management.'), false);   /* the last sentence waits for a boundary or flush */
  out += v.flush();
  assert.ok(out.endsWith(' That is coordination, not 8 years of management. !]'));
});

test('plainTranscript shortens citations and removes flags', () => {
  assert.equal(plainTranscript('[! He has 8 years [src:cv|CV|x]. !] Fair.'), 'He has 8 years [src:cv]. Fair.');
});
