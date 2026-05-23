# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**NazuMido** is the website for *Narrenzunft der schwarzen Grafen* (Kirchdorf an der Krems, Austria) — an Austrian carnival club. The site is a **JAMstack application** hosted on **Cloudflare Pages** with **Pages Functions** (serverless backend) and **Cloudflare KV** (key-value storage).

## Deployment & Development

```bash
# Local dev (requires Cloudflare Wrangler)
npx wrangler pages dev . --kv KV

# Deploy (Cloudflare Pages auto-deploys on push to the configured branch)
git push origin claude/great-rubin-tXnlB

# No build step — the project is pure static HTML/CSS/JS + Cloudflare Functions
```

The active branch is `claude/great-rubin-tXnlB`. Pushing to this branch triggers a Cloudflare Pages rebuild automatically.

## Architecture

### Data flow
```
Visitor browser
  ├─ Loads static HTML/CSS/JS from Cloudflare Pages CDN
  ├─ js/content-loader.js fetches /api/config (KV overrides)
  │    └─ Merges KV data on top of static JSON fallbacks (data/*.json)
  └─ Members: /members/ portal fetches /api/member for auth + photo access

Admin browser (/admin/)
  ├─ Authenticates via POST /api/admin?action=login (email+password → KV session)
  └─ All writes go to /api/admin → stored in Cloudflare KV → live immediately

VPS (photo server, e.g. fotos.nazu-mido.at)
  └─ Stores full-resolution event photos, served via HMAC-signed URLs
```

### Key principle: KV overrides static files
- `data/content.json`, `data/events.json`, `data/settings.json` are **fallbacks**
- KV keys `config:content`, `config:events`, `config:settings` override them **instantly**
- Content-loader always prefers KV; edits in the admin take effect without a rebuild

### Directory structure

| Path | Purpose |
|------|---------|
| `index.html` | Main public page (single-page, all sections) |
| `js/main.js` | Navbar, confetti animation, lightbox, scroll reveal |
| `js/content-loader.js` | Fetches `/api/config`, injects KV data into DOM |
| `css/style.css` | Full stylesheet. CSS vars: `--gold` = red `#c41e2b`, `--purple` = green |
| `data/*.json` | Static fallback content (used when KV is empty) |
| `functions/_lib.js` | Shared utilities: password hashing (PBKDF2), session tokens, HMAC signing |
| `functions/api/config.js` | `GET /api/config` — public, returns KV overrides merged |
| `functions/api/admin.js` | All admin ops (`?action=`), requires session token |
| `functions/api/member.js` | Member auth + photo access (`?action=`) |
| `admin/index.html` | Admin SPA (email+password auth, no PHP) |
| `admin/js/app.js` | Admin frontend logic — calls `/api/admin` |
| `members/index.html` | Member portal SPA |
| `members/js/app.js` | Member frontend — login, event photo gallery |
| `vps/server.js` | Node.js photo server to deploy on the rented VPS |
| `wrangler.jsonc` | Cloudflare Wrangler config (KV binding must be added) |

### Cloudflare KV schema

```
config:content          → { hero, about, groups }
config:events           → [ ...events ]
config:settings         → { contact, social, general }
config:gallery          → [ ...gallery items ]
event:{id}:photos       → { photos: [...], previewBase64: [...] }

admin:users             → [ { id, name, email, active, permissions, isOwner } ]
admin:user:{id}         → { ...full user with passwordHash }
admin:session:{token}   → { userId, userName, expires }

member:list             → [ { id, name, email, active } ]
member:{id}             → { id, name, email, passwordHash, active, createdAt }
member:session:{token}  → { memberId, memberName, expires }
```

### Admin permissions (per user, fine-grained)
`content` · `events` · `gallery` · `settings` · `users` · `members`
The first account created via `/admin/setup` is the owner (all permissions, cannot be deleted).

### Photo system (hybrid)
- **Static images** (logo, backgrounds, group photos): in the git repo → Cloudflare CDN
- **Event photos** (full resolution): on the VPS, accessed via HMAC-signed URLs
- **Preview fallback** (2–3 per event): stored as base64 thumbnails in KV under `event:{id}:photos`

### Required environment variables (set in Cloudflare Pages dashboard)
| Variable | Purpose |
|----------|---------|
| `ADMIN_KEY` | One-time setup key + master fallback |
| `HMAC_SECRET` | Signs photo download URLs (shared with VPS) |
| `PHOTOS_VPS_URL` | Base URL of the VPS photo server, e.g. `https://fotos.nazu-mido.at` |
| `VPS_API_KEY` | API key for uploading to the VPS |

### Required wrangler.jsonc additions
```json
"kv_namespaces": [
  { "binding": "KV", "id": "<YOUR_KV_NAMESPACE_ID>" }
]
```

## CSS conventions
- Color variables: `--gold` = primary red, `--gold-light/dark/faint/border`, `--purple` = green accent
- Reveal animations use **only `translateY`** (never `translateX`) to prevent mobile horizontal scroll
- `overflow-x: clip` on `.section`, `touch-action: pan-y` on `body`

## Static fallback JSON format
`data/content.json` → hero/about/groups text  
`data/events.json` → array of `{ id, date, time, title, description, type, location, featured }`  
`data/settings.json` → contact / social / general  
These are never written by the admin; they only serve as defaults when KV is empty.
