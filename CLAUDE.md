# CLAUDE.md — Ali Emre Özcan portfolio site

You are implementing and then maintaining a personal portfolio site for Ali Emre Özcan (final-year computer engineering student at İTÜ, ML intern at TAZI). This file is the contract for the repo. Read it fully before touching anything.

## 0. What is in this folder

- `CLAUDE.md` — this file.
- `docs/reference/index v2.dc.html` — the approved design, as an interactive HTML prototype from a design tool (`support.js`, `{{ }}` templating, `<sc-for>`, `<sc-if>`, a `DCLogic` class). **Never served.** It remains the source of truth for look, behaviour, copy and data shape.
- `docs/reference/index.dc.html`, `docs/reference/support.js` — earlier variant and the prototype runtime. Reference only.

The site was first built as one hand-written HTML file (see git history before September 2026). It is now a React app that is **prerendered to static HTML** at build time, so the deployed page still reads without JavaScript. The design, the commands and the data shape did not change in that move; this file describes the React version.

Fidelity: **high**. Colours, type, spacing, motion timings and command behaviour in the prototype are final unless this file says otherwise.

## 1. Target stack

- **Vite + React 19 + TypeScript.** Components from **shadcn/ui** (Radix primitives styled with Tailwind, copied into `src/components/ui/` and free to edit). Tailwind v4, configured in CSS (`@theme inline` in `src/styles/globals.css`), no `tailwind.config`.
- **Prerendered.** `npm run build` runs the client build, an SSR build of `src/entry-server.tsx`, then `scripts/prerender.mjs` writes `renderToString(<App/>)` into `dist/index.html`. React hydrates that HTML. The terminal renders only on the client (`useMounted`), so with JavaScript off the document is complete and the terminal simply is not there. **There is no `<noscript>` mirror any more; the prerender is the static copy.**
- No analytics, no external JS, **no third-party requests at all**: fonts are self-hosted. `public/fonts/` holds the variable woff2 files (latin + latin-ext) of Geist, Geist Mono, Inter Tight and Instrument Serif italic, fetched once by `npm run fonts` (`scripts/fonts.mjs`), which also writes `src/styles/fonts.css`. Two switchable sets (`data-font`, `font geist|inter`, `localStorage` `aeo-font`, default `geist`); the boot script preloads the chosen set's latin faces. IBM Plex was retired on 2026-09-21. **One exception (owner's request, 2026-09-22):** the "ask me a question" field (§5.12) posts the visitor's own question to the owner's endpoint (`CONTENT.meta.ask`, the Cloudflare Worker in `ask/`) — only when they press Enter, nothing on load, and the field is not rendered until a real URL is set. **Second exception (owner's request, 2026-09-23):** the mail dialog (§5.13) posts the visitor's message to `CONTENT.meta.mail` (the same Worker, route `/mail`) — only when they press send.
- Deploy target: **GitHub Pages, deployed from `main` by GitHub Actions, artifact = `dist/`.** Live at `https://aliemreo.github.io/aliemre-wiki/`. See §9.
- `public/` holds the files copied verbatim into `dist/`: `favicon.svg` (a `$` glyph, `#6FE3CF` on `#000`), `robots.txt`, `og.png` placeholder (1200×630), `404.html`.
- `vite.config.ts` uses `base: './'` so every asset URL is relative. Nothing may assume the site lives at a domain root or at `/aliemre-wiki/`.

Repo layout:

```
/
  .github/workflows/deploy.yml    main -> preflight, typecheck, build, verify, GitHub Pages
  .github/workflows/preflight.yml the same checks on every pull request
  scripts/
    preflight.mjs        content rules (§2, §7), run before the build
    prerender.mjs        writes the static HTML into dist/index.html
    previews.mjs         owner-run: screenshots for the link preview cards -> public/previews/
    fonts.mjs            owner-run: downloads the self-hosted fonts -> public/fonts/, src/styles/fonts.css
    og.mjs               owner-run: renders public/og.png from the hero copy
    verify-dist.mjs      prerender present, size budget, static files
  index.html             Vite entry: <head> metadata, the no-flash boot script, #root
  public/                copied as-is: 404.html (designed, redirects) favicon.svg og.png robots.txt fonts/ previews/
  src/
    main.tsx             hydrateRoot (or createRoot on the dev server)
    entry-server.tsx     render() for the prerender
    App.tsx              shell, observers, hover ghost, dev checks
    content/
      content.ts         CONTENT, TAGS, PALETTES, BGS   <- the owner edits this
      links.ts           LINKS: linkable terms with blurbs, used by [[key]] tokens
      sections.ts        SECTION_DEFS: order, motif, plate label
      tools.ts           TOOLS: terminal utilities
      ui.ts              UI labels and terminal messages, en/tr typed against each other
      types.ts
    lib/                 pure helpers: i18n, pipes, flap maths, motifs, pixel font, prefs, contentReport
    store/
      engine.ts          all behaviour: exec(), actions, routing, logging (framework-free)
      site.tsx           SiteProvider + useDoc / useTerm / useEngine / useLang
    terminal/
      commands.ts        the command table
      Terminal.tsx       status, log, chips, prompt
      Banner.tsx
    components/
      ui/                shadcn/ui components (edit freely, keep them small)
      Section.tsx        enamel plate + body
      Cells.tsx          split-flap letters (FlapCells) and board cells (Board)
      Motif.tsx Tag.tsx Footer.tsx Rich.tsx Copy.tsx ExtLink.tsx AskBar.tsx MailDialog.tsx
      ui/link-preview.tsx  click-to-open preview card for linked terms (Aceternity LinkPreview, adapted)
      ui/prompt-button.tsx the `$` prompt button (hero CTAs, top-bar terminal button)
      ui/tilt-card.tsx     the tilting card around an open project's write-up (Aceternity 3D card, adapted)
      SectionTree.tsx      the branched section menu in the wide-screen rail
      sections/          one file per section + index.tsx (id -> component)
    styles/globals.css   tokens, Tailwind theme, the bespoke CSS
  docs/reference/        the design prototype (not served)
  ask/                   the answering endpoint (not served): worker.mjs, wrangler.toml, README.md,
                         build-prompt.mjs -> knowledge/profile.md + knowledge/*.md -> knowledge.txt,
                         characters.json (the debate's cast, §5.14), debate.mjs, verify.mjs (+ *.test.mjs, `npm run ask:test`)
  CLAUDE.md
  README.md              human-facing: how to update content, how deploys work
```

## 2. This is a living site — design for updates

The owner updates this monthly (Now section), after every project, and when reading/writing lists grow. Every design decision must make that update a **data edit, never a component edit**.

Rules:

1. **All copy lives in `src/content/content.ts`**, bilingual: any user-visible string is either a plain string or `{ en: '…', tr: '…' }`. Components resolve with `L()` from `useLang()`; the engine with `engine.L()`. UI chrome strings live in `src/content/ui.ts`, where `tr` is typed against `en` so a missing translation is a type error.
2. **Rendering is derived, never hand-written twice.** Sections map over `CONTENT`. If you find yourself writing the same JSX for the second project, stop and loop.
3. **Nothing is hard-coded that could change**: dates, tags, command names, palette names, section order, guestbook repo. All come from `content.ts`, `sections.ts`, `tools.ts` and `commands.ts`.
4. **Placeholders are explicit, and hidden in production.** Any unfinished copy starts with `Placeholder:`. Components render copy through `Copy` / `shown` / `visible` (`src/lib/placeholder.ts`): the dev server shows placeholders in muted italics (`data-placeholder`), the production build renders nothing for them, and a section left empty shows `UI.emptySection`. A project with no visible write-up is not expandable; links whose href is `#` or a placeholder profile are not rendered. `scripts/verify-dist.mjs` fails the deploy if `Placeholder:` reaches the prerendered HTML. The dev server also `console.warn`s every placeholder and `preflight.mjs` reports the count. Never invent real-sounding content to fill a placeholder.
5. **Adding an entry must be additive.** New project = append an object. New tag = append to `TAGS`. New tool = append a `{ names, usage, desc, example, run }` object. New palette = one dark CSS block + one light CSS block + one entry in `PALETTES`. New command = one row in `commands.ts`. If any of these requires editing more than one place plus CSS, refactor.
6. **`meta.updated`** is the single "Last updated" source. Bump it on every content change; preflight fails the deploy if `content.ts` changed and it did not. Do not derive it from `Date.now()`.
7. **Do not add sections without asking.** The list is deliberate: `top, now, about, experience, education, projects, reading, writing, tools, skills, guestbook, contact, colophon` (education was added at the owner's request on 2026-09-20). A section is one row in `SECTION_DEFS`, one component in `components/sections/`, one entry in `sections/index.tsx`, a label in `ui.ts` (both languages) and a command.
8. Keep the content file human-editable: 2-space indent, one project per block, comments only where the data shape is not obvious.
10. **Linkable terms are data too.** `src/content/links.ts` holds every organisation, school or reference the copy links to: `{ label, href, blurb:{en,tr}, preview?, confirm? }`. Copy refers to one with `[[key]]` (renders the label) or `[[key|custom text]]`; `<Rich>` (`src/components/Rich.tsx`) turns the token into a `LinkPreview` card (click to open, §5.10; `cards={false}` would give an ordinary `.rich-link`), and `plain()` (`src/lib/rich.ts`) flattens it wherever text is shown raw — the pipes, `search`, `rowText`. Adding a term = one row in `links.ts`, then `npm run previews` for its screenshot. `verify-dist` fails if `[[` reaches the prerender.
9. **`content.ts` must import only types.** Node loads it directly (type stripping) in `scripts/preflight.mjs` and `scripts/verify-dist.mjs`; a runtime import would drag the app into a script that has no bundler.

### 2.1 Monthly update checklist (also in README.md)

- `CONTENT.now.text` (en + tr) and `CONTENT.now.date`
- new `reading` entries at the top of the array (newest first)
- `meta.updated`
- `npm run check`; open the dev server with `?lang=tr` and `?lang=en` once each

## 3. Page structure

**The terminal is a window and starts folded.** `html[data-term]` is `folded` (default), `open`, `wide`, `full` (terminal takes the viewport, document hidden) or `mini` (on ≥1024px a small floating window fixed bottom-right: `min(400px, 100vw − 40px)` × `clamp(280px, 40vh, 440px)`, 20px from the edges, 1px `#1C1C1C` border, radius 10px, no shadow, banner and keyboard hint hidden; the document keeps the whole width as when folded; below 1024px `mini` behaves like `open`), set by the boot script from `localStorage` `aeo-term` and changed by the engine (`openTerm`, `foldTerm`, `minimizeTerm` toggles mini ↔ open, `toggleWide` cycles open → wide → full → open and restores `open` from mini). **Resizable:** on ≥1024px a drag handle on the terminal's left edge (`.term-resize`, `role=separator`, ←/→ ±24px, Shift ±96px, Home resets, double-click resets) sets `--term-w` on `<html>` (clamped 320px … 75vw), persisted in `aeo-term-w` and restored by the boot script before first paint; `open`/`wide` use `var(--term-w, <their clamp>)`. On phones a bar under the log (`.term-handle`) drags the log's max height (`--term-h`, 120px … 70vh, `aeo-term-h`). `term [open|wide|full|mini|fold|<px>]` does the same from the prompt (`min`/`küçült` also mean `mini`; a width in px leaves `mini` for `open`); `Esc` in `full` returns to `open`, in `mini` folds. Folded: the document is the only column at every width and the `$ terminal` button in the top bar opens it (the earlier bottom-right dock tab was removed when the top bar arrived); `/` and `?` open and focus it; `Esc` with nothing else open folds it; commands run from the document do not unfold it. Open on ≥1024px: two-column shell, left column = the document (max-width 640px content; 20px side padding), right column = a sticky, full-height terminal (`clamp(360px, 36vw, 540px)` wide, `clamp(360px, 50vw, 760px)` when wide, pure `#000`). The section rail is driven by a container query on `.doc` (`@container (min-width: 880px)`), so it appears whenever the document column has room — folded from about 1100px, open from about 1380px. Below 1024px the terminal sits on top as a sticky header and is **collapsed by default**: only the chips and the prompt row show (`.term[data-collapsed="true"]`). It expands when the prompt is focused or a command produces output, and folds again after the reader scrolls the document more than 40px with the prompt unfocused; a small `▴`/`▾` button at the end of the prompt row toggles it by hand. Expanded, the log is capped at 34vh (min 200px), banner hidden under 600px height.

Left column sections, in order (`<main>` > `<section id>`), all left-aligned:

| id | content |
|---|---|
| `top` | **the hero** (since 2026-09-21): behind it, spanning the whole document column, a soft accent glow at the top over a fine dot grid that fades out before the NOW plate (`HeroBackdrop`, first child of `.doc`; glow breathes over 20s), the name as a mono kicker with the pixel-font hover (`.hero-name`), the `<h1>` display statement `hero.headline.before` + a typewriter phrase (`TypeWriter`: types at 55ms per character, holds 1.6s with a blinking block caret, deletes at 30ms, next word; the first word is fully typed in the prerender) + `after`, static words blurring in on load (`BlurText`, 600ms, 60ms stagger, `html.js` only), the lead sentence, `line2`/`avail` if not placeholders, two **prompt buttons** (`PromptButton`, §5.3: `$ open the terminal` with a blinking caret, `$ email me` as the outline twin, which runs `mail`: the mail dialog, §5.13, or copying the address while no endpoint is set), then — only once the answering endpoint is set, so never in the prerender — a third outline button `$ should you hire me?` with a one-line mono explanation beside it (`DebateCta`, §5.14), and a marquee of the `LINKS` entries as preview-card pills (40s loop, paused on hover, static under reduced motion). The old section index moved into the top bar. |
| `now` | dated paragraph; date shown at right of heading plate |
| `about` | 3–4 sentences prose |
| `experience` | departure-board rows (see §5.4), work only |
| `education` | the same rows for school: İTÜ, the Tampere exchange |
| `projects` | featured project on tinted panel, then rule-separated list; inline expandable detail (Radix Collapsible) rendered as a **tilting card** (`TiltCard`, §5.11); tag filter |
| `reading` | dated list, kind (paper/book/post), authors, one-line note, tags; tag filter |
| `writing` | date + title list |
| `tools` | list of terminal utilities, click pre-fills the prompt |
| `skills` | `<dl>` grouped; skill click → `projects <tag>` |
| `guestbook` | entries + small form (name, message, `echo` button) |
| `contact` | email (click copies; `write to me from here` opens the mail dialog once `meta.mail` is set, client only), GitHub, LinkedIn, CV, preferred-contact note; once `meta.ask` is set, the debate's explanation line and `$ should you hire me?` (`DebateCta`, §5.14, client only) |
| `colophon` | 4 short lines |

Footer: "Last updated …", palette dots (8, a Radix ToggleGroup), theme toggle, font toggle (shows the other set's name), language toggle, colophon link.

**Sticky glass top bar** (`src/components/TopBar.tsx`, first child of `.doc`, all widths): name (→ `top`), the **search / ask field** filling the middle (`AskBar`, §5.12), the `⌘K` button and a small outline prompt button `$ terminal` (→ `engine.focusBar()`). The section links were removed from the bar on 2026-09-22 (owner: redundant next to the rail, the palette, the field and the terminal); they are still rendered as `.topbar-links` for the **no-JavaScript page only** (`html.js .topbar-links { display: none }`), so that page keeps its anchors. Transparent over the hero; `data-scrolled` after 240px of scroll gives `backdrop-filter: blur(12px)` over `color-mix(--bg 72%, transparent)` and a `--rule` bottom border. Below 1024px with the terminal open it is `position: static`. Below 560px the name is dropped. In the prerender, so the no-JS page keeps its anchors. `headerOffset()` adds its height to scroll targets; the rail sticks under it (`top: 52px`).

**Section rail (≥1380px only):** a sticky column left of the document holds `<SectionTree>`, the branched menu from React Bits (`src/components/ui/branched-menu.tsx`, adapted). Four branches — Me (now, about, experience, education), Work (projects, reading, writing), Shell (tools, skills), Say hi (guestbook, contact) — come from the `group` field in `SECTION_DEFS`, labels from `ui.ts`. The rail rises in with the sections (same `data-in` reveal, 90ms stagger per branch). Branches start folded and unfold when the reader scrolls into their first section; a header click opens or closes one early; the active child follows the section the reader is in (the same signal as the status-line path) and the accent line draws to it. Children are real `<a href="#id">` links routed through `engine.exec()`, and `html:not(.js) [data-fold]` keeps every branch open without JavaScript. The rail column fits its content with a 20px gap to the document. Below 1380px the rail is not shown and the hero's section index does the job. Hidden in print. Mono 12.5px, rows 28px, colours from the tokens.

Semantic HTML: `main`, `section`, `article`, `dl`, `footer`, real heading hierarchy (h1 name, h2 sections, h3 items). The terminal is an `<aside aria-label="Terminal">` rendered only on the client.

## 4. Data shape (`CONTENT`)

Typed in `src/content/types.ts`. Shape summary:

```js
CONTENT = {
  meta: { name, role:{en,tr}, email, github, githubLabel, linkedin, linkedinLabel, cv, updated:'YYYY-MM-DD' },
  hero: { line1:{en,tr}, line2:{en,tr}, avail:{en,tr} },
  now:  { date:{en,tr}, text:{en,tr} },
  about: { en:[...paragraphs], tr:[...] },
  experience: [{ dates:{en,tr}, board:'2026', status:{en,tr}, title:{en,tr}, org:string|{en,tr}, bullets:{en:[],tr:[]} }],
  projects: [{ slug, featured?, name:{en,tr}, tags:[...TAGS], stack:[...], problem:{en,tr}, outcome:{en,tr},
               links:[{label:{en,tr}, href}], writeup:{en:[...],tr:[...]}, differently:{en,tr} }],
  reading: [{ date:'YYYY-MM', kind:'paper'|'book'|'post', title:{en,tr}, authors, tags, href, note:{en,tr} }],
  writing: [{ date:'YYYY-MM', title:{en,tr}, href }],
  skills:  [{ group:{en,tr}, items:[{ label:string|{en,tr}, tag? }] }],
  guestbook: { repo:'owner/guestbook', entries:[{ name, date, message:{en,tr} }] },
  contact: { note:{en,tr} },
  colophon: { en:[...], tr:[...] },
}
TAGS = ['ml','agents','systems','web','research']
SECTIONS = SECTION_DEFS.map(d => d.id)   // top … colophon, see sections.ts
PALETTES = ['aqua','amber','mint','sky','rose','lime','violet','paper']
```

`slug` doubles as the command argument (`project churn`) and the URL (`#projects/churn`). Keep slugs lowercase ASCII.

## 5. Visual spec

### 5.1 Palettes and themes

Theme (**`light` default** since 2026-09-21, `dark`) × palette (**`amber` default**, `aqua` is the prototype's). A visitor without JavaScript gets light amber from the `html:not(.js)` block in `globals.css`, which must stay equal to the light + amber values. CSS custom properties on `<html data-theme data-palette>`, in `src/styles/globals.css`. The palette blocks are written as `[data-palette="x"]` (not `html[data-palette]`) so a footer swatch carrying `data-palette` paints itself with its own `--accent`; there is no second list of hex values. Core aqua dark:

```
--bg #0D1413  --ink #CFD8D5 (dark body text was softened from the prototype's #E4ECE9; ≥ 12:1 on every dark palette)  --muted #889793  --rule #233230
--accent #6FE3CF  --accent-ink #0B1917  --tint #132925
--bar #111917 (plates)  --bar-ink #E4ECE9  --bar-muted #74837F
--prompt #6FE3CF  --tok-cmd #6FE3CF  --tok-arg #F0C674  --tok-err #FF7B6B  --tok-ok #A6E3A1
```
Light aqua: `--bg #F2F7F6 --accent #0A7264 --accent-ink #fff --tint #D9EFEA --rule #D0DCD9`; light muted ink is `#575450`. Light amber (the default): `--bg #F7F6F1 --accent #8F5600 --tint #F3E9D3 --rule #DCD9CF`. The error/ok pair stays bright in both themes because it only ever appears in the terminal, which is always `#000` (measured AA against black; a documented deviation from the prototype's darker light-theme pair).

Tailwind sees the tokens through `@theme inline`: the site's own names (`text-ink`, `border-rule`, `bg-tint`, `text-prompt`…) and the shadcn names (`primary` = the accent, `accent` = the tint, `border`/`input` = the rule, `ring` = the accent). Components use utilities for local styling; layout and the bespoke pieces (plates, cells, terminal, backgrounds, print) stay as classes in `globals.css` under `@layer components`.

Terminal background is always `#000` regardless of theme/palette. `::selection` = accent on accent-ink.

**No flash of wrong theme or layout:** the inline `<script>` in `index.html`'s `<head>` reads `localStorage` keys `aeo-theme-v2`, `aeo-palette`, `aeo-lang`, `aeo-bg`, `aeo-term`, `aeo-term-w`, `aeo-term-h`, `aeo-font`, sets the `<html>` attributes (and the `--term-w`/`--term-h` sizes) before first paint and preloads the fonts. Default theme light, palette amber, language from `navigator.language` (tr → tr, else en). React reads those attributes after hydration (`engine.boot()`), so the prerendered English HTML and the first client render match; a Turkish reader's `#root` is hidden by CSS until `data-hydrated` is set, so they never see an English frame.

### 5.2 Background (left column only)

Default `bgMode = scan`: `::after` overlay with `repeating-linear-gradient(to bottom, transparent 0 3px, rgba(0,0,0,.12) 3px 4px)` (light: `.03`; the prototype's `.2`/`.045` were softened for legibility), plus a very faint radial vignette (`--bg` to `color-mix(--bg, black 10%)`). Under it a procedural grain `::before` (SVG `feTurbulence` data URI, `baseFrequency .9`, 220px tile, opacity `.035`, light theme inverted at `.05`; softened from `.055`/`.08`). Nothing animates. Hidden in print.

Ship only `scan` and `flat` (grain only) as `bgMode`. Expose as `bg scan|flat` terminal command, remembered in `localStorage` `aeo-bg`.

### 5.3 Type and rhythm

- Body: IBM Plex Sans 18px / 1.65 (the prototype's 17/1.55 was raised for comfort), `text-wrap: pretty`, `-webkit-font-smoothing: antialiased`. Measure 640px of content everywhere.
- Hero `<h1>`: `--display`, `clamp(40px, 6vw, 72px)` / 600 / 1.02 / letter-spacing −.03em, `text-wrap: balance`; the rotating phrase is the accent colour at weight 500, and under the `inter` set it is Instrument Serif italic. The name is a 13.5px mono uppercase kicker (`.hero-name`) that swaps to the pixel-font rendering of "ALİ EMRE ÖZCAN" on hover or focus (5px mono, accent). Hero lead 20px / 1.55.
- **Hero exception** (owner's request, 2026-09-21): the top glow with its dot grid is allowed in the hero only; the rest of §5.3's bans stand for the document.
- **Prompt buttons** (`src/components/ui/prompt-button.tsx`, since 2026-09-22, replacing the rounded pill CTAs): a `<button>` in the terminal's language — mono 14px, `--bar` background, `--bar-ink` text, 1px `--rule` border, radius 2px, padding 12px 16px, a `--prompt` `$` sign, and on the primary one an 8×15px `--prompt` block caret blinking at 1.1s (stops on hover). Hover inverts to `--accent` / `--accent-ink` (Aceternity's "Invert it"). `outline`: transparent, `--ink` text, accent `$`, accent border and text on hover. `pbtn-sm` (7px 11px, 12.5px) is the top bar's `$ terminal`. Labels are lowercase, like commands.
- **Project card exception** (owner's request, 2026-09-22): the open project's write-up card (§5.11) may cast one soft shadow while the mouse is over it. Nothing else casts a shadow.
- Section heading plates (§5.5): 13.5px / 600 / uppercase / letter-spacing .14em.
- Mono (IBM Plex Mono) only for: terminal, chips, tags, stack strings, section index, dates in boards, code-like labels. 13.5px in the document, 12–13.5px in the terminal.
- Links: accent, underline offset 3px, underline colour `--rule` → accent on hover. Transitions 150ms on colour only.
- Section spacing: `padding-top 48px`; list items `padding 14–20px 0` with `border-bottom 1px solid --rule`.
- Left label column (`dates`, `dt`, contact labels): `flex: 0 0 140px`, 15px muted; wraps under content below ~480px because the row is `flex-wrap: wrap` with the content at `flex: 1 1 300px`.
- Featured project: `background --tint; padding 24px; border-radius 4px`, no border.
- Buttons in running text use the `Button` component's `inline` variant (underlined, accent) or `plain` (inherits, styled with utilities). Focus is the global `:focus-visible` outline; the shadcn ring classes were removed on purpose.
- Never: gradients as decoration, drop shadows, cards with identical rounded corners, numbered section markers, arrows after links, icons for skills, hero stats.

### 5.4 Experience as a departure board

Each entry row: left column shows the year in split-flap cells (`board`, e.g. `2026`) above the human date range; title row has the status in split-flap cells right-aligned (`NOW` / `UNTIL 2027` / `PAST`; Turkish `DEVAM` / `2027’YE DEK` / `GEÇMİŞ`). These cells are static (`<Board>`, no animation), 11–12px mono, `--bar-ink` on `color-mix(--bar, white 7%)`.

### 5.5 Section headings: enamel station plates with split-flap letters

Plate: `background --bar; border 1px solid --rule; border-radius 2px; outline 1px solid color-mix(--rule 70%, transparent); outline-offset −5px; padding 9px 14px 9px 16px; min-height 44px; display flex; align-items center; justify-content space-between`. Right side holds the section's kilim motif (22px, accent, opacity .85) and, where relevant, the date (`now`) or the active filter + `clear` (`projects`, `reading`).

Letters (`<FlapCells>` in `Cells.tsx`): each character is its own cell (`.cell`, keyed `index:char`), a **quiet box** — `color-mix(--bar, white 6%)`, `min-width 1.25em`, `height 1.75em`, radius 2px, a `rgba(0,0,0,.4)` seam at half height, `gap 2px` (softer than the prototype's cells). The experience/education boards keep their own `.board .cell` sizing.

Behaviour:
- The prerender, the first client render and the no-JavaScript page all show the real letters; nothing scrambles on scroll. After hydration each heading **cycles once**, the first time its section enters the viewport (IntersectionObserver, threshold .15): every letter starts 4–7 characters before its target in the drum and flips forward at 40ms per step with a 1.5-step stagger per letter, so the title settles left to right in about 0.8–0.9s. Each character change re-mounts the cell and plays `flapin` (160ms). Reduced motion: no cycle.
- The same timed flip (from the current letters this time) when the title text changes for another reason: projects filter (`PROJECTS · ML`), reading filter, language switch. A re-mounted cell plays `flapin`: `rotateX(−90deg) → 12deg → 0`, 160ms, `cubic-bezier(.3,.7,.3,1)`, brief `brightness(1.6)` at start; parent has `perspective: 260px`.
- `prefers-reduced-motion`: no flip; letters static. Print: plate becomes a 1px bottom rule; `settleAllFlaps()` runs on `beforeprint` and on the `print` command.

Heading text per language is the plain section name; uppercase with `toLocaleUpperCase('tr')` when in Turkish (İ/ı correctness).

### 5.6 Kilim motifs

Six motifs as 13×13 pixel grids (`src/lib/motifs.ts`) rendered as SVG data-URI masks over `--accent`. The six mask rules are emitted once as a `<style>` (`<MotifStyles>`), and each motif carries `data-motif`; do not inline the mask per element, it bloats the prerender. Mapping: now→suyolu, about→elibelinde, experience→kocboynuzu, education→yildiz, projects→yildiz, reading→pitrak, writing→suyolu, tools→kocboynuzu, skills→pitrak, guestbook→goz, contact→goz. Each has `role="img"` and `aria-label` = "name — meaning (tr / en)", and is the trigger of a `LinkPreview` (§5.10) whose card shows the motif at 64px, its name and a one-line meaning, linking to a reference page (`href`/`blurb` on `MOTIFS`). Hidden in print.

### 5.7 Terminal (right column)

Layout top→bottom: **title bar** (macOS traffic lights left, in the real mac colours in every palette: red `#FF5F57` closes = fold, yellow `#FEBC2E` minimizes = the `mini` floating window bottom-right, and restores `open` when pressed again, green `#28C840` zooms = wide, then full; `×`/`−`/`+` glyphs appear when the bar is hovered. `clear` (command or Ctrl+L) wipes the whole screen including the banner and welcome text; `ali@site ~/section` centred; keyboard hint right, hidden < 480px), scrolling log (`role="log" aria-live="polite"`), context chips, prompt row (`$` + input, 50px tall, top border turns accent on focus).

- Banner: on first load per `sessionStorage` (`aeo-banner`), "ALI EMRE" / "OZCAN" in the 5×6 pixel font inside a thin bordered box, 9px mono, rows tinted `--prompt`→`--bar-muted` top to bottom (the terminal's own bright token, never `--accent`, which is dark in light palettes), pixels appear in random order over ~1.1s (`step = ceil(total/70)` per 16ms). Reduced motion or repeat visit: instant. Followed by the welcome text (`UI.welcome`).
- Input text is transparent; a mirror span renders it with syntax colours: first word `--tok-cmd` (or `--tok-err` if it is not a known command prefix), rest `--tok-arg`, then a 9×17px block cursor that blinks (`blink 1.1s steps(1)`) only while the prompt is focused and sits at 55% opacity otherwise, then a muted hint: while typing, the **inline autocomplete ghost** (the rest of the first matching command, argument or pipe stage, accepted with Tab or → at the end of the line); when empty, the hover-ghost command or `type help, or press ?`. The mirror scrolls with the input so long lines stay aligned.
- Every executed command is appended to the log as `$ cmd args` + output. The newest entry's output is typed in (≈40 frames, 16ms) unless reduced motion; older entries show in full. Hovering an entry shows a mono `copy` pill that puts `$ cmd` + output on the clipboard (`copied` in place, no log entry). History (last 50) and the phone header's expanded state survive a reload within the tab (`sessionStorage` `aeo-hist`, `aeo-term-expanded`). Output colour: red for errors (`command not found`, `no …`, `usage`), green for confirmations (`→ …`, `copied`, `theme`, `language`), otherwise `--bar-ink`.
- Chips: monospace pills, 12px, `1px --rule` border, active = `--prompt` fill with black text. Default set: `projects, about, contact email, theme dark|light, palette, help`; while the projects section is in view they become a Radix ToggleGroup of `all + TAGS` filters; while reading is in view, the same for reading.
- Hover ghost: hovering a section or a project on the left shows the corresponding command as a hint in the prompt; Enter runs it, Tab copies it into the input. The `~/path` in the status line follows the hovered/scrolled section.
- Every left-side interaction goes through `engine.exec()` so it is logged: project title → `project <slug>`, tag → `projects <tag>`, skill → `projects <tag>`, footer toggles → `theme` / `lang` / `palette <name>`, email → `contact email`, section index → `<section>`.

### 5.8 Command set

Shell keys in the prompt: `Tab` or `→` at the end accept the ghost (Tab still lists several matches), `Ctrl+L` clears the log, `Ctrl+C` cancels the line (logs `^C`), `Ctrl+U` clears the line silently, `Esc` clears a non-empty line and blurs an empty one, `↑/↓` history, `!!` and `!n` re-run history entries (expanded before logging), `help <command>` prints one command in detail (names, description, arguments; usage and example for tools). Preferences: `theme`, `palette`, `lang`, `bg`, `font` (typeface set), the terminal window mode. **⌘K / Ctrl-K** opens the command palette (`src/components/CommandPalette.tsx`, a native `<dialog>`, no cmdk): fuzzy search over sections, projects, commands, linked places and preferences; a query that matches nothing offers "Run in terminal"; every row runs through `engine.exec()` and does not unfold the terminal. Also opened by the `⌘K` button in the top bar. Keyboard: `/` opens the terminal if folded and focuses it, `?` prints help and does the same, `Esc` closes an open preview card first, then the ask panel, then blurs the prompt, closes the open project, or folds the terminal when nothing else is open, `↑/↓` history, `Tab` completion (command names; after a command its arguments; after `|` pipeline stage names), `Enter` runs input or the ghost hint.

Commands (English name first, Turkish alias second; both always work regardless of UI language) — the table is `src/terminal/commands.ts`:

```
help/yardım/?         projects/projeler [tag|all]     project/proje <slug>
now/şimdi  about/hakkında  experience/deneyim  education/eğitim  reading/okuma [tag|all]
writing/yazılar  tools/araçlar  echo/guestbook/defter [message]
skills/yetenekler  contact/iletişim [email|github|linkedin|cv]  cv  mail/posta [message]
theme/tema [light|dark]  palette/color/renk [name]  lang/dil [en|tr]  font/yazı [geist|inter]
term/terminal [open|wide|full|mini|fold|<px>]
search/ara <text>  ask/sor <question>  debate/tartış <question>  share/paylaş  print/yazdır
bg [scan|flat]  back/geri  top/başa  colophon/kolofon
history/geçmiş  clear/temizle  pipes/borular
hidden: ls, whoami, sudo, rm, exit/quit/çıkış, vim/vi/nano/emacs  (dry one-liners, see MSG)
tools (hidden from help, listed by `tools`): tokens <text>, tr <text>, cron <expr>, ts [n|date], calc <expr>
```

Unknown command → `command not found: x — did you mean y?` using Levenshtein ≤ 2 or prefix match over all names. Output colour is decided by `ERR_RE`/`OK_RE` in the engine; confirmations for `theme`, `palette`, `lang`, `bg`, `font` and copies are green, refusals red. The hover ghost offers `project <slug>` only for projects that can expand.

Pipes (`src/lib/pipes.ts`): any line containing `|`. Sources: `projects reading skills experience education writing history tools ls` (Turkish aliases resolved through the command table). Stages: `grep [-v] <re>`, `where <field><op><value>` (`= != > < >= <= ~`), `sort [field] [-r]`, `uniq [-c]`, `head n`, `tail n`, `count`, `tags`, `stack`, `fields a,b`, `json`, `first`, `last`, `shuf`, `rev`. Output ≤ 200 rows. A stage throws a plain string for a usage error; anything else becomes `MSG.crashed`.

Routing: `#<section>`, `#projects/<tag>`, `#projects/<slug>`, `#reading/<tag>`. `history.replaceState`. On load, apply the hash after fonts settle (~150ms) with instant scroll; afterwards smooth scroll (instant under reduced motion). Scroll offset accounts for the sticky terminal height on narrow screens only. `public/404.html` sends `/<base>/projects` to `/<base>/#projects`; `normalisePath()` in the engine cleans up whatever is left, base-agnostically.

Guestbook: `echo name: message` or the form. Entry appears immediately with "awaiting review". If `CONTENT.guestbook.repo` is a real repo, open `https://github.com/<repo>/issues/new?title=guestbook: <name>&body=<message>`; owner publishes by copying approved issues into `guestbook.entries`. No backend.

### 5.10 Linked terms and preview cards

`LinkPreview` (`src/components/ui/link-preview.tsx`) is Aceternity UI's LinkPreview rebuilt as a small popover of its own — no Radix, no floating-ui: a click-controlled card needs no positioning engine, and dropping HoverCard/Popper/floating-ui saved 12 KB gzipped — with three changes: **the card opens on click, tap or Enter, never on hover** (owner's request, 2026-09-22: hover cards popped up everywhere while reading); motion is CSS (no framer-motion); and the preview is a static image committed under `public/previews/` (no `api.microlink.io` call from the visitor's browser). The trigger is a real `<a href target="_blank" rel="noopener">`, so the prerender and the no-JavaScript page have plain links; a plain click is intercepted to toggle the card, a modifier or middle click goes straight to the site. It is rendered through a portal at `body`, `position: fixed`, centred on the term and 10px above it (below when there is no room), kept 12px inside the viewport, re-placed on scroll and resize (measured with `offsetWidth/Height`, not the bounding box, which the enter animation shrinks). Escape, a click outside and focus leaving close it (the engine's global Escape yields while a card is open); Tab from the term moves into the card's link, Tab again returns to the term and closes it. The exit animation runs for 150ms before unmount (`data-state="closed"`). **One convention for every external link on the site** (owner's request, 2026-09-22): every `[[token]]` in copy, the marquee pills, the plate motifs, and the other outbound links — the contact profiles (GitHub, LinkedIn, CV), project links, reading and writing entries — open a card on click and go to the site from the card. The latter go through `ExtLink` (`src/components/ExtLink.tsx`), whose image is `previews/u-<hash>.webp` from `previewName(href)` (`src/lib/preview.ts`; `npm run previews` writes them, `verify-dist` notes any missing). Blurbs: `ui.blurbGithub/LinkedIn/Cv/Writing`, the reading note (or authors), `project · link label`. A card-bearing link has a **dotted accent underline** (solid on hover/open) as the cue; internal anchors (top bar, rail, section index) are plain. Card (`.lp-card`, 216px, `--bg`, 1px `--rule`, radius 12px, no shadow): the 200×125 preview image (or custom content for motifs), then the **explanation row** — the term's one-line blurb in 13.5px `--ink` and its domain in 12px mono `--muted`. `side="top"`, `sideOffset 10`. The card is offset toward the click (`--lp-x = (clickX − width/2)/2`, 220ms). The domain line is the accent-coloured link to the site, since the trigger itself no longer navigates on a plain click. A missing image falls back to the blurb-only card. Keyboard: Enter or Space on the focused term opens the card; focus stays on the term, Tab moves into the card. Previews are regenerated with `npm run previews` (local Chrome over CDP; skips existing files, `--force` rewrites). A term whose site is unknown has no `href` and renders as dotted-underlined text with the card; `genarion.com` is a best guess marked `confirm: true` in `links.ts`.

### 5.11 The open project as a tilting card

`TiltCard` / `TiltItem` (`src/components/ui/tilt-card.tsx`) is Aceternity UI's 3D card (CardContainer / CardBody / CardItem) with the motion moved to CSS variables: the body has `perspective: 1000px` on its wrapper, `transform-style: preserve-3d` and `transform: rotateX(--rx) rotateY(--ry)`; a mouse move sets `--rx`/`--ry` through a ref (no re-render) as the pointer's offset from the centre over an eighth of the card's size, **clamped to ±4°** so the write-up stays readable; leaving resets both to 0 and drops `data-hover`. While `data-hover` is set, `TiltItem`s move to `translateZ(--z)`: the mono `write-up` kicker (40px), the "what I'd do differently" callout (60px, accent left rule) and the back link (20px); the paragraphs stay flat. Card: `--tint` (`--bg` inside the featured project's tint panel), 1px `--rule`, radius 4px, padding 20px 22px, and the hover shadow `0 18px 40px −20px color-mix(--ink 35%)`. Transitions 200ms linear (Aceternity's timing). Only a mouse tilts it (`pointerType === 'mouse'`); `hover: none` devices, reduced motion and print show the plain panel.

### 5.12 The top-bar field: search, or a conversation

The field in the top bar (`src/components/AskBar.tsx`) fills the whole space between the name and the `⌘K` button (`flex: 1`): mono 12.5px, 1px `--rule` border, radius 2px, placeholder `ask me a question` in both modes. Two modes, decided by `engine.boot()`: **search** while no answering endpoint is configured (`$ /` sign; Enter runs `search <text>` through `engine.exec()` and appends the hits, mono, as a turn `$ search <text>`; placeholders never appear in search output), and **ask** once `CONTENT.meta.ask` is a real URL (`$ ?` sign). Both go through `engine.submitField(q)`.

**The conversation (ask mode).** The panel (`.ask-panel`, absolute under the field, `min(600px, 100vw − 32px)`, opaque `--bg`, 1px `--rule`, radius 4px, no shadow, enter 150ms, a `×` in its corner) holds a **thread** of turns (`AskState.turns`, `AskTurn { cmd, q, a, done, fresh, stopped, error }`, last 8, scrolling box `.ask-thread` capped at 60vh and pinned to the bottom while streaming unless the reader scrolled up):

1. **Focus** opens the panel; empty, it offers the **starter questions** as chips (`meta.askStarters`, bilingual, in `content.ts`; three plus a hiring one that starts the debate, §5.14).
2. **Enter** appends a turn (`$ ask <q>` in mono), clears the field but keeps focus, and shows **thinking dots** (`.ask-think`, three accent dots, 900ms loop) until the first byte.
3. **Streaming**: the text is **revealed at a steady rate** whatever the chunking — a rAF loop (`useReveal`) advances the visible prefix at 60 characters a second while the stream is live (plus 4/s for every waiting character beyond 120), settles at 150/s + 2× the backlog once the stream has ended, and at 900/s after a stop, so it reads steadily, never stutters and finishes within a second of the stream's end; a block caret sits at the end. `stop` in the footer aborts and keeps the partial text (`— stopped`).
4. **Done**: the answer grammar (`src/lib/askmd.ts`, pure, safe on partial text) renders paragraphs, `- ` lists, `**bold**`, `` `code` ``, links only to hosts in `LINKS`/`meta`, and the model's **action tokens** — `[[go:<section>]]` → chip `→ <section>`, `[[project:<slug>]]` → `→ <project name>`, `[[cmd:<command>]]` → `$ <command>` — validated against `SECTIONS`, the project slugs and the command table (`engine.askActionValid`); a chip runs `engine.exec()` (logged in the terminal) and, for `go`/`project`, closes the panel. Lines the model ends with as `?? <question>` become **follow-up chips** (max two); clicking one asks it.
5. **Context**: the request carries `history` — the last four answered turns as `{ q, a }` with tokens and follow-ups stripped (`plainAnswer`). `↑` in the empty field recalls the last question. The thread persists in `sessionStorage` (`aeo-ask-thread`) and is restored by `boot()` (restored turns are not `fresh`, so they do not re-animate); `clear` empties it; `copy answer` copies the last answer as plain prose.
6. **Close**: Esc (focus stays in the field; a second Esc clears it), the veil, or `×`. The terminal log gets one `$ ask <q>` entry per turn, filled live with the plain prose (`LogEntry.stream`).

**The focus veil:** while the panel is open, `html[data-asking]` is set and a fixed `.ask-veil` inside the bar (`z-index: −1` in the bar's stacking context, so it sits under the bar's controls and over the document; the document column is isolated, which is why a body-level overlay would cover the bar too) blurs and dims everything behind — `backdrop-filter: blur(10px) saturate(.7)` over `--bg` at 45%, fading in over 300ms; the bar drops its own glass blur meanwhile so the fixed veil stays viewport-relative. The terminal column lies outside that stacking context and is blurred directly (`filter: blur(10px) saturate(.7)`, opacity .6, pointer-events off). The bar's name, `⌘K` and terminal button drop to 40% opacity, so only the field and its panel stay sharp; a click on the veil closes the panel. Errors show in the accent colour with a `search` hint.

Below 720px the panel spans the bar (16px insets); below 560px the name is dropped so the field keeps its room. **⌘⇧K / Ctrl+Shift+K** focuses the field; the palette lists "Ask a question"; `ask/sor <question>` works from the prompt.

Wire: `POST { question, lang, history }` to `CONTENT.meta.ask`, response `text/plain` streamed and appended chunk by chunk (`fetch` + `ReadableStream`); a new question aborts the previous stream (`AbortController`; the earlier turn stays unanswered), 30s timeout, question capped at 300 characters. **Gating:** the field renders on the client only (`ready`); ask mode needs an endpoint resolved by `engine.boot()` — `?ask=<url>` in the query (a debugging aid, also how the browser suite points it at a mock) or `meta.ask` when `realHref()` accepts it; a `Placeholder:` value leaves the field in search mode, and the `ask` command prints `MSG.askUnset`. No key, prompt or anything private is in the site; the Worker (`ask/`, §9.4) holds the key as a secret. Not in the prerender (`useDoc().ready` is false there).

### 5.13 The mail dialog

`src/components/MailDialog.tsx`, mounted next to the palette (client only), on the same native `<dialog>` (focus trap, Escape and backdrop from the platform; no Radix Dialog, no form library — the budget would not hold them). Opened by `mail [message]` (the argument pre-fills the message), the hero's `$ email me`, the contact line and the palette's command row, all through `engine.openMail()`. Box: the palette's, radius 4px, `$ mail ali` mono kicker, an h2, three labelled fields (name, address, message — mono 12px labels, 1px `--rule` inputs, accent border on focus or `aria-invalid`), a hidden honeypot `website`, and a footer with the reply note and two small prompt buttons (`cancel` outline, `send` with the caret). Validation on submit only (address shape, message ≥ 10 characters), mono accent error lines tied by `aria-describedby`, focus to the first bad field. `engine.sendMail()` posts `{ name, email, message, hp, lang, t }` (`t` = ms the dialog was open) to `mailEndpoint` (resolved by `boot()`: `?mail=<url>` or `meta.mail` when `realHref()` accepts it), 15s timeout; the terminal logs `$ mail <name>` → `→ mail sent …` or the error. Box title: a plate (§5.5) with `FlapCells` reading `WRITE TO ME`. Sent: a confirmation line, the message cleared, the plate flips to `ui.mailSentFlap` (`SENT ✓` / `GÖNDERİLDİ ✓`; every letter starts 4–7 drum places back so the flip is short), and after 1.3s the window **folds back into what opened it, like a macOS minimise into the Dock** (`genie()` in `MailDialog.tsx`, Web Animations, 800ms at an even pace: it scales toward the first on-screen of the opener — the element focused when it opened —, the hero's `$ email me` (`data-mail-home`), the terminal prompt, the top bar's `$ terminal`, with a clip-path narrowing the edge that faces it; the backdrop fades via `[data-closing]`; the target pulses once with an outline, `[data-arrive]`). Reduced motion: no flip, no fold, closed after 1.2s; an error keeps the draft and offers `copy the address instead`. The fields live in the component, so a draft survives closing. While the dialog is open the engine's global keys stand down. Without an endpoint every entry point copies the address (`MSG.mailUnset`).

### 5.14 "Would you hire me?" — the debate

A hiring question in the field (owner's request, 2026-09-23) is not answered by the single agent: two invented characters argue it in front of the visitor and a bench rules. **Routing** is on the client: `isHiring(q)` (`engine.ts`) matches the trigger words of `ask/characters.json` in both languages or a character's first name; a bench follow-up chip carries `mode: 'debate'` explicitly; `debate/tartış <question>` forces it from the prompt; the palette's "Debate my fit" asks `meta.debateStarter`. Everything else stays with `ask`.

**Entry points** (owner's request, 2026-09-23: visitors must be able to see the feature): `src/components/DebateCta.tsx` renders an outline prompt button `$ should you hire me?` (`ui.ctaDebate`) with the explanation `ui.debateExplain` ("Two characters — a recruiter and a staff engineer — argue it over my files, live, in about a minute. The bench rules; you can interrupt with a question.") in mono 12.5px `--muted` (`.cta-hint`): in the hero under the two CTAs (`.hero-debate`, button then line) and at the end of Contact (`.contact-debate`, line then button). A click focuses the field and runs `debate <meta.debateStarter>` through `exec()`, so it is logged. Rendered only when `askEndpoint` is set — never in the prerender or on the no-JS page — and hidden in print. No section: a section would give the feature the weight of the work.

**The cast** lives in one file, `ask/characters.json`, so the owner tunes it without touching UI code: `cast` (id → name, role, kilim `motif` as the avatar, bilingual `bio`), `order`, `rounds` (2, max 3), `maxWords` (80), `triggers`, `verdicts` (key → bilingual board label), `fallback` (what the bench says when a model call fails) and `prompts` (a `shared` rules block, and per character a `voice` plus one instruction per step: `defne.open/press/interrupt`, `tolga.answer/close/interrupt`, `bench.rule/rerule`). Defne Karaca (`goz`, the eye) is the recruiter looking for the reason to say no; Tolga Erim (`kocboynuzu`, the ram's horn) the staff engineer who hates hype in both directions and concedes first; the bench (`elibelinde`) is the site's own voice and never rounds up. The site bundles only `cast`, `triggers`, `verdicts` and `fallback` — Vite's JSON named exports leave `prompts` out (verified in the bundle). No real people, no existing fictional characters; the characters speak about the owner in the third person, the one place on the site that does.

**Layout: a hearing transcript in the departure-board idiom, as one turn in the ask panel** — no new surface, no bubbles. **The characters are introduced inside the panel, never on the page** (owner's decision, 2026-09-23: no hero or section for invented characters): the speaker label is a **character card** trigger — `LinkPreview` without href, the plate motifs' card (§5.6) with the motif at 64px, the name, the role (`.lp-role`) and the bio as the blurb, opened by click or Enter like every card on the site — and the **first debate turn in a thread opens with a convening row** (`.ask-cast`, mono muted: `defne karaca, technical recruiter · tolga erim, staff engineer · the bench rules`, names as card triggers, `ui.debateBench`), which also fills the wait before the first byte; the fourth starter chip and `meta.debateStarter` name them (`Ask Defne and Tolga: …`), so renaming a character means editing those two content lines too. Each utterance is an `.ask-row` built like an experience row: a 116px label column (`.ask-who`: the speaker's motif at 16px and mono lowercase name, `--muted`, dotted underline as the card cue) and the prose at the panel's 15px (`.ask-say`, `flex: 1 1 240px`); below 480px the label wraps above the text. Every claim ends in a **citation chip** (`.ask-cite`, 11px mono, `--rule` border) labelled with the file's title: an external source opens the preview card like every other outbound link (`ExtLink`, §5.10), a site source (`#experience`, `#projects/<slug>`, `#projects/<tag>`) runs its command through `engine.routeHash()` and closes the panel, a source without an href is plain. A sentence the verifier could not ground renders as `.ask-flag` — muted italics with a mono `unverified` tag. The bench's verdict sits on **`Board` cells** (`.ask-verdict`, the `NOW`/`PAST` treatment of §5.4, `aria-label` = the verdict) under a mono `verdict` kicker, then its two caveat sentences, then the follow-up chips under `ask them something else` (the field's placeholder says the same once a debate has ended). While thinking, the dots carry the mono line `convening the bench`. No new motion: the reveal, the dots, the 150ms turn enter and the veil are the panel's own. Two columns were rejected because the speakers talk in sequence and a 600px panel would sit half-empty, and because alternating labelled rows read like the terminal log the visitor already knows.

**Wire and orchestration.** `POST { question, lang, mode: 'debate', transcript? }` to the same endpoint; the reply is the panel's plain-text stream with a line protocol on top: `@@ <who>` starts an utterance, `== <verdict-key>` is the ruling (the last one wins), `?? ` lines are follow-ups, `[src:<id>|<title>|<href>]` is a citation and `[! … !]` wraps a flagged sentence (`src/lib/askmd.ts`: `parseDebate`, `plainAnswer` turns speaker lines into `who: `). The Worker (`ask/debate.mjs`) runs one Messages call per utterance — system = `prompts.shared` + the knowledge files + the character's voice, user = the visitor's question, the transcript so far and this step's instruction, 170 tokens (bench 220), 20s each — in the order `defne.open, tolga.answer, defne.press, tolga.close, bench.rule` (two rounds), writing through a `TransformStream` so the headers and the first speaker leave before the later calls. Every sentence passes **`ask/verify.mjs`** first: a `[src:id]` to an unknown file is dropped, a known one expanded with its title and href, every number in a cited sentence must occur in that file (thousands separators, Turkish decimals and `100 %` normalised, ambiguous readings allowed), a sentence with a number and no citation is flagged; that is what can be checked deterministically, the wording is the model's. If a call fails the bench rules `unclear` with `fallback`; if the fetch itself fails the client appends the same fallback (`→ experience`, `→ projects`) under the error line. **Interruption:** Enter while a debate streams marks that turn `interrupted` (its partial text stays, revealed at the stopped pace), aborts, and sends the follow-up with `transcript` (the debate turns so far as plain text, ≤ 3,000 chars); the Worker then runs one round (`defne.interrupt, tolga.interrupt`) and `bench.rerule`. A bench follow-up chip after the verdict does the same. The single agent's `history` excludes debate turns. The idle timeout is 30s between chunks (a whole debate runs longer than 30s). Terminal log: one `$ debate <q>` entry, filled live with `defne: …` lines and `verdict: <key>`. Under 90 seconds end to end: five Haiku calls ≈ 8–10s of generation, about 2,200 characters revealed at 60–100 cps.

**Knowledge base** (§9.4): `ask/knowledge/profile.md` is generated from `CONTENT`; the owner adds `cv.md`, write-ups, code notes next to it with front matter `id`, `title`, optional `href`; `npm run ask:prompt` renders `ask/knowledge.txt` and refuses placeholders and phone-number-shaped strings. Gating as §5.12: without an endpoint nothing changes on the site.

### 5.9 Motion inventory (complete list — add nothing else)

hero: word blur-in (600ms, 60ms stagger) · mail dialog enter (the palette's 150ms), on send its plate flip to `SENT ✓` (~0.6s) and the fold back into its opener (800ms, backdrop fade 450ms, target pulse 500ms; owner's request, 2026-09-23) · prompt-button caret blink (1.1s) · ask panel enter (150ms), turn enter (150ms), thinking dots (900ms loop), answer reveal (60 chars/s, faster with a backlog), its caret blink and the focus veil fade + blur (300ms) · typewriter phrase (55ms type, 1.6s hold with caret blink, 30ms delete) · backdrop glow breathe (20s alternate) · palette enter (150ms) · marquee (40s linear, paused on hover) · top bar glass transition (200ms) ·
cursor blink · output typing · banner pixel reveal · plate title cycle on first reveal (~0.8s, once) and re-flip on filter/language change · link preview card enter (220ms) / exit (150ms) and pointer follow (220ms) · project card tilt (±4° following the mouse, 200ms linear), its hover shadow (200ms) and layer lift (translateZ 20–60px, 200ms; mouse only) · terminal window fold/unfold and phone expand/collapse (display only, no transition) · section-rail reveal (600ms, 90ms stagger), accent line draw (400ms), marker glide (220ms) and branch unfold on scroll (300ms) · project detail expand (`opacity 0→1, translateY −4px→0`, 250ms ease-out) · section reveal on first scroll (`opacity 0→1, translateY 14px→0`, 600ms) · hover colour transitions 150ms. All disabled under `prefers-reduced-motion` except colour transitions. shadcn components that ship enter/exit animations must be checked against this list before use.

## 6. Quality floor (verify before every deploy)

- 320px → 2560px without horizontal scroll; Turkish strings do not overflow plates or boards (long words wrap: `flex-wrap` on cells).
- Keyboard: every interactive element reachable, visible focus (`2px solid --accent`, offset 2px). Prompt input has `aria-label`. Log is `aria-live="polite"`.
- WCAG AA on both themes for body text; large-heading 3:1 minimum.
- JS off: the prerendered page is complete and readable, index links work, no terminal, no empty boxes.
- No hydration mismatch: the server render and the first client render are identical (English, no prefs, no terminal). Anything that depends on `window`, `localStorage` or `Math.random` goes in an effect.
- `<title>`, meta description, Open Graph, Twitter card, JSON-LD `Person`, `favicon.svg`.
- Print: hides terminal, chips, forms, tools, guestbook, colophon, motifs, backgrounds; plates become rules; black text on white; fits 1–2 pages once the placeholder copy is real.
- Lighthouse: performance ≥ 95, a11y 100. **Total transfer without fonts < 165 KB gzipped** (raised from 160 KB at the owner's request on 2026-09-23, when the mail dialog's send animation filled it) (html + js + css; preview images are not counted), enforced by `scripts/verify-dist.mjs`. React + ReactDOM are about 60 KB of that on their own, tailwind-merge about 8.5 KB; the budget was 120 KB for the framework-free version. The shadcn primitives are kept lean (no ring/shadow/aria-invalid/svg classes, only the variants in use) — `npm run check` prints the total.
- No `console.error`; the placeholder warning is the only allowed `console.warn`, on the dev server only.

## 7. How to work in this repo (for Claude Code)

- Small change requested → change only that; do not reflow, rename or "improve" nearby code.
- Content request ("add project X", "update Now") → edit `src/content/content.ts` only, bump `meta.updated`, run `npm run preflight`. Never touch components for content.
- New feature → first check it can be expressed as data + one component + (optionally) one command row. If it needs a new section, ask.
- New UI primitive → `npx shadcn@latest add <name>`, then fix the import to `@/lib/utils`, strip ring/shadow classes that fight §5, and check the size budget (`npm run check`). Prefer the primitives already in `src/components/ui/`.
- Keep both languages in sync; `ui.ts` enforces it by type, `preflight.mjs` enforces it for `CONTENT`. A `Placeholder:` Turkish string is acceptable temporarily.
- Behaviour lives in `src/store/engine.ts`, not in components. A component calls `engine.exec('…')` or an engine method; it never mutates state itself.
- Commit messages: `content: …`, `design: …`, `terminal: …`, `fix: …`, `build: …`.
- Before opening a PR: `npm run check` is green (preflight, typecheck, build, verify) and the built site works from `npm run preview`.

## 8. Open placeholders at handoff

Hero line 2 and availability · Now paragraph · About · TAZI bullets (3) · thesis line · third experience entry (or delete) · projects churn/toolbench/kvstore/survey copy, write-ups and links · writing (2) · reading (4) · guestbook entries (2) and `guestbook.repo` · email, GitHub, LinkedIn, CV URL · `meta.ask` / `meta.mail` endpoint · contact note · confirm skills lists.

## 9. Deployment — GitHub Pages via GitHub Actions

The site is built and served from `dist/` at **https://aliemreo.github.io/aliemre-wiki/** by `.github/workflows/deploy.yml`, which runs on every push to `main`.

Rules:

- **The build is `npm ci && npm run build`**, nothing else: Vite client build, Vite SSR build, prerender (which also writes `sitemap.xml`, the `writing.xml` RSS feed and fills the JSON-LD `sameAs` from `meta.github`). Node 24 (`setup-node`), because the scripts import TypeScript directly. No Dockerfile, no other host config.
- Only `dist/` is published. `CLAUDE.md`, `README.md`, `.github/`, `docs/`, `src/` live in the repo but never reach the CDN. The repo is public, so do not put anything private anywhere in it.
- **The deploy is gated.** The `build` job runs preflight → typecheck → build → verify-dist before uploading; the `deploy` job is `needs: build`, so a failing check stops the release rather than reporting it afterwards. Pull requests run the same job through `preflight.yml`.
- Work on branches; merging to `main` is the release. To make a red check block a merge as well, protect `main` and require the `preflight` check.
- **The site is served from a subpath**, `/aliemre-wiki/`, not a domain root. `base: './'` in `vite.config.ts`, the relative redirect in `public/404.html` and `normalisePath()` keep everything base-agnostic. Keep it that way; it is also what makes a custom domain a one-line change later.
- One-time repo setting (done): **Settings → Pages → Source = "GitHub Actions"**. In branch mode GitHub would run Jekyll over the whole repo instead.
- HTTPS is automatic. GitHub Pages does not let you set cache headers; there is no server to configure, and none is wanted.

### 9.1 When a domain arrives

1. Add a `CNAME` file containing the domain to `public/`, and set the domain in **Settings → Pages**. GitHub issues the certificate.
2. At the registrar, point `www` at `aliemreo.github.io` with a CNAME; for the apex use ALIAS/ANAME, or GitHub's A records if the registrar has neither.
3. Mail: verify the domain in Resend (SPF + DKIM records at the registrar), set `MAIL_FROM` to an address on it, add the domain to `ALLOWED_ORIGINS`, redeploy the Worker.
4. Then update in `index.html`: `<link rel="canonical">`, `og:url`, `og:image`, `twitter:image`, the JSON-LD `url`; and `meta.updated` in `content.ts`. Uncomment the `Sitemap:` line in `public/robots.txt` if you add a `sitemap.xml`.
5. The base becomes `/` instead of `/aliemre-wiki/`. Nothing in the app needs to change for that; `sitemap.xml` follows the canonical URL automatically, and `robots.txt`'s `Sitemap:` line needs the new host.

### 9.2 Deploy checklist

- `npm run check` is green.
- Placeholder count in the preflight output is expected (or every remaining placeholder is intentional and listed in README).
- Both `?lang=en` and `?lang=tr` open without layout overflow at 360px (`npm run dev`).
- After deploy, run Lighthouse on the live URL (§6 targets).

There is no separate staging URL: GitHub Pages serves one site per repository. Preview a change with `npm run dev`, or `npm run build && npm run preview` for the prerendered result, or from a pull request where the checks run.

### 9.3 Preflight

`npm run preflight` (`scripts/preflight.mjs`) enforces §2 and §7 for the content: every `en` string has a `tr` sibling, and `meta.updated` was bumped when `content.ts` changed. It imports `src/content/content.ts` and `src/lib/contentReport.ts` directly, so the browser dev check and CI share one implementation; that is why those two files must stay free of runtime imports.

`npm run verify` (`scripts/verify-dist.mjs`) checks the build: the prerender is present and carries every section, the terminal was not prerendered, no `Placeholder:` and no `[[` token reached the HTML, the transfer budget holds, `404.html`, `favicon.svg`, `og.png`, `robots.txt`, `sitemap.xml`, `writing.xml` made it into `dist/`, at least eight woff2 files sit in `dist/fonts/` and nothing references Google Fonts, and it lists any linked term whose preview image is missing (a note, not a failure).

### 9.4 The ask endpoint (and mail)

`ask/` holds a Cloudflare Worker (`worker.mjs`) that answers the "ask me a question" field: it checks the `Origin` against `ALLOWED_ORIGINS`, throttles per IP (5 a minute, optional binding), caps the question at 300 characters, calls the Anthropic Messages API (`MODEL`, default `claude-haiku-4-5-20251001`, 600 tokens, streaming) with the last four turns of `history` as alternating messages, `knowledge.txt` as the knowledge base (the site map of section ids, project slugs and safe commands, then every knowledge file under a `=== id | title | href` header) plus fixed rules (first person, only from the files, say when unsure, under 120 words, never phone numbers, at most two `[[go|project|cmd:…]]` tokens, up to two `?? ` follow-ups), and streams the text back as `text/plain`. With `mode: 'debate'` it runs the debate of §5.14 instead (`debate.mjs`, `verify.mjs`, `characters.json`; `npm run ask:test` runs their unit tests). **Knowledge files:** `npm run ask:prompt` (`build-prompt.mjs`) generates `ask/knowledge/profile.md` from the English `CONTENT` (placeholders skipped, `[[tokens]]` flattened) and concatenates it with every other `ask/knowledge/*.md` — the owner's CV, project write-ups, code notes, each with front matter `id` (lowercase ASCII, the citation key), `title` (the chip label) and optional `href` (a `#section`/`#projects/<slug>` hash or a URL a reader can check) — into `ask/knowledge.txt`; it **fails** on a `Placeholder:` and on anything shaped like a phone number (nine digits or more), naming the file and line. Preflight notes when `knowledge.txt` is older than `content.ts` or a knowledge file. Deploy: `wrangler login`, `npm run ask:prompt`, `wrangler secret put ANTHROPIC_API_KEY`, `wrangler deploy` (all in `ask/README.md`), then set `meta.ask` and bump `meta.updated`. **The API key is a Worker secret and never appears in this repo**, which is public. The same Worker answers `POST /mail` (§5.13): honeypot and a 3s floor (accepted and dropped), its own `MAIL_LIMITER` (3 a minute per IP), address/length checks, CR/LF stripped, then Resend's REST API (`RESEND_API_KEY` secret) from `MAIL_FROM` (`onboarding@resend.dev` until a domain is verified, which only delivers to the Resend account's own address, hence `MAIL_TO`) with `reply_to` = the visitor. Setup in `ask/README.md` → Mail; with a domain, SPF/DKIM at the registrar and a new `MAIL_FROM` (§9.1). Nothing in `ask/` is built or served by Pages.
