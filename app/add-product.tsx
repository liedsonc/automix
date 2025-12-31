import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type UserRole = 'cliente' | 'fornecedor' | 'admin';

type User = {
  id?: string;
  name: string;
  email: string;
  avatar?: string;
  role?: UserRole;
};

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image: string;
  supplierId?: string;
  createdAt: string;
};

export default function AddProductScreen() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const data = await AsyncStorage.getItem('LOGGED_USER');
      if (data) {
        setUser(JSON.parse(data));
      }
      setLoadingUser(false);
    };

    loadUser();
  }, []);

  useEffect(() => {
    if (!loadingUser && (!user || user.role !== 'fornecedor')) {
      router.replace('/store');
    }
  }, [loadingUser, router, user]);

  const pickProductImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleCreateProduct = async () => {
    if (!name || !price || !imageUri) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    try {
      setSaving(true);

      const data = await AsyncStorage.getItem('PRODUCTS');
      const products: Product[] = data ? JSON.parse(data) : [];

      const newProduct: Product = {
        id: Date.now().toString(),
        name,
        description,
        price: Number(price),
        stock: Number(stock) || 0,
        image: imageUri,
        supplierId: user?.id ?? user?.email,
        createdAt: new Date().toISOString(),
      };

      products.push(newProduct);

      await AsyncStorage.setItem('PRODUCTS', JSON.stringify(products));

      Alert.alert('Sucesso', 'Produto criado!');

      setName('');
      setDescription('');
      setPrice('');
      setStock('');
      setImageUri(null);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível criar o produto');
    } finally {
      setSaving(false);
    }
  };

  if (loadingUser) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#0A4CFF" />
      </SafeAreaView>
    );
  }

  if (!user || user.role !== 'fornecedor') {
    return null;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ headerTitle: 'Adicionar produto' }} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Novo produto</Text>

        <Pressable style={styles.imagePicker} onPress={pickProductImage}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
          ) : (
            <Text style={styles.imagePickerText}>Escolher imagem</Text>
          )}
        </Pressable>

        <TextInput
          placeholder="Nome"
          placeholderTextColor="#999"
          style={styles.input}
          value={name}
          onChangeText={setName}
        />

        <TextInput
          placeholder="Descrição"
          placeholderTextColor="#999"
          style={[styles.input, styles.multiline]}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />

        <TextInput
          placeholder="Preço"
          placeholderTextColor="#999"
          style={styles.input}
          value={price}
          onChangeText={setPrice}
          keyboardType="decimal-pad"
        />

        <TextInput
          placeholder="Stock"
          placeholderTextColor="#999"
          style={styles.input}
          value={stock}
          onChangeText={setStock}
          keyboardType="number-pad"
        />

        <Pressable
          style={[styles.button, saving && styles.buttonDisabled]}
          onPress={handleCreateProduct}
          disabled={saving}
        >
          <Text style={styles.buttonText}>
            {saving ? 'A guardar...' : 'Criar produto'}
          </Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
          <Text style={styles.secondaryButtonText}>Cancelar</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  imagePicker: {
    height: 180,
    borderRadius: 12,
    backgroundColor: '#F2F2F2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  imagePickerText: {
    color: '#666',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#F7F7F7',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  multiline: {
    height: 120,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#0A4CFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  secondaryButtonText: {
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
});
