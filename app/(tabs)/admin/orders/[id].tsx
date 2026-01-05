import { STORAGE_KEYS } from '@/utils/storageKeys';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type OrderItem = {
  productId: number;
  name: string;
  quantity: number;
  price: number;
  supplierId?: string;
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

const NEXT_STATUS: Record<Order['orderStatus'], Order['orderStatus'] | null> = {
  AGUARDA_PAGAMENTO: 'EM_PROCESSAMENTO',
  EM_PROCESSAMENTO: 'ENVIADO',
  ENVIADO: 'ENTREGUE',
  ENTREGUE: null,
  DEVOLVIDO: null,
};

const STATUS_LABEL: Record<Order['orderStatus'], string> = {
  AGUARDA_PAGAMENTO: 'Aguarda pagamento',
  EM_PROCESSAMENTO: 'Em processamento',
  ENVIADO: 'Enviado',
  ENTREGUE: 'Entregue',
  DEVOLVIDO: 'Devolvido',
};

export default function OrderDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const rawUser = await AsyncStorage.getItem('LOGGED_USER');
      if (!rawUser) {
        router.replace('/');
        return;
      }

      const parsedUser = JSON.parse(rawUser);
      if (parsedUser.role !== 'fornecedor' && parsedUser.role !== 'admin') {
        router.replace('/');
        return;
      }

      setUser(parsedUser);

      const stored = await AsyncStorage.getItem(STORAGE_KEYS.ORDERS);
      const orders: Order[] = stored ? JSON.parse(stored) : [];
      const found = orders.find(o => String(o.id) === String(id));

      if (!found) {
        Alert.alert('Erro', 'Encomenda não encontrada');
        router.back();
        return;
      }

      setOrder(found);
      setLoading(false);
    };

    load();
  }, [id]);

  const itemsToShow = useMemo(() => {
    if (!order || !user) return [];
    if (user.role === 'admin') return order.items;

    return order.items.filter(
      it => String(it.supplierId) === String(user.id)
    );
  }, [order, user]);

  const subtotal = useMemo(() => {
    return itemsToShow.reduce(
      (sum, it) => sum + it.price * it.quantity,
      0
    );
  }, [itemsToShow]);

  const advanceStatus = async () => {
    if (!order) return;

    const next = NEXT_STATUS[order.orderStatus];
    if (!next) return;

    const stored = await AsyncStorage.getItem(STORAGE_KEYS.ORDERS);
    const orders: Order[] = stored ? JSON.parse(stored) : [];

    const updated = orders.map(o =>
      o.id === order.id ? { ...o, orderStatus: next } : o
    );

    await AsyncStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updated));
    setOrder({ ...order, orderStatus: next });
  };

  if (loading || !order) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 12 }}>A carregar encomenda…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} />
        </Pressable>
        <Text style={styles.headerTitle}>Encomenda #{order.id}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* Estado */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Estado</Text>
          <Text>Pagamento: {order.paymentStatus}</Text>
          <Text>Encomenda: {STATUS_LABEL[order.orderStatus]}</Text>
        </View>

        {/* Itens */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Itens</Text>

          {itemsToShow.map(it => (
            <View key={it.productId} style={styles.itemRow}>
              <Text style={styles.itemName}>{it.name}</Text>
              <Text>
                {it.quantity} × €{it.price.toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        {/* Total */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Subtotal</Text>
          <Text style={styles.total}>€{subtotal.toFixed(2)}</Text>
        </View>

        {/* Botão */}
        {NEXT_STATUS[order.orderStatus] && (
          <Pressable style={styles.actionBtn} onPress={advanceStatus}>
            <Text style={styles.actionText}>
              Avançar para "{STATUS_LABEL[NEXT_STATUS[order.orderStatus]!]}"
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F6FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: { fontSize: 18, fontWeight: '800' },

  container: { padding: 20, paddingBottom: 40 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },

  sectionTitle: {
    fontWeight: '800',
    fontSize: 16,
    marginBottom: 8,
  },

  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  itemName: { fontWeight: '600' },

  total: { fontSize: 18, fontWeight: '900' },

  actionBtn: {
    backgroundColor: '#0A4CFF',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  actionText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
});
