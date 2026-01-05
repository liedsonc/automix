import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { productImages } from '@/constants/images';

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
};

const RECENT_PRODUCTS_KEY = 'RECENT_PRODUCTS';

type RecentProduct = {
  id: number;
  name: string;
  image: string;
  price: number;
  category?: string;
  viewedAt: number;
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
  createdAt: product.createdAt ?? new Date().toISOString(),
  category: product.category,
});

export default function ExploreScreen() {
  const [search, setSearch] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [recentProducts, setRecentProducts] = useState<RecentProduct[]>([]);
  const [storedPrevTab, setStoredPrevTab] = useState<string | null>(null);
  const [storedLastTab, setStoredLastTab] = useState<string | null>(null);
  const [loadingFrom, setLoadingFrom] = useState(true);
  const router = useRouter();
  const { from: rawFrom } = useLocalSearchParams<{ from?: string | string[] }>();

  const from = Array.isArray(rawFrom) ? rawFrom[0] : rawFrom;

  useFocusEffect(() => {
    AsyncStorage.setItem('LAST_TAB', '/(tabs)/explore').catch(() => {});
  });

  useFocusEffect(() => {
    const loadRecent = async () => {
      try {
        const stored = await AsyncStorage.getItem(RECENT_PRODUCTS_KEY);
        setRecentProducts(stored ? JSON.parse(stored) : []);
      } catch {
        setRecentProducts([]);
      }
    };

    loadRecent();
  });

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
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const stored = await AsyncStorage.getItem(PRODUCTS_KEY);
    const parsed: Product[] = stored ? JSON.parse(stored).map(normalizeProduct) : [];
    setProducts(parsed);
  };

  const normalizeText = (text: string) =>
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  const filteredProducts = products.filter(product => {
    const matchesSearch = normalizeText(product.name).includes(
      normalizeText(search)
    );

    const matchesCategory = selectedCategory
      ? product.category === selectedCategory
      : true;

    return matchesSearch && matchesCategory;
  });

  const handleBack = () => {
    if (loadingFrom) return;

    const current = '/(tabs)/explore';
    const candidates = [from, storedPrevTab, storedLastTab].filter(
      (p): p is string => Boolean(p && p !== current && !p.includes('/teste'))
    );

    if (candidates.length) {
      router.replace(candidates[0]);
      return;
    }

    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/store');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header + barra de pesquisa */}
        <View style={styles.header}>
          <Pressable onPress={handleBack}>
            <Text style={styles.backIcon}>←</Text>
          </Pressable>

          <TextInput
            placeholder="Pesquisar peças"
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
        </View>

        {/* RESULTADOS DA PESQUISA */}
        {search.length > 0 ? (
          <View style={styles.results}>
            {filteredProducts.map(product => (
              <Pressable
                key={product.id}
                style={styles.resultCard}
                onPress={() => router.push(`/product/${product.id}?from=/explore`)}
              >
                <Image
                  source={getProductImageSource(product.id, product.image)}
                  style={styles.resultImage}
                  contentFit="contain"
                />
                <Text style={styles.resultName}>{product.name}</Text>
                <Text style={styles.resultPrice}>
                  €{product.price.toFixed(2)}
                </Text>
              </Pressable>
            ))}

            {filteredProducts.length === 0 && (
              <Text style={styles.noResults}>
                Nenhum produto encontrado
              </Text>
            )}
          </View>
        ) : (
          <>
            {search.length === 0 && recentProducts.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Vistos recentemente</Text>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {recentProducts.map(product => (
                    <Pressable
                      key={product.id}
                      style={styles.recentCard}
                      onPress={() =>
                        router.push(`/product/${product.id}?from=/explore`)
                      }
                    >
                      <Image
                        source={getProductImageSource(product.id, product.image)}
                        style={styles.recentImage}
                        contentFit="contain"
                      />
                      <Text style={styles.recentName} numberOfLines={1}>
                        {product.name}
                      </Text>
                      <Text style={styles.recentPrice}>
                        €{product.price.toFixed(2)}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Descobrir */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Descobrir</Text>

              <View style={styles.discoverGrid}>
                {products.slice(0, 4).map(product => (
                  <Pressable
                    key={product.id}
                    style={styles.discoverCard}
                    onPress={() => router.push(`/product/${product.id}?from=/explore`)}
                  >
                    <Image
                      source={getProductImageSource(product.id, product.image)}
                      style={styles.discoverImage}
                      contentFit="contain"
                    />
                    <Text style={styles.discoverText}>{product.name}</Text>
                    <Text style={styles.discoverPrice}>
                      €{product.price.toFixed(2)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </>
        )}

      </ScrollView>

      <Modal
        visible={filterVisible}
        animationType="slide"
        transparent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Categorias</Text>

            {[
              'Todas',
              'Bateria',
              'Travões',
              'Filtros',
              'Iluminação',
              'Ferramentas',
              'Suspensão',
              'Motor',
            ].map(category => (
              <Pressable
                key={category}
                style={styles.modalItem}
                onPress={() => {
                  setSelectedCategory(category === 'Todas' ? null : category);
                  setFilterVisible(false);
                }}
              >
                <Text style={styles.modalItemText}>{category}</Text>
              </Pressable>
            ))}

            <Pressable onPress={() => setFilterVisible(false)}>
              <Text style={styles.modalClose}>Fechar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  backIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#F2F2F2',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  filterButton: {
    marginLeft: 12,
    padding: 10,
    backgroundColor: '#F2F2F2',
    borderRadius: 12,
  },
  filterIcon: {
    fontSize: 18,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  trash: {
    fontSize: 18,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    backgroundColor: '#F2F2F2',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 8,
    marginBottom: 8,
  },
  results: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  resultCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  resultImage: {
    width: '100%',
    height: 120,
  },
  resultName: {
    fontSize: 14,
    marginTop: 8,
  },
  resultPrice: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  noResults: {
    textAlign: 'center',
    marginTop: 20,
    color: '#888',
  },
  discoverGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  discoverCard: {
    width: '48%',
    marginBottom: 16,
  },
  discoverImage: {
    width: '100%',
    height: 140,
    marginBottom: 8,
  },
  discoverText: {
    fontSize: 14,
    color: '#555',
  },
  discoverPrice: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 4,
  },
  recentCard: {
    width: 140,
    marginRight: 12,
  },
  recentImage: {
    width: '100%',
    height: 110,
    marginBottom: 6,
  },
  recentName: {
    fontSize: 13,
    color: '#555',
  },
  recentPrice: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  modalItem: {
    paddingVertical: 12,
  },
  modalItemText: {
    fontSize: 16,
  },
  modalClose: {
    textAlign: 'center',
    marginTop: 16,
    fontSize: 16,
    color: '#007AFF',
  },
});
