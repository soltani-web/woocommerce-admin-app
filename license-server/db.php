<?php
require_once __DIR__ . '/config.php';

function getDB(): PDO {
    static $db = null;
    if ($db !== null) {
        return $db;
    }

    try {
        // تلاش برای اتصال به MySQL
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $db = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
    } catch (PDOException $e) {
        // اگر دیتابیس MySQL هنوز ساخته نشده بود یا مشخصات وارد نشده بود، به SQLite سوییچ کن تا بدون خطا کار کند
        $sqlitePath = __DIR__ . '/database.sqlite';
        $db = new PDO("sqlite:" . $sqlitePath, null, null, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
    }

    initTables($db);
    return $db;
}

function initTables(PDO $db) {
    // ایجاد جدول پلن‌ها
    $db->exec("CREATE TABLE IF NOT EXISTS plans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(100) NOT NULL,
        price INTEGER NOT NULL,
        duration_days INTEGER NOT NULL,
        max_devices INTEGER DEFAULT 1,
        features TEXT,
        is_popular INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    // ایجاد جدول لایسنس‌ها
    $db->exec("CREATE TABLE IF NOT EXISTS licenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        license_key VARCHAR(50) UNIQUE NOT NULL,
        buyer_name VARCHAR(100) NOT NULL,
        buyer_phone VARCHAR(20) NOT NULL,
        buyer_email VARCHAR(100),
        plan_id INTEGER,
        max_devices INTEGER DEFAULT 1,
        registered_devices TEXT,
        status VARCHAR(20) DEFAULT 'active',
        expires_at DATETIME NULL,
        activated_at DATETIME NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    // ایجاد جدول تراکنش‌ها
    $db->exec("CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        track_id VARCHAR(50),
        ref_number VARCHAR(50),
        card_number VARCHAR(30),
        plan_id INTEGER NOT NULL,
        amount INTEGER NOT NULL,
        buyer_name VARCHAR(100) NOT NULL,
        buyer_phone VARCHAR(20) NOT NULL,
        buyer_email VARCHAR(100),
        license_id INTEGER,
        status VARCHAR(20) DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    // ایجاد جدول تنظیمات سیستم
    $db->exec("CREATE TABLE IF NOT EXISTS settings (
        setting_key VARCHAR(50) PRIMARY KEY,
        setting_value TEXT
    )");

    // درج پلن‌های پیش‌فرض در صورت خالی بودن
    $stmt = $db->query("SELECT COUNT(*) as cnt FROM plans");
    if ($stmt->fetch()['cnt'] == 0) {
        $insertPlan = $db->prepare("INSERT INTO plans (name, price, duration_days, max_devices, features, is_popular, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)");
        
        $insertPlan->execute([
            'اشتراک ۱ ماهه (پایه)',
            199000,
            30,
            1,
            json_encode(['مدیریت ۱ فروشگاه', 'امکان ویرایش سریع محصولات و قیمت', 'مدیریت سفارشات و صدور فاکتور', 'پشتیبانی تیکتی', '۱ دستگاه فعال'], JSON_UNESCAPED_UNICODE),
            0,
            1
        ]);

        $insertPlan->execute([
            'اشتراک ۳ ماهه (حرفه‌ای)',
            490000,
            90,
            2,
            json_encode(['پشتیبانی از چندفروشگاهی نامحدود', 'ویرایش سریع و مدیریت انبار و متغیرها', 'فیلتر پیشرفته و تماس فوری با مشتری', 'پشتیبانی اولویت‌دار', '۲ دستگاه همزمان'], JSON_UNESCAPED_UNICODE),
            1,
            1
        ]);

        $insertPlan->execute([
            'اشتراک ۶ ماهه (طلایی)',
            890000,
            180,
            3,
            json_encode(['تمام امکانات پلن حرفه‌ای', 'آپدیت‌های رایگان دوره', '۳ دستگاه همزمان', 'پشتیبانی VIP تلفنی و تلگرامی'], JSON_UNESCAPED_UNICODE),
            0,
            1
        ]);

        $insertPlan->execute([
            'لایسنس دائمی (مادام‌العمر VIP)',
            1890000,
            0, // 0 یعنی بدون انقضا
            5,
            json_encode(['دسترسی مادام‌العمر بدون نیاز به تمدید', 'پشتیبانی از ۵ دستگاه همزمان', 'آپدیت‌های دائمی تمام نسخه‌ها', 'پشتیبانی اختصاصی ۲۴ ساعته'], JSON_UNESCAPED_UNICODE),
            0,
            1
        ]);
    }
}

// تابع کمکی برای تولید کد لایسنس رندوم با فرمت WCAPP-XXXX-XXXX-XXXX
function generateLicenseKey(): string {
    $chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    $segments = [];
    for ($i = 0; $i < 3; $i++) {
        $segment = '';
        for ($j = 0; $j < 4; $j++) {
            $segment .= $chars[random_int(0, strlen($chars) - 1)];
        }
        $segments[] = $segment;
    }
    return 'WCAPP-' . implode('-', $segments);
}
