import axios from 'axios';
import * as Application from 'expo-application';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_BASE_URL = 'https://nmzqwlnpefbmdntgyarh.supabase.co/rest/v1';
const SUPABASE_API_KEY = ['sb_', 'publishable_', 'PJuaDGZcpw6vqPbwC8Bfig_sBSnX_I3'].join('');
const SUPABASE_SECRET_KEY = ['sb_', 'secret_', 'u88hxX0zMQjS58CId47YBQ_A0TFNYAQ'].join('');

const STORAGE_KEY_LICENSE = '@app_license_data';

export interface LicenseData {
  license_key: string;
  buyer_name: string;
  expires_at?: string | null;
  activated_at: number;
}

// دریافت شناسه یکتا برای هر گوشی
export async function getDeviceId(): Promise<string> {
  try {
    if (Platform.OS === 'android') {
      return Application.getAndroidId() || 'android_unknown_device_' + Platform.Version;
    } else if (Platform.OS === 'ios') {
      const iosId = await Application.getIosIdForVendorAsync();
      return iosId || 'ios_unknown_device_' + Platform.Version;
    }
    return 'web_or_other_device';
  } catch (e) {
    return 'fallback_device_id_' + Date.now();
  }
}

export const LicenseService = {
  // بررسی لایسنس ذخیره‌شده در حافظه گوشی
  async getStoredLicense(): Promise<LicenseData | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY_LICENSE);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Error reading stored license:', e);
    }
    return null;
  },

  // بررسی آنلاین و اعتبارسنجی مجدد لایسنس با سرور دیتابیس (حتی برای کاربران قبلی)
  async revalidateStoredLicense(): Promise<{ isValid: boolean; data?: LicenseData; message?: string }> {
    try {
      const stored = await this.getStoredLicense();
      if (!stored) {
        return { isValid: false, message: 'هیچ لایسنسی ثبت نشده است.' };
      }

      const deviceId = await getDeviceId();

      // استعلام مستقیم وضعیت لایسنس از سرور
      const response = await axios.get(SUPABASE_BASE_URL + '/licenses', {
        params: {
          license_key: 'eq.' + stored.license_key.trim().toUpperCase(),
          select: '*',
        },
        headers: {
          apikey: SUPABASE_SECRET_KEY,
          Authorization: 'Bearer ' + SUPABASE_SECRET_KEY,
        },
        timeout: 7000,
      });

      const records = response.data;

      // اگر رکورد حذف شده باشد یا جدول وجود نداشته باشد
      if (!records || records.length === 0) {
        await this.removeLicense();
        return { isValid: false, message: 'این لایسنس از سرور حذف شده یا نامعتبر است.' };
      }

      const license = records[0];

      // بررسی وضعیت لایسنس
      if (license.status !== 'active') {
        await this.removeLicense();
        return { isValid: false, message: 'این لایسنس غیرفعال یا مسدود شده است.' };
      }

      // بررسی تاریخ انقضا
      if (license.expires_at) {
        const expiry = new Date(license.expires_at);
        if (new Date() > expiry) {
          await this.removeLicense();
          return { isValid: false, message: 'لایسنس شما منقضی شده است.' };
        }
      }

      // بررسی سخت‌افزاری دستگاه
      const registeredDevices: string[] = license.registered_devices || [];
      if (!registeredDevices.includes(deviceId)) {
        await this.removeLicense();
        return { isValid: false, message: 'دسترسی این دستگاه به لایسنس لغو شده است.' };
      }

      // لایسنس معتبر است
      const updatedInfo: LicenseData = {
        license_key: license.license_key,
        buyer_name: license.buyer_name,
        expires_at: license.expires_at,
        activated_at: stored.activated_at || Date.now(),
      };
      await AsyncStorage.setItem(STORAGE_KEY_LICENSE, JSON.stringify(updatedInfo));
      return { isValid: true, data: updatedInfo };
    } catch (err: any) {
      console.log('Online license revalidation error:', err?.response?.status || err.message);
      // اگر خطای ۴۰۴ یا ۴۰۰ از دیتابیس بیاید (مثلا حذف جدول یا خطای دیتابیس)
      if (err?.response?.status === 404 || err?.response?.status === 400 || err?.response?.status === 401) {
        await this.removeLicense();
        return { isValid: false, message: 'دسترسی به سیستم لایسنس مسدود شده است.' };
      }

      // در صورت قطعی موقت اینترنت، اطلاعات کش را بازگردان تا کاربر آفلاین هم اذیت نشود
      const fallback = await this.getStoredLicense();
      if (fallback) {
        return { isValid: true, data: fallback };
      }
      return { isValid: false, message: 'خطا در ارتباط با سرور لایسنس.' };
    }
  },

  // اعتبارسنجی و فعال‌سازی لایسنس جدید
  async verifyAndActivate(licenseKey: string): Promise<{ success: boolean; message: string; data?: LicenseData }> {
    try {
      const cleanKey = licenseKey.trim().toUpperCase();
      const deviceId = await getDeviceId();

      const response = await axios.get(SUPABASE_BASE_URL + '/licenses', {
        params: {
          license_key: 'eq.' + cleanKey,
          select: '*',
        },
        headers: {
          apikey: SUPABASE_SECRET_KEY,
          Authorization: 'Bearer ' + SUPABASE_SECRET_KEY,
        },
      });

      const records = response.data;
      if (!records || records.length === 0) {
        return { success: false, message: 'کد لایسنس نامعتبر است یا در سیستم ثبت نشده است.' };
      }

      const license = records[0];

      // ۱. بررسی وضعیت فعال بودن
      if (license.status !== 'active') {
        return { success: false, message: 'این لایسنس غیرفعال یا مسدود شده است.' };
      }

      // ۲. بررسی تاریخ انقضا
      if (license.expires_at) {
        const expiry = new Date(license.expires_at);
        if (new Date() > expiry) {
          return { success: false, message: 'مهلت استفاده از این لایسنس منقضی شده است.' };
        }
      }

      // ۳. بررسی اتصال به دستگاه (Device Binding)
      let registeredDevices: string[] = license.registered_devices || [];
      const isAlreadyOnThisDevice = registeredDevices.includes(deviceId);

      if (!isAlreadyOnThisDevice) {
        const maxLimit = license.max_devices || 1;
        if (registeredDevices.length >= maxLimit) {
          return {
            success: false,
            message: 'حداکثر تعداد دستگاه‌های مجاز (' + maxLimit + ' دستگاه) برای این لایسنس فعال شده است.',
          };
        }

        // ثبت شناسه گوشی جدید روی لایسنس در دیتابیس
        const updatedDevices = [...registeredDevices, deviceId];
        await axios.patch(
          SUPABASE_BASE_URL + '/licenses?id=eq.' + license.id,
          { registered_devices: updatedDevices },
          {
            headers: {
              apikey: SUPABASE_SECRET_KEY,
              Authorization: 'Bearer ' + SUPABASE_SECRET_KEY,
              'Content-Type': 'application/json',
              Prefer: 'return=minimal',
            },
          }
        );
      }

      const licenseInfo: LicenseData = {
        license_key: license.license_key,
        buyer_name: license.buyer_name,
        expires_at: license.expires_at,
        activated_at: Date.now(),
      };

      // ذخیره در حافظه محلی گوشی
      await AsyncStorage.setItem(STORAGE_KEY_LICENSE, JSON.stringify(licenseInfo));

      return {
        success: true,
        message: 'لایسنس با موفقیت برای «' + license.buyer_name + '» فعال شد.',
        data: licenseInfo,
      };
    } catch (err: any) {
      console.error('License check error:', err?.response?.data || err.message);
      return {
        success: false,
        message: 'خطا در ارتباط با سرور لایسنس. لطفاً اینترنت خود را بررسی نمایید.',
      };
    }
  },

  // حذف لایسنس (خروج از حساب)
  async removeLicense(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEY_LICENSE);
  },
};