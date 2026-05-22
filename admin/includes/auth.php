<?php
require_once __DIR__ . '/../config.php';

ini_set('session.cookie_httponly', 1);
ini_set('session.use_strict_mode', 1);
session_name(SESSION_NAME);
session_start();

function is_logged_in(): bool {
    return isset($_SESSION['admin_logged_in'])
        && $_SESSION['admin_logged_in'] === true
        && isset($_SESSION['admin_user']);
}

function require_login(): void {
    if (!is_logged_in()) {
        header('Location: ' . admin_url('login.php'));
        exit;
    }
    // Regenerate session periodically
    if (!isset($_SESSION['last_regen']) || time() - $_SESSION['last_regen'] > 300) {
        session_regenerate_id(true);
        $_SESSION['last_regen'] = time();
    }
}

function generate_csrf(): string {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function verify_csrf(string $token): bool {
    return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
}

function admin_url(string $page = ''): string {
    $base = dirname($_SERVER['SCRIPT_NAME']);
    $base = rtrim($base, '/');
    // If we're calling from a subdirectory (api/), go up one level
    if (str_contains($base, '/api')) {
        $base = dirname($base);
    }
    return $base . '/' . ltrim($page, '/');
}

function json_read(string $file): array {
    $path = DATA_DIR . $file;
    if (!file_exists($path)) return [];
    $data = json_decode(file_get_contents($path), true);
    return is_array($data) ? $data : [];
}

function json_write(string $file, mixed $data): bool {
    $path = DATA_DIR . $file;
    $dir = dirname($path);
    if (!is_dir($dir)) mkdir($dir, 0755, true);
    return file_put_contents($path, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) !== false;
}

function h(string $str): string {
    return htmlspecialchars($str, ENT_QUOTES, 'UTF-8');
}

function flash(string $msg, string $type = 'success'): void {
    $_SESSION['flash'] = ['msg' => $msg, 'type' => $type];
}

function get_flash(): ?array {
    $f = $_SESSION['flash'] ?? null;
    unset($_SESSION['flash']);
    return $f;
}
