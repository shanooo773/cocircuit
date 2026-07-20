<?php
require_once __DIR__ . '/../db.php';

session_name(ADMIN_SESSION_NAME);
session_start();
$_SESSION = [];
session_destroy();

header('Location: login.php');
exit;
