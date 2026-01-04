import { getCurrentUser } from '@/utils/getCurrentUser';
import { Order } from '@/utils/orders';
import { STORAGE_KEYS } from '@/utils/storageKeys';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

const statusColors: Record<Order['orderStatus'], string> = {
  AGUARDA_PAGAMENTO: '#3D9DE9',
  EM_PROCESSAMENTO: '#0A4CFF',
  ENVIADO: '#0DA88A',
  ENTREGUE: '#18A155',
  DEVOLVIDO: '#E10613',
};

const statusLabel: Record<Order['orderStatus'], string> = {
  AGUARDA_PAGAMENTO: 'AGUARDA PAGAMENTO',
  EM_PROCESSAMENTO: 'EM PROCESSAMENTO',
  ENVIADO: 'ENVIADO',
  ENTREGUE: 'ENTREGUE',
  DEVOLVIDO: 'DEVOLVIDO',
};

type SupplierOrder = Order & { supplierItems: Order['items'] };

export default function SupplierOrders() {
  const router = useRouter();
  const [orders, setOrders] = useState<SupplierOrder[]>([]);

  const handleBack = useCallback(() => {
    // Evitar aviso de GO_BACK sem histórico
    if (router.canGoBack && router.canGoBack()) {
      router.back();
    } else {
      router.push('/store');
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [])
  );

  const loadOrders = useCallback(async () => {
    // Tentar sessão ativa (LOGGED_USER), depois fallback para USER (getCurrentUser)
    const rawLogged = await AsyncStorage.getItem('LOGGED_USER');
    const loggedUser = rawLogged ? JSON.parse(rawLogged) : null;

    const user =
      loggedUser && loggedUser.role === 'fornecedor'
        ? loggedUser
        : await getCurrentUser<{ id: number | string; role?: string }>();

    if (!user || user.role !== 'fornecedor') return;

    const supplierId = String(user.id ?? user?.user?.id ?? '');
    if (!supplierId) return;
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.ORDERS);
    if (!stored) return;

    const allOrders: Order[] = JSON.parse(stored);
    const supplierOrders: SupplierOrder[] = allOrders
      .filter(order => order.items.some(item => String(item.supplierId ?? '') === supplierId))
      .map(order => ({
        ...order,
        supplierItems: order.items.filter(item => String(item.supplierId ?? '') === supplierId),
      }))
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });

    setOrders(supplierOrders);
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.heroRow}>
          <View style={styles.heroTitles}>
            <Text style={styles.pageTitle}>ENCOMENDAS</Text>
          </View>

          <View style={styles.heroActions}>
            <Pressable style={styles.circleBtn} onPress={handleBack}>
              <Ionicons name="arrow-back" size={22} color="#1B2C48" />
            </Pressable>
            <Pressable style={styles.circleBtn} onPress={() => loadOrders()}>
              <Ionicons name="reload" size={22} color="#1B2C48" />
            </Pressable>
          </View>
        </View>

        <Pressable
          style={styles.searchButton}
          onPress={() => router.push('/(tabs)/supplier/orders/search')}
        >
          <Text style={styles.searchButtonText}>Pesquisar</Text>
        </Pressable>

        {orders.map((order, index) => (
          <View key={order.id} style={styles.cardBlock}>
            <View style={styles.orderHeaderRow}>
              <View>
                <Text style={styles.orderTitle}>Pedido #{order.id}</Text>
                <Text style={styles.trackingText}>
                  N°. Expedição: LGS-{order.id}
                </Text>
              </View>
              <View style={styles.dateBadge}>
                <Text style={styles.dateText}>
                  {order.createdAt ? new Date(order.createdAt).toLocaleDateString('pt-PT') : '--'}
                </Text>
              </View>
            </View>

            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Estado:</Text>
              <View
                style={[
                  styles.statusPill,
                  { backgroundColor: statusColors[order.orderStatus] ?? '#3D9DE9' },
                ]}
              >
                <Text style={styles.statusPillText}>
                  {statusLabel[order.orderStatus] ?? order.orderStatus}
                </Text>
              </View>
              <Pressable
                style={styles.viewButton}
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/supplier/orders/[id]',
                    params: { id: order.id },
                  })
                }
              >
                <Text style={styles.viewButtonText}>Ver</Text>
              </Pressable>
            </View>

            <View style={styles.itemsBlock}>
              {order.supplierItems.map(item => (
                <View key={`${order.id}-${item.productId}`} style={styles.itemRow}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemQty}>x{item.quantity}</Text>
                  <Text style={styles.itemPrice}>€{item.price.toFixed(2)}</Text>
                </View>
              ))}
            </View>

            {index < orders.length - 1 && <View style={styles.separator} />}
          </View>
        ))}

        {orders.length === 0 && (
          <Text style={styles.empty}>Sem encomendas.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F9FC' },
  container: {
    padding: 20,
    gap: 12,
  },

  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitles: { gap: 4 },
  pageTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#1B2C48',
  },
  pageSubtitle: {
    fontSize: 16,
    color: '#4A5568',
  },
  heroActions: { flexDirection: 'row', gap: 12 },
  circleBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  searchButton: {
    height: 56,
    borderRadius: 14,
    backgroundColor: '#0A4CFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },

  cardBlock: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  orderHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#222',
  },
  trackingText: {
    marginTop: 4,
    fontSize: 14,
    color: '#444',
  },
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
  statusLabel: {
    fontSize: 20,
    fontWeight: '800',
    color: '#222',
  },
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
  viewButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },

  separator: {
    marginTop: 14,
    height: 1,
    backgroundColor: '#1E6CFD',
  },

  empty: { textAlign: 'center', marginTop: 20, color: '#777' },
  itemsBlock: { marginTop: 12, gap: 6 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  itemName: { flex: 1, fontSize: 14, fontWeight: '700', color: '#222' },
  itemQty: { fontSize: 13, color: '#555' },
  itemPrice: { fontSize: 14, fontWeight: '700', color: '#0A4CFF' },
});
