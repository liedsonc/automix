import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Settings() {
  const router = useRouter();
  const [showMore, setShowMore] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const loadRole = async () => {
      try {
        const stored = await AsyncStorage.getItem('USER_ROLE');
        if (stored) {
          setRole(stored);
          return;
        }

        const rawUser = await AsyncStorage.getItem('LOGGED_USER');
        if (rawUser) {
          const parsed = JSON.parse(rawUser);
          if (parsed?.role) {
            setRole(parsed.role);
            await AsyncStorage.setItem('USER_ROLE', parsed.role);
          }
        }
      } catch {
        setRole(null);
      }
    };

    loadRole();
  }, []);

  const handleDeleteAccount = async () => {
    setShowDeleteModal(false);

    await AsyncStorage.clear();

    Alert.alert('Conta eliminada', 'A tua conta foi removida com sucesso');
    router.replace('/login');
  };

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
            <Ionicons name="arrow-back" size={20} color="#1B2C48" />
          </Pressable>
          <Text style={styles.title}>Configurações</Text>
        </View>

      <Text style={styles.section}>Pessoal</Text>
      <View style={styles.group}>
        <Row label="Perfil" onPress={() => router.push('/settings/profile')} />
        <Row label="Morada de entrega" onPress={() => router.push('/settings/address')} />
        <Row label="Métodos de Pagamento" onPress={() => router.push('/settings/payments')} />
      </View>

      <Text style={styles.section}>Loja</Text>
      <View style={styles.group}>
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
            <Row label="Sobre AutoMix" onPress={() => router.push('/settings/about')} />
          </View>
          {role === 'admin' && (
            <View style={[styles.group, { marginTop: 12 }]}>
              <Row label="Painel de Administração" onPress={() => router.push('/admin' as any)} />
            </View>
          )}
          <Pressable style={styles.dangerButton} onPress={() => setShowDeleteModal(true)}>
            <Text style={styles.danger}>Eliminar a minha conta</Text>
          </Pressable>
        </>
      )}
    </ScrollView>

      <Modal
        transparent
        animationType="fade"
        visible={showDeleteModal}
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalIcon}>
              <Ionicons name="alert-circle" size={28} color="#FF4444" />
            </View>

            <Text style={styles.modalTitle}>Vais eliminar a tua conta</Text>

            <Text style={styles.modalText}>
              Não será possível recuperar os teus dados.
            </Text>

            <View style={styles.modalActions}>
              <Pressable
                style={styles.cancelBtn}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.cancelText}>Cancelar</Text>
              </Pressable>

              <Pressable
                style={styles.deleteBtn}
                onPress={handleDeleteAccount}
              >
                <Text style={styles.deleteText}>Eliminar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, padding: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 0, color: '#1a1a1a' },
  section: { fontSize: 18, fontWeight: '700', marginTop: 24, marginBottom: 8, color: '#000' },
  group: {
    backgroundColor: '#f5f5f5',
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
    backgroundColor: '#f5f5f5',
  },
  label: { flex: 1, fontSize: 16, color: '#000' },
  right: { marginRight: 8, color: '#666', fontSize: 15 },
  moreButton: { marginTop: 20, alignItems: 'center' },
  more: { color: '#0A4CFF', fontSize: 16, fontWeight: '600' },
  dangerButton: { marginTop: 24, marginBottom: 40 },
  danger: { color: '#FF4444', fontSize: 16, fontWeight: '600', textAlign: 'center' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBox: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
  },
  modalIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFECEC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    color: '#000',
  },
  modalText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  cancelText: {
    fontSize: 14,
    color: '#000',
  },
  deleteBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
  },
  deleteText: {
    color: '#fff',
    fontWeight: '700',
  },
});
