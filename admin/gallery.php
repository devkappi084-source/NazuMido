<?php
require_once __DIR__ . '/includes/auth.php';
require_login();

$page_title = 'Galerie & Fotos';
$csrf       = generate_csrf();

// Gallery images
$gallery_dir = IMAGES_DIR;
$images = glob($gallery_dir . '*.{jpg,jpeg,png,gif,webp}', GLOB_BRACE) ?: [];
$images = array_map('basename', $images);

// Sort by modification time (newest first)
usort($images, fn($a, $b) =>
    filemtime($gallery_dir . $b) - filemtime($gallery_dir . $a)
);

include __DIR__ . '/includes/header.php';
?>

<!-- UPLOAD AREA -->
<div class="form-card upload-card">
  <h3 class="form-card-title">📷 Fotos hochladen</h3>
  <form method="POST" action="api/upload.php" enctype="multipart/form-data" id="uploadForm">
    <input type="hidden" name="csrf" value="<?= h($csrf) ?>">
    <div class="upload-drop" id="dropZone">
      <div class="upload-drop-inner">
        <span class="upload-icon">📁</span>
        <p>Fotos hier hinziehen oder klicken zum Auswählen</p>
        <span class="upload-hint">JPG, PNG, GIF, WEBP · max. 8 MB je Bild</span>
      </div>
      <input type="file" name="photos[]" id="fileInput" multiple accept="image/*" class="upload-input">
    </div>
    <div id="previewGrid" class="upload-preview" style="display:none"></div>
    <div class="form-actions">
      <button type="submit" class="btn-save" id="uploadBtn" disabled>📤 Hochladen</button>
    </div>
  </form>
</div>

<!-- GALLERY GRID -->
<div class="form-card">
  <div class="dash-card-head">
    <h3 class="form-card-title" style="margin:0">Vorhandene Fotos (<?= count($images) ?>)</h3>
  </div>

  <?php if ($images): ?>
  <div class="gallery-manage-grid">
    <?php foreach ($images as $img): ?>
    <div class="gallery-manage-item" id="img-<?= md5($img) ?>">
      <img src="<?= IMAGES_URL . h($img) ?>" alt="<?= h($img) ?>" loading="lazy">
      <div class="gallery-manage-overlay">
        <span class="gallery-img-name"><?= h($img) ?></span>
        <form method="POST" action="api/delete_image.php" onsubmit="return confirm('Foto löschen?')">
          <input type="hidden" name="csrf" value="<?= h($csrf) ?>">
          <input type="hidden" name="filename" value="<?= h($img) ?>">
          <button type="submit" class="gallery-del-btn">🗑️ Löschen</button>
        </form>
      </div>
    </div>
    <?php endforeach; ?>
  </div>
  <?php else: ?>
  <p class="empty-hint">Noch keine Fotos vorhanden. Lade dein erstes Foto hoch!</p>
  <?php endif; ?>
</div>

<!-- LOGO SECTION -->
<div class="form-card">
  <h3 class="form-card-title">🏷️ Vereinslogo</h3>
  <div class="logo-preview-wrap">
    <img src="../images/logo.png" alt="Logo" class="logo-preview"
         onerror="this.style.opacity='0.2'">
    <div>
      <p style="color:var(--text-muted);font-size:.88rem;margin-bottom:12px">
        Das Logo wird im Header und auf der Startseite angezeigt.<br>
        Dateiname muss <code>logo.png</code> sein.
      </p>
      <form method="POST" action="api/upload_logo.php" enctype="multipart/form-data">
        <input type="hidden" name="csrf" value="<?= h($csrf) ?>">
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <input type="file" name="logo" accept="image/png,image/jpeg,image/webp" required>
          <button type="submit" class="btn-save">Logo ersetzen</button>
        </div>
      </form>
    </div>
  </div>
</div>

<script>
const dropZone  = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const preview   = document.getElementById('previewGrid');
const uploadBtn = document.getElementById('uploadBtn');

dropZone.addEventListener('click', () => fileInput.click());

['dragenter','dragover'].forEach(ev => {
  dropZone.addEventListener(ev, e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
});
['dragleave','drop'].forEach(ev => {
  dropZone.addEventListener(ev, e => { e.preventDefault(); dropZone.classList.remove('drag-over'); });
});
dropZone.addEventListener('drop', e => {
  fileInput.files = e.dataTransfer.files;
  handleFiles(e.dataTransfer.files);
});
fileInput.addEventListener('change', () => handleFiles(fileInput.files));

function handleFiles(files) {
  preview.innerHTML = '';
  if (!files.length) { preview.style.display = 'none'; uploadBtn.disabled = true; return; }
  preview.style.display = 'grid';
  uploadBtn.disabled = false;
  [...files].forEach(f => {
    const div = document.createElement('div');
    div.className = 'upload-thumb';
    const img = document.createElement('img');
    img.src = URL.createObjectURL(f);
    const name = document.createElement('span');
    name.textContent = f.name;
    div.append(img, name);
    preview.appendChild(div);
  });
}
</script>

<?php include __DIR__ . '/includes/footer.php'; ?>
