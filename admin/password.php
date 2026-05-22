<?php
require_once __DIR__ . '/includes/auth.php';
require_login();

$page_title = 'Passwort ändern';
$csrf       = generate_csrf();

include __DIR__ . '/includes/header.php';
?>

<div class="form-card" style="max-width:480px">
  <h3 class="form-card-title">🔒 Passwort ändern</h3>
  <form method="POST" action="api/change_password.php">
    <input type="hidden" name="csrf" value="<?= h($csrf) ?>">
    <div class="form-group">
      <label>Aktuelles Passwort</label>
      <input type="password" name="current_password" required autocomplete="current-password">
    </div>
    <div class="form-group">
      <label>Neues Passwort</label>
      <input type="password" name="new_password" required minlength="8" autocomplete="new-password">
    </div>
    <div class="form-group">
      <label>Neues Passwort bestätigen</label>
      <input type="password" name="confirm_password" required minlength="8" autocomplete="new-password">
    </div>
    <div class="form-actions">
      <button type="submit" class="btn-save">🔒 Passwort ändern</button>
    </div>
  </form>
  <p class="form-note">Das neue Passwort muss mindestens 8 Zeichen haben.</p>
</div>

<?php include __DIR__ . '/includes/footer.php'; ?>
