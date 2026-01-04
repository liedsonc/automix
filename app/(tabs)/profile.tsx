import categories from '@/data/categories.json';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

type Order = {
  id: string;
  userId: string;
  items: any[];
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

type User = {
  id: string;
  name: string;
  email?: string;
  role: 'cliente' | 'fornecedor' | 'admin';
  avatar?: string;
};

type Category = {
  id: number;
  name: string;
  imageKey: string;
};

type Product = {
  id: number;
  name: string;
  price: number;
  stock: number;
  description?: string;
  image: string;
  supplierId: number;
  categoryId?: number;
  discount: boolean;
  discountValue: number;
};

type Notification = {
  id: string;
  userEmail: string;
  message: string;
  read: boolean;
  createdAt: number;
  type?: 'order' | 'registration';
  orderId?: string;
};

const NOTIFICATIONS_KEY = 'NOTIFICATIONS';

const normalizeProduct = (product: any): Product => {
  const price = Number(product.price ?? 0);
  const rawDiscount = Number(product.discountValue ?? product.discount ?? 0);
  const hasDiscount = Boolean(product.discount ?? product.promotion) && rawDiscount > 0;

  return {
    id: Number(product.id),
    name: String(product.name ?? ''),
    price,
    stock: Number(product.stock ?? 0),
    description: product.description ?? '',
    image: String(product.image ?? ''),
    supplierId: product.supplierId ? Number(product.supplierId) : 0,
    discount: hasDiscount,
    discountValue: hasDiscount ? rawDiscount : 0,
    categoryId: product.categoryId ? Number(product.categoryId) : undefined,
  };
};

const getFinalPrice = (product: Product) => {
  if (!product.discount) return product.price;
  return product.price - (product.price * product.discountValue) / 100;
};

const filterOrders = (
  orders: Order[],
  filter: 'PAGAR' | 'RECEBER' | 'AVALIAR' | 'FINALIZADO' | 'TODAS'
) => {
  if (filter === 'PAGAR') {
    return orders.filter(
      o => o.paymentStatus === 'PENDENTE' && o.orderStatus === 'AGUARDA_PAGAMENTO'
    );
  }

  if (filter === 'RECEBER') {
    return orders.filter(o => o.paymentStatus === 'PAGO' && o.orderStatus !== 'ENTREGUE');
  }

  if (filter === 'AVALIAR') {
    return orders.filter(o => o.orderStatus === 'ENTREGUE' && o.reviewed !== true);
  }

  if (filter === 'FINALIZADO') {
    return orders.filter(o => o.orderStatus === 'ENTREGUE' && o.reviewed === true);
  }

  return orders;
};

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!loading && user === null) {
      router.replace('/login');
    }
  }, [loading, user, router]);
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'PAGAR' | 'RECEBER' | 'AVALIAR' | 'FINALIZADO' | 'TODAS' | null>('TODAS');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasUnread, setHasUnread] = useState(false);
  const [adminStats, setAdminStats] = useState({ users: 0, products: 0, orders: 0 });

  const loadAdminStats = useCallback(async () => {
    try {
      const usersRaw = await AsyncStorage.getItem('USERS');
      const productsRaw = await AsyncStorage.getItem('PRODUCTS');
      const ordersRaw = await AsyncStorage.getItem('ORDERS');

      const users = usersRaw ? JSON.parse(usersRaw) : [];
      const products = productsRaw ? JSON.parse(productsRaw) : [];
      const orders = ordersRaw ? JSON.parse(ordersRaw) : [];

      setAdminStats({
        users: users.length,
        products: products.length,
        orders: orders.length,
      });
    } catch {
      setAdminStats({ users: 0, products: 0, orders: 0 });
    }
  }, []);

  const loadSupplierProducts = useCallback(async (loggedUser: User) => {
    const data = await AsyncStorage.getItem('PRODUCTS');
    const products = data
      ? JSON.parse(data)
          .map((p: any) => ({
            ...p,
            discount: p.discount ?? false,
            discountValue: p.discountValue ?? 0,
          }))
          .map(normalizeProduct)
      : [];

    const filtered = products.filter(
      p => p.supplierId === Number(loggedUser.id) || p?.supplierEmail === loggedUser.email
    );
    setMyProducts(filtered);
  }, []);

  const loadProfile = useCallback(async () => {
    const userData = await AsyncStorage.getItem('LOGGED_USER');

    if (!userData) {
      setUser(null);
      setLoading(false);
      return;
    }

    const loggedUser: User = JSON.parse(userData);
    setUser(loggedUser);
    setLoading(false);

    await AsyncStorage.setItem('USER_ROLE', loggedUser.role);

    if (loggedUser.role === 'fornecedor') {
      await loadSupplierProducts(loggedUser);
    }

    if (loggedUser.role === 'cliente') {
      await loadMyOrders(loggedUser.id);
    }
  }, [loadSupplierProducts]);

  const loadNotifications = useCallback(async () => {
    const userRaw = await AsyncStorage.getItem('LOGGED_USER');
    if (!userRaw) return;

    const user = JSON.parse(userRaw);
    const target = user.role === 'admin' ? 'ADMIN' : user.email;
    const raw = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
    const all = raw ? JSON.parse(raw) : [];

    const filtered = all.filter((n: any) => n.userEmail === target);
    setNotifications(filtered);
    setHasUnread(filtered.some((n: any) => !n.read));
  }, []);

  useEffect(() => {
    loadProfile();
    loadNotifications();
    loadAdminStats();
  }, [loadProfile, loadNotifications, loadAdminStats]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
      loadNotifications();
      loadAdminStats();
      AsyncStorage.setItem('LAST_TAB', '/(tabs)/profile').catch(() => {});
    }, [loadProfile, loadNotifications, loadAdminStats])
  );

  const handleLogout = async () => {
    await AsyncStorage.removeItem('LOGGED_USER');
    router.replace('/login');
  };

  const handleDeleteOrder = async (orderId: string) => {
    const stored = await AsyncStorage.getItem('ORDERS');
    const all = stored ? JSON.parse(stored) : [];
    const updated = all.filter((o: Order) => o.id !== orderId);
    await AsyncStorage.setItem('ORDERS', JSON.stringify(updated));
    setOrders(prev => prev.filter(o => o.id !== orderId));
  };

  const loadMyOrders = async (userId: string) => {
    const stored = await AsyncStorage.getItem('ORDERS');
    const all = stored ? JSON.parse(stored) : [];

    const userRaw = await AsyncStorage.getItem('LOGGED_USER');
    if (!userRaw) return;
    const loggedUser = JSON.parse(userRaw);

    const mine = all.filter((o: Order) => 
      o.userId === userId || 
      o.userId === loggedUser.id || 
      o.userId === loggedUser.email
    );
    setOrders(mine);
  };

  const clearProducts = async () => {
    await AsyncStorage.removeItem('PRODUCTS');
    setMyProducts([]);
  };
  const deleteProduct = (id: number) => {
    Alert.alert('Confirmar', 'Apagar este produto?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Apagar',
        style: 'destructive',
        onPress: async () => {
          const data = await AsyncStorage.getItem('PRODUCTS');
          const productsRaw: any[] = data ? JSON.parse(data) : [];
          const updated = productsRaw.filter((p: any) => Number(p.id) !== id);
          await AsyncStorage.setItem('PRODUCTS', JSON.stringify(updated));
          if (user) {
            await loadSupplierProducts(user);
          }
        },
      },
    ]);
  };

  const filteredProducts = selectedCategory
    ? myProducts.filter(p => p.categoryId === selectedCategory)
    : myProducts;

  const displayedProducts = isExpanded ? filteredProducts : filteredProducts.slice(0, 4);
  const hasMoreProducts = filteredProducts.length > 4;

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' }}>
        <Ionicons name="reload" size={36} color="#0D5CFF" style={{ marginBottom: 16 }} />
        <Text style={{ color: '#0D5CFF', fontWeight: '600', fontSize: 16 }}>Carregando perfil...</Text>
      </View>
    );
  }
  if (!user) return null;

  const isAdmin = user.role === 'admin';

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image
              source={{ uri: user.avatar }}
              style={styles.avatar}
            />
            <Pressable style={styles.activityBtn}>
              <Text style={styles.activityText}>Minha atividade</Text>
            </Pressable>
          </View>

          <View style={styles.headerIcons}>
            <Pressable onPress={() => router.push('/notifications')}>
              <View style={styles.notificationWrapper}>
                <Ionicons name="notifications-outline" size={22} />
                {hasUnread && <View style={styles.badge} />}
              </View>
            </Pressable>
            <Pressable onPress={() => router.push('/settings')}>
              <Ionicons name="settings-outline" size={22} />
            </Pressable>
            <Pressable onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={22} />
            </Pressable>
          </View>
        </View>

        {/* WELCOME */}
        <Text style={styles.welcome}>Bem-vindo, {user.name}!</Text>

        {isAdmin && (
          <>
            {/* Estatísticas Rápidas */}
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Ionicons name="people" size={24} color="#0A4CFF" />
                <Text style={styles.statValue}>{adminStats.users}</Text>
                <Text style={styles.statLabel}>Usuários</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="cube" size={24} color="#16a34a" />
                <Text style={styles.statValue}>{adminStats.products}</Text>
                <Text style={styles.statLabel}>Produtos</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="cart" size={24} color="#f59e0b" />
                <Text style={styles.statValue}>{adminStats.orders}</Text>
                <Text style={styles.statLabel}>Pedidos</Text>
              </View>
            </View>

            {/* Ações Rápidas */}
            <Text style={styles.sectionTitle}>Ações rápidas</Text>
            <View style={styles.quickActions}>
              <Pressable style={styles.quickActionBtn} onPress={() => router.push('/admin/sem-stock')}>
                <Ionicons name="alert-circle-outline" size={28} color="#ef4444" />
                <Text style={styles.quickActionText}>Sem Stock</Text>
              </Pressable>
              <Pressable style={styles.quickActionBtn} onPress={() => router.push('/admin/finance')}>
                <Ionicons name="stats-chart-outline" size={28} color="#16a34a" />
                <Text style={styles.quickActionText}>Finanças</Text>
              </Pressable>
              <Pressable style={styles.quickActionBtn} onPress={() => router.push('/admin/members')}>
                <Ionicons name="person-add-outline" size={28} color="#0A4CFF" />
                <Text style={styles.quickActionText}>Membros</Text>
              </Pressable>
            </View>
          </>
        )}

        {/* MINHAS ENCOMENDAS (APENAS CLIENTE) */}
        {user.role === 'cliente' && (
          <View style={{ marginTop: 32 }}>
            <Text style={styles.sectionTitle}>Minhas encomendas</Text>

            {/* FILTROS */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterScroll}
            >
              <View style={styles.orderRow}>
              <Pressable
                style={[
                  styles.orderPill,
                  selectedFilter === 'TODAS' && { backgroundColor: '#0D5CFF' },
                ]}
                onPress={() => setSelectedFilter('TODAS')}
              >
                <Text
                  style={[
                    styles.orderText,
                    selectedFilter === 'TODAS' && { color: '#FFF' },
                  ]}
                >
                  Todas
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.orderPill,
                  selectedFilter === 'PAGAR' && { backgroundColor: '#0D5CFF' },
                ]}
                onPress={() => setSelectedFilter('PAGAR')}
              >
                <Text
                  style={[
                    styles.orderText,
                    selectedFilter === 'PAGAR' && { color: '#FFF' },
                  ]}
                >
                  A pagar
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.orderPill,
                  selectedFilter === 'RECEBER' && { backgroundColor: '#0D5CFF' },
                ]}
                onPress={() => setSelectedFilter('RECEBER')}
              >
                <Text
                  style={[
                    styles.orderText,
                    selectedFilter === 'RECEBER' && { color: '#FFF' },
                  ]}
                >
                  A receber
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.orderPill,
                  selectedFilter === 'AVALIAR' && { backgroundColor: '#0D5CFF' },
                ]}
                onPress={() => setSelectedFilter('AVALIAR')}
              >
                <Text
                  style={[
                    styles.orderText,
                    selectedFilter === 'AVALIAR' && { color: '#FFF' },
                  ]}
                >
                  A avaliar
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.orderPill,
                  selectedFilter === 'FINALIZADO' && { backgroundColor: '#0D5CFF' },
                ]}
                onPress={() => setSelectedFilter('FINALIZADO')}
              >
                <Text
                  style={[
                    styles.orderText,
                    selectedFilter === 'FINALIZADO' && { color: '#FFF' },
                  ]}
                >
                  Finalizado
                </Text>
              </Pressable>
              </View>
            </ScrollView>

            {/* LISTA DE ENCOMENDAS */}
            {orders.length === 0 ? (
              <Text style={[styles.noticeText, { marginTop: 12 }]}>
                Nenhuma encomenda encontrada
              </Text>
            ) : (
              <View style={styles.ordersList}>
                {filterOrders(orders, selectedFilter || 'TODAS').map(order => (
                  <Pressable
                    key={order.id}
                    style={styles.orderCard}
                    onPress={() => router.push(`/order/${order.id}`)}
                  >
                    <View>
                      <Text style={styles.orderId}>Encomenda #{order.id}</Text>
                      <Text style={styles.orderStatus}>
                        {order.orderStatus.replace(/_/g, ' ')}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.orderAmount}>€{order.total.toFixed(2)}</Text>
                      {order.paymentStatus === 'PENDENTE' && (
                        <Text style={{ fontSize: 11, color: '#f59e0b', fontWeight: '600' }}>
                          Pendente
                        </Text>
                      )}
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        )}

        {/* MEUS PRODUTOS (APENAS FORNECEDOR) */}
        {user.role === 'fornecedor' && (
          <View style={{ marginTop: 32 }}>
            {/* Banner de rupturas de stock */}
            <Pressable
              style={{
                backgroundColor: '#FFB800',
                borderRadius: 16,
                padding: 18,
                alignItems: 'center',
                marginBottom: 16,
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 10,
              }}
              onPress={() => router.push('/supplier/restock')}
            >
              <Ionicons name="alert-circle-outline" size={24} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
                Rupturas de stock
              </Text>
            </Pressable>
            <View style={styles.productsHeader}>
              <Text style={styles.sectionTitle}>Meus produtos</Text>
              <Pressable 
                style={styles.addButton}
                onPress={() => router.push('/product/add-product')}
              >
                <Ionicons name="add" size={24} color="#FFF" />
              </Pressable>
            </View>

            {/* FILTRO DE CATEGORIAS */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
              contentContainerStyle={styles.categoryContent}
            >
              <Pressable
                style={[
                  styles.categoryPill,
                  selectedCategory === null && styles.categoryPillActive,
                ]}
                onPress={() => setSelectedCategory(null)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === null && styles.categoryTextActive,
                  ]}
                >
                  Todas
                </Text>
              </Pressable>

              {categories.map((cat: Category) => (
                <Pressable
                  key={cat.id}
                  style={[
                    styles.categoryPill,
                    selectedCategory === cat.id && styles.categoryPillActive,
                  ]}
                  onPress={() => setSelectedCategory(cat.id)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      selectedCategory === cat.id && styles.categoryTextActive,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {myProducts.length === 0 ? (
              <Text style={styles.noticeText}>Nenhum produto publicado</Text>
            ) : filteredProducts.length === 0 ? (
              <Text style={styles.noticeText}>Nenhum produto nesta categoria</Text>
            ) : (
              <>
                {displayedProducts.map(item => (
                <View key={item.id} style={styles.productCard}>
                  <Image source={{ uri: item.image }} style={styles.productImage} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.productName}>{item.name}</Text>
                    {item.discount ? (
                      <View>
                        <Text style={styles.oldPrice}>€{item.price.toFixed(2)}</Text>
                        <Text style={styles.newPrice}>€{getFinalPrice(item).toFixed(2)}</Text>
                      </View>
                    ) : (
                      <Text style={styles.productPrice}>€{Number(item.price || 0).toFixed(2)}</Text>
                    )}
                    <Text style={styles.productStock}>Stock: {item.stock}</Text>
                  </View>

                  <View style={styles.actionsRow}>
                    <Pressable
                      style={styles.editBtn}
                      onPress={() => router.push(`/product/edit/${item.id}`)}
                    >
                      <Text style={styles.editBtnText}>Editar</Text>
                    </Pressable>
                    <Pressable style={styles.deleteBtn} onPress={() => deleteProduct(item.id)}>
                      <Text style={styles.deleteBtnText}>Apagar</Text>
                    </Pressable>
                  </View>
                </View>
              ))}

                {hasMoreProducts && (
                  <Pressable
                    style={styles.viewMoreButton}
                    onPress={() => setIsExpanded(!isExpanded)}
                  >
                    <Text style={styles.viewMoreText}>
                      {isExpanded ? 'Ver menos' : `Ver mais (${filteredProducts.length - 4})`}
                    </Text>
                  </Pressable>
                )}
              </>
            )}
          </View>
        )}
        </ScrollView>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFF',
  },

  container: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },

  activityBtn: {
    backgroundColor: '#0D5CFF',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
  },

  activityText: {
    color: '#FFF',
    fontWeight: '600',
  },

  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  notificationWrapper: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
  },

  welcome: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 16,
  },

  noticeCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  noticeTitle: {
    fontWeight: '700',
    marginBottom: 4,
  },

  noticeText: {
    color: '#555',
    fontSize: 13,
  },

  noticeArrow: {
    backgroundColor: '#0D5CFF',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  adminCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F6F8FF',
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
  },
  adminTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  adminText: {
    color: '#555',
    fontSize: 13,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 12,
  },

  recentItem: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 12,
    backgroundColor: '#EEE',
  },

  filterScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
    marginBottom: 16,
  },

  orderRow: {
    flexDirection: 'row',
    gap: 10,
  },

  orderPill: {
    backgroundColor: '#EAF0FF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  orderText: {
    color: '#0D5CFF',
    fontWeight: '600',
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'green',
  },

  ordersList: {
    marginTop: 12,
    gap: 8,
  },
  orderCard: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderId: {
    fontSize: 15,
    fontWeight: '700',
  },
  orderStatus: {
    fontSize: 12,
    color: '#555',
    marginTop: 2,
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0D5CFF',
  },
  orderDelete: {
    width: 80,
    backgroundColor: '#E53935',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginLeft: 8,
  },
  orderDeleteText: {
    color: '#fff',
    fontWeight: '700',
    marginTop: 4,
  },

  productCard: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },

  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },

  productName: {
    fontSize: 16,
    fontWeight: '600',
  },

  productPrice: {
    color: '#007AFF',
    fontWeight: '600',
  },
  productStock: {
    marginTop: 2,
    color: '#16a34a',
    fontWeight: '600',
    fontSize: 12,
  },
  oldPrice: {
    textDecorationLine: 'line-through',
    color: '#999',
    fontSize: 12,
  },
  newPrice: {
    color: '#0A84FF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  clearText: {
    color: '#E53935',
    fontWeight: '600',
  },

  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#0A84FF',
    borderRadius: 8,
  },
  editBtnText: {
    color: '#FFF',
    fontWeight: '700',
  },
  deleteBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#E53935',
    borderRadius: 8,
  },
  deleteBtnText: {
    color: '#FFF',
    fontWeight: '700',
  },

  categoryScroll: {
    marginBottom: 16,
  },

  categoryContent: {
    gap: 8,
  },

  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },

  categoryPillActive: {
    backgroundColor: '#0D5CFF',
    borderColor: '#0D5CFF',
  },

  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },

  categoryTextActive: {
    color: '#FFF',
  },

  viewMoreButton: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },

  viewMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0D5CFF',
  },

  productsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0D5CFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  quickActionBtn: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111',
    marginTop: 8,
    textAlign: 'center',
  },
});
