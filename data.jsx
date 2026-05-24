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

const EVENTS = [
  {
    id: 'e1',
    d: '14', m: 'Feb', day: 'Samstag',
    title: 'Großer Faschingsumzug',
    kind: 'Hauptevent · Session 2026',
    desc: 'Über 30 Gruppen, 12 Wagen, eine Stadt im Ausnahmezustand. Start am Hauptplatz, anschließend Faschingstreiben im Festzelt.',
    time: '14:00 Uhr',
    where: 'Hauptplatz Micheldorf',
  },
  {
    id: 'e2',
    d: '21', m: 'Feb', day: 'Samstag',
    title: 'Prinzenball',
    kind: 'Gala · Eintritt 28 €',
    desc: 'Großer Galaball mit Inthronisation des Prinzenpaars. Liveband, Garde-Show, Mitternachtseinlage vom Musikzug.',
    time: '19:30 Uhr',
    where: 'Festsaal Micheldorf',
  },
  {
    id: 'e3',
    d: '24', m: 'Feb', day: 'Dienstag',
    title: 'Faschingskehraus',
    kind: 'Tradition · Eintritt frei',
    desc: 'Letzte Runde durchs Dorf, gemeinsames Krapfen-Essen und Verbrennung der Faschings-Hex am Rathausplatz.',
    time: '17:00 Uhr',
    where: 'Rathausplatz',
  },
  {
    id: 'e4',
    d: '12', m: 'Mar', day: 'Donnerstag',
    title: 'Mitgliederversammlung',
    kind: 'Vereinsintern',
    desc: 'Jahresrückblick, Kassenbericht, Neuwahlen. Anschließend gemütlicher Ausklang bei Schnitzel und Bier.',
    time: '19:30 Uhr',
    where: 'Gasthof Hofer',
  },
  {
    id: 'e5',
    d: '08', m: 'Nov', day: 'Samstag',
    title: 'Inthronisation Session 2027',
    kind: 'Auftakt · 11.11.',
    desc: 'Der Vorhang öffnet sich erneut: Vorstellung des neuen Prinzenpaars und Saisoneröffnung im großen Stil.',
    time: '20:11 Uhr',
    where: 'Vereinslokal',
  },
];

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
    title: 'Vorsitz',
    desc: 'Tradition trifft Schalk: Der Vorsitz führt durch jede Veranstaltung mit Witz, Würde und einem Schluck Bier.',
    stats: ['Gegründet 1962', 'Sitzung 1× im Monat'],
    placeholder: 'Foto Vorsitz',
  },
];

const PEOPLE = [
  { id: 'p1', initial: 'M', name: 'Markus Reiter', role: 'Präsident', group: 'Vorsitz', dotColor: 'red', bio: 'Im Verein seit 2002. Bricht jeden Eröffnungsspruch mit Bravour.', contact: 'praesident@nazumido.at' },
  { id: 'p2', initial: 'A', name: 'Anna Berger', role: 'Vizepräsidentin', group: 'Vorsitz', dotColor: 'green', bio: 'Hält die Fäden im Hintergrund zusammen — und alles im Zeitplan.', contact: 'vize@nazumido.at' },
  { id: 'p3', initial: 'K', name: 'Karin Schober', role: 'Trainerin Garde', group: 'Garde', dotColor: 'red', bio: 'Choreografin, Motivatorin, Tanzpädagogin. Erfolg sei "Disziplin mit Glitzer".', contact: 'garde@nazumido.at' },
  { id: 'p4', initial: 'F', name: 'Franz Huber', role: 'Kapellmeister', group: 'Musikzug', dotColor: 'gold', bio: 'Seit 18 Jahren am Taktstock. Schiefer als seine Trompeten ist nur sein Humor.', contact: 'musik@nazumido.at' },
  { id: 'p5', initial: 'T', name: 'Tom Weidinger', role: 'Kassier', group: 'Vorsitz', dotColor: 'green', bio: 'Zählt Krapfen, Mitgliedsbeiträge und Bierdeckel mit gleicher Akribie.', contact: 'kasse@nazumido.at' },
  { id: 'p6', initial: 'S', name: 'Sabine Mayer', role: 'Schriftführerin', group: 'Vorsitz', dotColor: 'red', bio: 'Schreibt das Protokoll schneller, als der Präsident sprechen kann.', contact: 'office@nazumido.at' },
  { id: 'p7', initial: 'O', name: 'Otto Pichler', role: 'Hofnarr', group: 'Vorsitz', dotColor: 'gold', bio: 'Der heimliche Star jeder Veranstaltung. Punschausschank inklusive.', contact: '—' },
  { id: 'p8', initial: 'L', name: 'Lisa Eder', role: 'Jugendreferentin', group: 'Garde', dotColor: 'green', bio: 'Bringt die Mini-Garde zum Strahlen und die Eltern zum Schwitzen.', contact: 'jugend@nazumido.at' },
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
    { name: 'Hauptgarde', age: '16+', count: 8, color: 'red' },
    { name: 'Juniorgarde', age: '11—15', count: 6, color: 'green' },
    { name: 'Mini-Garde', age: '6—10', count: 9, color: 'gold' },
  ],
  highlights: [
    { year: '2025', text: 'Erster Platz beim Bezirkstanzfest Steyr' },
    { year: '2023', text: 'Auftritt im ORF-Landesstudio' },
    { year: '2020', text: 'Sondertanz zum 60-Jahr-Jubiläum' },
    { year: '1998', text: 'Gründung der Garde durch Karin Schober' },
  ],
  schedule: [
    { d: 'Mo', t: '18:30', what: 'Hauptgarde — Choreografie' },
    { d: 'Mi', t: '17:00', what: 'Juniorgarde — Technik' },
    { d: 'Do', t: '16:30', what: 'Mini-Garde — Spiel & Bewegung' },
    { d: 'Do', t: '18:30', what: 'Hauptgarde — Hebefiguren' },
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
  title: 'Vorsitz',
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
const SPONSORS_TIERS = [
  {
    tier: 'Hauptsponsor',
    color: 'red',
    desc: 'Trägt unsere Saison maßgeblich. Logo auf jedem Plakat, Programm und Banner.',
    sponsors: [
      { name: 'Raiffeisenbank Micheldorf', since: 2008, branch: 'Bank' },
      { name: 'Marktgemeinde Micheldorf', since: 1962, branch: 'Gemeinde' },
    ],
  },
  {
    tier: 'Premium',
    color: 'green',
    desc: 'Langjährige Partner, die uns mit größeren Beiträgen und Sachspenden unterstützen.',
    sponsors: [
      { name: 'Bäckerei Hofer', since: 1998, branch: 'Bäckerei' },
      { name: 'Druckerei Lindner', since: 2010, branch: 'Druck' },
      { name: 'AutoHaus Weidinger', since: 2015, branch: 'KFZ' },
      { name: 'Gasthof zur Post', since: 2005, branch: 'Gastronomie' },
    ],
  },
  {
    tier: 'Förderer',
    color: 'gold',
    desc: 'Lokale Betriebe, die uns mit Sachleistungen und Beiträgen zur Seite stehen.',
    sponsors: [
      { name: 'Metzgerei Berger', since: 2012, branch: 'Lebensmittel' },
      { name: 'Optik Reiter', since: 2018, branch: 'Optik' },
      { name: 'Friseur Schober', since: 2017, branch: 'Friseur' },
      { name: 'Blumen Mayer', since: 2019, branch: 'Floristik' },
      { name: 'Elektro Pichler', since: 2014, branch: 'Elektro' },
      { name: 'Tischlerei Eder', since: 2020, branch: 'Tischlerei' },
      { name: 'Bauunternehmen Huber', since: 2011, branch: 'Bau' },
      { name: 'Café Central', since: 2022, branch: 'Gastronomie' },
    ],
  },
];

// Flache Liste für Marquee
const SPONSORS = SPONSORS_TIERS.flatMap(t => t.sponsors.map(s => s.name));

// ----- Foto Galerie -----
const PHOTOS = [
  { id: 'ph1', src: 'assets/garde.png', title: 'Garde am Hauptplatz', date: 'Feb 2026', group: 'Garde', size: '1024×768', hdSize: '4096×3072' },
  { id: 'ph2', src: 'assets/guggenmusik.png', title: 'Musikzug Konzert', date: 'Nov 2025', group: 'Musikzug', size: '1024×768', hdSize: '4096×3072' },
  { id: 'ph3', src: null, title: 'Faschingsumzug 2025', date: 'Feb 2025', group: 'Allgemein', size: '1024×768', hdSize: '4096×3072' },
  { id: 'ph4', src: null, title: 'Prinzenball Gala', date: 'Feb 2025', group: 'Vorsitz', size: '1024×768', hdSize: '4096×3072' },
  { id: 'ph5', src: null, title: 'Mini-Garde Training', date: 'Jan 2026', group: 'Garde', size: '1024×768', hdSize: '4096×3072' },
  { id: 'ph6', src: null, title: 'Kehraus 2025', date: 'Feb 2025', group: 'Allgemein', size: '1024×768', hdSize: '4096×3072' },
  { id: 'ph7', src: null, title: 'Weihnachtsfeier', date: 'Dez 2025', group: 'Vorsitz', size: '1024×768', hdSize: '4096×3072' },
  { id: 'ph8', src: null, title: 'Landeswettbewerb', date: 'Nov 2025', group: 'Musikzug', size: '1024×768', hdSize: '4096×3072' },
];

// ----- Mitglieder-Demo (vordefinierte Logins) -----
const DEMO_USERS = [
  { email: 'gast@nazumido.at', password: 'gast', name: 'Gast Mitglied', role: 'Mitglied', avatar: 'G' },
  { email: 'garde@nazumido.at', password: 'garde', name: 'Karin Schober', role: 'Trainerin', group: 'Garde', avatar: 'K' },
  { email: 'vorstand@nazumido.at', password: 'vorstand', name: 'Markus Reiter', role: 'Vorstand', group: 'Vorsitz', avatar: 'M' },
];

// ----- Interne Inhalte nach Rolle -----
const INTERNAL = {
  Mitglied: [
    { kind: 'doc', icon: '📅', title: 'Saisonkalender intern', meta: 'PDF · 2.3 MB · aktualisiert 12.01.' },
    { kind: 'doc', icon: '📝', title: 'Mitgliederbrief Januar', meta: 'PDF · 800 KB' },
    { kind: 'doc', icon: '🎫', title: 'Mitglieder-Rabattcode Prinzenball', meta: '15 % Rabatt — Code MITGLIED26' },
    { kind: 'photos', icon: '📸', title: 'HD-Fotodownload', meta: 'Alle 8 Galerien · ZIP bis zu 240 MB' },
  ],
  Trainerin: [
    { kind: 'doc', icon: '🎵', title: 'Choreografie-Notation Saison 2026', meta: 'PDF · 4.1 MB · vertraulich' },
    { kind: 'doc', icon: '🎬', title: 'Probevideos Garde (privat)', meta: 'Vimeo · 24 Clips' },
    { kind: 'doc', icon: '📋', title: 'Anwesenheitsliste Q1', meta: 'Excel · 120 KB' },
    { kind: 'doc', icon: '🎫', title: 'Trainerausweis 2026', meta: 'PDF · 200 KB' },
    { kind: 'photos', icon: '📸', title: 'HD-Fotodownload + Backstage', meta: 'Erweiterte Galerie · auch Proben' },
  ],
  Vorstand: [
    { kind: 'doc', icon: '📊', title: 'Kassenbericht Q4 2025', meta: 'PDF · 1.8 MB · vertraulich' },
    { kind: 'doc', icon: '📑', title: 'Sitzungsprotokolle 2025', meta: 'PDF · 12 Protokolle' },
    { kind: 'doc', icon: '💼', title: 'Sponsorenverträge', meta: 'Ordner · 14 Verträge' },
    { kind: 'doc', icon: '🗓️', title: 'Jahresplanung 2027 (Draft)', meta: 'Google Doc · Bearbeitung' },
    { kind: 'doc', icon: '📧', title: 'Mitgliederverwaltung', meta: '184 aktive Konten' },
    { kind: 'photos', icon: '📸', title: 'Komplettarchiv HD', meta: 'Alle Galerien seit 2012 · 14 GB' },
  ],
};

Object.assign(window, {
  NEWS, EVENTS, GROUPS, PEOPLE, TAGS, SPONSORS, SPONSORS_TIERS,
  GARDE, MUSIKZUG, VORSITZ, PHOTOS, DEMO_USERS, INTERNAL,
});
