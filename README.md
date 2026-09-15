# aliemreozcan-site

Personal site for Ali Emre Özcan. One static page, no framework, no build step.
The design contract lives in [`CLAUDE.md`](CLAUDE.md); this file is the day-to-day
operating manual.

```
/
  .github/
    scripts/preflight.mjs    the checks, run by CI and by you
    workflows/deploy.yml     main -> GitHub Pages, gated on preflight
    workflows/preflight.yml  the same checks on every pull request
  public/               the only files that are served
    index.html          markup, CSS, JS and all CONTENT, in one file
    404.html            redirect shim: /projects -> /#projects
    favicon.svg         $ glyph
    og.png              1200x630 social card
    robots.txt
  docs/reference/       the design prototype this was rebuilt from (never served)
  CLAUDE.md             the contract
  README.md             this file
```

## Running it locally

Double-click `public/index.html`, or `open public/index.html`. There is no server,
no `npm install`, no build. `file://` is the deploy reality — if it works there it
works in production.

Two dev checks run **only** on `localhost`, `127.0.0.1` and `file://`, and print to
the console:

- every string in `CONTENT` that still starts with `Placeholder:`
- every English `CONTENT` string missing from the `<noscript>` mirror (see below)

Neither ever runs on the deployed site.

## Preflight

```
node .github/scripts/preflight.mjs
```

Zero dependencies, no `npm install`. It runs on every pull request and on every
every push to `main` as the first job of the deploy, which cannot publish
without it.

The content rules live **inside `public/index.html`**, between the
`preflight:start` and `preflight:end` markers, so the browser dev check and CI
run one implementation. Keep that region free of the DOM and of the file's other
globals, or the script cannot evaluate it.

| it fails when | fix |
|---|---|
| a `CONTENT` string is missing from the `<noscript>` mirror | paste the string into the `<noscript>` block; the message lists exactly which |
| an `en` string has no `tr` sibling | add the Turkish. A `Placeholder:` Turkish string is fine for now; a missing one is not. The message gives the path, e.g. `writing[1].title` |
| `CONTENT` changed but `meta.updated` did not | bump `meta.updated`. A CSS- or code-only change does not trigger this — only the marked region is compared |
| `public/index.html` exceeds 60 KB gzipped | something large got pasted in. It is 38 KB today |

The placeholder count is reported, never fatal — CLAUDE.md §8 says they are
intentional at handoff.

## Updating the content

**All copy lives in the `CONTENT` object** near the top of the `<script>` in
`public/index.html`. Every user-visible string is either a plain string or an
`{ en, tr }` pair. Never edit markup to change words.

### Monthly checklist

1. `CONTENT.now.text` (en + tr) and `CONTENT.now.date`
2. new `reading` entries at the **top** of the array (newest first)
3. `CONTENT.meta.updated`
4. open the page and check the console for placeholder warnings
5. open it once with `?lang=tr` and once with `?lang=en`

### Adding things

| what | how |
|---|---|
| a project | append an object to `CONTENT.projects`. `slug` must be lowercase ASCII — it doubles as the `project <slug>` command and the `#projects/<slug>` URL |
| a reading entry | prepend to `CONTENT.reading` |
| a post | append to `CONTENT.writing` |
| a guestbook entry | copy an approved issue from `CONTENT.guestbook.repo` into `CONTENT.guestbook.entries` |
| a tag | append to `TAGS`. Filters, chips and pipes pick it up automatically |
| a terminal tool | append a `{ names, usage, desc, example, run }` object to `TOOLS`. It becomes a command, a row in the Tools section and a row in the `tools` pipe source |
| a palette | one `html[data-palette="x"]` block, one `html[data-theme="light"][data-palette="x"]` block, one entry in `PALETTES`. The footer dot reads its colour from the CSS |
| a section | **ask first.** One row in `SECTION_DEFS` (id, motif, label, fill) + one `fill…()` function + a `UI` label in both languages + a command. `SECTION_DEFS` is the only section list — the DOM, plates, motifs, section index and `ls` all derive from it |

Do not add sections without asking — the list in `SECTIONS` is deliberate.

Keep both languages in sync. A `Placeholder:` Turkish string is acceptable
temporarily; a missing one is not.

### The `<noscript>` mirror

The document is rendered from `CONTENT` by JavaScript, so `public/index.html`
carries a static `<noscript>` copy of the same text: that is what a visitor without
JavaScript reads. It is the one place any string is written twice.

When you change document copy, update the `<noscript>` block to match. The
localhost check tells you exactly which strings drifted. Terminal copy, `UI`
labels and `CONTENT.meta` are not mirrored and are not checked.

## Deploying

GitHub Pages, from `main`, by GitHub Actions. Live at
**https://aliemreo.github.io/aliemre-wiki/**

```
git push origin main      # runs preflight, then publishes if it passes
```

`.github/workflows/deploy.yml` runs the checks first and the `deploy` job is
`needs: preflight`, so a failure stops the release instead of reporting it after
the fact. Pull requests run the same checks through `preflight.yml`; to make a
red check block a merge too, protect `main` and require it.

One-time setup: repo **Settings → Pages → Source = "GitHub Actions"**.

There is **no staging URL** — GitHub Pages serves one site per repository.
Preview a change by opening `public/index.html` from `file://`, which is the
deploy reality anyway, or from a pull request.

The site is served from `/aliemre-wiki/`, not a domain root. Nothing assumes a
root base: `public/404.html` redirects relatively and `normalisePath()` measures
against whatever the base is, so attaching a custom domain later changes nothing
in the page.

### Before every deploy

- `public/index.html` opens from `file://` and works
- the placeholder warning is empty, or every remaining placeholder is intentional
  and listed below
- `?lang=en` and `?lang=tr` both open without horizontal overflow at 360px
- after deploy, run Lighthouse on the live URL (performance ≥ 95, a11y 100)

### When the domain arrives

1. Put a `CNAME` file containing the domain in `public/`, and set the domain in
   **Settings → Pages**. GitHub issues the certificate.
2. At the registrar: `www` as a CNAME to `aliemreo.github.io`; for the apex use
   ALIAS/ANAME, or GitHub's A records if the registrar supports neither.
3. In `public/index.html` update `<link rel="canonical">`, `og:url`, `og:image`,
   `twitter:image`, the JSON-LD `url`, and `CONTENT.meta.updated`. Uncomment the
   `Sitemap:` line in `robots.txt` if you add a `sitemap.xml`.
4. Check `curl -I` returns `200` with `content-type: text/html; charset=utf-8`.

## The terminal

Everything the command bar does is also reachable by scrolling and clicking.
`help` lists the commands; every command has a Turkish alias and both always work
regardless of the interface language. `pipes` explains the query syntax
(`projects | stack | uniq -c`).

Hovering anything in the left column shows the matching command as a ghost in the
prompt: Enter runs it, Tab copies it into the input.

Worth knowing:

- `search <text>` greps projects, reading, writing, skills, experience, tools and
  the page prose in one go — `search kilim`, `search agent`
- `share` copies a link to whatever is on screen, filter and open project included
- `print` settles the headings and opens the print dialogue (terminal, forms,
  tools, guestbook and colophon are left out of the paper version)

`public/404.html` catches any path GitHub Pages does not recognise and sends it to
the page with the last segment as a hash, so `/aliemre-wiki/projects` opens the
projects section. Anything unrecognised lands at the top.

State remembered in `localStorage`: `aeo-theme-v2`, `aeo-palette`, `aeo-lang`,
`aeo-bg`. The banner is shown once per tab session (`aeo-banner`, `sessionStorage`).

## Open placeholders

Everything below still needs real copy. The localhost check lists them all.

- hero line 2 and the availability line
- the Now paragraph
- About
- TAZI bullets (3), the thesis line, the third experience entry (or delete it)
- projects `churn`, `toolbench`, `kvstore`, `survey`: copy, write-ups and links
- writing (2 entries), reading (4 entries)
- guestbook entries (2) and `CONTENT.guestbook.repo`
- `meta.email`, `meta.github`, `meta.linkedin`, `meta.cv`
- the contact note
- confirm the skills lists

`og.png` is a generated placeholder card; replace it with a real 1200×630 image
when there is one.
