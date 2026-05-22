<?php
require_once __DIR__ . '/includes/auth.php';
require_login();

$page_title = 'Dashboard';

// Stats
$events  = json_read('events.json');
$gallery = glob(IMAGES_DIR . '*.{jpg,jpeg,png,gif,webp}', GLOB_BRACE) ?: [];
$content = json_read('content.json');

// Next event
$now = date('Y-m-d');
$next_event = null;
foreach ($events as $e) {
    if ($e['date'] >= $now) { $next_event = $e; break; }
}

include __DIR__ . '/includes/header.php';
?>

<div class="dashboard-grid">
  <!-- Stats -->
  <div class="stat-card">
    <div class="stat-icon">📅</div>
    <div class="stat-body">
      <div class="stat-number"><?= count($events) ?></div>
      <div class="stat-label">Termine</div>
    </div>
  </div>
  <div class="stat-card">
    <div class="stat-icon">🖼️</div>
    <div class="stat-body">
      <div class="stat-number"><?= count($gallery) ?></div>
      <div class="stat-label">Fotos</div>
    </div>
  </div>
  <div class="stat-card">
    <div class="stat-icon">🌐</div>
    <div class="stat-body">
      <div class="stat-number">1</div>
      <div class="stat-label">Website</div>
    </div>
  </div>
  <div class="stat-card">
    <div class="stat-icon">♛</div>
    <div class="stat-body">
      <div class="stat-number"><?= h($content['general']['members'] ?? '100+') ?></div>
      <div class="stat-label">Mitglieder</div>
    </div>
  </div>
</div>

<div class="dashboard-row">
  <!-- Next Event -->
  <div class="dash-card">
    <div class="dash-card-head">
      <h2>Nächster Termin</h2>
      <a href="events.php" class="btn-sm-link">Alle Termine →</a>
    </div>
    <?php if ($next_event): ?>
    <div class="next-event">
      <div class="next-event-date">
        <?= date('d', strtotime($next_event['date'])) ?><br>
        <small><?= date('M Y', strtotime($next_event['date'])) ?></small>
      </div>
      <div class="next-event-info">
        <strong><?= h($next_event['title']) ?></strong>
        <span><?= h($next_event['location'] ?? '') ?> · <?= h($next_event['time'] ?? '') ?></span>
      </div>
    </div>
    <?php else: ?>
    <p class="empty-hint">Keine bevorstehenden Termine.</p>
    <?php endif; ?>
  </div>

  <!-- Quick Actions -->
  <div class="dash-card">
    <div class="dash-card-head"><h2>Schnellzugriff</h2></div>
    <div class="quick-actions">
      <a href="events.php?action=add" class="quick-btn">
        <span>📅</span> Termin hinzufügen
      </a>
      <a href="gallery.php" class="quick-btn">
        <span>📷</span> Fotos hochladen
      </a>
      <a href="content.php" class="quick-btn">
        <span>✏️</span> Texte bearbeiten
      </a>
      <a href="settings.php" class="quick-btn">
        <span>⚙️</span> Einstellungen
      </a>
    </div>
  </div>

  <!-- Gallery preview -->
  <div class="dash-card dash-card-full">
    <div class="dash-card-head">
      <h2>Galerie (<?= count($gallery) ?> Fotos)</h2>
      <a href="gallery.php" class="btn-sm-link">Galerie verwalten →</a>
    </div>
    <?php if ($gallery): ?>
    <div class="dash-gallery">
      <?php foreach (array_slice($gallery, 0, 8) as $img): ?>
      <div class="dash-gallery-item">
        <img src="<?= IMAGES_URL . h(basename($img)) ?>" alt="" loading="lazy">
      </div>
      <?php endforeach; ?>
    </div>
    <?php else: ?>
    <p class="empty-hint">Noch keine Fotos hochgeladen. <a href="gallery.php">Jetzt hochladen →</a></p>
    <?php endif; ?>
  </div>
</div>

<?php include __DIR__ . '/includes/footer.php'; ?>
