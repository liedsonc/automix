import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/* ===================== HELPERS ===================== */

const formatPrice = (value: number) => `€${value.toFixed(2)}`;

type OrderItem = {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  discount?: boolean;
  discountValue?: number;
};

type Order = {
  id: string;
  deliveryAddress: {
    address: string;
    city: string;
    postcode: string;
  };
  contact: {
    name: string;
    email: string;
    phone: string;
  };
  items: OrderItem[];
  shipping: {
    type: 'standard' | 'premium';
    price: number;
    estimate: string;
  };
  total: number;
  paymentStatus: 'PENDENTE' | 'PAGO';
  orderStatus:
    | 'AGUARDA_PAGAMENTO'
    | 'EM_PROCESSAMENTO'
    | 'ENVIADO'
    | 'ENTREGUE'
    | 'DEVOLVIDO';
  reviewed?: boolean;
};

const NEXT_ACTION_LABEL: Record<Order['orderStatus'], string | null> = {
  AGUARDA_PAGAMENTO: null,
  EM_PROCESSAMENTO: 'Marcar como enviado',
  ENVIADO: 'Marcar como entregue',
  ENTREGUE: null,
  DEVOLVIDO: null,
};

const NEXT_STATUS: Record<Order['orderStatus'], Order['orderStatus'] | null> = {
  AGUARDA_PAGAMENTO: null,
  EM_PROCESSAMENTO: 'ENVIADO',
  ENVIADO: 'ENTREGUE',
  ENTREGUE: null,
  DEVOLVIDO: null,
};


const getFinalPrice = (item: OrderItem) => {
  if (!item.discount || !item.discountValue) return item.price;
  return item.price - (item.price * item.discountValue) / 100;
};

// ======== ORDER HELPERS ========
const ORDER_FLOW: Order['orderStatus'][] = [
  'AGUARDA_PAGAMENTO',
  'EM_PROCESSAMENTO',
  'ENVIADO',
  'ENTREGUE',
  'DEVOLVIDO',
];

const STATUS_LABEL: Record<Order['orderStatus'], string> = {
  AGUARDA_PAGAMENTO: 'Aguarda pagamento',
  EM_PROCESSAMENTO: 'Em processamento',
  ENVIADO: 'Enviado',
  ENTREGUE: 'Entregue',
  DEVOLVIDO: 'Devolvido',
};


function OrderProgress({ status }: { status: Order['orderStatus'] }) {
  const currentStep = ORDER_FLOW.indexOf(status);

  return (
    <View style={styles.wrapper}>
      <View style={styles.lineBg} />
      <View
        style={[
          styles.lineActive,
          { width: `${(currentStep / (ORDER_FLOW.length - 1)) * 100}%` },
        ]}
      />

      <View style={styles.dotsRow}>
        {ORDER_FLOW.map((s, index) => {
          const active = index <= currentStep;
          return (
            <View key={s} style={styles.dotWrapper}>
              <View
                style={[
                  styles.dot,
                  active && styles.dotActive,
                ]}
              />
              <Text
                style={[
                  styles.label,
                  active && styles.labelActive,
                ]}
              >
                {STATUS_LABEL[s]}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

/* ===================== COMPONENT ===================== */

export default function OrderDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const stored = await AsyncStorage.getItem('ORDERS');
      if (!stored) {
        setLoading(false);
        return;
      }
      const orders: Order[] = JSON.parse(stored);
      const found = orders.find(o => String(o.id) === String(id));
      if (found) setOrder(found);
      setLoading(false);
    };

    load();
  }, [id]);

  const handleUpdateStatus = async () => {
    if (!order) return;
    const next = NEXT_STATUS[order.orderStatus];
    if (!next) return;

    const stored = await AsyncStorage.getItem('ORDERS');
    if (!stored) return;

    const orders: Order[] = JSON.parse(stored);
    const updated = orders.map(o =>
      o.id === order.id ? { ...o, orderStatus: next } : o
    );

    await AsyncStorage.setItem('ORDERS', JSON.stringify(updated));
    setOrder({ ...order, orderStatus: next });
  };

  /* ===================== STATES ===================== */

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0A4CFF" />
          <Text style={styles.loadingText}>A carregar encomenda...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text>Encomenda não encontrada.</Text>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>Voltar</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const canAdvance =
    order.orderStatus === 'EM_PROCESSAMENTO' ||
    order.orderStatus === 'ENVIADO';

  /* ===================== UI ===================== */

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </Pressable>
          <Text style={styles.title}>Encomenda {order.id}</Text>
        </View>

        <OrderProgress status={order.orderStatus} />

        {/* Estado */}
        <View style={styles.card}>
          <Text style={styles.section}>Estado</Text>
          <Text style={styles.value}>Pagamento: {order.paymentStatus}</Text>
          <Text style={styles.value}>Encomenda: {order.orderStatus}</Text>
        </View>

        {/* Morada */}
        <View style={styles.card}>
          <Text style={styles.section}>Entrega</Text>
          <Text style={styles.value}>{order.deliveryAddress.address}</Text>
          <Text style={styles.value}>
            {order.deliveryAddress.city},{' '}
            {order.deliveryAddress.postcode}
          </Text>
        </View>

        {/* Contacto */}
        <View style={styles.card}>
          <Text style={styles.section}>Contacto</Text>
          <Text style={styles.value}>{order.contact.name}</Text>
          <Text style={styles.value}>{order.contact.email}</Text>
          <Text style={styles.value}>{order.contact.phone}</Text>
        </View>

        {/* Itens */}
        <View style={styles.card}>
          <Text style={styles.section}>Itens</Text>

          {order.items.map(item => {
            const finalPrice = getFinalPrice(item);
            const itemTotal = finalPrice * item.quantity;

            return (
              <View key={item.productId} style={styles.itemRow}>
                <Image
                  source={{ uri: item.image || 'https://via.placeholder.com/80' }}
                  style={styles.itemImg}
                />

                <View style={{ flex: 1 }}>
                  <Text style={styles.value}>{item.name}</Text>

                  {item.discount && item.discountValue ? (
                    <>
                      <Text style={styles.oldPrice}>
                        {formatPrice(item.price)}
                      </Text>
                      <Text style={styles.subValue}>
                        {item.quantity} x {formatPrice(finalPrice)}
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.subValue}>
                      {item.quantity} x {formatPrice(item.price)}
                    </Text>
                  )}
                </View>

                <Text style={styles.value}>
                  {formatPrice(itemTotal)}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Total */}
        <View style={styles.card}>
          <Text style={styles.section}>Total</Text>
          <Text style={styles.total}>{formatPrice(order.total)}</Text>
        </View>

        {/* Botão atualizar estado */}
        {NEXT_ACTION_LABEL[order.orderStatus] && (
          <Pressable
            style={[styles.updateBtn, !canAdvance && { opacity: 0.4 }]}
            disabled={!canAdvance}
            onPress={handleUpdateStatus}
          >
            <Text style={styles.updateBtnText}>
              {NEXT_ACTION_LABEL[order.orderStatus]}
            </Text>
          </Pressable>
        )}

        {/* Avaliar */}
        {order.orderStatus === 'ENTREGUE' && !order.reviewed && (
          <Pressable
            style={styles.reviewBtn}
            onPress={() =>
              router.push(`/order/review?id=${order.id}`)
            }
          >
            <Text style={styles.reviewBtnText}>⭐ Avaliar produtos</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ===================== STYLES ===================== */

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#444',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0A4CFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
  },
  section: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 8,
  },
  value: {
    fontSize: 14,
    color: '#333',
  },
  subValue: {
    fontSize: 12,
    color: '#777',
  },
  oldPrice: {
    fontSize: 11,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  itemImg: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: '#EEE',
    marginRight: 12,
  },
  total: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0A4CFF',
  },
  updateBtn: {
    backgroundColor: '#0A4CFF',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  updateBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  reviewBtn: {
    backgroundColor: '#FFB800',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 14,
  },
  reviewBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  backBtn: {
    marginTop: 16,
    backgroundColor: '#0A4CFF',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  backText: {
    color: '#fff',
    fontWeight: '700',
  },

  wrapper: {
    marginBottom: 28,
    paddingTop: 16,
  },

  lineBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E0E3EB',
    position: 'absolute',
    top: 22,
    left: 0,
    right: 0,
  },

  lineActive: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0A4CFF',
    position: 'absolute',
    top: 22,
    left: 0,
  },

  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  dotWrapper: {
    alignItems: 'center',
    width: '20%',
  },

  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#E0E3EB',
    marginBottom: 6,
  },

  dotActive: {
    backgroundColor: '#0A4CFF',
  },

  label: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
  },

  labelActive: {
    color: '#0A4CFF',
    fontWeight: '700',
  },
});