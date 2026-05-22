<?php
require_once __DIR__ . '/../includes/auth.php';
require_login();

if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !verify_csrf($_POST['csrf'] ?? '')) {
    http_response_code(403); exit('Forbidden');
}

$settings = json_read('settings.json');

$settings['contact']['address_name']   = trim($_POST['address_name']   ?? '');
$settings['contact']['address_street'] = trim($_POST['address_street'] ?? '');
$settings['contact']['address_city']   = trim($_POST['address_city']   ?? '');
$settings['contact']['address_country']= trim($_POST['address_country'] ?? '');
$settings['contact']['email']          = trim($_POST['email']   ?? '');
$settings['contact']['website']        = trim($_POST['website'] ?? '');

$settings['social']['facebook']  = trim($_POST['facebook']  ?? '');
$settings['social']['instagram'] = trim($_POST['instagram'] ?? '');

$settings['general']['founded'] = trim($_POST['founded'] ?? '');
$settings['general']['members'] = trim($_POST['members'] ?? '');
$settings['general']['season']  = trim($_POST['season']  ?? '');

json_write('settings.json', $settings);
flash('Einstellungen gespeichert!');
header('Location: ' . admin_url('settings.php'));
exit;
