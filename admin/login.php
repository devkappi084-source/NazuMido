<?php
require_once __DIR__ . '/includes/auth.php';

if (is_logged_in()) {
    header('Location: index.php');
    exit;
}

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $user = trim($_POST['username'] ?? '');
    $pass = $_POST['password'] ?? '';

    if ($user === ADMIN_USERNAME && password_verify($pass, ADMIN_PASSWORD_HASH)) {
        session_regenerate_id(true);
        $_SESSION['admin_logged_in'] = true;
        $_SESSION['admin_user']      = $user;
        $_SESSION['last_regen']      = time();
        header('Location: index.php');
        exit;
    }
    $error = 'Benutzername oder Passwort falsch.';
    sleep(1); // brute-force delay
}
?>
<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Login – NazuMido Admin</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Cinzel:wght@600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="css/admin.css">
</head>
<body class="login-body">
<div class="login-wrap">
  <div class="login-card">
    <div class="login-logo">
      <img src="../images/logo.png" alt="NazuMido Logo" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
      <span class="login-crown-fallback" style="display:none">♛</span>
    </div>
    <h1 class="login-title">NazuMido</h1>
    <p class="login-sub">Admin-Bereich</p>

    <?php if ($error): ?>
    <div class="login-error">✕ <?= h($error) ?></div>
    <?php endif; ?>

    <form method="POST" class="login-form" autocomplete="off">
      <div class="form-group">
        <label for="username">Benutzername</label>
        <input type="text" id="username" name="username" required autofocus
               value="<?= h($_POST['username'] ?? '') ?>" placeholder="admin">
      </div>
      <div class="form-group">
        <label for="password">Passwort</label>
        <div class="pw-wrap">
          <input type="password" id="password" name="password" required placeholder="••••••••••">
          <button type="button" class="pw-toggle" onclick="togglePw()">👁</button>
        </div>
      </div>
      <button type="submit" class="btn-login">Anmelden</button>
    </form>
    <p class="login-hint">Standard-Passwort: <code>nazumido2026</code><br>Bitte nach dem ersten Login ändern!</p>
  </div>
</div>
<script>
function togglePw() {
  const f = document.getElementById('password');
  f.type = f.type === 'password' ? 'text' : 'password';
}
</script>
</body>
</html>
