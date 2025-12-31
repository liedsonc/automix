import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, Keyboard, Pressable, StyleSheet, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type UserRole = 'cliente' | 'fornecedor' | 'admin';

type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  avatar: string;
  role: UserRole;
};

export default function CreateAccount() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [role, setRole] = useState<'cliente' | 'fornecedor'>('cliente');

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
    }
  };

  const handleCreateAccount = async (): Promise<void> => {
    if (!name || !email || !password || !avatar) {
      Alert.alert('Erro', 'Preencha todos os campos e escolha um avatar');
      return;
    }

    const newUser: User = {
      id: Date.now().toString(),
      name,
      email,
      password,
      avatar,
      role,
    };

    const stored = await AsyncStorage.getItem('USERS');
    const users: User[] = stored ? JSON.parse(stored) : [];

    users.push(newUser);

    await AsyncStorage.setItem('USERS', JSON.stringify(users));
    await AsyncStorage.setItem('LOGGED_USER', JSON.stringify(newUser));

    router.replace('/(tabs)/store');
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView style={styles.container}>
        {/* Shapes decorativos */}
        <View style={styles.shapeLeft} />
        <View style={styles.shapeRight} />

        <View style={styles.content}>
          <Text style={styles.title}>Criar conta</Text>

          {/* Avatar */}
          <Pressable onPress={pickImage} style={styles.avatarWrapper}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatarImage} />
            ) : (
              <Feather name="user" size={60} color="#0A4CFF" />
            )}
          </Pressable>

          {/* Inputs */}
          <TextInput
            placeholder="Nome"
            placeholderTextColor="#BDBDBD"
            style={styles.input}
            value={name}
            onChangeText={setName}
          />

          <TextInput
            placeholder="Email"
            placeholderTextColor="#BDBDBD"
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <View style={styles.passwordWrapper}>
            <TextInput
              placeholder="Senha"
              placeholderTextColor="#BDBDBD"
              style={styles.passwordInput}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <Pressable onPress={() => setShowPassword(!showPassword)}>
              <Feather
                name={showPassword ? 'eye' : 'eye-off'}
                size={20}
                color="#8E8E8E"
              />
            </Pressable>
          </View>

          <Text style={styles.label}>Tipo de conta</Text>
          <View style={styles.roleRow}>
            <Pressable
              style={[styles.roleOption, role === 'cliente' && styles.roleActive]}
              onPress={() => setRole('cliente')}
            >
              <Text style={[styles.roleText, role === 'cliente' && styles.roleTextActive]}>
                Cliente
              </Text>
            </Pressable>

            <Pressable
              style={[styles.roleOption, role === 'fornecedor' && styles.roleActive]}
              onPress={() => setRole('fornecedor')}
            >
              <Text style={[styles.roleText, role === 'fornecedor' && styles.roleTextActive]}>
                Fornecedor
              </Text>
            </Pressable>
          </View>

          {/* Botão */}
          <Pressable style={styles.button} onPress={handleCreateAccount}>
            <Text style={styles.buttonText}>Pronto</Text>
          </Pressable>

          <Pressable
            style={[styles.button, styles.secondaryButton]}
            onPress={async (): Promise<void> => {
              const data = await AsyncStorage.getItem('USERS');
              Alert.alert('USERS', data ?? 'vazio');
            }}
          >
            <Text style={styles.buttonText}>Ver users</Text>
          </Pressable>

          {/* Cancelar */}
          <Pressable onPress={() => router.back()}>
            <Text style={styles.cancel}>Cancelar</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
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
    fontSize: 36,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 24,
    color: '#1C1C1C',
  },

  avatarWrapper: {
    alignItems: 'center',
    marginBottom: 28,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3F3F3',
    justifyContent: 'center',
    alignSelf: 'center',
    overflow: 'hidden',
  },

  avatarImage: {
    width: 100,
    height: 100,
  },

  input: {
    height: 56,
    backgroundColor: '#F3F3F3',
    borderRadius: 28,
    paddingHorizontal: 20,
    fontSize: 16,
    marginBottom: 14,
  },

  passwordWrapper: {
    height: 56,
    backgroundColor: '#F3F3F3',
    borderRadius: 28,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },

  passwordInput: {
    flex: 1,
    fontSize: 16,
  },

  button: {
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0A4CFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },

  secondaryButton: {
    backgroundColor: '#1E6BFF',
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },

  label: {
    marginTop: 20,
    marginBottom: 8,
    fontWeight: '600',
  },

  roleRow: {
    flexDirection: 'row',
    gap: 12,
  },

  roleOption: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F2F2F2',
    alignItems: 'center',
  },

  roleActive: {
    backgroundColor: '#0A4CFF',
  },

  roleText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },

  roleTextActive: {
    color: '#FFF',
  },

  cancel: {
    textAlign: 'center',
    fontSize: 16,
    color: '#8E8E8E',
  },

  /* Shapes */
  shapeLeft: {
    position: 'absolute',
    top: -100,
    left: -120,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#EEF3FF',
  },

  shapeRight: {
    position: 'absolute',
    right: -120,
    top: 120,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#0A4CFF',
  },
});
