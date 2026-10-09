<?php
require_once __DIR__ . '/auth.php';
checkAdminAuth();
require_once __DIR__ . '/../db.php';

$db = getDB();
$message = '';
$error = '';

// اکشن‌ها
$action = $_GET['action'] ?? '';
$id = intval($_GET['id'] ?? 0);

// حذف لایسنس
if ($action === 'delete' && $id > 0) {
    $db->prepare("DELETE FROM licenses WHERE id = ?")->execute([$id]);
    header('Location: licenses.php?msg=deleted');
    exit;
}

// ریست کردن دستگاه‌های متصل
if ($action === 'reset_devices' && $id > 0) {
    $db->prepare("UPDATE licenses SET registered_devices = '[]' WHERE id = ?")->execute([$id]);
    header('Location: licenses.php?msg=devices_reset');
    exit;
}

// تغییر وضعیت (فعال / مسدود)
if ($action === 'toggle_status' && $id > 0) {
    $lic = $db->prepare("SELECT status FROM licenses WHERE id = ?");
    $lic->execute([$id]);
    $current = $lic->fetch();
    if ($current) {
        $newStatus = $current['status'] === 'active' ? 'blocked' : 'active';
        $db->prepare("UPDATE licenses SET status = ? WHERE id = ?")->execute([$newStatus, $id]);
    }
    header('Location: licenses.php?msg=status_updated');
    exit;
}

// ایجاد لایسنس دستی
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['create_license'])) {
    $buyerName = trim($_POST['buyer_name'] ?? '');
    $buyerPhone = trim($_POST['buyer_phone'] ?? '');
    $buyerEmail = trim($_POST['buyer_email'] ?? '');
    $customKey = trim($_POST['custom_key'] ?? '');
    $durationDays = intval($_POST['duration_days'] ?? 30);
    $maxDevices = intval($_POST['max_devices'] ?? 1);

    if (empty($buyerName) || empty($buyerPhone)) {
        $error = 'نام و شماره تماس خریدار الزامی است.';
    } else {
        $key = !empty($customKey) ? strtoupper($customKey) : generateLicenseKey();
        $expiresAt = null;
        if ($durationDays > 0) {
            $expiresAt = date('Y-m-d H:i:s', strtotime("+{$durationDays} days"));
        }

        try {
            $stmt = $db->prepare("INSERT INTO licenses (license_key, buyer_name, buyer_phone, buyer_email, max_devices, expires_at, status) VALUES (?, ?, ?, ?, ?, ?, 'active')");
            $stmt->execute([$key, $buyerName, $buyerPhone, $buyerEmail, $maxDevices, $expiresAt]);
            header('Location: licenses.php?msg=created');
            exit;
        } catch (PDOException $e) {
            $error = 'کد لایسنس تکراری است یا خطایی رخ داد.';
        }
    }
}

// تمدید تاریخ لایسنس
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['extend_license'])) {
    $licId = intval($_POST['license_id'] ?? 0);
    $addDays = intval($_POST['add_days'] ?? 30);
    if ($licId > 0) {
        $l = $db->prepare("SELECT expires_at FROM licenses WHERE id = ?");
        $l->execute([$licId]);
        $curr = $l->fetch();
        if ($curr) {
            $baseTime = (!empty($curr['expires_at']) && strtotime($curr['expires_at']) > time()) ? strtotime($curr['expires_at']) : time();
            $newExpiry = date('Y-m-d H:i:s', strtotime("+{$addDays} days", $baseTime));
            $db->prepare("UPDATE licenses SET expires_at = ? WHERE id = ?")->execute([$newExpiry, $licId]);
            header('Location: licenses.php?msg=extended');
            exit;
        }
    }
}

// فیلتر و جستجو
$search = trim($_GET['search'] ?? '');
$statusFilter = $_GET['status'] ?? 'all';

$query = "SELECT l.*, p.name as plan_name FROM licenses l LEFT JOIN plans p ON l.plan_id = p.id WHERE 1=1";
$params = [];

if (!empty($search)) {
    $query .= " AND (l.license_key LIKE ? OR l.buyer_name LIKE ? OR l.buyer_phone LIKE ?)";
    $params[] = "%{$search}%";
    $params[] = "%{$search}%";
    $params[] = "%{$search}%";
}

if ($statusFilter !== 'all') {
    $query .= " AND l.status = ?";
    $params[] = $statusFilter;
}

$query .= " ORDER BY l.id DESC";
$stmt = $db->prepare($query);
$stmt->execute($params);
$licenses = $stmt->fetchAll();
?>
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>مدیریت لایسنس‌ها - پنل مدیریت</title>
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
                <span class="font-bold text-base text-white">پنل مدیریت لایسنس ووکامرس</span>
            </div>

            <div class="flex items-center gap-2 sm:gap-4 text-sm">
                <a href="index.php" class="px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center gap-2">
                    <i data-lucide="layout-dashboard" class="w-4 h-4"></i>
                    <span class="hidden sm:inline">داشبورد</span>
                </a>
                <a href="licenses.php" class="px-3 py-2 rounded-xl bg-blue-600/20 text-blue-400 font-semibold flex items-center gap-2">
                    <i data-lucide="key-round" class="w-4 h-4"></i>
                    <span class="hidden sm:inline">لایسنس‌ها</span>
                </a>
                <a href="plans.php" class="px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center gap-2">
                    <i data-lucide="tag" class="w-4 h-4"></i>
                    <span class="hidden sm:inline">پلن‌ها</span>
                </a>
                <a href="transactions.php" class="px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center gap-2">
                    <i data-lucide="credit-card" class="w-4 h-4"></i>
                    <span class="hidden sm:inline">تراکنش‌ها</span>
                </a>
                <a href="logout.php" class="px-3 py-2 rounded-xl text-red-400 hover:bg-red-500/10 transition flex items-center gap-2">
                    <i data-lucide="log-out" class="w-4 h-4"></i>
                    <span class="hidden sm:inline">خروج</span>
                </a>
            </div>
        </div>
    </nav>

    <!-- Main -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
                <h1 class="text-2xl font-extrabold text-white">مدیریت لایسنس‌ها</h1>
                <p class="text-xs text-slate-400 mt-1">مشاهده، جستجو، صدور دستی و کنترل لایسنس کاربران</p>
            </div>
            <button onclick="document.getElementById('createModal').classList.remove('hidden')" class="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition shadow-lg shadow-blue-600/20">
                <i data-lucide="plus" class="w-4 h-4"></i>
                <span>صدور لایسنس دستی جدید</span>
            </button>
        </div>

        <?php if (!empty($error)): ?>
            <div class="mb-4 p-4 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-semibold">
                <?= htmlspecialchars($error) ?>
            </div>
        <?php endif; ?>

        <!-- Search & Filter Bar -->
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6">
            <form method="GET" class="flex flex-col sm:flex-row gap-3">
                <div class="flex-1 relative">
                    <input type="text" name="search" value="<?= htmlspecialchars($search) ?>" placeholder="جستجو بر اساس کد لایسنس، نام خریدار، یا شماره موبایل..." class="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500">
                </div>
                <select name="status" class="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500">
                    <option value="all" <?= $statusFilter === 'all' ? 'selected' : '' ?>>همه وضعیت‌ها</option>
                    <option value="active" <?= $statusFilter === 'active' ? 'selected' : '' ?>>فقط فعال‌ها</option>
                    <option value="blocked" <?= $statusFilter === 'blocked' ? 'selected' : '' ?>>مسدود شده‌ها</option>
                </select>
                <button type="submit" class="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition">
                    <i data-lucide="search" class="w-4 h-4"></i>
                    <span>فیلتر</span>
                </button>
            </form>
        </div>

        <!-- Licenses Table -->
        <div class="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div class="overflow-x-auto">
                <table class="w-full text-right text-xs">
                    <thead class="bg-slate-800/80 text-slate-400 uppercase text-[11px] border-b border-slate-700">
                        <tr>
                            <th class="p-4">کد لایسنس</th>
                            <th class="p-4">مشخصات خریدار</th>
                            <th class="p-4">پلن / اعتبار</th>
                            <th class="p-4">دستگاه‌ها</th>
                            <th class="p-4">وضعیت</th>
                            <th class="p-4 text-center">عملیات</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-800">
                        <?php if (empty($licenses)): ?>
                            <tr>
                                <td colspan="6" class="p-8 text-center text-slate-500">لایسنسی با این مشخصات یافت نشد.</td>
                            </tr>
                        <?php else: ?>
                            <?php foreach ($licenses as $lic): 
                                $devices = json_decode($lic['registered_devices'] ?? '[]', true) ?: [];
                                $isExpired = !empty($lic['expires_at']) && strtotime($lic['expires_at']) < time();
                            ?>
                            <tr class="hover:bg-slate-800/40 transition">
                                <td class="p-4 font-mono font-bold text-blue-400 select-all"><?= $lic['license_key'] ?></td>
                                <td class="p-4">
                                    <div class="font-bold text-white text-xs"><?= htmlspecialchars($lic['buyer_name']) ?></div>
                                    <div class="text-[11px] text-slate-400"><?= htmlspecialchars($lic['buyer_phone']) ?></div>
                                </td>
                                <td class="p-4">
                                    <span class="font-medium text-slate-300"><?= htmlspecialchars($lic['plan_name'] ?? 'دستی') ?></span>
                                    <div class="text-[11px] <?= $isExpired ? 'text-red-400 font-bold' : 'text-slate-400' ?> mt-0.5">
                                        <?= $lic['expires_at'] ? date('Y/m/d H:i', strtotime($lic['expires_at'])) : 'دائمی (بدون انقضا)' ?>
                                        <?= $isExpired ? '(منقضی شده)' : '' ?>
                                    </div>
                                </td>
                                <td class="p-4">
                                    <span class="inline-flex items-center gap-1 font-semibold text-slate-300">
                                        <i data-lucide="smartphone" class="w-3.5 h-3.5 text-cyan-400"></i>
                                        <?= count($devices) ?> / <?= $lic['max_devices'] ?>
                                    </span>
                                </td>
                                <td class="p-4">
                                    <span class="px-2.5 py-1 rounded-full text-[10px] font-bold <?= $lic['status'] === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400' ?>">
                                        <?= $lic['status'] === 'active' ? 'فعال' : 'مسدود' ?>
                                    </span>
                                </td>
                                <td class="p-4 text-center">
                                    <div class="flex items-center justify-center gap-2">
                                        <!-- Reset devices -->
                                        <a href="licenses.php?action=reset_devices&id=<?= $lic['id'] ?>" onclick="return confirm('آیا شناسه دستگاه‌های ثبت‌شده ریست شوند تا کاربر بتواند روی گوشی جدید وارد شود؟')" class="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400" title="ریست دستگاه‌های متصل">
                                            <i data-lucide="rotate-ccw" class="w-4 h-4"></i>
                                        </a>

                                        <!-- Toggle Status -->
                                        <a href="licenses.php?action=toggle_status&id=<?= $lic['id'] ?>" class="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 <?= $lic['status'] === 'active' ? 'text-amber-400' : 'text-emerald-400' ?>" title="<?= $lic['status'] === 'active' ? 'مسدودسازی لایسنس' : 'فعال‌سازی لایسنس' ?>">
                                            <i data-lucide="<?= $lic['status'] === 'active' ? 'ban' : 'check' ?>" class="w-4 h-4"></i>
                                        </a>

                                        <!-- Extend modal opener -->
                                        <button onclick="openExtendModal(<?= $lic['id'] ?>, '<?= $lic['license_key'] ?>')" class="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400" title="تمدید اعتبار">
                                            <i data-lucide="calendar-plus" class="w-4 h-4"></i>
                                        </button>

                                        <!-- Delete -->
                                        <a href="licenses.php?action=delete&id=<?= $lic['id'] ?>" onclick="return confirm('آیا از حذف کامل این لایسنس مطمئن هستید؟')" class="p-2 rounded-lg bg-slate-800 hover:bg-red-500/20 text-red-400" title="حذف لایسنس">
                                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                                        </a>
                                    </div>
                                </td>
                            </tr>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </main>

    <!-- Create License Modal -->
    <div id="createModal" class="fixed inset-0 z-50 hidden bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
        <div class="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-right">
            <button onclick="document.getElementById('createModal').classList.add('hidden')" class="absolute top-5 left-5 text-slate-400 hover:text-white">
                <i data-lucide="x" class="w-6 h-6"></i>
            </button>
            <h3 class="text-lg font-bold text-white mb-4">صدور لایسنس دستی جدید</h3>
            <form method="POST" class="space-y-3 text-xs">
                <input type="hidden" name="create_license" value="1">
                <div>
                    <label class="block font-semibold text-slate-300 mb-1">نام خریدار *</label>
                    <input type="text" name="buyer_name" required class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white">
                </div>
                <div>
                    <label class="block font-semibold text-slate-300 mb-1">شماره تماس *</label>
                    <input type="text" name="buyer_phone" required dir="ltr" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-right">
                </div>
                <div>
                    <label class="block font-semibold text-slate-300 mb-1">کد لایسنس دلخواه (خالی بگذارید تا رندوم ساخته شود)</label>
                    <input type="text" name="custom_key" placeholder="مثلاً WCAPP-TEST-0001" dir="ltr" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-center font-mono">
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block font-semibold text-slate-300 mb-1">مدت اعتبار (روز)</label>
                        <input type="number" name="duration_days" value="30" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white">
                        <span class="text-[10px] text-slate-500">عدد 0 یعنی دائمی</span>
                    </div>
                    <div>
                        <label class="block font-semibold text-slate-300 mb-1">تعداد دستگاه مجاز</label>
                        <input type="number" name="max_devices" value="1" min="1" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white">
                    </div>
                </div>
                <button type="submit" class="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-white transition mt-4">ثبت و ایجاد لایسنس</button>
            </form>
        </div>
    </div>

    <!-- Extend Expiry Modal -->
    <div id="extendModal" class="fixed inset-0 z-50 hidden bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
        <div class="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative text-right">
            <button onclick="document.getElementById('extendModal').classList.add('hidden')" class="absolute top-5 left-5 text-slate-400 hover:text-white">
                <i data-lucide="x" class="w-6 h-6"></i>
            </button>
            <h3 class="text-base font-bold text-white mb-1">تمدید اعتبار لایسنس</h3>
            <p id="extendKeyText" class="text-xs font-mono text-blue-400 mb-4"></p>
            <form method="POST" class="space-y-3 text-xs">
                <input type="hidden" name="extend_license" value="1">
                <input type="hidden" name="license_id" id="extendLicId">
                <div>
                    <label class="block font-semibold text-slate-300 mb-1">تعداد روز تمدید</label>
                    <select name="add_days" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white">
                        <option value="30">۳۰ روز (۱ ماه)</option>
                        <option value="90">۹۰ روز (۳ ماه)</option>
                        <option value="180">۱۸۰ روز (۶ ماه)</option>
                        <option value="365">۳۶۵ روز (۱ سال)</option>
                    </select>
                </div>
                <button type="submit" class="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white transition mt-2">افزایش اعتبار لایسنس</button>
            </form>
        </div>
    </div>

    <script>
        lucide.createIcons();
        function openExtendModal(id, key) {
            document.getElementById('extendLicId').value = id;
            document.getElementById('extendKeyText').innerText = key;
            document.getElementById('extendModal').classList.remove('hidden');
        }
    </script>
</body>
</html>
