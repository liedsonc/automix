import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cartEventEmitter } from '../../../utils/cartEvents';

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
};

const PRODUCTS_KEY = 'PRODUCTS';
const CART_KEY = 'CART';

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
  };
};

const getFinalPrice = (price: number, discountValue: number) => {
  return price - (price * discountValue) / 100;
};

export default function ProductScreen() {
  const { id, from: rawFrom } = useLocalSearchParams<{ id: string | string[]; from?: string | string[] }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [storedPrevTab, setStoredPrevTab] = useState<string | null>(null);
  const [storedLastTab, setStoredLastTab] = useState<string | null>(null);
  const [loadingFrom, setLoadingFrom] = useState(true);
  const [isClient, setIsClient] = useState<boolean | null>(null);

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

  const addToCart = async (openCart: boolean = false) => {
    try {
      const allowed = await ensureClient();
      if (!allowed) return;

      const stored = await AsyncStorage.getItem(CART_KEY);
      const cartItems = stored ? JSON.parse(stored) : [];

      const existingItem = cartItems.find((item: any) => item.productId === product.id);

      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        cartItems.push({
          productId: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          quantity: 1,
        });
      }

      await AsyncStorage.setItem(CART_KEY, JSON.stringify(cartItems));
      cartEventEmitter.emit();

      if (openCart) {
        router.push('/(tabs)/card');
      } else {
        Alert.alert('Sucesso', `${product.name} adicionado ao carrinho`);
      }
    } catch (e) {
      console.error('Erro ao adicionar ao carrinho', e);
      Alert.alert('Erro', 'Não foi possível adicionar ao carrinho');
    }
  };

  const handleWishlist = async () => {
    const allowed = await ensureClient();
    if (!allowed) return;
    Alert.alert('Wishlist', 'Funcionalidade em breve');
  };

  useEffect(() => {
    if (productId) {
      loadProduct();
    }
  }, [productId]);

  const loadProduct = async () => {
    try {
      setLoading(true);

      const stored = await AsyncStorage.getItem(PRODUCTS_KEY);
      const storedProducts: Product[] = stored
        ? JSON.parse(stored).map(normalizeProduct)
        : [];

      const found = storedProducts.find(p => String(p.id) === String(productId));

      setProduct(found ?? null);
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

        <Image source={{ uri: product.image }} style={styles.image} />

        <Text style={styles.title}>{product.name}</Text>

        <View style={styles.priceBlock}>
          {product.discount ? (
            <>
              {/* Selo de promoção acima do preço antigo */}
              <View style={styles.promoBadgeInline}>
                <Text style={styles.promoBadgeText}>EM PROMOÇÃO</Text>
              </View>

              {/* Preço antigo riscado */}
              <Text style={styles.oldPrice}>
                €{product.price.toFixed(2)}
              </Text>

              {/* Novo preço */}
              <Text style={styles.newPrice}>
                €{getFinalPrice(product.price, product.discountValue).toFixed(2)}
              </Text>

              {/* Valor do desconto */}
              <Text style={styles.discountText}>
                -{product.discountValue}%
              </Text>
            </>
          ) : (
            <Text style={styles.normalPrice}>
              €{product.price.toFixed(2)}
            </Text>
          )}
        </View>

        <View style={{ marginTop: 12 }}>
          <Text style={styles.sectionTitle}>Descrição</Text>
          <Text style={styles.description}>
            {product.description || 'Sem descrição fornecida.'}
          </Text>
        </View>
      </ScrollView>

      {/* Bottom bar do produto */}
      <View style={styles.bottomBar}>
        <Pressable
          style={[styles.wishlistBtn, !isClient && styles.disabledBtn]}
          onPress={handleWishlist}
          disabled={isClient === false}
        >
          <Ionicons name="heart-outline" size={22} color={isClient === false ? '#999' : '#000'} />
        </Pressable>

        <Pressable
          style={[styles.cartBtn, !isClient && styles.disabledBtn]}
          onPress={() => addToCart(false)}
          disabled={isClient === false}
        >
          <Text style={[styles.cartText, !isClient && styles.disabledText]}>Carrinho</Text>
        </Pressable>

        <Pressable
          style={[styles.buyBtn, !isClient && styles.disabledBtnPrimary]}
          onPress={() => addToCart(true)}
          disabled={isClient === false}
        >
          <Text style={[styles.buyText, !isClient && styles.disabledTextPrimary]}>Comprar agora</Text>
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

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
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
});
