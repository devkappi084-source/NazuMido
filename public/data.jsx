// Inhalte des Nazumido Faschingsvereins
const NEWS = [
  {
    id: 'n1',
    feature: true,
    tag: 'Rückblick',
    tagColor: 'red',
    image: 'assets/garde.png',
    date: '18. Februar 2026',
    readTime: '4 min',
    title: 'Garde brilliert bei der Marktgemeinde-Gala',
    excerpt:
      'Mit funkelnden Pailletten, präzisen Hebefiguren und einem Lächeln, das selbst die kühle Februarluft erwärmte, eröffnete unsere Garde die diesjährige Faschingssaison vor dem Rathaus.',
    body: [
      'Punkt 14 Uhr, die Trompeten schmettern, und unsere Garde wirbelt in fuchsiafarbenen Kostümen über den Marktplatz. Was für ein Auftakt für die Session 2026!',
      'Trainerin Karin Schober hatte die Choreografie über Monate eingeübt — und die harte Arbeit zahlte sich aus: stehende Ovationen vom Publikum, ein gerührter Bürgermeister und eine Einladung zum Bezirksfasching in Steyr.',
      'Wir bedanken uns bei allen Tänzerinnen, Helfern und der Marktgemeinde Micheldorf für die wunderbare Bühne. Auf gehts in die heiße Phase!',
    ],
  },
  {
    id: 'n2',
    tag: 'Ankündigung',
    tagColor: 'green',
    date: '03. Januar 2026',
    readTime: '2 min',
    title: 'Saisonauftakt 2026 — Tickets ab sofort erhältlich',
    excerpt:
      'Der Vorverkauf für unseren großen Faschingsumzug am 14. Februar startet. Frühbuchern winken Tribünenplätze und ein heißer Punsch.',
    body: [
      'Liebe Närrinnen und Narren! Wir freuen uns, den Vorverkauf für die kommende Saison zu eröffnen.',
      'Sichert euch eure Plätze unter Tel. 07582 / 81 12 oder direkt im Vereinslokal Gasthof Hofer.',
    ],
  },
  {
    id: 'n3',
    tag: 'Vereinsleben',
    tagColor: 'gold',
    date: '22. Dezember 2025',
    readTime: '3 min',
    title: 'Weihnachtsfeier im Saal: Ein Jahr voller Höhepunkte',
    excerpt:
      'Bei Glühwein, Lebkuchen und einem gemeinsamen Rückblick verabschiedete sich der Verein von einem ereignisreichen Jahr 2025.',
    body: [
      'Über 80 Mitglieder folgten der Einladung des Vorstands zur traditionellen Weihnachtsfeier. Prinz und Prinzessin der Session 2025 bedankten sich mit einer überraschenden Choreografie.',
    ],
  },
  {
    id: 'n4',
    tag: 'Musikzug',
    tagColor: 'red',
    image: 'assets/guggenmusik.png',
    date: '15. November 2025',
    readTime: '2 min',
    title: 'Musikzug holt Bronze beim Landeswettbewerb',
    excerpt:
      'Mit dröhnenden Trommeln, schiefen Trompeten (im allerbesten Sinne) und einer ordentlichen Portion Cowboy-Flair eroberte unser Musikzug den dritten Platz.',
    body: [
      'Der Auftritt war ein Spektakel. Kapellmeister Franz Huber sprach von einem "Meilenstein für die Truppe".',
    ],
  },
  {
    id: 'n5',
    tag: 'Mitgliedschaft',
    tagColor: 'green',
    date: '07. Oktober 2025',
    readTime: '2 min',
    title: 'Neue Garde-Generation: Kinder ab 6 Jahren willkommen',
    excerpt:
      'Ab Herbst öffnet die Mini-Garde ihre Türen für tanzfreudigen Nachwuchs. Probetraining jeden Donnerstag.',
    body: [
      'Wir suchen tanzbegeisterte Kinder, die mit uns die Bühne erobern wollen. Erstes Training: 12. Oktober um 16:30 Uhr im Turnsaal der Volksschule.',
    ],
  },
];

// `tickets: true` schaltet die Online-Reservierung für einen Termin frei
// (Rahmenbedingungen: SITE_CONFIG.tickets bzw. Admin › Einstellungen › Tickets).
const EVENTS = [
  {
    id: 'e1',
    d: '14', m: 'Feb', day: 'Samstag',
    title: 'Großer Faschingsumzug',
    kind: 'Hauptevent · Session 2026',
    desc: 'Über 30 Gruppen, 12 Wagen, eine Stadt im Ausnahmezustand. Start am Hauptplatz, anschließend Faschingstreiben im Festzelt.',
    time: '14:00 Uhr',
    where: 'Hauptplatz Micheldorf',
    year: 2026,
    tickets: true,
    price: 'Tribünenplatz 8 €',
    seats: 200,
    ticketNote: 'Reservierte Tribünenplätze bleiben bis 13:45 Uhr frei.',
  },
  {
    id: 'e2',
    d: '21', m: 'Feb', day: 'Samstag',
    title: 'Prinzenball',
    kind: 'Gala · Eintritt 28 €',
    desc: 'Großer Galaball mit Inthronisation des Prinzenpaars. Liveband, Garde-Show, Mitternachtseinlage vom Musikzug.',
    time: '19:30 Uhr',
    where: 'Festsaal Micheldorf',
    year: 2026,
    tickets: true,
    price: '28 € · Mitglieder 24 €',
    seats: 180,
    ticketNote: 'Tischreservierungen ab 6 Personen bitte im Anmerkungsfeld vermerken.',
  },
  {
    id: 'e3',
    d: '24', m: 'Feb', day: 'Dienstag',
    title: 'Faschingskehraus',
    kind: 'Tradition · Eintritt frei',
    desc: 'Letzte Runde durchs Dorf, gemeinsames Krapfen-Essen und Verbrennung der Faschings-Hex am Rathausplatz.',
    time: '17:00 Uhr',
    where: 'Rathausplatz',
    year: 2026,
    tickets: false,
  },
  {
    id: 'e4',
    d: '12', m: 'Mar', day: 'Donnerstag',
    title: 'Mitgliederversammlung',
    kind: 'Vereinsintern',
    desc: 'Jahresrückblick, Kassenbericht, Neuwahlen. Anschließend gemütlicher Ausklang bei Schnitzel und Bier.',
    time: '19:30 Uhr',
    where: 'Gasthof Hofer',
    year: 2026,
    tickets: false,
  },
  {
    id: 'e5',
    d: '08', m: 'Nov', day: 'Samstag',
    title: 'Inthronisation Session 2027',
    kind: 'Auftakt · 11.11.',
    desc: 'Der Vorhang öffnet sich erneut: Vorstellung des neuen Prinzenpaars und Saisoneröffnung im großen Stil.',
    time: '20:11 Uhr',
    where: 'Vereinslokal',
    year: 2026,
    tickets: true,
    price: '12 €',
    seats: 120,
  },
];

// Monatskürzel (deutsch und englisch) → Monatsindex
const EVENT_MONTHS = {
  jan: 0, jän: 0, jaen: 0, januar: 0, january: 0,
  feb: 1, februar: 1, february: 1,
  mär: 2, maer: 2, mrz: 2, mar: 2, märz: 2, march: 2,
  apr: 3, april: 3,
  mai: 4, may: 4,
  jun: 5, juni: 5, june: 5,
  jul: 6, juli: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  okt: 9, oct: 9, oktober: 9, october: 9,
  nov: 10, november: 10,
  dez: 11, dec: 11, dezember: 11, december: 11,
};

// Admin-Überschreibungen liegen auf `window` — Daten deshalb immer über diese
// beiden Helfer lesen, sonst greift man an den Änderungen aus dem Panel vorbei.
function siteConfig() {
  return (typeof window !== 'undefined' && window.SITE_CONFIG) || SITE_CONFIG;
}

function allEvents() {
  const e = typeof window !== 'undefined' && window.EVENTS;
  return Array.isArray(e) ? e : EVENTS;
}

// Heute, auf Mitternacht normiert
function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

// Datum eines Events als Date-Objekt (Mitternacht) — null, wenn Tag oder Monat
// nicht lesbar sind. Ohne `year` gilt das laufende Kalenderjahr, ein Termin ohne
// Jahresangabe ist also nach seinem Datum vorbei und rutscht nicht ins Folgejahr.
function eventDate(ev) {
  if (!ev) return null;
  const m = EVENT_MONTHS[String(ev.m || '').trim().toLowerCase().replace(/\.$/, '')];
  const d = parseInt(ev.d, 10);
  if (m === undefined || !d) return null;
  const year = parseInt(ev.year, 10) || new Date().getFullYear();
  return new Date(year, m, d);
}

const MONTH_NAMES = [
  'Jänner', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];

// „14. Februar 2026" — für Modal, Reservierung und Bestätigungsmail
function dateLabel(at) {
  return at ? `${at.getDate()}. ${MONTH_NAMES[at.getMonth()]} ${at.getFullYear()}` : '';
}

function eventDateLabel(ev) {
  const at = eventDate(ev);
  return at ? dateLabel(at) : `${(ev && ev.d) || ''}. ${(ev && ev.m) || ''}`.trim();
}

// Alle noch bevorstehenden Termine (heute zählt als anstehend), aufsteigend.
// `days` > 0 begrenzt auf ein Zeitfenster, 0 bedeutet „alle künftigen“.
function upcomingEvents(days) {
  const today = startOfToday();
  const limit = parseInt(days, 10) > 0
    ? new Date(today.getFullYear(), today.getMonth(), today.getDate() + parseInt(days, 10))
    : null;
  return allEvents()
    .map(ev => ({ ev, at: eventDate(ev) }))
    .filter(x => x.at && x.at >= today && (!limit || x.at <= limit))
    .sort((a, b) => a.at - b.at)
    .map(x => x.ev);
}

const GROUPS = [
  {
    id: 'garde',
    image: 'assets/garde.png',
    kicker: 'Tanz · 14 Aktive',
    kickerColor: 'red',
    title: 'Garde',
    desc: 'Funkelnde Kostüme, hohe Sprünge, präzise Choreografien. Unser Aushängeschild auf jeder Bühne.',
    stats: ['Gegründet 1998', 'Training Mo & Do'],
  },
  {
    id: 'musikzug',
    image: 'assets/guggenmusik.png',
    kicker: 'Musik · 22 Aktive',
    kickerColor: 'red',
    title: 'Musikzug',
    desc: 'Cowboy-Outfits und mitreißende Klänge. Wenn wir kommen, hört es die ganze Nachbargemeinde.',
    stats: ['Gegründet 2004', 'Probe Mi 19:30'],
  },
  {
    id: 'vorsitz',
    kicker: 'Repräsentation · 11 Aktive',
    kickerColor: 'green',
    title: 'Präsidium',
    desc: 'Tradition trifft Schalk: Das Präsidium führt durch jede Veranstaltung mit Witz, Würde und einem Schluck Bier.',
    stats: ['Gegründet 1962', 'Sitzung 1× im Monat'],
    placeholder: 'Foto Präsidium',
  },
];

// `photo` ist optional: ohne Foto zeigt die Karte das Kürzel (`initial`).
// Der Wert ist ein Bildpfad (assets/…) oder eine Data-URL aus dem Admin-Upload.
const PEOPLE = [
  { id: 'p1', initial: 'B', photo: null, name: 'Johann Bloderer', role: 'Präsident', group: 'Präsidium', dotColor: 'red', bio: 'Offizieller Botschafter für die 5. Jahreszeit und Präsident des Vereins.', contact: 'praesident@nazu-mido.at', phone: '+43 664 9233429' },
  { id: 'p2', initial: 'T', photo: null, name: 'Tamara Schubert', role: 'Vizepräsidentin', group: 'Präsidium', dotColor: 'green', bio: 'Offizielle Botschafterin für die 5. Jahreszeit und Vizepräsidentin des Vereins.', contact: 'Nazu.Mido@gmx.at' },
  { id: 'p3', initial: 'K', photo: null, name: 'Karin Schober', role: 'Trainerin Garde', group: 'Garde', dotColor: 'red', bio: 'Choreografin, Motivatorin, Tanzpädagogin. Erfolg sei "Disziplin mit Glitzer".', contact: 'garde@nazumido.at' },
  { id: 'p4', initial: 'F', photo: null, name: 'Franz Huber', role: 'Kapellmeister', group: 'Musikzug', dotColor: 'gold', bio: 'Seit 18 Jahren am Taktstock. Schiefer als seine Trompeten ist nur sein Humor.', contact: 'musik@nazumido.at' },
  { id: 'p5', initial: 'T', photo: null, name: 'Tom Weidinger', role: 'Kassier', group: 'Präsidium', dotColor: 'green', bio: 'Zählt Krapfen, Mitgliedsbeiträge und Bierdeckel mit gleicher Akribie.', contact: 'kasse@nazumido.at' },
  { id: 'p6', initial: 'S', photo: null, name: 'Sabine Mayer', role: 'Schriftführerin', group: 'Präsidium', dotColor: 'red', bio: 'Schreibt das Protokoll schneller, als der Präsident sprechen kann.', contact: 'office@nazumido.at' },
  { id: 'p7', initial: 'O', photo: null, name: 'Otto Pichler', role: 'Hofnarr', group: 'Präsidium', dotColor: 'gold', bio: 'Der heimliche Star jeder Veranstaltung. Punschausschank inklusive.', contact: '—' },
  { id: 'p8', initial: 'L', photo: null, name: 'Lisa Eder', role: 'Jugendreferentin', group: 'Garde', dotColor: 'green', bio: 'Bringt die Mini-Garde zum Strahlen und die Eltern zum Schwitzen.', contact: 'jugend@nazumido.at' },
];

const TAGS = ['Alle', 'Rückblick', 'Ankündigung', 'Vereinsleben', 'Musikzug', 'Mitgliedschaft'];

// ----- Garde (Untergruppen, Trainer, Aktive) -----
const GARDE = {
  title: 'Garde',
  tagline: 'Bühne frei für Pailletten, Präzision und pure Energie.',
  founded: 1998,
  members: 14,
  practice: 'Mo & Do · 18:30 — 20:00 · Turnsaal Volksschule',
  trainer: 'Karin Schober & Lisa Eder',
  groups: [
    { name: 'Showgrafen', age: '16+', count: 14, color: 'red' },
  ],
  highlights: [
    { year: '2025', text: 'Erster Platz beim Bezirkstanzfest Steyr' },
    { year: '2023', text: 'Auftritt im ORF-Landesstudio' },
    { year: '2020', text: 'Sondertanz zum 60-Jahr-Jubiläum' },
    { year: '1998', text: 'Gründung der Garde durch Karin Schober' },
  ],
  schedule: [
    { d: 'Mo', t: '18:30', what: 'Showgrafen — Choreografie' },
    { d: 'Do', t: '18:30', what: 'Showgrafen — Hebefiguren' },
  ],
};

const MUSIKZUG = {
  title: 'Musikzug',
  tagline: 'Trommelwirbel, Trompeten, Tutti — wenn wir kommen, ist Stimmung.',
  founded: 2004,
  members: 22,
  practice: 'Mi · 19:30 — 21:30 · Probelokal Vereinshaus',
  trainer: 'Franz Huber (Kapellmeister)',
  groups: [
    { name: 'Trommeln', age: '—', count: 8, color: 'red' },
    { name: 'Bläser', age: '—', count: 10, color: 'green' },
    { name: 'Becken & Schellen', age: '—', count: 4, color: 'gold' },
  ],
  highlights: [
    { year: '2025', text: 'Bronze beim oö. Guggenwettbewerb' },
    { year: '2022', text: 'Eigene CD "Cowboys im Schnee" erschienen' },
    { year: '2018', text: 'Auftritt am Wiener Faschingskongress' },
    { year: '2004', text: 'Gründung durch Franz Huber' },
  ],
  repertoire: [
    'Sweet Caroline (Cowboy Edition)',
    '99 Luftballons — Marschfassung',
    'Skandal im Sperrbezirk',
    'Hey Jude — Tutti Finale',
    'Eigenkomposition: Nazumido Marsch',
  ],
};

const VORSITZ = {
  title: 'Präsidium',
  tagline: 'Die Schaltzentrale: planen, repräsentieren, zusammenhalten.',
  founded: 1962,
  members: 11,
  practice: 'Monatliche Sitzung jeden 1. Donnerstag · Gasthof Hofer',
  responsibilities: [
    'Vereinsführung & strategische Planung',
    'Repräsentation bei offiziellen Anlässen',
    'Organisation von Umzug, Bällen, Versammlungen',
    'Finanzen, Mitgliederbetreuung, Schriftverkehr',
    'Kontakt zu Gemeinde, Sponsoren und Partnerverbänden',
  ],
  history: [
    { year: '1962', text: 'Vereinsgründung "Nazumido" durch sieben Stammtischbrüder' },
    { year: '1975', text: 'Erste Inthronisation eines Prinzenpaars' },
    { year: '1998', text: 'Garde wird in den Verein eingegliedert' },
    { year: '2004', text: 'Musikzug ergänzt das Programm' },
    { year: '2022', text: 'Erste Präsidentin in der Vereinsgeschichte' },
  ],
};

// ----- Sponsoren -----
// `logo` ist optional (Bildpfad oder Data-URL aus dem Admin-Upload); ohne Logo
// zeigen Sponsorenkarte und Laufband weiterhin nur den Namen.
// `url` verlinkt die Karte optional auf die Website des Partners.
const SPONSORS_TIERS = [
  {
    tier: 'Hauptsponsor',
    color: 'red',
    desc: 'Trägt unsere Saison maßgeblich. Logo auf jedem Plakat, Programm und Banner.',
    sponsors: [
      { name: 'Raiffeisenbank Micheldorf', since: 2008, branch: 'Bank', logo: null, url: '' },
      { name: 'Marktgemeinde Micheldorf', since: 1962, branch: 'Gemeinde', logo: null, url: '' },
    ],
  },
  {
    tier: 'Premium',
    color: 'green',
    desc: 'Langjährige Partner, die uns mit größeren Beiträgen und Sachspenden unterstützen.',
    sponsors: [
      { name: 'Bäckerei Hofer', since: 1998, branch: 'Bäckerei', logo: null, url: '' },
      { name: 'Druckerei Lindner', since: 2010, branch: 'Druck', logo: null, url: '' },
      { name: 'AutoHaus Weidinger', since: 2015, branch: 'KFZ', logo: null, url: '' },
      { name: 'Gasthof zur Post', since: 2005, branch: 'Gastronomie', logo: null, url: '' },
    ],
  },
  {
    tier: 'Förderer',
    color: 'gold',
    desc: 'Lokale Betriebe, die uns mit Sachleistungen und Beiträgen zur Seite stehen.',
    sponsors: [
      { name: 'Metzgerei Berger', since: 2012, branch: 'Lebensmittel', logo: null, url: '' },
      { name: 'Optik Reiter', since: 2018, branch: 'Optik', logo: null, url: '' },
      { name: 'Friseur Schober', since: 2017, branch: 'Friseur', logo: null, url: '' },
      { name: 'Blumen Mayer', since: 2019, branch: 'Floristik', logo: null, url: '' },
      { name: 'Elektro Pichler', since: 2014, branch: 'Elektro', logo: null, url: '' },
      { name: 'Tischlerei Eder', since: 2020, branch: 'Tischlerei', logo: null, url: '' },
      { name: 'Bauunternehmen Huber', since: 2011, branch: 'Bau', logo: null, url: '' },
      { name: 'Café Central', since: 2022, branch: 'Gastronomie', logo: null, url: '' },
    ],
  },
];

// Flache Liste der Namen — bleibt für ältere Aufrufer erhalten
const SPONSORS = SPONSORS_TIERS.flatMap(t => t.sponsors.map(s => s.name));

// Alle Sponsoren als Objekte inkl. Logo und Stufe, für das Laufband.
// Liest über window, damit Admin-Änderungen sofort greifen.
function sponsorList() {
  const tiers = (typeof window !== 'undefined' && window.SPONSORS_TIERS) || SPONSORS_TIERS;
  if (!Array.isArray(tiers)) return [];
  return tiers.flatMap(t => (t.sponsors || []).map(s => Object.assign({ tier: t.tier, color: t.color }, s)));
}

// ----- Foto Galerie -----
// Gruppen der Galerie — auch im Admin als Auswahlliste verwendet
const PHOTO_GROUPS = ['Garde', 'Musikzug', 'Präsidium', 'Allgemein'];

const PHOTOS = [
  // ----- Session 2026 -----
  { id: 'ph1', src: 'assets/garde.png', title: 'Garde am Hauptplatz', date: 'Feb 2026', year: 2026, group: 'Garde', album: 'Marktgemeinde-Gala', size: '1024×768', hdSize: '4096×3072' },
  { id: 'ph5', src: null, title: 'Mini-Garde Training', date: 'Jan 2026', year: 2026, group: 'Garde', album: 'Trainingsalltag', size: '1024×768', hdSize: '4096×3072' },
  { id: 'ph9', src: null, title: 'Inthronisation Prinzenpaar', date: 'Jan 2026', year: 2026, group: 'Präsidium', album: 'Inthronisation', size: '1024×768', hdSize: '4096×3072' },
  { id: 'ph10', src: null, title: 'Probenwochenende Musikzug', date: 'Jan 2026', year: 2026, group: 'Musikzug', album: 'Trainingsalltag', size: '1024×768', hdSize: '4096×3072' },

  // ----- Session 2025 -----
  { id: 'ph2', src: 'assets/guggenmusik.png', title: 'Musikzug Konzert', date: 'Nov 2025', year: 2025, group: 'Musikzug', album: 'Landeswettbewerb', size: '1024×768', hdSize: '4096×3072' },
  { id: 'ph7', src: null, title: 'Weihnachtsfeier im Saal', date: 'Dez 2025', year: 2025, group: 'Präsidium', album: 'Vereinsleben', size: '1024×768', hdSize: '4096×3072' },
  { id: 'ph8', src: null, title: 'Landeswettbewerb Linz', date: 'Nov 2025', year: 2025, group: 'Musikzug', album: 'Landeswettbewerb', size: '1024×768', hdSize: '4096×3072' },
  { id: 'ph3', src: null, title: 'Faschingsumzug 2025', date: 'Feb 2025', year: 2025, group: 'Allgemein', album: 'Faschingsumzug', size: '1024×768', hdSize: '4096×3072' },
  { id: 'ph4', src: null, title: 'Prinzenball Gala', date: 'Feb 2025', year: 2025, group: 'Präsidium', album: 'Prinzenball', size: '1024×768', hdSize: '4096×3072' },
  { id: 'ph6', src: null, title: 'Kehraus am Rathausplatz', date: 'Feb 2025', year: 2025, group: 'Allgemein', album: 'Kehraus', size: '1024×768', hdSize: '4096×3072' },
  { id: 'ph11', src: null, title: 'Showgrafen beim Bezirkstanzfest', date: 'Feb 2025', year: 2025, group: 'Garde', album: 'Bezirkstanzfest Steyr', size: '1024×768', hdSize: '4096×3072' },

  // ----- Session 2024 -----
  { id: 'ph12', src: null, title: 'Umzug bei Schneetreiben', date: 'Feb 2024', year: 2024, group: 'Allgemein', album: 'Faschingsumzug', size: '1024×768', hdSize: '4096×3072' },
  { id: 'ph13', src: null, title: 'Garde-Show im Festzelt', date: 'Feb 2024', year: 2024, group: 'Garde', album: 'Prinzenball', size: '1024×768', hdSize: '4096×3072' },
  { id: 'ph14', src: null, title: 'Musikzug am Marktplatz', date: 'Feb 2024', year: 2024, group: 'Musikzug', album: 'Faschingsumzug', size: '1024×768', hdSize: '4096×3072' },
  { id: 'ph15', src: null, title: 'Ordensverleihung im Präsidium', date: 'Nov 2024', year: 2024, group: 'Präsidium', album: 'Vereinsleben', size: '1024×768', hdSize: '4096×3072' },

  // ----- Session 2023 -----
  { id: 'ph16', src: null, title: 'Prinzenpaar 2023', date: 'Feb 2023', year: 2023, group: 'Präsidium', album: 'Inthronisation', size: '1024×768', hdSize: '4096×3072' },
  { id: 'ph17', src: null, title: 'Auftritt im ORF-Landesstudio', date: 'Jan 2023', year: 2023, group: 'Garde', album: 'Auswärtsauftritte', size: '1024×768', hdSize: '4096×3072' },
  { id: 'ph18', src: null, title: 'Guggenmusik am Kehraus', date: 'Feb 2023', year: 2023, group: 'Musikzug', album: 'Kehraus', size: '1024×768', hdSize: '4096×3072' },

  // ----- Session 2022 -----
  { id: 'ph19', src: null, title: 'Erste Präsidentin im Amt', date: 'Nov 2022', year: 2022, group: 'Präsidium', album: 'Vereinsleben', size: '1024×768', hdSize: '4096×3072' },
  { id: 'ph20', src: null, title: 'CD-Präsentation "Cowboys im Schnee"', date: 'Okt 2022', year: 2022, group: 'Musikzug', album: 'Vereinsleben', size: '1024×768', hdSize: '4096×3072' },
  { id: 'ph21', src: null, title: 'Neustart nach der Pause', date: 'Feb 2022', year: 2022, group: 'Allgemein', album: 'Faschingsumzug', size: '1024×768', hdSize: '4096×3072' },

  // ----- Ältere Jahrgänge -----
  { id: 'ph22', src: null, title: 'Wagenbau in der Halle', date: 'Jan 2020', year: 2020, group: 'Allgemein', album: 'Hinter den Kulissen', size: '1024×768', hdSize: '4096×3072' },
  { id: 'ph23', src: null, title: 'Sondertanz zum 60-Jahr-Jubiläum', date: 'Feb 2020', year: 2020, group: 'Garde', album: 'Jubiläum', size: '1024×768', hdSize: '4096×3072' },
  { id: 'ph24', src: null, title: 'Festakt 60 Jahre Nazumido', date: 'Feb 2020', year: 2020, group: 'Präsidium', album: 'Jubiläum', size: '1024×768', hdSize: '4096×3072' },
  { id: 'ph25', src: null, title: 'Umzug durch Micheldorf', date: 'Feb 2018', year: 2018, group: 'Allgemein', album: 'Faschingsumzug', size: '1024×768', hdSize: '4096×3072' },
  { id: 'ph26', src: null, title: 'Wiener Faschingskongress', date: 'Nov 2018', year: 2018, group: 'Musikzug', album: 'Auswärtsauftritte', size: '1024×768', hdSize: '4096×3072' },
  { id: 'ph27', src: null, title: 'Garde im Vereinsarchiv', date: 'Feb 2012', year: 2012, group: 'Garde', album: 'Archiv', size: '1024×768', hdSize: '4096×3072' },
];

// Jahr eines Fotos ermitteln — ältere Datenstände (Admin/localStorage) haben
// evtl. noch kein `year`-Feld, dann wird es aus dem Datum gelesen.
function photoYear(p) {
  if (p && p.year) return Number(p.year);
  const m = p && p.date && String(p.date).match(/(19|20)\d{2}/);
  return m ? Number(m[0]) : null;
}

// Aktuelle Galerie-Gruppen — im Admin (Einstellungen) änderbar, daher immer
// über window lesen statt über die Konstante oben.
function photoGroups() {
  const g = (typeof window !== 'undefined' && window.PHOTO_GROUPS) || PHOTO_GROUPS;
  return Array.isArray(g) && g.length ? g : PHOTO_GROUPS;
}

// ----- Galerie-Einstellungen -----
// Standardwerte; im Admin unter „Einstellungen › Galerie" überschreibbar
// (gespeichert als SITE_CONFIG.gallery).
const GALLERY_DEFAULTS = {
  kicker:         'Bildarchiv · seit 1962',
  title:          'Unsere Galerie',
  tagline:        'Sechs Jahrzehnte Konfetti, Kostüme und Kapriolen — unser Bildarchiv von den ersten Umzügen bis zur aktuellen Session.',
  sectionEyebrow: 'Rückblick',
  sectionTitle:   'Jahr für Jahr',
  sectionLead:    'Garde, Musikzug, Präsidium und das ganze närrische Vereinsleben — filtere nach Gruppe oder Saison und klick ein Foto für die Großansicht.',
  emptyTitle:     'Noch nichts im Kasten',
  emptyText:      'Für diese Auswahl gibt es aktuell keine Fotos. Probier eine andere Gruppe oder ein anderes Jahr.',
  showInNav:       true,   // Galerie-Link in Navigation und Footer
  showGroupFilter: true,   // Filterzeile „Gruppe"
  showYearFilter:  true,   // Filterzeile „Jahr"
  showAlbumBadge:  true,   // Anlass-Badge auf den Fotokacheln
  sort:           'neu',   // 'neu' = neueste Saison zuerst, 'alt' = älteste zuerst
  photosPerGroup:  8,      // Fotos in den Gruppen-Strips (Garde, Musikzug, Präsidium)
  hdMembersOnly:   true,   // HD-Download nur für angemeldete Mitglieder
  showHdSection:   true,   // dunkler HD-Abschnitt am Ende der Galerie-Seite
  hdTitle:        'Fotos in voller Auflösung',
  hdText:         'Die Web-Vorschau ist für alle da. Mitglieder laden jede Aufnahme zusätzlich in Originalgröße herunter — inklusive Archivbestand seit 2012.',
};

// Zusammengeführte Galerie-Einstellungen (Standard + Admin-Überschreibungen).
function galleryConfig() {
  const cfg = (typeof window !== 'undefined' && window.SITE_CONFIG) || SITE_CONFIG || {};
  const saved = cfg.gallery || {};
  const merged = Object.assign({}, GALLERY_DEFAULTS, saved);
  // Datenstände vor der Galerie-Einstellungsseite: Text lag direkt im SITE_CONFIG
  if (saved.tagline === undefined && cfg.galleryTagline) merged.tagline = cfg.galleryTagline;
  const n = Number(merged.photosPerGroup);
  merged.photosPerGroup = n > 0 ? Math.floor(n) : GALLERY_DEFAULTS.photosPerGroup;
  return merged;
}

// ----- Rechte & Rollen -----
// Der Rechtekatalog: jedes Recht schaltet einen Bereich im Mitgliederbereich
// (oder den Adminzugang) frei. Rollen bündeln Rechte, einzelne Konten können
// davon abweichen — siehe `userRights()`.
const RIGHTS = [
  { id: 'intern',     label: 'Mitgliederbereich', desc: 'Zugang zum internen Dashboard' },
  { id: 'termine',    label: 'Interne Termine',   desc: 'Nicht öffentliche Termine sehen' },
  { id: 'hdfotos',    label: 'HD-Fotodownload',   desc: 'Fotos in Originalauflösung laden' },
  { id: 'dokumente',  label: 'Interne Dokumente', desc: 'Protokolle, Pläne und Listen öffnen' },
  { id: 'training',   label: 'Trainingsbereich',  desc: 'Choreografien, Noten, Anwesenheit' },
  { id: 'finanzen',   label: 'Finanzen',          desc: 'Kassenbericht und Sponsorenverträge' },
  { id: 'mitglieder', label: 'Mitgliederverwaltung', desc: 'Konten und Rollen einsehen' },
  { id: 'admin',      label: 'Verwaltung',        desc: 'Zugriff auf das Admin-Panel (#admin)' },
];

// Vordefinierte Rollen, aufsteigend nach Rechteumfang. `color` steuert die
// Farbe von Rollen-Pille und Avatar (red · green · gold · ink).
const ROLES = [
  {
    id: 'Mitglied', label: 'Mitglied', color: 'green', signup: true,
    desc: 'Fördernde und passive Mitglieder: Vereinsinfos, interne Termine, HD-Fotos.',
    rights: ['intern', 'termine', 'hdfotos'],
  },
  {
    id: 'Aktiv', label: 'Aktives Mitglied', color: 'green', signup: true,
    desc: 'Tänzerinnen und Musiker: zusätzlich alle internen Unterlagen der eigenen Gruppe.',
    rights: ['intern', 'termine', 'hdfotos', 'dokumente'],
  },
  {
    id: 'Trainerin', label: 'Trainer:in', color: 'gold', signup: false,
    desc: 'Leitung von Garde und Musikzug: dazu Choreografien, Noten und Anwesenheitslisten.',
    rights: ['intern', 'termine', 'hdfotos', 'dokumente', 'training'],
  },
  {
    id: 'Vorstand', label: 'Vorstand', color: 'red', signup: false,
    desc: 'Vereinsführung: dazu Finanzen, Verträge und die Mitgliederverwaltung.',
    rights: ['intern', 'termine', 'hdfotos', 'dokumente', 'training', 'finanzen', 'mitglieder'],
  },
  {
    id: 'Admin', label: 'Administrator', color: 'ink', signup: false,
    desc: 'Vollzugriff inklusive Verwaltung der Website-Inhalte.',
    rights: ['intern', 'termine', 'hdfotos', 'dokumente', 'training', 'finanzen', 'mitglieder', 'admin'],
  },
];

// Aktuelle Rollenliste — im Admin (Benutzer › Rollen & Rechte) änderbar
function roles() {
  const r = (typeof window !== 'undefined' && window.ROLES) || ROLES;
  return Array.isArray(r) && r.length ? r : ROLES;
}

// Rollendefinition zu einer Rollen-Id; unbekannte Rollen fallen auf „Mitglied"
// zurück, damit alte Konten aus dem localStorage nicht rechtelos dastehen.
function roleInfo(id) {
  const list = roles();
  return list.find(r => r.id === id)
    || list.find(r => r.id === 'Mitglied')
    || { id: id || 'Mitglied', label: id || 'Mitglied', color: 'green', rights: ['intern'] };
}

// Rechte eines Kontos: eigene `rights`-Liste (personalisiert) schlägt die Rolle
function userRights(user) {
  if (!user) return [];
  if (Array.isArray(user.rights)) return user.rights;
  return roleInfo(user.role).rights || [];
}

function hasRight(user, right) {
  return userRights(user).indexOf(right) !== -1;
}

// Angemeldetes Konto — von app.jsx/auth.jsx auf window gespiegelt
function currentUser() {
  return (typeof window !== 'undefined' && window.__currentUser) || null;
}

// Darf die HD-Fassung der Fotos geladen werden?
function canDownloadHd(user) {
  if (!galleryConfig().hdMembersOnly) return true;
  return hasRight(user === undefined ? currentUser() : user, 'hdfotos');
}

// ----- Mitglieder-Logins (vordefinierte Konten) -----
// Im Admin unter „Benutzer" erweiterbar; `rights` (optional) überschreibt dort
// die Rechte der Rolle für ein einzelnes Konto.
const DEMO_USERS = [
  { email: 'gast@nazumido.at', password: 'gast', name: 'Gast Mitglied', role: 'Mitglied', avatar: 'G' },
  { email: 'aktiv@nazumido.at', password: 'aktiv', name: 'Anna Berger', role: 'Aktiv', group: 'Garde', avatar: 'A' },
  { email: 'garde@nazumido.at', password: 'garde', name: 'Karin Schober', role: 'Trainerin', group: 'Garde', avatar: 'K' },
  { email: 'vorstand@nazumido.at', password: 'vorstand', name: 'Markus Reiter', role: 'Vorstand', group: 'Präsidium', avatar: 'M' },
  { email: 'admin@nazumido.at', password: 'admin', name: 'Sabine Mayer', role: 'Admin', group: 'Präsidium', avatar: 'S' },
];

// Aktuelle Kontenliste (Admin-Überschreibungen berücksichtigt)
function demoUsers() {
  const u = (typeof window !== 'undefined' && window.DEMO_USERS) || DEMO_USERS;
  return Array.isArray(u) ? u : DEMO_USERS;
}

// ----- Interne Inhalte nach Rolle -----
// `right` blendet einen Eintrag aus, wenn dem Konto das Recht fehlt.
const INTERNAL = {
  Mitglied: [
    { kind: 'doc', icon: '📅', title: 'Saisonkalender intern', meta: 'PDF · 2.3 MB · aktualisiert 12.01.' },
    { kind: 'doc', icon: '📝', title: 'Mitgliederbrief Januar', meta: 'PDF · 800 KB' },
    { kind: 'doc', icon: '🎫', title: 'Mitglieder-Rabattcode Prinzenball', meta: '15 % Rabatt — Code MITGLIED26' },
    { kind: 'photos', icon: '📸', title: 'HD-Fotodownload', meta: 'Alle 8 Galerien · ZIP bis zu 240 MB', right: 'hdfotos' },
  ],
  Aktiv: [
    { kind: 'doc', icon: '📅', title: 'Saisonkalender intern', meta: 'PDF · 2.3 MB · aktualisiert 12.01.' },
    { kind: 'doc', icon: '👗', title: 'Kostümplan & Ausgabe', meta: 'PDF · 1.2 MB', right: 'dokumente' },
    { kind: 'doc', icon: '🚌', title: 'Fahrgemeinschaften Auswärtsauftritte', meta: 'Liste · 6 Termine', right: 'dokumente' },
    { kind: 'doc', icon: '🎫', title: 'Mitglieder-Rabattcode Prinzenball', meta: '15 % Rabatt — Code MITGLIED26' },
    { kind: 'photos', icon: '📸', title: 'HD-Fotodownload', meta: 'Alle Galerien der eigenen Gruppe', right: 'hdfotos' },
  ],
  Trainerin: [
    { kind: 'doc', icon: '🎵', title: 'Choreografie-Notation Saison 2026', meta: 'PDF · 4.1 MB · vertraulich', right: 'training' },
    { kind: 'doc', icon: '🎬', title: 'Probevideos Garde (privat)', meta: 'Vimeo · 24 Clips', right: 'training' },
    { kind: 'doc', icon: '📋', title: 'Anwesenheitsliste Q1', meta: 'Excel · 120 KB', right: 'training' },
    { kind: 'doc', icon: '🎫', title: 'Trainerausweis 2026', meta: 'PDF · 200 KB' },
    { kind: 'photos', icon: '📸', title: 'HD-Fotodownload + Backstage', meta: 'Erweiterte Galerie · auch Proben', right: 'hdfotos' },
  ],
  Vorstand: [
    { kind: 'doc', icon: '📊', title: 'Kassenbericht Q4 2025', meta: 'PDF · 1.8 MB · vertraulich', right: 'finanzen' },
    { kind: 'doc', icon: '📑', title: 'Sitzungsprotokolle 2025', meta: 'PDF · 12 Protokolle', right: 'dokumente' },
    { kind: 'doc', icon: '💼', title: 'Sponsorenverträge', meta: 'Ordner · 14 Verträge', right: 'finanzen' },
    { kind: 'doc', icon: '🗓️', title: 'Jahresplanung 2027 (Draft)', meta: 'Google Doc · Bearbeitung' },
    { kind: 'doc', icon: '📧', title: 'Mitgliederverwaltung', meta: '184 aktive Konten', right: 'mitglieder' },
    { kind: 'photos', icon: '📸', title: 'Komplettarchiv HD', meta: 'Alle Galerien seit 2012 · 14 GB', right: 'hdfotos' },
  ],
  Admin: [
    { kind: 'admin', icon: '🛠️', title: 'Website-Verwaltung', meta: 'Events, News, Galerie, Sponsoren, Benutzer', right: 'admin' },
    { kind: 'doc', icon: '📊', title: 'Kassenbericht Q4 2025', meta: 'PDF · 1.8 MB · vertraulich', right: 'finanzen' },
    { kind: 'doc', icon: '📑', title: 'Sitzungsprotokolle 2025', meta: 'PDF · 12 Protokolle', right: 'dokumente' },
    { kind: 'doc', icon: '📧', title: 'Mitgliederverwaltung', meta: '184 aktive Konten', right: 'mitglieder' },
    { kind: 'photos', icon: '📸', title: 'Komplettarchiv HD', meta: 'Alle Galerien seit 2012 · 14 GB', right: 'hdfotos' },
  ],
};

// ----- Tickets / Online-Reservierung -----
// Standardwerte; im Admin unter „Einstellungen › Tickets" überschreibbar
// (gespeichert als SITE_CONFIG.tickets).
const TICKET_DEFAULTS = {
  enabled:        true,    // Online-Reservierung überhaupt anbieten
  showInEvents:   true,    // Reservieren-Button direkt in der Terminliste
  ctaLabel:       'Tickets reservieren',
  title:          'Tickets reservieren',
  lead:           'Reserviere deine Plätze online — wir legen sie unter deinem Namen an der Abendkasse bereit.',
  successTitle:   'Reservierung notiert!',
  successText:    'Wir haben deine Anfrage aufgenommen und melden uns per E-Mail. Bitte hol deine Karten spätestens 15 Minuten vor Beginn an der Abendkasse ab.',
  closedText:     'Für diesen Termin gibt es keine Online-Reservierung. Karten bekommst du an der Abendkasse oder telefonisch im Vereinslokal.',
  openWeeks:      0,       // Reservierung startet X Wochen vor dem Termin (0 = sofort)
  maxPerBooking:  10,      // Höchstzahl Plätze je Reservierung
  requirePhone:   false,   // Telefonnummer als Pflichtfeld
  notifyEmail:    '',      // Zieladresse der Reservierungsmail (leer = SITE_CONFIG.email)
  showMailCopy:   true,    // Nach dem Absenden Link „Kopie per E-Mail senden"
  openInNewTab:   true,    // Reservierung in eigenem Browser-Tab (#reservierung) statt im Modal
  autoMail:       true,    // Bestätigungsmail über den Worker (/api/reservations) verschicken
  offerPdf:       true,    // Bestätigung als PDF zum Herunterladen anbieten
};

// Zusammengeführte Ticket-Einstellungen (Standard + Admin-Überschreibungen).
function ticketConfig() {
  const merged = Object.assign({}, TICKET_DEFAULTS, siteConfig().tickets || {});
  const max = parseInt(merged.maxPerBooking, 10);
  merged.maxPerBooking = max > 0 ? max : TICKET_DEFAULTS.maxPerBooking;
  const weeks = parseInt(merged.openWeeks, 10);
  merged.openWeeks = weeks > 0 ? weeks : 0;
  return merged;
}

// Kann für diesen Termin gerade online reserviert werden?
// reason: 'open' | 'off' (global aus) | 'event-off' (Termin ohne Reservierung)
//         | 'past' (Termin vorbei) | 'soon' (Vorlauf noch nicht erreicht)
function ticketState(ev) {
  const cfg = ticketConfig();
  if (!cfg.enabled) return { open: false, reason: 'off', cfg };
  if (!ev || !ev.tickets) return { open: false, reason: 'event-off', cfg };
  const at = eventDate(ev);
  if (!at) return { open: false, reason: 'event-off', cfg };
  const today = startOfToday();
  if (at < today) return { open: false, reason: 'past', at, cfg };
  if (cfg.openWeeks > 0) {
    const opensAt = new Date(at.getFullYear(), at.getMonth(), at.getDate() - cfg.openWeeks * 7);
    if (today < opensAt) return { open: false, reason: 'soon', at, opensAt, cfg };
  }
  return { open: true, reason: 'open', at, cfg };
}

// Termine, für die aktuell reserviert werden kann — aufsteigend nach Datum
function reservableEvents() {
  return allEvents()
    .filter(ev => ticketState(ev).open)
    .sort((a, b) => eventDate(a) - eventDate(b));
}

// Termin über seine id finden (z. B. für die Reservierungsseite #reservierung/<id>)
function findEvent(id) {
  if (!id) return null;
  return allEvents().find(ev => String(ev.id) === String(id)) || null;
}

const RESERVATIONS_KEY = 'nazumido_reservations';

// Reservierungen liegen im localStorage des jeweiligen Browsers (kein Backend).
function loadReservations() {
  try {
    const raw = localStorage.getItem(RESERVATIONS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch (e) { return []; }
}

function saveReservations(list) {
  try { localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(list)); } catch (e) {}
  return list;
}

// Legt eine Reservierung an und gibt sie inkl. Kennung zurück
function addReservation(entry) {
  const res = Object.assign({
    id: 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    code: 'NZ-' + Math.random().toString(36).slice(2, 7).toUpperCase(),
    at: new Date().toISOString(),
  }, entry);
  saveReservations([res, ...loadReservations()]);
  return res;
}

// Reservierung an den Worker schicken: dort wird sie in D1 gespeichert und die
// Bestätigungsmail verschickt (siehe src/worker.js). Ohne Worker — etwa beim
// Öffnen der Dateien direkt im Browser — schlägt der Aufruf fehl; die Website
// bleibt dann beim mailto-Link. Wirft nie, sondern meldet das Ergebnis zurück.
async function submitReservation(res) {
  if (ticketConfig().autoMail === false) return { ok: false, reason: 'off' };
  try {
    const resp = await fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(res),
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) return { ok: false, reason: data.error || `HTTP ${resp.status}` };
    return Object.assign({ ok: true }, data);
  } catch (e) {
    return { ok: false, reason: (e && e.message) || 'Netzwerkfehler' };
  }
}

const SITE_CONFIG = {
  season:        '11.11.2025 — 17.02.2026',
  memberCount:   '184',
  heroNextEvent: 'Umzug — 14. Februar',
  welcomeYears:  '64',
  welcomeMembers:'184',
  welcomeGroups: '3',
  welcomeEvents: '12',
  presidentName: 'Johann Bloderer',
  address:       'Hehenberg 163',
  city:          '4540 Bad Hall',
  phone:         '+43 664 9233429',
  email:         'Nazu.Mido@gmx.at',
  website:       'https://www.nazu-mido.at',
  websiteLabel:  'www.nazu-mido.at',
  gallery:       Object.assign({}, GALLERY_DEFAULTS),
  tickets:       Object.assign({}, TICKET_DEFAULTS),
  topbarStrip: [
    'Session 2026 · Helau & Narri!',
    'Großer Faschingsumzug 14. Februar',
    'Prinzenball — Tickets ab sofort',
    'Mini-Garde sucht Nachwuchs',
    'Musikzug holt Bronze',
  ],
  // Hauptschalter der Laufschrift (Admin › Vereinsinfo › Laufschrift)
  topbarStripEnabled: true,
  // Laufschrift nur zeigen, solange ein Termin bevorsteht
  topbarStripOnlyWithEvent: true,
  topbarStripWeeks: 0,  // 0 = jedes künftige Event, sonst Vorlauf in Wochen
};

// Vorlauf der Laufschrift in Tagen. Eingestellt wird in Wochen; ältere
// Datenstände (localStorage) haben stattdessen noch `topbarStripDays`.
function topbarStripLeadDays() {
  const cfg = siteConfig();
  if (cfg.topbarStripWeeks !== undefined && cfg.topbarStripWeeks !== null && cfg.topbarStripWeeks !== '') {
    const w = parseInt(cfg.topbarStripWeeks, 10);
    return w > 0 ? w * 7 : 0;
  }
  const d = parseInt(cfg.topbarStripDays, 10);
  return d > 0 ? d : 0;
}

// Soll die Laufschrift im Kopfbereich angezeigt werden?
function showTopbarStrip() {
  const cfg = siteConfig();
  if (cfg.topbarStripEnabled === false) return false;
  if (!(cfg.topbarStrip || []).some(t => String(t).trim())) return false;
  if (cfg.topbarStripOnlyWithEvent === false) return true;
  return upcomingEvents(topbarStripLeadDays()).length > 0;
}

Object.assign(window, {
  NEWS, EVENTS, GROUPS, PEOPLE, TAGS, SPONSORS, SPONSORS_TIERS, sponsorList,
  RIGHTS, ROLES, roles, roleInfo, userRights, hasRight, currentUser, canDownloadHd, demoUsers,
  GARDE, MUSIKZUG, VORSITZ, PHOTOS, PHOTO_GROUPS, photoYear, photoGroups,
  GALLERY_DEFAULTS, galleryConfig, eventDate, upcomingEvents, showTopbarStrip,
  siteConfig, allEvents, startOfToday, topbarStripLeadDays,
  MONTH_NAMES, dateLabel, eventDateLabel,
  TICKET_DEFAULTS, ticketConfig, ticketState, reservableEvents, findEvent,
  RESERVATIONS_KEY, loadReservations, saveReservations, addReservation, submitReservation,
  DEMO_USERS, INTERNAL, SITE_CONFIG,
});
