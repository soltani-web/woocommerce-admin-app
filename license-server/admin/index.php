<?php
require_once __DIR__ . '/auth.php';
checkAdminAuth();
require_once __DIR__ . '/../db.php';

$db = getDB();

// ??????? ?????
$totalIncome = $db->query("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE status = 'completed'")->fetch()['total'];
$activeLicensesCount = $db->query("SELECT COUNT(*) as total FROM licenses WHERE status = 'active'")->fetch()['total'];
$totalLicensesCount = $db->query("SELECT COUNT(*) as total FROM licenses")->fetch()['total'];
$totalTxCount = $db->query("SELECT COUNT(*) as total FROM transactions WHERE status = 'completed'")->fetch()['total'];

// ? ?????? ????
$recentTx = $db->query("SELECT t.*, p.name as plan_name FROM transactions t JOIN plans p ON t.plan_id = p.id ORDER BY t.id DESC LIMIT 5")->fetchAll();

// ? ?????? ????
$recentLicenses = $db->query("SELECT l.*, p.name as plan_name FROM licenses l LEFT JOIN plans p ON l.plan_id = p.id ORDER BY l.id DESC LIMIT 5")->fetchAll();
?>
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>??????? ?????? - ?????? ??????</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/misc/Farsi-Digits/Vazirmatn-FD-font-face.css">
    <script src="https://unpkg.com/lucide@latest"></script>
    <style> body { font-family: 'Vazirmatn FD', system-ui, sans-serif; } </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen">

    <!-- Admin Nav -->
    <nav class="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
                    <i data-lucide="key" class="w-5 h-5"></i>
                </div>
                <span class="font-bold text-base text-white">??? ?????? ?????? ???????</span>
            </div>

            <div class="flex items-center gap-2 sm:gap-4 text-sm">
                <a href="index.php" class="px-3 py-2 rounded-xl bg-blue-600/20 text-blue-400 font-semibold flex items-center gap-2">
                    <i data-lucide="layout-dashboard" class="w-4 h-4"></i>
                    <span class="hidden sm:inline">???????</span>
                </a>
                <a href="licenses.php" class="px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center gap-2">
                    <i data-lucide="key-round" class="w-4 h-4"></i>
                    <span class="hidden sm:inline">?????????</span>
                </a>
                <a href="plans.php" class="px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center gap-2">
                    <i data-lucide="tag" class="w-4 h-4"></i>
                    <span class="hidden sm:inline">??????</span>
                </a>
                <a href="transactions.php" class="px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center gap-2">
                    <i data-lucide="credit-card" class="w-4 h-4"></i>
                    <span class="hidden sm:inline">?????????</span>
                </a>
                <a href="logout.php" class="px-3 py-2 rounded-xl text-red-400 hover:bg-red-500/10 transition flex items-center gap-2">
                    <i data-lucide="log-out" class="w-4 h-4"></i>
                    <span class="hidden sm:inline">????</span>
                </a>
            </div>
        </div>
    </nav>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <!-- Header Title & Action -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
                <h1 class="text-2xl font-extrabold text-white">??????? ? ???? ????</h1>
                <p class="text-xs text-slate-400 mt-1">????? ????? ?????????? ????? ? ?????????? ?????</p>
            </div>
            <a href="licenses.php?action=create" class="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition shadow-lg shadow-blue-600/20">
                <i data-lucide="plus" class="w-4 h-4"></i>
                <span>????? ?????? ????</span>
            </a>
        </div>

        <!-- Stats Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div class="bg-slate-900 border border-slate-800 p-5 rounded-3xl">
                <div class="flex justify-between items-start">
                    <div>
                        <span class="text-xs text-slate-400">????? ????? ??</span>
                        <h3 class="text-2xl font-black text-emerald-400 mt-2"><?= number_format($totalIncome) ?> <span class="text-xs text-slate-400 font-normal">?????</span></h3>
                    </div>
                    <div class="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl">
                        <i data-lucide="wallet" class="w-6 h-6"></i>
                    </div>
                </div>
            </div>

            <div class="bg-slate-900 border border-slate-800 p-5 rounded-3xl">
                <div class="flex justify-between items-start">
                    <div>
                        <span class="text-xs text-slate-400">?????????? ????</span>
                        <h3 class="text-2xl font-black text-blue-400 mt-2"><?= number_format($activeLicensesCount) ?></h3>
                    </div>
                    <div class="p-3 bg-blue-500/10 text-blue-400 rounded-2xl">
                        <i data-lucide="check-circle" class="w-6 h-6"></i>
                    </div>
                </div>
            </div>

            <div class="bg-slate-900 border border-slate-800 p-5 rounded-3xl">
                <div class="flex justify-between items-start">
                    <div>
                        <span class="text-xs text-slate-400">?? ?????????</span>
                        <h3 class="text-2xl font-black text-purple-400 mt-2"><?= number_format($totalLicensesCount) ?></h3>
                    </div>
                    <div class="p-3 bg-purple-500/10 text-purple-400 rounded-2xl">
                        <i data-lucide="key" class="w-6 h-6"></i>
                    </div>
                </div>
            </div>

            <div class="bg-slate-900 border border-slate-800 p-5 rounded-3xl">
                <div class="flex justify-between items-start">
                    <div>
                        <span class="text-xs text-slate-400">?????????? ????</span>
                        <h3 class="text-2xl font-black text-cyan-400 mt-2"><?= number_format($totalTxCount) ?></h3>
                    </div>
                    <div class="p-3 bg-cyan-500/10 text-cyan-400 rounded-2xl">
                        <i data-lucide="check-check" class="w-6 h-6"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Recent Tables Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Recent Licenses -->
            <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="font-bold text-white text-base">????? ?????????? ???? ???</h3>
                    <a href="licenses.php" class="text-xs text-blue-400 hover:underline">?????? ???</a>
                </div>

                <div class="space-y-3">
                    <?php if (empty($recentLicenses)): ?>
                        <p class="text-xs text-slate-500 text-center py-6">???? ??? ??????? ??? ???? ???.</p>
                    <?php else: ?>
                        <?php foreach ($recentLicenses as $lic): 
                            $devices = json_decode($lic['registered_devices'] ?? '[]', true) ?: [];
                        ?>
                            <div class="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-between">
                                <div>
                                    <div class="flex items-center gap-2">
                                        <span class="font-mono text-xs font-bold text-blue-400"><?= $lic['license_key'] ?></span>
                                        <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold <?= $lic['status'] === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400' ?>">
                                            <?= $lic['status'] === 'active' ? '????' : '?????' ?>
                                        </span>
                                    </div>
                                    <p class="text-xs text-slate-300 mt-1"><?= htmlspecialchars($lic['buyer_name']) ?> <span class="text-slate-500">(<?= htmlspecialchars($lic['buyer_phone']) ?>)</span></p>
                                </div>
                                <div class="text-left text-xs text-slate-400">
                                    <span><?= count($devices) ?>/<?= $lic['max_devices'] ?> ??????</span>
                                    <span class="block text-[11px] text-slate-500 mt-0.5"><?= $lic['expires_at'] ? date('Y/m/d', strtotime($lic['expires_at'])) : '?????' ?></span>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </div>
            </div>

            <!-- Recent Transactions -->
            <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="font-bold text-white text-base">????? ?????????? ?????</h3>
                    <a href="transactions.php" class="text-xs text-blue-400 hover:underline">?????? ???</a>
                </div>

                <div class="space-y-3">
                    <?php if (empty($recentTx)): ?>
                        <p class="text-xs text-slate-500 text-center py-6">???? ??????? ????? ???? ???.</p>
                    <?php else: ?>
                        <?php foreach ($recentTx as $tx): ?>
                            <div class="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-between">
                                <div>
                                    <p class="font-bold text-xs text-white"><?= htmlspecialchars($tx['buyer_name']) ?> - <span class="text-slate-400 font-normal"><?= htmlspecialchars($tx['plan_name']) ?></span></p>
                                    <p class="text-[11px] font-mono text-cyan-400 mt-0.5">??????: <?= $tx['ref_number'] ?: $tx['track_id'] ?></p>
                                </div>
                                <div class="text-left">
                                    <span class="font-bold text-xs text-emerald-400"><?= number_format($tx['amount']) ?> ?????</span>
                                    <span class="block text-[10px] <?= $tx['status'] === 'completed' ? 'text-emerald-400' : 'text-amber-400' ?> mt-0.5">
                                        <?= $tx['status'] === 'completed' ? '????' : $tx['status'] ?>
                                    </span>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </div>
            </div>
        </div>

    </main>

    <script>lucide.createIcons();</script>
</body>
</html>
