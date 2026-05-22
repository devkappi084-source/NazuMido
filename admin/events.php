<?php
require_once __DIR__ . '/includes/auth.php';
require_login();

$page_title = 'Termine';
$events     = json_read('events.json');
$csrf       = generate_csrf();

// Sort by date
usort($events, fn($a, $b) => strcmp($a['date'], $b['date']));

// Edit mode?
$edit_event = null;
$edit_id    = (int)($_GET['edit'] ?? 0);
if ($edit_id) {
    foreach ($events as $e) {
        if ((int)$e['id'] === $edit_id) { $edit_event = $e; break; }
    }
}
$show_form = isset($_GET['action']) && $_GET['action'] === 'add' || $edit_event;

$type_labels = [
    'highlight' => 'Highlight',
    'ball'      => 'Ball',
    'familie'   => 'Familie',
    'abschluss' => 'Abschluss',
    'sonstig'   => 'Sonstiges',
];

include __DIR__ . '/includes/header.php';
?>

<?php if ($show_form): ?>
<!-- ADD / EDIT FORM -->
<div class="form-card">
  <h3 class="form-card-title"><?= $edit_event ? '✏️ Termin bearbeiten' : '➕ Neuer Termin' ?></h3>
  <form method="POST" action="api/save_events.php">
    <input type="hidden" name="csrf"   value="<?= h($csrf) ?>">
    <input type="hidden" name="action" value="<?= $edit_event ? 'edit' : 'add' ?>">
    <?php if ($edit_event): ?>
    <input type="hidden" name="id"     value="<?= (int)$edit_event['id'] ?>">
    <?php endif; ?>
    <div class="form-grid-2">
      <div class="form-group">
        <label>Datum</label>
        <input type="date" name="date" required value="<?= h($edit_event['date'] ?? date('Y-m-d')) ?>">
      </div>
      <div class="form-group">
        <label>Uhrzeit</label>
        <input type="text" name="time" placeholder="z.B. 20:00 Uhr" value="<?= h($edit_event['time'] ?? '') ?>">
      </div>
      <div class="form-group">
        <label>Titel</label>
        <input type="text" name="title" required value="<?= h($edit_event['title'] ?? '') ?>">
      </div>
      <div class="form-group">
        <label>Ort</label>
        <input type="text" name="location" value="<?= h($edit_event['location'] ?? '') ?>">
      </div>
      <div class="form-group">
        <label>Typ</label>
        <select name="type">
          <?php foreach ($type_labels as $val => $label): ?>
          <option value="<?= $val ?>" <?= ($edit_event['type'] ?? 'sonstig') === $val ? 'selected' : '' ?>>
            <?= $label ?>
          </option>
          <?php endforeach; ?>
        </select>
      </div>
      <div class="form-group" style="display:flex;align-items:center;gap:10px;padding-top:28px">
        <input type="checkbox" id="featured" name="featured" value="1" <?= !empty($edit_event['featured']) ? 'checked' : '' ?>>
        <label for="featured" style="margin:0">Als Featured-Event anzeigen</label>
      </div>
    </div>
    <div class="form-group">
      <label>Beschreibung</label>
      <textarea name="description" rows="4"><?= h($edit_event['description'] ?? '') ?></textarea>
    </div>
    <div class="form-actions">
      <a href="events.php" class="btn-cancel">Abbrechen</a>
      <button type="submit" class="btn-save">💾 Speichern</button>
    </div>
  </form>
</div>
<?php else: ?>

<div class="page-actions">
  <a href="events.php?action=add" class="btn-add">➕ Neuer Termin</a>
</div>

<div class="table-card">
  <table class="admin-table">
    <thead>
      <tr>
        <th>Datum</th>
        <th>Titel</th>
        <th>Ort</th>
        <th>Typ</th>
        <th>Aktionen</th>
      </tr>
    </thead>
    <tbody>
      <?php if ($events): ?>
      <?php foreach ($events as $e): ?>
      <tr class="<?= $e['date'] < date('Y-m-d') ? 'row-past' : '' ?>">
        <td class="td-date">
          <?= date('d.m.Y', strtotime($e['date'])) ?>
          <?php if ($e['date'] < date('Y-m-d')): ?><span class="badge-past">vergangen</span><?php endif; ?>
        </td>
        <td>
          <?= h($e['title']) ?>
          <?php if (!empty($e['featured'])): ?><span class="badge-featured">★ Featured</span><?php endif; ?>
        </td>
        <td><?= h($e['location'] ?? '–') ?></td>
        <td><span class="badge-type type-<?= h($e['type'] ?? '') ?>"><?= h($type_labels[$e['type'] ?? ''] ?? $e['type']) ?></span></td>
        <td class="td-actions">
          <a href="events.php?edit=<?= (int)$e['id'] ?>" class="action-edit">✏️</a>
          <form method="POST" action="api/save_events.php" style="display:inline" onsubmit="return confirm('Termin wirklich löschen?')">
            <input type="hidden" name="csrf"   value="<?= h($csrf) ?>">
            <input type="hidden" name="action" value="delete">
            <input type="hidden" name="id"     value="<?= (int)$e['id'] ?>">
            <button type="submit" class="action-del">🗑️</button>
          </form>
        </td>
      </tr>
      <?php endforeach; ?>
      <?php else: ?>
      <tr><td colspan="5" class="empty-hint">Keine Termine vorhanden.</td></tr>
      <?php endif; ?>
    </tbody>
  </table>
</div>
<?php endif; ?>

<?php include __DIR__ . '/includes/footer.php'; ?>
