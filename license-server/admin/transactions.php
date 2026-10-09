<?php
require_once __DIR__ . '/auth.php';
checkAdminAuth();
require_once __DIR__ . '/../db.php';

$db = getDB();

$search = trim($_GET['search'] ?? '');
$query = "SELECT t.*, p.name as plan_name, l.license_key FROM transactions t LEFT JOIN plans p ON t.plan_id = p.id LEFT JOIN licenses l ON t.license_id = l.id WHERE 1=1";
$params = [];

if (!empty($search)) {
    $query .= " AND (t.buyer_name LIKE ? OR t.buyer_phone LIKE ? OR t.track_id LIKE ? OR t.ref_number LIKE ?)";
    $params[] = "%{$search}%";
    $params[] = "%{$search}%";
    $params[] = "%{$search}%";
    $params[] = "%{$search}%";
}

$query .= " ORDER BY t.id DESC";
$stmt = $db->prepare($query);
$stmt->execute($params);
$transactions = $stmt->fetchAll();
?>
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>?????????? ????? - ??? ??????</title>
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
                <a href="index.php" class="px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center gap-2">
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
                <a href="transactions.php" class="px-3 py-2 rounded-xl bg-blue-600/20 text-blue-400 font-semibold flex items-center gap-2">
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

    <!-- Main -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="flex justify-between items-center mb-6">
            <div>
                <h1 class="text-2xl font-extrabold text-white">??? ?????????? ????? ?????</h1>
                <p class="text-xs text-slate-400 mt-1">?????? ?????????? ????? ????? ?????? ????? ? ?????????? ?????</p>
            </div>
        </div>

        <!-- Search -->
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6">
            <form method="GET" class="flex gap-3">
                <input type="text" name="search" value="<?= htmlspecialchars($search) ?>" placeholder="????? ?? ??? ??????? ????? ??????? ?? ?????? ?????..." class="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500">
                <button type="submit" class="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 transition">
                    <i data-lucide="search" class="w-4 h-4"></i>
                    <span>?????</span>
                </button>
            </form>
        </div>

        <!-- Table -->
        <div class="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div class="overflow-x-auto">
                <table class="w-full text-right text-xs">
                    <thead class="bg-slate-800/80 text-slate-400 uppercase text-[11px] border-b border-slate-700">
                        <tr>
                            <th class="p-4">?????</th>
                            <th class="p-4">??????</th>
                            <th class="p-4">??? / ????</th>
                            <th class="p-4">?? ?????? ????? / ????</th>
                            <th class="p-4">?????? ???? ???</th>
                            <th class="p-4">?????</th>
                            <th class="p-4">?????</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-800">
                        <?php if (empty($transactions)): ?>
                            <tr>
                                <td colspan="7" class="p-8 text-center text-slate-500">??????? ???? ???.</td>
                            </tr>
                        <?php else: ?>
                            <?php foreach ($transactions as $t): ?>
                            <tr class="hover:bg-slate-800/40 transition">
                                <td class="p-4 text-slate-400 font-mono">#<?= $t['id'] ?></td>
                                <td class="p-4">
                                    <div class="font-bold text-white text-xs"><?= htmlspecialchars($t['buyer_name']) ?></div>
                                    <div class="text-[11px] text-slate-400"><?= htmlspecialchars($t['buyer_phone']) ?></div>
                                </td>
                                <td class="p-4">
                                    <div class="font-semibold text-white"><?= htmlspecialchars($t['plan_name'] ?? '??????') ?></div>
                                    <div class="text-emerald-400 font-bold text-[11px]"><?= number_format($t['amount']) ?> ?????</div>
                                </td>
                                <td class="p-4 font-mono text-[11px] text-cyan-400">
                                    <div>Track: <?= $t['track_id'] ?: '---' ?></div>
                                    <div class="text-slate-400">Ref: <?= $t['ref_number'] ?: '---' ?></div>
                                </td>
                                <td class="p-4 font-mono text-blue-400 font-bold select-all">
                                    <?= $t['license_key'] ?: '---' ?>
                                </td>
                                <td class="p-4">
                                    <span class="px-2.5 py-1 rounded-full text-[10px] font-bold <?= $t['status'] === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : ($t['status'] === 'pending' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400') ?>">
                                        <?= $t['status'] === 'completed' ? '????' : ($t['status'] === 'pending' ? '?? ?????? ??????' : '?????? / ???') ?>
                                    </span>
                                </td>
                                <td class="p-4 text-slate-400 text-[11px]">
                                    <?= date('Y/m/d H:i', strtotime($t['created_at'])) ?>
                                </td>
                            </tr>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </main>

    <script>lucide.createIcons();</script>
</body>
</html>
