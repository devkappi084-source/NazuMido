# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Deployment

```bash
npx wrangler deploy        # deploy to Cloudflare Workers (static assets)
npx wrangler dev           # local dev server (serves static files)
```

There is no build step — the site runs directly in the browser via CDN-hosted React 18 + Babel standalone. Open `Nazumido.html` in a browser or use `wrangler dev` to preview locally.

## Architecture

Single-page application with hash-based routing (`#home`, `#garde`, `#musikzug`, `#vorsitz`, `#sponsoren`, `#login`, `#mitglieder`). No bundler or Node dependencies. Files load in order via `<script type="text/babel">` tags in `Nazumido.html`.

**Load order matters** — each file exposes its exports via `Object.assign(window, {...})`:

| File | Responsibility |
|---|---|
| `data.jsx` | All static content: `NEWS`, `EVENTS`, `GROUPS`, `PEOPLE`, `PHOTOS`, `GARDE`, `MUSIKZUG`, `VORSITZ`, `SPONSORS_TIERS`, `DEMO_USERS`, `INTERNAL` |
| `components.jsx` | Shared UI: `TopBar`, `Hero`, `Welcome`, `NewsFeed`, `EventsBand`, `SponsorsMarquee`, `GroupsBlock`, `PeopleBlock`, `NewsletterBlock`, `Footer`, `Modal` |
| `pages-detail.jsx` | Sub-pages: `GardePage`, `MusikzugPage`, `VorsitzPage`, `SponsorsPage` plus shared `SubHero` and `GroupPhotos` |
| `auth.jsx` | `useAuth` hook (localStorage), `LoginPage`, `MemberDashboard` |
| `app.jsx` | Root `App` component — routing state, `navigate()`, renders all pages |

## Key conventions

- **Routing**: `app.jsx` holds the `route` state. `navigate(id)` sets `window.location.hash` and scrolls to top. Scroll-to-anchor IDs (`events`, `news`, `groups`, `people`, `kontakt`) are handled as special cases that stay on `#home` and smooth-scroll.
- **Auth**: `useAuth()` reads/writes `localStorage` (`nazumido_user`, `nazumido_registry`). Three hardcoded demo users in `data.jsx` (`DEMO_USERS`). Role values: `Mitglied`, `Trainerin`, `Vorstand`.
- **Photo download gate**: `window.__currentUser` is synced from auth state so `GroupPhotos` (rendered outside the auth subtree) can check login status without prop drilling.
- **CSS variables**: All colours, fonts defined in `:root` in `styles.css`. Use `var(--red)`, `var(--green)`, `var(--gold)`, `var(--ink)`, `var(--cream)`, `var(--paper)`, `var(--serif)`, `var(--sans)`, `var(--mono)`.
- **Content changes**: Edit `data.jsx` only — no component files need touching for text/data updates.
