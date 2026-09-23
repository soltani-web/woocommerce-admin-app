import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StoreConfig } from '../types';
import { WooCommerceService } from '../services/api';

interface StoreContextType {
  stores: StoreConfig[];
  activeStore: StoreConfig | null;
  api: WooCommerceService | null;
  isLoadingStores: boolean;
  addStore: (store: Omit<StoreConfig, 'id' | 'createdAt'>) => Promise<boolean>;
  removeStore: (id: string) => Promise<void>;
  selectStore: (id: string) => void;
  updateStore: (store: StoreConfig) => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const STORAGE_KEY_STORES = '@woo_admin_stores';
const STORAGE_KEY_ACTIVE = '@woo_admin_active_store_id';

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stores, setStores] = useState<StoreConfig[]>([]);
  const [activeStore, setActiveStore] = useState<StoreConfig | null>(null);
  const [isLoadingStores, setIsLoadingStores] = useState(true);

  // بارگذاری لیست فروشگاه‌ها از حافظه
  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    try {
      setIsLoadingStores(true);
      const savedStores = await AsyncStorage.getItem(STORAGE_KEY_STORES);
      const activeId = await AsyncStorage.getItem(STORAGE_KEY_ACTIVE);

      if (savedStores) {
        const parsed: StoreConfig[] = JSON.parse(savedStores);
        setStores(parsed);

        if (parsed.length > 0) {
          const current = parsed.find((s) => s.id === activeId) || parsed[0];
          setActiveStore(current);
        }
      }
    } catch (e) {
      console.error('Failed to load stores:', e);
    } finally {
      setIsLoadingStores(false);
    }
  };

  const addStore = async (storeData: Omit<StoreConfig, 'id' | 'createdAt'>): Promise<boolean> => {
    try {
      const newStore: StoreConfig = {
        ...storeData,
        id: Date.now().toString(),
        createdAt: Date.now(),
      };

      const testService = new WooCommerceService(newStore);
      const test = await testService.testConnection();

      const updatedStores = [...stores, newStore];
      setStores(updatedStores);
      await AsyncStorage.setItem(STORAGE_KEY_STORES, JSON.stringify(updatedStores));

      // انتخاب به عنوان فروشگاه فعال در صورت تمایل
      setActiveStore(newStore);
      await AsyncStorage.setItem(STORAGE_KEY_ACTIVE, newStore.id);

      return true;
    } catch (e) {
      console.error('Failed to add store:', e);
      return false;
    }
  };

  const removeStore = async (id: string) => {
    const updated = stores.filter((s) => s.id !== id);
    setStores(updated);
    await AsyncStorage.setItem(STORAGE_KEY_STORES, JSON.stringify(updated));

    if (activeStore?.id === id) {
      const nextActive = updated.length > 0 ? updated[0] : null;
      setActiveStore(nextActive);
      if (nextActive) {
        await AsyncStorage.setItem(STORAGE_KEY_ACTIVE, nextActive.id);
      } else {
        await AsyncStorage.removeItem(STORAGE_KEY_ACTIVE);
      }
    }
  };

  const selectStore = async (id: string) => {
    const target = stores.find((s) => s.id === id);
    if (target) {
      setActiveStore(target);
      await AsyncStorage.setItem(STORAGE_KEY_ACTIVE, id);
    }
  };

  const updateStore = async (store: StoreConfig) => {
    const updated = stores.map((s) => (s.id === store.id ? store : s));
    setStores(updated);
    await AsyncStorage.setItem(STORAGE_KEY_STORES, JSON.stringify(updated));
    if (activeStore?.id === store.id) {
      setActiveStore(store);
    }
  };

  const api = activeStore ? new WooCommerceService(activeStore) : null;

  return (
    <StoreContext.Provider
      value={{
        stores,
        activeStore,
        api,
        isLoadingStores,
        addStore,
        removeStore,
        selectStore,
        updateStore,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};