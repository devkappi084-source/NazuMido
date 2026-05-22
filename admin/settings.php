<?php
require_once __DIR__ . '/includes/auth.php';
require_login();

$page_title = 'Einstellungen';
$settings   = json_read('settings.json');
$csrf       = generate_csrf();

include __DIR__ . '/includes/header.php';
?>

<form method="POST" action="api/save_settings.php">
  <input type="hidden" name="csrf" value="<?= h($csrf) ?>">

  <div class="form-card">
    <h3 class="form-card-title">📍 Kontakt & Adresse</h3>
    <div class="form-grid-2">
      <div class="form-group">
        <label>Vereinsname</label>
        <input type="text" name="address_name" value="<?= h($settings['contact']['address_name'] ?? '') ?>">
      </div>
      <div class="form-group">
        <label>Straße & Hausnummer</label>
        <input type="text" name="address_street" value="<?= h($settings['contact']['address_street'] ?? '') ?>">
      </div>
      <div class="form-group">
        <label>PLZ & Ort</label>
        <input type="text" name="address_city" value="<?= h($settings['contact']['address_city'] ?? '') ?>">
      </div>
      <div class="form-group">
        <label>Land</label>
        <input type="text" name="address_country" value="<?= h($settings['contact']['address_country'] ?? '') ?>">
      </div>
      <div class="form-group">
        <label>E-Mail</label>
        <input type="email" name="email" value="<?= h($settings['contact']['email'] ?? '') ?>">
      </div>
      <div class="form-group">
        <label>Website</label>
        <input type="text" name="website" value="<?= h($settings['contact']['website'] ?? '') ?>">
      </div>
    </div>
  </div>

  <div class="form-card">
    <h3 class="form-card-title">📱 Social Media</h3>
    <div class="form-grid-2">
      <div class="form-group">
        <label>Facebook URL</label>
        <input type="url" name="facebook" placeholder="https://www.facebook.com/..." value="<?= h($settings['social']['facebook'] ?? '') ?>">
      </div>
      <div class="form-group">
        <label>Instagram URL</label>
        <input type="url" name="instagram" placeholder="https://www.instagram.com/..." value="<?= h($settings['social']['instagram'] ?? '') ?>">
      </div>
    </div>
  </div>

  <div class="form-card">
    <h3 class="form-card-title">🔢 Allgemein</h3>
    <div class="form-grid-3">
      <div class="form-group">
        <label>Gründungsjahr</label>
        <input type="text" name="founded" value="<?= h($settings['general']['founded'] ?? '') ?>">
      </div>
      <div class="form-group">
        <label>Mitgliederanzahl</label>
        <input type="text" name="members" value="<?= h($settings['general']['members'] ?? '') ?>">
      </div>
      <div class="form-group">
        <label>Aktuelle Saison</label>
        <input type="text" name="season" value="<?= h($settings['general']['season'] ?? '') ?>">
      </div>
    </div>
  </div>

  <div class="form-actions">
    <button type="submit" class="btn-save">💾 Einstellungen speichern</button>
  </div>
</form>

<?php include __DIR__ . '/includes/footer.php'; ?>
