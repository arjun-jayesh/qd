<?php
// ─────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────

$toEmail = "talk@quilldraws.com"; // change this
$subject = "New Branding Lead - Quilldraws";

// ─────────────────────────────────────────────
// GET FORM DATA
// ─────────────────────────────────────────────

$name     = htmlspecialchars($_POST['name'] ?? '');
$business = htmlspecialchars($_POST['business'] ?? '');
$email    = htmlspecialchars($_POST['email'] ?? '');
$phone    = htmlspecialchars($_POST['phone'] ?? '');
$service  = htmlspecialchars($_POST['service'] ?? '');
$budget   = htmlspecialchars($_POST['budget'] ?? '');
$message  = htmlspecialchars($_POST['message'] ?? '');
$package  = htmlspecialchars($_POST['selectedPackage'] ?? $_GET['package'] ?? 'Not Selected');

// ─────────────────────────────────────────────
// BASIC VALIDATION
// ─────────────────────────────────────────────

if (!$name || !$email) {
    die("Missing required fields.");
}

$honeypot = $_POST['website_url'] ?? '';
$timestamp = (int)($_POST['form_timestamp'] ?? 0);
$current_time = time();

if (!empty($honeypot) || ($current_time - $timestamp) < 3) {
    die("Spam detected.");
}

// Strip CRLF to prevent email header injection
$email = str_replace(array("\r", "\n"), '', $email);
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    die("Invalid Email");
}

// ─────────────────────────────────────────────
// EMAIL CONTENT
// ─────────────────────────────────────────────

$body = "
New Lead from Quilldraws Website

--------------------------
Name: $name
Business: $business
Email: $email
Phone: $phone

Service Needed: $service
Budget Range: $budget
Selected Package: $package

Message:
$message
--------------------------
";

// ─────────────────────────────────────────────
// HEADERS
// ─────────────────────────────────────────────

$headers = "From: noreply@quilldraws.com\r\n";
$headers .= "Reply-To: $email\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

// ─────────────────────────────────────────────
// SEND EMAIL
// ─────────────────────────────────────────────

mail($toEmail, $subject, $body, $headers);

// ─────────────────────────────────────────────
// REDIRECT THANK YOU PAGE
// ─────────────────────────────────────────────

header("Location: thank-you.html");
exit;
?>