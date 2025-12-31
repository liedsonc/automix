import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native';

type User = {
  id?: string;
  name: string;
  email: string;
  password: string;
  avatar?: string;
  role?: 'cliente' | 'fornecedor' | 'admin';
};

export default function LoginPassword() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [password, setPassword] = useState('');
  const [hasError, setHasError] = useState(false);
  const [userName, setUserName] = useState('');
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const loadUserName = async () => {
      const data = await AsyncStorage.getItem('USERS');
      const users = JSON.parse(data || '[]');
      const user = users.find((u: User) => u.email === email);
      if (user) {
        setUserName(user.name);
      }
    };

    loadUserName();
  }, [email]);

  const handleLogin = async () => {
    const data = await AsyncStorage.getItem('USERS');
    const users = JSON.parse(data || '[]');
    const user = users.find((u: User) => u.email === email);

    if (!user) {
      setHasError(true);
      setPassword('');
      inputRef.current?.focus();
      return;
    }

    if (password !== user.password) {
      setHasError(true);
      setPassword('');
      inputRef.current?.focus();
      return;
    }

    // Login OK
    const normalizedUser: Required<User> = {
      id: user.id ?? Date.now().toString(),
      name: user.name,
      email: user.email,
      password: user.password,
      avatar: user.avatar ?? '',
      role: user.role ?? 'cliente',
    };

    await AsyncStorage.setItem('LOGGED_USER', JSON.stringify(normalizedUser));
    router.replace('/(tabs)/store');
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.container}>
          {/* BOLHAS */}
          <View style={styles.blobLight} />
          <View style={styles.blobDark} />

          {/* CONTEÚDO */}
          <View style={styles.content}>
            <Ionicons name="person-circle" size={96} color="#0A4CFF" style={styles.avatar} />

            <Text style={styles.title}>Bem-vindo, {userName}!!</Text>
            <Text style={styles.subtitle}>Digite a sua senha</Text>

            {/* INPUT INVISÍVEL */}
            <TextInput
              ref={inputRef}
              autoFocus
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setHasError(false);
              }}
              secureTextEntry
              blurOnSubmit={false}
              style={styles.hiddenInput}
            />

            {/* PONTOS */}
            <Pressable
              style={styles.dotsRow}
              onPress={() => inputRef.current?.focus()}
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    i < password.length && styles.dotActive,
                    hasError && styles.dotError,
                  ]}
                />
              ))}
            </Pressable>

            <Pressable style={styles.button} onPress={handleLogin}>
              <Text style={styles.buttonText}>Entrar</Text>
            </Pressable>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  /* BOLHAS */
  blobLight: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#E8F0FF',
    top: -120,
    left: -100,
  },

  blobDark: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#0A4CFF',
    bottom: -140,
    right: -120,
  },

  /* CONTEÚDO */
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatar: {
    marginBottom: 16,
  },

  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
  },

  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 32,
  },

  /* INPUT INVISÍVEL */
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: '100%',
    height: '100%',
  },

  /* PONTOS */
  dotsRow: {
    flexDirection: 'row', // keep dots horizontal
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },

  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 8,
  },

  dotActive: {
    backgroundColor: '#0A4CFF',
  },

  dotError: {
    backgroundColor: '#E74C3C',
  },

  button: {
    backgroundColor: '#0A4CFF',
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 24,
    width: '80%',
  },

  buttonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '600',
  },
});
