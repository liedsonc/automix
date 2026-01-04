import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Tabs, useFocusEffect, usePathname } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { cartEventEmitter } from '../../utils/cartEvents';
import { seedOrders } from '../../utils/orders';

const CART_KEY = 'CART';

export default function TabLayout() {
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const [role, setRole] = useState<string | null>(null);
  const isCustomer = role === 'cliente';
  const isSupplier = role === 'fornecedor';
  const isAdmin = role === 'admin';
  // Keep notifications tab visible while role loads to avoid flicker/removal for clientes (but hide for outros)
const showNotifications = false;

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

  const loadNotificationCount = useCallback(async () => {
    try {
      const userRaw = await AsyncStorage.getItem('LOGGED_USER');
      if (!userRaw) {
        setNotificationCount(0);
        return;
      }

      const user = JSON.parse(userRaw);
      const userId = String(user.id || user.email);

      const stored = await AsyncStorage.getItem('NOTIFICATIONS');
      if (!stored) {
        setNotificationCount(0);
        return;
      }

      const notifications = JSON.parse(stored);
      const unread = notifications.filter(
        (n: any) => (n.userId === userId || n.userEmail === user.email) && !n.read
      ).length;

      setNotificationCount(unread);
    } catch {
      setNotificationCount(0);
    }
  }, []);

  const normalizeRole = (value: string | null) =>
    value ? String(value).trim().toLowerCase() : null;

  useFocusEffect(
    useCallback(() => {
      loadCartCount();
      loadNotificationCount();
    }, [loadCartCount, loadNotificationCount])
  );

  useEffect(() => {
    // Subscrever a eventos do carrinho para atualizar badge em tempo real
    const unsubscribe = cartEventEmitter.subscribe(() => {
      loadCartCount();
    });

    return unsubscribe;
  }, [loadCartCount]);

  useEffect(() => {
    const loadRole = async () => {
      try {
        // seed demo orders once
        await seedOrders();

        // Prefer active session role (USER_SESSION) to avoid stale roles
        const rawSession = await AsyncStorage.getItem('USER_SESSION');
        if (rawSession) {
          try {
            const parsed = JSON.parse(rawSession);
            const normalizedSession = normalizeRole(parsed?.role || parsed?.user?.role);
            if (normalizedSession) {
              setRole(normalizedSession);
              await AsyncStorage.setItem('USER_ROLE', normalizedSession);
              return;
            }
          } catch {
            // ignore malformed session
          }
        }

        const stored = normalizeRole(await AsyncStorage.getItem('USER_ROLE'));
        if (stored) {
          setRole(stored);
          return;
        }

        const rawUser = await AsyncStorage.getItem('LOGGED_USER');
        if (rawUser) {
          const parsed = JSON.parse(rawUser);
          const normalized = normalizeRole(parsed?.role);
          if (normalized) {
            setRole(normalized);
            await AsyncStorage.setItem('USER_ROLE', normalized);
          }
        }
      } catch {
        setRole(null);
      }
    };

    loadRole();
  }, []);

  useEffect(() => {
    const tabPaths = [
      '/store',
      '/explore',
      '/wishlist',
      '/notifications',
      '/profile',
      '/cart',
      '/supplier-orders',
      '/(tabs)/store',
      '/(tabs)/explore',
      '/(tabs)/wishlist',
      '/(tabs)/notifications',
      '/(tabs)/profile',
      '/(tabs)/cart',
      '/(tabs)/supplier-orders',
    ];

    if (!pathname || !tabPaths.some(p => pathname.startsWith(p))) return;
    if (pathname.includes('/cart')) return; // não gravar quando estamos no cart

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
  name="cart"
  options={{
    href: isCustomer ? '/cart' : null,
    tabBarIcon: ({ color, focused }) => (
      <Ionicons
        name={focused ? 'cart' : 'cart-outline'}
        size={24}
        color={color}
      />
    ),
  }}
/>

      
<Tabs.Screen
  name="supplier"
  options={{
    href: isSupplier ? '/supplier/orders' : null,
    tabBarIcon: ({ color, focused }) => (
      <Ionicons
        name={focused ? 'clipboard' : 'clipboard-outline'}
        size={24}
        color={color}
      />
    ),
  }}
/>
<Tabs.Screen
  name="admin"
  options={{
    href: isAdmin ? '/admin/orders' : null,
    tabBarIcon: ({ color, focused }) => (
      <Ionicons
        name={focused ? 'clipboard' : 'clipboard-outline'}
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
    </Tabs>
  );
}
