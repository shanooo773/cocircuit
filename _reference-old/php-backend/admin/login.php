<?php
require_once __DIR__ . '/../db.php';

session_name(ADMIN_SESSION_NAME);
session_start();

if (!empty($_SESSION['admin_id'])) {
    header('Location: index.php');
    exit;
}

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim((string) ($_POST['username'] ?? ''));
    $password = (string) ($_POST['password'] ?? '');

    if ($username === '' || $password === '') {
        $error = 'Please enter your username and password.';
    } else {
        $pdo = get_db();
        $stmt = $pdo->prepare('SELECT id, password_hash FROM admins WHERE username = :username LIMIT 1');
        $stmt->execute([':username' => $username]);
        $admin = $stmt->fetch();

        if ($admin && password_verify($password, $admin['password_hash'])) {
            session_regenerate_id(true);
            $_SESSION['admin_id'] = $admin['id'];
            $_SESSION['admin_username'] = $username;
            header('Location: index.php');
            exit;
        }

        $error = 'Invalid username or password.';
    }
}
?>
<!doctype html>
<html lang="en-GB">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Admin Login | CoCircuit Power Consultants</title>
<meta name="robots" content="noindex, nofollow">
<link rel="icon" type="image/svg+xml" href="../assets/favicon.svg">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../css/styles.css?v=2">
</head>
<body style="background:var(--color-bg-section);">
  <div class="admin-login-wrap">
    <form method="post" class="form-card admin-login-card" novalidate>
      <div class="text-center" style="margin-bottom:var(--space-6);">
        <img src="../assets/cocircuit-rbg.png" alt="CoCircuit Power Consultants" width="74" height="42" style="margin-inline:auto;">
        <h1 style="font-size:var(--fs-xl); margin-top:var(--space-4); margin-bottom:0;">Admin Login</h1>
      </div>

      <?php if ($error !== ''): ?>
        <div class="form-status error" style="display:block;"><?= htmlspecialchars($error) ?></div>
      <?php endif; ?>

      <div class="form-group">
        <label for="username">Username</label>
        <input type="text" id="username" name="username" required autofocus>
      </div>
      <div class="form-group" style="margin-top:var(--space-4);">
        <label for="password">Password</label>
        <input type="password" id="password" name="password" required>
      </div>

      <button type="submit" class="btn btn-primary btn-block btn-lg" style="margin-top:var(--space-6);">Log In</button>
    </form>
  </div>
</body>
</html>
