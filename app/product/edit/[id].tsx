import categories from '@/data/categories.json';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
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

export default function EditProductScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
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
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      const data = await AsyncStorage.getItem('PRODUCTS');
      const products: Product[] = data ? JSON.parse(data) : [];
      const product = products.find((p) => String(p.id) === String(id));

      if (product) {
        setName(product.name);
        setDescription(product.description || '');
        setPrice(String(product.price));
        setStock(String(product.stock));
        setImageUri(product.image);
        setCategoryId(product.categoryId || null);
        setHasDiscount(product.discount || false);
        setDiscountValue(product.discountValue ? String(product.discountValue) : '');
      } else {
        Alert.alert('Erro', 'Produto não encontrado');
        router.back();
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar o produto');
      router.back();
    } finally {
      setLoading(false);
    }
  };

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

  const handleSaveProduct = async () => {
    if (!name || !price || !imageUri || !categoryId) {
      Alert.alert('Erro', 'Preencha todos os campos e selecione uma categoria');
      return;
    }

    try {
      setSaving(true);

      const data = await AsyncStorage.getItem('PRODUCTS');
      const products: Product[] = data ? JSON.parse(data) : [];
      
      const productIndex = products.findIndex((p) => String(p.id) === String(id));
      
      if (productIndex === -1) {
        Alert.alert('Erro', 'Produto não encontrado');
        return;
      }

      // Atualizar o produto
      products[productIndex] = {
        ...products[productIndex],
        name,
        description,
        price: Number(price),
        stock: Number(stock) || 0,
        image: imageUri,
        categoryId,
        discount: hasDiscount,
        discountValue: hasDiscount ? Number(discountValue) : 0,
      };

      await AsyncStorage.setItem('PRODUCTS', JSON.stringify(products));

      Alert.alert('Sucesso', 'Produto atualizado!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar o produto');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#0A4CFF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>

        <Text style={styles.title}>Editar produto</Text>

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
          onPress={handleSaveProduct}
          disabled={saving}
        >
          <Text style={styles.buttonText}>
            {saving ? 'A guardar...' : 'Guardar alterações'}
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
    marginTop: 8,
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
