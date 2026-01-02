import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Tabs, useFocusEffect, usePathname } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { cartEventEmitter } from '../../utils/cartEvents';

const CART_KEY = 'CART';

export default function TabLayout() {
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(0);

  const loadCartCount = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(CART_KEY);
      if (stored) {
        const items = JSON.parse(stored);
        const total = items.reduce((sum: number, item: any) => sum + item.quantity, 0);
        setCartCount(total);
      } else {
        setCartCount(0);
      }
    } catch {
      setCartCount(0);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCartCount();
    }, [loadCartCount])
  );

  useEffect(() => {
    // Subscrever a eventos do carrinho para atualizar badge em tempo real
    const unsubscribe = cartEventEmitter.subscribe(() => {
      loadCartCount();
    });

    return unsubscribe;
  }, [loadCartCount]);

  useEffect(() => {
    const tabPaths = ['/store', '/explore', '/profile', '/card', '/(tabs)/store', '/(tabs)/explore', '/(tabs)/profile', '/(tabs)/card'];

    if (!pathname || !tabPaths.some(p => pathname.startsWith(p))) return;
    if (pathname.includes('/card')) return; // não gravar quando estamos na card

    (async () => {
      try {
        const last = await AsyncStorage.getItem('LAST_TAB');
        if (last && last !== pathname) {
          await AsyncStorage.setItem('PREV_TAB', last);
        }
        await AsyncStorage.setItem('LAST_TAB', pathname);
      } catch {
        // ignore
      }
    })();
  }, [pathname]);

  return (
    <Tabs
      initialRouteName="store"
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#000000',
        tabBarInactiveTintColor: '#004CFF',
        tabBarStyle: {
          height: 70,
          backgroundColor: '#fff',
        },
      }}
    >
      <Tabs.Screen
        name="store"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'search' : 'search-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="card"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={{ position: 'relative' }}>
              <Ionicons
                name={focused ? 'cart' : 'cart-outline'}
                size={24}
                color={color}
              />
              {cartCount > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    backgroundColor: '#FF4444',
                    borderRadius: 10,
                    width: 20,
                    height: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>
                    {cartCount > 99 ? '99+' : cartCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />

      {/* 👇 ESCONDER PRODUCT (DETALHE) DA TAB BAR */}
      <Tabs.Screen
        name="product"
        options={{
          href: null,
        }}
      />

      {/* 👇 ESCONDER ADD-PRODUCT DA TAB BAR */}
      <Tabs.Screen
        name="add-product"
        options={{
          href: null,
        }}
              />

      {/* 👇 ESCONDER PROMO DA TAB BAR */}
      <Tabs.Screen
        name="promo"
        options={{
          href: null,
        }}
      />
      
    </Tabs>
  );
}
