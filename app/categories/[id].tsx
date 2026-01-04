import categories from '@/data/categories.json';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
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

// Reutiliza estrutura de produto usada na store
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
  discountValue: number;
  categoryId?: number;
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
    categoryId: product.categoryId ? Number(product.categoryId) : undefined,
  };
};

export default function CategoryProductsScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const categoryId = useMemo(() => {
    const raw = Array.isArray(id) ? id[0] : id;
    return raw ? Number(raw) : NaN;
  }, [id]);

  const category = useMemo(
    () => categories.find(c => Number(c.id) === categoryId),
    [categoryId]
  );

  const categoryName = category?.name;
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
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

        const filtered = parsed.filter(p => {
          const byId = Number(p.categoryId) === categoryId;
          const byName = categoryName && p.category === categoryName;
          return byId || byName;
        });

        setProducts(filtered);
      } catch (error) {
        console.error('Erro ao carregar produtos por categoria', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    if (!isNaN(categoryId)) loadProducts();
  }, [categoryId, categoryName]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/store');
    }
  };

  const title = categoryName || 'Categoria';

  const sortedProducts = useMemo(() => {
    const sorted = [...products].sort((a, b) => {
      const priceA = getFinalPrice(a);
      const priceB = getFinalPrice(b);
      if (priceA === priceB) return a.name.localeCompare(b.name);
      return sortOrder === 'asc' ? priceA - priceB : priceB - priceA;
    });
    return sorted;
  }, [products, sortOrder]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#000" />
        </Pressable>
        <Text style={styles.headerTitle}>{title}</Text>
        <Pressable
          style={styles.sortBtn}
          onPress={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
        >
          <Ionicons
            name={sortOrder === 'asc' ? 'arrow-down' : 'arrow-up'}
            size={16}
            color="#0A4CFF"
          />
          <Text style={styles.sortText}>
            {sortOrder === 'asc' ? 'Mais baratos' : 'Mais caros'}
          </Text>
        </Pressable>
        <Text style={styles.count}>{products.length}</Text>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#004CFF" />
          <Text style={styles.loadingText}>A carregar produtos...</Text>
        </View>
      ) : products.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="albums-outline" size={64} color="#9CA3AF" />
          <Text style={styles.emptyText}>Sem produtos nesta categoria.</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        >
          {sortedProducts.map(product => (
            <Pressable
              key={product.id}
              style={styles.card}
              onPress={() => router.push(`/product/${product.id}?from=/(tabs)/categories/${categoryId}`)}
            >
              <Image
                source={{ uri: product.image }}
                style={styles.image}
                resizeMode="contain"
              />

              <View style={styles.info}>
                <Text style={styles.name} numberOfLines={2}>
                  {product.name}
                </Text>
                <Text style={styles.price}>
                  €{formatPrice(getFinalPrice(product))}
                </Text>
                {product.discount && (
                  <Text style={styles.oldPrice}>€{formatPrice(product.price)}</Text>
                )}
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    color: '#000',
  },
  count: {
    backgroundColor: '#EEF2FF',
    color: '#000',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    fontWeight: '700',
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#666',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 10,
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 12,
    gap: 10,
  },
  image: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
  },
  info: { flex: 1, gap: 6 },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
  },
  price: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0A4CFF',
  },
  oldPrice: {
    fontSize: 12,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    marginRight: 8,
  },
  sortText: {
    color: '#0A4CFF',
    fontWeight: '700',
    fontSize: 12,
  },
});
