<?php
require_once __DIR__ . '/../includes/auth.php';
require_login();

if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !verify_csrf($_POST['csrf'] ?? '')) {
    http_response_code(403); exit;
}

$tmp  = $_FILES['logo']['tmp_name'] ?? '';
$size = $_FILES['logo']['size']     ?? 0;

if (!$tmp || $_FILES['logo']['error'] !== UPLOAD_ERR_OK) {
    flash('Upload-Fehler.', 'error');
    header('Location: ' . admin_url('gallery.php')); exit;
}
if ($size > MAX_UPLOAD_SIZE) {
    flash('Datei zu groß.', 'error');
    header('Location: ' . admin_url('gallery.php')); exit;
}

$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime  = $finfo->file($tmp);
if (!in_array($mime, ALLOWED_TYPES, true)) {
    flash('Ungültiger Dateityp.', 'error');
    header('Location: ' . admin_url('gallery.php')); exit;
}

$dest = SITE_ROOT . 'images/logo.png';
if (move_uploaded_file($tmp, $dest)) {
    flash('Logo erfolgreich aktualisiert!');
} else {
    flash('Fehler beim Speichern des Logos.', 'error');
}

header('Location: ' . admin_url('gallery.php'));
exit;
