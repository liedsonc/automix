import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, View } from 'react-native';

const ensureAdmin = async (router: ReturnType<typeof useRouter>): Promise<boolean> => {
  try {
    const storedRole = await AsyncStorage.getItem('USER_ROLE');
    let role = storedRole;

    if (!role) {
      const rawUser = await AsyncStorage.getItem('LOGGED_USER');
      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        role = parsed?.role;
        if (role) await AsyncStorage.setItem('USER_ROLE', role);
      }
    }

    if (role !== 'admin') {
      Alert.alert('Acesso negado', 'Esta área é apenas para administradores');
      router.replace('/(tabs)/store');
      return false;
    }

    return true;
  } catch {
    Alert.alert('Acesso negado', 'Esta área é apenas para administradores');
    router.replace('/(tabs)/store');
    return false;
  }
};

export default function AdminStaff() {
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  const protect = useCallback(async () => {
    const ok = await ensureAdmin(router);
    setAllowed(ok);
  }, [router]);

  useEffect(() => {
    protect();
  }, [protect]);

  if (!allowed) return null;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Painel Staff (Admin)</Text>
        <Text style={styles.text}>Gestão de equipa administrativa.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f5f5' },
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 6 },
  text: { color: '#555' },
});
