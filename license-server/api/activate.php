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
        'success' => false,
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
        'success' => false,
        'message' => 'کد لایسنس وارد شده معتبر نبوده یا در سیستم ثبت نشده است.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($license['status'] !== 'active') {
    echo json_encode([
        'success' => false,
        'message' => 'این لایسنس غیرفعال یا توسط مدیر مسدود شده است.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// بررسی انقضا
if (!empty($license['expires_at'])) {
    $expiry = strtotime($license['expires_at']);
    if (time() > $expiry) {
        echo json_encode([
            'success' => false,
            'message' => 'مهلت استفاده از این لایسنس به پایان رسیده است.'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

// بررسی دستگاه‌ها
$registeredDevices = json_decode($license['registered_devices'] ?? '[]', true) ?: [];
$maxDevices = intval($license['max_devices']) ?: 1;

if (!in_array($deviceId, $registeredDevices)) {
    if (count($registeredDevices) >= $maxDevices) {
        echo json_encode([
            'success' => false,
            'message' => "حداکثر تعداد دستگاه‌های مجاز ({$maxDevices} دستگاه) برای این لایسنس تکمیل شده است."
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // ثبت دستگاه جدید
    $registeredDevices[] = $deviceId;
    $upd = $db->prepare("UPDATE licenses SET registered_devices = ?, activated_at = COALESCE(activated_at, CURRENT_TIMESTAMP) WHERE id = ?");
    $upd->execute([json_encode($registeredDevices), $license['id']]);
}

echo json_encode([
    'success' => true,
    'message' => "لایسنس با موفقیت برای «{$license['buyer_name']}» فعال گردید.",
    'data' => [
        'license_key' => $license['license_key'],
        'buyer_name' => $license['buyer_name'],
        'expires_at' => $license['expires_at'],
        'max_devices' => $maxDevices,
        'activated_at' => time() * 1000
    ]
], JSON_UNESCAPED_UNICODE);
