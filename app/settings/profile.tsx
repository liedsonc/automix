import { User } from '@/types/User';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsProfile() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  const handleEditAvatar = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert('Permissão necessária', 'É necessário permitir acesso à galeria');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0] && user) {
      setUser({ ...user, avatar: result.assets[0].uri });
    }
  };

  useEffect(() => {
    const loadUser = async () => {
      const storedUser = await AsyncStorage.getItem('LOGGED_USER');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    };

    loadUser();
  }, []);

  const handleSave = async () => {
    if (!user) return;

    await AsyncStorage.setItem('LOGGED_USER', JSON.stringify(user));
    router.back();
  };

  if (!user) return null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.title}>Configurações</Text>
            <Text style={styles.subtitle}>Editar perfil</Text>
          </View>
        </View>

        {/* Avatar */}
        <View style={styles.avatarWrap}>
          <Image
            source={{ uri: user.avatar ?? 'https://i.pravatar.cc/150' }}
            style={styles.avatar}
          />
          <Pressable style={styles.editAvatar} onPress={handleEditAvatar}>
            <Ionicons name="pencil" size={16} color="#fff" />
          </Pressable>
        </View>

        {/* Nome */}
        <Text style={styles.label}>Nome</Text>
        <TextInput
          style={styles.input}
          placeholder="Nome"
          value={user.name}
          onChangeText={text => setUser({ ...user, name: text })}
        />

        {/* Email */}
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={user.email}
          keyboardType="email-address"
          autoCapitalize="none"
          onChangeText={text => setUser({ ...user, email: text })}
        />

        {/* Telefone */}
        <Text style={styles.label}>Telefone</Text>
        <TextInput
          style={styles.input}
          placeholder="Número de telefone"
          value={user.phone ?? ''}
          keyboardType="phone-pad"
          onChangeText={text => setUser({ ...user, phone: text })}
        />

        {/* Código Postal */}
        <Text style={styles.label}>Código Postal</Text>
        <TextInput
          style={styles.input}
          placeholder="Código Postal"
          value={user.country ?? ''}
          keyboardType="default"
          onChangeText={text => setUser({ ...user, country: text })}
        />

        {/* Password */}
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Password"
          value="***********"
          secureTextEntry
          editable={false}
        />

        {/* Guardar */}
        <Pressable style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveText}>Guardar Alterações</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1 },
  content: { padding: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  backButton: { marginRight: 12, marginTop: 4 },
  headerText: { flex: 1 },
  title: { fontSize: 28, fontWeight: '800', color: '#000', marginBottom: 4 },
  subtitle: { fontSize: 16, marginBottom: 10, color: '#666' },
  avatarWrap: { alignItems: 'center', marginBottom: 30, position: 'relative' },
  avatar: { width: 110, height: 110, borderRadius: 55 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 4,
  },
  editAvatar: {
    position: 'absolute',
    right: '50%',
    marginRight: -65,
    bottom: 0,
    backgroundColor: '#0A4CFF',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  input: {
    backgroundColor: '#F3F6FC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    fontSize: 16,
    color: '#000',
  },
  saveBtn: {
    backgroundColor: '#0A4CFF',
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
