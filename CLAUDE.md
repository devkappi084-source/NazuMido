# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

**Nazumido** is the public website for a fictional Austrian carnival club (Faschingsverein) based in Micheldorf, OÖ, founded 1962. The site is a static single-page application written entirely in German, with no backend.

## Deployment

```bash
npx wrangler deploy        # deploy to Cloudflare Workers (app name: nazumido2)
npx wrangler dev           # local dev server on http://localhost:8787
```

There is no build step — the site runs directly in the browser via CDN-hosted React 18.3.1 + Babel standalone 7.29.0. Open `index.html` (or `Nazumido.html`, they are identical) in a browser or use `wrangler dev` to preview.

The `wrangler.toml` serves the entire repo root directory as static assets (`directory = "."`).

## File structure

```
index.html / Nazumido.html  — Entry point (identical files); loads CDN scripts + .jsx files
styles.css                  — All CSS, including CSS variables
data.jsx                    — All static content (single source of truth)
components.jsx              — Shared UI components
pages-detail.jsx            — Sub-page components
auth.jsx                    — Auth hook + login/register + member dashboard
app.jsx                     — Root App component, routing
assets/                     — logo.png, garde.png, guggenmusik.png, plus photos
wrangler.toml               — Cloudflare Workers config
```

## Architecture

Single-page application with hash-based routing. No bundler, no Node dependencies at runtime. All JSX files are compiled in the browser by Babel standalone and loaded in order via `<script type="text/babel">` tags.

**Load order matters** — each file exposes its exports via `Object.assign(window, {...})` so later files can reference globals from earlier ones:

| File | Exports to `window` |
|---|---|
| `data.jsx` | `NEWS`, `EVENTS`, `GROUPS`, `PEOPLE`, `TAGS`, `SPONSORS`, `SPONSORS_TIERS`, `GARDE`, `MUSIKZUG`, `VORSITZ`, `PHOTOS`, `DEMO_USERS`, `INTERNAL` |
| `components.jsx` | `TopBar`, `Hero`, `Welcome`, `NewsFeed`, `EventsBand`, `SponsorsMarquee`, `GroupsBlock`, `PeopleBlock`, `NewsletterBlock`, `Footer`, `Modal` |
| `pages-detail.jsx` | `SubHero`, `GroupPhotos`, `GardePage`, `MusikzugPage`, `VorsitzPage`, `SponsorsPage` |
| `auth.jsx` | `useAuth`, `LoginPage`, `MemberDashboard` |
| `app.jsx` | Renders root; no exports (calls `ReactDOM.createRoot`) |

Each JSX file destructures its React hooks with unique aliases (e.g. `useStateApp`, `useStateA`, `useStateD`) to avoid collisions across files sharing the global `React` object.

## Routes

Hash-based routing via `window.location.hash`. The `route` state in `app.jsx` drives which page component renders.

| Hash | Renders |
|---|---|
| `#home` (default) | `Hero` + `Welcome` + `NewsFeed` + `SponsorsMarquee` + `EventsBand` + `GroupsBlock` + `PeopleBlock` + `NewsletterBlock` |
| `#garde` | `GardePage` |
| `#musikzug` | `MusikzugPage` |
| `#vorsitz` | `VorsitzPage` |
| `#sponsoren` | `SponsorsPage` |
| `#login` | `LoginPage` |
| `#mitglieder` | `MemberDashboard` (or `LoginPage` if not authenticated) |

**Scroll-to-anchor IDs** (`events`, `news`, `groups`, `people`, `kontakt`) are handled as special cases in `handleNav`: they stay on `#home` and smooth-scroll to the matching element ID rather than changing the route.

## Auth system

`useAuth()` in `auth.jsx` manages session via `localStorage`:

- `nazumido_user` — serialized current user object (password stripped)
- `nazumido_registry` — array of self-registered users

Login checks against `DEMO_USERS` first, then the `nazumido_registry`.

**Demo credentials (defined in `data.jsx`):**

| Email | Password | Role |
|---|---|---|
| `gast@nazumido.at` | `gast` | `Mitglied` |
| `garde@nazumido.at` | `garde` | `Trainerin` |
| `vorstand@nazumido.at` | `vorstand` | `Vorstand` |

**Role values:** `Mitglied`, `Trainerin`, `Vorstand`. Role affects what the `MemberDashboard` shows — `INTERNAL` in `data.jsx` contains role-keyed content arrays.

**Photo download gate:** `window.__currentUser` is synced from auth state (in both `app.jsx` and `auth.jsx`) so `GroupPhotos` in `pages-detail.jsx` can check login status without prop drilling.

## Data model (all in `data.jsx`)

- `NEWS` — array of news articles with `id`, `tag`, `tagColor`, optional `image`, `date`, `readTime`, `title`, `excerpt`, `body[]`, optional `feature` flag
- `EVENTS` — array with `id`, `d` (day number), `m` (month abbrev), `day` (weekday), `title`, `kind`, `desc`, `time`, `where`
- `GROUPS` — array for the three groups: Garde, Musikzug, Vorsitz (drives the home-page `GroupsBlock`)
- `PEOPLE` — board members with `id`, `initial`, `name`, `role`, `group`, `dotColor`, `bio`, `contact`
- `TAGS` — filter tags for `NewsFeed`
- `GARDE` / `MUSIKZUG` / `VORSITZ` — detailed objects for sub-pages (facts, groups, highlights, schedule/repertoire/responsibilities, history)
- `SPONSORS_TIERS` — three tiers (`Hauptsponsor`, `Premium`, `Förderer`), each with `tier`, `color`, `desc`, `sponsors[]`
- `SPONSORS` — flat array of sponsor names derived from `SPONSORS_TIERS`, used in the scrolling marquee
- `PHOTOS` — gallery items with `id`, `src` (nullable), `title`, `date`, `group`, `size` (web res), `hdSize`
- `DEMO_USERS` — hardcoded login credentials (see Auth section above)
- `INTERNAL` — role-keyed arrays of internal documents/links shown in `MemberDashboard`

## CSS conventions

All design tokens are defined as CSS custom properties in `:root` inside `styles.css`. Always use these variables rather than hardcoded values:

| Variable | Value |
|---|---|
| `--red` | `#C8202C` |
| `--red-deep` | `#9C1822` |
| `--green` | `#1E6E3F` |
| `--green-deep` | `#144D2C` |
| `--gold` | `#C9A24B` |
| `--ink` | `#16140F` (near-black) |
| `--ink-2` | `#3A352B` |
| `--muted` | `#7C7363` |
| `--cream` | `#F7F1E6` |
| `--cream-2` | `#EFE7D5` |
| `--paper` | `#FBF8F2` (page background) |
| `--line` | `rgba(22,20,15,0.12)` |
| `--serif` | `"Instrument Serif"` (headings) |
| `--sans` | `"DM Sans"` (body) |
| `--mono` | `"DM Mono"` (eyebrows, metadata) |

## Key conventions

- **Content changes**: Edit `data.jsx` only — no component files need touching for text/data updates.
- **New pages**: Add a route branch in `app.jsx`, add the component to `pages-detail.jsx` (or a new file), and add it to `window` exports at the bottom.
- **New components**: Add to `components.jsx` and include in its `Object.assign(window, {...})` export block.
- **No `import`/`export`**: This project does not use ES modules. All cross-file sharing is via `window` globals.
- **React hooks**: Each file declares its own destructured hook aliases (e.g. `const { useState: useStateA } = React`) to avoid naming collisions.
- **Modal pattern**: Shared `Modal` component in `components.jsx` handles three content types: news articles, events, and photos. Discriminated by shape (`item.hdSize` → photo, `item.d && item.kind` → event, else → news).
- **`TagColor` values**: `'red'`, `'green'`, `'gold'` — applied as CSS class names on tag chips.
- **Responsive**: CSS uses `@media (max-width: 720px)` breakpoints. Mobile nav is a burger menu toggled via `mobileOpen` state in `TopBar`.
