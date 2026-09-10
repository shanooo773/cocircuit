<?php
require_once __DIR__ . '/auth.php';

$pdo = get_db();
$applications = $pdo->query(
    'SELECT id, full_name, email, phone, role_interest, experience, linkedin_url, message,
            cv_original_name, cv_size, created_at
     FROM job_applications
     ORDER BY created_at DESC'
)->fetchAll();

function fmt_bytes(int $bytes): string
{
    return round($bytes / 1024, 1) . ' KB';
}
?>
<!doctype html>
<html lang="en-GB">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Job Applications | Admin</title>
<meta name="robots" content="noindex, nofollow">
<link rel="icon" type="image/svg+xml" href="../assets/favicon.svg">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../css/styles.css?v=2">
</head>
<body>
  <div class="container admin-wrap">
    <div class="admin-header">
      <h1 style="margin-bottom:0;">Job Applications</h1>
      <div class="admin-header-meta">
        <span>Logged in as <strong><?= htmlspecialchars($_SESSION['admin_username'] ?? '') ?></strong></span>
        <a href="logout.php" class="btn btn-outline">Log Out</a>
      </div>
    </div>

    <?php if (!$applications): ?>
      <p style="margin-top:var(--space-6);">No applications yet.</p>
    <?php else: ?>
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Submitted</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Area of Interest</th>
              <th>Experience</th>
              <th>LinkedIn</th>
              <th>Message</th>
              <th>CV</th>
            </tr>
          </thead>
          <tbody>
            <?php foreach ($applications as $app): ?>
              <tr>
                <td><?= htmlspecialchars(date('d M Y, H:i', strtotime($app['created_at']))) ?></td>
                <td><?= htmlspecialchars($app['full_name']) ?></td>
                <td><a href="mailto:<?= htmlspecialchars($app['email']) ?>"><?= htmlspecialchars($app['email']) ?></a></td>
                <td><?= htmlspecialchars($app['phone']) ?></td>
                <td><?= htmlspecialchars($app['role_interest']) ?></td>
                <td><?= htmlspecialchars($app['experience'] ?? '—') ?></td>
                <td>
                  <?php if (!empty($app['linkedin_url'])): ?>
                    <a href="<?= htmlspecialchars($app['linkedin_url']) ?>" target="_blank" rel="noopener noreferrer">View</a>
                  <?php else: ?>
                    —
                  <?php endif; ?>
                </td>
                <td class="admin-message-cell" title="<?= htmlspecialchars($app['message'] ?? '') ?>"><?= htmlspecialchars($app['message'] ?? '—') ?></td>
                <td>
                  <a href="download.php?id=<?= (int) $app['id'] ?>" class="btn btn-primary btn-sm">
                    Download <span style="opacity:0.75;">(<?= fmt_bytes((int) $app['cv_size']) ?>)</span>
                  </a>
                </td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    <?php endif; ?>
  </div>
</body>
</html>
