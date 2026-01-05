import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

export default function PaymentCard() {
  const router = useRouter();

  const [number, setNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  // Load card data on focus
  useFocusEffect(
    useCallback(() => {
      const loadCard = async () => {
        try {
          const temp = await AsyncStorage.getItem('TEMP_PAYMENT_CARD');
          const saved = await AsyncStorage.getItem('PAYMENT_CARD');

          if (temp) {
            // Cartão temporário (tem número e CVV)
            const parsed = JSON.parse(temp);
            setNumber(parsed.number ?? '');
            setExpiry(parsed.expiry ?? '');
            setCvv(parsed.cvv ?? '');
          } else if (saved) {
            // Cartão do perfil (dados limitados)
            const parsed = JSON.parse(saved);
            const loadedNumber = parsed.number ?? '';
            const masked = loadedNumber || (parsed.last4 ? `•••• •••• •••• ${parsed.last4}` : '');
            setNumber(masked);
            setExpiry(parsed.expiry ?? '');
            setCvv('');
          }
        } catch (error) {
          console.log('Error loading card', error);
        }
      };
      loadCard();
    }, [])
  );

  // Save card to AsyncStorage
  const handleSave = async () => {
    try {
      await AsyncStorage.setItem(
        'TEMP_PAYMENT_CARD',
        JSON.stringify({
          number,
          expiry,
          cvv,
          last4: number.slice(-4),
        })
      );

      Keyboard.dismiss();
      router.replace('/checkout');
    } catch (error) {
      console.log('Error saving card:', error);
    }
  };

  return (
    <BlurView intensity={30} style={styles.overlay} tint="light">
      <Pressable style={styles.modal} onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.scrollContent} scrollEnabled={true}>
          <View style={styles.header}>
            <Text style={styles.title}>Forma de Pagamento</Text>
            <Pressable style={styles.checkBtn} onPress={handleSave}>
              <Ionicons name="checkmark" size={24} color="#fff" />
            </Pressable>
          </View>

          <Text style={styles.label}>Número do cartão</Text>
          <TextInput
            placeholder="Número do cartão"
            style={styles.input}
            value={number}
            onChangeText={setNumber}
          />
          <Text style={styles.label}>Validade</Text>
          <TextInput
            placeholder="MM/YY"
            style={styles.input}
            value={expiry}
            onChangeText={setExpiry}
          />
          <Text style={styles.label}>CVV</Text>
          <TextInput
            placeholder="CVV"
            style={styles.input}
            value={cvv}
            onChangeText={setCvv}
          />
        </ScrollView>
      </Pressable>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 100,
    padding: 24,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    maxHeight: '80%',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  checkBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0A4CFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#F2F4F8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
  },
});
