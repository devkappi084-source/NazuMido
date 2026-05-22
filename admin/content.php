<?php
require_once __DIR__ . '/includes/auth.php';
require_login();

$page_title = 'Texte bearbeiten';
$content    = json_read('content.json');
$csrf       = generate_csrf();

include __DIR__ . '/includes/header.php';
?>

<form method="POST" action="api/save_content.php" id="contentForm">
  <input type="hidden" name="csrf" value="<?= h($csrf) ?>">

  <!-- TABS -->
  <div class="tabs">
    <button type="button" class="tab active" data-tab="hero">Hero</button>
    <button type="button" class="tab" data-tab="about">Über uns</button>
    <button type="button" class="tab" data-tab="groups">Gruppen</button>
  </div>

  <!-- TAB: HERO -->
  <div class="tab-panel active" id="tab-hero">
    <div class="form-card">
      <h3 class="form-card-title">Hero-Bereich (Startseite)</h3>
      <div class="form-grid-2">
        <div class="form-group">
          <label>Vortext ("Willkommen bei der")</label>
          <input type="text" name="hero_pretext" value="<?= h($content['hero']['pretext'] ?? '') ?>">
        </div>
        <div class="form-group">
          <label>Titel (groß)</label>
          <input type="text" name="hero_title" value="<?= h($content['hero']['title'] ?? '') ?>">
        </div>
        <div class="form-group">
          <label>Untertitel</label>
          <input type="text" name="hero_subtitle" value="<?= h($content['hero']['subtitle'] ?? '') ?>">
        </div>
        <div class="form-group">
          <label>Ort / Herkunft</label>
          <input type="text" name="hero_location" value="<?= h($content['hero']['location'] ?? '') ?>">
        </div>
      </div>
      <div class="form-group">
        <label>Motto (kursiv, mittig)</label>
        <input type="text" name="hero_motto" value="<?= h($content['hero']['motto'] ?? '') ?>">
      </div>
    </div>
  </div>

  <!-- TAB: ÜBER UNS -->
  <div class="tab-panel" id="tab-about">
    <div class="form-card">
      <h3 class="form-card-title">Über uns – Texte</h3>
      <div class="form-grid-2">
        <div class="form-group">
          <label>Augen-Text (klein, über Titel)</label>
          <input type="text" name="about_eyebrow" value="<?= h($content['about']['eyebrow'] ?? '') ?>">
        </div>
      </div>
      <div class="form-group">
        <label>Lead-Absatz (fett, erster Satz) – HTML erlaubt</label>
        <textarea name="about_lead" rows="4"><?= h($content['about']['lead'] ?? '') ?></textarea>
      </div>
      <div class="form-group">
        <label>Zweiter Absatz</label>
        <textarea name="about_text1" rows="4"><?= h($content['about']['text1'] ?? '') ?></textarea>
      </div>
      <div class="form-group">
        <label>Dritter Absatz – HTML erlaubt</label>
        <textarea name="about_text2" rows="4"><?= h($content['about']['text2'] ?? '') ?></textarea>
      </div>
      <div class="form-grid-2">
        <div class="form-group">
          <label>Statistik: Jahre</label>
          <input type="text" name="about_stat_years" value="<?= h($content['about']['stat_years'] ?? '') ?>">
        </div>
        <div class="form-group">
          <label>Statistik: Mitglieder</label>
          <input type="text" name="about_stat_members" value="<?= h($content['about']['stat_members'] ?? '') ?>">
        </div>
      </div>
    </div>
    <div class="form-card">
      <h3 class="form-card-title">Über uns – Karten</h3>
      <div class="form-grid-3">
        <div class="form-group"><label>Karte 1 Titel</label><input type="text" name="card1_title" value="<?= h($content['about']['card1_title'] ?? '') ?>"></div>
        <div class="form-group"><label>Karte 2 Titel</label><input type="text" name="card2_title" value="<?= h($content['about']['card2_title'] ?? '') ?>"></div>
        <div class="form-group"><label>Karte 3 Titel</label><input type="text" name="card3_title" value="<?= h($content['about']['card3_title'] ?? '') ?>"></div>
        <div class="form-group"><label>Karte 1 Text</label><textarea name="card1_text" rows="3"><?= h($content['about']['card1_text'] ?? '') ?></textarea></div>
        <div class="form-group"><label>Karte 2 Text</label><textarea name="card2_text" rows="3"><?= h($content['about']['card2_text'] ?? '') ?></textarea></div>
        <div class="form-group"><label>Karte 3 Text</label><textarea name="card3_text" rows="3"><?= h($content['about']['card3_text'] ?? '') ?></textarea></div>
      </div>
    </div>
  </div>

  <!-- TAB: GRUPPEN -->
  <div class="tab-panel" id="tab-groups">
    <div class="form-card">
      <h3 class="form-card-title">Gruppen-Beschreibungen</h3>
      <div class="form-group">
        <label>💃 Die Garde – Beschreibung</label>
        <textarea name="garde_desc" rows="4"><?= h($content['groups']['garde_desc'] ?? '') ?></textarea>
      </div>
      <div class="form-group">
        <label>🎩 Der Elferrat – Beschreibung</label>
        <textarea name="elferrat_desc" rows="4"><?= h($content['groups']['elferrat_desc'] ?? '') ?></textarea>
      </div>
      <div class="form-group">
        <label>👑 Das Prinzenpaar – Beschreibung</label>
        <textarea name="prinzen_desc" rows="4"><?= h($content['groups']['prinzen_desc'] ?? '') ?></textarea>
      </div>
      <div class="form-group">
        <label>🧙‍♀️ Die Hexen – Beschreibung</label>
        <textarea name="hexen_desc" rows="4"><?= h($content['groups']['hexen_desc'] ?? '') ?></textarea>
      </div>
    </div>
  </div>

  <div class="form-actions">
    <button type="submit" class="btn-save">💾 Änderungen speichern</button>
  </div>
</form>

<script>
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab, .tab-panel').forEach(el => el.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
  });
});
</script>

<?php include __DIR__ . '/includes/footer.php'; ?>
