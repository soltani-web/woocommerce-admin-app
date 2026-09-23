import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useStore } from '../context/StoreContext';
import { WooOrder } from '../types';
import { formatPrice, toPersianDigits, getOrderStatusTitle, formatPersianDate } from '../utils/helpers';
import { Search, Filter, ShoppingCart, ChevronLeft } from 'lucide-react-native';

const STATUS_FILTERS = [
  { id: 'all', title: 'همه' },
  { id: 'processing', title: 'در حال انجام' },
  { id: 'pending', title: 'در انتظار پرداخت' },
  { id: 'on-hold', title: 'در انتظار بررسی' },
  { id: 'completed', title: 'تکمیل شده' },
  { id: 'cancelled', title: 'لغو شده' },
];

export const OrdersScreen = ({ navigation }: any) => {
  const { activeStore, api } = useStore();
  const [orders, setOrders] = useState<WooOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchOrders = useCallback(
    async (resetPage: boolean = false) => {
      if (!api) {
        setIsLoading(false);
        return;
      }

      const currentPage = resetPage ? 1 : page;
      if (resetPage) {
        setIsLoading(true);
      }

      try {
        const data = await api.getOrders({
          status: selectedStatus,
          search: searchQuery || undefined,
          page: currentPage,
          per_page: 15,
        });

        if (resetPage) {
          setOrders(data);
          setPage(2);
        } else {
          setOrders((prev) => [...prev, ...data]);
          setPage((p) => p + 1);
        }

        setHasMore(data.length === 15);
      } catch (e) {
        console.error('Error loading orders:', e);
      } finally {
        setIsLoading(false);
        setRefreshing(false);
      }
    },
    [api, selectedStatus, searchQuery, page]
  );

  useEffect(() => {
    fetchOrders(true);
  }, [selectedStatus, activeStore]);

  const handleSearch = () => {
    fetchOrders(true);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders(true);
  };

  const loadMore = () => {
    if (!isLoading && hasMore) {
      fetchOrders(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TouchableOpacity style={styles.searchIconBtn} onPress={handleSearch}>
          <Search size={18} color="#64748b" />
        </TouchableOpacity>
        <TextInput
          style={styles.searchInput}
          placeholder="جستجو با شماره سفارش، نام مشتری یا تلفن..."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          textAlign="right"
          returnKeyType="search"
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterScrollWrapper}>
        <FlatList
          horizontal
          inverted
          showsHorizontalScrollIndicator={false}
          data={STATUS_FILTERS}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => {
            const isSelected = selectedStatus === item.id;
            return (
              <TouchableOpacity
                style={[styles.filterChip, isSelected && styles.activeFilterChip]}
                onPress={() => setSelectedStatus(item.id)}
              >
                <Text style={[styles.filterChipText, isSelected && styles.activeFilterChipText]}>
                  {item.title}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Orders List */}
      {isLoading && page === 1 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>در حال دریافت لیست سفارشات...</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <ShoppingCart size={48} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>سفارشی یافت نشد</Text>
              <Text style={styles.emptySub}>هیچ سفارشی با این فیلتر یا عبارت جستجو ثبت نشده است.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const statusInfo = getOrderStatusTitle(item.status);
            const customerName =
              item.billing?.first_name || item.shipping?.first_name
                ? (item.billing?.first_name || item.shipping?.first_name) + ' ' + (item.billing?.last_name || item.shipping?.last_name || '')
                : 'کاربر مهمان';

            return (
              <TouchableOpacity
                style={styles.orderCard}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
                    <Text style={[styles.statusBadgeText, { color: statusInfo.color }]}>
                      {statusInfo.title}
                    </Text>
                  </View>
                  <Text style={styles.orderNumber}>#{toPersianDigits(item.number || item.id)}</Text>
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.detailRow}>
                    <Text style={styles.customerText}>{customerName}</Text>
                    <Text style={styles.label}>مشتری:</Text>
                  </View>
                  {item.billing?.phone ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.phoneText}>{toPersianDigits(item.billing.phone)}</Text>
                      <Text style={styles.label}>شماره تماس:</Text>
                    </View>
                  ) : null}
                  <View style={styles.detailRow}>
                    <Text style={styles.dateText}>{formatPersianDate(item.date_created)}</Text>
                    <Text style={styles.label}>تاریخ ثبت:</Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.priceText}>
                    {formatPrice(item.total, activeStore?.currencySymbol)}
                  </Text>
                  <View style={styles.itemsBadge}>
                    <Text style={styles.itemsBadgeText}>
                      {toPersianDigits(item.line_items?.length || 0)} قلم کالا
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
  },
  searchIconBtn: {
    padding: 6,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 13,
    color: '#0f172a',
  },
  filterScrollWrapper: {
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  filterList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  activeFilterChip: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  activeFilterChipText: {
    color: '#ffffff',
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
  },
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 15,
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
  cardBody: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f8fafc',
    paddingVertical: 8,
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginVertical: 3,
  },
  label: {
    fontSize: 12,
    color: '#94a3b8',
    marginLeft: 6,
  },
  customerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },
  phoneText: {
    fontSize: 12,
    color: '#475569',
  },
  dateText: {
    fontSize: 11,
    color: '#64748b',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#16a34a',
  },
  itemsBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  itemsBadgeText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748b',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
    textAlign: 'center',
  },
});