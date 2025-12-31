import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

type User = {
  id: string;
  name: string;
  role: 'cliente' | 'fornecedor' | 'admin';
};

type Product = {
  id: number;
  name: string;
  price: number;
  stock: number;
  description?: string;
  image: string;
  supplierId: number;

  discount: boolean;
  discountValue: number;
};

export default function AddProduct() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [discount, setDiscount] = useState(false);
  const [discountValue, setDiscountValue] = useState('');

  const resetForm = () => {
    setName('');
    setPrice('');
    setStock('');
    setDescription('');
    setImage(null);
    setDiscount(false);
    setDiscountValue('');
  };

  useEffect(() => {
    const loadUser = async () => {
      const data = await AsyncStorage.getItem('LOGGED_USER');
      if (!data) {
        router.replace('/login');
        return;
      }

      const parsed = JSON.parse(data) as User;
      if (parsed.role !== 'fornecedor') {
        Alert.alert('Acesso restrito');
        router.replace('/profile');
        return;
      }

      setUser(parsed);
    };

    loadUser();
  }, [router]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const saveProduct = async () => {
    console.log('CLIQUEI EM PUBLICAR PRODUTO');

    if (!name || !price || !stock || !image) {
      Alert.alert('Preenche todos os campos');
      return;
    }

    if (Number.isNaN(Number(price))) {
      Alert.alert('Erro', 'Insere um preço válido');
      return;
    }

    if (Number.isNaN(Number(stock))) {
      Alert.alert('Erro', 'Insere um stock válido');
      return;
    }

    if (
      discount &&
      (!discountValue || Number.isNaN(Number(discountValue)) || Number(discountValue) <= 0)
    ) {
      Alert.alert('Erro', 'Indique o valor do desconto');
      return;
    }

    const data = await AsyncStorage.getItem('PRODUCTS');
    const products: Product[] = data ? JSON.parse(data) : [];

    const nextId =
      products.length > 0
        ? Math.max(...products.map((p: any) => Number(p.id))) + 1
        : 1;

    const newProduct: Product = {
      id: nextId,
      name,
      price: Number(price),
      stock: Number(stock),
      description,
      image,
      supplierId: Number(user!.id),

      discount,
      discountValue: discount ? Number(discountValue) : 0,
    };

    products.push(newProduct);
    await AsyncStorage.setItem('PRODUCTS', JSON.stringify(products));

    const test = await AsyncStorage.getItem('PRODUCTS');
    console.log('PRODUCTS NO STORAGE:', test);

    Alert.alert('Produto criado com sucesso');
    resetForm();
    router.replace('/store');
  };

  if (!user) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Adicionar Produto</Text>

      <Pressable onPress={pickImage} style={styles.imageBox}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} />
        ) : (
          <Text style={styles.imageText}>Escolher imagem</Text>
        )}
      </Pressable>

      <TextInput
        placeholder="Nome do produto"
        style={styles.input}
        value={name}
        onChangeText={setName}
      />

      <TextInput
        placeholder="Preço (€)"
        keyboardType="numeric"
        style={styles.input}
        value={price}
        onChangeText={setPrice}
      />

      <TextInput
        placeholder="Stock"
        keyboardType="numeric"
        style={styles.input}
        value={stock}
        onChangeText={setStock}
      />

      <TextInput
        placeholder="Descrição"
        style={[styles.input, styles.textArea]}
        multiline
        value={description}
        onChangeText={setDescription}
      />

      <View style={styles.row}>
        <Text>Produto em promoção?</Text>
        <Switch value={discount} onValueChange={setDiscount} />
      </View>

      {discount && (
        <TextInput
          placeholder="Desconto (%)"
          keyboardType="numeric"
          value={discountValue}
          onChangeText={setDiscountValue}
          style={styles.input}
        />
      )}

      <Pressable style={styles.button} onPress={saveProduct}>
        <Text style={styles.buttonText}>Publicar Produto</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#FFF',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
  },
  imageBox: {
    height: 160,
    borderRadius: 12,
    backgroundColor: '#F2F2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  imageText: {
    color: '#888',
  },
  input: {
    backgroundColor: '#F5F5F5',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  textArea: {
    height: 80,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#0A58FF',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
});
