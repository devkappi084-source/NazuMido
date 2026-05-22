<?php
require_once __DIR__ . '/../includes/auth.php';
require_login();

if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !verify_csrf($_POST['csrf'] ?? '')) {
    http_response_code(403); exit('Forbidden');
}

$content = json_read('content.json');

$content['hero']['pretext']  = trim($_POST['hero_pretext']  ?? '');
$content['hero']['title']    = trim($_POST['hero_title']    ?? '');
$content['hero']['subtitle'] = trim($_POST['hero_subtitle'] ?? '');
$content['hero']['location'] = trim($_POST['hero_location'] ?? '');
$content['hero']['motto']    = trim($_POST['hero_motto']    ?? '');

$content['about']['eyebrow']      = trim($_POST['about_eyebrow']   ?? '');
$content['about']['lead']         = trim($_POST['about_lead']       ?? '');
$content['about']['text1']        = trim($_POST['about_text1']      ?? '');
$content['about']['text2']        = trim($_POST['about_text2']      ?? '');
$content['about']['stat_years']   = trim($_POST['about_stat_years']   ?? '');
$content['about']['stat_members'] = trim($_POST['about_stat_members'] ?? '');
$content['about']['card1_title']  = trim($_POST['card1_title']  ?? '');
$content['about']['card2_title']  = trim($_POST['card2_title']  ?? '');
$content['about']['card3_title']  = trim($_POST['card3_title']  ?? '');
$content['about']['card1_text']   = trim($_POST['card1_text']   ?? '');
$content['about']['card2_text']   = trim($_POST['card2_text']   ?? '');
$content['about']['card3_text']   = trim($_POST['card3_text']   ?? '');

$content['groups']['garde_desc']   = trim($_POST['garde_desc']   ?? '');
$content['groups']['elferrat_desc']= trim($_POST['elferrat_desc'] ?? '');
$content['groups']['prinzen_desc'] = trim($_POST['prinzen_desc'] ?? '');
$content['groups']['hexen_desc']   = trim($_POST['hexen_desc']   ?? '');

if (json_write('content.json', $content)) {
    flash('Inhalte erfolgreich gespeichert!');
} else {
    flash('Fehler beim Speichern. Prüfe die Schreibrechte auf data/.', 'error');
}

header('Location: ' . admin_url('content.php'));
exit;
