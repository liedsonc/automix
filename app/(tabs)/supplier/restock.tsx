import { productImages } from '@/constants/images';
import { getCurrentUser } from '@/utils/getCurrentUser';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type Product = {
  id: number;
  name: string;
  price: number;
  stock: number;
  image: string;
  supplierId: number;
  description?: string;
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

type StockRequest = {
  id: string;
  productId: number;
  requestedQuantity: number;
  message: string;
  createdAt: string;
  read: boolean;
};

export default function RestockScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [allSupplierProducts, setAllSupplierProducts] = useState<Product[]>([]);
  const [stockRequests, setStockRequests] = useState<StockRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [newStock, setNewStock] = useState('');

  useEffect(() => {
    checkAccessAndLoad();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!loading) {
        checkAccessAndLoad();
      }
    }, [loading])
  );

  const checkAccessAndLoad = async () => {
    const rawLogged = await AsyncStorage.getItem('LOGGED_USER');
    const loggedUser = rawLogged ? JSON.parse(rawLogged) : null;

    const user =
      loggedUser && loggedUser.role === 'fornecedor'
        ? loggedUser
        : await getCurrentUser<{ id: number | string; role?: string }>();

    if (!user || user.role !== 'fornecedor') {
      Alert.alert('Acesso negado', 'Apenas fornecedores podem aceder a esta página');
      router.replace('/(tabs)/store');
      return;
    }

    await loadProducts(user);
    await loadStockRequests(user);
  };

  const loadStockRequests = async (user: any) => {
    try {
      const supplierId = String(user.id ?? user?.user?.id ?? '');
      const stored = await AsyncStorage.getItem('NOTIFICATIONS');
      if (!stored) {
        setStockRequests([]);
        return;
      }

      const notifications = JSON.parse(stored);
      const requests = notifications
        .filter((n: any) => 
          n.type === 'stock_request' && 
          (String(n.userId) === supplierId || String(n.userEmail) === String(user.email || user.id))
        )
        .map((n: any) => ({
          id: n.id,
          productId: n.productId,
          requestedQuantity: n.requestedQuantity || 0,
          message: n.message,
          createdAt: n.createdAt,
          read: n.read || false,
        }))
        .sort((a: StockRequest, b: StockRequest) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

      setStockRequests(requests);
    } catch (error) {
      console.error('Erro ao carregar pedidos de stock:', error);
      setStockRequests([]);
    }
  };

  const loadProducts = async (user: any) => {
    try {
      const supplierId = String(user.id ?? user?.user?.id ?? '');
      const stored = await AsyncStorage.getItem('PRODUCTS');
      if (!stored) {
        setProducts([]);
        return;
      }

      const allProducts: Product[] = JSON.parse(stored);
      const supplierProducts = allProducts.filter(
        p => String(p.supplierId) === supplierId && (Number(p.stock) === 0 || !p.stock)
      );

      setProducts(supplierProducts);
      setAllSupplierProducts(allProducts.filter(p => String(p.supplierId) === supplierId));
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      Alert.alert('Erro', 'Não foi possível carregar os produtos');
    } finally {
      setLoading(false);
    }
  };

  const openRestockModal = (product: Product) => {
    setSelectedProduct(product);
    setNewStock(String(product.stock || 0));
    setModalVisible(true);
  };

  const handleRestock = async () => {
    if (!selectedProduct) return;

    const stockValue = parseInt(newStock);
    if (isNaN(stockValue) || stockValue < 0) {
      Alert.alert('Erro', 'Valor de stock inválido');
      return;
    }

    try {
      const stored = await AsyncStorage.getItem('PRODUCTS');
      if (!stored) return;

      const allProducts: Product[] = JSON.parse(stored);
      const updatedProducts = allProducts.map(p => {
        if (p.id === selectedProduct.id) {
          return { ...p, stock: stockValue };
        }
        return p;
      });

      await AsyncStorage.setItem('PRODUCTS', JSON.stringify(updatedProducts));

      // Remover produto da lista se o stock deixou de ser 0
      if (stockValue > 0) {
        setProducts(prev => prev.filter(p => p.id !== selectedProduct.id));
        // Mark related stock requests as read
        const stored = await AsyncStorage.getItem('NOTIFICATIONS');
        if (stored) {
          const notifications = JSON.parse(stored);
          const updated = notifications.map((n: any) => {
            if (n.type === 'stock_request' && n.productId === selectedProduct.id) {
              return { ...n, read: true };
            }
            return n;
          });
          await AsyncStorage.setItem('NOTIFICATIONS', JSON.stringify(updated));
          await loadStockRequests(await getCurrentUser());
        }
      } else {
        // Atualizar lista local se ainda for 0
        setProducts(prev =>
          prev.map(p => (p.id === selectedProduct.id ? { ...p, stock: stockValue } : p))
        );
      }

      Alert.alert('Sucesso', 'Stock atualizado com sucesso');
      setModalVisible(false);
      setSelectedProduct(null);
      setNewStock('');
    } catch (error) {
      console.error('Erro ao atualizar stock:', error);
      Alert.alert('Erro', 'Não foi possível atualizar o stock');
    }
  };

  const getStockColor = (stock: number) => {
    if (stock === 0) return '#DC2626';
    if (stock <= 2) return '#F59E0B';
    return '#16A34A';
  };

  const getStockLabel = (stock: number) => {
    if (stock === 0) return 'SEM STOCK';
    if (stock <= 2) return 'BAIXO';
    return 'OK';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text>A carregar...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1B2C48" />
        </Pressable>
        <Text style={styles.headerTitle}>Gerir Stock</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* Stock Requests Section */}
        {stockRequests.length > 0 && (
          <View style={styles.requestsSection}>
            <Text style={styles.sectionTitle}>Pedidos de Stock da Administração</Text>
            {stockRequests.map(request => {
              const product = allSupplierProducts.find(p => p.id === request.productId);
              
              return (
                <View key={request.id} style={styles.requestCard}>
                  <View style={styles.requestHeader}>
                    <Ionicons name="notifications" size={20} color="#f59e0b" />
                    <Text style={styles.requestTitle}>Pedido de Reposição</Text>
                    {!request.read && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={styles.requestMessage}>{request.message}</Text>
                  {product && (
                    <Pressable
                      style={styles.requestProductBtn}
                      onPress={() => {
                        setSelectedProduct(product);
                        setNewStock(String(request.requestedQuantity));
                        setModalVisible(true);
                      }}
                    >
                      <Text style={styles.requestProductBtnText}>
                        Repor {request.requestedQuantity} unidades
                      </Text>
                    </Pressable>
                  )}
                  <Text style={styles.requestDate}>
                    {new Date(request.createdAt).toLocaleString()}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Out of Stock Products Section */}
        <Text style={styles.sectionTitle}>Produtos sem Stock</Text>
        {products.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={64} color="#999" />
            <Text style={styles.emptyText}>Nenhum produto encontrado</Text>
          </View>
        ) : (
          products.map(product => (
            <View key={product.id} style={styles.productCard}>
              <Image source={getProductImageSource(product.id, product.image)} style={styles.productImage} />
              
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>
                  {product.name}
                </Text>
                <Text style={styles.productPrice}>€{product.price.toFixed(2)}</Text>
                
                <View style={styles.stockRow}>
                  <View
                    style={[
                      styles.stockBadge,
                      { backgroundColor: getStockColor(Number(product.stock) || 0) },
                    ]}
                  >
                    <Text style={styles.stockBadgeText}>
                      {getStockLabel(Number(product.stock) || 0)}
                    </Text>
                  </View>
                  <Text style={styles.stockValue}>{Number(product.stock) || 0} unidades</Text>
                </View>
              </View>

              <Pressable
                style={styles.restockBtn}
                onPress={() => openRestockModal(product)}
              >
                <Ionicons name="add-circle" size={24} color="#0A4CFF" />
                <Text style={styles.restockBtnText}>Repor</Text>
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal de reposição */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Repor Stock</Text>
            
            {selectedProduct && (
              <>
                <Text style={styles.modalProductName}>{selectedProduct.name}</Text>
                <Text style={styles.modalCurrentStock}>
                  Stock atual: {Number(selectedProduct.stock) || 0} unidades
                </Text>

                <Text style={styles.inputLabel}>Novo stock</Text>
                <TextInput
                  style={styles.input}
                  value={newStock}
                  onChangeText={setNewStock}
                  keyboardType="number-pad"
                  placeholder="Digite a quantidade"
                  placeholderTextColor="#999"
                />

                <View style={styles.modalButtons}>
                  <Pressable
                    style={[styles.modalBtn, styles.cancelBtn]}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.cancelBtnText}>Cancelar</Text>
                  </Pressable>

                  <Pressable
                    style={[styles.modalBtn, styles.confirmBtn]}
                    onPress={handleRestock}
                  >
                    <Text style={styles.confirmBtnText}>Confirmar</Text>
                  </Pressable>
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8F9FC',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1B2C48',
  },
  container: {
    padding: 20,
    gap: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#999',
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#F2F2F2',
  },
  productInfo: {
    flex: 1,
    gap: 4,
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0A4CFF',
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stockBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  stockValue: {
    fontSize: 13,
    color: '#6B7280',
  },
  restockBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 12,
  },
  restockBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0A4CFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalProductName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalCurrentStock: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#F3F4F6',
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B7280',
  },
  confirmBtn: {
    backgroundColor: '#0A4CFF',
  },
  confirmBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  requestsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
    marginBottom: 12,
  },
  requestCard: {
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  requestTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  requestMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  requestProductBtn: {
    backgroundColor: '#f59e0b',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  requestProductBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  requestDate: {
    fontSize: 12,
    color: '#999',
  },
});
