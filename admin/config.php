<?php
// ============================================================
// NazuMido Admin – Konfiguration
// Standard-Passwort: nazumido2026
// Bitte nach erstem Login ändern!
// ============================================================

define('ADMIN_USERNAME', 'admin');
define('ADMIN_PASSWORD_HASH', '$2y$12$xzNtP.hpPOYZPgCzSkIux.pn0vsiwZ3P2Q31ny19ySY1.9UxHbIx6');

define('DATA_DIR',    __DIR__ . '/../data/');
define('IMAGES_DIR',  __DIR__ . '/../images/gallery/');
define('IMAGES_URL',  '../images/gallery/');
define('SITE_ROOT',   __DIR__ . '/../');

define('MAX_UPLOAD_SIZE', 8 * 1024 * 1024); // 8 MB
define('ALLOWED_TYPES',   ['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
define('ALLOWED_EXT',     ['jpg', 'jpeg', 'png', 'gif', 'webp']);

define('SESSION_NAME', 'nazumido_admin');
define('SESSION_LIFETIME', 3600 * 4); // 4 Stunden
