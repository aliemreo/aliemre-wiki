# CLAUDE.md — Ali Emre Özcan portfolio site

You are implementing and then maintaining a personal portfolio site for Ali Emre Özcan (final-year computer engineering student at İTÜ, ML intern at TAZI). This file is the contract for the repo. Read it fully before touching anything.

## 0. What is in this folder

- `CLAUDE.md` — this file.
- `reference/index v2.dc.html` (move to `docs/reference/` in the repo) — the approved design, as an interactive HTML prototype. It runs inside a design tool runtime (`support.js`, templating with `{{ }}`, `<sc-for>`, `<sc-if>`, a `DCLogic` class). **Do not ship this file.** Rebuild it as a plain static site; the prototype is the source of truth for look, behaviour, copy and data shape.
- `reference/index.dc.html` — earlier single-column variant. Reference only, lower priority.
- `reference/support.js` — the prototype runtime. Ignore except to understand template semantics.

Fidelity: **high**. Colours, type, spacing, motion timings and command behaviour in the prototype are final unless this file says otherwise.

## 1. Target stack (non-negotiable)

- One `index.html`, inline `<style>` and inline `<script>`. No framework, no bundler, no build step, no analytics, no external JS.
- Two Google Fonts, loaded with `display=swap`: IBM Plex Sans (400/500/600) and IBM Plex Mono (400/500).
- Must be fully readable and navigable with JavaScript disabled (plain anchors `#projects`, `#contact`…). With JS off the terminal simply does not render.
- Deploy target: **DigitalOcean App Platform, Static Site component, source = this GitHub repo.** See §9. No other host config for production; §9.3 adds a GitHub Pages mirror used for staging only.
- Also produce: `favicon.svg` (a `$` glyph, `#6FE3CF` on `#000`), `robots.txt`, `og.png` placeholder (1200×630).

Repo layout (served tree is `public/` only — see §9):

```
/
  .do/app.yaml          # DigitalOcean App Spec (production)
  .github/
    scripts/preflight.mjs   # the §9.2 checklist, enforced (§9.4)
    workflows/              # preflight on every PR; staging deploy from `preview`
  public/
    index.html          # everything: markup, CSS, JS, CONTENT
    404.html            # redirect shim; GitHub Pages only, DO ignores it
    favicon.svg
    og.png
    robots.txt
  docs/reference/       # the design prototype from this handoff (not served)
  CLAUDE.md
  README.md             # human-facing: how to update content, how deploys work
```

Keep `CONTENT` inside `index.html`. A separate JS file would add a request and break the "one file" rule.

## 2. This is a living site — design for updates

The owner updates this monthly (Now section), after every project, and when reading/writing lists grow. Every design decision must make that update a **data edit, never a markup edit**.

Rules:

1. **All copy lives in one `CONTENT` object** at the top of the script, bilingual: any user-visible string is either a plain string or `{ en: '…', tr: '…' }`. Rendering code resolves with one helper `L(v)`.
2. **Rendering is derived, never hand-written twice.** Sections render from `CONTENT` via small render functions. If you find yourself writing the same HTML for the second project, stop and loop.
3. **Nothing is hard-coded that could change**: dates, tags, command names, palette names, section order, guestbook repo. All come from constants near `CONTENT` (`TAGS`, `SECTIONS`, `PALETTES`, `TOOLS`).
4. **Placeholders are explicit.** Any unfinished copy starts with `Placeholder:`. Add a tiny dev check (runs only on `localhost`) that `console.warn`s every string still starting with `Placeholder:` so nothing ships by accident. Never invent real-sounding content to fill a placeholder.
5. **Adding an entry must be additive.** New project = append an object. New tag = append to `TAGS`. New tool = append a `{ names, usage, desc, example, run }` object. New palette = one CSS block + one entry in `PALETTES`. If any of these requires editing more than one place plus CSS, refactor.
6. **`meta.updated`** is the single "Last updated" source. Bump it on every content change. Do not derive it from `Date.now()`.
7. **Do not add sections without asking.** The section list is deliberate: `top, now, about, experience, projects, reading, writing, tools, skills, guestbook, contact, colophon`.
8. Keep the file human-editable: no minification, 2-space indent, one project per block, comments only where the data shape is not obvious.

### 2.1 Monthly update checklist (put this in README.md too)

- `CONTENT.now.text` (en + tr) and `CONTENT.now.date`
- new `reading` entries at the top of the array (newest first)
- `meta.updated`
- run the placeholder check; open the page with `?lang=tr` and `?lang=en` once each

## 3. Page structure

Two-column shell on ≥1024px: left column = the document (max-width 640px content, 20px side padding), right column = a sticky, full-height terminal (`clamp(360px, 36vw, 540px)` wide, pure `#000`). Below 1024px the terminal sits on top as a sticky header: log capped at 34vh (min 200px), banner hidden under 600px height.

Left column sections, in order (`<main>` > `<section id>`), all left-aligned:

| id | content |
|---|---|
| `top` | h1 name, one sentence on what he does, one on what he wants (placeholder), availability line with 8px accent dot, monospace section index (links) |
| `now` | dated paragraph; date shown at right of heading plate |
| `about` | 3–4 sentences prose |
| `experience` | departure-board rows (see §5.4) |
| `projects` | featured project on tinted panel, then rule-separated list; inline expandable detail; tag filter |
| `reading` | dated list, kind (paper/book/post), authors, one-line note, tags; tag filter |
| `writing` | date + title list |
| `tools` | list of terminal utilities, click pre-fills the prompt |
| `skills` | `<dl>` grouped; skill click → `projects <tag>` |
| `guestbook` | entries + small form (name, message, `echo` button) |
| `contact` | email (click copies), GitHub, LinkedIn, CV, preferred-contact note |
| `colophon` | 4 short lines |

Footer: "Last updated …", palette dots (8), theme toggle, language toggle, colophon link.

Semantic HTML: `header` (terminal on mobile is an `aside` with `aria-label="Terminal"`), `main`, `section`, `article`, `dl`, `footer`, real heading hierarchy (h1 name, h2 sections, h3 items).

## 4. Data shape (`CONTENT`)

Copy the object from the prototype verbatim as the starting point (search `const CONTENT = {` in `reference/index v2.dc.html`). Shape summary:

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
SECTIONS = ['top','now','about','experience','projects','reading','writing','tools','skills','guestbook','contact','colophon']
PALETTES = ['aqua','amber','mint','sky','rose','lime','violet','paper']
```

`slug` doubles as the command argument (`project churn`) and the URL (`#projects/churn`). Keep slugs lowercase ASCII.

## 5. Visual spec

### 5.1 Palettes and themes

Theme (`dark` default, `light`) × palette (`aqua` default). Implement as CSS custom properties on `<html data-theme data-palette>`. Copy every `html[data-palette=…]` and `html[data-theme="light"][data-palette=…]` block from the prototype's `<style>`; they are final. Core aqua dark:

```
--bg #0D1413  --ink #E4ECE9  --muted #889793  --rule #233230
--accent #6FE3CF  --accent-ink #0B1917  --tint #132925
--bar #111917 (plates)  --bar-ink #E4ECE9  --bar-muted #74837F
--prompt #6FE3CF  --tok-cmd #6FE3CF  --tok-arg #F0C674  --tok-err #FF7B6B  --tok-ok #A6E3A1
```
Light aqua: `--bg #F2F7F6 --accent #0B7A6C --accent-ink #fff --tint #D9EFEA --rule #D0DCD9`, error/ok become `#B3261E / #2E6B2A` for AA contrast.

Terminal background is always `#000` regardless of theme/palette. `::selection` = accent on accent-ink.

**No flash of wrong theme:** an inline `<script>` in `<head>` reads `localStorage` keys `aeo-theme-v2`, `aeo-palette`, `aeo-lang` and sets the `<html>` attributes before first paint. Default theme dark, palette aqua, language from `navigator.language` (tr → tr, else en).

### 5.2 Background (left column only)

Default `bgMode = scan`: `::after` overlay with `repeating-linear-gradient(to bottom, transparent 0 3px, rgba(0,0,0,.2) 3px 4px)` (light: `.045`), plus a very faint radial vignette (`--bg` to `color-mix(--bg, black 10%)`). Under it a procedural grain `::before` (SVG `feTurbulence` data URI, `baseFrequency .9`, 220px tile, opacity `.055`, light theme inverted at `.08`). Nothing animates. Hidden in print.

Ship only `scan` and `flat` (grain only) as `bgMode`; drop the other experimental modes from the prototype (`granite`, `paper`, `mesh`, `halftone`, `dither`, `metal`, `dual`, `dots`, `vignette`, `glow`, `spot`) unless the owner asks. Expose as `bg scan|flat` terminal command, remembered in `localStorage` `aeo-bg`.

### 5.3 Type and rhythm

- Body: IBM Plex Sans 17px / 1.55, `text-wrap: pretty`, `-webkit-font-smoothing: antialiased`.
- h1: 2rem / 600 / 1.2 / letter-spacing −0.01em; on hover or focus swaps to the pixel-font rendering of "ALİ EMRE ÖZCAN" (7px mono, accent). Container `min-height 64px` so nothing jumps.
- Section heading plates (§5.5): 13px / 600 / uppercase / letter-spacing .14em.
- Mono (IBM Plex Mono) only for: terminal, chips, tags, stack strings, section index, dates in boards, code-like labels. 12–13.5px.
- Links: accent, underline offset 3px, underline colour `--rule` → accent on hover. Transitions 150ms on colour only.
- Section spacing: `padding-top 40px`; list items `padding 14–20px 0` with `border-bottom 1px solid --rule`.
- Left label column (`dates`, `dt`, contact labels): `flex: 0 0 140px`, 14px muted; wraps under content below ~480px because the row is `flex-wrap: wrap` with the content at `flex: 1 1 300px`.
- Featured project: `background --tint; padding 24px; border-radius 4px`, no border.
- Never: gradients as decoration, drop shadows, cards with identical rounded corners, numbered section markers, arrows after links, icons for skills, hero stats.

### 5.4 Experience as a departure board

Each entry row: left column shows the year in split-flap cells (`board`, e.g. `2026`) above the human date range; title row has the status in split-flap cells right-aligned (`NOW` / `UNTIL 2027` / `PAST`; Turkish `DEVAM` / `2027’YE DEK` / `GEÇMİŞ`). These cells are static (no animation), 11–12px mono, `--bar-ink` on `color-mix(--bar, white 7%)`.

### 5.5 Section headings: enamel station plates with split-flap letters

Plate: `background --bar; border 1px solid --rule; border-radius 2px; outline 1px solid color-mix(--rule 70%, transparent); outline-offset −5px; padding 9px 14px 9px 16px; min-height 44px; display flex; align-items center; justify-content space-between`. Right side holds the section's kilim motif (26px, accent, opacity .85) and, where relevant, the date (`now`) or the active filter + `clear` (`projects`, `reading`).

Letters: each character is a cell `inline-flex; min-width 1.35em; height 1.9em; background color-mix(--bar, white 7%); border-radius 2px; overflow hidden` with a 1px `rgba(0,0,0,.55)` line at 50% height (the flap seam). Spaces are transparent cells of `.5em`. Cells are separated by `gap: 2px`.

Behaviour (scroll-driven, once per heading):
- Before a heading enters the viewport its letters show random characters from `' ABCDEFGHIJKLMNOPQRSTUVWXYZÇĞİÖŞÜ0123456789·–&'` (spaces stay spaces).
- Progress `p = clamp((innerHeight − headingTop) / (innerHeight × 0.55), 0, 1)` on scroll (rAF-throttled).
- Letter *i* of *n* settles when `p ≥ 0.35 + (i/(n−1)) × 0.6`; before that it shows `CHARS[(seed_i + floor(p×40) + i×3) % len]`.
- At `p ≥ 1` the heading is marked done and never animates from scroll again.
- Every character change re-mounts the cell (key = `index:char`) which plays `flapin`: `rotateX(−90deg) → 12deg → 0`, 160ms, `cubic-bezier(.3,.7,.3,1)`, brief `brightness(1.6)` at start; parent has `perspective: 260px`.
- Timed re-flip (40ms per step, 1.5-step stagger per letter) when the board text changes for another reason: projects filter (`PROJECTS · ML`), reading filter, language switch.
- `prefers-reduced-motion`: no scrambling, no flip; letters static. Print: plain text, plate becomes a 1px bottom rule.

Heading text per language is the plain section name; uppercase with `toLocaleUpperCase('tr')` when in Turkish (İ/ı correctness).

### 5.6 Kilim motifs

Six motifs as 13×13 pixel grids rendered as SVG data-URI masks over `--accent` (copy the grid strings from the prototype: `goz, elibelinde, kocboynuzu, yildiz, pitrak, suyolu`). Mapping: now→suyolu, about→elibelinde, experience→kocboynuzu, projects→yildiz, reading→pitrak, writing→suyolu, tools→kocboynuzu, skills→pitrak, guestbook→goz, contact→goz. Each has `role="img"`, `aria-label` and `title` = "name — meaning (tr / en)". Hidden in print.

### 5.7 Terminal (right column)

Layout top→bottom: status line (`ali@site ~/section` left, keyboard hint right, hidden < 480px), scrolling log (`role="log" aria-live="polite"`), context chips, prompt row (`$` + input, 50px tall, top border turns accent on focus).

- Banner: on first load per `sessionStorage` (`aeo-banner`), "ALI EMRE" / "OZCAN" in the 5×6 pixel font inside a thin bordered box, 9px mono, rows tinted accent→muted top to bottom, pixels appear in random order over ~1.1s (`step = ceil(total/70)` per 16ms). Reduced motion or repeat visit: instant. Followed by the welcome text (`UI.welcome`).
- Input text is transparent; a mirror span renders it with syntax colours: first word `--tok-cmd` (or `--tok-err` if it is not a known command prefix), rest `--tok-arg`, then a 9×17px blinking block cursor (`blink 1.1s steps(1)`), then a muted hint (`type help, or press ?`, or the hover-ghost command).
- Every executed command is appended to the log as `$ cmd args` + output. Output is typed in (≈40 frames, 16ms) unless reduced motion. Output colour: red for errors (`command not found`, `no …`, `usage`), green for confirmations (`→ …`, `copied`, `theme`, `language`), otherwise `--bar-ink`.
- Chips: monospace pills, 12px, `1px --rule` border, active = accent fill with `--accent-ink` text. Default set: `projects, about, contact email, theme dark|light, palette, help`; while the projects section is in view they become `all + TAGS` filters; while reading is in view, the same for reading.
- Hover ghost: hovering a section or a project on the left shows the corresponding command as a hint in the prompt; Enter runs it, Tab copies it into the input. The `~/path` in the status line follows the hovered/scrolled section.
- Every left-side interaction goes through `exec()` so it is logged: project title → `project <slug>`, tag → `projects <tag>`, skill → `projects <tag>`, footer toggles → `theme` / `lang`, email → `contact email`, section index → `<section>`.

### 5.8 Command set

Keyboard: `/` focuses from anywhere, `?` prints help and focuses, `Esc` blurs (or closes the open project), `↑/↓` history, `Tab` completion (command names; after a command its arguments; after `|` pipeline stage names), `Enter` runs input or the ghost hint.

Commands (English name first, Turkish alias second; both always work regardless of UI language):

```
help/yardım/?         projects/projeler [tag|all]     project/proje <slug>
now/şimdi  about/hakkında  experience/deneyim  reading/okuma [tag|all]
writing/yazılar  tools/araçlar  echo/guestbook/defter [message]
skills/yetenekler  contact/iletişim [email|github|linkedin|cv]  cv
theme/tema [light|dark]  palette/color/renk [name]  lang/dil [en|tr]
bg [scan|flat]  back/geri  top/başa  colophon/kolofon
history/geçmiş  clear/temizle  pipes/borular
hidden: ls, whoami, sudo, rm, exit/quit/çıkış, vim/vi/nano/emacs  (dry one-liners, see prototype MSG)
tools (hidden from help, listed by `tools`): tokens <text>, tr <text>, cron <expr>, ts [n|date], calc <expr>
```

Unknown command → `command not found: x — did you mean y?` using Levenshtein ≤ 2 or prefix match over all names.

Pipes: any line containing `|`. Sources: `projects reading skills experience writing history tools ls` (Turkish aliases accepted). Stages: `grep [-v] <re>`, `where <field><op><value>` (`= != > < >= <= ~`), `sort [field] [-r]`, `uniq [-c]`, `head n`, `tail n`, `count`, `tags`, `stack`, `fields a,b`, `json`, `first`, `last`, `shuf`, `rev`. Output ≤ 200 rows. Copy `rowText`, `STAGES`, `sourceRows`, `pipeline` from the prototype; they are small and tested.

Routing: `#<section>`, `#projects/<tag>`, `#projects/<slug>`, `#reading/<tag>`. Use `history.replaceState`. On load, apply the hash after fonts settle (~150ms) with instant scroll; afterwards smooth scroll (instant under reduced motion). Scroll offset accounts for the sticky terminal height on narrow screens only.

Guestbook: `echo name: message` or the form. Entry appears immediately with "awaiting review". If `CONTENT.guestbook.repo` is a real repo, open `https://github.com/<repo>/issues/new?title=guestbook: <name>&body=<message>`; owner publishes by copying approved issues into `guestbook.entries`. No backend.

### 5.9 Motion inventory (complete list — add nothing else)

cursor blink · output typing · banner pixel reveal · split-flap scroll reveal and re-flip · project detail expand (`opacity 0→1, translateY −4px→0`, 250ms ease-out) · section reveal on first scroll (`opacity 0→1, translateY 14px→0`, 600ms) · hover colour transitions 150ms. All disabled under `prefers-reduced-motion` except colour transitions.

## 6. Quality floor (verify before every deploy)

- 320px → 2560px without horizontal scroll; Turkish strings do not overflow plates or boards (long words wrap: `flex-wrap` on cells).
- Keyboard: every interactive element reachable, visible focus (`2px solid --accent`, offset 2px). Prompt input has `aria-label`. Log is `aria-live="polite"`.
- WCAG AA on both themes for body text; large-heading 3:1 minimum.
- JS off: full page readable, index links work, no empty boxes where the terminal would be (render the `<aside>` only from JS).
- `<title>`, meta description, Open Graph, Twitter card, JSON-LD `Person`, `favicon.svg`.
- Print: hides terminal, chips, forms, tools, guestbook, colophon, motifs, backgrounds; plates become rules; black text on white; fits 1–2 pages.
- Lighthouse: performance ≥ 95, a11y 100. Total transfer without fonts < 120 KB.
- No `console.error`; the placeholder warning is the only allowed `console.warn`, on localhost only.

## 7. How to work in this repo (for Claude Code)

- Small change requested → change only that; do not reflow, rename or "improve" nearby code.
- Content request ("add project X", "update Now") → edit `CONTENT` only, bump `meta.updated`, run the placeholder check. Never touch markup for content.
- New feature → first check it can be expressed as data + one render function + (optionally) one command. If it needs a new section, ask.
- Keep both languages in sync; never add an `en` string without its `tr` sibling (a `Placeholder:` Turkish string is acceptable temporarily).
- Commit messages: `content: …`, `design: …`, `terminal: …`, `fix: …`.
- Before opening a PR: open `index.html` from `file://` (no server) and confirm it works; that is the deploy reality.

## 9. Deployment — DigitalOcean App Platform via GitHub

Create `.do/app.yaml` in the repo root so the app is reproducible (App Spec). Replace `OWNER/REPO`; leave `domains` commented until the domain is known.

```yaml
name: aliemreozcan-site
region: fra
static_sites:
  - name: site
    github:
      repo: OWNER/REPO
      branch: main
      deploy_on_push: true
    source_dir: /public
    output_dir: /
    index_document: index.html
    error_document: index.html      # hash routes never 404, but keep it
    catchall_document: index.html
    routes:
      - path: /
# domains:
#   - domain: example.com
#     type: PRIMARY
#   - domain: www.example.com
#     type: ALIAS
```

Rules:
- **No build command.** There is nothing to build; `output_dir: /` serves the repo as-is. If App Platform's autodetect asks for one, leave it empty.
- Only `public/` is served (`source_dir: /public`). `CLAUDE.md`, `README.md`, `.do/`, `docs/` never reach the CDN. Do not put anything private in `public/`.
- Static sites on App Platform are free tier (3 per account); no Dockerfile, no `package.json`. Do not add either.
- `deploy_on_push: true` on `main`. Work on branches; merging to `main` is the release.
- Caching: App Platform serves static files behind its CDN with reasonable defaults. Do not add cache headers via a server; there is none. Font files come from Google Fonts CDN.
- HTTPS is automatic (Let's Encrypt) once a domain is attached.

### 9.1 When the domain arrives

1. Uncomment `domains` in `.do/app.yaml`, set the apex as `PRIMARY` and `www` as `ALIAS`; push.
2. At the registrar, add the CNAME/A records App Platform shows in Settings → Domains (usually a CNAME to `<app>.ondigitalocean.app`; for the apex use DigitalOcean DNS or ALIAS/ANAME if the registrar supports it).
3. Then update in `index.html`: canonical `<link rel="canonical">`, `og:url`, JSON-LD `url`, `robots.txt` `Sitemap:` line (add a one-URL `sitemap.xml` if you want), and `meta.updated`.
4. Verify `https://www.` redirects to the apex (App Platform handles this for ALIAS domains) and that `curl -I` returns `200` with `content-type: text/html; charset=utf-8`.

Until then the site is live at `https://<app-name>-<hash>.ondigitalocean.app`; keep `og:url` pointing there temporarily so shared links unfurl.

### 9.2 Deploy checklist

- `public/index.html` opens from `file://` and works.
- Placeholder check prints nothing on the release build (or every remaining placeholder is intentional and listed in README).
- Both `?lang=en` and `?lang=tr` open without layout overflow at 360px.
- After deploy, run Lighthouse on the live URL (§6 targets).

### 9.3 Staging on GitHub Pages

**Production is DigitalOcean and nothing here changes that.** GitHub Pages is a
free mirror of the same `public/` directory, deployed from a `preview` branch by
`.github/workflows/staging.yml`, so a change can be looked at before it is merged
to `main`.

- Staging exists because DO's `deploy_on_push: true` cannot be gated: it fires
  whether or not CI passed. The Pages job runs `needs: preflight`, so a broken
  build never reaches the staging URL.
- A Pages project site is served from `/<repo>/`, not the domain root. Nothing
  may assume a root base: `public/404.html` redirects relatively and
  `normalisePath()` measures against whatever the base is.
- The staging artifact gets `Disallow: /` written into its `robots.txt` at deploy
  time. The committed `robots.txt` is never modified, and `canonical`, `og:url`
  and the JSON-LD `url` continue to point at production.
- Do not add anything to `public/` that is only meaningful on one of the two
  hosts, apart from `404.html`, which DO ignores by design.

### 9.4 Preflight

`node .github/scripts/preflight.mjs` enforces what §9.2 and §2 describe: the
`<noscript>` mirror is in sync, every `en` string has a `tr` sibling,
`meta.updated` was bumped when `CONTENT` changed, and the page is under budget.

The content rules live **inside `public/index.html`**, between the
`preflight:start` and `preflight:end` markers, so the browser dev check (§2.4)
and CI share one implementation. That region must stay free of the DOM and of
the file's other globals — it is evaluated in `node:vm`. Zero dependencies; the
"no `package.json`" rule in §9 still holds.

## 8. Open placeholders at handoff

Hero line 2 and availability · Now paragraph · About · TAZI bullets (3) · thesis line · third experience entry (or delete) · projects churn/toolbench/kvstore/survey copy, write-ups and links · writing (2) · reading (4) · guestbook entries (2) and `guestbook.repo` · email, GitHub, LinkedIn, CV URL · contact note · confirm skills lists.
