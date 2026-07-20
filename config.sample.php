<?php
/**
 * Copy this file to config.php and fill in real values.
 * config.php is gitignored — never commit real credentials.
 */

// --- Database -------------------------------------------------------------
define('DB_HOST', 'localhost');
define('DB_NAME', 'cocircuit');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// --- File uploads -----------------------------------------------------------
define('CV_UPLOAD_DIR', __DIR__ . '/uploads/cvs');
define('CV_MAX_BYTES', 5 * 1024 * 1024); // 5MB — keep in sync with js/main.js
define('CV_ALLOWED_EXTENSIONS', ['pdf', 'doc', 'docx']);
define('CV_ALLOWED_MIME_TYPES', [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

// --- Admin session ----------------------------------------------------------
define('ADMIN_SESSION_NAME', 'cocircuit_admin');

// --- Environment --------------------------------------------------------
// Set to false once deployed to production so PHP errors aren't shown to visitors.
define('APP_DEBUG', true);
