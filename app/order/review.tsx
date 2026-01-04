import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

export default function OrderReview() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Record<number, { rating: number; comment: string }>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      const stored = await AsyncStorage.getItem('ORDERS');
      const orders = stored ? JSON.parse(stored) : [];
      const found = orders.find((o: any) => String(o.id) === String(id));
      if (!found || found.orderStatus !== 'ENTREGUE' || found.reviewed) {
        router.replace('/profile');
        return;
      }
      setOrder(found);
      setLoading(false);
    };
    load();
  }, [id]);

  const submitReviews = async () => {
    if (!order) return;
    setSubmitting(true);
    const stored = await AsyncStorage.getItem('REVIEWS');
    const all = stored ? JSON.parse(stored) : [];
    const user = JSON.parse((await AsyncStorage.getItem('LOGGED_USER')) || '{}');
    const newReviews = order.items.map((item: any) => ({
      productId: item.productId,
      supplierId: item.supplierId,
      orderId: order.id,
      userId: user.id,
      userName: user.name,
      rating: reviews[item.productId]?.rating ?? 5,
      comment: reviews[item.productId]?.comment ?? '',
      createdAt: new Date().toISOString(),
    }));
    await AsyncStorage.setItem('REVIEWS', JSON.stringify([...all, ...newReviews]));
    // marcar encomenda como avaliada
    const ordersStored = await AsyncStorage.getItem('ORDERS');
    const orders = ordersStored ? JSON.parse(ordersStored) : [];
    const updated = orders.map((o: any) =>
      o.id === order.id ? { ...o, reviewed: true } : o
    );
    await AsyncStorage.setItem('ORDERS', JSON.stringify(updated));
    router.replace('/profile');
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#004CFF" />
        <Text style={{ marginTop: 12 }}>A carregar encomenda...</Text>
      </View>
    );
  }
  if (!order) {
    return (
      <View style={styles.centered}>
        <Text>Encomenda não encontrada.</Text>
        <Pressable onPress={() => router.replace('/profile')} style={{ marginTop: 20 }}>
          <Text style={{ color: '#004CFF' }}>Voltar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <Text style={styles.title}>Avaliar produtos da encomenda</Text>
      {order.items.map((item: any) => (
        <View key={item.productId} style={styles.productCard}>
          <Text style={styles.productName}>{item.name}</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map(star => {
              const active = (reviews[item.productId]?.rating ?? 0) >= star;
              return (
                <Pressable
                  key={star}
                  onPress={() =>
                    setReviews(prev => ({
                      ...prev,
                      [item.productId]: {
                        ...prev[item.productId],
                        rating: star,
                      },
                    }))
                  }
                >
                  <Text
                    style={[
                      styles.star,
                      active ? styles.starActive : styles.starInactive,
                    ]}
                  >
                    ★
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <TextInput
            placeholder="Comentário (opcional)"
            style={styles.input}
            value={reviews[item.productId]?.comment || ''}
            onChangeText={text =>
              setReviews(prev => ({
                ...prev,
                [item.productId]: {
                  ...prev[item.productId],
                  comment: text,
                },
              }))
            }
            multiline
          />
        </View>
      ))}
      <Pressable
        style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
        onPress={submitReviews}
        disabled={submitting}
      >
        <Text style={styles.submitText}>Submeter avaliação</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },

  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 24,
    color: '#111',
    textAlign: 'center',
  },

  productCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,

    // sombra iOS
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },

    // sombra Android
    elevation: 3,

    borderWidth: 1,
    borderColor: '#F2F2F2',
  },

  productName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
  },

  starsRow: {
    flexDirection: 'row',
    marginVertical: 10,
  },

  star: {
    fontSize: 28,
    marginRight: 6,
  },

  starActive: {
    color: '#FFD60A',
  },

  starInactive: {
    color: '#D0D0D0',
  },

  input: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E6E6E6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 48,
    marginTop: 8,
    color: '#333',
    textAlignVertical: 'top',
  },

  submitBtn: {
    backgroundColor: '#0A4CFF',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,

    shadowColor: '#0A4CFF',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },

    elevation: 4,
  },

  submitText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 17,
    letterSpacing: 0.3,
  },
});
