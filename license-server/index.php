<?php
require_once __DIR__ . '/db.php';

$plans = [];
$dbError = '';

try {
    $db = getDB();
    $plansStmt = $db->query("SELECT * FROM plans WHERE is_active = 1 ORDER BY price ASC");
    $plans = $plansStmt->fetchAll();
} catch (Throwable $e) {
    $dbError = $e->getMessage();
}
?>
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlspecialchars(SITE_NAME) ?> - دریافت آنی لایسنس و اپلیکیشن</title>
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Vazirmatn Font -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/misc/Farsi-Digits/Vazirmatn-FD-font-face.css">
    <!-- Lucide Icons -->
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>
        body {
            font-family: 'Vazirmatn FD', system-ui, -apple-system, sans-serif;
        }
        .glow-card {
            background: rgba(30, 41, 59, 0.7);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .glow-btn {
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            box-shadow: 0 4px 20px rgba(59, 130, 246, 0.35);
        }
        .glow-btn:hover {
            box-shadow: 0 6px 25px rgba(59, 130, 246, 0.55);
        }
    </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen selection:bg-blue-600 selection:text-white">

    <!-- Background Gradients -->
    <div class="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div class="absolute -top-40 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"></div>
        <div class="absolute top-1/3 -left-20 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl"></div>
        <div class="absolute bottom-10 right-10 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl"></div>
    </div>

    <!-- Navigation Header -->
    <header class="border-b border-slate-800/80 backdrop-blur-md sticky top-0 z-40 bg-slate-950/75">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <i data-lucide="store" class="w-6 h-6 text-white"></i>
                </div>
                <div>
                    <h1 class="font-bold text-lg text-white">WooCommerce Admin App</h1>
                    <p class="text-xs text-slate-400">اپلیکیشن موبایل مدیریت هوشمند ووکامرس</p>
                </div>
            </div>

            <div class="flex items-center gap-4">
                <a href="#plans" class="hidden sm:inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white transition">
                    <span>تعرفه‌ها و خرید</span>
                    <i data-lucide="chevron-down" class="w-4 h-4"></i>
                </a>
                <a href="admin/login.php" class="px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-sm font-medium border border-slate-700/80 text-slate-300 hover:text-white transition flex items-center gap-2">
                    <i data-lucide="shield" class="w-4 h-4 text-blue-400"></i>
                    <span>ورود مدیر</span>
                </a>
            </div>
        </div>
    </header>

    <?php if (!empty($dbError)): ?>
        <div class="max-w-4xl mx-auto mt-4 p-4 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs text-center">
            ⚠️ وضعیت پایگاه داده: <?= htmlspecialchars($dbError) ?>
        </div>
    <?php endif; ?>

    <!-- Hero Section -->
    <section class="relative pt-16 pb-20 px-4 max-w-7xl mx-auto text-center">
        <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-950/60 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-6">
            <i data-lucide="sparkles" class="w-4 h-4"></i>
            <span>نسخه جدید ۲.۰ | تحویل آنی لایسنس و فایل APK پس از پرداخت</span>
        </div>

        <h2 class="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight max-w-4xl mx-auto">
            فروشگاه ووکامرس خود را <br class="hidden sm:inline" />
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400">از روی گوشی هوشمند</span> مثل آب خوردن مدیریت کنید
        </h2>

        <p class="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            مدیریت همزمان چند فروشگاه، ویرایش سریع قیمت و موجودی انبار، تغییر وضعیت سفارشات، صدور فاکتور و تماس فوری با مشتری بدون نیاز به باز کردن وردپرس!
        </p>

        <!-- Feature Badges -->
        <div class="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div class="p-4 rounded-2xl glow-card text-center">
                <i data-lucide="layers" class="w-6 h-6 text-blue-400 mx-auto mb-2"></i>
                <h4 class="font-bold text-sm text-white">چندفروشگاهی</h4>
                <p class="text-xs text-slate-400 mt-1">سوییچ آنی بین سایت‌ها</p>
            </div>
            <div class="p-4 rounded-2xl glow-card text-center">
                <i data-lucide="zap" class="w-6 h-6 text-amber-400 mx-auto mb-2"></i>
                <h4 class="font-bold text-sm text-white">ویرایش سریع انبار</h4>
                <p class="text-xs text-slate-400 mt-1">تغییر قیمت و موجودی</p>
            </div>
            <div class="p-4 rounded-2xl glow-card text-center">
                <i data-lucide="phone-call" class="w-6 h-6 text-emerald-400 mx-auto mb-2"></i>
                <h4 class="font-bold text-sm text-white">تماس تک‌کلیکی</h4>
                <p class="text-xs text-slate-400 mt-1">ارتباط مستقیم با خریدار</p>
            </div>
            <div class="p-4 rounded-2xl glow-card text-center">
                <i data-lucide="shield-check" class="w-6 h-6 text-purple-400 mx-auto mb-2"></i>
                <h4 class="font-bold text-sm text-white">امنیت صددرصدی</h4>
                <p class="text-xs text-slate-400 mt-1">اتصال مستقیم REST API</p>
            </div>
        </div>
    </section>

    <!-- Pricing Plans Section -->
    <section id="plans" class="py-16 px-4 max-w-7xl mx-auto">
        <div class="text-center mb-14">
            <h3 class="text-2xl sm:text-4xl font-bold text-white">پلن مورد نظر خود را انتخاب کنید</h3>
            <p class="text-slate-400 mt-3 text-sm sm:text-base">تحویل آنی لایسنس و لینک دانلود فایل APK بلافاصله پس از پرداخت زیبال</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <?php foreach ($plans as $plan): 
                $features = json_decode($plan['features'] ?? '[]', true) ?: [];
                $isPopular = $plan['is_popular'] == 1;
            ?>
            <div class="relative rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 <?= $isPopular ? 'bg-gradient-to-b from-blue-950/80 to-slate-900 border-2 border-blue-500/80 shadow-xl shadow-blue-500/10' : 'glow-card' ?>">
                <?php if ($isPopular): ?>
                    <div class="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-blue-600 text-white text-xs font-bold shadow-md shadow-blue-600/30">
                        پیشنهاد ویژه (محبوب‌ترین)
                    </div>
                <?php endif; ?>

                <div>
                    <h4 class="text-xl font-bold text-white mt-2"><?= htmlspecialchars($plan['name']) ?></h4>
                    <p class="text-xs text-slate-400 mt-1">
                        <?= $plan['duration_days'] > 0 ? "اعتبار: {$plan['duration_days']} روز" : 'دسترسی دائمی بدون انقضا' ?>
                    </p>

                    <div class="my-6">
                        <span class="text-3xl font-extrabold text-white"><?= number_format($plan['price']) ?></span>
                        <span class="text-xs text-slate-400 mr-1">تومان</span>
                    </div>

                    <div class="space-y-3 border-t border-slate-800 pt-5 text-sm">
                        <div class="flex items-center gap-2 text-slate-300">
                            <i data-lucide="smartphone" class="w-4 h-4 text-cyan-400 shrink-0"></i>
                            <span>تعداد دستگاه: <strong><?= $plan['max_devices'] ?> دستگاه</strong></span>
                        </div>
                        <?php foreach ($features as $f): ?>
                            <div class="flex items-start gap-2 text-slate-300 text-xs sm:text-sm">
                                <i data-lucide="check" class="w-4 h-4 text-emerald-400 shrink-0 mt-0.5"></i>
                                <span><?= htmlspecialchars($f) ?></span>
                            </div>
                        <?php endforeach; ?>
                    </div>
                </div>

                <div class="mt-8">
                    <button onclick="openCheckoutModal(<?= $plan['id'] ?>, '<?= htmlspecialchars($plan['name']) ?>', <?= $plan['price'] ?>)" class="w-full py-3.5 rounded-2xl font-bold text-sm text-white transition <?= $isPopular ? 'glow-btn' : 'bg-slate-800 hover:bg-slate-700 border border-slate-700' ?> flex items-center justify-center gap-2">
                        <span>خرید و فعال‌سازی فوری</span>
                        <i data-lucide="arrow-left" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
            <?php endforeach; ?>
        </div>
    </section>

    <!-- Checkout Modal -->
    <div id="checkoutModal" class="fixed inset-0 z-50 hidden bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
        <div class="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-right animate-in fade-in zoom-in duration-200">
            <button onclick="closeCheckoutModal()" class="absolute top-5 left-5 text-slate-400 hover:text-white">
                <i data-lucide="x" class="w-6 h-6"></i>
            </button>

            <div class="flex items-center gap-3 mb-5">
                <div class="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                    <i data-lucide="shopping-bag" class="w-5 h-5"></i>
                </div>
                <div>
                    <h3 class="text-lg font-bold text-white">تکمیل سفارش و پرداخت</h3>
                    <p id="modalPlanTitle" class="text-xs text-blue-400 font-semibold"></p>
                </div>
            </div>

            <form action="payment.php" method="POST" class="space-y-4">
                <input type="hidden" name="plan_id" id="modalPlanId">

                <div>
                    <label class="block text-xs font-semibold text-slate-300 mb-1.5">نام و نام‌خانوادگی (خریدار)</label>
                    <input type="text" name="buyer_name" required placeholder="مثال: علی رضایی" class="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500">
                </div>

                <div>
                    <label class="block text-xs font-semibold text-slate-300 mb-1.5">شماره موبایل (جهت ثبت لایسنس و پیگیری)</label>
                    <input type="tel" name="buyer_phone" required placeholder="مثال: 09123456789" dir="ltr" class="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white text-right placeholder-slate-500 focus:outline-none focus:border-blue-500">
                </div>

                <div>
                    <label class="block text-xs font-semibold text-slate-300 mb-1.5">ایمیل (اختیاری)</label>
                    <input type="email" name="buyer_email" placeholder="email@example.com" dir="ltr" class="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white text-right placeholder-slate-500 focus:outline-none focus:border-blue-500">
                </div>

                <div class="bg-slate-950/60 rounded-2xl p-4 border border-slate-800 flex justify-between items-center my-4">
                    <span class="text-xs text-slate-400">مبلغ قابل پرداخت:</span>
                    <span id="modalPlanPrice" class="text-base font-extrabold text-emerald-400"></span>
                </div>

                <button type="submit" class="w-full py-4 rounded-2xl font-bold text-sm text-white glow-btn flex items-center justify-center gap-2">
                    <i data-lucide="credit-card" class="w-5 h-5"></i>
                    <span>اتصال به درگاه زیبال و پرداخت امن</span>
                </button>
            </form>
        </div>
    </div>

    <!-- Footer -->
    <footer class="border-t border-slate-900 mt-20 py-8 text-center text-xs text-slate-500">
        <p>© <?= date('Y') ?> <?= htmlspecialchars(SITE_NAME) ?> - تمامی حقوق محفوظ است.</p>
    </footer>

    <script>
        lucide.createIcons();

        function openCheckoutModal(id, name, price) {
            document.getElementById('modalPlanId').value = id;
            document.getElementById('modalPlanTitle').innerText = name;
            document.getElementById('modalPlanPrice').innerText = Number(price).toLocaleString('fa-IR') + ' تومان';
            document.getElementById('checkoutModal').classList.remove('hidden');
        }

        function closeCheckoutModal() {
            document.getElementById('checkoutModal').classList.add('hidden');
        }
    </script>
</body>
</html>
