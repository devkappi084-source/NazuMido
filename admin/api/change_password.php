<?php
require_once __DIR__ . '/../includes/auth.php';
require_login();

if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !verify_csrf($_POST['csrf'] ?? '')) {
    http_response_code(403); exit;
}

$current = $_POST['current_password'] ?? '';
$new     = $_POST['new_password']     ?? '';
$confirm = $_POST['confirm_password'] ?? '';

if (!password_verify($current, ADMIN_PASSWORD_HASH)) {
    flash('Aktuelles Passwort ist falsch.', 'error');
    header('Location: ' . admin_url('password.php')); exit;
}
if ($new !== $confirm) {
    flash('Passwörter stimmen nicht überein.', 'error');
    header('Location: ' . admin_url('password.php')); exit;
}
if (strlen($new) < 8) {
    flash('Passwort muss mindestens 8 Zeichen haben.', 'error');
    header('Location: ' . admin_url('password.php')); exit;
}

$hash        = password_hash($new, PASSWORD_DEFAULT);
$config_path = __DIR__ . '/../config.php';
$config      = file_get_contents($config_path);

// Replace the hash in config.php
$config = preg_replace(
    "/define\('ADMIN_PASSWORD_HASH',\s*'[^']*'\);/",
    "define('ADMIN_PASSWORD_HASH', '" . $hash . "');",
    $config
);

if (file_put_contents($config_path, $config) !== false) {
    flash('Passwort erfolgreich geändert!');
} else {
    flash('Fehler beim Speichern. Prüfe die Schreibrechte auf admin/config.php.', 'error');
}

header('Location: ' . admin_url('password.php'));
exit;
