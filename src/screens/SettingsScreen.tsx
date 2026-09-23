import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { useStore } from '../context/StoreContext';
import { StoreModal } from '../components/StoreModal';
import { Store, ShieldCheck, RefreshCw, Smartphone, HelpCircle, Info } from 'lucide-react-native';

export const SettingsScreen = () => {
  const { stores, activeStore, api } = useStore();
  const [storeModalVisible, setStoreModalVisible] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const handleTestConnection = async () => {
    if (!api) {
      Alert.alert('خطا', 'ابتدا یک فروشگاه انتخاب کنید.');
      return;
    }
    setIsTesting(true);
    const res = await api.testConnection();
    setIsTesting(false);
    if (res.success) {
      Alert.alert('اتصال موفق', 'ارتباط با REST API ووکامرس پایدار و معتبر است.');
    } else {
      Alert.alert('خطا در اتصال', res.message);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <StoreModal visible={storeModalVisible} onClose={() => setStoreModalVisible(false)} />

      {/* Store Section */}
      <Text style={styles.sectionHeader}>فروشگاه‌ها و سایت‌ها</Text>
      <View style={styles.card}>
        <TouchableOpacity style={styles.menuItem} onPress={() => setStoreModalVisible(true)}>
          <View style={styles.menuRight}>
            <View style={[styles.iconContainer, { backgroundColor: '#eff6ff' }]}>
              <Store size={20} color="#2563eb" />
            </View>
            <View style={styles.menuText}>
              <Text style={styles.menuTitle}>مدیریت فروشگاه‌ها</Text>
              <Text style={styles.menuSub}>
                {stores.length > 0 ? (stores.length + ' فروشگاه ثبت شده (فعال: ' + (activeStore?.name || '') + ')') : 'افزودن فروشگاه جدید'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.menuItem} onPress={handleTestConnection} disabled={isTesting}>
          <View style={styles.menuRight}>
            <View style={[styles.iconContainer, { backgroundColor: '#dcfce7' }]}>
              <RefreshCw size={20} color="#16a34a" />
            </View>
            <View style={styles.menuText}>
              <Text style={styles.menuTitle}>بررسی وضعیت اتصال REST API</Text>
              <Text style={styles.menuSub}>تست آنلاین بودن و صحت کلیدهای ووکامرس</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Security Info */}
      <Text style={styles.sectionHeader}>امنیت و حریم خصوصی</Text>
      <View style={styles.card}>
        <View style={styles.menuItem}>
          <View style={styles.menuRight}>
            <View style={[styles.iconContainer, { backgroundColor: '#fef3c7' }]}>
              <ShieldCheck size={20} color="#d97706" />
            </View>
            <View style={styles.menuText}>
              <Text style={styles.menuTitle}>ذخیره‌سازی ایمن محلی</Text>
              <Text style={styles.menuSub}>کلیدهای اختصاصی فقط داخل حافظه رمزگذاری‌شده گوشی شما نگهداری می‌شوند.</Text>
            </View>
          </View>
        </View>
      </View>

      {/* About App */}
      <Text style={styles.sectionHeader}>درباره اپلیکیشن</Text>
      <View style={styles.card}>
        <View style={styles.menuItem}>
          <View style={styles.menuRight}>
            <View style={[styles.iconContainer, { backgroundColor: '#f1f5f9' }]}>
              <Smartphone size={20} color="#475569" />
            </View>
            <View style={styles.menuText}>
              <Text style={styles.menuTitle}>اپلیکیشن مدیریت فروشگاه ووکامرس</Text>
              <Text style={styles.menuSub}>نسخه ۱.۰.۰ (فارسی و راست‌چین)</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 16,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
    textAlign: 'right',
    marginBottom: 8,
    marginTop: 12,
    marginRight: 4,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  menuRight: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  menuText: {
    flex: 1,
    alignItems: 'flex-end',
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'right',
  },
  menuSub: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 3,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
  },
});