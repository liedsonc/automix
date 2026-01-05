import categories from '@/data/categories.json';
import { productImages } from '@/constants/images';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cartEventEmitter } from '../../utils/cartEvents';

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  image: string;
  supplierId: number;
  discount: boolean;
  discountValue: number;
  createdAt: string;
  category?: string;
  categoryId?: number;
};
type RecentProduct = {
  id: number;
  name: string;
  image: string;
  price: number;
  category?: string;
  viewedAt: number;
};
const PRODUCTS_KEY = 'PRODUCTS';
const CART_KEY = 'CART';
const WISHLIST_KEY = 'WISHLIST';
const RECENT_PRODUCTS_KEY = 'RECENT_PRODUCTS';

const normalizeProduct = (product: any): Product => {
  const price = Number(product.price ?? 0);
  const stock = Number(product.stock ?? 0);
  const rawDiscount = Number(product.discountValue ?? product.discount ?? 0);

  // Considera promoções quando apenas discountValue > 0
  const hasDiscount = rawDiscount > 0 || Boolean(product.discount ?? product.promotion);

  return {
    id: Number(product.id),
    name: String(product.name ?? ''),
    description: String(product.description ?? ''),
    price,
    stock,
    image: String(product.image ?? ''),
    supplierId: product.supplierId ? Number(product.supplierId) : 0,
    discount: hasDiscount,
    discountValue: hasDiscount ? rawDiscount : 0,
    createdAt: product.createdAt ?? new Date().toISOString(),
    category: product.category,
    categoryId: product.categoryId ? Number(product.categoryId) : undefined,
  };
};

const getFinalPrice = (price: number, discountValue: number) => {
  return price - (price * discountValue) / 100;
};

const getProductImageSource = (productId: number, imageUri: string) => {
  const imageMap: Record<number, keyof typeof productImages> = {
    1: 'bateria_varta_a7',
    2: 'brembo_disco',
    3: 'filtro_oleo_mann',
    4: 'elf_evolution',
    5: 'trw_amortecedor',
    6: 'tyc_farol',
    7: 'osram_h7_adaptador',
    8: 'bateria_varta_e44',
    9: 'bosch_injector',
    10: 'febi_filtros',
    11: 'meyle_bracos',
    12: 'ridex_alternador',
  };

  const imageKey = imageMap[productId];
  if (imageKey && productImages[imageKey]) {
    return productImages[imageKey];
  }
  
  if (imageUri && imageUri.startsWith('http')) {
    return { uri: imageUri };
  }
  
  return { uri: imageUri };
};

export default function ProductScreen() {
  const { id, from: rawFrom } = useLocalSearchParams<{ id: string | string[]; from?: string | string[] }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [supplier, setSupplier] = useState<{ name?: string; email?: string } | null>(null);
  const [storedPrevTab, setStoredPrevTab] = useState<string | null>(null);
  const [storedLastTab, setStoredLastTab] = useState<string | null>(null);
  const [loadingFrom, setLoadingFrom] = useState(true);
  const [isClient, setIsClient] = useState<boolean | null>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [supplierReviews, setSupplierReviews] = useState<any[]>([]);
  const [avgSupplierRating, setAvgSupplierRating] = useState(0);

  const productId = Array.isArray(id) ? id[0] : id;
  const from = Array.isArray(rawFrom) ? rawFrom[0] : rawFrom;
  const fallbackRoute = from || storedPrevTab || storedLastTab || '/(tabs)/store';

  useEffect(() => {
    const loadLastTab = async () => {
      try {
        const [prev, last] = await Promise.all([
          AsyncStorage.getItem('PREV_TAB'),
          AsyncStorage.getItem('LAST_TAB'),
        ]);
        if (prev && !prev.includes('/teste')) setStoredPrevTab(prev);
        if (last && !last.includes('/teste')) setStoredLastTab(last);
      } catch {
        // ignore read errors
      } finally {
        setLoadingFrom(false);
      }
    };

    loadLastTab();
  }, []);

  useEffect(() => {
    const checkRole = async () => {
      try {
        const raw = await AsyncStorage.getItem('LOGGED_USER');
        if (!raw) {
          setIsClient(false);
          return;
        }
        const user = JSON.parse(raw);
        setIsClient(user.role === 'cliente');
      } catch {
        setIsClient(false);
      }
    };

    checkRole();
  }, []);

  useEffect(() => {
    if (!productId) return;
    const loadWishlistFlag = async () => {
      try {
        const stored = await AsyncStorage.getItem(WISHLIST_KEY);
        const list: any[] = stored ? JSON.parse(stored) : [];
        setIsWishlisted(list.some(item => String(item.productId) === String(productId)));
      } catch {
        setIsWishlisted(false);
      }
    };

    loadWishlistFlag();
  }, [productId]);

  const handleBack = () => {
    if (loadingFrom) return;

    const target = from || storedPrevTab || storedLastTab;
    if (target) {
      router.replace(target);
      return;
    }

    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/store');
    }
  };

  const ensureClient = async (): Promise<boolean> => {
    try {
      const userRaw = await AsyncStorage.getItem('LOGGED_USER');
      if (!userRaw) {
        Alert.alert('Login necessário', 'Entre como cliente para fazer compras');
        router.push('/login');
        return false;
      }

      const user = JSON.parse(userRaw);
      if (user.role !== 'cliente') {
        Alert.alert('Sem permissão', 'Apenas clientes podem fazer compras');
        return false;
      }

      return true;
    } catch (e) {
      console.error('Erro ao validar utilizador', e);
      Alert.alert('Erro', 'Não foi possível validar o seu perfil');
      return false;
    }
  };

  const addRecentProduct = async (recent: RecentProduct) => {
    try {
      const stored = await AsyncStorage.getItem(RECENT_PRODUCTS_KEY);
      const list: RecentProduct[] = stored ? JSON.parse(stored) : [];
      const filtered = list.filter(p => p.id !== recent.id);
      const updated = [recent, ...filtered].slice(0, 10);
      await AsyncStorage.setItem(RECENT_PRODUCTS_KEY, JSON.stringify(updated));
    } catch {
      // ignore write errors for recents
    }
  };

  useEffect(() => {
    if (!product) return;

    const categoryName = product.category
      ? product.category
      : product.categoryId
        ? categories.find(c => c.id === product.categoryId)?.name
        : undefined;

    addRecentProduct({
      id: product.id,
      name: product.name,
      image: product.image,
      price: product.price,
      category: categoryName,
      viewedAt: Date.now(),
    });
  }, [product]);

  const addToCart = async (openCart: boolean = false) => {
    try {
      const allowed = await ensureClient();
      if (!allowed) return;

      const stored = await AsyncStorage.getItem(CART_KEY);
      const cartItems = stored ? JSON.parse(stored) : [];

      const existingItem = cartItems.find((item: any) => item.productId === product.id);

      if (existingItem) {
        if (existingItem.quantity >= product.stock) {
          Alert.alert(
            'Stock insuficiente',
            `Só existem ${product.stock} unidades disponíveis.`
          );
          return;
        }
        existingItem.quantity += 1;
        if (!existingItem.supplierId) existingItem.supplierId = product.supplierId;
        existingItem.stock = product.stock;
      } else {
        if (product.stock <= 0) {

    useEffect(() => {
      if (!product) return;

      const categoryName = product.category
        ? product.category
        : product.categoryId
          ? categories.find(c => c.id === product.categoryId)?.name
          : undefined;

      addRecentProduct({
        id: product.id,
        name: product.name,
        image: product.image,
        price: product.price,
        category: categoryName,
        viewedAt: Date.now(),
      });
    }, [product]);
          Alert.alert('Sem stock', 'Este produto não está disponível no momento.');
          return;
        }
        
        const categoryName = product.categoryId 
          ? categories.find(c => c.id === product.categoryId)?.name 
          : undefined;
        
        cartItems.push({
          productId: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          quantity: 1,
          stock: product.stock,
          supplierId: product.supplierId,
          discount: product.discount,
          discountValue: product.discountValue,
          categoryId: product.categoryId,
          category: categoryName,
        });
      }

      await AsyncStorage.setItem(CART_KEY, JSON.stringify(cartItems));
      cartEventEmitter.emit();

      if (openCart) {
        router.push('/(tabs)/cart');
      } else {
        Alert.alert('Sucesso', `${product.name} adicionado ao carrinho`);
      }
    } catch (e) {
      console.error('Erro ao adicionar ao carrinho', e);
      Alert.alert('Erro', 'Não foi possível adicionar ao carrinho');
    }
  };

  const toggleWishlist = async () => {
    const allowed = await ensureClient();
    if (!allowed || !product) return;

    try {
      const stored = await AsyncStorage.getItem(WISHLIST_KEY);
      const list: any[] = stored ? JSON.parse(stored) : [];
      const exists = list.findIndex(item => String(item.productId) === String(product.id));

      if (exists >= 0) {
        const next = [...list.slice(0, exists), ...list.slice(exists + 1)];
        await AsyncStorage.setItem(WISHLIST_KEY, JSON.stringify(next));
        setIsWishlisted(false);
        Alert.alert('Removido', `${product.name} foi removido da wishlist`);
      } else {
        const next = [
          ...list,
          {
            productId: product.id,
            name: product.name,
            price: product.price,
            stock: product.stock,
            image: product.image,
            discount: product.discount,
            discountValue: product.discountValue,
          },
        ];
        await AsyncStorage.setItem(WISHLIST_KEY, JSON.stringify(next));
        setIsWishlisted(true);
        Alert.alert('Guardado', `${product.name} adicionado à wishlist`);
      }
    } catch (e) {
      console.error('Erro ao alternar wishlist', e);
      Alert.alert('Erro', 'Não foi possível atualizar a wishlist');
    }
  };

  useEffect(() => {
    if (productId) {
      loadProduct();
      loadReviews();
    }
  }, [productId]);

  const loadReviews = async () => {
    try {
      const stored = await AsyncStorage.getItem('REVIEWS');
      if (!stored) {
        setReviews([]);
        setAvgRating(0);
        return;
      }

      const allReviews = JSON.parse(stored);
      const productReviews = allReviews.filter(
        (r: any) => String(r.productId) === String(productId)
      );

      setReviews(productReviews);

      if (productReviews.length > 0) {
        const avg =
          productReviews.reduce((sum: number, r: any) => sum + r.rating, 0) /
          productReviews.length;
        setAvgRating(avg);
      } else {
        setAvgRating(0);
      }
    } catch (error) {
      console.error('Erro ao carregar reviews', error);
      setReviews([]);
      setAvgRating(0);
    }
  };

  const loadSupplierReviews = async (supplierId: number) => {
    try {
      const stored = await AsyncStorage.getItem('SUPPLIER_REVIEWS');
      if (!stored) {
        setSupplierReviews([]);
        setAvgSupplierRating(0);
        return;
      }

      const allReviews = JSON.parse(stored);
      const reviews = allReviews.filter(
        (r: any) => String(r.supplierId) === String(supplierId)
      );

      setSupplierReviews(reviews);

      if (reviews.length > 0) {
        const avg = reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length;
        setAvgSupplierRating(avg);
      } else {
        setAvgSupplierRating(0);
      }
    } catch (error) {
      console.error('Erro ao carregar reviews do fornecedor', error);
      setSupplierReviews([]);
      setAvgSupplierRating(0);
    }
  };

  const loadProduct = async () => {
    try {
      setLoading(true);

      const stored = await AsyncStorage.getItem(PRODUCTS_KEY);
      const storedProducts: Product[] = stored
        ? JSON.parse(stored).map(normalizeProduct)
        : [];

      const found = storedProducts.find(p => String(p.id) === String(productId));

      if (found) {
        setProduct(found);

        try {
          const usersRaw = await AsyncStorage.getItem('USERS');
          const users = usersRaw ? JSON.parse(usersRaw) : [];
          const supplierUser = users.find(
            (u: any) => String(u.id) === String(found.supplierId)
          );
          if (supplierUser) {
            setSupplier({ name: supplierUser.name, email: supplierUser.email });
          }
          
          // Carregar reviews do fornecedor
          if (found.supplierId) {
            loadSupplierReviews(found.supplierId);
          }
        } catch {
          setSupplier(null);
        }
      } else {
        setProduct(null);
      }
    } catch (e) {
      console.error('Erro ao carregar produto', e);
    } finally {
      setLoading(false);
    }
  };

  if (!productId || loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#004CFF" />
          <Text style={{ marginTop: 12 }}>A carregar...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Produto não encontrado</Text>
          <Pressable onPress={handleBack} style={{ marginTop: 20 }}>
            <Text style={{ color: '#004CFF' }}>Voltar</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView
        contentContainerStyle={{
          padding: 20,
          paddingBottom: 120, // espaço para a bottom bar
        }}
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={handleBack} style={{ marginBottom: 12 }}>
          <Ionicons name="chevron-back" size={24} />
        </Pressable>

        <Image 
          source={getProductImageSource(product.id, product.image)} 
          style={[styles.image, product.stock === 0 && styles.outOfStockImage]} 
        />

        <Text style={styles.title}>{product.name}</Text>

        {supplier && (
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.sectionTitle}>Fornecedor</Text>
            <Text style={styles.supplierText}>
              {supplier.name || 'Sem nome'}{supplier.email ? ` · ${supplier.email}` : ''}
            </Text>
          </View>
        )}

        <View style={styles.priceBlock}>
          {product.discount ? (
            <>
              {/* Selo de promoção acima do preço antigo */}
              <View style={styles.promoBadgeInline}>
                <Text style={styles.promoBadgeText}>EM PROMOÇÃO</Text>
              </View>

              {/* Preço antigo riscado */}
              <Text style={styles.oldPrice}>€{product.price.toFixed(2)}</Text>

              {/* Novo preço */}
              <Text style={styles.newPrice}>
                €{getFinalPrice(product.price, product.discountValue).toFixed(2)}
              </Text>
              {/* Valor do desconto */}
              <Text style={styles.discountText}>-{product.discountValue}%</Text>
            </>
          ) : (
            <Text style={styles.normalPrice}>€{product.price.toFixed(2)}</Text>
          )}
        </View>

        {product.stock === 0 && (
          <View style={styles.outOfStockWarning}>
            <Text style={styles.outOfStockText}>Temporariamente indisponível</Text>
          </View>
        )}

        {product.stock <= 2 && product.stock > 0 && (
          <View style={styles.lowStockWarning}>
            <Text style={styles.lowStockText}>Poucas unidades</Text>
          </View>
        )}

        <View style={{ marginTop: 12 }}>
          <Text style={styles.sectionTitle}>Descrição</Text>
          <Text style={styles.description}>
            {product.description || 'Sem descrição fornecida.'}
          </Text>
        </View>

        {/* Avaliações */}
        {reviews.length > 0 && (
          <View style={{ marginTop: 24 }}>
            <View style={styles.reviewHeader}>
              <Text style={styles.sectionTitle}>Avaliações</Text>
              <View style={styles.avgRatingContainer}>
                <Text style={styles.avgRatingText}>{avgRating.toFixed(1)}</Text>
                <Text style={styles.starIcon}>★</Text>
                <Text style={styles.reviewCount}>({reviews.length})</Text>
              </View>
            </View>

            {reviews.map((review, index) => (
              <View key={index} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewAuthor}>{review.userName}</Text>
                  <View style={styles.reviewStars}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <Text
                        key={star}
                        style={[
                          styles.reviewStar,
                          star <= review.rating && styles.reviewStarActive,
                        ]}
                      >
                        ★
                      </Text>
                    ))}
                  </View>
                </View>
                {review.comment && (
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                )}
                <Text style={styles.reviewDate}>
                  {new Date(review.createdAt).toLocaleDateString('pt-PT')}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Avaliações do Fornecedor */}
        {supplierReviews.length > 0 && (
          <View style={{ marginTop: 24 }}>
            <View style={styles.reviewHeader}>
              <Text style={styles.sectionTitle}>Avaliação do Fornecedor</Text>
              <View style={styles.avgRatingContainer}>
                <Text style={styles.avgRatingText}>{avgSupplierRating.toFixed(1)}</Text>
                <Text style={styles.starIcon}>★</Text>
                <Text style={styles.reviewCount}>({supplierReviews.length})</Text>
              </View>
            </View>

            {supplierReviews.map((review, index) => (
              <View key={index} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewAuthor}>{review.userName}</Text>
                  <View style={styles.reviewStars}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <Text
                        key={star}
                        style={[
                          styles.reviewStar,
                          star <= review.rating && styles.reviewStarActive,
                        ]}
                      >
                        ★
                      </Text>
                    ))}
                  </View>
                </View>
                {review.comment && (
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                )}
                <Text style={styles.reviewDate}>
                  {new Date(review.createdAt).toLocaleDateString('pt-PT')}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bottom bar do produto */}
      <View style={styles.bottomBar}>
        <Pressable
          style={[styles.wishlistBtn, (!isClient || product.stock === 0) && styles.disabledBtn]}
          onPress={toggleWishlist}
          disabled={isClient === false || product.stock === 0}
        >
          <Ionicons
            name={isWishlisted ? 'heart' : 'heart-outline'}
            size={22}
            color={isClient === false || product.stock === 0 ? '#999' : isWishlisted ? '#FF4D4F' : '#000'}
          />
        </Pressable>

        <Pressable
          style={[styles.cartBtn, (!isClient || product.stock === 0) && styles.disabledBtn]}
          onPress={() => addToCart(false)}
          disabled={isClient === false || product.stock === 0}
        >
          <Text style={[styles.cartText, (!isClient || product.stock === 0) && styles.disabledText]}>Carrinho</Text>
        </Pressable>

        <Pressable
          style={[styles.buyBtn, (!isClient || product.stock === 0) && styles.disabledBtnPrimary]}
          onPress={() => addToCart(true)}
          disabled={isClient === false || product.stock === 0}
        >
          <Text style={[styles.buyText, (!isClient || product.stock === 0) && styles.disabledTextPrimary]}>Comprar agora</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: 320,
    borderRadius: 20,
    backgroundColor: '#F2F2F2',
    marginBottom: 16,
  },
  outOfStockImage: {
    opacity: 0.4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
  },
  priceBlock: {
    marginTop: 8,
    marginBottom: 16,
  },
  promoBadgeInline: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFD60A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 6,
  },
  promoBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
  },
  oldPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  newPrice: {
    fontSize: 26,
    fontWeight: '800',
    color: '#000',
    marginTop: 2,
  },
  discountText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF3B30',
    marginTop: 2,
  },
  normalPrice: {
    fontSize: 26,
    fontWeight: '800',
    color: '#000',
  },
  outOfStockWarning: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#D0D0D0',
  },
  outOfStockText: {
    color: '#666',
    fontSize: 15,
    fontWeight: '700',
  },
  lowStockWarning: {
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  lowStockText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  description: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
  },

  supplierText: {
    fontSize: 14,
    color: '#555',
    marginTop: 2,
  },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  wishlistBtn: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartText: {
    color: '#fff',
    fontWeight: '700',
  },
  disabledBtn: {
    opacity: 0.5,
  },
  disabledBtnPrimary: {
    opacity: 0.6,
  },
  disabledText: {
    color: '#777',
  },
  disabledTextPrimary: {
    color: '#d6d6d6',
  },
  buyBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#0A4CFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyText: {
    color: '#fff',
    fontWeight: '700',
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  avgRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  avgRatingText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111',
  },
  starIcon: {
    fontSize: 18,
    color: '#FFB800',
  },
  reviewCount: {
    fontSize: 14,
    color: '#666',
  },
  reviewCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  reviewAuthor: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
    marginBottom: 6,
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewStar: {
    fontSize: 14,
    color: '#D0D0D0',
  },
  reviewStarActive: {
    color: '#FFB800',
  },
  reviewComment: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginTop: 8,
  },
  reviewDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
});
