<?php
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: index.php');
    exit;
}

$planId = intval($_POST['plan_id'] ?? 0);
$buyerName = trim($_POST['buyer_name'] ?? '');
$buyerPhone = trim($_POST['buyer_phone'] ?? '');
$buyerEmail = trim($_POST['buyer_email'] ?? '');

if (empty($planId) || empty($buyerName) || empty($buyerPhone)) {
    die('لطفاً تمامی فیلدهای الزامی را تکمیل نمایید.');
}

$db = getDB();
$stmt = $db->prepare("SELECT * FROM plans WHERE id = ? AND is_active = 1");
$stmt->execute([$planId]);
$plan = $stmt->fetch();

if (!$plan) {
    die('پلن انتخاب شده نامعتبر است.');
}

// قیمت به تومان است، زیبال مبلغ را به ریال دریافت می‌کند (تومان * 10)
$amountToman = intval($plan['price']);
$amountRial = $amountToman * 10;

// ایجاد تراکنش در حالت pending
$insertTx = $db->prepare("INSERT INTO transactions (plan_id, amount, buyer_name, buyer_phone, buyer_email, status) VALUES (?, ?, ?, ?, ?, 'pending')");
$insertTx->execute([$planId, $amountToman, $buyerName, $buyerPhone, $buyerEmail]);
$txId = $db->lastInsertId();

// ارسال درخواست به زیبال
$postData = [
    'merchant' => ZIBAL_MERCHANT,
    'amount' => $amountRial,
    'callbackUrl' => ZIBAL_CALLBACK_URL,
    'description' => "خرید لایسنس {$plan['name']} - {$buyerName}",
    'orderId' => (string)$txId,
    'mobile' => $buyerPhone,
];

$ch = curl_init('https://gateway.zibal.ir/v1/request');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode($postData),
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    CURLOPT_TIMEOUT => 20,
]);

$response = curl_exec($ch);
$err = curl_error($ch);
curl_close($ch);

if ($err) {
    die('خطا در ارتباط با درگاه پرداخت زیبال: ' . $err);
}

$resData = json_decode($response, true);

if (isset($resData['result']) && $resData['result'] === 100) {
    $trackId = $resData['trackId'];
    // ثبت trackId
    $updateTx = $db->prepare("UPDATE transactions SET track_id = ? WHERE id = ?");
    $updateTx->execute([$trackId, $txId]);

    // هدایت به درگاه پرداخت زیبال
    header("Location: https://gateway.zibal.ir/start/{$trackId}");
    exit;
} else {
    $msg = $resData['message'] ?? 'کد خطا: ' . ($resData['result'] ?? 'نامشخص');
    die('خطا در ایجاد تراکنش درگاه زیبال: ' . $msg);
}
