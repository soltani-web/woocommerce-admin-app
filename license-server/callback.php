<?php
require_once __DIR__ . '/db.php';

$trackId = $_GET['trackId'] ?? '';
$success = $_GET['success'] ?? '';
$status = $_GET['status'] ?? '';

$db = getDB();
$txStmt = $db->prepare("SELECT t.*, p.name as plan_name, p.duration_days, p.max_devices FROM transactions t JOIN plans p ON t.plan_id = p.id WHERE t.track_id = ?");
$txStmt->execute([$trackId]);
$transaction = $txStmt->fetch();

$isVerified = false;
$errorMessage = '';
$licenseData = null;

if (!$transaction) {
    $errorMessage = '?????? ?? ??? ????? ???? ???.';
} elseif ($success == 1) {
    // ????? ?????? ?? ???? ?????
    $verifyData = [
        'merchant' => ZIBAL_MERCHANT,
        'trackId' => $trackId,
    ];

    $ch = curl_init('https://gateway.zibal.ir/v1/verify');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($verifyData),
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_TIMEOUT => 20,
    ]);
    $response = curl_exec($ch);
    curl_close($ch);

    $resData = json_decode($response, true);

    if (isset($resData['result']) && in_array($resData['result'], [100, 201])) {
        $refNumber = $resData['refNumber'] ?? ($resData['cardNumber'] ?? '????');
        $cardNumber = $resData['cardNumber'] ?? '';

        // ??? ?????? ???? ???? ???? ????? ????? ??
        if ($transaction['status'] !== 'completed' || empty($transaction['license_id'])) {
            $licenseKey = generateLicenseKey();
            $durationDays = intval($transaction['duration_days']);
            $expiresAt = null;
            if ($durationDays > 0) {
                $expiresAt = date('Y-m-d H:i:s', strtotime("+{$durationDays} days"));
            }

            // ??? ??????
            $licStmt = $db->prepare("INSERT INTO licenses (license_key, buyer_name, buyer_phone, buyer_email, plan_id, max_devices, expires_at, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'active')");
            $licStmt->execute([
                $licenseKey,
                $transaction['buyer_name'],
                $transaction['buyer_phone'],
                $transaction['buyer_email'],
                $transaction['plan_id'],
                $transaction['max_devices'],
                $expiresAt
            ]);
            $licenseId = $db->lastInsertId();

            // ????????? ??????
            $updTx = $db->prepare("UPDATE transactions SET status = 'completed', ref_number = ?, card_number = ?, license_id = ? WHERE id = ?");
            $updTx->execute([$refNumber, $cardNumber, $licenseId, $transaction['id']]);

            $licenseData = [
                'key' => $licenseKey,
                'name' => $transaction['buyer_name'],
                'plan' => $transaction['plan_name'],
                'expires_at' => $expiresAt ? date('Y/m/d', strtotime($expiresAt)) : '??????? (?????)',
                'ref' => $refNumber,
                'devices' => $transaction['max_devices']
            ];
            $isVerified = true;
        } else {
            // ???? ???? ???? ??????? ?????? ?? ?????
            $licStmt = $db->prepare("SELECT * FROM licenses WHERE id = ?");
            $licStmt->execute([$transaction['license_id']]);
            $lic = $licStmt->fetch();
            $licenseData = [
                'key' => $lic['license_key'],
                'name' => $lic['buyer_name'],
                'plan' => $transaction['plan_name'],
                'expires_at' => $lic['expires_at'] ? date('Y/m/d', strtotime($lic['expires_at'])) : '??????? (?????)',
                'ref' => $transaction['ref_number'],
                'devices' => $lic['max_devices']
            ];
            $isVerified = true;
        }
    } else {
        $errorMessage = $resData['message'] ?? '?????? ???? ????? ????? ????? ??? (?? ???: ' . ($resData['result'] ?? '') . ')';
        $updTx = $db->prepare("UPDATE transactions SET status = 'failed' WHERE id = ?");
        $updTx->execute([$transaction['id']]);
    }
} else {
    $errorMessage = '?????? ??? ?? ?? ?????? ???.';
    if ($transaction) {
        $updTx = $db->prepare("UPDATE transactions SET status = 'canceled' WHERE id = ?");
        $updTx->execute([$transaction['id']]);
    }
}
?>
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>????? ?????? - <?= htmlspecialchars(SITE_NAME) ?></title>
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/misc/Farsi-Digits/Vazirmatn-FD-font-face.css">
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>
        body { font-family: 'Vazirmatn FD', system-ui, sans-serif; }
    </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center p-4">

    <div class="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center">
        <?php if ($isVerified && $licenseData): ?>
            <div class="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                <i data-lucide="check-circle-2" class="w-9 h-9"></i>
            </div>
            
            <h2 class="text-2xl font-extrabold text-white">?????? ? ????????? ????!</h2>
            <p class="text-xs text-slate-400 mt-1">?? ?????? ??? ???? ?? ? ????? ??????? ?? ???????? ???.</p>

            <!-- License Key Box -->
            <div class="my-6 p-4 rounded-2xl bg-slate-950 border-2 border-dashed border-blue-500/50 text-center">
                <span class="text-xs text-slate-400 block mb-1">?? ?????? ??????? ???:</span>
                <div class="flex items-center justify-center gap-3">
                    <span id="licenseKeyText" class="font-mono text-xl sm:text-2xl font-bold tracking-widest text-blue-400 select-all"><?= $licenseData['key'] ?></span>
                    <button onclick="copyLicense()" class="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition" title="??? ??????">
                        <i data-lucide="copy" class="w-4 h-4"></i>
                    </button>
                </div>
                <span id="copyFeedback" class="text-[11px] text-emerald-400 hidden mt-1 block">?? ?????? ?? ????????? ??? ??!</span>
            </div>

            <!-- Details -->
            <div class="space-y-2.5 text-xs text-slate-300 bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60 text-right mb-6">
                <div class="flex justify-between">
                    <span class="text-slate-400">??? ??????:</span>
                    <span class="font-semibold text-white"><?= htmlspecialchars($licenseData['name']) ?></span>
                </div>
                <div class="flex justify-between">
                    <span class="text-slate-400">??? ??????:</span>
                    <span class="font-semibold text-white"><?= htmlspecialchars($licenseData['plan']) ?></span>
                </div>
                <div class="flex justify-between">
                    <span class="text-slate-400">????? ?????:</span>
                    <span class="font-semibold text-white"><?= $licenseData['expires_at'] ?></span>
                </div>
                <div class="flex justify-between">
                    <span class="text-slate-400">?????????? ????:</span>
                    <span class="font-semibold text-white"><?= $licenseData['devices'] ?> ??????</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-slate-400">????? ?????? ?????:</span>
                    <span class="font-mono font-semibold text-cyan-400"><?= $licenseData['ref'] ?></span>
                </div>
            </div>

            <!-- Download Button -->
            <div class="space-y-3">
                <a href="<?= htmlspecialchars(APP_DOWNLOAD_URL) ?>" target="_blank" class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition">
                    <i data-lucide="download" class="w-5 h-5"></i>
                    <span>?????? ?????? ???? ???????? (APK)</span>
                </a>
                <a href="index.php" class="inline-block text-xs text-slate-400 hover:text-white transition">
                    ?????? ?? ???? ????
                </a>
            </div>

        <?php else: ?>
            <div class="w-16 h-16 bg-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500/30">
                <i data-lucide="alert-circle" class="w-9 h-9"></i>
            </div>
            
            <h2 class="text-2xl font-extrabold text-white">?????? ?????? ???</h2>
            <p class="text-sm text-red-400 mt-2"><?= htmlspecialchars($errorMessage) ?></p>

            <div class="mt-8">
                <a href="index.php" class="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold inline-flex items-center gap-2 transition">
                    <i data-lucide="arrow-right" class="w-4 h-4"></i>
                    <span>???? ???? ???? ????</span>
                </a>
            </div>
        <?php endif; ?>
    </div>

    <script>
        lucide.createIcons();
        function copyLicense() {
            const key = document.getElementById('licenseKeyText').innerText;
            navigator.clipboard.writeText(key).then(() => {
                const fb = document.getElementById('copyFeedback');
                fb.classList.remove('hidden');
                setTimeout(() => fb.classList.add('hidden'), 3000);
            });
        }
    </script>
</body>
</html>
