import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { COLORS, globalStyles } from '../theme';
import { authService } from '../services/auth';
import api from '../services/api';

interface Batch {
  id: string;
  batchNumber: string;
  status: string;
  productName?: string;
}

export default function BatchesScreen() {
  const router = useRouter();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await authService.getToken();
      if (!token) {
        router.replace('/login');
        return;
      }
      try {
        const response = await api.get('/batches');
        const data = response.data?.content ?? [];
        setBatches(data.map((b: any) => ({
          id: b.id,
          batchNumber: b.batchNumber,
          status: b.status,
          productName: b.productName
        })));
      } catch (e) {
        console.error('Failed to load batches', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const renderItem = ({ item }: { item: Batch }) => (
    <TouchableOpacity
      style={globalStyles.card}
      onPress={() => router.push(`/batch/${item.id}`)}
    >
      <Text style={styles.batchNumber}>{item.batchNumber}</Text>
      <Text style={styles.productName}>{item.productName ?? 'Batch'}</Text>
      <Text style={[styles.status, { color: COLORS.green }]}>{item.status}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={globalStyles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.brand}>ChainTrack</Text>
      </View>
      <View style={globalStyles.container}>
        <Text style={globalStyles.title}>My Batches</Text>
        {loading ? (
          <Text style={globalStyles.body}>Loading...</Text>
        ) : batches.length === 0 ? (
          <Text style={globalStyles.body}>No batches found.</Text>
        ) : (
          <FlatList
            data={batches}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ gap: 12 }}
          />
        )}
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
  batchNumber: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600'
  },
  productName: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 4
  },
  status: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
    textTransform: 'uppercase'
  }
});
