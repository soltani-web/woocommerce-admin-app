<?php
require_once __DIR__ . '/config.php';

function getDB(): PDO {
    static $db = null;
    if ($db !== null) {
        return $db;
    }

    $errors = [];

    // ۱. اگر اطلاعات MySQL در config.php تنظیم شده بود، ابتدا به MySQL وصل شو
    if (defined('DB_NAME') && DB_NAME !== '' && DB_NAME !== 'license_db' && DB_USER !== 'root') {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
            $db = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]);
            initMySQLTables($db);
            return $db;
        } catch (Throwable $e) {
            $errors[] = "MySQL Error: " . $e->getMessage();
        }
    }

    // ۲. استفاده از دیتابیس مستقل و فوق‌سریع SQLite (بدون نیاز به تنظیم یوزر و پسورد)
    $possiblePaths = [
        __DIR__ . '/license_database.sqlite',
        __DIR__ . '/../license_database.sqlite',
        sys_get_temp_dir() . '/wp_negar_license.sqlite',
    ];

    foreach ($possiblePaths as $path) {
        try {
            $dir = dirname($path);
            if (!is_dir($dir)) {
                @mkdir($dir, 0777, true);
            }
            @chmod($dir, 0777);

            $db = new PDO("sqlite:" . $path, null, null, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]);
            initSQLiteTables($db);
            return $db;
        } catch (Throwable $e) {
            $errors[] = "SQLite ($path) Error: " . $e->getMessage();
        }
    }

    throw new Exception("خطا در اتصال به پایگاه داده: " . implode(" | ", $errors));
}

function initSQLiteTables(PDO $db) {
    // ایجاد جدول پلن‌ها
    $db->exec("CREATE TABLE IF NOT EXISTS plans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
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
        license_key TEXT UNIQUE NOT NULL,
        buyer_name TEXT NOT NULL,
        buyer_phone TEXT NOT NULL,
        buyer_email TEXT,
        plan_id INTEGER,
        max_devices INTEGER DEFAULT 1,
        registered_devices TEXT,
        status TEXT DEFAULT 'active',
        expires_at DATETIME NULL,
        activated_at DATETIME NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    // ایجاد جدول تراکنش‌ها
    $db->exec("CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        track_id TEXT,
        ref_number TEXT,
        card_number TEXT,
        plan_id INTEGER NOT NULL,
        amount INTEGER NOT NULL,
        buyer_name TEXT NOT NULL,
        buyer_phone TEXT NOT NULL,
        buyer_email TEXT,
        license_id INTEGER,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    // ایجاد جدول تنظیمات
    $db->exec("CREATE TABLE IF NOT EXISTS settings (
        setting_key TEXT PRIMARY KEY,
        setting_value TEXT
    )");

    seedDefaultPlans($db);
}

function initMySQLTables(PDO $db) {
    $db->exec("CREATE TABLE IF NOT EXISTS plans (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        price INT NOT NULL,
        duration_days INT NOT NULL,
        max_devices INT DEFAULT 1,
        features TEXT,
        is_popular TINYINT DEFAULT 0,
        is_active TINYINT DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $db->exec("CREATE TABLE IF NOT EXISTS licenses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        license_key VARCHAR(50) UNIQUE NOT NULL,
        buyer_name VARCHAR(100) NOT NULL,
        buyer_phone VARCHAR(20) NOT NULL,
        buyer_email VARCHAR(100),
        plan_id INT,
        max_devices INT DEFAULT 1,
        registered_devices TEXT,
        status VARCHAR(20) DEFAULT 'active',
        expires_at DATETIME NULL,
        activated_at DATETIME NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $db->exec("CREATE TABLE IF NOT EXISTS transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        track_id VARCHAR(50),
        ref_number VARCHAR(50),
        card_number VARCHAR(30),
        plan_id INT NOT NULL,
        amount INT NOT NULL,
        buyer_name VARCHAR(100) NOT NULL,
        buyer_phone VARCHAR(20) NOT NULL,
        buyer_email VARCHAR(100),
        license_id INT,
        status VARCHAR(20) DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $db->exec("CREATE TABLE IF NOT EXISTS settings (
        setting_key VARCHAR(50) PRIMARY KEY,
        setting_value TEXT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    seedDefaultPlans($db);
}

function seedDefaultPlans(PDO $db) {
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
            0,
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
