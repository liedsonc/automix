import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ADDRESS_KEY = 'DELIVERY_ADDRESS';

type AddressData = {
  country: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
};

export default function Address() {
  const router = useRouter();

  const [form, setForm] = useState<AddressData>({
    country: '',
    address: '',
    city: '',
    postalCode: '',
    phone: '',
  });

  const loadData = useCallback(async () => {
    const stored = await AsyncStorage.getItem(ADDRESS_KEY);
    if (stored) {
      setForm(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const save = async () => {
    await AsyncStorage.setItem(ADDRESS_KEY, JSON.stringify(form));
    router.back();
  };

  const update = (key: keyof AddressData, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </Pressable>
          <Text style={styles.title}>Configurações</Text>
        </View>

        <Text style={styles.section}>Morada de Entrega</Text>

        {/* Country */}
        <Pressable
          style={styles.select}
          onPress={() => router.push('/settings/country')}
        >
          <View>
            <Text style={styles.label}>Country</Text>
            <Text style={styles.value}>
              {form.country || 'Choose your country'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </Pressable>

        {/* Address */}
        <Input
          label="Morada"
          placeholder="Obrigatório"
          value={form.address}
          onChangeText={v => update('address', v)}
        />

        <Input
          label="Localidade / Cidade"
          placeholder="Obrigatório"
          value={form.city}
          onChangeText={v => update('city', v)}
        />

        <Input
          label="Código Postal"
          placeholder="Obrigatório"
          value={form.postalCode}
          onChangeText={v => update('postalCode', v)}
        />

        <Input
          label="Número de Telemóvel"
          placeholder="Obrigatório"
          keyboardType="phone-pad"
          value={form.phone}
          onChangeText={v => update('phone', v)}
        />

        <Pressable style={styles.saveBtn} onPress={save}>
          <Text style={styles.saveText}>Guardar Alterações</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------- Reusable Input ---------- */
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

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },

  container: {
    padding: 20,
    paddingBottom: 40,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },

  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
  },

  section: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },

  select: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F3F6FC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },

  value: {
    marginTop: 4,
    fontSize: 15,
    color: '#0A4CFF',
    fontWeight: '600',
  },

  field: {
    marginBottom: 14,
  },

  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
    marginBottom: 6,
  },

  input: {
    height: 46,
    backgroundColor: '#F3F6FC',
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#000',
  },

  saveBtn: {
    marginTop: 30,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#0A4CFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  saveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
