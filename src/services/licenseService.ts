import axios from 'axios';
import * as Application from 'expo-application';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// آدرس دامنه هاست اختصاصی شما که اسکریپت لایسنس روی آن نصب شده است
// به عنوان مثال: https://wp-negar.ir/license یا https://yourdomain.com/license-server
export const LICENSE_SERVER_URL = 'https://wp-negar.ir/license';

const STORAGE_KEY_LICENSE = '@app_license_data';

export interface LicenseData {
  license_key: string;
  buyer_name: string;
  expires_at?: string | null;
  max_devices?: number;
  activated_at: number;
}

// دریافت شناسه یکتا برای هر گوشی (قفل سخت‌افزاری)
export async function getDeviceId(): Promise<string> {
  try {
    if (Platform.OS === 'android') {
      return Application.getAndroidId() || 'android_device_' + Platform.Version;
    } else if (Platform.OS === 'ios') {
      const iosId = await Application.getIosIdForVendorAsync();
      return iosId || 'ios_device_' + Platform.Version;
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

  // بررسی آنلاین و اعتبارسنجی مجدد لایسنس با سرور اختصاصی
  async revalidateStoredLicense(): Promise<{ isValid: boolean; data?: LicenseData; message?: string }> {
    try {
      const stored = await this.getStoredLicense();
      if (!stored) {
        return { isValid: false, message: 'هیچ لایسنسی ثبت نشده است.' };
      }

      const deviceId = await getDeviceId();

      // استعلام مستقیم وضعیت لایسنس از سرور اختصاصی
      const response = await axios.post(
        LICENSE_SERVER_URL + '/api/verify.php',
        {
          license_key: stored.license_key.trim().toUpperCase(),
          device_id: deviceId,
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 8000,
        }
      );

      const resData = response.data;

      if (resData && resData.isValid && resData.data) {
        // بروزرسانی اطلاعات در حافظه محلی
        const updatedInfo: LicenseData = {
          license_key: resData.data.license_key,
          buyer_name: resData.data.buyer_name,
          expires_at: resData.data.expires_at,
          max_devices: resData.data.max_devices,
          activated_at: resData.data.activated_at || stored.activated_at || Date.now(),
        };
        await AsyncStorage.setItem(STORAGE_KEY_LICENSE, JSON.stringify(updatedInfo));
        return { isValid: true, data: updatedInfo };
      } else {
        // اگر سرور لایسنس را نامعتبر یا مسدود اعلام کرد
        await this.removeLicense();
        return { isValid: false, message: resData?.message || 'لایسنس نامعتبر یا منقضی شده است.' };
      }
    } catch (err: any) {
      console.log('Online license revalidation error:', err?.message);

      // در صورت قطعی موقت اینترنت، اطلاعات کش‌شده را بازگردان تا کاربر آفلاین با مشکل مواجه نشود
      const fallback = await this.getStoredLicense();
      if (fallback) {
        return { isValid: true, data: fallback };
      }
      return { isValid: false, message: 'خطا در برقراری ارتباط با سرور لایسنس.' };
    }
  },

  // اعتبارسنجی و فعال‌سازی لایسنس جدید
  async verifyAndActivate(licenseKey: string): Promise<{ success: boolean; message: string; data?: LicenseData }> {
    try {
      const cleanKey = licenseKey.trim().toUpperCase();
      const deviceId = await getDeviceId();

      const response = await axios.post(
        LICENSE_SERVER_URL + '/api/activate.php',
        {
          license_key: cleanKey,
          device_id: deviceId,
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        }
      );

      const resData = response.data;

      if (resData && resData.success && resData.data) {
        const licenseInfo: LicenseData = {
          license_key: resData.data.license_key,
          buyer_name: resData.data.buyer_name,
          expires_at: resData.data.expires_at,
          max_devices: resData.data.max_devices,
          activated_at: resData.data.activated_at || Date.now(),
        };

        // ذخیره در حافظه محلی گوشی
        await AsyncStorage.setItem(STORAGE_KEY_LICENSE, JSON.stringify(licenseInfo));

        return {
          success: true,
          message: resData.message || 'لایسنس با موفقیت فعال شد.',
          data: licenseInfo,
        };
      } else {
        return {
          success: false,
          message: resData?.message || 'کد لایسنس نامعتبر است.',
        };
      }
    } catch (err: any) {
      console.error('License activation error:', err?.response?.data || err.message);
      return {
        success: false,
        message: 'خطا در ارتباط با سرور لایسنس. لطفاً اتصال اینترنت خود را بررسی نمایید.',
      };
    }
  },

  // حذف لایسنس (خروج از حساب)
  async removeLicense(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEY_LICENSE);
  },
};
