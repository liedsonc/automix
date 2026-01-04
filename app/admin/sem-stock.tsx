import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAdminGuard } from '../../hooks/useAdminGuard';

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
  createdAt?: string;
  category?: string;
};

const PRODUCTS_KEY = 'PRODUCTS';

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

export default function SemStock() {
  useAdminGuard();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [notifiedProducts, setNotifiedProducts] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  const loadProducts = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(PRODUCTS_KEY);
      const parsed: Product[] = stored ? JSON.parse(stored).map(normalizeProduct) : [];
      setProducts(parsed);

      const initialQty: Record<number, number> = {};
      parsed.forEach(p => {
        if (p.stock <= 0) initialQty[p.id] = 1;
      });
      setQuantities(initialQty);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar os produtos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [loadProducts])
  );

  const outOfStock = useMemo(
    () => products.filter(product => product.stock === 0),
    [products]
  );

  const handleChangeQty = (id: number, delta: number) => {
    setQuantities(prev => {
      const current = prev[id] ?? 1;
      const next = Math.max(1, current + delta);
      return { ...prev, [id]: next };
    });
  };

  const handleRemove = (id: number) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const handleOpenProduct = (id: number) => {
    router.push(`/product/${id}?from=/admin/sem-stock` as any);
  };

  const handleOrderAll = async () => {
    if (!outOfStock.length) return;

    try {
      // Agrupar produtos por fornecedor
      const supplierProducts = outOfStock.reduce((acc, product) => {
        const supplierId = String(product.supplierId);
        if (!acc[supplierId]) {
          acc[supplierId] = [];
        }
        acc[supplierId].push({
          name: product.name,
          quantity: quantities[product.id] ?? 1,
        });
        return acc;
      }, {} as Record<string, Array<{ name: string; quantity: number }>>);

      // Criar notificações para cada fornecedor
      const stored = await AsyncStorage.getItem('NOTIFICATIONS');
      const notifications = stored ? JSON.parse(stored) : [];

      Object.entries(supplierProducts).forEach(([supplierId, products]) => {
        const productList = products
          .map(p => `${p.quantity}x ${p.name}`)
          .join(', ');

        const notification = {
          id: `restock-${supplierId}-${Date.now()}`,
          userId: supplierId,
          title: 'Pedido de Reposição de Stock',
          message: `A administração solicita a reposição dos seguintes produtos: ${productList}`,
          type: 'restock',
          read: false,
          createdAt: new Date().toISOString(),
        };

        notifications.push(notification);
      });

      await AsyncStorage.setItem('NOTIFICATIONS', JSON.stringify(notifications));

      // Marcar todos os produtos como notificados
      const productIds = new Set(outOfStock.map(p => p.id));
      setNotifiedProducts(productIds);

      Alert.alert('Pedido enviado', 'Os fornecedores foram notificados para repor o stock.', [
        { text: 'Ok' }
      ]);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível enviar as notificações.');
    }
  };

  const renderItem = ({ item }: { item: Product }) => {
    const qty = quantities[item.id] ?? 1;

    return (
      <View style={styles.card}>
        <View style={styles.thumbWrapper}>
          {item.image ? (
            <Image
              source={{ uri: item.image }}
              style={styles.thumb}
              contentFit="contain"
            />
          ) : (
            <View style={styles.thumbPlaceholder} />
          )}

        <Pressable style={styles.trashButton} onPress={() => handleRemove(item.id)}>
          <Text style={styles.trashIcon}>{'\uD83D\uDDD1'}</Text>
        </Pressable>
        </View>

        <View style={styles.info}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.price}>€{item.price.toFixed(2)}</Text>

          {notifiedProducts.has(item.id) && (
            <View style={styles.notifiedBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#16a34a" />
              <Text style={styles.notifiedText}>Fornecedor notificado</Text>
            </View>
          )}

          <View style={styles.controlsRow}>
            <View style={styles.stepper}>
              <Pressable
                hitSlop={10}
                style={styles.stepperButton}
                onPress={() => handleChangeQty(item.id, -1)}
              >
                <Text style={styles.stepperText}>-</Text>
              </Pressable>
              <View style={styles.stepperValueWrapper}>
                <Text style={styles.stepperValue}>{qty}</Text>
              </View>
              <Pressable
                hitSlop={10}
                style={styles.stepperButton}
                onPress={() => handleChangeQty(item.id, 1)}
              >
                <Text style={styles.stepperText}>+</Text>
              </Pressable>
            </View>

            <Pressable style={styles.viewButton} onPress={() => handleOpenProduct(item.id)}>
              <Text style={styles.viewText}>Ver</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.screenHeader}>
        <Pressable style={styles.roundBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1B2C48" />
        </Pressable>

        <View>
          <Text style={styles.title}>SEM STOCK</Text>
          <Text style={styles.subtitle}>Estes artigos ficaram sem stock</Text>
        </View>
      </View>

      <FlatList
        data={outOfStock}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={!loading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Tudo reposto</Text>
            <Text style={styles.emptyText}>Nenhum artigo em ruptura neste momento.</Text>
          </View>
        ) : null}
        showsVerticalScrollIndicator={false}
      />

      {outOfStock.length > 0 && (
        <Pressable style={styles.footerButton} onPress={handleOrderAll}>
          <Text style={styles.footerText}>Pedir todos</Text>
        </Pressable>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 10,
    marginBottom: 6,
  },
  roundBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.2,
    color: '#1a1a1a',
  },
  subtitle: { color: '#444', marginTop: 2, fontSize: 15 },
  listContent: { padding: 20, paddingBottom: 120 },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  thumbWrapper: {
    width: 110,
    height: 120,
    borderRadius: 16,
    backgroundColor: '#f6f7fb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    position: 'relative',
  },
  thumb: { width: '90%', height: '90%' },
  thumbPlaceholder: {
    width: '90%',
    height: '90%',
    borderRadius: 14,
    backgroundColor: '#e5e7eb',
  },
  trashButton: {
    position: 'absolute',
    left: 10,
    bottom: 10,
  },
  trashIcon: { fontSize: 18, color: '#d94646' },
  info: { flex: 1, justifyContent: 'space-between' },
  name: { fontSize: 17, fontWeight: '700', color: '#111' },
  price: { fontSize: 20, fontWeight: '800', marginTop: 4 },
  notifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#86efac',
    alignSelf: 'flex-start',
  },
  notifiedText: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '600',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepperButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: '#1f51ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperText: { fontSize: 20, color: '#1f51ff', fontWeight: '700' },
  stepperValueWrapper: {
    minWidth: 46,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  stepperValue: { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
  viewButton: {
    backgroundColor: '#1f51ff',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
  },
  viewText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  footerButton: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 24,
    backgroundColor: '#1f51ff',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  footerText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  emptyState: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  emptyText: { color: '#555' },
});
