<?php
// Load data
function load_json(string $file): array {
    $path = __DIR__ . '/data/' . $file;
    if (!file_exists($path)) return [];
    $d = json_decode(file_get_contents($path), true);
    return is_array($d) ? $d : [];
}
function h(string $s): string { return htmlspecialchars($s, ENT_QUOTES, 'UTF-8'); }

$content  = load_json('content.json');
$settings = load_json('settings.json');
$raw_events = load_json('events.json');

// Sort events by date
usort($raw_events, fn($a, $b) => strcmp($a['date'], $b['date']));

// Get gallery images
$gallery_files = glob(__DIR__ . '/images/gallery/*.{jpg,jpeg,png,gif,webp}', GLOB_BRACE) ?: [];
usort($gallery_files, fn($a, $b) => filemtime($b) - filemtime($a));

// Featured + other events
$featured_event = null;
$other_events   = [];
foreach ($raw_events as $e) {
    if (!empty($e['featured']) && !$featured_event) $featured_event = $e;
    else $other_events[] = $e;
}
if (!$featured_event && $raw_events) {
    $featured_event = array_shift($raw_events);
    $other_events   = $raw_events;
}
$other_events = array_slice($other_events, 0, 4);

$c = $content;
$s = $settings;
$h = fn(string $str) => htmlspecialchars($str, ENT_QUOTES, 'UTF-8');

$type_badges = [
    'highlight' => 'Highlight',
    'ball'      => 'Ball',
    'familie'   => 'Familie',
    'abschluss' => 'Finale',
    'sonstig'   => 'Event',
];
?>
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="NazuMido – Narrenzunft der schwarzen Grafen aus Kirchdorf an der Krems. Der traditionsreiche Faschingsverein mit Garde, Elferrat und unvergesslichen Events.">
    <title>NazuMido – Narrenzunft der schwarzen Grafen | Kirchdorf</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Open+Sans:ital,wght@0,300;0,400;0,600;1,400&family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/style.css">
</head>
<body>

    <!-- NAVIGATION -->
    <nav id="navbar">
        <div class="nav-container">
            <a href="#hero" class="nav-logo">
                <img src="images/logo.png" alt="NazuMido Logo" class="nav-logo-img"
                     onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                <span class="logo-crown-fallback" style="display:none">♛</span>
                <div class="logo-text-wrap">
                    <span class="logo-name"><?= h($c['hero']['title'] ?? 'NazuMido') ?></span>
                    <span class="logo-sub"><?= h($c['hero']['subtitle'] ?? 'Narrenzunft der schwarzen Grafen') ?></span>
                </div>
            </a>
            <ul class="nav-links" id="nav-links">
                <li><a href="#ueber-uns">Über uns</a></li>
                <li><a href="#gruppen">Gruppen</a></li>
                <li><a href="#termine">Termine</a></li>
                <li><a href="#galerie">Galerie</a></li>
                <li><a href="#kontakt" class="nav-cta">Kontakt</a></li>
            </ul>
            <button class="burger" id="burger" aria-label="Menü öffnen" aria-expanded="false">
                <span></span><span></span><span></span>
            </button>
        </div>
    </nav>

    <!-- HERO -->
    <section id="hero">
        <div class="hero-bg">
            <div class="hero-photo">
                <img src="images/band.jpg" alt="NazuMido Marschkapelle"
                     onerror="this.parentElement.style.display='none'">
            </div>
            <div class="hero-overlay"></div>
            <canvas id="confetti-canvas"></canvas>
        </div>
        <div class="hero-content">
            <p class="hero-eyebrow"><?= h($c['hero']['pretext'] ?? 'Willkommen bei der') ?></p>
            <div class="hero-logo-wrap">
                <img src="images/logo.png" alt="NazuMido Logo" class="hero-logo"
                     onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
                <h1 class="hero-title-fallback" style="display:none"><?= h($c['hero']['title'] ?? 'NazuMido') ?></h1>
            </div>
            <p class="hero-subtitle"><?= h($c['hero']['subtitle'] ?? 'Narrenzunft der schwarzen Grafen') ?></p>
            <div class="hero-divider">
                <span class="divider-line"></span>
                <span class="divider-icon">♛</span>
                <span class="divider-line"></span>
            </div>
            <p class="hero-location"><?= h($c['hero']['location'] ?? 'Kirchdorf an der Krems · Oberösterreich') ?></p>
            <p class="hero-motto"><?= h($c['hero']['motto'] ?? '"Jetzt wird\'s närrisch!"') ?></p>
            <div class="hero-actions">
                <a href="#ueber-uns" class="btn btn-primary">Über uns</a>
                <a href="#termine" class="btn btn-outline">Termine <?= h($s['general']['season'] ?? '2026/27') ?></a>
            </div>
        </div>
        <a href="#ueber-uns" class="hero-scroll" aria-label="Nach unten scrollen">
            <span class="scroll-text">Scroll</span>
            <span class="scroll-line"></span>
            <span class="scroll-arrow">↓</span>
        </a>
    </section>

    <!-- ÜBER UNS -->
    <section id="ueber-uns" class="section">
        <div class="container">
            <header class="section-header">
                <span class="section-eyebrow"><?= h($c['about']['eyebrow'] ?? 'Tradition seit Jahrzehnten') ?></span>
                <h2 class="section-title">Über uns</h2>
                <div class="title-ornament"><span>♛</span></div>
            </header>
            <div class="about-grid">
                <div class="about-text">
                    <p class="lead"><?= $c['about']['lead'] ?? '' ?></p>
                    <p><?= h($c['about']['text1'] ?? '') ?></p>
                    <p><?= $c['about']['text2'] ?? '' ?></p>
                    <div class="about-stats">
                        <div class="stat-item">
                            <span class="stat-number"><?= h($c['about']['stat_years'] ?? '50+') ?></span>
                            <span class="stat-label">Jahre Tradition</span>
                        </div>
                        <div class="stat-divider"></div>
                        <div class="stat-item">
                            <span class="stat-number"><?= h($c['about']['stat_members'] ?? '100+') ?></span>
                            <span class="stat-label">Aktive Mitglieder</span>
                        </div>
                        <div class="stat-divider"></div>
                        <div class="stat-item">
                            <span class="stat-number">1</span>
                            <span class="stat-label">Fünfte Jahreszeit</span>
                        </div>
                    </div>
                </div>
                <div class="about-cards">
                    <div class="about-card reveal-right">
                        <div class="about-card-accent"></div>
                        <span class="about-card-icon">♛</span>
                        <h3><?= h($c['about']['card1_title'] ?? 'Tradition') ?></h3>
                        <p><?= h($c['about']['card1_text'] ?? '') ?></p>
                    </div>
                    <div class="about-card reveal-right" style="transition-delay:.1s">
                        <div class="about-card-accent"></div>
                        <span class="about-card-icon">🎭</span>
                        <h3><?= h($c['about']['card2_title'] ?? 'Gemeinschaft') ?></h3>
                        <p><?= h($c['about']['card2_text'] ?? '') ?></p>
                    </div>
                    <div class="about-card reveal-right" style="transition-delay:.2s">
                        <div class="about-card-accent"></div>
                        <span class="about-card-icon">🎊</span>
                        <h3><?= h($c['about']['card3_title'] ?? 'Spaß') ?></h3>
                        <p><?= h($c['about']['card3_text'] ?? '') ?></p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- GRUPPEN -->
    <section id="gruppen" class="section section-dark">
        <div class="container">
            <header class="section-header">
                <span class="section-eyebrow">Wir stellen uns vor</span>
                <h2 class="section-title">Unsere Gruppen</h2>
                <div class="title-ornament"><span>♛</span></div>
            </header>
            <div class="groups-grid">

                <div class="group-card reveal-up">
                    <div class="group-visual">
                        <img src="images/garde.jpg" alt="Die Garde"
                             onerror="this.style.display='none';this.parentElement.classList.add('garde-bg')">
                        <div class="group-visual-overlay">
                            <span class="group-emoji">💃</span>
                        </div>
                        <div class="group-badge">Herzstück</div>
                    </div>
                    <div class="group-body">
                        <h3>Die Garde</h3>
                        <p><?= h($c['groups']['garde_desc'] ?? '') ?></p>
                        <ul class="group-features">
                            <li>Professionelle Choreografien</li>
                            <li>Regelmäßige Trainingseinheiten</li>
                            <li>Auftritte bei allen Vereinsevents</li>
                        </ul>
                    </div>
                </div>

                <div class="group-card reveal-up" style="transition-delay:.1s">
                    <div class="group-visual gruppe-photo">
                        <img src="images/gruppe.jpg" alt="Der Elferrat"
                             onerror="this.style.display='none';this.parentElement.classList.add('elferrat-bg')">
                        <div class="group-visual-overlay">
                            <span class="group-emoji">🎩</span>
                        </div>
                        <div class="group-badge">Rat der Narren</div>
                    </div>
                    <div class="group-body">
                        <h3>Der Elferrat</h3>
                        <p><?= h($c['groups']['elferrat_desc'] ?? '') ?></p>
                        <ul class="group-features">
                            <li>11 aktive Räte</li>
                            <li>Moderation der Veranstaltungen</li>
                            <li>Garant für närrisches Treiben</li>
                        </ul>
                    </div>
                </div>

                <div class="group-card reveal-up" style="transition-delay:.2s">
                    <div class="group-visual prinzen-bg">
                        <div class="group-visual-overlay">
                            <span class="group-emoji">👑</span>
                        </div>
                        <div class="group-badge">Repräsentation</div>
                    </div>
                    <div class="group-body">
                        <h3>Das Prinzenpaar</h3>
                        <p><?= h($c['groups']['prinzen_desc'] ?? '') ?></p>
                        <ul class="group-features">
                            <li>Repräsentation des Vereins</li>
                            <li>Gäste bei regionalen Events</li>
                            <li>Träger der närrischen Krone</li>
                        </ul>
                    </div>
                </div>

                <div class="group-card reveal-up" style="transition-delay:.3s">
                    <div class="group-visual hexen-bg">
                        <div class="group-visual-overlay">
                            <span class="group-emoji">🧙‍♀️</span>
                        </div>
                        <div class="group-badge">Tradition</div>
                    </div>
                    <div class="group-body">
                        <h3>Die Hexen</h3>
                        <p><?= h($c['groups']['hexen_desc'] ?? '') ?></p>
                        <ul class="group-features">
                            <li>Traditionelle Maskenkultur</li>
                            <li>Aktiv beim Faschingsumzug</li>
                            <li>Brauchtumspflege</li>
                        </ul>
                    </div>
                </div>

            </div>
            <div class="groups-join">
                <p>Interesse, mitzumachen? Wir freuen uns über jedes neue Mitglied!</p>
                <a href="#kontakt" class="btn btn-primary">Jetzt mitmachen</a>
            </div>
        </div>
    </section>

    <!-- TERMINE -->
    <section id="termine" class="section">
        <div class="container">
            <header class="section-header">
                <span class="section-eyebrow">Saison <?= h($s['general']['season'] ?? '2026/2027') ?></span>
                <h2 class="section-title">Termine & Events</h2>
                <div class="title-ornament"><span>♛</span></div>
            </header>

            <div class="events-layout">
                <?php if ($featured_event): ?>
                <div class="event-featured reveal-left">
                    <div class="event-featured-date">
                        <span class="efd-day"><?= date('d', strtotime($featured_event['date'])) ?></span>
                        <span class="efd-month"><?= date('F', strtotime($featured_event['date'])) ?></span>
                        <span class="efd-year"><?= date('Y', strtotime($featured_event['date'])) ?></span>
                    </div>
                    <div class="event-featured-body">
                        <span class="event-tag">Saisoneröffnung</span>
                        <h3><?= h($featured_event['title']) ?></h3>
                        <p><?= h($featured_event['description'] ?? '') ?></p>
                        <div class="event-meta">
                            <?php if ($featured_event['location'] ?? ''): ?>
                            <span class="event-meta-item">📍 <?= h($featured_event['location']) ?></span>
                            <?php endif; ?>
                            <?php if ($featured_event['time'] ?? ''): ?>
                            <span class="event-meta-item">🕐 <?= h($featured_event['time']) ?></span>
                            <?php endif; ?>
                        </div>
                    </div>
                </div>
                <?php endif; ?>

                <div class="events-list">
                    <?php foreach ($other_events as $i => $e): ?>
                    <div class="event-row reveal-right" style="transition-delay:<?= $i * 0.1 ?>s">
                        <div class="event-row-date">
                            <span class="erd-month"><?= date('M', strtotime($e['date'])) ?></span>
                            <span class="erd-year">'<?= date('y', strtotime($e['date'])) ?></span>
                        </div>
                        <div class="event-row-content">
                            <h4><?= h($e['title']) ?></h4>
                            <p><?= h($e['description'] ?? '') ?></p>
                        </div>
                        <span class="event-type <?= h($e['type'] ?? 'sonstig') ?>">
                            <?= h($type_badges[$e['type'] ?? ''] ?? 'Event') ?>
                        </span>
                    </div>
                    <?php endforeach; ?>
                    <?php if (!$other_events && !$featured_event): ?>
                    <p style="color:#666;padding:20px">Keine Termine vorhanden.</p>
                    <?php endif; ?>
                </div>
            </div>

            <p class="events-notice">* Genaue Uhrzeiten und Details folgen. Alle aktuellen Infos auf unseren Social-Media-Kanälen.</p>
        </div>
    </section>

    <!-- GALERIE -->
    <section id="galerie" class="section section-dark">
        <div class="container">
            <header class="section-header">
                <span class="section-eyebrow">Eindrücke & Erinnerungen</span>
                <h2 class="section-title">Galerie</h2>
                <div class="title-ornament"><span>♛</span></div>
            </header>

            <?php if ($gallery_files): ?>
            <div class="gallery-grid">
                <?php foreach (array_slice($gallery_files, 0, 8) as $i => $img_path): ?>
                <?php
                    $filename = basename($img_path);
                    $is_wide  = $i === 0 || $i === 5;
                ?>
                <div class="gallery-item <?= $is_wide ? 'gallery-wide' : '' ?> reveal-up"
                     style="transition-delay:<?= $i * 0.05 ?>s">
                    <img src="images/gallery/<?= h($filename) ?>"
                         alt="NazuMido Foto"
                         loading="lazy"
                         class="gallery-real-img">
                    <div class="gallery-overlay">
                        <span class="gallery-zoom">🔍</span>
                    </div>
                </div>
                <?php endforeach; ?>
            </div>

            <?php else: ?>
            <!-- Fallback: placeholder cards wenn noch keine Fotos hochgeladen -->
            <div class="gallery-grid">
                <div class="gallery-item gallery-wide reveal-up">
                    <img src="images/band.jpg" alt="NazuMido Marschkapelle" class="gallery-real-img"
                         onerror="this.style.display='none';this.parentElement.style.background='linear-gradient(135deg,#1a0408,#4a0810)'">
                    <div class="gallery-overlay"><span class="gallery-label">Marschkapelle</span></div>
                </div>
                <div class="gallery-item reveal-up" style="transition-delay:.05s">
                    <img src="images/garde.jpg" alt="Die Garde" class="gallery-real-img"
                         onerror="this.style.display='none';this.parentElement.style.background='linear-gradient(135deg,#0d1a30,#1a4a80)'">
                    <div class="gallery-overlay"><span class="gallery-label">Die Garde</span></div>
                </div>
                <div class="gallery-item reveal-up" style="transition-delay:.1s">
                    <img src="images/gruppe.jpg" alt="NazuMido Gruppe" class="gallery-real-img"
                         onerror="this.style.display='none';this.parentElement.style.background='linear-gradient(135deg,#1a0a0a,#5a1212)'">
                    <div class="gallery-overlay"><span class="gallery-label">Der Verein</span></div>
                </div>
            </div>
            <?php endif; ?>

            <div class="gallery-upload-note">
                <span class="gallery-note-icon">📷</span>
                <p>Eigene Fotos einreichen? Schickt uns eure schönsten Faschingsmomente!</p>
                <a href="mailto:<?= h($s['contact']['email'] ?? 'info@nazu-mido.at') ?>?subject=Fotos NazuMido" class="btn btn-outline btn-sm">Fotos einsenden</a>
            </div>
        </div>

        <!-- Lightbox -->
        <div class="lightbox" id="lightbox">
            <button class="lightbox-close" id="lbClose">✕</button>
            <button class="lightbox-prev" id="lbPrev">‹</button>
            <img src="" alt="" id="lbImg">
            <button class="lightbox-next" id="lbNext">›</button>
        </div>
    </section>

    <!-- KONTAKT -->
    <section id="kontakt" class="section">
        <div class="container">
            <header class="section-header">
                <span class="section-eyebrow">Wir freuen uns auf euch</span>
                <h2 class="section-title">Kontakt</h2>
                <div class="title-ornament"><span>♛</span></div>
            </header>

            <div class="contact-layout">
                <div class="contact-info-col">
                    <div class="contact-card reveal-left">
                        <div class="contact-card-icon">📍</div>
                        <div>
                            <h4>Adresse</h4>
                            <p>
                                <?= h($s['contact']['address_name'] ?? 'NazuMido') ?><br>
                                <?php if ($s['contact']['address_street'] ?? ''): ?>
                                <?= h($s['contact']['address_street']) ?><br>
                                <?php endif; ?>
                                <?= h($s['contact']['address_city'] ?? '4560 Kirchdorf an der Krems') ?><br>
                                <?= h($s['contact']['address_country'] ?? 'Österreich') ?>
                            </p>
                        </div>
                    </div>
                    <?php if ($email = $s['contact']['email'] ?? ''): ?>
                    <div class="contact-card reveal-left" style="transition-delay:.1s">
                        <div class="contact-card-icon">📧</div>
                        <div>
                            <h4>E-Mail</h4>
                            <p><a href="mailto:<?= h($email) ?>"><?= h($email) ?></a></p>
                        </div>
                    </div>
                    <?php endif; ?>
                    <div class="contact-card reveal-left" style="transition-delay:.2s">
                        <div class="contact-card-icon">📱</div>
                        <div>
                            <h4>Social Media</h4>
                            <div class="social-row">
                                <?php if (($s['social']['facebook'] ?? '') && $s['social']['facebook'] !== '#'): ?>
                                <a href="<?= h($s['social']['facebook']) ?>" class="social-link facebook" target="_blank" rel="noopener">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                                    Facebook
                                </a>
                                <?php endif; ?>
                                <?php if (($s['social']['instagram'] ?? '') && $s['social']['instagram'] !== '#'): ?>
                                <a href="<?= h($s['social']['instagram']) ?>" class="social-link instagram" target="_blank" rel="noopener">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                                    Instagram
                                </a>
                                <?php endif; ?>
                                <?php if (($s['social']['facebook'] ?? '#') === '#' && ($s['social']['instagram'] ?? '#') === '#'): ?>
                                <p style="color:#666;font-size:.85rem">Social Media Links noch nicht eingetragen.<br>Im <a href="admin/">Admin-Bereich</a> einstellen.</p>
                                <?php endif; ?>
                            </div>
                        </div>
                    </div>
                    <div class="contact-card contact-card-highlight reveal-left" style="transition-delay:.3s">
                        <div class="contact-card-icon">🎭</div>
                        <div>
                            <h4>Mitglied werden?</h4>
                            <p>Du willst mitmachen – tanzen, feiern, Teil unserer närrischen Familie werden?</p>
                            <a href="mailto:<?= h($email ?? 'info@nazu-mido.at') ?>?subject=Mitgliedschaft bei NazuMido" class="btn btn-primary btn-sm">Jetzt anfragen</a>
                        </div>
                    </div>
                </div>

                <div class="contact-form-col">
                    <form class="contact-form reveal-right" id="contact-form" novalidate>
                        <h3>Nachricht schreiben</h3>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="fname">Vorname</label>
                                <input type="text" id="fname" name="fname" placeholder="Max">
                            </div>
                            <div class="form-group">
                                <label for="lname">Nachname</label>
                                <input type="text" id="lname" name="lname" placeholder="Mustermann">
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="email">E-Mail <span class="required">*</span></label>
                            <input type="email" id="email" name="email" placeholder="deine@email.at" required>
                        </div>
                        <div class="form-group">
                            <label for="subject">Betreff</label>
                            <select id="subject" name="subject">
                                <option value="">Bitte wählen...</option>
                                <option>Mitgliedschaft</option>
                                <option>Anfrage: Auftritt</option>
                                <option>Interesse: Garde</option>
                                <option>Allgemeine Information</option>
                                <option>Sonstiges</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="message">Nachricht <span class="required">*</span></label>
                            <textarea id="message" name="message" rows="5" placeholder="Deine Nachricht..." required></textarea>
                        </div>
                        <button type="submit" class="btn btn-primary btn-full" id="submit-btn">
                            <span class="btn-text">Nachricht senden</span>
                            <span class="btn-icon">✉️</span>
                        </button>
                        <p class="form-disclaimer">* Pflichtfeld. Bitte schreibe direkt an <a href="mailto:<?= h($email ?? 'info@nazu-mido.at') ?>"><?= h($email ?? 'info@nazu-mido.at') ?></a>.</p>
                    </form>
                </div>
            </div>
        </div>
    </section>

    <!-- FOOTER -->
    <footer id="footer">
        <div class="container">
            <div class="footer-top">
                <div class="footer-brand">
                    <div class="footer-logo">
                        <img src="images/logo.png" alt="NazuMido" class="footer-logo-img"
                             onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                        <span class="footer-logo-crown" style="display:none">♛</span>
                        <span class="footer-logo-name"><?= h($c['hero']['title'] ?? 'NazuMido') ?></span>
                    </div>
                    <p class="footer-tagline"><?= h($c['hero']['subtitle'] ?? 'Narrenzunft der schwarzen Grafen') ?></p>
                    <p class="footer-location"><?= h($s['contact']['address_city'] ?? 'Kirchdorf an der Krems') ?></p>
                    <div class="footer-social">
                        <?php if (($s['social']['facebook'] ?? '#') !== '#'): ?>
                        <a href="<?= h($s['social']['facebook']) ?>" class="footer-social-btn" target="_blank" rel="noopener" aria-label="Facebook">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                        </a>
                        <?php endif; ?>
                        <?php if (($s['social']['instagram'] ?? '#') !== '#'): ?>
                        <a href="<?= h($s['social']['instagram']) ?>" class="footer-social-btn" target="_blank" rel="noopener" aria-label="Instagram">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                        </a>
                        <?php endif; ?>
                    </div>
                </div>
                <div class="footer-nav">
                    <h4>Navigation</h4>
                    <ul>
                        <li><a href="#ueber-uns">Über uns</a></li>
                        <li><a href="#gruppen">Unsere Gruppen</a></li>
                        <li><a href="#termine">Termine & Events</a></li>
                        <li><a href="#galerie">Galerie</a></li>
                        <li><a href="#kontakt">Kontakt</a></li>
                    </ul>
                </div>
                <div class="footer-nav">
                    <h4>Gruppen</h4>
                    <ul>
                        <li><a href="#gruppen">Die Garde</a></li>
                        <li><a href="#gruppen">Der Elferrat</a></li>
                        <li><a href="#gruppen">Das Prinzenpaar</a></li>
                        <li><a href="#gruppen">Die Hexen</a></li>
                    </ul>
                </div>
                <div class="footer-contact-block">
                    <h4>Kontakt</h4>
                    <p><?= h($s['contact']['address_city'] ?? 'Kirchdorf an der Krems') ?></p>
                    <a href="mailto:<?= h($email ?? 'info@nazu-mido.at') ?>" class="footer-email"><?= h($email ?? 'info@nazu-mido.at') ?></a>
                    <div class="footer-season">
                        <span>Saison <?= h($s['general']['season'] ?? '2026/2027') ?></span>
                        <span class="season-tag">Ab 11.11.<?= date('Y') ?> · 11:11 Uhr</span>
                    </div>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; <?= date('Y') ?> NazuMido – Narrenzunft der schwarzen Grafen | <?= h($s['contact']['address_city'] ?? 'Kirchdorf an der Krems') ?></p>
                <div class="footer-legal-links">
                    <a href="impressum.html">Impressum</a>
                    <a href="datenschutz.html">Datenschutz</a>
                </div>
            </div>
        </div>
    </footer>

    <script src="js/main.js"></script>
</body>
</html>
