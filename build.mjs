#!/usr/bin/env node
// Renders content.json into the marked regions of index.html and writes llms.txt.
//
//   node build.mjs          check the copy, then write index.html + llms.txt
//   node build.mjs --check  check the copy and fail if index.html or llms.txt is out of date
//
// Vercel runs `node build.mjs` on every deploy (vercel.json), so a copy rule
// failure stops the deploy and the live site stays on the last good version.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(fileURLToPath(import.meta.url));
const CHECK = process.argv.includes('--check');
const content = JSON.parse(readFileSync(join(root, 'content.json'), 'utf8'));

// ── Copy rules ────────────────────────────────────────────────────────────
const problems = [];
const where = [];

function lint(text, path) {
  if (typeof text !== 'string' || !text.trim()) { problems.push(`${path}: missing or empty`); return; }
  const prose = text.replace(/\]\([^)]*\)/g, ']'); // ignore link URLs
  if (/—/.test(prose)) problems.push(`${path}: em dash (—). Rewrite the sentence; no em dashes anywhere.`);
  if (/\s-\s/.test(prose)) problems.push(`${path}: spaced hyphen used as a dash. Rewrite the sentence.`);
  if (/\p{Extended_Pictographic}/u.test(prose)) problems.push(`${path}: emoji. No emojis in site copy.`);
  if (/<\/?[a-z]/i.test(prose)) problems.push(`${path}: raw HTML. Write plain text; links are [text](https://url).`);
  if (/(^|[\s(])(\*|_)[^*_\s][^*_]*\2(?=[\s.,!?)]|$)/.test(prose)) problems.push(`${path}: italics/emphasis markup. No italics in site copy.`);
  if (/!/.test(prose.replace(/\[[^\]]*\]/g, ''))) problems.push(`${path}: exclamation mark. Keep the voice plain.`);
}
function lintUrl(url, path) {
  if (typeof url !== 'string' || !/^(https?:\/\/|mailto:)/.test(url)) problems.push(`${path}: needs a full https:// URL`);
}
function lintLinksIn(text, path) {
  for (const m of (text || '').matchAll(/\[([^\]]*)\]\(([^)]*)\)/g)) lintUrl(m[2], `${path} link "${m[1]}"`);
}

const c = content;
lint(c.meta?.title, 'meta.title');
lint(c.meta?.description, 'meta.description');
lint(c.bio, 'bio'); lintLinksIn(c.bio, 'bio');
(c.currentProjects || []).forEach((p, i) => {
  lint(p.name, `currentProjects[${i}].name`); lintUrl(p.url, `currentProjects[${i}].url`); lint(p.description, `currentProjects[${i}].description`);
});
let galleries = 0;
(c.work || []).forEach((w, i) => {
  for (const k of ['company', 'years', 'title', 'description']) lint(w[k], `work[${i}].${k}`);
  if (w.link) { lint(w.link.label, `work[${i}].link.label`); lintUrl(w.link.url, `work[${i}].link.url`); }
  if (w.gallery) { galleries++; w.gallery.forEach((g, j) => { lint(g.src, `work[${i}].gallery[${j}].src`); lint(g.alt, `work[${i}].gallery[${j}].alt`); }); }
});
if (galleries > 1) problems.push('work: only one entry can have a gallery (the page has one montage slot).');
if (c.featureImage) {
  const f = c.featureImage;
  lint(f.src, 'featureImage.src'); lint(f.alt, 'featureImage.alt');
  if (!(f.width > 0 && f.height > 0)) problems.push('featureImage: needs width and height in pixels');
  else if (!existsSync(join(root, f.src.replace(/^\//, '')))) problems.push(`featureImage.src: ${f.src} not found in the repo`);
}
lint(c.education, 'education');
const pe = c.personalEffects || {};
lint(pe.intro, 'personalEffects.intro');
(pe.currently || []).forEach((t, i) => lint(t, `personalEffects.currently[${i}]`));
(pe.next || []).forEach((t, i) => lint(t, `personalEffects.next[${i}]`));
if (pe.nextNote) lint(pe.nextNote, 'personalEffects.nextNote');
for (const key of ['businessesAndProducts', 'watching']) {
  (pe[key] || []).forEach((l, i) => { lint(l.name, `personalEffects.${key}[${i}].name`); lintUrl(l.url, `personalEffects.${key}[${i}].url`); });
}
if (!/^[^@\s]+@[^@\s]+\.[a-z]+$/i.test(c.contact?.email || '')) problems.push('contact.email: not an email address');
lintUrl(c.contact?.linkedin, 'contact.linkedin');

if (problems.length) {
  console.error(`content.json has ${problems.length} problem(s):\n  - ` + problems.join('\n  - '));
  process.exit(1);
}

// ── Rendering ─────────────────────────────────────────────────────────────
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const ext = (url) => /^https?:/.test(url) ? ' target="_blank" rel="noopener"' : '';
// Plain text with [text](url) links. " + " keeps its neighbours on the same line.
const inline = (s) => esc(s)
  .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, u) => `<a href="${u}"${ext(u)}>${t}</a>`)
  .replace(/ \+ /g, '&nbsp;+&nbsp;');
const plain = (s) => String(s).replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '$1');
const ARROW = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const pad = (n) => ' '.repeat(n);

const regions = {
  meta: () => [
    `<title>${esc(c.meta.title)}</title>`,
    `<meta name="description" content="${esc(c.meta.description)}">`,
    `<meta property="og:title" content="${esc(c.meta.title)}">`,
    `<meta property="og:description" content="${esc(c.meta.description)}">`,
  ].join('\n' + pad(2)),

  bio: () => `<p class="bio">${inline(c.bio)}</p>`,

  feature: () => {
    const f = c.featureImage;
    if (!f) return '';
    return `<figure class="feature"><img src="${esc(f.src)}" alt="${esc(f.alt)}" width="${f.width}" height="${f.height}" decoding="async" fetchpriority="high"></figure>`;
  },

  projects: () => {
    const rows = c.currentProjects.map((p) => [
      `${pad(16)}<div class="role">`,
      `${pad(18)}<a class="project-link" href="${esc(p.url)}"${ext(p.url)}>${esc(p.name)}</a>`,
      `${pad(18)}<p class="role-desc">${inline(p.description)}</p>`,
      `${pad(16)}</div>`,
    ].join('\n'));
    return `<div class="roles">\n${rows.join('\n')}\n${pad(14)}</div>`;
  },

  work: () => {
    const rows = c.work.map((w) => {
      const out = [
        `${pad(16)}<div class="role">`,
        `${pad(18)}<div class="role-head"><span class="role-co">${esc(w.company)}</span><span class="role-years">${esc(w.years)}</span></div>`,
        `${pad(18)}<p class="role-title">${inline(w.title)}</p>`,
        `${pad(18)}<p class="role-desc">${inline(w.description)}</p>`,
      ];
      if (w.link) out.push(`${pad(18)}<a class="more" href="${esc(w.link.url)}"${ext(w.link.url)}>${esc(w.link.label)} ${ARROW}</a>`);
      if (w.gallery) {
        out.push(`${pad(18)}<div class="montage" id="montage">`);
        w.gallery.forEach((g, i) => out.push(`${pad(20)}<img data-src="${esc(g.src)}" alt="${esc(g.alt)}"${i === 0 ? ' class="active"' : ''}>`));
        out.push(`${pad(18)}</div>`);
      }
      out.push(`${pad(16)}</div>`);
      return out.join('\n');
    });
    return `<div class="roles">\n${rows.join('\n')}\n${pad(14)}</div>\n${pad(14)}<p class="edu"><strong>Education</strong> &nbsp;${esc(c.education)}</p>`;
  },

  'personal-effects': () => {
    const out = [`<p class="collection-intro">${inline(pe.intro)}</p>`];
    const numbered = (id, heading, items, start, note) => {
      if (!items || !items.length) return;
      out.push(`<section class="collection-row" aria-labelledby="${id}">`);
      out.push(`${pad(2)}<h3 id="${id}">${heading}</h3>`);
      out.push(`${pad(2)}<ol class="current-list numbered"${start > 1 ? ` start="${start}"` : ''}>`);
      items.forEach((t, i) => out.push(`${pad(4)}<li><span class="n" aria-hidden="true">${start + i}</span>${inline(t)}</li>`));
      out.push(`${pad(2)}</ol>`);
      if (note) out.push(`${pad(2)}<p class="list-note">${inline(note)}</p>`);
      out.push(`</section>`);
    };
    const links = (id, heading, items) => {
      if (!items || !items.length) return;
      out.push(`<section class="collection-row" aria-labelledby="${id}">`);
      out.push(`${pad(2)}<h3 id="${id}">${heading}</h3>`);
      out.push(`${pad(2)}<ul class="creator-list">`);
      items.forEach((l) => out.push(`${pad(4)}<li><a href="${esc(l.url)}"${ext(l.url)}>${esc(l.name)}</a></li>`));
      out.push(`${pad(2)}</ul>`);
      out.push(`</section>`);
    };
    const cur = pe.currently || [];
    numbered('currently-heading', 'Currently', cur, 1);
    numbered('next-heading', 'Next on the list', pe.next, cur.length + 1, pe.nextNote);
    links('businesses-heading', 'Businesses &amp; Products', pe.businessesAndProducts);
    links('reading-heading', 'Watching', pe.watching);
    return out.join('\n' + pad(14));
  },

  contact: () => [
    `<nav class="links" aria-label="Contact">`,
    `  <a href="mailto:${esc(c.contact.email)}" aria-label="Email ${esc(c.contact.email)}">`,
    `    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="M3.5 6l8.5 7 8.5-7"/></svg>`,
    `  </a>`,
    `  <a href="${esc(c.contact.linkedin)}" target="_blank" rel="noopener" aria-label="LinkedIn">`,
    `    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="1.5"/><path d="M8 10.5V17M8 7.25v.01M12 17v-6.5M12 13.5c0-1.7 1-3 2.5-3S17 11.8 17 13.5V17"/></svg>`,
    `  </a>`,
    `</nav>`,
  ].join('\n' + pad(4)),
};

const htmlPath = join(root, 'index.html');
const before = readFileSync(htmlPath, 'utf8');
let html = before;
for (const [name, render] of Object.entries(regions)) {
  const re = new RegExp(`(<!-- build:${name} -->\\n)([ ]*)[\\s\\S]*?\\n([ ]*)(<!-- /build:${name} -->)`);
  const m = html.match(re);
  if (!m) { console.error(`index.html: missing <!-- build:${name} --> ... <!-- /build:${name} --> markers`); process.exit(1); }
  html = html.replace(re, (_, open, indent, closeIndent, close) => `${open}${indent}${render()}\n${closeIndent}${close}`);
}

// ── llms.txt: the same content as plain markdown for AI tools reading the site ──
const md = [];
md.push(`# ${plain(c.meta.title)}`, '', `> ${plain(c.bio)}`, '');
md.push('## Current projects', ...c.currentProjects.map((p) => `- [${p.name}](${p.url}): ${p.description}`), '');
md.push('## Work', ...c.work.map((w) => `- ${w.company}, ${w.title} (${w.years}): ${w.description}${w.link ? ` [${w.link.label}](${w.link.url})` : ''}`), '');
md.push('## Education', `- ${c.education}`, '');
md.push('## Personal effects', '');
if (pe.currently?.length) md.push('Currently:', ...pe.currently.map((t) => `- ${t}`), '');
if (pe.next?.length) md.push('Next on the list:', ...pe.next.map((t) => `- ${t}`), '');
if (pe.businessesAndProducts?.length) md.push('Businesses and products I like:', ...pe.businessesAndProducts.map((l) => `- [${l.name}](${l.url})`), '');
if (pe.watching?.length) md.push('Watching:', ...pe.watching.map((l) => `- [${l.name}](${l.url})`), '');
md.push('Arsenal supporter since 1995.', '');
md.push('## Contact', `- Email: ${c.contact.email}`, `- LinkedIn: ${c.contact.linkedin}`, `- Updates: https://www.samrahim.com/updates`, '');
const llms = md.join('\n');
const llmsPath = join(root, 'llms.txt');
let llmsBefore = '';
try { llmsBefore = readFileSync(llmsPath, 'utf8'); } catch {}

if (CHECK) {
  const stale = [html !== before && 'index.html', llms !== llmsBefore && 'llms.txt'].filter(Boolean);
  if (stale.length) { console.error(`${stale.join(' and ')} out of date with content.json. Run: node build.mjs`); process.exit(1); }
  console.log('content.json passes the copy rules; index.html and llms.txt are up to date.');
} else {
  writeFileSync(htmlPath, html);
  writeFileSync(llmsPath, llms);
  console.log(`Built index.html${html === before ? ' (no change)' : ''} and llms.txt from content.json.`);
}
