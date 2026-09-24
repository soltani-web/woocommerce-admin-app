import React, { useState, useEffect, useCallback } from 'react';
import { I18nManager, StatusBar, View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { StoreProvider } from './src/context/StoreContext';
import { LicenseService, LicenseData } from './src/services/licenseService';

// Screens
import { DashboardScreen } from './src/screens/DashboardScreen';
import { OrdersScreen } from './src/screens/OrdersScreen';
import { OrderDetailScreen } from './src/screens/OrderDetailScreen';
import { ProductsScreen } from './src/screens/ProductsScreen';
import { CustomersScreen } from './src/screens/CustomersScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { LicenseActivationScreen } from './src/screens/LicenseActivationScreen';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {});

// Icons
import { LayoutDashboard, ShoppingCart, Package, Users, Settings } from 'lucide-react-native';

// Force RTL layout
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function OrdersStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTitleAlign: 'center',
        headerBackTitle: 'بازگشت',
        headerStyle: { backgroundColor: '#ffffff' },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="OrdersList"
        component={OrdersScreen}
        options={{ title: 'مدیریت سفارش‌ها' }}
      />
      <Stack.Screen
        name="OrderDetail"
        component={OrderDetailScreen}
        options={{ title: 'جزئیات سفارش' }}
      />
    </Stack.Navigator>
  );
}

function MainTabs() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 8);

  return (
    <Tab.Navigator
      screenOptions={{
        headerTitleAlign: 'center',
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          height: 60 + (insets.bottom > 0 ? insets.bottom - 4 : 0),
          paddingBottom: bottomPadding,
          paddingTop: 8,
          backgroundColor: '#ffffff',
          borderTopColor: '#f1f5f9',
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: '#ffffff',
        },
        headerShadowVisible: false,
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardScreen}
        options={{
          title: 'داشبورد',
          headerTitle: 'پیشخوان فروشگاه',
          tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="OrdersTab"
        component={OrdersStackNavigator}
        options={{
          headerShown: false,
          title: 'سفارشات',
          tabBarIcon: ({ color, size }) => <ShoppingCart color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="ProductsTab"
        component={ProductsScreen}
        options={{
          title: 'محصولات',
          headerTitle: 'مدیریت محصولات و انبار',
          tabBarIcon: ({ color, size }) => <Package color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="CustomersTab"
        component={CustomersScreen}
        options={{
          title: 'مشتریان',
          headerTitle: 'لیست مشتریان',
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          title: 'تنظیمات',
          headerTitle: 'تنظیمات و فروشگاه‌ها',
          tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [license, setLicense] = useState<LicenseData | null>(null);
  const [isCheckingLicense, setIsCheckingLicense] = useState(true);

  useEffect(() => {
    checkLicense();
  }, []);

  const checkLicense = async () => {
    try {
      const result = await LicenseService.revalidateStoredLicense();
      if (result.isValid && result.data) {
        setLicense(result.data);
      } else {
        setLicense(null);
      }
    } catch (e) {
      console.error('License check error:', e);
      setLicense(null);
    } finally {
      setIsCheckingLicense(false);
      await SplashScreen.hideAsync().catch(() => {});
    }
  };

  if (isCheckingLicense) {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      </SafeAreaProvider>
    );
  }

  // اگر لایسنس تایید نشده باشد، صفحه قفل و فعال‌سازی نمایش داده می‌شود
  if (!license) {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
        <LicenseActivationScreen onSuccess={checkLicense} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <StoreProvider>
        <NavigationContainer>
          <MainTabs />
        </NavigationContainer>
      </StoreProvider>
    </SafeAreaProvider>
  );
}