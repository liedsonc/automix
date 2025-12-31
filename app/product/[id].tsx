import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      setLoading(true);

      const stored = await AsyncStorage.getItem(PRODUCTS_KEY);
      const storedProducts: Product[] = stored
        ? JSON.parse(stored).map(normalizeProduct)
        : [];

      const found = storedProducts.find(p => String(p.id) === String(id));

      setProduct(found ?? null);
    } catch (e) {
      console.error('Erro ao carregar produto', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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
          <Pressable onPress={() => router.back()} style={{ marginTop: 20 }}>
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
        <Pressable onPress={() => router.back()} style={{ marginBottom: 12 }}>
          <Ionicons name="chevron-back" size={24} />
        </Pressable>

        <Image source={{ uri: product.image }} style={styles.image} />

        {product.discount && (
          <View style={styles.promoBadge}>
            <Text style={styles.promoBadgeText}>EM PROMOÇÃO</Text>
          </View>
        )}

        <Text style={styles.title}>{product.name}</Text>

        <View style={styles.priceBlock}>
          {product.discount ? (
            <>
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
        <Pressable style={styles.wishlistBtn}>
          <Ionicons name="heart-outline" size={22} />
        </Pressable>

        <Pressable style={styles.cartBtn}>
          <Text style={styles.cartText}>Carrinho</Text>
        </Pressable>

        <Pressable style={styles.buyBtn}>
          <Text style={styles.buyText}>Comprar agora</Text>
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
  promoBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFD60A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 10,
  },
  promoBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  priceBlock: {
    marginTop: 8,
    marginBottom: 16,
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
