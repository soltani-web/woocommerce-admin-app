import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { KeyRound, ShieldCheck, Smartphone, CheckCircle, HelpCircle } from 'lucide-react-native';
import { LicenseService, getDeviceId } from '../services/licenseService';

interface Props {
  onSuccess: () => void;
}

export const LicenseActivationScreen: React.FC<Props> = ({ onSuccess }) => {
  const [licenseKey, setLicenseKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [deviceId, setDeviceId] = useState('');

  useEffect(() => {
    getDeviceId().then(setDeviceId);
  }, []);

  const handleActivate = async () => {
    if (!licenseKey.trim()) {
      Alert.alert('خطا', 'لطفاً کد لایسنس را وارد نمایید.');
      return;
    }

    setIsLoading(true);
    const result = await LicenseService.verifyAndActivate(licenseKey);
    setIsLoading(false);

    if (result.success) {
      Alert.alert('فعال‌سازی موفق', result.message, [
        {
          text: 'ورود به اپلیکیشن',
          onPress: onSuccess,
        },
      ]);
    } else {
      Alert.alert('خطای فعال‌سازی', result.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.iconCircle}>
          <KeyRound size={40} color="#2563eb" />
        </View>

        <Text style={styles.title}>فعال‌سازی لایسنس اپلیکیشن</Text>
        <Text style={styles.subtitle}>
          برای استفاده از امکانات مدیریت ووکامرس، لطفاً کد لایسنس دریافتی خود را وارد نمایید.
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>کد لایسنس شما</Text>
          <TextInput
            style={styles.input}
            placeholder="مثلاً: WCAPP-8F3A-99B2-41CD"
            placeholderTextColor="#94a3b8"
            value={licenseKey}
            onChangeText={setLicenseKey}
            autoCapitalize="characters"
            autoCorrect={false}
          />

          <TouchableOpacity
            style={[styles.btn, isLoading && styles.btnDisabled]}
            onPress={handleActivate}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.btnText}>تایید و فعال‌سازی</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Security badge & Device Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoText}>شناسه امنیتی دستگاه: {deviceId ? deviceId.slice(0, 16) + '...' : 'در حال شناسایی...'}</Text>
            <Smartphone size={16} color="#64748b" style={{ marginLeft: 6 }} />
          </View>
          <View style={[styles.infoRow, { marginTop: 8 }]}>
            <Text style={styles.infoText}>لایسنس به سخت‌افزار این گوشی قفل خواهد شد.</Text>
            <ShieldCheck size={16} color="#16a34a" style={{ marginLeft: 6 }} />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100%',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  card: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'right',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 16,
  },
  btn: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnDisabled: {
    backgroundColor: '#93c5fd',
  },
  btnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  infoCard: {
    width: '100%',
    marginTop: 20,
    backgroundColor: '#f1f5f9',
    borderRadius: 14,
    padding: 14,
  },
  infoRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'right',
  },
});