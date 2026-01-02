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
import { SafeAreaView } from 'react-native-safe-area-context';

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
  };
};

const getFinalPrice = (product: Product) => {
  if (!product.discount) return product.price;
  return product.price - (product.price * product.discountValue) / 100;
};

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
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
    const filtered = products.filter(p => p.supplierId === Number(loggedUser.id));
    setMyProducts(filtered);
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      const userData = await AsyncStorage.getItem('LOGGED_USER');
      if (!userData) return;

      const loggedUser: User = JSON.parse(userData);
      setUser(loggedUser);

      if (loggedUser.role === 'fornecedor') {
        await loadSupplierProducts(loggedUser);
      }
    };

    loadProfile();
  }, [loadSupplierProducts]);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.setItem('LAST_TAB', '/(tabs)/profile').catch(() => {});
    }, [])
  );

  const handleLogout = async () => {
    await AsyncStorage.removeItem('LOGGED_USER');
    router.replace('/login');
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

  if (!user) return null;

  return (
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
            <Ionicons name="notifications-outline" size={22} />
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

        {/* AVISOS */}
        <View style={styles.noticeCard}>
          <View>
            <Text style={styles.noticeTitle}>Avisos</Text>
            <Text style={styles.noticeText}>
              Promoções válidas por tempo limitado.
            </Text>
            <Text style={styles.noticeText}>
              Aproveite enquanto durarem os stocks.
            </Text>
          </View>

          <View style={styles.noticeArrow}>
            <Ionicons name="arrow-forward" size={18} color="#FFF" />
          </View>
        </View>

        {/* MINHAS ENCOMENDAS */}
        <Text style={styles.sectionTitle}>Minhas Encomendas</Text>
        <View style={styles.orderRow}>
          {['Por pagar', 'Por receber', 'Por avaliar'].map((label, i) => (
            <View key={i} style={styles.orderPill}>
              <Text style={styles.orderText}>{label}</Text>
              {label === 'Por receber' && <View style={styles.dot} />}
            </View>
          ))}
        </View>

        {/* MEUS PRODUTOS (APENAS FORNECEDOR) */}
        {user.role === 'fornecedor' && (
          <View style={{ marginTop: 32 }}>
            <View style={styles.productsHeader}>
              <Text style={styles.sectionTitle}>Meus produtos</Text>
              <Pressable 
                style={styles.addButton}
                onPress={() => router.push('/add-product')}
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
});
