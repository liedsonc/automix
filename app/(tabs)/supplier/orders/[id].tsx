import { getCurrentUser } from '@/utils/getCurrentUser';
import { Order } from '@/utils/orders';
import { STORAGE_KEYS } from '@/utils/storageKeys';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

const statusColors: Record<string, string> = {
  AGUARDA_PAGAMENTO: '#3D9DE9',
  EM_PROCESSAMENTO: '#0A4CFF',
  ENVIADO: '#0DA88A',
  ENTREGUE: '#18A155',
  DEVOLVIDO: '#E10613',
};

const statusLabel: Record<string, string> = {
  AGUARDA_PAGAMENTO: 'AGUARDA PAGAMENTO',
  EM_PROCESSAMENTO: 'EM PROCESSAMENTO',
  ENVIADO: 'ENVIADO',
  ENTREGUE: 'ENTREGUE',
  DEVOLVIDO: 'DEVOLVIDO',
};

const getFinalPrice = (item: any) => {
  if (!item.discount || !item.discountValue) return item.price;
  return item.price - (item.price * item.discountValue) / 100;
};

const notifyCustomer = async (orderId: string, userId: string | undefined, newStatus: string) => {
  if (!userId) return;
  
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    const notifications = stored ? JSON.parse(stored) : [];
    
    const notification = {
      id: `order-${orderId}-${Date.now()}`,
      userId,
      title: 'Atualização de Encomenda',
      message: `O seu pedido #${orderId} foi atualizado para: ${statusLabel[newStatus] || newStatus}`,
      orderId,
      status: newStatus,
      read: false,
      createdAt: new Date().toISOString(),
    };
    
    notifications.push(notification);
    await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  } catch (error) {
    console.error('Error notifying customer:', error);
  }
};

export default function SupplierOrderDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<any | null>(null);
  const [supplierItems, setSupplierItems] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!id) return;

      // supplier session
      const rawLogged = await AsyncStorage.getItem('LOGGED_USER');
      const loggedUser = rawLogged ? JSON.parse(rawLogged) : null;
      const user =
        loggedUser && loggedUser.role === 'fornecedor'
          ? loggedUser
          : await getCurrentUser<{ id: string | number; role?: string }>();

      if (!user || user.role !== 'fornecedor') {
        router.replace('/');
        return;
      }

      const supplierId = String(user.id ?? user?.user?.id ?? '');
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.ORDERS);
      const orders: Order[] = raw ? JSON.parse(raw) : [];
      const found = orders.find(o => String(o.id) === String(id));
      if (!found) {
        setOrder(null);
        return;
      }

      const itemsForSupplier = (found.items || []).filter(
        (it: any) => String(it.supplierId ?? '') === supplierId
      );

      setOrder(found);
      setSupplierItems(itemsForSupplier);
    };

    load();
  }, [id, router]);

  const subtotal = useMemo(
    () => supplierItems.reduce((sum, it) => {
      const finalPrice = getFinalPrice(it);
      return sum + finalPrice * (it.quantity || 0);
    }, 0),
    [supplierItems]
  );
  const shippingType = (order?.shipping?.type as string) || 'standard';
  const shipping = typeof order?.shipping?.price === 'number'
    ? Number(order.shipping.price)
    : shippingType === 'premium'
    ? 7
    : 0;
  const total = subtotal + shipping;

  if (!order) {
    return (
      <SafeAreaView style={styles.safe}> 
        <View style={styles.center}> 
          <Text>Encomenda não encontrada.</Text>
          <Pressable onPress={() => router.back()} style={{ marginTop: 12 }}>
            <Text style={{ color: '#0A4CFF', fontWeight: '700' }}>Voltar</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Máquina de estados para avanço permitido
  const NEXT_STATUS: Record<Order['orderStatus'], Order['orderStatus'] | null> = {
    AGUARDA_PAGAMENTO: null,
    EM_PROCESSAMENTO: 'ENVIADO',
    ENVIADO: 'ENTREGUE',
    ENTREGUE: null,
    DEVOLVIDO: null,
  };

  const handleUpdateStatus = async () => {
    if (!order) return;
    const next = NEXT_STATUS[order.orderStatus];
    if (!next) return;

    const raw = await AsyncStorage.getItem(STORAGE_KEYS.ORDERS);
    if (!raw) return;

    const orders: Order[] = JSON.parse(raw);
    const updatedOrders = orders.map(o =>
      String(o.id) === String(order.id)
        ? { ...o, orderStatus: next }
        : o
    );

    await AsyncStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updatedOrders));

    await notifyCustomer(order.id, order.userId, next);

    setOrder(prev => (prev ? { ...prev, orderStatus: next } : prev));
  };

  // Barra de progresso das fases da encomenda
  const orderFlow = [
    'AGUARDA_PAGAMENTO',
    'EM_PROCESSAMENTO',
    'ENVIADO',
    'ENTREGUE',
    'DEVOLVIDO',
  ];
  const currentStep = orderFlow.indexOf(order.orderStatus);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Pressable onPress={() => router.back()} style={styles.iconBtn}>
              <Ionicons name="arrow-back" size={22} color="#1B2C48" />
            </Pressable>
            <View>
              <Text style={styles.orderTitle}>ENCOMENDA #{order.id}</Text>
              <Text style={styles.tracking}>Nº Expedição: LGS-{order.id}</Text>
            </View>
          </View>

          {/* Barra de progresso das fases */}
          <View style={{ marginVertical: 18 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              {orderFlow.map((status, idx) => {
                const active = idx <= currentStep;
                return (
                  <View key={status} style={{ alignItems: 'center', flex: 1, position: 'relative' }}>
                    {/* Linha à esquerda (exceto o primeiro ponto) */}
                    {idx > 0 && (
                      <View
                        style={{
                          position: 'absolute',
                          left: -((100 / (orderFlow.length - 1)) / 2) + '%',
                          top: 8,
                          width: '100%',
                          height: 2,
                          backgroundColor: idx <= currentStep ? '#0A4CFF' : '#e0e0e0',
                          zIndex: -1,
                        }}
                      />
                    )}
                    <View
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 8,
                        backgroundColor: active ? '#0A4CFF' : '#e0e0e0',
                        borderWidth: 2,
                        borderColor: active ? '#0A4CFF' : '#e0e0e0',
                        marginBottom: 4,
                        alignSelf: 'center',
                      }}
                    />
                    <Text style={{ fontSize: 10, color: active ? '#0A4CFF' : '#888', textAlign: 'center', minWidth: 60 }}>
                      {statusLabel[status]}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={16} color="#1B2C48" />
            <Text style={styles.dateText}>
              {order.createdAt
                ? new Date(order.createdAt).toLocaleDateString('pt-PT')
                : '--/--/----'}
            </Text>
          </View>

          <View style={styles.customerRow}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="person-outline" size={18} color="#000" />
                <View>
                  <Text style={styles.customerName}>{order.contact?.name || 'Cliente'}</Text>
                  <Text style={styles.customerSub}>Cliente Nº: {order.userId}</Text>
                </View>
              </View>
              <View style={{ marginTop: 6 }}>
                <Text style={styles.customerPhone}>{order.contact?.phone || 'Sem telefone'}</Text>
                <Text style={styles.customerAddress} numberOfLines={2}>
                  {order.deliveryAddress?.address || ''} {order.deliveryAddress?.city || ''}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.statusRowDetail}>
            <Text style={styles.statusLabel}>Estado</Text>
            <View style={styles.statusActions}>
              <View
                style={[styles.statusPill, { backgroundColor: '#00BCD4' }]}
              >
                <Text style={styles.statusPillText}>
                  {statusLabel[order.orderStatus] ?? order.orderStatus}
                </Text>
              </View>
              {(order.orderStatus === 'EM_PROCESSAMENTO' || order.orderStatus === 'ENVIADO') && (
                <Pressable style={styles.updateBtn} onPress={handleUpdateStatus}>
                  <Text style={styles.updateBtnText}>Atualizar estado</Text>
                </Pressable>
              )}
            </View>
          </View>

          <View style={styles.itemsSection}>
            {supplierItems.map(item => {
              const finalPrice = getFinalPrice(item);
              const itemTotal = finalPrice * (item.quantity || 0);
              
              return (
                <View key={item.productId} style={styles.itemCard}>
                  <Text style={styles.itemTitle}>{item.name}</Text>
                  <View style={styles.itemMetaRow}>
                    <View>
                      <Text style={styles.metaLabel}>PREÇO UNITÁRIO</Text>
                      {item.discount && item.discountValue ? (
                        <View>
                          <Text style={styles.oldPrice}>€{Number(item.price || 0).toFixed(2)}</Text>
                          <Text style={styles.metaValue}>€{finalPrice.toFixed(2)}</Text>
                        </View>
                      ) : (
                        <Text style={styles.metaValue}>€{Number(item.price || 0).toFixed(2)}</Text>
                      )}
                    </View>
                    <View>
                      <Text style={styles.metaLabel}>QUANTIDADE</Text>
                      <Text style={styles.metaValue}>{item.quantity}</Text>
                    </View>
                    <View>
                      <Text style={styles.metaLabel}>PREÇO TOTAL</Text>
                      <Text style={styles.metaValue}>€{itemTotal.toFixed(2)}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>

          <View style={styles.summaryRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryLabel}>SUBTOTAL</Text>
              <Text style={styles.summaryLabel}>
                {shippingType === 'premium' ? 'ENVIO (Premium)' : 'ENVIO (Grátis)'}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.summaryValue}>€ {subtotal.toFixed(2)}</Text>
              <Text style={styles.summaryValue}>€ {shipping.toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL</Text>
            <Text style={styles.totalValue}>€ {total.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F4F5F8' },
  container: { padding: 26, paddingBottom: 40 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 22,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 12,
  },
  orderTitle: { fontSize: 22, fontWeight: '900', color: '#000' },
  tracking: { fontSize: 15, color: '#6B7280', marginTop: 4 },
  iconBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
  },
  dateText: { fontSize: 15, color: '#1B2C48', fontWeight: '600' },
  customerRow: {
    flexDirection: 'column',
    gap: 12,
    marginTop: 22,
  },
  customerName: { fontSize: 18, fontWeight: '800', color: '#000' },
  customerSub: { fontSize: 14, color: '#4B5563', marginTop: 4 },
  customerPhone: { fontSize: 15, color: '#374151', marginTop: 8 },
  customerAddress: { fontSize: 15, color: '#374151', marginTop: 4 },
  statusColumn: { alignItems: 'flex-end', gap: 8 },
  statusRowDetail: {
    flexDirection: 'column',
    gap: 6,
    marginTop: 12,
  },
  statusLabel: { fontSize: 15, color: '#111', fontWeight: '700' },
  statusActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  statusPill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
  },
  statusPillText: { color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 0.4 },
  updateBtn: {
    marginTop: 6,
    backgroundColor: '#0A4CFF',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  updateBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  itemsSection: { marginTop: 26, gap: 14 },
  itemCard: {
    backgroundColor: '#F2F4F7',
    borderRadius: 16,
    padding: 18,
  },
  itemTitle: { fontSize: 18, fontWeight: '900', color: '#111' },
  itemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  metaLabel: { fontSize: 12, color: '#6B7280', letterSpacing: 0.2 },
  metaValue: { fontSize: 16, fontWeight: '800', color: '#000', marginTop: 4 },
  oldPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 26,
  },
  summaryLabel: { fontSize: 14, color: '#6B7280', marginBottom: 12 },
  summaryValue: { fontSize: 14, color: '#111', marginBottom: 12 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  totalLabel: { fontSize: 18, fontWeight: '900' },
  totalValue: { fontSize: 22, fontWeight: '900', color: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
});
