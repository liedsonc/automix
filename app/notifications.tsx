import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { STORAGE_KEYS } from '../utils/storageKeys';

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        const userRaw = await AsyncStorage.getItem('LOGGED_USER');
        const raw = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
        const all = raw ? JSON.parse(raw) : [];

        if (!userRaw) {
          setNotifications(all.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
          return;
        }

        const user = JSON.parse(userRaw);
        const userId = String(user.id || user.email);
        
        // Support both userId and userEmail (legacy)
        setNotifications(
          all
            .filter((n: any) => n.userId === userId || n.userEmail === user.email || (user.role === 'admin' && n.userEmail === 'ADMIN'))
            .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        );
      };

      const markAsRead = async () => {
        const userRaw = await AsyncStorage.getItem('LOGGED_USER');
        const raw = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
        if (!raw) return;

        const all = JSON.parse(raw);
        const parsedUser = userRaw ? JSON.parse(userRaw) : null;
        const userId = parsedUser ? String(parsedUser.id || parsedUser.email) : null;

        const updated = all.map((n: any) => {
          if (!userId) return { ...n, read: true };
          if (n.userId === userId || n.userEmail === parsedUser?.email) return { ...n, read: true };
          if (parsedUser?.role === 'admin' && n.userEmail === 'ADMIN') return { ...n, read: true };
          return n;
        });

        await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
      };

      load();
      markAsRead();
    }, [])
  );

  const handlePress = (item: any) => {
    if (item.type === 'order' && item.orderId) {
      router.push(`/order/${item.orderId}`);
      return;
    }

    if (item.userEmail === 'ADMIN') {
      router.push('/(tabs)/admin/members');
      return;
    }

    Alert.alert('Notificação', item.message);
  };

  const renderItem = ({ item }: any) => (
    <Pressable
      style={[styles.card, !item.read && styles.unread]}
      onPress={() => handlePress(item)}
    >
      <Text style={styles.message}>{item.message}</Text>
      <Text style={styles.date}>
        {new Date(item.createdAt).toLocaleString()}
      </Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} />
        </Pressable>
        <Text style={styles.title}>Notificações</Text>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 20 }}
        ListEmptyComponent={
          <Text style={styles.empty}>Sem notificações.</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  title: { fontSize: 20, fontWeight: '800' },
  card: {
    backgroundColor: '#F3F6FC',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  unread: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  message: {
    fontSize: 15,
    fontWeight: '600',
  },
  date: {
    fontSize: 12,
    color: '#666',
    marginTop: 6,
  },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    color: '#999',
  },
});
