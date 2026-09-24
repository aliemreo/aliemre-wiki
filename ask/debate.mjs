/**
 * The debate: Defne (skeptic) and Tolga (advocate) argue a hiring question in
 * short rounds, then the bench rules.  Runs on the Worker; the cast, voices,
 * rounds, triggers and verdict labels live in characters.json.
 *
 *   for await (const text of runDebate({ question, lang, transcript, interrupt, files, config, call }))
 *
 * yields plain text in the site's line protocol:
 *   @@ <who>            an utterance begins
 *   == <verdict-key>    the bench's ruling (first line of its utterance)
 *   [! … !]             a sentence the verifier could not ground
 *   [src:id|title|href] a citation the verifier expanded
 *   ?? <question>       a follow-up the visitor could ask next
 *
 * `call(system, user, maxTokens)` is an async iterable of text deltas (the
 * Worker wires it to DeepSeek through llm.mjs); `files` is parseKnowledge(knowledge.txt).
 * One utterance = one model call over the transcript so far; each sentence is
 * checked by the Verifier before it leaves.  If a call fails, the bench rules
 * `unclear` with the fixed fallback text, so the visitor always gets an ending.
 */
import { Verifier, plainTranscript } from './verify.mjs';

const nameOf = (c, lang) => (typeof c.name === 'string' ? c.name : c.name[lang] || c.name.en);

/* the order of speakers and their instruction for this debate */
export function steps(config, interrupt) {
  const [a, b] = config.order;
  if (interrupt) return [[a, 'interrupt'], [b, 'interrupt'], ['bench', 'rerule']];
  const rounds = Math.min(3, Math.max(1, config.rounds | 0 || 2));
  const out = [];
  for (let r = 0; r < rounds; r++) out.push([a, r === 0 ? 'open' : 'press'], [b, r === rounds - 1 ? 'close' : 'answer']);
  out.push(['bench', 'rule']);
  return out;
}

export async function* runDebate({ question, lang = 'en', transcript = '', interrupt = false, files, config, call }) {
  const P = config.prompts, keys = Object.keys(config.verdicts);
  const knowledge = Object.entries(files).map(([id, f]) => `=== ${id} | ${f.title}\n${f.text.trim()}`).join('\n\n');
  const shared = P.shared.replace('{maxWords}', String(config.maxWords || 80)) + (lang === 'tr' ? '\nSpeak in Turkish.' : '\nSpeak in the language of the visitor\'s question (English by default).');
  let said = plainTranscript(transcript);   /* what the model sees of the earlier turns */
  for (const [who, step] of steps(config, interrupt)) {
    const c = config.cast[who], voice = P[who].voice, instruction = P[who][step];
    const others = Object.entries(config.cast).filter(([k]) => k !== who).map(([, o]) => `${nameOf(o, 'en')} (${o.role.en})`).join(', ');
    const system = `${shared}\n\n${voice}\nThe others in the room: ${others}.\n\n# The files\n\n${knowledge}`;
    const user = `The visitor asked: ${question}\n\n${said ? `Transcript so far:\n${said}\n\n` : ''}Your turn, ${nameOf(c, 'en')}. ${instruction}`;
    yield `@@ ${who}\n`;
    const v = new Verifier(files, keys);
    let spoken = '';
    try {
      for await (const delta of call(system, user, who === 'bench' ? 220 : 170)) { const out = v.push(delta); if (out) { spoken += out; yield out; } }
      const rest = v.flush(); if (rest) { spoken += rest; yield rest; }
      if (!spoken.endsWith('\n')) { spoken += '\n'; yield '\n'; }
    } catch {
      /* the model call failed: the bench rules unclear and the debate ends */
      const fb = `${who === 'bench' ? '' : '@@ bench\n'}== unclear\n${config.fallback[lang] || config.fallback.en}\n`;
      yield fb; return;
    }
    said += `${nameOf(c, 'en')}: ${plainTranscript(spoken).replace(/^== .*\n?/m, '').trim()}\n\n`;
  }
}
