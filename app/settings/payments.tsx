import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CARDS_KEY = 'PAYMENT_CARDS';

export type Card = {
  id: string;
  holder: string;
  number: string;
  last4: string;
  expiry: string;
  brand: 'visa' | 'mastercard';
};

export default function Payments() {
  const router = useRouter();
  const [cards, setCards] = useState<Card[]>([]);

  const loadCards = useCallback(async () => {
    const stored = await AsyncStorage.getItem(CARDS_KEY);
    if (stored) {
      setCards(JSON.parse(stored));
    } else {
      setCards([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCards();
    }, [loadCards])
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </Pressable>
          <Text style={styles.title}>Configurações</Text>
        </View>

        <Text style={styles.subtitle}>Método de Pagamento</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardsRow}
        >
          {cards.map(card => (
            <Pressable
              key={card.id}
              style={styles.card}
              onPress={() =>
                router.push({ pathname: '/settings/edit-card', params: { id: card.id } })
              }
            >
              <View style={styles.cardTop}>
                <Text style={styles.brand}>
                  {card.brand === 'visa' ? 'VISA' : 'Mastercard'}
                </Text>
              </View>

              <Text style={styles.numbers}>•••• •••• •••• {card.last4}</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.holder}>{card.holder}</Text>
                <Text style={styles.expiry}>{card.expiry}</Text>
              </View>
            </Pressable>
          ))}

          <Pressable style={styles.addCard} onPress={() => router.push('/settings/add-card')}>
            <Ionicons name="add" size={28} color="#fff" />
          </Pressable>
        </ScrollView>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  backBtn: { marginRight: 12 },
  title: { fontSize: 24, fontWeight: '700', color: '#000' },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 20 },
  cardsRow: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
    marginBottom: 24,
  },
  card: {
    width: 220,
    backgroundColor: '#0A4CFF',
    borderRadius: 18,
    padding: 16,
  },
  cardTop: { marginBottom: 24 },
  brand: { color: '#fff', fontWeight: '700' },
  numbers: { color: '#fff', fontSize: 16, letterSpacing: 2, marginBottom: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  holder: { color: '#fff', fontSize: 12 },
  expiry: { color: '#fff', fontSize: 12 },
  addCard: {
    width: 44,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#0A4CFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  historyIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EAF0FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  historyDate: { flex: 1, fontSize: 14 },
  historyValue: { fontWeight: '600' },
});
