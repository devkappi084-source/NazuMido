<?php
require_once __DIR__ . '/../includes/auth.php';
require_login();

if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !verify_csrf($_POST['csrf'] ?? '')) {
    http_response_code(403); exit('Forbidden');
}

$uploaded = 0;
$errors   = [];

if (!is_dir(IMAGES_DIR)) mkdir(IMAGES_DIR, 0755, true);

foreach ($_FILES['photos']['tmp_name'] as $i => $tmp) {
    if ($_FILES['photos']['error'][$i] !== UPLOAD_ERR_OK) {
        $errors[] = $_FILES['photos']['name'][$i] . ': Upload-Fehler.';
        continue;
    }
    if ($_FILES['photos']['size'][$i] > MAX_UPLOAD_SIZE) {
        $errors[] = $_FILES['photos']['name'][$i] . ': Datei zu groß (max 8 MB).';
        continue;
    }

    // MIME type check
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime  = $finfo->file($tmp);
    if (!in_array($mime, ALLOWED_TYPES, true)) {
        $errors[] = $_FILES['photos']['name'][$i] . ': Ungültiger Dateityp.';
        continue;
    }

    // Safe extension
    $ext   = match($mime) {
        'image/jpeg' => 'jpg',
        'image/png'  => 'png',
        'image/gif'  => 'gif',
        'image/webp' => 'webp',
        default      => 'jpg',
    };

    // Unique filename
    $filename = uniqid('photo_', true) . '.' . $ext;
    $dest     = IMAGES_DIR . $filename;

    if (move_uploaded_file($tmp, $dest)) {
        $uploaded++;
    } else {
        $errors[] = $_FILES['photos']['name'][$i] . ': Konnte nicht gespeichert werden.';
    }
}

if ($uploaded > 0) {
    flash($uploaded . ' Foto(s) erfolgreich hochgeladen!' . ($errors ? ' (' . count($errors) . ' Fehler)' : ''));
} else {
    flash('Fehler beim Hochladen: ' . implode(', ', $errors), 'error');
}

header('Location: ' . admin_url('gallery.php'));
exit;
