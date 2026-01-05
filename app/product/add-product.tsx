import categories from '@/data/categories.json';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
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

type Category = {
  id: number;
  name: string;
  imageKey: string;
};

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image: string;
  supplierId?: string;
  categoryId?: number;
  discount: boolean;
  discountValue: number;
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
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [hasDiscount, setHasDiscount] = useState(false);
  const [discountValue, setDiscountValue] = useState('');
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
    if (!name || !price || !imageUri || !categoryId) {
      Alert.alert('Erro', 'Preencha todos os campos e selecione uma categoria');
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
        categoryId,
        discount: hasDiscount,
        discountValue: hasDiscount ? Number(discountValue) : 0,
        createdAt: new Date().toISOString(),
      };

      products.push(newProduct);

      await AsyncStorage.setItem('PRODUCTS', JSON.stringify(products));

      Alert.alert('Sucesso', 'Produto criado!', [
        {
          text: 'OK',
          onPress: () => router.push('/store'),
        },
      ]);

      setName('');
      setDescription('');
      setPrice('');
      setStock('');
      setImageUri(null);
      setCategoryId(null);
      setHasDiscount(false);
      setDiscountValue('');
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
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>

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

        <Text style={styles.label}>Desconto</Text>
        <Pressable
          style={styles.switchRow}
          onPress={() => setHasDiscount(!hasDiscount)}
        >
          <Text style={styles.switchLabel}>Produto em promoção</Text>
          <View style={[styles.switch, hasDiscount && styles.switchActive]}>
            <View style={[styles.switchThumb, hasDiscount && styles.switchThumbActive]} />
          </View>
        </Pressable>

        {hasDiscount && (
          <TextInput
            placeholder="Percentagem de desconto (ex: 20)"
            placeholderTextColor="#999"
            style={styles.input}
            value={discountValue}
            onChangeText={setDiscountValue}
            keyboardType="number-pad"
          />
        )}

        <Text style={styles.label}>Categoria</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryContent}
        >
          {categories.map((cat: Category) => (
            <Pressable
              key={cat.id}
              style={[
                styles.categoryPill,
                categoryId === cat.id && styles.categoryPillActive,
              ]}
              onPress={() => setCategoryId(cat.id)}
            >
              <Text
                style={[
                  styles.categoryText,
                  categoryId === cat.id && styles.categoryTextActive,
                ]}
              >
                {cat.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

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
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  backIcon: {
    fontSize: 32,
    color: '#000',
  },
  container: {
    padding: 20,
    paddingTop: 10,
    gap: 12,
    paddingBottom: 40,
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
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
    color: '#333',
  },
  categoryScroll: {
    marginBottom: 8,
  },
  categoryContent: {
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  categoryPillActive: {
    backgroundColor: '#0D5CFF',
    borderColor: '#0D5CFF',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  categoryTextActive: {
    color: '#FFF',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F7F7F7',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  switch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D1D1D6',
    padding: 2,
    justifyContent: 'center',
  },
  switchActive: {
    backgroundColor: '#34C759',
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF',
  },
  switchThumbActive: {
    alignSelf: 'flex-end',
  },
});
