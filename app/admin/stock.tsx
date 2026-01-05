import { productImages } from '@/constants/images';
import categories from '@/data/categories.json';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

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
  category?: string;
  categoryId?: number;
};

const PRODUCTS_KEY = 'PRODUCTS';

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

const normalizeProduct = (product: any): Product => ({
  id: Number(product.id ?? 0),
  name: String(product.name ?? ''),
  description: String(product.description ?? ''),
  price: Number(product.price ?? 0),
  stock: Number(product.stock ?? 0),
  image: String(product.image ?? ''),
  supplierId: Number(product.supplierId ?? 0),
  discount: Boolean(product.discount) ?? false,
  discountValue: Number(product.discountValue ?? 0),
  category: product.category,
  categoryId: product.categoryId ? Number(product.categoryId) : undefined,
});

const formatPrice = (value: number) => {
  return `€${value.toFixed(2)}`;
};

const getFinalPrice = (product: Product) => {
  if (!product.discount) return product.price;
  return product.price - (product.price * product.discountValue) / 100;
};

export default function AdminStock() {
  useAdminGuard();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const stored = await AsyncStorage.getItem(PRODUCTS_KEY);
      const parsed: Product[] = stored ? JSON.parse(stored).map(normalizeProduct) : [];
      setProducts(parsed);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [loadProducts])
  );

  const filteredProducts = useMemo(() => {
    if (!selectedCategory) return products;
    return products.filter(p => {
      const byId = Number(p.categoryId) === selectedCategory;
      const category = categories.find(c => c.id === selectedCategory);
      const byName = category && p.category === category.name;
      return byId || byName;
    });
  }, [products, selectedCategory]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/profile');
    }
  };

  const handleProductPress = (id: number) => {
    router.push(`/product/${id}?from=/admin/stock`);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#000" />
        </Pressable>
        <Text style={styles.headerTitle}>Todos os Produtos</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{filteredProducts.length}</Text>
        </View>
      </View>

      <View style={styles.categoryFilterWrapper}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoryFilter}
          contentContainerStyle={styles.categoryFilterContent}
        >
        <Pressable
          style={[styles.categoryChip, !selectedCategory && styles.categoryChipActive]}
          onPress={() => setSelectedCategory(null)}
        >
          <Text style={[styles.categoryChipText, !selectedCategory && styles.categoryChipTextActive]}>
            Todas
          </Text>
        </Pressable>
        {categories.map(cat => (
          <Pressable
            key={cat.id}
            style={[styles.categoryChip, selectedCategory === cat.id && styles.categoryChipActive]}
            onPress={() => setSelectedCategory(cat.id)}
          >
            <Text style={[styles.categoryChipText, selectedCategory === cat.id && styles.categoryChipTextActive]}>
              {cat.name}
            </Text>
          </Pressable>
        ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#004CFF" />
          <Text style={styles.loadingText}>A carregar produtos...</Text>
        </View>
      ) : filteredProducts.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="cube-outline" size={64} color="#9CA3AF" />
          <Text style={styles.emptyText}>
            {selectedCategory ? 'Sem produtos nesta categoria' : 'Nenhum produto encontrado'}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        >
          {filteredProducts.map(product => (
            <Pressable
              key={product.id}
              style={styles.card}
              onPress={() => handleProductPress(product.id)}
            >
              <Image
                source={getProductImageSource(product.id, product.image)}
                style={styles.image}
                resizeMode="contain"
              />

              <View style={styles.info}>
                <Text style={styles.name} numberOfLines={2}>
                  {product.name}
                </Text>
                
                <View style={styles.priceRow}>
                  {product.discount ? (
                    <>
                      <Text style={styles.oldPrice}>{formatPrice(product.price)}</Text>
                      <Text style={styles.price}>{formatPrice(getFinalPrice(product))}</Text>
                      <View style={styles.discountBadge}>
                        <Text style={styles.discountText}>-{product.discountValue}%</Text>
                      </View>
                    </>
                  ) : (
                    <Text style={styles.price}>{formatPrice(product.price)}</Text>
                  )}
                </View>

                <View style={styles.stockRow}>
                  <Ionicons 
                    name={product.stock > 0 ? "checkmark-circle" : "close-circle"} 
                    size={16} 
                    color={product.stock > 0 ? "#16a34a" : "#ef4444"} 
                  />
                  <Text style={[styles.stock, product.stock === 0 && styles.stockZero]}>
                    Stock: {product.stock}
                  </Text>
                </View>

                {product.category && (
                  <Text style={styles.category}>{product.category}</Text>
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
  countBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  countText: {
    color: '#000',
    fontWeight: '700',
  },
  categoryFilterWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    minHeight: 60,
  },
  categoryFilter: {
    flexGrow: 0,
  },
  categoryFilterContent: {
    paddingHorizontal: 16,
    paddingVertical: 15,
    gap: 10,
    alignItems: 'center',
  },
  categoryChip: {
    paddingHorizontal: 17,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#0A4CFF',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  categoryChipTextActive: {
    color: '#fff',
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
    fontSize: 16,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 14,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 12,
    gap: 12,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
  },
  info: {
    flex: 1,
    gap: 6,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  price: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0A4CFF',
  },
  oldPrice: {
    fontSize: 14,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stock: {
    fontSize: 14,
    color: '#16a34a',
    fontWeight: '600',
  },
  stockZero: {
    color: '#ef4444',
  },
  category: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
});
