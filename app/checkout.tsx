import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type CartItem = {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
  supplierId?: string | number;
  discount?: boolean;
  discountValue?: number;
  categoryId?: number;
  category?: string;
};

type PaymentUIState = 'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR';

const getFinalPrice = (item: CartItem) => {
  if (!item.discount || !item.discountValue) return item.price;
  return item.price - (item.price * item.discountValue) / 100;
};

export default function Payment() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [deliveryAddress, setDeliveryAddress] = useState<any>(null);
  const [paymentCard, setPaymentCard] = useState<any>(null);
  const [deliveryOption, setDeliveryOption] = useState<'standard' | 'premium'>('standard');
  const [paymentUI, setPaymentUI] = useState<PaymentUIState>('IDLE');
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);

  const estimatedDate = useMemo(() => {
    const daysToAdd = deliveryOption === 'premium' ? 2 : 7;
    const date = new Date();
    date.setDate(date.getDate() + daysToAdd);
    const formatter = new Intl.DateTimeFormat('pt-PT', {
      day: 'numeric',
      month: 'long',
    });
    return formatter.format(date);
  }, [deliveryOption]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const u = await AsyncStorage.getItem('LOGGED_USER');
    const c = await AsyncStorage.getItem('CART');
    const card = await AsyncStorage.getItem('PAYMENT_CARD');

    if (u) setUser(JSON.parse(u));
    if (c) setCart(JSON.parse(c));
    if (card) setPaymentCard(JSON.parse(card));
  };

  // Load delivery address with priority: TEMP → DELIVERY
  useFocusEffect(
    useCallback(() => {
      const loadDeliveryAddress = async () => {
        try {
          const temp = await AsyncStorage.getItem('TEMP_DELIVERY_ADDRESS');
          const saved = await AsyncStorage.getItem('DELIVERY_ADDRESS');

          const address = temp
            ? JSON.parse(temp)
            : saved
            ? JSON.parse(saved)
            : null;

          if (address) {
            setDeliveryAddress(address);
          }
        } catch (error) {
          console.log('Error loading delivery address:', error);
        }
      };

      loadDeliveryAddress();
    }, [])
  );

  const total = cart.reduce((sum, i) => {
    const finalPrice = getFinalPrice(i);
    return sum + finalPrice * i.quantity;
  }, 0);
  const deliveryCost = deliveryOption === 'premium' ? 7.0 : 0;
  const finalTotal = total + deliveryCost;

  const buildOrder = (orderId: string, paymentStatus: 'PAGO' | 'PENDENTE') => {
    const orderItems = cart.map(item => ({
      productId: item.productId,
      name: item.name,
      category: item.category,
      price: item.price,
      quantity: item.quantity,
      image: item.image,
      supplierId: item.supplierId,
      discount: item.discount,
      discountValue: item.discountValue,
    }));

    return {
      id: orderId,
      userId: user?.id ?? user?.email ?? '',
      items: orderItems,
      deliveryAddress: {
        address: deliveryAddress?.address || '',
        city: deliveryAddress?.city || '',
        postcode: deliveryAddress?.postcode || deliveryAddress?.zip || '',
      },
      contact: {
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
      },
      shipping: {
        type: deliveryOption,
        price: deliveryCost,
        estimate: estimatedDate,
      },
      paymentMethod: paymentCard?.last4
        ? {
            type: 'card',
            last4: paymentCard.last4,
          }
        : undefined,
      total: finalTotal,
      paymentStatus,
      orderStatus: paymentStatus === 'PAGO' ? 'EM_PROCESSAMENTO' : 'AGUARDA_PAGAMENTO',
      reviewed: false,
      createdAt: new Date().toISOString(),
    };
  };

  const saveOrder = async (order: any) => {
    const stored = await AsyncStorage.getItem('ORDERS');
    const orders = stored ? JSON.parse(stored) : [];
    await AsyncStorage.setItem('ORDERS', JSON.stringify([...orders, order]));
  };

  const validateStockBeforeCheckout = async (items: any[]) => {
    const raw = await AsyncStorage.getItem('PRODUCTS');
    if (!raw) return false;

    const products = JSON.parse(raw);

    for (const item of items) {
      const product = products.find(
        (p: any) => Number(p.id) === Number(item.productId)
      );
      if (!product) continue;

      if (item.quantity > (product.stock ?? 0)) {
        Alert.alert(
          'Stock atualizado',
          `O produto "${product.name}" já não tem stock suficiente.`
        );
        return false;
      }
    }

    return true;
  };

  const decreaseStockAfterPayment = async (orderItems: any[]) => {
    const raw = await AsyncStorage.getItem('PRODUCTS');
    if (!raw) return;

    const products = JSON.parse(raw);
    const productsOutOfStock: any[] = [];

    const updated = products.map((p: any) => {
      const item = orderItems.find(
        (i: any) => Number(i.productId) === Number(p.id)
      );
      if (!item) return p;

      const newStock = Math.max(0, (p.stock ?? 0) - (item.quantity ?? 0));
      
      // Se ficou sem stock, guardar para notificar
      if (newStock === 0 && p.supplierId) {
        productsOutOfStock.push({
          productId: p.id,
          productName: p.name,
          supplierId: p.supplierId,
        });
      }

      return {
        ...p,
        stock: newStock,
      };
    });

    await AsyncStorage.setItem('PRODUCTS', JSON.stringify(updated));

    // Notificar fornecedores sobre produtos sem stock
    if (productsOutOfStock.length > 0) {
      await notifySupplierOutOfStock(productsOutOfStock);
    }
  };

  const notifySupplierOutOfStock = async (productsOutOfStock: any[]) => {
    const usersRaw = await AsyncStorage.getItem('USERS');
    if (!usersRaw) return;

    const users = JSON.parse(usersRaw);
    const raw = await AsyncStorage.getItem('NOTIFICATIONS');
    const notifications = raw ? JSON.parse(raw) : [];

    for (const product of productsOutOfStock) {
      const supplier = users.find((u: any) => String(u.id) === String(product.supplierId));
      if (supplier?.email) {
        notifications.push({
          id: Date.now().toString() + Math.random(),
          userEmail: supplier.email,
          message: `Produto "${product.productName}" ficou sem stock.`,
          read: false,
          createdAt: Date.now(),
          type: 'stock',
          productId: product.productId,
        });
      }
    }

    await AsyncStorage.setItem('NOTIFICATIONS', JSON.stringify(notifications));
  };

  const notifySupplierNewOrder = async (supplierEmail: string, orderId: string) => {
    const raw = await AsyncStorage.getItem('NOTIFICATIONS');
    const list = raw ? JSON.parse(raw) : [];

    list.push({
      id: Date.now().toString(),
      userEmail: supplierEmail,
      message: 'Recebeu uma nova encomenda.',
      read: false,
      createdAt: Date.now(),
      type: 'order',
      orderId,
    });

    await AsyncStorage.setItem('NOTIFICATIONS', JSON.stringify(list));
  };

  const clearCart = async () => {
    await AsyncStorage.removeItem('CART');
    setCart([]);
  };

  const handlePay = async () => {
    setPaymentUI('LOADING');
    const newOrderId = String(Date.now());
    setLastOrderId(newOrderId);

    setTimeout(() => {
      setPaymentUI('ERROR');
    }, 2000);
  };

  const finalizeOrder = async (paymentStatus: 'PAGO' | 'PENDENTE' | 'NAO_PAGO') => {
    const ok = await validateStockBeforeCheckout(cart);
    if (!ok) {
      setPaymentUI('IDLE');
      return;
    }

    const orderId = lastOrderId ?? String(Date.now());

    const order = buildOrder(orderId, paymentStatus === 'PAGO' ? 'PAGO' : 'PENDENTE');

    if (paymentStatus === 'PAGO') {
      order.paymentStatus = 'PAGO';
      order.orderStatus = 'EM_PROCESSAMENTO';
    } else {
      order.paymentStatus = 'PENDENTE';
      order.orderStatus = 'AGUARDA_PAGAMENTO';
    }

    await saveOrder(order);

    const supplierId = order.items?.[0]?.supplierId;
    if (supplierId) {
      const usersRaw = await AsyncStorage.getItem('USERS');
      const users = usersRaw ? JSON.parse(usersRaw) : [];
      const supplier = users.find((u: any) => String(u.id) === String(supplierId));
      if (supplier?.email) {
        await notifySupplierNewOrder(supplier.email, orderId);
      }
    }

    if (paymentStatus === 'PAGO') {
      await decreaseStockAfterPayment(order.items || []);
    }
    if (paymentStatus === 'PAGO') {
      await clearCart();
    } else {
      // Para cenários por pagar / não pago também limpamos o carrinho
      await clearCart();
    }
    setLastOrderId(orderId);

    if (paymentStatus === 'PAGO') {
      router.replace({
        pathname: '/order/[id]',
        params: { id: orderId },
      });
    } else {
      setPaymentUI('IDLE');
      router.replace('/orders');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => router.replace('/cart')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </Pressable>
          <Text style={styles.title}>Pagamento</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.section}>Morada de entrega</Text>
              <Text style={styles.addressText}>
                {deliveryAddress?.address}, {deliveryAddress?.city}
              </Text>
            </View>
            <Pressable
              style={styles.editBtn}
              onPress={() =>
                router.push({
                  pathname: '/checkout-address',
                  params: { temp: '1' },
                })
              }
            >
              <Ionicons name="pencil" size={18} color="#fff" />
            </Pressable>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.section}>Informação para contacto</Text>
              <Text style={styles.contactText}>{user?.phone}</Text>
              <Text style={styles.contactText}>{user?.email}</Text>
            </View>
          
    
          </View>
        </View>

        <View style={styles.itemsHeader}>
          <Text style={styles.section}>Itens</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{cart.length}</Text>
          </View>
          
        </View>

        {cart.map(item => {
          const finalPrice = getFinalPrice(item);
          const itemTotal = finalPrice * item.quantity;
          
          return (
            <View key={item.productId} style={styles.item}>
              <Image source={{ uri: item.image }} style={styles.img} />
              <View style={{ flex: 1 }}>
                <Text style={styles.bold}>{item.name}</Text>
                {item.discount && item.discountValue ? (
                  <View>
                    <Text style={styles.oldPrice}>€{item.price.toFixed(2)}</Text>
                    <Text style={styles.itemPrice}>
                      €{finalPrice.toFixed(2)} x {item.quantity}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.itemPrice}>
                    €{item.price.toFixed(2)} x {item.quantity}
                  </Text>
                )}
              </View>
              <Text style={styles.itemTotal}>€{itemTotal.toFixed(2)}</Text>
            </View>
          );
        })}

        <View style={styles.deliverySection}>
          <Text style={styles.section}>Opções de entrega</Text>
          
          <Pressable
            style={[styles.deliveryOption, deliveryOption === 'standard' && styles.deliveryOptionActive]}
            onPress={() => setDeliveryOption('standard')}
          >
            <View style={styles.deliveryRadio}>
              {deliveryOption === 'standard' && <View style={styles.deliveryRadioFilled} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.deliveryTitle}>Padrão</Text>
              <Text style={styles.deliveryTime}>5-7 dias</Text>
            </View>
            <Text style={styles.deliveryPrice}>Grátis</Text>
          </Pressable>

          <Pressable
            style={[styles.deliveryOption, deliveryOption === 'premium' && styles.deliveryOptionActive]}
            onPress={() => setDeliveryOption('premium')}
          >
            <View style={styles.deliveryRadio}>
              {deliveryOption === 'premium' && <View style={styles.deliveryRadioFilled} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.deliveryTitle}>Premium</Text>
              <Text style={styles.deliveryTime}>1-2 dias</Text>
            </View>
            <Text style={styles.deliveryPrice}>€7,00</Text>
          </Pressable>

          <Text style={styles.deliveryEta}>Entregue antes de {estimatedDate}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.section}>Formas de Pagamento</Text>
            <Pressable
              style={styles.editBtn}
              onPress={() =>
                router.push({
                  pathname: '/checkout-card',
                  params: { temp: '1' },
                })
              }
            >
              <Ionicons name="pencil" size={18} color="#fff" />
            </Pressable>
          </View>
          <Text style={styles.addressText}>**** **** **** {paymentCard?.last4}</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>€{finalTotal.toFixed(2)}</Text>
        </View>
        <Pressable style={styles.pay} onPress={handlePay}>
          <Text style={styles.payText}>Pagar</Text>
        </Pressable>
      </View>

      {paymentUI === 'LOADING' && (
        <BlurView intensity={40} tint="light" style={styles.centerModal}>
          <ActivityIndicator size="large" color="#0A4CFF" />
          <Text style={styles.modalTitle}>Pagamento em curso</Text>
        </BlurView>
      )}

      {paymentUI === 'ERROR' && (
        <BlurView intensity={40} tint="light" style={styles.centerModal}>
          <Text style={styles.modalTitle}>
            Simulação do resultado do pagamento
          </Text>

          <View style={styles.modalButtonsRow}>
            <Pressable
              style={[styles.modalButton, styles.modalButtonRowButton, { backgroundColor: '#16a34a' }]}
              onPress={() => finalizeOrder('PAGO')}
            >
              <Text style={styles.modalButtonText}>Pago</Text>
            </Pressable>

            <Pressable
              style={[styles.modalButton, styles.modalButtonRowButton, { backgroundColor: '#f59e0b' }]}
              onPress={() => finalizeOrder('PENDENTE')}
            >
              <Text style={styles.modalButtonText}>Por pagar</Text>
            </Pressable>

            <Pressable
              style={[styles.modalButton, styles.modalButtonRowButton, { backgroundColor: '#dc2626' }]}
              onPress={() => finalizeOrder('NAO_PAGO')}
            >
              <Text style={styles.modalButtonText}>Não pago</Text>
            </Pressable>
          </View>
        </BlurView>
      )}

      {paymentUI === 'SUCCESS' && (
        <BlurView intensity={40} tint="light" style={styles.centerModal}>
          <Text style={styles.modalTitle}>Sucesso!</Text>
          <Pressable
            style={styles.modalButton}
            onPress={() =>
              lastOrderId
                ? router.replace({ pathname: '/order/[id]', params: { id: lastOrderId } })
                : router.replace('/orders')
            }
          >
            <Text style={styles.modalButtonText}>Consultar encomenda</Text>
          </Pressable>
        </BlurView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, paddingBottom: 140 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 28, fontWeight: '800', flex: 1 },

  card: {
    backgroundColor: '#F7F7F7',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    gap: 4,
  },
  section: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  addressText: { fontSize: 13, color: '#555', marginTop: 4 },
  contactText: { fontSize: 13, color: '#555' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0A4CFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  itemsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  badge: {
    backgroundColor: '#EAF0FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0A4CFF',
  },
  couponBtn: {
    marginLeft: 'auto',
    borderWidth: 2,
    borderColor: '#0A4CFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  couponText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0A4CFF',
  },

  item: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  img: { width: 64, height: 64, borderRadius: 10, backgroundColor: '#eee' },
  bold: { fontWeight: '700', fontSize: 14 },
  itemPrice: { fontSize: 12, color: '#666', marginTop: 4 },
  oldPrice: {
    fontSize: 10,
    color: '#999',
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  itemTotal: { fontSize: 14, fontWeight: '700', marginLeft: 'auto' },

  deliverySection: {
    marginBottom: 20,
  },
  deliveryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#F7F7F7',
  },
  deliveryOptionActive: {
    backgroundColor: '#EAF0FF',
    borderColor: '#0A4CFF',
  },
  deliveryRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ccc',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deliveryRadioFilled: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0A4CFF',
  },
  deliveryTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  deliveryTime: {
    fontSize: 12,
    color: '#0A4CFF',
    marginTop: 2,
  },
  deliveryPrice: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 'auto',
  },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderColor: '#eee',
    gap: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: { fontSize: 18, fontWeight: '700' },
  totalValue: { fontSize: 24, fontWeight: '800', color: '#000' },
  pay: {
    height: 50,
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  centerModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
  },
  modalButton: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#0A4CFF',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  modalButtonRowButton: {
    flex: 1,
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    textAlign: 'center',
  },
});
