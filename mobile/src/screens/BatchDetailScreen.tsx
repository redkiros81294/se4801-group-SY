import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity
} from 'react-native';
import { COLORS, globalStyles } from '../theme';
import api from '../services/api';

interface ChainEvent {
  eventType: string;
  timestamp: string;
  fromOrgName?: string;
  toOrgName?: string;
  signatureHash?: string;
}

export default function BatchDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [events, setEvents] = useState<ChainEvent[]>([]);
  const [valid, setValid] = useState(false);
  const [batch, setBatch] = useState<{ batchNumber?: string; productName?: string; status?: string } | null>(null);

  useEffect(() => {
    if (!id) return;
    api.get(`/batches/${id}`)
      .then((res) => {
        setBatch({
          batchNumber: res.data?.batchNumber,
          productName: res.data?.productName,
          status: res.data?.status
        });
        setEvents(res.data?.transactions ?? []);
        setValid(res.data?.chainValid ?? false);
      })
      .catch(() => {
        setBatch(null);
        setEvents([]);
        setValid(false);
      });
  }, [id]);

  const renderItem = ({ item, index }: { item: ChainEvent; index: number }) => (
    <View style={styles.eventCard}>
      <View style={styles.eventHeader}>
        <Text style={styles.eventType}>{item.eventType}</Text>
        <Text style={styles.timestamp}>{new Date(item.timestamp).toLocaleString()}</Text>
      </View>
      <Text style={styles.org}>
        {item.fromOrgName ?? 'Genesis'} → {item.toOrgName ?? 'Pending'}
      </Text>
      {item.signatureHash ? (
        <Text style={styles.hash} numberOfLines={1}>
          SHA-256 {item.signatureHash.slice(0, 24)}…
        </Text>
      ) : null}
      {index < (events?.length ?? 0) - 1 ? <View style={styles.connector} /> : null}
    </View>
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
        <Text style={globalStyles.title}>Provenance</Text>

        {batch ? (
          <View style={styles.metaCard}>
            <View style={styles.metaRow}>
              <View style={styles.metaBlock}>
                <Text style={styles.metaLabel}>Batch</Text>
                <Text style={styles.metaValue}>{batch.batchNumber ?? '--'}</Text>
              </View>
              <View style={styles.metaBlock}>
                <Text style={styles.metaLabel}>Product</Text>
                <Text style={styles.metaValue}>{batch.productName ?? '--'}</Text>
              </View>
              <View style={styles.metaBlock}>
                <Text style={styles.metaLabel}>Status</Text>
                <Text style={[styles.metaValue, valid ? styles.green : styles.red]}>
                  {batch.status ?? '--'}
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        <View style={[styles.statusBanner, { backgroundColor: valid ? COLORS.green : COLORS.red }]}>
          <Text style={styles.statusText}>{valid ? 'VERIFIED' : 'COMPROMISED'}</Text>
        </View>

        {events.length === 0 ? (
          <Text style={globalStyles.body}>No transactions recorded yet.</Text>
        ) : (
          <FlatList
            data={events}
            keyExtractor={(item, index) => `${item.signatureHash ?? item.timestamp}-${index}`}
            renderItem={renderItem}
            contentContainerStyle={{ gap: 12 }}
          />
        )}

        <TouchableOpacity
          style={[globalStyles.button, styles.floatingAction]}
          onPress={() => router.push('/movement')}
        >
          <Text style={globalStyles.buttonText}>Log Movement</Text>
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
  statusBanner: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 16
  },
  statusText: {
    color: COLORS.textPrimary,
    fontWeight: '700'
  },
  metaCard: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12
  },
  metaBlock: {
    flex: 1
  },
  metaLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    textTransform: 'uppercase'
  },
  metaValue: {
    color: COLORS.textPrimary,
    marginTop: 4,
    fontWeight: '600'
  },
  green: {
    color: COLORS.green
  },
  red: {
    color: COLORS.red
  },
  eventCard: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  eventType: {
    color: COLORS.cyan,
    fontWeight: '700'
  },
  timestamp: {
    color: COLORS.textMuted,
    fontSize: 12
  },
  org: {
    color: COLORS.textSecondary,
    marginBottom: 6
  },
  hash: {
    color: COLORS.textMuted,
    fontFamily: 'Courier',
    fontSize: 12
  },
  connector: {
    height: 1,
    backgroundColor: COLORS.border,
    marginTop: 12,
    marginLeft: 16
  },
  floatingAction: {
    marginTop: 16,
    marginBottom: 32
  }
});
