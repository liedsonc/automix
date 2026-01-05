import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';

import { categoryImages } from '@/constants/images';
import categories from '@/data/categories.json';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

type Product = {
  id: number;
  name: string;
  price: number;
  stock: number;
  image: string;
  description?: string;
  category?: string;
  showInBestSellers?: boolean;
  showInNew?: boolean;
  showInRecommended?: boolean;
  supplierId?: number;
  createdAt?: string;

  discount: boolean;
  discountValue: number; // percentagem
};

const PRODUCTS_KEY = 'PRODUCTS';

const formatPrice = (value: unknown) => {
  const num = Number(value);
  return Number.isFinite(num) ? num.toFixed(2) : '—';
};

const getFinalPrice = (product: Product) => {
  if (!product.discount) return product.price;
  return product.price - (product.price * product.discountValue) / 100;
};

const normalizeProduct = (product: any): Product => {
  const price = Number(product.price ?? 0);
  const stock = Number(product.stock ?? 0);
  const rawDiscount = Number(product.discountValue ?? product.discount ?? 0);
  const hasDiscount = Boolean(product.discount ?? product.promotion) && rawDiscount > 0;

  return {
    id: Number(product.id),
    name: String(product.name ?? ''),
    price,
    stock,
    image: String(product.image ?? ''),
    description: product.description ?? '',
    category: product.category,
    showInBestSellers: product.showInBestSellers,
    showInNew: product.showInNew,
    showInRecommended: product.showInRecommended,
    supplierId: product.supplierId ? Number(product.supplierId) : 0,
    createdAt: product.createdAt ?? new Date().toISOString(),
    discount: hasDiscount,
    discountValue: hasDiscount ? rawDiscount : 0,
  };
};

export default function StoreScreen() {
  const [isLogged, setIsLogged] = useState(false);
  const [productsData, setProductsData] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const router = useRouter();
  const sortedCategories = [...categories].sort((a, b) => a.name.localeCompare(b.name));
  const [categoryIndex, setCategoryIndex] = useState(0);
  const CATEGORIES_VISIBLE = 4;
  const [promoIndex, setPromoIndex] = useState(0);
  const PROMO_VISIBLE = 5;
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'promo'>('all');

  const promotionProducts = productsData.filter(
    product => product.discount && Number(product.discountValue) > 0
  );
  const bestSellers = productsData.filter(p => p.showInBestSellers);
  const newProducts = productsData.filter(p => p.showInNew);
  const recommendedProducts = productsData.filter(p => p.showInRecommended);

  const loadProducts = useCallback(async () => {
    try {
      setLoadingProducts(true);
      const stored = await AsyncStorage.getItem(PRODUCTS_KEY);
      const parsed: Product[] = stored
        ? JSON.parse(stored)
            .map((p: any) => ({
              ...p,
              discount: p.discount ?? false,
              discountValue: p.discountValue ?? 0,
            }))
            .map(normalizeProduct)
        : [];
      setProductsData(parsed);
    } catch (error) {
      console.error('Erro ao carregar produtos', error);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  const allProducts = productsData;
  const visibleProducts =
    selectedCategory === 'promo' ? promotionProducts : allProducts;

  const gridProducts =
    recommendedProducts.length && selectedCategory !== 'promo'
      ? recommendedProducts
      : visibleProducts;

  const visiblePromotions =
    promotionProducts.length > PROMO_VISIBLE
      ? [...promotionProducts, ...promotionProducts].slice(
          promoIndex,
          promoIndex + PROMO_VISIBLE
        )
      : promotionProducts;

  const visibleCategories = sortedCategories;

  useEffect(() => {
    setSelectedCategory('all');
  }, []);

  useEffect(() => {
    if (promotionProducts.length <= PROMO_VISIBLE) return;

    const interval = setInterval(() => {
      setPromoIndex(prev =>
        (prev + PROMO_VISIBLE) % promotionProducts.length
      );
    }, 10000);

    return () => clearInterval(interval);
  }, [promotionProducts.length, PROMO_VISIBLE]);

  useEffect(() => {
    if (sortedCategories.length <= CATEGORIES_VISIBLE) return;

    const interval = setInterval(() => {
      setCategoryIndex(prev =>
        (prev + CATEGORIES_VISIBLE) % sortedCategories.length
      );
    }, 10000);

    return () => clearInterval(interval);
  }, [sortedCategories]);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.setItem('LAST_TAB', '/(tabs)/store').catch(() => {});

      const checkLogin = async () => {
        const user = await AsyncStorage.getItem('LOGGED_USER');
        setIsLogged(!!user);
      };

      checkLogin();
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [loadProducts])
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <StatusBar style="dark" backgroundColor="#fff" />
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
      >

        {/* Header */}
        <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Loja</Text>
          <Pressable
            onPress={() => {
              if (isLogged) {
                router.push('/profile');
              } else {
                router.push('/login');
              }
            }}
            style={styles.profileButton}
          >
            <Image
              source={require('@/assets/images/logo.jpeg')}
              style={styles.profileImage}
              resizeMode="cover"
            />
          </Pressable>
        </View>
        <Pressable
          onPress={() => router.push('/explore')}
          style={styles.searchBar}
        >
          <Text style={styles.searchPlaceholder}>Pesquisar peças</Text>
        </Pressable>
      </View>

      {/* Banner amarelo */}
      <Pressable
        onPress={() => router.push('/promo')}
        style={styles.banner}
      >
        <View>
          <Text style={styles.bannerTitle}>Grandes descontos</Text>
          <Text style={styles.bannerSubtitle}>Até 50%</Text>
        </View>

        <Image
          source={require('@/assets/images/filtros.png')}
          style={styles.bannerImage}
          resizeMode="contain"
        />
      </Pressable>

      {/* Categorias */}
      <Section
        title="Categorias"
        action="Ver todos"
        onPress={() => router.push('/(tabs)/categories')}
      >
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {visibleCategories.map(cat => (
            <Pressable
              key={cat.id}
              style={styles.categoryCard}
              onPress={() => router.push(`/(tabs)/categories/${cat.id}`)}
            >
              <View style={styles.categoryImageWrapper}>
                <Image
                  source={categoryImages[cat.imageKey]}
                  style={styles.categoryImage}
                  resizeMode="contain"
                />
              </View>

              <Text style={styles.categoryName}>{cat.name}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </Section>
      {loadingProducts ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#004CFF" />
          <Text style={styles.loadingText}>A carregar produtos...</Text>
        </View>
      ) : (
        <>
          {/* Mais vendidos */}
          <Section title="Mais vendidos">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {bestSellers.map(product => (
                <Pressable
                  key={product.id}
                  style={styles.bestSellerCard}
                  onPress={() => router.push(`/product/${product.id}?from=/store`)}
                >

                  <Image
                    source={{ uri: product.image }}
                    style={styles.bestSellerImage}
                    resizeMode="contain"
                  />

                  <Text
                    numberOfLines={2}
                    style={styles.productName}
                  >
                    {product.name}
                  </Text>

                  {product.discount ? (
                    <View>
                      <Text style={styles.oldPrice}>€{formatPrice(product.price)}</Text>
                      <Text style={styles.newPrice}>€{formatPrice(getFinalPrice(product))}</Text>
                    </View>
                  ) : (
                    <Text style={styles.price}>
                      €{formatPrice(product.price)}
                    </Text>
                  )}

                </Pressable>
              ))}
            </ScrollView>
          </Section>

          {/* Ofertas especiais */}
          <Section title="Ofertas especiais">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {visiblePromotions.map(product => (
                <Pressable
                  key={product.id}
                  style={styles.offerCard}
                  onPress={() => router.push(`/product/${product.id}?from=/store`)}
                >

                  {product.discount && (
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountText}>
                        -{product.discountValue}%
                      </Text>
                    </View>
                  )}

                  <Image
                    source={{ uri: product.image }}
                    style={styles.offerImage}
                    resizeMode="contain"
                  />

                  <Text style={styles.offerName} numberOfLines={2}>
                    {product.name}
                  </Text>
                  {product.discount ? (
                    <View>
                      <Text style={styles.oldPrice}>
                        €{formatPrice(product.price)}
                      </Text>

                      <Text style={styles.newPrice}>
                        €{formatPrice(getFinalPrice(product))}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.normalPrice}>
                      €{formatPrice(product.price)}
                    </Text>
                  )}

                </Pressable>
              ))}
            </ScrollView>
          </Section>

          {/* Recomendados */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { fontSize: 22 }]}>Recomendados</Text>

            <View style={styles.recommendedGrid}>
              {gridProducts.map(product => (
                <Pressable
                  key={product.id}
                  style={styles.recommendedCard}
                  onPress={() => router.push(`/product/${product.id}?from=/store`)}
                >
                  <Image
                    source={{ uri: product.image }}
                    style={styles.recommendedImage}
                    resizeMode="contain"
                  />

                  <Text style={styles.productName}>
                    {product.name}
                  </Text>

                  {product.discount ? (
                    <View>
                      <Text style={styles.oldPrice}>€{formatPrice(product.price)}</Text>
                      <Text style={styles.newPrice}>€{formatPrice(getFinalPrice(product))}</Text>
                    </View>
                  ) : (
                    <Text style={styles.productPrice}>
                      €{formatPrice(product.price)}
                    </Text>
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        </>
      )}

      </ScrollView>
    </SafeAreaView>
  );
}

/* COMPONENTES */

function Section({ title, action, onPress, children }: any) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {action && (
          onPress ? (
            <Pressable onPress={onPress}>
              <Text style={styles.action}>{action}</Text>
            </Pressable>
          ) : (
            <Text style={styles.action}>{action}</Text>
          )
        )}
      </View>
      {children}
    </View>
  );
}

/* ESTILOS */

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: { marginBottom: 12 },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 28, fontWeight: 'bold' },
  profileButton: {
    padding: 4,
  },
  profileImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  searchBar: {
    backgroundColor: '#F2F2F2',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    marginBottom: 12,
  },
  searchPlaceholder: {
    color: '#888',
    fontSize: 16,
  },
  loadingBox: {
    backgroundColor: '#F4F6FF',
    borderRadius: 12,
    paddingVertical: 32,
    paddingHorizontal: 16,
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#004CFF',
    fontWeight: '600',
  },
  banner: {
    marginTop: 10,
    backgroundColor: '#F6B21A',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  bannerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  bannerSubtitle: {
    color: '#fff',
    marginTop: 4,
  },
  bannerImage: {
    width: 120,
    height: 80,
  },
  section: { marginBottom: 26 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  sectionTitle: { fontSize: 20, fontWeight: 'bold' },
  action: { color: '#1E90FF' },

  categoriesScroll: {
    paddingRight: 20,
  },

  categoryCard: {
    width: 120,
    alignItems: 'center',
    marginRight: 16,
  },
  categoryImageWrapper: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  categoryImage: {
    width: '90%',
    height: '90%',
  },
  categoryName: {
    marginTop: 8,
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 13,
  },
  categoryCount: {
    color: '#777',
    textAlign: 'center',
  },

  horizontalCard: {
    width: 120,
    height: 80,
    marginRight: 12,
    borderRadius: 12,
    backgroundColor: '#f1f1f1'
  },
  horizontalImage: { width: '100%', height: '100%', borderRadius: 12 },

  bestSellerCard: {
    width: 150,
    marginRight: 16,
  },
  bestSellerImage: {
    width: '100%',
    height: 110,
    borderRadius: 14,
    backgroundColor: '#F2F2F2',
    marginBottom: 8,
  },

  newProductCard: {
    width: 150,
    marginRight: 16,
  },
  newProductImage: {
    width: '100%',
    height: 110,
    borderRadius: 14,
    backgroundColor: '#F2F2F2',
    marginBottom: 8,
  },
  newBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#0A58FF',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    zIndex: 1,
  },
  newBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },

  offerCard: {
    width: 160,
    marginRight: 16,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    padding: 12,
    position: 'relative',
  },
  offerImage: {
    width: '100%',
    height: 110,
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 1,
  },
  discountText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  offerName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
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
  normalPrice: {
    fontSize: 18,
    fontWeight: '700',
  },
  recommendedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  recommendedCard: {
    width: '48%',
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  recommendedImage: {
    width: '100%',
    height: 120,
    marginBottom: 8,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
});
