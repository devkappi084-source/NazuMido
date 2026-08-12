# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

**Nazumido** is the public website for a fictional Austrian carnival club (Faschingsverein) based in Micheldorf, OÖ, founded 1962. The site is a static single-page application written entirely in German, with no backend.

## Deployment

```bash
npx wrangler deploy        # deploy to Cloudflare Workers (app name: nazumido2)
npx wrangler dev           # local dev server on http://localhost:8787
```

There is no build step — the site runs directly in the browser via CDN-hosted React 18.3.1 + Babel standalone 7.29.0. Open `public/index.html` (or `public/Nazumido.html`, they are identical) in a browser or use `wrangler dev` to preview.

The `wrangler.toml` serves the `public/` directory as static assets (`directory = "./public"`). **Everything the browser loads must live under `public/`** — files in the repo root are never served. The Worker (`src/worker.js`) only handles paths with no matching file: `/api/*`, `/uploads/*`, and the redirects `/admin` → `/#admin`, `/login` → `/#login`.

The three CDN `<script>` tags carry Subresource-Integrity hashes. Bumping React or Babel means recomputing them, otherwise the browser refuses the script and the page stays blank.

## File structure

```
public/                     — everything served to the browser
  index.html / Nazumido.html  — Entry point (identical); loads CDN scripts + .jsx files
  styles.css                  — All CSS, including CSS variables
  data.jsx                    — All static content (single source of truth)
  components.jsx              — Shared UI components
  pages-detail.jsx            — Sub-page components
  auth.jsx                    — Auth hook + login/register + member dashboard
  admin.jsx                   — admin panel (#admin route), the only admin UI
  app.jsx                     — Root App component, routing
  assets/                     — logo.png (Wappen), garde.png, guggenmusik.png, plus photos
src/worker.js               — Cloudflare Worker: API, D1, R2
wrangler.toml               — Cloudflare Workers config
```

## Architecture

Single-page application with hash-based routing. No bundler, no Node dependencies at runtime. All JSX files are compiled in the browser by Babel standalone and loaded in order via `<script type="text/babel">` tags.

**Load order matters** — each file exposes its exports via `Object.assign(window, {...})` so later files can reference globals from earlier ones:

| File | Exports to `window` |
|---|---|
| `data.jsx` | `NEWS`, `EVENTS`, `GROUPS`, `PEOPLE`, `TAGS`, `SPONSORS`, `SPONSORS_TIERS`, `GARDE`, `MUSIKZUG`, `VORSITZ`, `PHOTOS`, `PHOTO_GROUPS`, `photoYear`, `photoGroups`, `GALLERY_DEFAULTS`, `galleryConfig`, `TICKET_DEFAULTS`, `ticketConfig`, `ticketState`, `reservableEvents`, `findEvent`, `loadReservations`, `saveReservations`, `addReservation`, `siteConfig`, `allEvents`, `dateLabel`, `eventDateLabel`, `DEMO_USERS`, `INTERNAL`, `SITE_CONFIG` |
| `components.jsx` | `TopBar`, `Hero`, `Welcome`, `NewsFeed`, `EventsBand`, `SponsorsMarquee`, `GroupsBlock`, `PeopleBlock`, `ContactBlock`, `Footer`, `Modal`, `TicketForm`, `openTicketTab` |
| `pages-detail.jsx` | `SubHero`, `PhotoCard`, `GroupPhotos`, `GaleriePage`, `accentTitle`, `GardePage`, `MusikzugPage`, `VorsitzPage`, `SponsorsPage`, `ReservationPage` |
| `auth.jsx` | `useAuth`, `LoginPage`, `MemberDashboard` |
| `app.jsx` | Renders root; no exports (calls `ReactDOM.createRoot`) |

Each JSX file destructures its React hooks with unique aliases (e.g. `useStateApp`, `useStateA`, `useStateD`) to avoid collisions across files sharing the global `React` object.

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
| `#login` | `LoginPage` |
| `#mitglieder` | `MemberDashboard` (or `LoginPage` if not authenticated) |
| `#reservierung/<event-id>` | `ReservationPage` — Reservierungsformular im eigenen Tab (ohne id: Terminauswahl) |

**Scroll-to-anchor IDs** (`events`, `news`, `groups`, `people`, `kontakt`) are handled as special cases in `handleNav`: they stay on `#home` and smooth-scroll to the matching element ID rather than changing the route.

**Route parameters**: `app.jsx` splits the hash on `/` into `routeName` + `routeParam`, so `#reservierung/e2` renders the reservation page for event `e2`. All render branches match on `routeName`.

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
- `EVENTS` — array with `id`, `d` (day number), `m` (month abbrev), optional `year`, `day` (weekday), `title`, `kind`, `desc`, `time`, `where`, plus the ticket fields `tickets` (bool — online reservation on/off for this date), `price`, `seats`, `ticketNote`
- `eventDate(event)` / `upcomingEvents(days)` — date helpers for `EVENTS`. `eventDate` parses `d` + `m` (German or English month abbrev) with `year`, falling back to the current calendar year, so an event without a year counts as past once its date has passed. `upcomingEvents(days)` returns the future events sorted ascending, limited to the next `days` days when `days > 0`
- `siteConfig()` / `allEvents()` — read `SITE_CONFIG` / `EVENTS` through `window` so admin overrides apply. Bare `SITE_CONFIG` / `EVENTS` references resolve to the original module-level constants (the files are plain scripts, so `const` never lands on `window`) and silently miss admin edits — new code should use these helpers
- `dateLabel(date)` / `eventDateLabel(event)` — German long-form date (`14. Februar 2026`)
- `showTopbarStrip()` — whether the marquee in the `TopBar` renders. False when `SITE_CONFIG.topbarStripEnabled === false` (the on/off button in the admin) or the strip has no entries; otherwise it needs an upcoming event unless `topbarStripOnlyWithEvent: false`. `SITE_CONFIG.topbarStripWeeks` is the lead time in weeks (0 = every future date); `topbarStripLeadDays()` converts it and still understands the legacy `topbarStripDays`. All editable under *Vereinsinfo › Laufschrift*
- `GROUPS` — array for the three groups: Garde, Musikzug, Vorsitz (drives the home-page `GroupsBlock`)
- `PEOPLE` — board members with `id`, `initial`, `name`, `role`, `group`, `dotColor`, `bio`, `contact`
- `TAGS` — filter tags for `NewsFeed`
- `GARDE` / `MUSIKZUG` / `VORSITZ` — detailed objects for sub-pages (facts, groups, highlights, schedule/repertoire/responsibilities, history)
- `SPONSORS_TIERS` — three tiers (`Hauptsponsor`, `Premium`, `Förderer`), each with `tier`, `color`, `desc`, `sponsors[]`
- `SPONSORS` — flat array of sponsor names derived from `SPONSORS_TIERS`, used in the scrolling marquee
- `PHOTOS` — gallery items with `id`, `src` (nullable), `title`, `date`, `year`, `group`, `album` (occasion), `size` (web res), `hdSize`
- `PHOTO_GROUPS` — the default gallery groups (`Garde`, `Musikzug`, `Präsidium`, `Allgemein`); editable in the admin under *Einstellungen › Galerie*
- `photoYear(photo)` — helper that returns a photo's year, falling back to parsing `date` for older localStorage data written before `year` existed
- `photoGroups()` — current gallery groups, read from `window.PHOTO_GROUPS` so admin overrides apply
- `GALLERY_DEFAULTS` / `galleryConfig()` — gallery settings (texts, filters, sort order, `photosPerGroup`, `hdMembersOnly`, `showInNav`, HD section). `galleryConfig()` merges the defaults with `window.SITE_CONFIG.gallery` and is the only way gallery code should read these values — never read `SITE_CONFIG.gallery` directly, or admin overrides get missed
- `TICKET_DEFAULTS` / `ticketConfig()` — ticket settings (`enabled`, `showInEvents`, button and form texts, `openWeeks`, `maxPerBooking`, `requirePhone`, `notifyEmail`, `showMailCopy`, `openInNewTab`). `ticketConfig()` merges the defaults with `SITE_CONFIG.tickets`; like `galleryConfig()` it is the only way ticket code should read these values
- `ticketState(event)` — `{ open, reason, at, opensAt, cfg }` for one date. `reason` is `open`, `off` (master switch off), `event-off` (`tickets` not set on the event), `past`, or `soon` (still outside the `openWeeks` window — `opensAt` says when it opens). `reservableEvents()` returns the currently bookable dates, ascending
- `loadReservations()` / `saveReservations(list)` / `addReservation(entry)` — reservation store in `localStorage` under `nazumido_reservations`; `addReservation` stamps `id`, `code` (e.g. `NZ-4F2QK`) and `at`
- `DEMO_USERS` — hardcoded login credentials (see Auth section above)
- `SITE_CONFIG` — site-wide texts and figures (season, contact data, `topbarStrip` plus `topbarStripEnabled` / `topbarStripOnlyWithEvent` / `topbarStripWeeks`, `gallery`, `tickets`)
- `INTERNAL` — role-keyed arrays of internal documents/links shown in `MemberDashboard`

## Ticket reservation

Visitors reserve seats from the events band (`EventsBand`) or from the event
detail modal. Both call `openTicketTab(event)` (`components.jsx`) first: with
`tickets.openInNewTab` on (the default) that opens `#reservierung/<event-id>`
in a new browser tab, rendered by `ReservationPage` (`pages-detail.jsx`). If
the setting is off — or a popup blocker kills the tab — the flow falls back to
the old modal, which gets the event with `_tickets: true` and shows
`TicketForm` instead of the detail view. Both paths render the same
`TicketForm`; the standalone page passes `standalone` (adds a print button and
the reservation-code note) and a `backLabel`.

A date is bookable only when `ticketState(event).open` — i.e. the master switch
is on, the event has `tickets: true`, the date is not past, and the `openWeeks`
lead time has been reached. Non-bookable dates show a `.ticket-hint` box
instead of the button ("Reservierung ab …" or the configurable `closedText`);
`#reservierung/<id>` for such a date shows the same hint plus a list of the
dates that *are* open.

Submitting writes the reservation to `localStorage` (`nazumido_reservations`,
same store for both paths since it is the same origin) and offers a prefilled
`mailto:` link to `tickets.notifyEmail` (falling back to `SITE_CONFIG.email`).
**There is no backend for this**: the stored copy lives only in the visitor's
browser, so the e-mail is the channel that actually reaches the club. The
admin's *Reservierungen* list (Events tab) therefore only shows what was booked
on that same device. It filters by date, exports CSV and opens a print view
(own tab, `window.print()`) with a per-date attendee list — name, contact,
seats, code, note and a tick box, plus the seat total. Moving this to the
Worker API (D1) is the same open step as for the rest of the content.

## Admin panel

There is exactly **one** admin UI: the React panel on the `#admin` route
(`public/admin.jsx`), styled with the Nazumido brand tokens (red/green/gold on
cream, Instrument Serif headings, DM Mono labels). It edits all site content:
Events, Neuigkeiten, **Galerie**, Vereinsinfo, Personen, Gruppen, Sponsoren,
Mitglieder-Inhalte and Einstellungen, and stores everything in `localStorage`
(`nzadm_*` keys).

A second, Worker-backed dashboard (`public/admin/`, `public/login.html`, D1)
used to live at `/admin` and `/login`; it was removed because it only covered
Beiträge and wrote to a database the public site never reads. Both paths now
redirect to the React panel. The `/api/*` routes in `src/worker.js` stay in
place for a possible future server-side store — don't add a second UI on top
of them.

**Caveat worth knowing:** because storage is `localStorage`, edits are visible
only in the browser that made them — they do not reach site visitors. Moving
content to the Worker API (D1) is the open next step if edits must go live.

The React panel has two modes: *Schnellzugriff* (Events, Neuigkeiten, Galerie,
Vereinsinfo, Einstellungen) and *Vollzugriff* (all tabs). Tabs are declared in the `ADM_TABS`
array in `admin.jsx` — add an entry there plus a render branch in `AdminPage`
to add a new tab; `simple: true` also shows it in Schnellzugriff.

Its markup uses the `.adm-*` classes defined at the bottom of `styles.css`
(`.adm-card`, `.adm-field`, `.adm-btn`, `.adm-navitem`, `.adm-photo-grid`,
`.adm-power`, …) rather than inline styles — keep new admin UI on those classes
so it stays in sync with the site design.

### Ticket-Einstellungen

`AdmTicketSettings` (*Einstellungen › Tickets*) holds everything global about
the online reservation: the `PowerBtn` master switch, the list-button, own-tab
and phone toggles, `openWeeks` / `maxPerBooking` / `notifyEmail`, and the form
texts.
Saving writes `SITE_CONFIG.tickets`. Which dates are bookable is per event in
the **Events** tab (`tickets`, `price`, `seats`, `ticketNote`), where the editor
also shows the live `ticketStatusText` for the date and `AdmReservations` lists
the reservations stored in this browser.

*Vereinsinfo › Laufschrift* uses the same `PowerBtn` for the topbar strip:
`topbarStripEnabled` hides it outright, `topbarStripOnlyWithEvent` ties it to
the calendar, and `topbarStripWeeks` sets how many weeks before a date it
appears. Saving migrates the old `topbarStripDays` value to weeks and drops it.

### Galerie-Einstellungen

`AdmGallerySettings` in `admin.jsx` is the single editor for everything about
the gallery that is not a photo: page texts, filter/sort/badge display,
`photosPerGroup`, the HD block and its release (`hdMembersOnly`), the nav link,
and the gallery groups themselves. It is rendered twice — expanded in the
**Einstellungen** tab (section *Galerie*) and collapsed at the top of the
**Galerie** tab (`collapsible`), so both entry points edit the same state.

Saving writes `SITE_CONFIG.gallery` plus `PHOTO_GROUPS`; renaming or deleting a
group rewrites the `group` field of the affected photos (deleted groups fall
back to `Allgemein`). The names `Garde`, `Musikzug` and `Präsidium` also drive
the photo strips on the group sub-pages — renaming them empties those strips.

Saving goes through `saveData(key, data)`, which writes `nzadm_<KEY>` to
`localStorage` **and** updates `window[KEY]`, so the public pages reflect
changes immediately. `app.jsx` re-applies those overrides on every page load.

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
