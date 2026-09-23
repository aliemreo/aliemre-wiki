# aliemre-wiki

Personal site for Ali Emre Özcan. React + TypeScript, built with Vite, prerendered
to static HTML at build time, served by GitHub Pages. The design contract lives in
[`CLAUDE.md`](CLAUDE.md); this file is the day-to-day operating manual.

```
/
  .github/workflows/
    deploy.yml           main -> preflight, typecheck, build, verify -> GitHub Pages
    preflight.yml        the same checks on every pull request
  scripts/
    preflight.mjs        content rules (translations, meta.updated)
    prerender.mjs        writes the static HTML into dist/index.html
    verify-dist.mjs      prerender present, size budget, static files
  index.html             <head> metadata + the no-flash boot script
  public/                copied as-is: 404.html favicon.svg og.png robots.txt
  src/
    content/content.ts   <- ALL COPY LIVES HERE
    content/ui.ts        labels and terminal messages (en/tr)
    content/tools.ts     terminal utilities
    content/sections.ts  section order, motifs, plate labels
    store/engine.ts      every behaviour: commands, routing, filters, logging
    terminal/            the command bar
    components/          sections, plates, split-flap cells, footer, shadcn/ui
    styles/globals.css   tokens, Tailwind theme, the bespoke CSS
  docs/reference/        the design prototype this was rebuilt from (never served)
```

## Running it locally

```
npm install
npm run dev          # http://localhost:5173, hot reload, not prerendered
npm run check        # preflight + typecheck + build + verify — what CI runs
npm run preview      # serve the built, prerendered dist/
```

Node 24 or newer (22.18 at minimum): the scripts import TypeScript files directly.

On the dev server two checks print to the console and nowhere else:

- every string in `CONTENT` that still starts with `Placeholder:`
- every English `CONTENT` string with no Turkish sibling

## Updating the content

**All copy lives in `src/content/content.ts`.** Every user-visible string is either
a plain string or an `{ en, tr }` pair. Never edit a component to change words.

### Monthly checklist

1. `CONTENT.now.text` (en + tr) and `CONTENT.now.date`
2. new `reading` entries at the **top** of the array (newest first)
3. `CONTENT.meta.updated` — the deploy fails if content changed and this did not
4. `npm run check`
5. `npm run dev`, open once with `?lang=tr` and once with `?lang=en`

### Adding things

| what | how |
|---|---|
| a job or a school | append to `CONTENT.experience` or `CONTENT.education` (same row shape; newest first) |
| a project | append an object to `CONTENT.projects`. `slug` must be lowercase ASCII — it doubles as the `project <slug>` command and the `#projects/<slug>` URL |
| a reading entry | prepend to `CONTENT.reading` |
| a post | append to `CONTENT.writing` |
| a guestbook entry | copy an approved issue from `CONTENT.guestbook.repo` into `CONTENT.guestbook.entries` |
| a linkable term (a company, a school, a reference) | one row in `src/content/links.ts` (`label`, `href`, `blurb` in both languages), then write `[[key]]` or `[[key|shown text]]` in the copy and run `npm run previews` to capture its card image into `public/previews/` (commit the WebP) |
| a tag | append to `TAGS`. Filters, chips, pipes and the types pick it up |
| a terminal tool | append a `{ names, usage, desc, example, run }` object to `src/content/tools.ts`. It becomes a command, a row in the Tools section and a row in the `tools` pipe source |
| a command | one row in `src/terminal/commands.ts` |
| a palette | one `[data-palette="x"]` block and one `html[data-theme="light"][data-palette="x"]` block in `globals.css`, one entry in `PALETTES`. The footer dot colours itself from the CSS |
| a UI primitive | `npx shadcn@latest add <name>`, then change its import to `@/lib/utils`, remove ring/shadow classes, and check the size budget with `npm run check` |
| a section | **ask first.** One row in `SECTION_DEFS`, one component in `components/sections/`, one entry in `sections/index.tsx`, a label in `ui.ts` (both languages), a command |

**Placeholders are hidden on the live site.** A string starting with `Placeholder:`
shows on the dev server in muted italics and renders as nothing in the production
build; an empty section says "Nothing here yet." A project with no write-up is not
expandable, and links still pointing at `#` are not rendered. `npm run verify`
fails if a placeholder reaches the built HTML. An open write-up sits on a card
that tilts gently under the mouse, with its kicker, callout and back link
floating above it; on touch screens and under reduced motion it is a plain panel.

Keep both languages in sync. `ui.ts` types Turkish against English, so a missing
label is a type error; `preflight.mjs` does the same for `CONTENT`. A
`Placeholder:` Turkish string is acceptable temporarily; a missing one is not.

## Getting around

- The **top bar** holds the name, a search field (see "Ask me a question"), the
  `⌘K` palette and the terminal button, and sticks to the top once you scroll.
  Without JavaScript it shows the section links instead.
- On phones the terminal starts folded to its prompt and chips; it opens when you
  tap the prompt or run a command and folds again as you scroll. The `▴`/`▾`
  button at the end of the prompt row toggles it.
- On screens 1380px and wider a **section rail** sits left of the document: the
  branched menu from React Bits, four branches (Me, Work, Shell, Say hi). They
  start folded and unfold as you scroll into them; the active entry follows your
  reading position. Click a branch title to open or close it early, an entry to
  jump to it. The grouping lives in `src/content/sections.ts` (`group`), the branch
  labels in `src/content/ui.ts`.
- The **terminal** on the right: type a section name, or `help`.

## How the page works

- **Prerendered.** `npm run build` renders the React tree to HTML and writes it into
  `dist/index.html`. A reader with JavaScript off gets the full document; React
  hydrates it and adds the terminal. Anything that depends on `window`,
  `localStorage` or randomness runs in an effect, never during render, so the
  server HTML and the first client render match.
- **One engine.** `src/store/engine.ts` holds the state and every action. Clicks on
  the left call `engine.exec('projects ml')` exactly as if it had been typed, so
  everything is logged in the terminal and both columns stay in step.
- **Two contexts.** `useDoc()` re-renders the document, `useTerm()` the terminal. A
  keystroke in the prompt does not re-render the sections.
- **Tokens.** The palettes are CSS variables on `<html>`; Tailwind reads them through
  `@theme inline`, so `text-primary` is the accent and switches with the palette.
  The palette blocks match `[data-palette]` on any element, which is how the
  footer dots colour themselves.

## Preflight and verify

```
npm run preflight    # content rules
npm run verify       # checks dist/ after a build
```

Both run in CI before anything is uploaded; the `deploy` job needs them green.

| it fails when | fix |
|---|---|
| an `en` string has no `tr` sibling | add the Turkish. The message gives the path, e.g. `writing[1].title` |
| `content.ts` changed but `meta.updated` did not | bump `meta.updated`. Code-only changes do not trigger this |
| `dist/index.html` was not prerendered, or a section is missing from it | the SSR build or `scripts/prerender.mjs` failed; read the build log |
| the terminal is in the prerendered HTML | something renders `<Terminal>` before mount; it must stay behind `useMounted()` |
| gzipped html + js + css exceed 160 KB | a new dependency is too heavy. React is ~60 KB of the budget; tooltips were dropped for this reason |
| `404.html`, `favicon.svg`, `og.png` or `robots.txt` is missing from `dist/` | it was removed from `public/` |

The placeholder count is reported, never fatal — CLAUDE.md §8 says they are
intentional at handoff.

## Deploying

GitHub Pages, from `main`, by GitHub Actions. Live at
**https://aliemreo.github.io/aliemre-wiki/**

```
git push origin main      # runs the checks, then publishes if they pass
```

`.github/workflows/deploy.yml`: `npm ci` → preflight → typecheck → build →
verify → upload `dist/` → deploy. Pull requests run the same checks through
`preflight.yml`; to make a red check block a merge too, protect `main` and require
it.

One-time setup (already done): repo **Settings → Pages → Source = "GitHub
Actions"**. In branch mode GitHub would run Jekyll over the repo instead.

There is **no staging URL** — GitHub Pages serves one site per repository. Preview
with `npm run dev`, or `npm run build && npm run preview` for the prerendered
result, or from a pull request.

The site is served from `/aliemre-wiki/`, not a domain root. `vite.config.ts` uses
`base: './'`, `public/404.html` redirects relatively and the engine's
`normalisePath()` measures against whatever the base is, so a custom domain later
changes nothing in the app.

### Before every deploy

- `npm run check` is green
- the placeholder count is expected, or every remaining placeholder is listed below
- `?lang=en` and `?lang=tr` both open without horizontal overflow at 360px
- after deploy, run Lighthouse on the live URL (performance ≥ 95, a11y 100)

### When the domain arrives

1. Put a `CNAME` file containing the domain in `public/`, and set the domain in
   **Settings → Pages**. GitHub issues the certificate.
2. At the registrar: `www` as a CNAME to `aliemreo.github.io`; for the apex use
   ALIAS/ANAME, or GitHub's A records if the registrar supports neither.
3. In `index.html` update `<link rel="canonical">`, `og:url`, `og:image`,
   `twitter:image` and the JSON-LD `url`; bump `meta.updated`. Uncomment the
   `Sitemap:` line in `public/robots.txt` if you add a `sitemap.xml`.
4. Check `curl -I` returns `200` with `content-type: text/html; charset=utf-8`.
5. Mail: add the domain in Resend, put its SPF and DKIM records at the registrar,
   and set `MAIL_FROM` in `ask/wrangler.toml` to an address on it (then `MAIL_TO`
   may be any inbox). Add the domain to `ALLOWED_ORIGINS` and redeploy the Worker.

## Fonts, social card, feed

Fonts are self-hosted: `npm run fonts` downloads the eight woff2 files into
`public/fonts/` and rewrites `src/styles/fonts.css` (commit both). `npm run og`
renders `public/og.png` from the hero copy; rerun it when the headline or lead
changes. The build writes `sitemap.xml` and an RSS feed of real writing entries
at `writing.xml`.

Press **⌘K** (or Ctrl-K, or the `⌘K` button in the top bar) for the command
palette: sections, projects, commands, places and preferences in one search.

## Linked terms

Every outbound link on the site follows one convention: a click opens a card
(a small screenshot of the target, a one-line explanation and the domain), a
click on the card opens the site. Nothing opens on hover; Enter works on the
keyboard, and a modifier-click skips the card. This covers the organisations and
schools in the copy, the marquee pills, the kilim motifs, the GitHub/LinkedIn/CV
links, project links, and reading and writing entries (`npm run previews` also
screenshots those, as `previews/u-<hash>.webp`). A card-bearing link has a
dotted underline. The terms live in
`src/content/links.ts`; copy refers to them as `[[tazi]]`. The screenshots are
static files in `public/previews/`, made by `npm run previews` with your local
Chrome, so the live site never calls a screenshot service. A term without an `href` shows
the card without a link. One URL was guessed and should be confirmed
(`confirm: true` in the file): `genarion.com` for Genarion.

## Ask me a question

The field in the top bar is the site search until you deploy the answering
endpoint: type a word, press Enter, and the terminal's `search` results drop
down under it. With the endpoint set it becomes a conversation: focusing the
field offers three starter questions (edit them in `meta.askStarters`), Enter
sends a question and keeps the focus, three dots pulse until the model starts,
the answer is typed out steadily as it streams, and parts of the site the model
points at (`[[go:experience]]`, `[[project:throwing]]`) appear as chips that
open them. Two follow-up questions are offered after each answer; asking one
keeps the thread as context. `stop`, `copy answer` and `clear` sit in the
footer, ↑ recalls your last question, and the thread survives a reload in the
tab. The rest of the page blurs behind the panel; Esc, × or a click outside
closes it; the
question also lands in the terminal log as `ask …`, and `ask <question>` works
from the prompt. The answer comes from a small Cloudflare Worker you deploy once
(`ask/README.md`: five commands), which asks Claude with the site's own content as
the knowledge base. Until `meta.ask` in `content.ts` holds the Worker's URL the
field stays in search mode, and nothing is ever sent on page load.

**"Would you hire me?"** A hiring question ("would you hire him for a robotics
role?", or `debate <question>` in the terminal) is not answered by the single
agent: two characters argue it out live in the same panel — Defne Karaca, a
recruiter looking for the reason to say no, and Tolga Erim, a staff engineer who
hates hype in both directions — over your actual files, each claim carrying a
citation chip to the file it came from, and the bench rules on board cells with
honest caveats. A click on a speaker's name opens their card (motif, role,
bio), and the first debate opens with a line introducing the cast. Visitors
find it through a `$ should you hire me?` button in the hero and at the end of
Contact, each with a line saying what will happen; both appear only once the
endpoint is set. You can
interrupt with a follow-up they both answer. The
characters, their voices, the rounds, the trigger words and the verdict labels
are one file, `ask/characters.json`; the files they may cite live in
`ask/knowledge/` (see `ask/README.md`: Knowledge files, The debate).

## Write to me (the mail dialog)

`$ email me` in the hero, `write to me from here` in Contact, `mail [message]`
in the terminal and the ⌘K palette open a small dialog: name, address, message,
send. The message goes to the same Worker (`/mail`), which delivers it to your
inbox through Resend with the visitor's address as Reply-To, so you answer with
a plain reply. Setup is in `ask/README.md` → Mail (a Resend account, one secret,
one var). Until `meta.mail` in `content.ts` holds `https://…workers.dev/mail`,
every one of those entry points just copies the address, as before. Spam
protection is a hidden honeypot field, a 3-second floor, a per-IP limit and the
origin check; nothing loads from a third party.

## The terminal

The site opens in the **light theme with the amber palette** and the **Geist**
typeface set; the footer toggles theme, palette and font (Geist ↔ Inter Tight +
Instrument Serif) and remembers the choice (`aeo-theme-v2`, `aeo-palette`,
`aeo-font`). `font inter` / `font geist` do the same from the terminal.

The first screen is a hero: the statement "I build …" typed out phrase by phrase
(`CONTENT.hero.headline`: `before`, `rotating`, `after`, both languages), your
lead sentence, two buttons and a marquee of the places in `src/content/links.ts`.
A sticky glass bar with the section links appears once you scroll past it.

The terminal is a window. It starts **folded** and the document has the whole
width. Click `$ terminal` in the top bar or press `/` to open it; the three mac-style dots in
its title bar close it (red), minimize it to a small floating window at the
bottom right and bring it back (yellow), or cycle its size (green: wide, then
full screen).
Drag its left edge to any width (double-click resets; arrow keys work when the
handle is focused), or type `term 480`, `term wide`, `term full`, `term mini`, `term fold`. On
phones, drag the bar under the log to set how tall it grows. Sizes are remembered
(`aeo-term`, `aeo-term-w`, `aeo-term-h`). `Esc` folds it when nothing else is open.

Everything the command bar does is also reachable by scrolling and clicking.
`help` lists the commands; every command has a Turkish alias and both always work
regardless of the interface language. `pipes` explains the query syntax
(`projects | stack | uniq -c`).

Hovering anything in the left column shows the matching command as a ghost in the
prompt: Enter runs it, Tab copies it into the input. While you type, the rest of
the first matching command appears as a ghost; Tab or → accepts it. `Ctrl+L`
clears, `Ctrl+C` cancels the line, `Esc` clears then blurs, `↑/↓` walk the history,
`!!` repeats the last command, `help tokens` explains one command. Hover a log
entry for a `copy` button. History survives a reload within the tab.

Worth knowing:

- `search <text>` greps projects, reading, writing, skills, experience, tools and
  the page prose in one go — `search kilim`, `search agent`
- `share` copies a link to whatever is on screen, filter and open project included
- `print` settles the headings and opens the print dialogue (terminal, forms,
  tools, guestbook and colophon are left out of the paper version)

`public/404.html` catches any path GitHub Pages does not recognise and sends it to
the page with the last segment as a hash, so `/aliemre-wiki/projects` opens the
projects section. Anything unrecognised lands at the top with a note in the
terminal.

State remembered in `localStorage`: `aeo-theme-v2`, `aeo-palette`, `aeo-lang`,
`aeo-bg`, `aeo-term`. The banner is shown once per tab session (`aeo-banner`, `sessionStorage`).

## Open placeholders

Everything below still needs real copy. The dev server lists them all.

- hero line 2 and the availability line
- the Now paragraph
- About
- TAZI bullets (3), the thesis line, the third experience entry (or delete it)
- projects `churn`, `toolbench`, `kvstore`, `survey`: copy, write-ups and links
- writing (2 entries), reading (4 entries)
- guestbook entries (2) and `CONTENT.guestbook.repo`
- `meta.email`, `meta.github`, `meta.linkedin`, `meta.cv`
- `meta.ask` and `meta.mail` (the Worker's URL; `ask/README.md`)
- the contact note
- confirm the skills lists

`og.png` is a generated placeholder card; replace it with a real 1200×630 image
when there is one.
