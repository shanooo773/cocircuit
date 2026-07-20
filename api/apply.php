<?php
/**
 * Handles the jobs.html application form: validates the submission,
 * stores the CV on disk, and records the application in MySQL.
 * No payment is involved — this is a free "register your interest" form.
 */

require_once __DIR__ . '/../db.php';

header('Content-Type: application/json');

function respond(int $status, bool $success, string $message): void
{
    http_response_code($status);
    echo json_encode(['success' => $success, 'message' => $message]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, false, 'Method not allowed.');
}

// Honeypot — real visitors never see or fill this field.
if (!empty($_POST['website'])) {
    // Pretend success so bots don't learn anything, but do nothing further.
    respond(200, true, 'Thank you.');
}

$fullName = trim((string) ($_POST['full_name'] ?? ''));
$email = trim((string) ($_POST['email'] ?? ''));
$phone = trim((string) ($_POST['phone'] ?? ''));
$roleInterest = trim((string) ($_POST['role_interest'] ?? ''));
$experience = trim((string) ($_POST['experience'] ?? ''));
$linkedinUrl = trim((string) ($_POST['linkedin_url'] ?? ''));
$message = trim((string) ($_POST['message'] ?? ''));
$consent = isset($_POST['consent']);

if ($fullName === '' || $email === '' || $phone === '' || $roleInterest === '') {
    respond(400, false, 'Please complete all required fields.');
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(400, false, 'Please provide a valid email address.');
}

if (!$consent) {
    respond(400, false, 'Please confirm you agree to the Privacy Policy.');
}

if ($linkedinUrl !== '' && !filter_var($linkedinUrl, FILTER_VALIDATE_URL)) {
    respond(400, false, 'Please provide a valid LinkedIn / portfolio URL.');
}

// Trim to sane lengths, matching the schema column sizes.
$fullName = mb_substr($fullName, 0, 150);
$email = mb_substr($email, 0, 190);
$phone = mb_substr($phone, 0, 40);
$roleInterest = mb_substr($roleInterest, 0, 120);
$experience = mb_substr($experience, 0, 40);
$linkedinUrl = mb_substr($linkedinUrl, 0, 255);

// --- CV upload validation ---------------------------------------------------
if (!isset($_FILES['cv']) || $_FILES['cv']['error'] === UPLOAD_ERR_NO_FILE) {
    respond(400, false, 'Please attach your CV.');
}

$cv = $_FILES['cv'];

if ($cv['error'] !== UPLOAD_ERR_OK) {
    respond(400, false, 'There was a problem uploading your CV. Please try again.');
}

if ($cv['size'] > CV_MAX_BYTES) {
    respond(400, false, 'Your CV is too large — please keep it under 5MB.');
}

$originalName = $cv['name'];
$ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));

if (!in_array($ext, CV_ALLOWED_EXTENSIONS, true)) {
    respond(400, false, 'Please upload a PDF, DOC or DOCX file.');
}

$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mimeType = finfo_file($finfo, $cv['tmp_name']);
finfo_close($finfo);

if (!in_array($mimeType, CV_ALLOWED_MIME_TYPES, true)) {
    respond(400, false, 'That file does not look like a valid PDF or Word document.');
}

if (!is_dir(CV_UPLOAD_DIR)) {
    mkdir(CV_UPLOAD_DIR, 0750, true);
}

$storedFilename = bin2hex(random_bytes(16)) . '.' . $ext;
$destination = rtrim(CV_UPLOAD_DIR, '/\\') . DIRECTORY_SEPARATOR . $storedFilename;

if (!move_uploaded_file($cv['tmp_name'], $destination)) {
    respond(500, false, 'We could not save your CV. Please try again.');
}

// --- Persist to the database -------------------------------------------------
try {
    $pdo = get_db();
    $stmt = $pdo->prepare(
        'INSERT INTO job_applications
            (full_name, email, phone, role_interest, experience, linkedin_url, message, cv_filename, cv_original_name, cv_size, ip_address)
         VALUES
            (:full_name, :email, :phone, :role_interest, :experience, :linkedin_url, :message, :cv_filename, :cv_original_name, :cv_size, :ip_address)'
    );
    $stmt->execute([
        ':full_name' => $fullName,
        ':email' => $email,
        ':phone' => $phone,
        ':role_interest' => $roleInterest,
        ':experience' => $experience !== '' ? $experience : null,
        ':linkedin_url' => $linkedinUrl !== '' ? $linkedinUrl : null,
        ':message' => $message !== '' ? $message : null,
        ':cv_filename' => $storedFilename,
        ':cv_original_name' => mb_substr(basename($originalName), 0, 255),
        ':cv_size' => $cv['size'],
        ':ip_address' => $_SERVER['REMOTE_ADDR'] ?? null,
    ]);
} catch (PDOException $e) {
    // Roll back the file we already saved so we don't leak orphaned uploads.
    if (file_exists($destination)) {
        unlink($destination);
    }
    respond(500, false, 'We could not save your application. Please try again shortly.');
}

respond(200, true, 'Application received.');
