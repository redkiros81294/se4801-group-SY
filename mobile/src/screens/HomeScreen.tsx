import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, globalStyles } from '../theme';
import { authService } from '../services/auth';

export default function HomeScreen() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const token = await authService.getToken();
      if (token) {
        router.replace('/batches');
      }
    })();
  }, [router]);

  return (
    <View style={globalStyles.screen}>
      <View style={styles.header}>
        <Text style={styles.brand}>ChainTrack</Text>
      </View>
      <View style={globalStyles.container}>
        <Text style={styles.title}>Supply Chain Provenance</Text>
        <Text style={styles.subtitle}>
          Scan QR codes to verify product authenticity and traceability.
        </Text>
        <TouchableOpacity
          style={[globalStyles.button, styles.primaryButton]}
          onPress={() => router.push('/verify')}
        >
          <Text style={globalStyles.buttonText}>Scan / Verify QR</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[globalStyles.secondaryButton, styles.secondaryButton]}
          onPress={() => router.push('/login')}
        >
          <Text style={globalStyles.secondaryButtonText}>Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.bgSecondary,
    alignItems: 'center'
  },
  brand: {
    color: COLORS.cyan,
    fontSize: 20,
    fontWeight: '700'
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12
  },
  subtitle: {
    color: COLORS.textSecondary,
    marginBottom: 24,
    textAlign: 'center'
  },
  primaryButton: {
    marginBottom: 12
  },
  secondaryButton: {
    marginBottom: 12
  }
});
