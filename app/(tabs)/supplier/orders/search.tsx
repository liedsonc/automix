import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SearchOrder() {
  const router = useRouter();

  const [orderId, setOrderId] = useState('');
  const [tracking, setTracking] = useState('');
  const [status, setStatus] = useState('');

  const statusOptions = [
    { value: 'processing', label: 'Aguarda Pagamento' },
    { value: 'sent', label: 'Enviado' },
    { value: 'delivered', label: 'Entregue' },
    { value: 'returned', label: 'Devolvido' },
  ];

  const search = () => {
    const params: Record<string, string> = {};
    if (orderId.trim()) params.orderId = orderId.trim();
    if (tracking.trim()) params.tracking = tracking.trim();
    if (status) params.status = status;

    router.push({ pathname: '/(tabs)/supplier/orders/result', params });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <BlurView intensity={50} tint="light" style={StyleSheet.absoluteFillObject} />

      <ScrollView
        contentContainerStyle={styles.container}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <Pressable style={styles.closeBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#1B2C48" />
          </Pressable>

          <Text style={styles.heading}>Pesquisar Encomenda</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Número de Pedido</Text>
            <TextInput
              style={styles.input}
              placeholder="#92287155"
              placeholderTextColor="#8AA0C4"
              value={orderId}
              onChangeText={setOrderId}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Número de Expedição</Text>
            <TextInput
              style={styles.input}
              placeholder="XXX-i000000000"
              placeholderTextColor="#8AA0C4"
              value={tracking}
              onChangeText={setTracking}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.formGroup, styles.half]}>
              <Text style={styles.label}>Data</Text>
              <TextInput
                style={styles.input}
                placeholder="DD/MM/AAAA"
                placeholderTextColor="#8AA0C4"
                value=""
                editable={false}
              />
            </View>
            <View style={[styles.formGroup, styles.half]}>
              <Text style={styles.label}>Estado</Text>
              <View style={styles.statusRow}>
                {statusOptions.map(option => (
                  <Pressable
                    key={option.value}
                    style={[styles.statusChip, status === option.value && styles.statusChipActive]}
                    onPress={() => setStatus(status === option.value ? '' : option.value)}
                  >
                    <Text
                      style={[styles.statusChipText, status === option.value && styles.statusChipTextActive]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          <Pressable style={styles.button} onPress={search}>
            <Text style={styles.buttonText}>Pesquisar</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  container: {
    padding: 0,
  },

  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
    gap: 12,
  },
  handle: {
    alignSelf: 'center',
    width: 64,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#D7DEFB',
    marginBottom: 12,
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1B2C48',
  },

  formGroup: {
    width: '100%',
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    color: '#1B2C48',
  },
  input: {
    backgroundColor: '#EFF3FF',
    borderRadius: 14,
    height: 52,
    paddingHorizontal: 16,
    fontSize: 17,
    color: '#1B2C48',
    borderWidth: 1,
    borderColor: '#D7DEFB',
  },

  row: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  half: { flex: 1 },

  button: {
    marginTop: 8,
    backgroundColor: '#0A4CFF',
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },

  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statusChip: {
    backgroundColor: '#EFF3FF',
    borderColor: '#D7DEFB',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  statusChipActive: {
    backgroundColor: '#0A4CFF',
    borderColor: '#0A4CFF',
  },
  statusChipText: {
    color: '#1B2C48',
    fontSize: 14,
    fontWeight: '700',
  },
  statusChipTextActive: {
    color: '#fff',
  },
});
