import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Settings() {
  const router = useRouter();
  const [showMore, setShowMore] = useState(false);

  const Row = ({ label, onPress, right }: any) => (
    <Pressable style={styles.row} onPress={onPress}>
      <Text style={styles.label}>{label}</Text>
      {right ? <Text style={styles.right}>{right}</Text> : null}
      <Ionicons name="chevron-forward" size={18} color="#999" />
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </Pressable>
          <Text style={styles.title}>Configurações</Text>
        </View>

      <Text style={styles.section}>Pessoal</Text>
      <View style={styles.group}>
        <Row label="Perfil" onPress={() => router.push('/settings/profile')} />
        <Row label="Morada de entrega" onPress={() => router.push('/settings/address')} />
        <Row label="Métodos de Pagamento" onPress={() => router.push('/settings/payment')} />
      </View>

      <Text style={styles.section}>Loja</Text>
      <View style={styles.group}>
        <Row label="País" right="Portugal" />
        <Row label="Moeda" right="€ Euro" />
        <Row label="Idioma" right="PT" />
      </View>

      {!showMore && (
        <Pressable onPress={() => setShowMore(true)} style={styles.moreButton}>
          <Text style={styles.more}>Ver mais</Text>
        </Pressable>
      )}

      {showMore && (
        <>
          <Text style={styles.section}>Conta</Text>
          <View style={styles.group}>
            <Row label="Sobre AutoMix" />
          </View>
          <Pressable style={styles.dangerButton}>
            <Text style={styles.danger}>Eliminar a minha conta</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f5f5' },
  container: { flex: 1, padding: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    marginRight: 12,
  },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 0, color: '#000' },
  section: { fontSize: 18, fontWeight: '700', marginTop: 24, marginBottom: 8, color: '#000' },
  group: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
  },
  label: { flex: 1, fontSize: 16, color: '#000' },
  right: { marginRight: 8, color: '#666', fontSize: 15 },
  moreButton: { marginTop: 20, alignItems: 'center' },
  more: { color: '#0A4CFF', fontSize: 16, fontWeight: '600' },
  dangerButton: { marginTop: 24, marginBottom: 40 },
  danger: { color: '#FF4444', fontSize: 16, fontWeight: '600', textAlign: 'center' },
});
