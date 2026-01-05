import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
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

export default function EditCard() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [form, setForm] = useState<FormState | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const stored = await AsyncStorage.getItem(CARDS_KEY);
      if (!stored) return;
      const list: Card[] = JSON.parse(stored);
      const card = list.find(c => c.id === id);
      if (!card) return;
      setForm({
        holder: card.holder,
        number: `•••• •••• •••• ${card.last4}`,
        expiry: card.expiry,
        brand: card.brand,
      });
    };

    load();
  }, [id]);

  const update = (key: keyof FormState, value: string | Brand) => {
    if (!form) return;
    setForm(prev => (prev ? { ...prev, [key]: value } : prev));
  };

  const save = async () => {
    if (!form || !id) return;

    const stored = await AsyncStorage.getItem(CARDS_KEY);
    const list: Card[] = stored ? JSON.parse(stored) : [];
    const next = list.map(card =>
      card.id === id
        ? {
            ...card,
            holder: form.holder,
            expiry: form.expiry,
            brand: form.brand,
          }
        : card
    );

    await AsyncStorage.setItem(CARDS_KEY, JSON.stringify(next));
    router.back();
  };

  const remove = async () => {
    if (!id) return;
    const stored = await AsyncStorage.getItem(CARDS_KEY);
    const list: Card[] = stored ? JSON.parse(stored) : [];
    const next = list.filter(card => card.id !== id);
    await AsyncStorage.setItem(CARDS_KEY, JSON.stringify(next));
    router.back();
  };

  const BrandButton = ({ value, label }: { value: Brand; label: string }) => (
    <Pressable
      style={[styles.brandBtn, form?.brand === value && styles.brandBtnActive]}
      onPress={() => update('brand', value)}
    >
      <Text style={[styles.brandText, form?.brand === value && styles.brandTextActive]}>
        {label}
      </Text>
    </Pressable>
  );

  if (!form) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loading}> 
          <Text style={styles.loadingText}>A carregar cartão...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </Pressable>
          <Text style={styles.title}>Editar cartão</Text>
        </View>

        <Input
          label="Nome no cartão"
          placeholder="Ex: João Silva"
          value={form.holder}
          onChangeText={(v: string) => update('holder', v)}
        />

        <Input
          label="Número do cartão"
          editable={false}
          value={form.number}
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

        <Pressable style={styles.deleteBtn} onPress={remove}>
          <Text style={styles.deleteText}>Eliminar cartão</Text>
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
        style={[styles.input, props.editable === false && styles.inputDisabled]}
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
  inputDisabled: { opacity: 0.6 },
  brandRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
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
  brandBtnActive: { borderColor: '#0A4CFF', backgroundColor: '#EAF0FF' },
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
  deleteBtn: {
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF4444',
  },
  deleteText: { color: '#FF4444', fontSize: 15, fontWeight: '600' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#666', fontSize: 15 },
});
