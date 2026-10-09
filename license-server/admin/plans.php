<?php
require_once __DIR__ . '/auth.php';
checkAdminAuth();
require_once __DIR__ . '/../db.php';

$db = getDB();

$action = $_GET['action'] ?? '';
$id = intval($_GET['id'] ?? 0);

// حذف پلن
if ($action === 'delete' && $id > 0) {
    $db->prepare("DELETE FROM plans WHERE id = ?")->execute([$id]);
    header('Location: plans.php');
    exit;
}

// فعال/غیرفعال کردن
if ($action === 'toggle' && $id > 0) {
    $curr = $db->prepare("SELECT is_active FROM plans WHERE id = ?");
    $curr->execute([$id]);
    $row = $curr->fetch();
    if ($row) {
        $newActive = $row['is_active'] == 1 ? 0 : 1;
        $db->prepare("UPDATE plans SET is_active = ? WHERE id = ?")->execute([$newActive, $id]);
    }
    header('Location: plans.php');
    exit;
}

// ایجاد پلن جدید
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['save_plan'])) {
    $name = trim($_POST['name'] ?? '');
    $price = intval($_POST['price'] ?? 0);
    $duration = intval($_POST['duration_days'] ?? 30);
    $maxDevices = intval($_POST['max_devices'] ?? 1);
    $isPopular = isset($_POST['is_popular']) ? 1 : 0;
    
    // فیچرها خط به خط
    $rawFeatures = explode("\n", str_replace("\r", "", $_POST['features'] ?? ''));
    $features = array_values(array_filter(array_map('trim', $rawFeatures)));

    if (!empty($name) && $price >= 0) {
        $stmt = $db->prepare("INSERT INTO plans (name, price, duration_days, max_devices, features, is_popular, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)");
        $stmt->execute([$name, $price, $duration, $maxDevices, json_encode($features, JSON_UNESCAPED_UNICODE), $isPopular]);
        header('Location: plans.php');
        exit;
    }
}

$plans = $db->query("SELECT * FROM plans ORDER BY price ASC")->fetchAll();
?>
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>مدیریت پلن‌ها و تعرفه‌ها</title>
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
                <a href="licenses.php" class="px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center gap-2">
                    <i data-lucide="key-round" class="w-4 h-4"></i>
                    <span class="hidden sm:inline">لایسنس‌ها</span>
                </a>
                <a href="plans.php" class="px-3 py-2 rounded-xl bg-blue-600/20 text-blue-400 font-semibold flex items-center gap-2">
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
                <h1 class="text-2xl font-extrabold text-white">تعرفه‌ها و پلن‌های فروش</h1>
                <p class="text-xs text-slate-400 mt-1">تنظیم قیمت‌ها، مدت زمان و ویژگی‌های هر پلن جهت نمایش در سایت</p>
            </div>
            <button onclick="document.getElementById('planModal').classList.remove('hidden')" class="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition shadow-lg shadow-blue-600/20">
                <i data-lucide="plus" class="w-4 h-4"></i>
                <span>افزودن پلن جدید</span>
            </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <?php foreach ($plans as $p): 
                $feats = json_decode($p['features'] ?? '[]', true) ?: [];
            ?>
            <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative flex flex-col justify-between">
                <div>
                    <div class="flex justify-between items-start">
                        <h3 class="font-bold text-lg text-white"><?= htmlspecialchars($p['name']) ?></h3>
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold <?= $p['is_active'] == 1 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400' ?>">
                            <?= $p['is_active'] == 1 ? 'فعال' : 'غیرفعال' ?>
                        </span>
                    </div>

                    <div class="my-4">
                        <span class="text-2xl font-black text-white"><?= number_format($p['price']) ?></span>
                        <span class="text-xs text-slate-400 mr-1">تومان</span>
                    </div>

                    <div class="text-xs text-slate-400 space-y-1.5 border-t border-slate-800 pt-3">
                        <p>مدت زمان: <strong class="text-slate-200"><?= $p['duration_days'] > 0 ? "{$p['duration_days']} روز" : 'دائمی' ?></strong></p>
                        <p>تعداد دستگاه: <strong class="text-slate-200"><?= $p['max_devices'] ?> گوشی</strong></p>
                    </div>

                    <div class="mt-4 space-y-1 text-xs text-slate-300">
                        <?php foreach ($feats as $f): ?>
                            <div class="flex items-center gap-1.5">
                                <i data-lucide="check" class="w-3.5 h-3.5 text-emerald-400"></i>
                                <span><?= htmlspecialchars($f) ?></span>
                            </div>
                        <?php endforeach; ?>
                    </div>
                </div>

                <div class="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center text-xs">
                    <a href="plans.php?action=toggle&id=<?= $p['id'] ?>" class="text-amber-400 hover:underline">
                        <?= $p['is_active'] == 1 ? 'غیرفعال‌سازی' : 'فعال‌سازی' ?>
                    </a>
                    <a href="plans.php?action=delete&id=<?= $p['id'] ?>" onclick="return confirm('آیا این پلن حذف شود؟')" class="text-red-400 hover:underline">
                        حذف
                    </a>
                </div>
            </div>
            <?php endforeach; ?>
        </div>
    </main>

    <!-- Plan Modal -->
    <div id="planModal" class="fixed inset-0 z-50 hidden bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
        <div class="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-right">
            <button onclick="document.getElementById('planModal').classList.add('hidden')" class="absolute top-5 left-5 text-slate-400 hover:text-white">
                <i data-lucide="x" class="w-6 h-6"></i>
            </button>
            <h3 class="text-lg font-bold text-white mb-4">تعریف پلن اشتراک جدید</h3>
            <form method="POST" class="space-y-3 text-xs">
                <input type="hidden" name="save_plan" value="1">
                <div>
                    <label class="block font-semibold text-slate-300 mb-1">عنوان پلن *</label>
                    <input type="text" name="name" required placeholder="مثلاً: اشتراک ۱ ساله طلایی" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white">
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block font-semibold text-slate-300 mb-1">قیمت (تومان) *</label>
                        <input type="number" name="price" required placeholder="مثلاً: 500000" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white">
                    </div>
                    <div>
                        <label class="block font-semibold text-slate-300 mb-1">مدت اعتبار (روز)</label>
                        <input type="number" name="duration_days" value="30" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white">
                    </div>
                </div>
                <div>
                    <label class="block font-semibold text-slate-300 mb-1">تعداد دستگاه مجاز</label>
                    <input type="number" name="max_devices" value="1" min="1" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white">
                </div>
                <div>
                    <label class="block font-semibold text-slate-300 mb-1">ویژگی‌ها و امکانات (هر خط یک مورد)</label>
                    <textarea name="features" rows="4" placeholder="پشتیبانی تیکتی&#10;چندفروشگاهی&#10;آپدیت رایگان" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"></textarea>
                </div>
                <div class="flex items-center gap-2 pt-2">
                    <input type="checkbox" name="is_popular" id="is_popular" class="rounded bg-slate-800 border-slate-700 text-blue-600">
                    <label for="is_popular" class="text-slate-300">نمایش به عنوان پیشنهاد ویژه (محبوب‌ترین)</label>
                </div>
                <button type="submit" class="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-white transition mt-4">ذخیره پلن</button>
            </form>
        </div>
    </div>

    <script>lucide.createIcons();</script>
</body>
</html>
