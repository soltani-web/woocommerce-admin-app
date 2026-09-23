import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useStore } from '../context/StoreContext';
import { StoreHeader } from '../components/StoreHeader';
import { StoreModal } from '../components/StoreModal';
import { DashboardStats, WooOrder } from '../types';
import { formatPrice, toPersianDigits, getOrderStatusTitle, formatPersianDate } from '../utils/helpers';
import {
  TrendingUp,
  ShoppingBag,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  Package,
  Layers,
  ChevronLeft,
  Sparkles,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export const DashboardScreen = ({ navigation }: any) => {
  const { activeStore, api } = useStore();
  const [storeModalVisible, setStoreModalVisible] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<WooOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!api) {
      setIsLoading(false);
      return;
    }

    try {
      const [statsData, ordersData] = await Promise.all([
        api.getDashboardStats(),
        api.getOrders({ per_page: 5 }),
      ]);
      setStats(statsData);
      setRecentOrders(ordersData);
    } catch (e) {
      console.error('Error fetching dashboard:', e);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [api]);

  useEffect(() => {
    setIsLoading(true);
    loadData();
  }, [loadData, activeStore]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (!activeStore) {
    return (
      <View style={styles.centerContainer}>
        <Package size={64} color="#94a3b8" />
        <Text style={styles.noStoreTitle}>فروشگاهی انتخاب نشده است</Text>
        <Text style={styles.noStoreSub}>برای مشاهده آمار، ابتدا یک فروشگاه ووکامرس اضافه کنید.</Text>
        <TouchableOpacity
          style={styles.selectStoreBtn}
          onPress={() => setStoreModalVisible(true)}
        >
          <Text style={styles.selectStoreBtnText}>انتخاب یا افزودن فروشگاه</Text>
        </TouchableOpacity>
        <StoreModal visible={storeModalVisible} onClose={() => setStoreModalVisible(false)} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StoreHeader onOpenStoreModal={() => setStoreModalVisible(true)} />
      <StoreModal visible={storeModalVisible} onClose={() => setStoreModalVisible(false)} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loadingText}>در حال دریافت اطلاعات فروشگاه...</Text>
          </View>
        ) : (
          <>
            {/* Top Stat Card with Luxury Gradient */}
            <LinearGradient
              colors={['#1e40af', '#3b82f6', '#06b6d4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.mainSalesCard}
            >
              <View style={styles.salesHeader}>
                <View style={styles.salesIconBg}>
                  <TrendingUp size={22} color="#ffffff" />
                </View>
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <Text style={styles.mainSalesLabel}>مجموع فروش ۳۰ روز اخیر</Text>
                </View>
                <Sparkles size={18} color="#93c5fd" />
              </View>
              <Text style={styles.mainSalesAmount}>
                {formatPrice(stats?.totalSales, activeStore.currencySymbol)}
              </Text>
              <View style={styles.salesFooter}>
                <Text style={styles.salesFooterText}>
                  سود خالص فروشگاه: {formatPrice(stats?.netSales, activeStore.currencySymbol)}
                </Text>
              </View>
            </LinearGradient>

            {/* Quick Stats Grid */}
            <View style={styles.grid}>
              <View style={[styles.gridCard, { borderLeftColor: '#f59e0b' }]}>
                <View style={styles.gridCardHeader}>
                  <Clock size={20} color="#f59e0b" />
                  <Text style={styles.gridCardTitle}>در انتظار بررسی</Text>
                </View>
                <Text style={styles.gridCardValue}>
                  {toPersianDigits(stats?.pendingOrdersCount || 0)}
                </Text>
                <Text style={styles.gridCardSub}>سفارش پرداخت‌نشده</Text>
              </View>

              <View style={[styles.gridCard, { borderLeftColor: '#16a34a' }]}>
                <View style={styles.gridCardHeader}>
                  <ShoppingBag size={20} color="#16a34a" />
                  <Text style={styles.gridCardTitle}>در حال انجام</Text>
                </View>
                <Text style={styles.gridCardValue}>
                  {toPersianDigits(stats?.processingOrdersCount || 0)}
                </Text>
                <Text style={styles.gridCardSub}>آماده ارسال</Text>
              </View>

              <View style={[styles.gridCard, { borderLeftColor: '#ef4444' }]}>
                <View style={styles.gridCardHeader}>
                  <AlertTriangle size={20} color="#ef4444" />
                  <Text style={styles.gridCardTitle}>ناموجود در انبار</Text>
                </View>
                <Text style={styles.gridCardValue}>
                  {toPersianDigits(stats?.lowStockCount || 0)}
                </Text>
                <Text style={styles.gridCardSub}>کالای تمام‌شده</Text>
              </View>

              <View style={[styles.gridCard, { borderLeftColor: '#6366f1' }]}>
                <View style={styles.gridCardHeader}>
                  <Layers size={20} color="#6366f1" />
                  <Text style={styles.gridCardTitle}>کل اقلام فروخته‌شده</Text>
                </View>
                <Text style={styles.gridCardValue}>
                  {toPersianDigits(stats?.itemsSold || 0)}
                </Text>
                <Text style={styles.gridCardSub}>عدد کالا</Text>
              </View>
            </View>

            {/* Recent Orders Section */}
            <View style={styles.sectionHeader}>
              <TouchableOpacity
                onPress={() => navigation.navigate('OrdersTab')}
                style={styles.seeAllBtn}
              >
                <ChevronLeft size={16} color="#2563eb" />
                <Text style={styles.seeAllText}>مشاهده همه</Text>
              </TouchableOpacity>
              <Text style={styles.sectionTitle}>آخرین سفارشات</Text>
            </View>

            {recentOrders.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyCardText}>هیچ سفارشی یافت نشد.</Text>
              </View>
            ) : (
              recentOrders.map((order) => {
                const statusInfo = getOrderStatusTitle(order.status);
                return (
                  <TouchableOpacity
                    key={order.id}
                    style={styles.orderCard}
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}
                  >
                    <View style={styles.orderCardTop}>
                      <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
                        <Text style={[styles.statusBadgeText, { color: statusInfo.color }]}>
                          {statusInfo.title}
                        </Text>
                      </View>
                      <Text style={styles.orderNumber}>
                        سفارش #{toPersianDigits(order.number || order.id)}
                      </Text>
                    </View>

                    <View style={styles.orderCustomerRow}>
                      <Text style={styles.customerName}>
                        {order.billing?.first_name || order.shipping?.first_name
                          ? (order.billing?.first_name || order.shipping?.first_name) + ' ' + (order.billing?.last_name || order.shipping?.last_name || '')
                          : 'کاربر مهمان'}
                      </Text>
                      <Text style={styles.orderDate}>
                        {formatPersianDate(order.date_created)}
                      </Text>
                    </View>

                    <View style={styles.orderDivider} />

                    <View style={styles.orderCardBottom}>
                      <Text style={styles.orderItemsCount}>
                        {toPersianDigits(order.line_items?.length || 0)} قلم کالا
                      </Text>
                      <Text style={styles.orderPrice}>
                        {formatPrice(order.total, activeStore.currencySymbol)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f8fafc',
  },
  noStoreTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 16,
    textAlign: 'center',
  },
  noStoreSub: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 6,
    textAlign: 'center',
  },
  selectStoreBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 20,
  },
  selectStoreBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  loadingContainer: {
    paddingVertical: 50,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748b',
    fontSize: 14,
  },
  mainSalesCard: {
    backgroundColor: '#2563eb',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  salesHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 12,
  },
  salesIconBg: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 8,
    borderRadius: 10,
    marginLeft: 10,
  },
  mainSalesLabel: {
    color: '#dbeafe',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  mainSalesAmount: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'right',
    marginVertical: 4,
  },
  salesFooter: {
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  salesFooterText: {
    color: '#bfdbfe',
    fontSize: 13,
    textAlign: 'right',
  },
  grid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  gridCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  gridCardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  gridCardTitle: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  gridCardValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'right',
    marginVertical: 2,
  },
  gridCardSub: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'right',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: 13,
    color: '#2563eb',
    fontWeight: '600',
  },
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  orderCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: '700',
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
  orderCustomerRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  customerName: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
  },
  orderDate: {
    fontSize: 11,
    color: '#94a3b8',
  },
  orderDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginBottom: 10,
  },
  orderCardBottom: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderItemsCount: {
    fontSize: 12,
    color: '#64748b',
  },
  orderPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  emptyCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 14,
    alignItems: 'center',
  },
  emptyCardText: {
    color: '#94a3b8',
    fontSize: 14,
  },
});