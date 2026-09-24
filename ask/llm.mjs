/**
 * The Worker's one model client: DeepSeek's chat completions API.
 *
 *   for await (const t of stream(env, { system, messages, max_tokens, temperature })) …
 *   const text = await complete(env, { system, messages, max_tokens, temperature, json })
 *
 * Model `env.MODEL` (default deepseek-flash = DeepSeek-V4.1-Flash), key
 * `env.DEEPSEEK_API_KEY` (a Worker secret), host `env.LLM_BASE`.  Thinking
 * mode is on by default at DeepSeek; it is turned off here on every call so
 * text streams at once, calls stay quick and `temperature` takes effect (it is
 * ignored while thinking).  Only `content` is ever returned, never
 * `reasoning_content`.
 */
const MODEL = 'deepseek-flash', BASE = 'https://api.deepseek.com';

export class LLMError extends Error {
  constructor(status, detail = '') { super('upstream ' + status + (detail ? ' — ' + detail : '')); this.status = status; }
}

export function request(env, { system, messages = [], max_tokens, temperature, json = false, stream = false }) {
  if (!env.DEEPSEEK_API_KEY) throw new LLMError(0, 'no DEEPSEEK_API_KEY');
  return {
    url: (env.LLM_BASE || BASE).replace(/\/$/, '') + '/chat/completions',
    init: {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer ' + env.DEEPSEEK_API_KEY },
      body: JSON.stringify({
        model: env.MODEL || MODEL,
        messages: [...(system ? [{ role: 'system', content: system }] : []), ...messages],
        thinking: { type: 'disabled' },
        ...(max_tokens ? { max_tokens } : {}),
        ...(temperature !== undefined ? { temperature } : {}),
        ...(json ? { response_format: { type: 'json_object' } } : {}),
        ...(stream ? { stream: true } : {}),
      }),
    },
  };
}

const why = status => (status === 402 ? 'DeepSeek balance' : status === 429 ? 'rate limited' : status === 401 ? 'bad key' : '');

/* streamed: yields the text deltas; 20s to the first byte */
export async function* stream(env, opts) {
  const { url, init } = request(env, { ...opts, stream: true });
  const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 20000);
  let res;
  try { res = await fetch(url, { ...init, signal: ctl.signal }); } finally { clearTimeout(timer); }
  if (!res.ok || !res.body) throw new LLMError(res.status, why(res.status));
  const dec = new TextDecoder(); let buf = '';
  for await (const chunk of res.body) {
    buf += dec.decode(chunk, { stream: true });
    const lines = buf.split('\n'); buf = lines.pop();
    for (const raw of lines) {
      const l = raw.trim();
      if (!l.startsWith('data:')) continue;              /* `: keep-alive` comments and blank lines */
      const data = l.slice(5).trim();
      if (data === '[DONE]') return;
      try { const t = JSON.parse(data).choices?.[0]?.delta?.content; if (t) yield t; } catch { /* partial line */ }
    }
  }
}

/* one answer: { text, finish } (finish 'content_filter' means the provider declined) */
export async function complete(env, opts) {
  const { url, init } = request(env, opts);
  const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 20000);
  let res;
  try { res = await fetch(url, { ...init, signal: ctl.signal }); } finally { clearTimeout(timer); }
  if (!res.ok) throw new LLMError(res.status, why(res.status));
  const j = await res.json();
  return { text: j.choices?.[0]?.message?.content ?? '', finish: j.choices?.[0]?.finish_reason ?? '' };
}
