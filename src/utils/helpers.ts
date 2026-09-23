// تبدیل ارقام انگلیسی به فارسی
export function toPersianDigits(n: number | string | undefined | null): string {
  if (n === undefined || n === null) return '';
  const str = n.toString();
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.replace(/[0-9]/g, (w) => persianDigits[+w]);
}

// فرمت‌بندی ۳ رقم ۳ رقم قیمت
export function formatPrice(price: string | number | undefined | null, currency: string = 'تومان'): string {
  if (price === undefined || price === null || price === '') return '۰ ' + currency;
  const num = Math.round(Number(price));
  if (isNaN(num)) return price.toString() + ' ' + currency;
  const formatted = num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return toPersianDigits(formatted) + ' ' + currency;
}

// ترجمه وضعیت‌های سفارش به فارسی
export function getOrderStatusTitle(status: string): { title: string; color: string; bg: string } {
  switch (status.toLowerCase()) {
    case 'processing':
      return { title: 'در حال انجام', color: '#16a34a', bg: '#dcfce7' };
    case 'completed':
      return { title: 'تکمیل شده', color: '#2563eb', bg: '#dbeafe' };
    case 'pending':
      return { title: 'در انتظار پرداخت', color: '#d97706', bg: '#fef3c7' };
    case 'on-hold':
      return { title: 'در انتظار بررسی', color: '#9333ea', bg: '#f3e8ff' };
    case 'cancelled':
      return { title: 'لغو شده', color: '#dc2626', bg: '#fee2e2' };
    case 'refunded':
      return { title: 'مسترد شده', color: '#64748b', bg: '#f1f5f9' };
    case 'failed':
      return { title: 'ناموفق', color: '#b91c1c', bg: '#fee2e2' };
    default:
      return { title: status, color: '#475569', bg: '#f1f5f9' };
  }
}

// فرمت ساده تاریخ شمسی و ساعت
export function formatPersianDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const time = date.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    const formattedDate = new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
    return toPersianDigits(formattedDate) + ' - ' + toPersianDigits(time);
  } catch (e) {
    return dateString;
  }
}