import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useStore } from '../context/StoreContext';
import { Store, ChevronDown } from 'lucide-react-native';

interface Props {
  onOpenStoreModal: () => void;
}

export const StoreHeader: React.FC<Props> = ({ onOpenStoreModal }) => {
  const { activeStore } = useStore();

  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.storeSelector} onPress={onOpenStoreModal} activeOpacity={0.7}>
        <View style={styles.iconContainer}>
          <Store size={18} color="#2563eb" />
        </View>
        <View style={styles.storeInfo}>
          <Text style={styles.storeLabel}>فروشگاه فعال</Text>
          <Text style={styles.storeName} numberOfLines={1}>
            {activeStore ? activeStore.name : 'فروشگاهی انتخاب نشده'}
          </Text>
        </View>
        <ChevronDown size={18} color="#64748b" style={styles.chevron} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  storeSelector: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  iconContainer: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  storeInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  storeLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontFamily: 'System',
    textAlign: 'right',
  },
  storeName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'right',
  },
  chevron: {
    marginRight: 6,
  },
});