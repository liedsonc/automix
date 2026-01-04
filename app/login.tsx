import { ADMIN } from '@/data/admin';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Keyboard, Pressable, StyleSheet, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');

  const handleNext = async () => {
    // ✅ ADMIN primeiro
    if (email === ADMIN.email) {
      router.push({
        pathname: '/login-password',
        params: { email },
      });
      return;
    }

    // 👇 Clientes / Fornecedores
    const data = await AsyncStorage.getItem('USERS');
    const users = data ? JSON.parse(data) : [];

    const user = users.find((u: any) => u.email === email);

    if (!user) {
      Alert.alert('Erro', 'Email não encontrado');
      return;
    }

    router.push({
      pathname: '/login-password',
      params: { email },
    });
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <SafeAreaView style={styles.container}>
          {/* Blobs decorativos */}
          <View style={styles.topBlob} />
          <View style={styles.bottomBlob} />

          {/* Back Arrow */}
          <Pressable onPress={() => router.replace('/')} style={styles.backArrow}>
            <Text style={{ fontSize: 28, color: '#0A4CFF' }}>{'←'}</Text>
          </Pressable>

          {/* Conteúdo */}
          <View style={styles.content}>
            <Text style={styles.title}>Login</Text>
            <Text style={styles.subtitle}>Bom vê-lo de volta!</Text>

            <TextInput
              placeholder="Email"
              placeholderTextColor="#AAA"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Pressable style={styles.primaryButton} onPress={handleNext}>
              <Text style={styles.primaryButtonText}>Continuar</Text>
            </Pressable>

            <Pressable onPress={() => router.push('/create-account')}>
              <Text style={styles.createAccount}>Criar uma conta</Text>
            </Pressable>

            <Pressable onPress={() => router.push('/forgot-password')}>
              <Text style={styles.forgotText}>Esqueci-me da palavra-passe</Text>
            </Pressable>

            <Pressable onPress={() => router.back()}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },

  title: {
    fontSize: 42,
    fontWeight: '700',
    color: '#111',
  },

  subtitle: {
    fontSize: 16,
    color: '#777',
    marginTop: 6,
    marginBottom: 36,
  },

  input: {
    height: 56,
    backgroundColor: '#F2F2F2',
    borderRadius: 28,
    paddingHorizontal: 20,
    fontSize: 16,
    marginBottom: 20,
  },

  primaryButton: {
    height: 56,
    backgroundColor: '#0A4CFF',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },

  primaryButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },

  createAccount: {
    textAlign: 'center',
    fontSize: 16,
    color: '#0A4CFF',
    marginBottom: 12,
    fontWeight: '600',
  },

  forgotText: {
    textAlign: 'center',
    fontSize: 15,
    color: '#0A4CFF',
    marginBottom: 12,
  },

  cancelText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#777',
  },

  backArrow: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 10,
    padding: 8,
  },
  /* BLOBS */
  topBlob: {
    position: 'absolute',
    top: -180,
    left: -160,
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: '#E3EBFF',
  },

  bottomBlob: {
    position: 'absolute',
    bottom: -120,
    right: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#0A4CFF',
  },
});
