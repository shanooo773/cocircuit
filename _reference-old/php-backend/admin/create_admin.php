<?php
/**
 * One-time bootstrap: creates the first admin account.
 * Only works while the `admins` table is empty — refuses once one exists.
 *
 * DELETE THIS FILE after you've created your admin account.
 */

require_once __DIR__ . '/../db.php';

$pdo = get_db();
$adminCount = (int) $pdo->query('SELECT COUNT(*) FROM admins')->fetchColumn();

$error = '';
$success = false;

if ($adminCount > 0) {
    $error = 'An admin account already exists. Delete this file — it will not create another one.';
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim((string) ($_POST['username'] ?? ''));
    $password = (string) ($_POST['password'] ?? '');

    if (strlen($username) < 3) {
        $error = 'Username must be at least 3 characters.';
    } elseif (strlen($password) < 10) {
        $error = 'Password must be at least 10 characters.';
    } else {
        // Re-check right before inserting to avoid a race with a second submit.
        $adminCount = (int) $pdo->query('SELECT COUNT(*) FROM admins')->fetchColumn();
        if ($adminCount > 0) {
            $error = 'An admin account already exists.';
        } else {
            $stmt = $pdo->prepare('INSERT INTO admins (username, password_hash) VALUES (:username, :hash)');
            $stmt->execute([
                ':username' => $username,
                ':hash' => password_hash($password, PASSWORD_DEFAULT),
            ]);
            $success = true;
        }
    }
}
?>
<!doctype html>
<html lang="en-GB">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Create Admin Account</title>
<meta name="robots" content="noindex, nofollow">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../css/styles.css?v=2">
</head>
<body>
  <div class="admin-login-wrap">
    <div class="form-card admin-login-card">
      <h1 style="font-size:var(--fs-xl);">Create Admin Account</h1>

      <?php if ($success): ?>
        <div class="form-status success" style="display:block;">Admin account created. <a href="login.php">Log in</a> now, then delete this file (admin/create_admin.php).</div>
      <?php else: ?>
        <?php if ($error !== ''): ?>
          <div class="form-status error" style="display:block;"><?= htmlspecialchars($error) ?></div>
        <?php endif; ?>

        <?php if ($adminCount === 0): ?>
          <form method="post" novalidate>
            <div class="form-group">
              <label for="username">Username</label>
              <input type="text" id="username" name="username" minlength="3" required autofocus>
            </div>
            <div class="form-group" style="margin-top:var(--space-4);">
              <label for="password">Password</label>
              <input type="password" id="password" name="password" minlength="10" required>
              <p class="form-note" style="margin-top:var(--space-2);">At least 10 characters.</p>
            </div>
            <button type="submit" class="btn btn-primary btn-block btn-lg" style="margin-top:var(--space-6);">Create Account</button>
          </form>
        <?php endif; ?>
      <?php endif; ?>
    </div>
  </div>
</body>
</html>
