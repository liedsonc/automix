import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cartEventEmitter } from '../utils/cartEvents';

type WishlistItem = {
  productId: number;
  name: string;
  price: number;
  stock: number;
  image: string;
  discount?: boolean;
  discountValue?: number;
};

const WISHLIST_KEY = 'WISHLIST';
const CART_KEY = 'CART';

const formatCurrency = (value: number) => `${value.toFixed(2)}`;
const getFinalPrice = (item: WishlistItem) => {
  if (!item.discount || !item.discountValue) return item.price;
  return item.price - (item.price * item.discountValue) / 100;
};

export default function WishlistScreen() {
  const router = useRouter();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlistItems = async () => {
    setLoading(true);
    const storedWishlist = await AsyncStorage.getItem(WISHLIST_KEY);
    const parsedWishlist: WishlistItem[] = storedWishlist ? JSON.parse(storedWishlist) : [];
    setItems(parsedWishlist);
    setLoading(false);
  };

  const handleRemoveFromWishlist = async (productId: number) => {
    const updatedItems = items.filter(item => item.productId !== productId);
    setItems(updatedItems);
    await AsyncStorage.setItem(WISHLIST_KEY, JSON.stringify(updatedItems));
  };

  const handleMoveToCart = async (item: WishlistItem) => {
    // Add the item to the cart in AsyncStorage
    const storedCart = await AsyncStorage.getItem(CART_KEY);
    const parsedCart: WishlistItem[] = storedCart ? JSON.parse(storedCart) : [];
    const updatedCart = [...parsedCart, item];
    await AsyncStorage.setItem(CART_KEY, JSON.stringify(updatedCart));

    // Remove the item from the wishlist
    handleRemoveFromWishlist(item.productId);

    // Emit the cart event
    cartEventEmitter.emit('cartUpdated');
  };

  useFocusEffect(
    useCallback(() => {
      fetchWishlistItems();
    }, [])
  );

  if (loading) {
    return (
      <SafeAreaView>
        <ActivityIndicator size="large" color="#0000ff" />
      </SafeAreaView>
    );
  }

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Your wishlist is empty.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView>
      <ScrollView>
        {items.map(item => (
          <View key={item.productId} style={styles.itemContainer}>
            <Image source={{ uri: item.image }} style={styles.image} />
            <View style={styles.detailsContainer}>
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.productPrice}>{formatCurrency(getFinalPrice(item))}</Text>
              <View style={styles.buttonsContainer}>
                <Pressable
                  style={styles.button}
                  onPress={() => handleMoveToCart(item)}
                >
                  <Text style={styles.buttonText}>Move to Cart</Text>
                </Pressable>
                <Pressable
                  style={[styles.button, styles.removeButton]}
                  onPress={() => handleRemoveFromWishlist(item.productId)}
                >
                  <Text style={styles.buttonText}>Remove</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#888',
  },
  itemContainer: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  detailsContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 16,
    fontWeight: '500',
  },
  productPrice: {
    fontSize: 14,
    color: '#333',
  },
  buttonsContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007bff',
    marginRight: 8,
  },
  removeButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '500',
  },
});
