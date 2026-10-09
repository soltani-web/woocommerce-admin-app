<?php
require_once __DIR__ . '/../config.php';

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $password = $_POST['password'] ?? '';
    if ($password === ADMIN_PASSWORD) {
        $_SESSION['admin_logged_in'] = true;
        header('Location: index.php');
        exit;
    } else {
        $error = 'کلمه عبور مدیریت نادرست است.';
    }
}
?>
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ورود به پنل مدیریت لایسنس‌ها</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/misc/Farsi-Digits/Vazirmatn-FD-font-face.css">
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>
        body { font-family: 'Vazirmatn FD', system-ui, sans-serif; }
    </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <div class="w-14 h-14 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
            <i data-lucide="shield" class="w-7 h-7"></i>
        </div>

        <h2 class="text-xl font-bold text-center text-white">ورود به پنل مدیریت لایسنس</h2>
        <p class="text-xs text-slate-400 text-center mt-1">مدیریت فروش‌ها، پلن‌ها و لایسنس‌های ووکامرس</p>

        <?php if (!empty($error)): ?>
            <div class="mt-4 p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 text-xs text-center font-semibold">
                <?= htmlspecialchars($error) ?>
            </div>
        <?php endif; ?>

        <form method="POST" class="mt-6 space-y-4">
            <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1.5">کلمه عبور مدیر</label>
                <input type="password" name="password" required placeholder="••••••••" class="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-center">
            </div>

            <button type="submit" class="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-500 transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30">
                <i data-lucide="log-in" class="w-4 h-4"></i>
                <span>ورود به پنل</span>
            </button>

            <div class="text-center mt-4">
                <a href="../index.php" class="text-xs text-slate-500 hover:text-slate-400">بازگشت به سایت</a>
            </div>
        </form>
    </div>
    <script>lucide.createIcons();</script>
</body>
</html>
