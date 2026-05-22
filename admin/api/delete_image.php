<?php
require_once __DIR__ . '/../includes/auth.php';
require_login();

if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !verify_csrf($_POST['csrf'] ?? '')) {
    http_response_code(403); exit;
}

$filename = basename($_POST['filename'] ?? '');
$ext      = strtolower(pathinfo($filename, PATHINFO_EXTENSION));

if (!$filename || !in_array($ext, ALLOWED_EXT, true)) {
    flash('Ungültige Datei.', 'error');
    header('Location: ' . admin_url('gallery.php')); exit;
}

$path = IMAGES_DIR . $filename;
if (file_exists($path) && unlink($path)) {
    flash('Foto gelöscht.');
} else {
    flash('Foto konnte nicht gelöscht werden.', 'error');
}

header('Location: ' . admin_url('gallery.php'));
exit;
