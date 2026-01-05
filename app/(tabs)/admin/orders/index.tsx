import { useAdminGuard } from '@/hooks/useAdminGuard';
import { STORAGE_KEYS } from '@/utils/storageKeys';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View
} from 'react-native';

type OrderItem = {
  productId: number;
  name: string;
  quantity: number;
  price: number;
  image?: string;
};

type Order = {
  id: string;
  userId?: string;
  items: OrderItem[];
  total: number;
  paymentStatus: 'PENDENTE' | 'PAGO';
  orderStatus:
    | 'AGUARDA_PAGAMENTO'
    | 'EM_PROCESSAMENTO'
    | 'ENVIADO'
    | 'ENTREGUE'
    | 'DEVOLVIDO';
  createdAt: string;
};

type UserLite = { id?: string; name?: string };

const statusLabel: Record<Order['orderStatus'], string> = {
  AGUARDA_PAGAMENTO: 'Pendente',
  EM_PROCESSAMENTO: 'Processamento',
  ENVIADO: 'Enviado',
  ENTREGUE: 'Entregue',
  DEVOLVIDO: 'Devolução',
};

const statusColor: Record<Order['orderStatus'], string> = {
  AGUARDA_PAGAMENTO: '#f59e0b',
  EM_PROCESSAMENTO: '#0ea5e9',
  ENVIADO: '#2563eb',
  ENTREGUE: '#16a34a',
  DEVOLVIDO: '#f97316',
};

export default function AdminOrders() {
  useAdminGuard();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, UserLite>>({});

  const loadOrders = useCallback(async () => {
    const storedOrders = await AsyncStorage.getItem(STORAGE_KEYS.ORDERS);
    const parsedOrders: Order[] = storedOrders ? JSON.parse(storedOrders) : [];
    setOrders(parsedOrders);

    try {
      const storedUsers = await AsyncStorage.getItem('USERS');
      if (storedUsers) {
        const list: UserLite[] = JSON.parse(storedUsers);
        const map: Record<string, UserLite> = {};
        list.forEach(u => {
          if (u.id) map[String(u.id)] = u;
        });
        setUsersMap(map);
      }
    } catch {
      setUsersMap({});
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [loadOrders])
  );

  const filtered = useMemo(() => {
    let result = [...orders];

    // Sort by date descending
    return result.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [orders]);

  const renderItem = ({ item }: { item: Order }) => {
    const status = statusLabel[item.orderStatus] ?? item.orderStatus;
    const color = statusColor[item.orderStatus] ?? '#1f2937';
    const customer = item.userId ? usersMap[item.userId]?.name ?? 'Cliente' : 'Cliente';
    const itemsCount = item.items?.reduce((sum, i) => sum + (i.quantity || 0), 0) || 0;
    const isDelivered = item.orderStatus === 'ENTREGUE';

    return (
      <Pressable 
        style={styles.card}
        onPress={() => router.push({  pathname: '/admin/orders/[id]', params: { id: item.id } })}
      >
        <View style={styles.cardContent}>
          <View style={styles.cardInfo}>
            <Text style={styles.orderTitle}>Pedido #{item.id}</Text>

            <View style={styles.clientPill}>
              <Ionicons name="person-outline" size={14} color="#1f2937" />
              <Text style={styles.clientText}>{customer}</Text>
            </View>

            <View style={styles.statusContainer}>
              <Text style={[styles.statusText, { color }]}>{status}</Text>
              {item.orderStatus === 'ENTREGUE' && (
                <Ionicons name="checkmark-circle" size={20} color={color} />
              )}
            </View>
          </View>

          <View style={styles.rightSection}>
            <View style={styles.itemsBadge}>
              <Text style={styles.itemsText}>{itemsCount} items</Text>
            </View>

            <Pressable 
              style={[styles.viewBtn, isDelivered && styles.viewBtnOutline]}
              onPress={() => router.push({  pathname: '/admin/orders/[id]', params: { id: item.id } })}
            >
              <Text style={[styles.viewBtnText, isDelivered && styles.viewBtnTextOutline]}>Ver</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable style={styles.roundBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#1B2C48" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Pedidos</Text>
          <Text style={styles.subtitle}>Pesquisa e filtros</Text>
        </View>
        <Pressable style={styles.roundBtn} onPress={() => router.push('/admin/search-order')}>
          <Ionicons name="search" size={20} color="#1B2C48" />
        </Pressable>
        <Pressable style={styles.roundBtn} onPress={loadOrders}>
          <Ionicons name="reload" size={20} color="#1B2C48" />
        </Pressable>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>Sem encomendas.</Text>}
        scrollEnabled={true}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: { fontSize: 20, fontWeight: '800', color: '#111' },
  subtitle: { fontSize: 13, color: '#999', marginTop: 2 },
  roundBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
    minWidth: 0,
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111',
  },
  filterToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterToggleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
  },
  filtersPanel: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterRow: {
    gap: 10,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
    textTransform: 'uppercase',
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  filterOptionActive: {
    borderColor: '#004CFF',
    backgroundColor: '#EEF2FF',
  },
  filterOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  filterOptionTextActive: {
    color: '#004CFF',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 12,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  rightSection: {
    alignItems: 'flex-end',
    gap: 8,
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderTitle: { 
    fontSize: 16, 
    fontWeight: '800', 
    color: '#111',
    flex: 1,
  },
  itemsBadge: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  itemsText: { 
    fontWeight: '700', 
    color: '#111',
    fontSize: 13,
  },
  clientPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  clientText: { 
    color: '#111', 
    fontWeight: '600',
    fontSize: 13,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: { 
    fontSize: 16, 
    fontWeight: '800',
  },
  viewBtn: {
    backgroundColor: '#0A4CFF',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewBtnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#0A4CFF',
  },
  viewBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  viewBtnTextOutline: {
    color: '#0A4CFF',
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  empty: {
    textAlign: 'center',
    marginTop: 24,
    color: '#666',
    fontSize: 15,
  },
});
