import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

const getDeliveryAddressKey = (userId: string) => `DELIVERY_ADDRESS_${userId}`;

export default function PaymentAddress() {
  const router = useRouter();

  const [country, setCountry] = useState('Portugal');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postcode, setPostcode] = useState('');

  // Load address data on focus
  useFocusEffect(
    useCallback(() => {
      const loadAddress = async () => {
        try {
          const userRaw = await AsyncStorage.getItem('LOGGED_USER');
          if (!userRaw) return;

          const user = JSON.parse(userRaw);
          const key = getDeliveryAddressKey(user.id);

          const temp = await AsyncStorage.getItem('TEMP_DELIVERY_ADDRESS');
          const saved = await AsyncStorage.getItem(key);

          const data = temp
            ? JSON.parse(temp)
            : saved
            ? JSON.parse(saved)
            : null;

          if (data) {
            setCountry(data.country || 'Portugal');
            setAddress(data.address || '');
            setCity(data.city || '');
            setPostcode(data.postcode || '');
          }
        } catch (error) {
          console.log('Error loading address:', error);
        }
      };
      loadAddress();
    }, [])
  );

  // Save address to AsyncStorage
  const handleSave = async () => {
    try {
      const userRaw = await AsyncStorage.getItem('LOGGED_USER');
      if (!userRaw) return;

      const user = JSON.parse(userRaw);
      const key = getDeliveryAddressKey(user.id);

      await AsyncStorage.setItem(
        'TEMP_DELIVERY_ADDRESS',
        JSON.stringify({
          country,
          address,
          city,
          postcode,
        })
      );

      await AsyncStorage.setItem(
        key,
        JSON.stringify({
          country,
          address,
          city,
          postcode,
        })
      );
      Keyboard.dismiss();
      router.push('/checkout');
    } catch (error) {
      console.log('Error saving address:', error);
    }
  };

  return (
    <BlurView intensity={30} style={styles.overlay} tint="light">
      <Pressable style={styles.modal} onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.scrollContent} scrollEnabled={true}>
          <View style={styles.header}>
            <Text style={styles.title}>Morada de Entrega</Text>
            <Pressable style={styles.checkBtn} onPress={handleSave}>
                <Ionicons name="checkmark" size={24} color="#fff" />
            </Pressable>
          </View>

          <Text style={styles.label}>País</Text>
          <Pressable style={styles.countryInput}>
            <Text style={styles.countryText}>{country}</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </Pressable>

          <Text style={styles.label}>Morada</Text>
          <TextInput
            placeholder="Morada"
            style={styles.input}
            value={address}
            onChangeText={setAddress}
          />

          <Text style={styles.label}>Cidade</Text>
          <TextInput
            placeholder="Cidade"
            style={styles.input}
            value={city}
            onChangeText={setCity}
          />

          <Text style={styles.label}>Código Postal</Text>
          <TextInput
            placeholder="Código Postal"
            style={styles.input}
            value={postcode}
            onChangeText={setPostcode}
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
  countryInput: {
    backgroundColor: '#F2F4F8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  countryText: {
    fontSize: 16,
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
