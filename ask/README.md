# The ask endpoint

The "ask me a question" field in the site's top bar posts the visitor's question
to a small Cloudflare Worker, which asks Claude with the site's content as the
profile and streams the answer back. Nothing else leaves the visitor's browser,
nothing is sent on page load, and the field is not rendered at all until
`CONTENT.meta.ask` holds the Worker's URL.

## Deploy once

```sh
npm i -g wrangler
wrangler login                        # opens the browser; a free account is enough
npm run ask:prompt                    # renders content.ts + ask/knowledge/*.md -> ask/knowledge.txt
cd ask
wrangler secret put ANTHROPIC_API_KEY # paste the key from console.anthropic.com
wrangler deploy                       # prints https://aliemre-ask.<account>.workers.dev
```

The request carries the visitor's question, the interface language and the last
four turns of the thread as context; the reply is plain streamed text in which the
model may place `[[go:<section>]]`, `[[project:<slug>]]` or `[[cmd:<command>]]`
tokens (the site renders them as chips that open that part of the page) and end
with up to two `?? follow-up question` lines (rendered as follow-up chips). The
valid ids come from the site map at the top of `knowledge.txt`.

Then in `src/content/content.ts` set `meta.ask` to that URL, bump `meta.updated`,
and run `npm run check`. The field appears on the next deploy of the site.

## After a content change

`npm run ask:prompt` and `wrangler deploy` again (from `ask/`). `npm run
preflight` reminds you when `knowledge.txt` is older than `content.ts` or than a
file in `ask/knowledge/`.

## Knowledge files

The model answers — and the debate's characters argue — only from
`ask/knowledge.txt`, which `npm run ask:prompt` renders from two sources:

- `ask/knowledge/profile.md` — **generated** from the English side of
  `src/content/content.ts` on every run. Do not edit it.
- every other `ask/knowledge/*.md` you add: your CV, a project write-up, notes
  on a repository's code. Plain Markdown with a front-matter block:

  ```md
  ---
  id: cv                     # lowercase ASCII; the citation key the characters use ([src:cv])
  title: CV (Sept 2026)      # the label on the citation chip
  href: https://github.com/aliemreo/cv/blob/main/cv.pdf   # optional: where a reader can check it
  ---
  Machine learning engineer (part-time), TAZI, Istanbul — Sep 2026–present
  ...
  ```

  `href` may be a URL (the chip then opens the site's preview card; run
  `npm run previews` once so it has a screenshot) or a place on the page:
  `#experience`, `#projects/throwing`, `#projects/ml`. Without it the chip is a
  plain label.

The renderer **refuses** a `Placeholder:` line and anything shaped like a phone
number (nine digits or more), and names the file and line: the CV's phone number
never leaves the laptop. Everything in `knowledge.txt` is sent to the model, so
put nothing there you would not publish. The repo is public; `knowledge.txt` is
committed because the Worker imports it — keep private files out of
`ask/knowledge/` or list them in `.gitignore` and render locally before
deploying.

## The debate ("would you hire me?")

A hiring question in the field is argued by two characters over the same files,
and a bench rules. Everything about them is in **`ask/characters.json`**; the
UI code knows no names.

| key | what it is |
|---|---|
| `cast.<id>` | `name`, `role`, `motif` (one of the site's kilim motifs: `goz elibelinde kocboynuzu yildiz pitrak suyolu`), bilingual `bio` — shown on the character card a click on the speaker's label opens, and in the convening row at the top of the first debate |
| `order` | who opens and who answers (`["defne", "tolga"]`) |
| `rounds` | 1–3 exchanges before the bench rules (2) |
| `maxWords` | per utterance (80) |
| `triggers.en` / `.tr` | words that route a question to the debate; a character's first name always does |
| `verdicts` | key → the board label in both languages; the bench must pick one key |
| `fallback` | what the bench says when a model call fails (verdict `unclear`) |
| `prompts.shared` | the rules every character gets (`{maxWords}` is filled in) |
| `prompts.<id>.voice` | who they are and how they talk |
| `prompts.defne.open/press/interrupt`, `prompts.tolga.answer/close/interrupt`, `prompts.bench.rule/rerule` | the instruction for each step |

Renaming a character: also change the starter chip and `meta.debateStarter` in `src/content/content.ts`, which name them.

Steps run in this order: `defne.open → tolga.answer → (defne.press → tolga.answer)… → defne.press → tolga.close → bench.rule`. When the visitor interrupts (Enter while it streams, or a bench follow-up chip): `defne.interrupt → tolga.interrupt → bench.rerule` with the transcript so far.

Every sentence passes `verify.mjs` before it leaves the Worker: a citation to an
unknown file is dropped, every number in a cited sentence must occur in that
file, and a sentence stating a number without a citation is wrapped in `[! … !]`,
which the site shows muted with an `unverified` tag. That is what can be checked
deterministically; the wording is the model's, so if a character keeps
inventing, tighten `prompts.shared` or the voice. `npm run ask:test` runs the
unit tests for the verifier and the orchestration; the terminal's
`debate <question>` forces a debate for a quick look.

## Knobs (`wrangler.toml`)

- `MODEL` — `claude-haiku-4-5-20251001` by default: fast, and roughly a tenth
  of a cent per answer at 500 output tokens.
- `ALLOWED_ORIGINS` — the site's origin(s); anything else gets 403.
- `[[ratelimits]]` — 5 questions a minute per IP. Remove the block if the
  binding is unavailable on your plan; the Worker then skips the check.
- Questions are cut at 300 characters; answers at 600 tokens (a debate: 170 per utterance, 220 for the bench).

## Turn it off

Set `meta.ask` back to a `Placeholder:` string (or delete the Worker). The field
disappears from the site; the terminal's `ask` command then says so and points
to `search`.

## Mail

The same Worker answers `POST /mail` for the site's mail dialog: it delivers
the visitor's message to your inbox through [Resend](https://resend.com) with
the visitor's address as Reply-To.

```sh
# 1. sign up at resend.com (free tier), create an API key
cd ask
wrangler secret put RESEND_API_KEY   # paste the key
wrangler secret put MAIL_TO          # the address the Resend account was created with
wrangler deploy
```

Then set `meta.mail` in `src/content/content.ts` to
`https://aliemre-ask.<account>.workers.dev/mail`, bump `meta.updated`, run
`npm run check`.

- **No domain needed yet.** Without a verified domain Resend sends only from
  `onboarding@resend.dev` and only to the account's own address, which is
  exactly this case. That is why `MAIL_TO` must be that address. It is a secret, not a var, so
  your inbox address stays out of this public repo.
- **When a domain arrives:** add it in Resend, put the SPF and DKIM records it
  shows at the registrar, and set `MAIL_FROM` to e.g. `Site <site@yourdomain>`.
  Mail from a verified domain is far less likely to land in spam.
- **Spam:** a filled honeypot field or a form sent less than 3s after opening
  is answered `ok` and dropped; `MAIL_LIMITER` allows 3 messages a minute per
  IP; the origin check is shared with ask. Messages are plain text, 10–2000
  characters, name ≤ 80, and CR/LF are stripped from name and address.
- **Turn it off:** set `meta.mail` back to a `Placeholder:` string; the dialog's
  entry points copy the address instead. Or `wrangler secret delete MAIL_TO`
  (the route then answers 503).
- **Test locally:** `wrangler dev`, then open the dev server with
  `?mail=http://localhost:8787/mail`.

## Test locally

`wrangler dev` (in `ask/`) serves it on `http://localhost:8787`; open the dev
server with `http://localhost:5173/?ask=http://localhost:8787` to point the
field at it. The `?ask=<url>` override works on any build and is meant for
exactly this.
