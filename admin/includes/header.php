<?php
$flash = get_flash();
$current_page = basename($_SERVER['PHP_SELF'], '.php');
function nav_class(string $page): string {
    global $current_page;
    return $current_page === $page ? 'active' : '';
}
?>
<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title><?= $page_title ?? 'Admin' ?> – NazuMido Admin</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Cinzel:wght@600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="<?= str_contains($_SERVER['PHP_SELF'], '/api/') ? '../' : '' ?>css/admin.css">
</head>
<body>
<div class="admin-wrap">

  <!-- Sidebar -->
  <aside class="sidebar" id="sidebar">
    <div class="sidebar-head">
      <div class="sidebar-logo">
        <span class="sidebar-crown">♛</span>
        <div>
          <span class="sidebar-name">NazuMido</span>
          <span class="sidebar-sub">Admin-Bereich</span>
        </div>
      </div>
      <button class="sidebar-close" id="sidebarClose" aria-label="Menü schließen">✕</button>
    </div>
    <nav class="sidebar-nav">
      <div class="nav-group">
        <span class="nav-group-label">Übersicht</span>
        <a href="../index.php" class="nav-item <?= nav_class('index') ?>">
          <span class="nav-icon">🏠</span> Dashboard
        </a>
      </div>
      <div class="nav-group">
        <span class="nav-group-label">Inhalte</span>
        <a href="../content.php" class="nav-item <?= nav_class('content') ?>">
          <span class="nav-icon">✏️</span> Texte bearbeiten
        </a>
        <a href="../events.php" class="nav-item <?= nav_class('events') ?>">
          <span class="nav-icon">📅</span> Termine
        </a>
        <a href="../gallery.php" class="nav-item <?= nav_class('gallery') ?>">
          <span class="nav-icon">🖼️</span> Galerie / Fotos
        </a>
      </div>
      <div class="nav-group">
        <span class="nav-group-label">Einstellungen</span>
        <a href="../settings.php" class="nav-item <?= nav_class('settings') ?>">
          <span class="nav-icon">⚙️</span> Einstellungen
        </a>
        <a href="../password.php" class="nav-item <?= nav_class('password') ?>">
          <span class="nav-icon">🔒</span> Passwort ändern
        </a>
      </div>
      <div class="nav-group">
        <a href="../../index.php" class="nav-item" target="_blank">
          <span class="nav-icon">🌐</span> Website ansehen
        </a>
        <a href="../logout.php" class="nav-item nav-logout">
          <span class="nav-icon">🚪</span> Abmelden
        </a>
      </div>
    </nav>
  </aside>

  <!-- Main -->
  <div class="admin-main">
    <header class="admin-header">
      <button class="burger-btn" id="burgerBtn" aria-label="Menü">
        <span></span><span></span><span></span>
      </button>
      <div class="header-title"><?= $page_title ?? '' ?></div>
      <div class="header-user">
        <span class="header-avatar">A</span>
        <span>Admin</span>
      </div>
    </header>

    <?php if ($flash): ?>
    <div class="flash flash-<?= h($flash['type']) ?>">
      <?= $flash['type'] === 'success' ? '✓' : '✕' ?>
      <?= h($flash['msg']) ?>
    </div>
    <?php endif; ?>

    <main class="admin-content">
