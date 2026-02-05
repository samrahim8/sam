# Sam Rahim Personal Site

## Accounts & Deployment

| Service | Account | Details |
|---------|---------|---------|
| **GitHub** | `samrahim8` | Repo: `samrahim8/sam` |
| **Vercel** | `sams-projects-35f97947` | Auto-deploys from `main` branch |
| **Domain** | `samrahim.com` | Connected via Vercel |

## Project Structure

```
sam-rahim-site/
├── index.html          # Main site (single page, all CSS/JS inline)
├── arsenal-audio.mp3   # Audio for Arsenal section toggle
├── ArsenalVideo_SamRahim.mp4  # Video modal content
├── profile.png         # Profile photo
├── og-image.png        # Social sharing image
├── og-image.html       # Template for generating og-image
├── favicon.svg         # Site favicon
├── .gitignore
├── .vercel/            # Vercel project config
└── PROJECT.md          # This file
```

## Tech Stack

- **Static HTML** - Single `index.html` with inline CSS and JavaScript
- **Fonts** - Instrument Serif + Instrument Sans (Google Fonts)
- **APIs** - ESPN APIs for live Arsenal data (Premier League table, competitions, next match)
- **Hosting** - Vercel (static deployment)

## Design System

| Token | Light | Dark |
|-------|-------|------|
| `--cream` | #F5F0E8 | #1A1512 |
| `--brass` | #B8945F | #C9A866 |
| `--walnut` | #3E2C23 | #F5F0E8 |
| `--plaster` | #E8E0D4 | #3D332B |

---

## Features & Changelog

### 2026-02-05: Contact Section Copy Update
**Status:** Live

Updated to feel warmer and more personal:
- Headline: "Got an Idea?" (matches hero CTA)
- Subheadline: "It's fine if you don't! I love meeting new people and learning about what they do."

### 2026-02-05: Audio Toggle Mobile Redesign
**Status:** Live

Redesigned audio button for world-class mobile UX:
- **Touch target:** 48px minimum height on mobile (Apple/Google guidelines)
- **Visual:** Pill-shaped button with clean border, transparent background
- **Animation:** Equalizer bars animate when playing (3 bars with staggered timing)
- **Layout:** Stacks below intro text on mobile (<600px), inline on desktop
- **Feedback:** Active state scales down, smooth color transitions

### 2026-02-05: Video Modal Click-to-Close
**Status:** Live

Improved video modal UX:
- Tap/click anywhere outside the video to close (not just X button)
- Uses `closest()` for robust click detection
- Event listener moved after modal HTML (was failing because DOM element didn't exist yet)

### 2026-02-05: Arsenal Audio Toggle
**Status:** Live

Added audio toggle button to Arsenal section:
- Button appears inline after "Arsenal since '95..." intro text
- Toggle plays/pauses `arsenal-audio.mp3` (loops)
- Visual feedback: button pulses and changes to "Pause" when playing
- **Auto-stop:** Audio automatically stops when user clicks Arsenal row to open video modal
- Styled with brass accent colors to match site design

---

## Site Sections

1. **Hero** - Name, title, profile photo
2. **About** - Bio with timeline toggle
3. **Experience** - Work history
4. **Ventures** - Current projects/companies
5. **Arsenal** - Live Premier League data, competitions, next match, video easter egg
6. **Contact** - Email link

## Decisions & Notes

- **Single HTML file:** Keeps deployment simple, no build step needed
- **Dark/light theme:** Toggle in nav, persists via localStorage
- **Arsenal video:** Opens when clicking Arsenal row if they're top of the table (crown icon shown)
- **ESPN APIs:** Free, no auth required, fetches live data on page load

---

## Local Development

Just open `index.html` in a browser. No server required.

## Deployment

Push to `main` branch on GitHub (`samrahim8/sam`) and Vercel auto-deploys.

```bash
git add .
git commit -m "Your message"
git push origin main
```
