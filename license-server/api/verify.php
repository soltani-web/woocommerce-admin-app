<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-App-Token');
header('Access-Control-Allow-Methods: POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../db.php';

$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, true);

$licenseKey = trim($input['license_key'] ?? '');
$deviceId = trim($input['device_id'] ?? '');

if (empty($licenseKey) || empty($deviceId)) {
    echo json_encode([
        'isValid' => false,
        'message' => 'کد لایسنس و شناسه دستگاه الزامی است.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$cleanKey = strtoupper($licenseKey);
$db = getDB();

$stmt = $db->prepare("SELECT * FROM licenses WHERE UPPER(license_key) = ?");
$stmt->execute([$cleanKey]);
$license = $stmt->fetch();

if (!$license) {
    echo json_encode([
        'isValid' => false,
        'message' => 'این لایسنس از سرور حذف شده یا نامعتبر است.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($license['status'] !== 'active') {
    echo json_encode([
        'isValid' => false,
        'message' => 'این لایسنس غیرفعال یا مسدود شده است.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// بررسی تاریخ انقضا
if (!empty($license['expires_at'])) {
    $expiry = strtotime($license['expires_at']);
    if (time() > $expiry) {
        echo json_encode([
            'isValid' => false,
            'message' => 'اعتبار زمانی لایسنس شما منقضی شده است.'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

// بررسی دستگاه
$registeredDevices = json_decode($license['registered_devices'] ?? '[]', true) ?: [];
if (!in_array($deviceId, $registeredDevices)) {
    echo json_encode([
        'isValid' => false,
        'message' => 'دسترسی این دستگاه به لایسنس مربوطه تایید نشده است.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

echo json_encode([
    'isValid' => true,
    'data' => [
        'license_key' => $license['license_key'],
        'buyer_name' => $license['buyer_name'],
        'expires_at' => $license['expires_at'],
        'max_devices' => intval($license['max_devices']),
        'activated_at' => $license['activated_at'] ? strtotime($license['activated_at']) * 1000 : time() * 1000
    ]
], JSON_UNESCAPED_UNICODE);
