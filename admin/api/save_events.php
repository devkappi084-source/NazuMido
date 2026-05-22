<?php
require_once __DIR__ . '/../includes/auth.php';
require_login();

if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !verify_csrf($_POST['csrf'] ?? '')) {
    http_response_code(403); exit('Forbidden');
}

$events = json_read('events.json');
$action = $_POST['action'] ?? '';

if ($action === 'add') {
    $max_id = array_reduce($events, fn($carry, $e) => max($carry, (int)$e['id']), 0);
    $events[] = [
        'id'          => $max_id + 1,
        'date'        => $_POST['date'] ?? '',
        'time'        => trim($_POST['time'] ?? ''),
        'title'       => trim($_POST['title'] ?? ''),
        'description' => trim($_POST['description'] ?? ''),
        'type'        => trim($_POST['type'] ?? 'sonstig'),
        'location'    => trim($_POST['location'] ?? ''),
        'featured'    => isset($_POST['featured']),
    ];
    flash('Termin hinzugefügt!');

} elseif ($action === 'edit') {
    $id = (int)($_POST['id'] ?? 0);
    foreach ($events as &$e) {
        if ((int)$e['id'] === $id) {
            $e['date']        = $_POST['date'] ?? $e['date'];
            $e['time']        = trim($_POST['time'] ?? '');
            $e['title']       = trim($_POST['title'] ?? '');
            $e['description'] = trim($_POST['description'] ?? '');
            $e['type']        = trim($_POST['type'] ?? 'sonstig');
            $e['location']    = trim($_POST['location'] ?? '');
            $e['featured']    = isset($_POST['featured']);
            break;
        }
    }
    unset($e);
    flash('Termin aktualisiert!');

} elseif ($action === 'delete') {
    $id     = (int)($_POST['id'] ?? 0);
    $events = array_values(array_filter($events, fn($e) => (int)$e['id'] !== $id));
    flash('Termin gelöscht.', 'info');
}

json_write('events.json', $events);
header('Location: ' . admin_url('events.php'));
exit;
