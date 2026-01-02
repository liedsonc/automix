import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Keyboard, Pressable, StyleSheet, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const USERS_KEY = 'USERS';

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleReset = async () => {
    const stored = await AsyncStorage.getItem(USERS_KEY);
    const users = stored ? JSON.parse(stored) : [];

    const index = users.findIndex((u: any) => (u.email ?? '').toLowerCase() === email.trim().toLowerCase());

    if (index === -1) {
      Alert.alert('Erro', 'Utilizador não encontrado');
      return;
    }

    users[index].password = newPassword;
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));

    Alert.alert('Sucesso', 'Palavra-passe atualizada');
    router.replace('/login');
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.title}>Recuperar palavra-passe</Text>
            <Text style={styles.subtitle}>Introduz o email e a nova palavra-passe.</Text>

            <TextInput
              placeholder="Email"
              placeholderTextColor="#AAA"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <TextInput
              placeholder="Nova palavra-passe"
              placeholderTextColor="#AAA"
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />

            <Pressable style={styles.primaryButton} onPress={handleReset}>
              <Text style={styles.primaryButtonText}>Redefinir</Text>
            </Pressable>

            <Pressable onPress={() => router.replace('/login')}>
              <Text style={styles.cancelText}>Voltar ao login</Text>
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
    fontSize: 28,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#777',
    marginBottom: 32,
  },
  input: {
    height: 56,
    backgroundColor: '#F2F2F2',
    borderRadius: 28,
    paddingHorizontal: 20,
    fontSize: 16,
    marginBottom: 16,
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
  cancelText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#777',
  },
});
