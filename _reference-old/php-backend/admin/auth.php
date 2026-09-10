<?php
/**
 * Include at the top of any admin page that requires a logged-in admin.
 */

require_once __DIR__ . '/../db.php';

session_name(ADMIN_SESSION_NAME);
session_start();

function require_admin(): void
{
    if (empty($_SESSION['admin_id'])) {
        header('Location: login.php');
        exit;
    }
}

require_admin();
