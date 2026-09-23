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
  Linking,
} from 'react-native';
import { useStore } from '../context/StoreContext';
import { WooCustomer } from '../types';
import { formatPrice, toPersianDigits } from '../utils/helpers';
import { Search, Users, Phone, Mail, ShoppingBag } from 'lucide-react-native';

export const CustomersScreen = () => {
  const { activeStore, api } = useStore();
  const [customers, setCustomers] = useState<WooCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchCustomers = useCallback(
    async (resetPage: boolean = false) => {
      if (!api) {
        setIsLoading(false);
        return;
      }

      const currentPage = resetPage ? 1 : page;
      if (resetPage) setIsLoading(true);

      try {
        const data = await api.getCustomers({
          search: searchQuery || undefined,
          page: currentPage,
          per_page: 15,
        });

        if (resetPage) {
          setCustomers(data);
          setPage(2);
        } else {
          setCustomers((prev) => [...prev, ...data]);
          setPage((p) => p + 1);
        }
        setHasMore(data.length === 15);
      } catch (e) {
        console.error('Error loading customers:', e);
      } finally {
        setIsLoading(false);
        setRefreshing(false);
      }
    },
    [api, searchQuery, page]
  );

  useEffect(() => {
    fetchCustomers(true);
  }, [activeStore]);

  const handleCall = (phone?: string) => {
    if (phone) Linking.openURL('tel:' + phone);
  };

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchContainer}>
        <TouchableOpacity style={styles.searchIconBtn} onPress={() => fetchCustomers(true)}>
          <Search size={18} color="#64748b" />
        </TouchableOpacity>
        <TextInput
          style={styles.searchInput}
          placeholder="جستجوی نام یا ایمیل مشتری..."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={() => fetchCustomers(true)}
          textAlign="right"
          returnKeyType="search"
        />
      </View>

      {/* Customer List */}
      {isLoading && page === 1 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>در حال دریافت لیست مشتریان...</Text>
        </View>
      ) : (
        <FlatList
          data={customers}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchCustomers(true)} colors={['#2563eb']} />}
          onEndReached={() => {
            if (!isLoading && hasMore) fetchCustomers(false);
          }}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Users size={48} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>مشتری‌ای یافت نشد</Text>
            </View>
          }
          renderItem={({ item }) => {
            const fullName = item.first_name || item.last_name
              ? (item.first_name || '') + ' ' + (item.last_name || '')
              : item.username;
            return (
              <View style={styles.customerCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{fullName ? fullName[0] : 'ک'}</Text>
                  </View>
                  <View style={styles.info}>
                    <Text style={styles.name}>{fullName}</Text>
                    <Text style={styles.email}>{item.email}</Text>
                  </View>
                </View>

                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{formatPrice(item.total_spent, activeStore?.currencySymbol)}</Text>
                    <Text style={styles.statLabel}>مجموع خرید</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{toPersianDigits(item.orders_count)}</Text>
                    <Text style={styles.statLabel}>تعداد سفارش</Text>
                  </View>
                </View>

                {item.billing?.phone ? (
                  <TouchableOpacity style={styles.callBtn} onPress={() => handleCall(item.billing.phone)}>
                    <Phone size={15} color="#2563eb" style={{ marginLeft: 6 }} />
                    <Text style={styles.callBtnText}>تماس با مشتری ({toPersianDigits(item.billing.phone)})</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
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
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  customerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 5,
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  info: {
    flex: 1,
    alignItems: 'flex-end',
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  email: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-around',
    backgroundColor: '#f8fafc',
    paddingVertical: 10,
    borderRadius: 10,
    marginVertical: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  statLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  callBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    marginTop: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  callBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    color: '#64748b',
    marginTop: 10,
  },
});