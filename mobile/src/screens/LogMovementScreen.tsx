import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { COLORS, globalStyles } from '../theme';
import { authService } from '../services/auth';
import api from '../services/api';

interface BatchOption {
  id: string;
  batchNumber: string;
  productName?: string;
}

export default function LogMovementScreen() {
  const router = useRouter();
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [eventType, setEventType] = useState('SHIPPED');
  const [quantity, setQuantity] = useState('');
  const [toOrgId, setToOrgId] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingBatches, setLoadingBatches] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const token = await authService.getToken();
        if (!token) {
          router.replace('/login');
          return;
        }
        const response = await api.get('/batches');
        const data = response.data?.content ?? [];
        setBatches(data.map((b: any) => ({
          id: b.id,
          batchNumber: b.batchNumber,
          productName: b.productName
        })));
      } catch (e) {
        console.error('Failed to load batches', e);
      } finally {
        setLoadingBatches(false);
      }
    })();
  }, [router]);

  const handleSubmit = async () => {
    if (!selectedBatchId) {
      setError('Select a batch');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.post('/transactions', {
        batchId: selectedBatchId,
        eventType,
        quantity: Number(quantity),
        toOrgId: toOrgId || null
      });
      setSuccess('Movement logged successfully');
      setSelectedBatchId('');
      setQuantity('');
      setToOrgId('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to log movement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={globalStyles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.brand}>ChainTrack</Text>
      </View>
      <ScrollView style={globalStyles.container}>
        <Text style={globalStyles.title}>Log Movement</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {success ? <Text style={styles.success}>{success}</Text> : null}

        <Text style={styles.label}>Batch</Text>
        {loadingBatches ? (
          <Text style={styles.helpText}>Loading batches...</Text>
        ) : batches.length === 0 ? (
          <Text style={styles.helpText}>No batches available.</Text>
        ) : (
          <ScrollView horizontal style={styles.batchList} showsHorizontalScrollIndicator={false}>
            {batches.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.batchChip,
                  selectedBatchId === item.id && styles.batchChipSelected
                ]}
                onPress={() => setSelectedBatchId(item.id)}
              >
                <Text style={[
                  styles.batchChipText,
                  selectedBatchId === item.id && styles.batchChipTextSelected
                ]}>
                  {item.batchNumber}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <Text style={styles.label}>Event Type</Text>
        <TextInput
          style={globalStyles.input}
          value={eventType}
          onChangeText={setEventType}
          placeholder="SHIPPED / IN_TRANSIT / RECEIVED"
          placeholderTextColor={COLORS.textMuted}
          autoCapitalize="characters"
        />

        <Text style={styles.label}>Quantity</Text>
        <TextInput
          style={globalStyles.input}
          value={quantity}
          onChangeText={setQuantity}
          placeholder="0"
          placeholderTextColor={COLORS.textMuted}
          keyboardType="numeric"
        />

        <Text style={styles.label}>To Organization ID (optional)</Text>
        <TextInput
          style={globalStyles.input}
          value={toOrgId}
          onChangeText={setToOrgId}
          placeholder="Org UUID"
          placeholderTextColor={COLORS.textMuted}
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={[globalStyles.button, styles.submitButton]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.textPrimary} />
          ) : (
            <Text style={globalStyles.buttonText}>Log Movement</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  brand: {
    color: COLORS.cyan,
    fontSize: 18,
    fontWeight: '700'
  },
  backLink: {
    color: COLORS.textSecondary,
    fontSize: 14
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 6,
    textTransform: 'uppercase'
  },
  submitButton: {
    marginTop: 16,
    marginBottom: 32
  },
  error: {
    color: COLORS.red,
    marginBottom: 12
  },
  success: {
    color: COLORS.green,
    marginBottom: 12,
    fontWeight: '600'
  },
  batchList: {
    maxHeight: 120,
    marginBottom: 12
  },
  batchChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgTertiary,
    marginRight: 8
  },
  batchChipSelected: {
    backgroundColor: COLORS.cyan,
    borderColor: COLORS.cyan
  },
  batchChipText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600'
  },
  batchChipTextSelected: {
    color: COLORS.bgPrimary
  },
  helpText: {
    color: COLORS.textMuted,
    marginBottom: 12
  }
});
