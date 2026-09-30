# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

**Nazumido** is the public website for a fictional Austrian carnival club (Faschingsverein) based in Micheldorf, OÖ, founded 1962. The site is a static single-page application written entirely in German, with no backend, no build step and no runtime dependencies beyond three CDN scripts.

## Running and deploying

```bash
cd public && python3 -m http.server 8080   # → http://localhost:8080
```

Opening the files via `file://` does not work — the browser blocks loading the `.jsx` files. Deployment is a plain file copy: **everything the browser loads lives under `public/`**, and that folder is the deployable artifact (Cloudflare Pages with output directory `public`, Netlify, GitHub Pages, or any webspace). Files in the repo root are never served.

The three CDN `<script>` tags carry Subresource-Integrity hashes. Bumping React or Babel means recomputing them, otherwise the browser refuses the script and the page stays blank.

## File structure

```
public/                     — everything served to the browser
  index.html / Nazumido.html  — Entry point (identical); loads CDN scripts + .jsx files
  styles.css                  — All CSS, including CSS variables
  data.jsx                    — All static content (single source of truth)
  components.jsx              — Shared UI components
  pages-detail.jsx            — Sub-page components
  admin.jsx                   — admin panel (#admin route), the only admin UI
  app.jsx                     — Root App component, routing
  assets/                     — logo.png (Wappen), garde.png, guggenmusik.png, plus photos
```

## Architecture

Single-page application with hash-based routing. No bundler, no Node dependencies at runtime. All JSX files are compiled in the browser by Babel standalone and loaded in order via `<script type="text/babel">` tags.

**Load order matters** — each file exposes its exports via `Object.assign(window, {...})` so later files can reference globals from earlier ones:

| File | Exports to `window` |
|---|---|
| `data.jsx` | `NEWS`, `EVENTS`, `GROUPS`, `PEOPLE`, `TAGS`, `SPONSORS`, `SPONSORS_TIERS`, `sponsorList`, `GARDE`, `MUSIKZUG`, `VORSITZ`, `PHOTOS`, `PHOTO_GROUPS`, `photoYear`, `photoGroups`, `GALLERY_DEFAULTS`, `galleryConfig`, `eventDate`, `upcomingEvents`, `showTopbarStrip`, `siteConfig`, `allEvents`, `startOfToday`, `topbarStripLeadDays`, `MONTH_NAMES`, `dateLabel`, `eventDateLabel`, `SITE_CONFIG` |
| `components.jsx` | `TopBar`, `Hero`, `Welcome`, `NewsFeed`, `EventsBand`, `SponsorsMarquee`, `GroupsBlock`, `PersonCard`, `PeopleBlock`, `ContactBlock`, `Footer`, `Modal` |
| `pages-detail.jsx` | `SubHero`, `PhotoCard`, `GroupPhotos`, `GaleriePage`, `accentTitle`, `GardePage`, `MusikzugPage`, `VorsitzPage`, `SponsorsPage` |
| `admin.jsx` | `AdminPage`, `AdminErrorBoundary` |
| `app.jsx` | Renders root; no exports (calls `ReactDOM.createRoot`) |

Each JSX file destructures its React hooks with unique aliases (e.g. `useStateApp`, `useAdmSt`) to avoid collisions across files sharing the global `React` object.

## Routes

Hash-based routing via `window.location.hash`. The `route` state in `app.jsx` drives which page component renders.

| Hash | Renders |
|---|---|
| `#home` (default) | `Hero` + `Welcome` + `NewsFeed` + `SponsorsMarquee` + `EventsBand` + `GroupsBlock` + `PeopleBlock` + `ContactBlock` |
| `#garde` | `GardePage` |
| `#musikzug` | `MusikzugPage` |
| `#vorsitz` | `VorsitzPage` |
| `#galerie` (alias `#photos`) | `GaleriePage` — Fotoarchiv, filterbar nach Gruppe und Jahr |
| `#sponsoren` | `SponsorsPage` |
| `#admin` | `AdminPage` — the admin panel, behind its own password gate |

**Scroll-to-anchor IDs** (`events`, `news`, `groups`, `people`, `kontakt`) are handled as special cases in `handleNav`: they stay on `#home` and smooth-scroll to the matching element ID rather than changing the route. The header CTA and the footer's *Kontakt* link use `#kontakt`; the footer also carries the only visible link to `#admin`.

## Data model (all in `data.jsx`)

- `NEWS` — array of news articles with `id`, `tag`, `tagColor`, optional `image`, `date`, `readTime`, `title`, `excerpt`, `body[]`, optional `feature` flag
- `EVENTS` — array with `id`, `d` (day number), `m` (month abbrev), optional `year`, `day` (weekday), `title`, `kind`, `desc`, `time`, `where`
- `eventDate(event)` / `upcomingEvents(days)` — date helpers for `EVENTS`. `eventDate` parses `d` + `m` (German or English month abbrev) with `year`, falling back to the current calendar year, so an event without a year counts as past once its date has passed. `upcomingEvents(days)` returns the future events sorted ascending, limited to the next `days` days when `days > 0`
- `siteConfig()` / `allEvents()` — read `SITE_CONFIG` / `EVENTS` through `window` so admin overrides apply. Bare `SITE_CONFIG` / `EVENTS` references resolve to the original module-level constants (the files are plain scripts, so `const` never lands on `window`) and silently miss admin edits — new code should use these helpers
- `dateLabel(date)` / `eventDateLabel(event)` — German long-form date (`14. Februar 2026`)
- `showTopbarStrip()` — whether the marquee in the `TopBar` renders. False when `SITE_CONFIG.topbarStripEnabled === false` (the on/off button in the admin) or the strip has no entries; otherwise it needs an upcoming event unless `topbarStripOnlyWithEvent: false`. `SITE_CONFIG.topbarStripWeeks` is the lead time in weeks (0 = every future date); `topbarStripLeadDays()` converts it and still understands the legacy `topbarStripDays`. All editable under *Vereinsinfo › Laufschrift*
- `GROUPS` — array for the three groups: Garde, Musikzug, Vorsitz (drives the home-page `GroupsBlock`)
- `PEOPLE` — board members with `id`, `initial`, `photo` (nullable — image path or uploaded data URL; without it the card shows `initial`), `name`, `role`, `group`, `dotColor`, `bio`, `contact`
- `TAGS` — filter tags for `NewsFeed`
- `GARDE` / `MUSIKZUG` / `VORSITZ` — detailed objects for sub-pages (facts, groups, highlights, schedule/repertoire/responsibilities, history)
- `SPONSORS_TIERS` — three tiers (`Hauptsponsor`, `Premium`, `Förderer`), each with `tier`, `color`, `desc`, `sponsors[]`. A sponsor is `{ name, branch, since, logo, url }`; `logo` (nullable) is an image path or uploaded data URL, `url` turns the card into a link
- `SPONSORS` — flat array of sponsor names derived from `SPONSORS_TIERS`, kept for older callers
- `sponsorList()` — all sponsors as objects incl. `logo` and their tier, read through `window`; this is what the marquee uses
- `PHOTOS` — gallery items with `id`, `src` (nullable), `title`, `date`, `year`, `group`, `album` (occasion), `size` (web res), `hdSize`
- `PHOTO_GROUPS` — the default gallery groups (`Garde`, `Musikzug`, `Präsidium`, `Allgemein`); editable in the admin under *Einstellungen › Galerie*
- `photoYear(photo)` — helper that returns a photo's year, falling back to parsing `date` for older localStorage data written before `year` existed
- `photoGroups()` — current gallery groups, read from `window.PHOTO_GROUPS` so admin overrides apply
- `GALLERY_DEFAULTS` / `galleryConfig()` — gallery settings (texts, filters, sort order, `photosPerGroup`, `showInNav`, HD section). `galleryConfig()` merges the defaults with `window.SITE_CONFIG.gallery` and is the only way gallery code should read these values — never read `SITE_CONFIG.gallery` directly, or admin overrides get missed
- `SITE_CONFIG` — site-wide texts and figures (season, contact data, `topbarStrip` plus `topbarStripEnabled` / `topbarStripOnlyWithEvent` / `topbarStripWeeks`, `gallery`)

HD photo downloads are open to everyone — there is no login and therefore no gate.

## Admin panel

There is exactly **one** admin UI: the React panel on the `#admin` route (`public/admin.jsx`), styled with the Nazumido brand tokens (red/green/gold on cream, Instrument Serif headings, DM Mono labels). It edits all site content: Events, Neuigkeiten, Galerie, Vereinsinfo, Personen, Gruppen, Sponsoren and Einstellungen, and stores everything in `localStorage` (`nzadm_*` keys).

Access is guarded by `AdminLogin`, a password kept in `localStorage` (`DEFAULT_PW`, changeable under *Einstellungen › Zugang*); the unlocked state lives in `sessionStorage`. This is a client-side convenience gate, not real security — anything in the panel is editable by whoever controls the browser.

**Caveat worth knowing:** because storage is `localStorage`, edits are visible only in the browser that made them — they do not reach site visitors. Content that should go live belongs in `data.jsx`.

The panel has two modes: *Schnellzugriff* (Events, Neuigkeiten, Galerie, Vereinsinfo, Einstellungen) and *Vollzugriff* (all tabs). Tabs are declared in the `ADM_TABS` array in `admin.jsx` — add an entry there plus a render branch in `AdminPage` to add a new tab; `simple: true` also shows it in Schnellzugriff.

Its markup uses the `.adm-*` classes defined at the bottom of `styles.css` (`.adm-card`, `.adm-field`, `.adm-btn`, `.adm-navitem`, `.adm-photo-grid`, `.adm-power`, …) rather than inline styles — keep new admin UI on those classes so it stays in sync with the site design.

### Bild-Uploads

`ImgField` (admin.jsx) is the shared editor for every image that is not a gallery photo — currently sponsor logos and person photos. It shows a preview, a file picker and a path input side by side: pick a file and it is stored as a data URL, or type `assets/…` to reference a file that ships with the site. `readImageFile(file, max, cb)` does the reading and downscales to `max` pixels edge length via canvas (PNG stays PNG so logos keep transparency, SVG is passed through untouched) — uploads land in `localStorage`, which holds only a few MB. `saveData` therefore catches the quota error and tells the user instead of failing silently; when it hits, the change lives only until the page reloads.

### Galerie-Einstellungen

`AdmGallerySettings` in `admin.jsx` is the single editor for everything about the gallery that is not a photo: page texts, filter/sort/badge display, `photosPerGroup`, the HD block, the nav link, and the gallery groups themselves. It is rendered twice — expanded in the **Einstellungen** tab (section *Galerie*) and collapsed at the top of the **Galerie** tab (`collapsible`), so both entry points edit the same state.

Saving writes `SITE_CONFIG.gallery` plus `PHOTO_GROUPS`; renaming or deleting a group rewrites the `group` field of the affected photos (deleted groups fall back to `Allgemein`). The names `Garde`, `Musikzug` and `Präsidium` also drive the photo strips on the group sub-pages — renaming them empties those strips.

Saving goes through `saveData(key, data)`, which writes `nzadm_<KEY>` to `localStorage` **and** updates `window[KEY]`, so the public pages reflect changes immediately. `app.jsx` re-applies those overrides on every page load — a new admin-editable key has to be added to that list in `app.jsx` and to the reset list in `AdmSettings`, otherwise the change is lost on reload.

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

Some rules in `styles.css` still target classes of removed features (ticket forms, member dashboard, login). They are inert; leave them or clean them up deliberately, but do not build new UI on them.

## Key conventions

- **Content changes**: Edit `data.jsx` only — no component files need touching for text/data updates.
- **New pages**: Add a route branch in `app.jsx`, add the component to `pages-detail.jsx` (or a new file), and add it to `window` exports at the bottom.
- **New components**: Add to `components.jsx` and include in its `Object.assign(window, {...})` export block.
- **No `import`/`export`**: This project does not use ES modules. All cross-file sharing is via `window` globals.
- **React hooks**: Each file declares its own destructured hook aliases (e.g. `const { useState: useStateA } = React`) to avoid naming collisions.
- **Modal pattern**: Shared `Modal` component in `components.jsx` handles three content types: news articles, events, and photos. Discriminated by shape (`item.hdSize` → photo, `item.d && item.kind` → event, else → news).
- **`TagColor` values**: `'red'`, `'green'`, `'gold'` — applied as CSS class names on tag chips.
- **Responsive**: CSS uses `@media (max-width: 720px)` breakpoints. Mobile nav is a burger menu toggled via `mobileOpen` state in `TopBar`.
