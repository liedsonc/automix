import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from './storageKeys';

export type OrderItem = {
  productId: number;
  name: string;
  quantity: number;
  price: number;
  image?: string;
  supplierId?: number | string;
};

export type Order = {
  id: string;
  userId: string;
  items: OrderItem[];
  total: number;

  paymentMethod: {
    type: 'card';
    last4: string;
  };

  paymentStatus: 'PENDENTE' | 'PAGO';
  orderStatus:
    | 'AGUARDA_PAGAMENTO'
    | 'EM_PROCESSAMENTO'
    | 'ENVIADO'
    | 'ENTREGUE'
    | 'DEVOLVIDO';

  reviewed?: boolean;

  createdAt: string;
};

// Seed mock orders once for demo purposes.
export async function seedOrders() {
  const existing = await AsyncStorage.getItem(STORAGE_KEYS.ORDERS);
  if (existing) return;

  // Inicializar com array vazio em vez de pedidos demo
  await AsyncStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([]));
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.ORDERS);
  if (!stored) return;

  const orders: Order[] = JSON.parse(stored);
  const updated = orders.map(o => (o.id === orderId ? { ...o, status } : o));
  await AsyncStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updated));
}

export async function getOrders() {
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.ORDERS);
  return stored ? (JSON.parse(stored) as Order[]) : [];
}
