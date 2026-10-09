<?php
// تنظیمات دیتابیس و سیستم
define('DB_HOST', 'localhost');
define('DB_NAME', 'license_db');
define('DB_USER', 'root');
define('DB_PASS', '');

// تنظیمات درگاه زیبال
// برای تست تستی از 'zibal' استفاده کنید. برای محیط واقعی مرچنت کد زیبال خود را وارد کنید
define('ZIBAL_MERCHANT', 'zibal'); 
define('ZIBAL_CALLBACK_URL', 'http://' . ($_SERVER['HTTP_HOST'] ?? 'localhost') . '/license-server/callback.php');

// اطلاعات عمومی
define('SITE_NAME', 'سامانه مدیریت لایسنس اپلیکیشن ووکامرس');
define('ADMIN_PASSWORD', 'admin123456'); // رمز پیش‌فرض ورود به پنل مدیریت (حتما تغییر دهید)
define('APP_DOWNLOAD_URL', 'https://example.com/downloads/woocommerce-admin.apk');

// کلید امنیتی جهت ارتباط امن اپلیکیشن با سرور
define('API_SECRET_KEY', 'WC_APP_SECURE_TOKEN_2026');

// شروع نشست برای پنل مدیریت
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
