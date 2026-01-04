import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cartEventEmitter } from '../../utils/cartEvents';

type CartItem = {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  stock: number;
  image: string;
  discount?: boolean;
  discountValue?: number;
};

type WishlistItem = {
  productId: number;
  name: string;
  price: number;
  stock: number;
  image: string;
  discount?: boolean;
  discountValue?: number;
};

const CART_KEY = 'CART';
const WISHLIST_KEY = 'WISHLIST';
const formatCurrency = (value: number) => `€${value.toFixed(2)}`;

const getFinalPrice = (item: CartItem) => {
  if (!item.discount || !item.discountValue) return item.price;
  return item.price - (item.price * item.discountValue) / 100;
};

export default function Cart() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [address, setAddress] = useState('');
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const checkRole = async () => {
        try {
          const stored = await AsyncStorage.getItem('LOGGED_USER');
          const role = stored ? JSON.parse(stored)?.role : null;

          if (role !== 'cliente') {
            setAllowed(false);
            Alert.alert('Sem permissão', 'Apenas clientes podem aceder ao carrinho');
            router.replace('/(tabs)/store');
            return;
          }

          setAllowed(true);
          loadAll();
        } catch {
          setAllowed(false);
          router.replace('/(tabs)/store');
        }
      };

      checkRole();
    }, [])
  );

  if (allowed === false) return null;

  const loadAddress = async () => {
    try {
      const stored = await AsyncStorage.getItem('DELIVERY_ADDRESS');
      if (stored) {
        const data = JSON.parse(stored);
        const parts = [data.address, data.city, data.postalCode, data.country].filter(Boolean);
        setAddress(parts.length > 0 ? parts.join(', ') : 'Definir morada');
      } else {
        setAddress('Definir morada');
      }
    } catch {
      setAddress('Definir morada');
    }
  };

  const loadCart = async () => {
    try {
      const stored = await AsyncStorage.getItem(CART_KEY);
      if (stored) {
        setCartItems(JSON.parse(stored));
      } else {
        setCartItems([]);
      }
    } catch {
      setCartItems([]);
    }
  };

  const loadWishlist = async () => {
    try {
      const stored = await AsyncStorage.getItem(WISHLIST_KEY);
      if (stored) {
        setWishlistItems(JSON.parse(stored));
      } else {
        setWishlistItems([]);
      }
    } catch {
      setWishlistItems([]);
    }
  };

  const loadAll = async () => {
    await Promise.all([loadCart(), loadWishlist(), loadAddress()]);
  };

  const removeFromCart = async (productId: number) => {
    const updated = cartItems.filter(i => i.productId !== productId);
    setCartItems(updated);
    await AsyncStorage.setItem(CART_KEY, JSON.stringify(updated));
    cartEventEmitter.emit();
  };

  const updateQuantity = async (productId: number, quantity: number) => {
    const item = cartItems.find(i => i.productId === productId);
    if (!item) return;

    if (quantity > item.stock) {
      Alert.alert(
        'Stock insuficiente',
        `Só existem ${item.stock} unidades disponíveis.`
      );
      return;
    }

    if (quantity <= 0) {
      await removeFromCart(productId);
      return;
    }

    const updated = cartItems.map(i =>
      i.productId === productId ? { ...i, quantity } : i
    );

    setCartItems(updated);
    await AsyncStorage.setItem(CART_KEY, JSON.stringify(updated));
    cartEventEmitter.emit();
  };

  const total = cartItems.reduce((sum, item) => {
    const finalPrice = getFinalPrice(item);
    return sum + finalPrice * item.quantity;
  }, 0);

  const addWishlistItemToCart = async (item: WishlistItem) => {
    try {
      const stored = await AsyncStorage.getItem(CART_KEY);
      const current: CartItem[] = stored ? JSON.parse(stored) : [];

      const existing = current.find(c => c.productId === item.productId);
      if (existing) {
        if (existing.quantity >= existing.stock) {
          Alert.alert(
            'Stock insuficiente',
            `Só existem ${existing.stock} unidades disponíveis.`
          );
          return;
        }
        existing.quantity += 1;
      } else {
        current.push({
          productId: item.productId,
          name: item.name,
          price: item.price,
          image: item.image,
          quantity: 1,
          stock: item.stock,
          discount: item.discount,
          discountValue: item.discountValue,
        });
      }

      setCartItems(current);
      await AsyncStorage.setItem(CART_KEY, JSON.stringify(current));
      cartEventEmitter.emit();

      const updatedWishlist = wishlistItems.filter(w => w.productId !== item.productId);
      setWishlistItems(updatedWishlist);
      await AsyncStorage.setItem(WISHLIST_KEY, JSON.stringify(updatedWishlist));

      Alert.alert('Sucesso', `${item.name} adicionado ao carrinho`);
    } catch {
      Alert.alert('Erro', 'Não foi possível adicionar ao carrinho');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </Pressable>
        <Text style={styles.headerTitle}>Carrinho</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{cartItems.length}</Text>
        </View>
      </View>

      <View style={styles.addressCard}>
        <View>
          <Text style={styles.addressTitle}>Morada de entrega</Text>
          <Text style={styles.addressText}>{address}</Text>
        </View>
        <Pressable style={styles.editBtn} onPress={() => router.push('/settings/address')}>
          <Ionicons name="pencil" size={18} color="#fff" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {cartItems.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="bag-handle-outline" size={84} color="#0A4CFF" />
            <Text style={styles.emptyText}>Carrinho vazio</Text>
          </View>
        ) : (
          <View style={styles.itemsList}>
            {cartItems.map(item => (
              <View key={item.productId} style={styles.cartItem}>
                {(() => {
                  const imageUri = item.image && item.image.trim().length > 0
                    ? item.image
                    : 'https://via.placeholder.com/150';
                  return <Image source={{ uri: imageUri }} style={styles.itemImage} />;
                })()}

                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  {item.discount && item.discountValue ? (
                    <View>
                      <Text style={styles.oldPrice}>{formatCurrency(item.price)}</Text>
                      <Text style={styles.itemPrice}>{formatCurrency(getFinalPrice(item))}</Text>
                    </View>
                  ) : (
                    <Text style={styles.itemPrice}>{formatCurrency(item.price)}</Text>
                  )}
                </View>

                <View style={styles.rightControls}>
                  <Pressable onPress={() => updateQuantity(item.productId, item.quantity - 1)}>
                    <Ionicons name="remove-circle-outline" size={24} color="#0A4CFF" />
                  </Pressable>

                  <Text style={styles.quantity}>{item.quantity}</Text>

                  <Pressable
                    onPress={() => {
                      if (item.quantity >= item.stock) {
                        Alert.alert(
                          'Stock máximo atingido',
                          `Só existem ${item.stock} unidades disponíveis.`
                        );
                        return;
                      }
                      updateQuantity(item.productId, item.quantity + 1);
                    }}
                  >
                    <Ionicons name="add-circle-outline" size={24} color="#0A4CFF" />
                  </Pressable>

                  <Pressable onPress={() => removeFromCart(item.productId)}>
                    <Ionicons name="trash-outline" size={20} color="#FF4D4F" />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.wishlistSection}>
          <Text style={styles.wishlistTitle}>Lista de desejos</Text>

          {wishlistItems.length === 0 ? (
            <Text style={styles.emptyText}>Sem itens na lista de desejos</Text>
          ) : (
            wishlistItems.map(item => (
              <View key={item.productId} style={styles.wishlistItem}>
                {(() => {
                  const imageUri = item.image && item.image.trim().length > 0
                    ? item.image
                    : 'https://via.placeholder.com/150';
                  return <Image source={{ uri: imageUri }} style={styles.wishlistImage} />;
                })()}

                <View style={styles.wishlistInfo}>
                  <Text style={styles.wishlistName}>{item.name}</Text>
                  <Text style={styles.wishlistPrice}>{formatCurrency(item.price)}</Text>
                  <Text style={styles.wishlistStock}>{item.stock} em Stock</Text>
                </View>

                <Pressable style={styles.addToCartBtn} onPress={() => addWishlistItemToCart(item)}>
                  <Ionicons name="cart-outline" size={22} color="#0A4CFF" />
                </Pressable>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <View style={styles.totalGroup}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
          </View>

          <Pressable
            style={[styles.checkoutBtn, cartItems.length === 0 && styles.checkoutBtnDisabled]}
            disabled={cartItems.length === 0}
            onPress={() => router.push('/checkout')}
          >
            <Text style={[styles.checkoutText, cartItems.length === 0 && styles.checkoutTextDisabled]}>
              Pagar
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  /* HEADER */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
  },
  backButton: {
    marginRight: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#000',
    flex: 1,
  },
  badge: {
    backgroundColor: '#EEF2FF',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontWeight: '700',
    color: '#000',
  },

  /* ADDRESS */
  addressCard: {
    marginHorizontal: 20,
    marginVertical: 12,
    backgroundColor: '#F7F7F7',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addressTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 13,
    color: '#555',
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0A4CFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* LIST */
  itemsList: {
    paddingBottom: 140,
  },

  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },

  itemImage: {
    width: 72,
    height: 72,
    borderRadius: 14,
    marginRight: 12,
    backgroundColor: '#F2F2F2',
  },

  itemInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    marginBottom: 6,
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
  },
  oldPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
    marginBottom: 2,
  },
  rightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  quantity: {
    fontSize: 16,
    fontWeight: '700',
    marginVertical: 2,
    paddingHorizontal: 4,
  },

  /* WISHLIST */
  wishlistSection: {
    marginTop: 24,
  },
  wishlistTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 12,
  },
  wishlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    elevation: 2,
  },
  wishlistImage: {
    width: 64,
    height: 64,
    borderRadius: 14,
    marginRight: 12,
  },
  wishlistInfo: {
    flex: 1,
  },
  wishlistName: {
    fontWeight: '700',
    marginBottom: 4,
  },
  wishlistPrice: {
    fontSize: 16,
    fontWeight: '800',
  },
  wishlistStock: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  addToCartBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#0A4CFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* FOOTER */
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  totalGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  totalLabel: {
    fontSize: 22,
    fontWeight: '800',
    color: '#000',
  },
  checkoutBtn: {
    height: 52,
    paddingHorizontal: 50,
    backgroundColor: '#0A4CFF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  checkoutBtnDisabled: {
    backgroundColor: '#d7d7d7',
  },
  checkoutTextDisabled: {
    color: '#888',
  },

  /* EMPTY */
  empty: {
    alignItems: 'center',
    marginTop: 80,
    marginBottom: 40,
  },
  emptyText: {
    marginTop: 12,
    color: '#999',
  },
});
