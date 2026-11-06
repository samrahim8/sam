# samrahim.com

Sam Rahim's personal site. Static HTML, no framework. Live at https://www.samrahim.com (the apex `samrahim.com` redirects to `www`).

- Repo: `samrahim8/sam` on GitHub, branch `main`
- Hosting: Vercel project `sam-rahim-site`. **Every push to `main` deploys to production automatically.** Vercel runs `node build.mjs` first.

## Updating the homepage (the usual job)

All homepage copy lives in **`content.json`**. Edit that file, never the copy in `index.html`.

1. Edit `content.json`.
2. Run `node build.mjs`. It checks the copy rules, then writes the content into `index.html` and regenerates `llms.txt`. If it prints problems, fix them in `content.json` and run it again.
3. Preview if the layout could be affected: `python3 -m http.server 8000`, open http://localhost:8000.
4. Commit `content.json`, `index.html` and `llms.txt` together, then `git push origin main`.
5. Verify live after about a minute: `curl -sL https://www.samrahim.com | grep -F "<the new text>"`.

`node build.mjs --check` checks the copy and fails if `index.html` or `llms.txt` is out of date. Run it before pushing.

### What each field in content.json does

| Field | On the page |
|---|---|
| `meta.title`, `meta.description` | Browser tab title, search and link-preview text |
| `bio` | The paragraph under the name. Links are written `[text](https://url)` |
| `currentProjects[]` | "Current Projects" section, in order: `name`, `url`, `description` |
| `work[]` | "Work" section, newest first: `company`, `years` (use an en dash: `2021–2025`, `2026–now`), `title`, `description`, optional `link` `{label, url}`, optional `gallery` (only Street FC has one; the page has one gallery slot) |
| `education` | Line under Work |
| `personalEffects.intro` | First line of "Personal Effects" |
| `personalEffects.currently[]` | "Currently" list. Numbered automatically from 1 |
| `personalEffects.next[]`, `nextNote` | "Next on the list". Numbering continues after Currently; `nextNote` is the small line under it (optional) |
| `personalEffects.businessesAndProducts[]`, `watching[]` | Link lists: `name`, `url` |
| `contact.email`, `contact.linkedin` | Icon links at the bottom |

Text fields are plain text plus `[text](url)` links. No HTML, no markdown emphasis. Curly quotes and en dashes are fine as they are. A spaced ` + ` is kept on one line automatically.

An empty `currently`, `next`, `businessesAndProducts` or `watching` list hides that row.

## Copy rules

The build enforces the starred ones; the rest are on you.

- \* No em dashes (—), and no spaced hyphens used as dashes. Rewrite the sentence.
- \* No emojis. No exclamation marks.
- \* No italics or emphasis.
- No monospace text anywhere.
- When Sam gives you wording, use it word for word. Fix only what he names.
- Don't rewrite copy Sam didn't ask you to change, even on a "polish it" request.
- Don't add links, projects or sections he didn't ask for. He curates this site tightly; a project existing is not a reason to list it here.
- `+` is a mark, not a word. It only appears where it already is (the Provisions line and the Switchyards title). Use "and" in new copy.
- Plain, short, spoken sentences. No buzzwords, no narrator voice, no "Not X. Not Y. But Z." patterns.

## Settled decisions (don't re-propose)

- Every section starts closed.
- Current Projects is only The Extra Times, then Newspaper Department (The Performance Review was removed 2026-11-06).
- The Provisions line "I work with founders + operators across tech + soccer." is settled copy.
- Personal Effects items are real, honest things Sam is doing. Don't pad the lists or invent items. Ask him.
- Favicon is "SR" in Bungee, chalk on ink. Rejected: a newspaper glyph, a cream +, his portrait, Instrument Serif initials.

## Design changes

Layout, CSS and JS live in `index.html`. Everything between `<!-- build:NAME -->` and `<!-- /build:NAME -->` markers is generated from `content.json` and gets overwritten on every build. Edit outside the markers, or change the matching renderer in `build.mjs`.

- Palette "Pitch chalk": ground `#E6ECE3`, ink `#16261C`, soft `#4C5A4A`, accent `#2E6B45`; dark mode `#0F1A13` / `#E4EBE1` / `#7FB08E`.
- Fonts: Instrument Serif (headings) and Instrument Sans (body), from Google Fonts.
- Phone first. Check 390px wide before shipping a layout change.
- Section ids are deep-link targets: `#projects`, `#work`, `#personal-effects` (old `#arsenal` links are rewritten to `#personal-effects`).

## Other files

| Path | What it is |
|---|---|
| `api/arsenal-fixtures.js` | Vercel function that proxies ESPN fixtures for the Arsenal block |
| `updates.html`, `updates/*.html` | Updates list and posts. Hand-edited, still in the old cream design. A new post is a new file in `updates/` plus a card in `updates.html` |
| `archive.html`, `archive/` | Old designs, password-protected by `middleware.js` |
| `og-image.png` | Link-preview image (old design; `og-image.html` is its source) |
| `vercel.json` | Build command, clean URLs, redirects for retired pages (`/v2`, `/orlando`, `/next`) |
| `.vercelignore` | Repo-only files kept off the live site (this file, `CLAUDE.md`, `.claude/`) |
| `llms.txt` | Generated. Plain-text summary of the site for AI tools. Don't edit by hand |

## Don't

- Don't deploy with `vercel --prod` from this folder. It uploads untracked files (like `personal-effects-preview.html`). Push to `main` instead.
- Don't commit `personal-effects-preview.html`. It's a local scratch file.
- Don't push a build that fails `node build.mjs --check`. On Vercel a failing build stops the deploy and the site stays on the last good version, but `main` is then out of step with what's live.
