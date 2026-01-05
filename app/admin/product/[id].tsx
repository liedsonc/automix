import { useAdminGuard } from '@/hooks/useAdminGuard';
import { productImages } from '@/constants/images';
import { STORAGE_KEYS } from '@/utils/storageKeys';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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

type Order = {
  id: string;
  userId?: string;
  items: Array<{
    productId: number;
    quantity: number;
    price: number;
    name?: string;
    supplierId?: string | number;
  }>;
  orderStatus: string;
  createdAt: string;
  isStockRequest?: boolean;
  requestedBy?: string;
};

const PRODUCTS_KEY = 'PRODUCTS';
const NOTIFICATIONS_KEY = 'NOTIFICATIONS';

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

const formatPrice = (value: number) => {
  return `€${value.toFixed(2)}`;
};

export default function AdminProductDetail() {
  useAdminGuard();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const productId = useMemo(() => {
    const raw = Array.isArray(id) ? id[0] : id;
    return raw ? Number(raw) : NaN;
  }, [id]);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [salesStats, setSalesStats] = useState({ totalSold: 0, totalRevenue: 0 });
  const [modalVisible, setModalVisible] = useState(false);
  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [supplierSelectModalVisible, setSupplierSelectModalVisible] = useState(false);
  const [newStock, setNewStock] = useState('');
  const [requestQuantity, setRequestQuantity] = useState('');
  const [suppliers, setSuppliers] = useState<Array<{ id: string | number; name: string; email: string }>>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | number | null>(null);

  useEffect(() => {
    if (!isNaN(productId)) {
      loadProduct();
      loadSalesStats();
    }
  }, [productId]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const stored = await AsyncStorage.getItem(PRODUCTS_KEY);
      if (!stored) {
        Alert.alert('Erro', 'Produto não encontrado');
        router.back();
        return;
      }

      const products: Product[] = JSON.parse(stored);
      const found = products.find(p => Number(p.id) === productId);

      if (!found) {
        Alert.alert('Erro', 'Produto não encontrado');
        router.back();
        return;
      }

      setProduct(found);
      setNewStock(String(found.stock || 0));
      
      // Load suppliers and set default
      await loadSuppliersForProduct(found);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar o produto');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const loadSuppliersForProduct = async (productData: Product) => {
    try {
      const usersRaw = await AsyncStorage.getItem('USERS');
      if (!usersRaw) {
        setSuppliers([]);
        return;
      }
      const users = JSON.parse(usersRaw);
      const activeSuppliers = users.filter(
        (u: any) => u.role === 'fornecedor' && (u.approved === true || u.approved === undefined)
      );
      setSuppliers(activeSuppliers.map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
      })));
      
      // Set default supplier to product's supplier if available
      if (productData && productData.supplierId) {
        const productSupplier = activeSuppliers.find(
          (u: any) => String(u.id) === String(productData.supplierId)
        );
        if (productSupplier) {
          setSelectedSupplierId(productSupplier.id);
        } else if (activeSuppliers.length === 1) {
          // If product supplier not found but only one supplier, use that
          setSelectedSupplierId(activeSuppliers[0].id);
        }
      } else if (activeSuppliers.length === 1) {
        setSelectedSupplierId(activeSuppliers[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
      setSuppliers([]);
    }
  };

  const loadSalesStats = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.ORDERS);
      if (!stored) {
        setSalesStats({ totalSold: 0, totalRevenue: 0 });
        return;
      }

      const orders: Order[] = JSON.parse(stored);
      let totalSold = 0;
      let totalRevenue = 0;

      orders.forEach(order => {
        if (order.orderStatus === 'ENTREGUE') {
          order.items.forEach(item => {
            if (Number(item.productId) === productId) {
              totalSold += item.quantity || 0;
              totalRevenue += (item.price || 0) * (item.quantity || 0);
            }
          });
        }
      });

      setSalesStats({ totalSold, totalRevenue });
    } catch (error) {
      setSalesStats({ totalSold: 0, totalRevenue: 0 });
    }
  };

  const handleUpdateStock = async () => {
    if (!product) return;

    const stockValue = parseInt(newStock);
    if (isNaN(stockValue) || stockValue < 0) {
      Alert.alert('Erro', 'Valor de stock inválido');
      return;
    }

    try {
      const stored = await AsyncStorage.getItem(PRODUCTS_KEY);
      if (!stored) return;

      const products: Product[] = JSON.parse(stored);
      const updated = products.map(p =>
        Number(p.id) === productId ? { ...p, stock: stockValue } : p
      );

      await AsyncStorage.setItem(PRODUCTS_KEY, JSON.stringify(updated));
      setProduct(prev => prev ? { ...prev, stock: stockValue } : null);
      setModalVisible(false);
      Alert.alert('Sucesso', 'Stock atualizado com sucesso');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar o stock');
    }
  };

  const handleRequestStock = async () => {
    if (!product || !selectedSupplierId) return;

    const quantity = parseInt(requestQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert('Erro', 'Quantidade inválida');
      return;
    }

    try {
      // Get supplier info
      const usersRaw = await AsyncStorage.getItem('USERS');
      const users = usersRaw ? JSON.parse(usersRaw) : [];
      const supplier = users.find((u: any) => 
        String(u.id) === String(selectedSupplierId) || 
        String(u.email) === String(selectedSupplierId)
      );

      if (!supplier) {
        Alert.alert('Erro', 'Fornecedor não encontrado');
        return;
      }

      // Create order for supplier
      const orderId = `STOCK-REQ-${productId}-${Date.now()}`;
      const supplierId = String(supplier.id || selectedSupplierId);
      const order = {
        id: orderId,
        userId: supplierId,
        items: [
          {
            productId: productId,
            name: product.name,
            quantity: quantity,
            price: product.price,
            image: product.image,
            supplierId: supplierId,
            discount: product.discount,
            discountValue: product.discountValue,
            category: product.category,
          },
        ],
        total: product.price * quantity,
        paymentStatus: 'PENDENTE' as const,
        orderStatus: 'AGUARDA_PAGAMENTO' as const,
        isStockRequest: true, // Flag to identify stock request orders
        requestedBy: 'admin',
        createdAt: new Date().toISOString(),
      };

      // Save order
      const ordersRaw = await AsyncStorage.getItem(STORAGE_KEYS.ORDERS);
      const orders = ordersRaw ? JSON.parse(ordersRaw) : [];
      orders.push(order);
      await AsyncStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));

      // Create notification
      const stored = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
      const notifications = stored ? JSON.parse(stored) : [];

      const notification = {
        id: `stock-request-${productId}-${Date.now()}`,
        userId: supplierId,
        userEmail: supplier.email || supplierId,
        message: `A administração solicitou ${quantity} unidades do produto "${product.name}"`,
        type: 'stock_request',
        productId: productId,
        requestedQuantity: quantity,
        orderId: orderId,
        read: false,
        createdAt: new Date().toISOString(),
      };

      notifications.push(notification);
      await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));

      setRequestModalVisible(false);
      setSupplierSelectModalVisible(false);
      setRequestQuantity('');
      setSelectedSupplierId(null);
      Alert.alert('Sucesso', 'Pedido de stock criado e enviado ao fornecedor');
    } catch (error) {
      console.error('Erro ao criar pedido de stock:', error);
      Alert.alert('Erro', 'Não foi possível criar o pedido de stock');
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/admin/stock');
    }
  };

  if (loading || !product) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#004CFF" />
          <Text style={styles.loadingText}>A carregar...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#000" />
        </Pressable>
        <Text style={styles.headerTitle}>Detalhes do Produto</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Image
          source={getProductImageSource(product.id, product.image)}
          style={styles.image}
          resizeMode="contain"
        />

        <Text style={styles.name}>{product.name}</Text>
        {product.description && (
          <Text style={styles.description}>{product.description}</Text>
        )}

        <View style={styles.priceSection}>
          {product.discount ? (
            <>
              <Text style={styles.oldPrice}>{formatPrice(product.price)}</Text>
              <Text style={styles.price}>
                {formatPrice(product.price - (product.price * product.discountValue) / 100)}
              </Text>
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>-{product.discountValue}%</Text>
              </View>
            </>
          ) : (
            <Text style={styles.price}>{formatPrice(product.price)}</Text>
          )}
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Ionicons name="cube-outline" size={24} color="#0A4CFF" />
            <View style={styles.statInfo}>
              <Text style={styles.statLabel}>Stock Atual</Text>
              <Text style={[styles.statValue, product.stock === 0 && styles.statValueZero]}>
                {product.stock} unidades
              </Text>
            </View>
          </View>

          <View style={styles.statItem}>
            <Ionicons name="cart-outline" size={24} color="#16a34a" />
            <View style={styles.statInfo}>
              <Text style={styles.statLabel}>Vendidos</Text>
              <Text style={styles.statValue}>{salesStats.totalSold} unidades</Text>
            </View>
          </View>

          <View style={styles.statItem}>
            <Ionicons name="cash-outline" size={24} color="#f59e0b" />
            <View style={styles.statInfo}>
              <Text style={styles.statLabel}>Receita Total</Text>
              <Text style={styles.statValue}>{formatPrice(salesStats.totalRevenue)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={[styles.actionButton, styles.updateStockButton]}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Atualizar Stock</Text>
          </Pressable>

          <Pressable
            style={[styles.actionButton, styles.requestStockButton]}
            onPress={() => {
              if (suppliers.length === 0) {
                Alert.alert('Erro', 'Nenhum fornecedor ativo encontrado');
                return;
              }
              if (suppliers.length === 1) {
                setSelectedSupplierId(suppliers[0].id);
                setRequestModalVisible(true);
              } else {
                setSupplierSelectModalVisible(true);
              }
            }}
          >
            <Ionicons name="notifications-outline" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Pedir Stock</Text>
          </Pressable>
        </View>
      </ScrollView>

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
            <Text style={styles.modalTitle}>Atualizar Stock</Text>
            <Text style={styles.modalProductName}>{product.name}</Text>

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
                onPress={handleUpdateStock}
              >
                <Text style={styles.confirmBtnText}>Confirmar</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={requestModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRequestModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setRequestModalVisible(false)}
        >
          <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Pedir Stock ao Fornecedor</Text>
            <Text style={styles.modalProductName}>{product.name}</Text>

            <Text style={styles.inputLabel}>Quantidade desejada</Text>
            <TextInput
              style={styles.input}
              value={requestQuantity}
              onChangeText={setRequestQuantity}
              keyboardType="number-pad"
              placeholder="Digite a quantidade"
              placeholderTextColor="#999"
            />

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setRequestModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, styles.confirmBtn]}
                onPress={handleRequestStock}
              >
                <Text style={styles.confirmBtnText}>Enviar Pedido</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Supplier Selection Modal */}
      <Modal
        visible={supplierSelectModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSupplierSelectModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSupplierSelectModalVisible(false)}
        >
          <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Selecionar Fornecedor</Text>
            <Text style={styles.modalProductName}>{product?.name}</Text>

            <ScrollView style={styles.supplierList}>
              {suppliers.map(supplier => (
                <Pressable
                  key={String(supplier.id)}
                  style={[
                    styles.supplierItem,
                    selectedSupplierId === supplier.id && styles.supplierItemSelected,
                  ]}
                  onPress={() => setSelectedSupplierId(supplier.id)}
                >
                  <View style={styles.supplierInfo}>
                    <Text style={styles.supplierName}>{supplier.name}</Text>
                    <Text style={styles.supplierEmail}>{supplier.email}</Text>
                  </View>
                  {selectedSupplierId === supplier.id && (
                    <Ionicons name="checkmark-circle" size={24} color="#0A4CFF" />
                  )}
                </Pressable>
              ))}
            </ScrollView>

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => {
                  setSupplierSelectModalVisible(false);
                  setSelectedSupplierId(null);
                }}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, styles.confirmBtn, !selectedSupplierId && styles.disabledBtn]}
                onPress={() => {
                  if (selectedSupplierId) {
                    setSupplierSelectModalVisible(false);
                    setRequestModalVisible(true);
                  }
                }}
                disabled={!selectedSupplierId}
              >
                <Text style={styles.confirmBtnText}>Continuar</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
  },
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
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  image: {
    width: '100%',
    height: 250,
    borderRadius: 16,
    backgroundColor: '#F2F2F2',
    marginBottom: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    color: '#000',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    lineHeight: 22,
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  price: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0A4CFF',
  },
  oldPrice: {
    fontSize: 20,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  statsCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statInfo: {
    flex: 1,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000',
  },
  statValueZero: {
    color: '#ef4444',
  },
  actions: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  updateStockButton: {
    backgroundColor: '#0A4CFF',
  },
  requestStockButton: {
    backgroundColor: '#f59e0b',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
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
  supplierList: {
    maxHeight: 300,
    marginBottom: 20,
  },
  supplierItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  supplierItemSelected: {
    borderColor: '#0A4CFF',
    backgroundColor: '#EEF2FF',
  },
  supplierInfo: {
    flex: 1,
  },
  supplierName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  supplierEmail: {
    fontSize: 14,
    color: '#666',
  },
  disabledBtn: {
    opacity: 0.5,
  },
});

