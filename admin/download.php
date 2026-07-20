<?php
require_once __DIR__ . '/auth.php';

$id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
if (!$id) {
    http_response_code(400);
    exit('Invalid request.');
}

$pdo = get_db();
$stmt = $pdo->prepare('SELECT cv_filename, cv_original_name FROM job_applications WHERE id = :id LIMIT 1');
$stmt->execute([':id' => $id]);
$app = $stmt->fetch();

if (!$app) {
    http_response_code(404);
    exit('Not found.');
}

// cv_filename is always our own randomly generated name — never derived from
// user input at request time — so this stays safe from path traversal.
$path = rtrim(CV_UPLOAD_DIR, '/\\') . DIRECTORY_SEPARATOR . $app['cv_filename'];

if (!is_file($path)) {
    http_response_code(404);
    exit('File no longer available.');
}

$downloadName = preg_replace('/[^A-Za-z0-9._-]/', '_', $app['cv_original_name']);

header('Content-Type: application/octet-stream');
header('Content-Disposition: attachment; filename="' . $downloadName . '"');
header('Content-Length: ' . filesize($path));
header('X-Content-Type-Options: nosniff');

readfile($path);
exit;
