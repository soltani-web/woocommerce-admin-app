import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useStore } from '../context/StoreContext';
import { StoreConfig } from '../types';
import { Plus, Check, Trash2, X, Globe, Key, ShieldCheck } from 'lucide-react-native';
import { WooCommerceService } from '../services/api';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const StoreModal: React.FC<Props> = ({ visible, onClose }) => {
  const { stores, activeStore, selectStore, addStore, removeStore } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [consumerKey, setConsumerKey] = useState('');
  const [consumerSecret, setConsumerSecret] = useState('');
  const [currencySymbol, setCurrencySymbol] = useState('تومان');
  const [isTesting, setIsTesting] = useState(false);

  const handleAddStore = async () => {
    if (!name.trim() || !url.trim() || !consumerKey.trim() || !consumerSecret.trim()) {
      Alert.alert('خطا', 'لطفاً تمام فیلدهای الزامی را پر کنید.');
      return;
    }

    setIsTesting(true);
    const tempStore: StoreConfig = {
      id: 'temp',
      name: name.trim(),
      url: url.trim(),
      consumerKey: consumerKey.trim(),
      consumerSecret: consumerSecret.trim(),
      currencySymbol: currencySymbol.trim() || 'تومان',
      createdAt: Date.now(),
    };

    const service = new WooCommerceService(tempStore);
    const testResult = await service.testConnection();

    setIsTesting(false);

    if (testResult.success) {
      await addStore(tempStore);
      setName('');
      setUrl('');
      setConsumerKey('');
      setConsumerSecret('');
      setIsAdding(false);
      Alert.alert('موفقیت', 'فروشگاه جدید با موفقیت متصل و اضافه شد.');
    } else {
      Alert.alert('خطا در اتصال', testResult.message);
    }
  };

  const handleDelete = (id: string, storeName: string) => {
    Alert.alert('حذف فروشگاه', 'آیا از حذف فروشگاه "' + storeName + '" مطمئن هستید؟', [
      { text: 'انصراف', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: () => removeStore(id) },
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#64748b" />
            </TouchableOpacity>
            <Text style={styles.title}>{isAdding ? 'افزودن فروشگاه جدید' : 'مدیریت و انتخاب فروشگاه'}</Text>
          </View>

          {isAdding ? (
            <View style={styles.formContainer}>
              <Text style={styles.inputLabel}>نام فروشگاه (دلخواه)</Text>
              <TextInput
                style={styles.input}
                placeholder="مثلاً: فروشگاه دیجی‌استایل"
                placeholderTextColor="#94a3b8"
                value={name}
                onChangeText={setName}
                textAlign="right"
              />

              <Text style={styles.inputLabel}>آدرس سایت (URL)</Text>
              <TextInput
                style={styles.input}
                placeholder="https://myshop.com"
                placeholderTextColor="#94a3b8"
                value={url}
                onChangeText={setUrl}
                autoCapitalize="none"
                keyboardType="url"
              />

              <Text style={styles.inputLabel}>Consumer Key (کلید مصرف‌کننده)</Text>
              <TextInput
                style={styles.input}
                placeholder="ck_xxxxxxxxxxxxxxxxxxxxxxxx"
                placeholderTextColor="#94a3b8"
                value={consumerKey}
                onChangeText={setConsumerKey}
                autoCapitalize="none"
              />

              <Text style={styles.inputLabel}>Consumer Secret (رمز مصرف‌کننده)</Text>
              <TextInput
                style={styles.input}
                placeholder="cs_xxxxxxxxxxxxxxxxxxxxxxxx"
                placeholderTextColor="#94a3b8"
                value={consumerSecret}
                onChangeText={setConsumerSecret}
                autoCapitalize="none"
                secureTextEntry
              />

              <Text style={styles.inputLabel}>واحد پول</Text>
              <TextInput
                style={styles.input}
                placeholder="تومان"
                placeholderTextColor="#94a3b8"
                value={currencySymbol}
                onChangeText={setCurrencySymbol}
                textAlign="right"
              />

              <View style={styles.formActions}>
                <TouchableOpacity
                  style={[styles.btn, styles.submitBtn]}
                  onPress={handleAddStore}
                  disabled={isTesting}
                >
                  {isTesting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitBtnText}>تست اتصال و ذخیره</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btn, styles.cancelBtn]}
                  onPress={() => setIsAdding(false)}
                >
                  <Text style={styles.cancelBtnText}>بازگشت به لیست</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              <FlatList
                data={stores}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: 16 }}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Globe size={48} color="#cbd5e1" />
                    <Text style={styles.emptyText}>هیچ فروشگاهی ثبت نشده است.</Text>
                    <Text style={styles.emptySubText}>برای شروع روی دکمه افزودن فروشگاه بزنید.</Text>
                  </View>
                }
                renderItem={({ item }) => {
                  const isSelected = activeStore?.id === item.id;
                  return (
                    <TouchableOpacity
                      style={[styles.storeItem, isSelected && styles.selectedStoreItem]}
                      onPress={() => {
                        selectStore(item.id);
                        onClose();
                      }}
                    >
                      <TouchableOpacity
                        onPress={() => handleDelete(item.id, item.name)}
                        style={styles.deleteBtn}
                      >
                        <Trash2 size={18} color="#ef4444" />
                      </TouchableOpacity>

                      <View style={styles.storeDetails}>
                        <View style={{ flexDirection: 'row-reverse', alignItems: 'center' }}>
                          <Text style={styles.storeItemName}>{item.name}</Text>
                          {isSelected && (
                            <View style={styles.activeBadge}>
                              <Text style={styles.activeBadgeText}>فعال</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.storeItemUrl} numberOfLines={1}>
                          {item.url}
                        </Text>
                      </View>

                      {isSelected && (
                        <View style={styles.checkIcon}>
                          <Check size={18} color="#2563eb" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                }}
              />

              <View style={styles.footer}>
                <TouchableOpacity
                  style={styles.addStoreBtn}
                  onPress={() => setIsAdding(true)}
                >
                  <Plus size={20} color="#fff" style={{ marginLeft: 8 }} />
                  <Text style={styles.addStoreBtnText}>افزودن فروشگاه جدید</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    minHeight: '50%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'right',
  },
  closeBtn: {
    padding: 4,
  },
  storeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  selectedStoreItem: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  storeDetails: {
    flex: 1,
    alignItems: 'flex-end',
    marginRight: 12,
  },
  storeItemName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
  },
  storeItemUrl: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 3,
  },
  activeBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 8,
  },
  activeBadgeText: {
    fontSize: 11,
    color: '#1d4ed8',
    fontWeight: '600',
  },
  checkIcon: {
    marginLeft: 6,
  },
  deleteBtn: {
    padding: 8,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  addStoreBtn: {
    backgroundColor: '#2563eb',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
  },
  addStoreBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
    marginTop: 12,
  },
  emptySubText: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
  },
  formContainer: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
    textAlign: 'right',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 14,
    color: '#0f172a',
  },
  formActions: {
    marginTop: 10,
  },
  btn: {
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  submitBtn: {
    backgroundColor: '#16a34a',
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  cancelBtn: {
    backgroundColor: '#f1f5f9',
  },
  cancelBtnText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '600',
  },
});