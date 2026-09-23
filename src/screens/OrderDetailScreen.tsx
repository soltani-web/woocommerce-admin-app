import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Linking,
} from 'react-native';
import { useStore } from '../context/StoreContext';
import { WooOrder } from '../types';
import { formatPrice, toPersianDigits, getOrderStatusTitle, formatPersianDate } from '../utils/helpers';
import { Phone, Mail, MapPin, Send, CheckCircle2, PackageCheck } from 'lucide-react-native';

const STATUS_LIST = [
  { id: 'processing', title: 'در حال انجام' },
  { id: 'completed', title: 'تکمیل شده' },
  { id: 'on-hold', title: 'در انتظار بررسی' },
  { id: 'cancelled', title: 'لغو شده' },
  { id: 'refunded', title: 'مسترد شده' },
];

export const OrderDetailScreen = ({ route, navigation }: any) => {
  const { orderId } = route.params;
  const { activeStore, api } = useStore();
  const [order, setOrder] = useState<WooOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    if (!api) return;
    try {
      setIsLoading(true);
      const data = await api.getOrder(orderId);
      setOrder(data);
    } catch (e) {
      console.error('Error fetching order detail:', e);
      Alert.alert('خطا', 'عدم دریافت اطلاعات سفارش.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeStatus = async (newStatus: string) => {
    if (!api || !order) return;
    try {
      setIsUpdating(true);
      const updated = await api.updateOrderStatus(order.id, newStatus);
      setOrder(updated);
      Alert.alert('موفقیت', 'وضعیت سفارش بروزرسانی شد.');
    } catch (e) {
      Alert.alert('خطا', 'امکان تغییر وضعیت سفارش وجود ندارد.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddNote = async () => {
    if (!api || !order || !noteText.trim()) return;
    try {
      setIsAddingNote(true);
      await api.addOrderNote(order.id, noteText.trim());
      setNoteText('');
      Alert.alert('موفقیت', 'یادداشت با موفقیت ثبت شد.');
    } catch (e) {
      Alert.alert('خطا', 'ثبت یادداشت با خطا مواجه شد.');
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleCall = (phone?: string) => {
    if (phone) {
      Linking.openURL('tel:' + phone);
    }
  };

  if (isLoading || !order) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>در حال دریافت جزئیات سفارش...</Text>
      </View>
    );
  }

  const statusInfo = getOrderStatusTitle(order.status);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Info */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
            <Text style={[styles.statusBadgeText, { color: statusInfo.color }]}>{statusInfo.title}</Text>
          </View>
          <Text style={styles.orderNumber}>سفارش #{toPersianDigits(order.number || order.id)}</Text>
        </View>
        <Text style={styles.dateText}>{formatPersianDate(order.date_created)}</Text>
        <Text style={styles.paymentMethod}>روش پرداخت: {order.payment_method_title || 'پرداخت آنلاین'}</Text>
      </View>

      {/* Change Status Action */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>تغییر وضعیت سفارش</Text>
        <View style={styles.statusButtonsContainer}>
          {STATUS_LIST.map((s) => {
            const isCurrent = order.status.toLowerCase() === s.id;
            return (
              <TouchableOpacity
                key={s.id}
                style={[styles.statusBtn, isCurrent && styles.activeStatusBtn]}
                onPress={() => handleChangeStatus(s.id)}
                disabled={isUpdating || isCurrent}
              >
                <Text style={[styles.statusBtnText, isCurrent && styles.activeStatusBtnText]}>
                  {s.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Items List */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>اقلام سفارش ({toPersianDigits(order.line_items?.length || 0)} مورد)</Text>
        {order.line_items?.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <Text style={styles.itemTotal}>{formatPrice(item.total, activeStore?.currencySymbol)}</Text>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={2}>
                {item.name}
              </Text>
              <Text style={styles.itemQuantity}>
                {toPersianDigits(item.quantity)} عدد × {formatPrice(item.price, activeStore?.currencySymbol)}
              </Text>
            </View>
          </View>
        ))}

        <View style={styles.divider} />

        <View style={styles.summaryRow}>
          <Text style={styles.summaryValue}>{formatPrice(order.shipping_total, activeStore?.currencySymbol)}</Text>
          <Text style={styles.summaryLabel}>هزینه ارسال:</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryValue}>{formatPrice(order.total_tax, activeStore?.currencySymbol)}</Text>
          <Text style={styles.summaryLabel}>مالیات:</Text>
        </View>
        <View style={[styles.summaryRow, { marginTop: 6 }]}>
          <Text style={styles.totalValue}>{formatPrice(order.total, activeStore?.currencySymbol)}</Text>
          <Text style={styles.totalLabel}>مبلغ نهایی کل:</Text>
        </View>
      </View>

      {/* Customer / Shipping Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>مشخصات گیرنده و آدرس</Text>
        <Text style={styles.customerName}>
          {order.billing?.first_name} {order.billing?.last_name}
        </Text>

        {order.billing?.phone ? (
          <TouchableOpacity style={styles.actionRow} onPress={() => handleCall(order.billing?.phone)}>
            <Phone size={16} color="#2563eb" />
            <Text style={styles.actionText}>{toPersianDigits(order.billing.phone)} (تماس)</Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.addressContainer}>
          <MapPin size={16} color="#64748b" style={{ marginTop: 2, marginLeft: 6 }} />
          <Text style={styles.addressText}>
            {order.shipping?.state || order.billing?.state}، {order.shipping?.city || order.billing?.city}،{' '}
            {order.shipping?.address_1 || order.billing?.address_1 || 'آدرسی ثبت نشده است'}
          </Text>
        </View>
      </View>

      {/* Add Order Note */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>ثبت یادداشت برای سفارش</Text>
        <TextInput
          style={styles.noteInput}
          placeholder="متن یادداشت ادمین..."
          placeholderTextColor="#94a3b8"
          value={noteText}
          onChangeText={setNoteText}
          multiline
          numberOfLines={3}
          textAlign="right"
        />
        <TouchableOpacity
          style={styles.addNoteBtn}
          onPress={handleAddNote}
          disabled={isAddingNote || !noteText.trim()}
        >
          {isAddingNote ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Send size={16} color="#fff" style={{ marginLeft: 6 }} />
              <Text style={styles.addNoteBtnText}>ثبت یادداشت</Text>
            </>
          )}
        </TouchableOpacity>
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
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748b',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  dateText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'right',
    marginTop: 6,
  },
  paymentMethod: {
    fontSize: 12,
    color: '#334155',
    textAlign: 'right',
    marginTop: 4,
    fontWeight: '500',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'right',
    marginBottom: 12,
  },
  statusButtonsContainer: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  activeStatusBtn: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  statusBtnText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  activeStatusBtnText: {
    color: '#ffffff',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  itemInfo: {
    flex: 1,
    alignItems: 'flex-end',
    marginLeft: 10,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'right',
  },
  itemQuantity: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  itemTotal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#16a34a',
  },
  customerName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'right',
    marginBottom: 8,
  },
  actionRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginVertical: 4,
  },
  actionText: {
    fontSize: 13,
    color: '#2563eb',
    marginRight: 6,
    fontWeight: '600',
  },
  addressContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    marginTop: 8,
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 8,
  },
  addressText: {
    flex: 1,
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
    textAlign: 'right',
  },
  noteInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    color: '#0f172a',
    marginBottom: 10,
  },
  addNoteBtn: {
    backgroundColor: '#2563eb',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  addNoteBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
});