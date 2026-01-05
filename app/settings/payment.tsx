import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PaymentScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color="#000" />
        </Pressable>
        <Text style={styles.title}>Métodos de pagamento</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Nome no cartão</Text>
        <TextInput placeholder="Nome completo" style={styles.input} />

        <Text style={styles.label}>Número do cartão</Text>
        <TextInput placeholder="0000 0000 0000 0000" style={styles.input} keyboardType="numeric" />

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Validade</Text>
            <TextInput placeholder="MM/AA" style={styles.input} keyboardType="numeric" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>CVV</Text>
            <TextInput placeholder="000" style={styles.input} keyboardType="numeric" />
          </View>
        </View>

        <Pressable style={styles.saveBtn}>
          <Text style={styles.saveText}>Guardar</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  form: {
    padding: 16,
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  input: {
    height: 46,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 15,
    backgroundColor: '#fafafa',
  },
  saveBtn: {
    marginTop: 8,
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
