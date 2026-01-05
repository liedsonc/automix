import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Card } from './payments';

const CARDS_KEY = 'PAYMENT_CARDS';

type Brand = 'visa' | 'mastercard';

type FormState = {
  holder: string;
  number: string;
  expiry: string;
  brand: Brand;
};

export default function AddCard() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    holder: '',
    number: '',
    expiry: '',
    brand: 'visa',
  });

  const update = (key: keyof FormState, value: string | Brand) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const save = async () => {
    const digits = form.number.replace(/\D/g, '');

    if (digits.length < 12) {
      Alert.alert('Número inválido', 'Introduz pelo menos 12 dígitos.');
      return;
    }

    if (!form.expiry.trim()) {
      Alert.alert('Validade em falta', 'Preenche a validade (MM/AA).');
      return;
    }

    const last4 = digits.slice(-4);
    const stored = await AsyncStorage.getItem(CARDS_KEY);
    const list: Card[] = stored ? JSON.parse(stored) : [];

    const newCard: Card = {
      id: String(Date.now()),
      holder: form.holder || 'Cardholder',
      number: digits,
      last4,
      expiry: form.expiry,
      brand: form.brand,
    };

    const updated = [...list, newCard];

    await AsyncStorage.setItem(CARDS_KEY, JSON.stringify(updated));
    await AsyncStorage.setItem('PAYMENT_CARD', JSON.stringify(newCard));

    router.back();
  };

  const BrandButton = ({ value, label }: { value: Brand; label: string }) => (
    <Pressable
      style={[styles.brandBtn, form.brand === value && styles.brandBtnActive]}
      onPress={() => update('brand', value)}
    >
      <Text style={[styles.brandText, form.brand === value && styles.brandTextActive]}>
        {label}
      </Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </Pressable>
          <Text style={styles.title}>Adicionar cartão</Text>
        </View>

        <Input
          label="Nome no cartão"
          placeholder="Ex: João Silva"
          value={form.holder}
          onChangeText={(v: string) => update('holder', v)}
        />

        <Input
          label="Número do cartão"
          placeholder="•••• •••• •••• ••••"
          keyboardType="number-pad"
          value={form.number}
          onChangeText={(v: string) => update('number', v)}
        />

        <Input
          label="Validade (MM/AA)"
          placeholder="08/27"
          value={form.expiry}
          onChangeText={(v: string) => update('expiry', v)}
        />

        <Text style={styles.label}>Marca</Text>
        <View style={styles.brandRow}>
          <BrandButton value="visa" label="Visa" />
          <BrandButton value="mastercard" label="Mastercard" />
        </View>

        <Pressable style={styles.saveBtn} onPress={save}>
          <Text style={styles.saveText}>Guardar</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Input(props: any) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{props.label}</Text>
      <TextInput
        style={styles.input}
        placeholder={props.placeholder}
        placeholderTextColor="#9AA4B2"
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backBtn: { marginRight: 12 },
  title: { fontSize: 22, fontWeight: '700', color: '#000' },
  field: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: '#000', marginBottom: 6 },
  input: {
    height: 46,
    backgroundColor: '#F3F6FC',
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#000',
  },
  brandRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  brandBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d9e0ef',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  brandBtnActive: {
    borderColor: '#0A4CFF',
    backgroundColor: '#EAF0FF',
  },
  brandText: { color: '#000', fontWeight: '600' },
  brandTextActive: { color: '#0A4CFF' },
  saveBtn: {
    marginTop: 12,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#0A4CFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
