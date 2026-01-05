import { STORAGE_KEYS } from '@/utils/storageKeys';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const statusColors: Record<string, string> = {
  processing: '#3D9DE9',
  sent: '#0DA88A',
  delivered: '#18A155',
  returned: '#E10613',
};

const statusLabel: Record<string, string> = {
  processing: 'AGUARDA PAGAMENTO',
  sent: 'ENVIADO',
  delivered: 'ENTREGUE',
  returned: 'DEVOLVIDO',
};

export default function SearchResult() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [results, setResults] = useState<any[]>([]);

  const load = useCallback(async () => {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.ORDERS);
    if (!stored) return;

    let orders = JSON.parse(stored);
    const orderIdParam =
      typeof params.orderId === 'string' ? params.orderId.trim().toUpperCase() : '';
    const trackingParam =
      typeof params.tracking === 'string' ? params.tracking.trim().toUpperCase() : '';
    const statusParam = typeof params.status === 'string' ? params.status : '';

    if (orderIdParam) {
      orders = orders.filter((o: any) => (o.id ?? '').toUpperCase().includes(orderIdParam));
    }

    if (trackingParam) {
      const normalizedTracking = trackingParam.replace(/^LGS-?/i, '');
      orders = orders.filter((o: any) =>
        `LGS-${o.id ?? ''}`.toUpperCase().includes(normalizedTracking)
      );
    }

    if (statusParam) {
      orders = orders.filter((o: any) => o.status === statusParam);
    }

    setResults(orders);
  }, [params.orderId, params.status, params.tracking]);

  useEffect(() => {
    load();
  }, [load]);

  const headingOrderId = useMemo(() => {
    if (params.orderId && typeof params.orderId === 'string' && params.orderId.trim()) {
      return params.orderId;
    }
    return results[0]?.id;
  }, [params.orderId, results]);

  return (
    <SafeAreaView style={[styles.safe, { paddingTop: insets.top }]} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.heroRow}>
          <View style={styles.heroTitles}>
            <Text style={styles.heroTitle}>ENCOMENDAS</Text>
            <Text style={styles.heroSubtitle}>Pedidos de Clientes</Text>
          </View>
          <View style={styles.heroActions}>
            <Pressable style={styles.circleBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={22} color="#1B2C48" />
            </Pressable>
            <Pressable style={styles.circleBtn} onPress={load}>
              <Ionicons name="reload" size={22} color="#1B2C48" />
            </Pressable>
          </View>
        </View>

        <View style={styles.resultHeaderCard}>
            <Text style={styles.resultTitle}>Resultados da Pesquisa</Text>
          {headingOrderId ? (
            <Text style={styles.resultSubtitle}>Pedido #{headingOrderId}</Text>
          ) : (
            <Text style={styles.resultSubtitle}>Todos os pedidos</Text>
          )}
        </View>

        <Pressable style={styles.searchButton} onPress={() => router.push('/(tabs)/supplier/orders/search')}>
          <Text style={styles.searchButtonText}>Pesquisar</Text>
        </Pressable>

        {results.map(order => (
          <View key={order.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.orderId}>Pedido #{order.id}</Text>
                <Text style={styles.tracking}>Nº. Expedição: LGS-{order.id}</Text>
              </View>
              <View style={styles.dateBadge}>
                <Text style={styles.dateText}>{order.date}</Text>
              </View>
            </View>

            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Estado:</Text>
              <View
                style={[
                  styles.statusPill,
                  { backgroundColor: statusColors[order.status] ?? '#3D9DE9' },
                ]}
              >
                <Text style={styles.statusPillText}>{statusLabel[order.status] ?? order.status}</Text>
              </View>
              <Pressable
                style={styles.viewButton}
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/supplier/orders/[id]',
                    params: { id: order.id, from: '/(tabs)/supplier/orders' },
                  })
                }
              >
                <Text style={styles.viewButtonText}>Ver</Text>
              </Pressable>
            </View>
          </View>
        ))}

        {results.length === 0 && (
          <Text style={styles.empty}>Nenhuma encomenda encontrada</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  container: {
    padding: 16,
    paddingBottom: 32,
    gap: 12,
  },

  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  heroTitles: { gap: 4 },
  heroTitle: { fontSize: 32, fontWeight: '800', color: '#1B2C48' },
  heroSubtitle: { fontSize: 17, color: '#555' },
  heroActions: { flexDirection: 'row', gap: 12 },
  circleBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  resultHeaderCard: {
    marginTop: 10,
    backgroundColor: '#F6F7FF',
    borderRadius: 18,
    padding: 16,
    gap: 4,
  },
  resultTitle: { fontSize: 26, fontWeight: '800', color: '#111' },
  resultSubtitle: { fontSize: 18, color: '#444' },

  searchButton: {
    marginTop: 8,
    backgroundColor: '#0A4CFF',
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonText: { color: '#fff', fontSize: 20, fontWeight: '700' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderId: { fontSize: 18, fontWeight: '800', color: '#222' },
  tracking: { marginTop: 2, fontSize: 14, color: '#333' },
  dateBadge: {
    backgroundColor: '#F2F4F7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  dateText: { fontSize: 13, color: '#1B2C48', fontWeight: '700' },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  statusLabel: { fontSize: 20, fontWeight: '800', color: '#222' },
  statusPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusPillText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  viewButton: {
    marginLeft: 'auto',
    backgroundColor: '#0A4CFF',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 10,
  },
  viewButtonText: { color: '#fff', fontWeight: '800', fontSize: 15 },

  empty: {
    textAlign: 'center',
    marginTop: 40,
    color: '#999',
  },
});
