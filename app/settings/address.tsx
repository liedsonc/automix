import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ADDRESS_KEY = 'DELIVERY_ADDRESS';

export default function Address() {
  const router = useRouter();
  const [address, setAddress] = useState('');

  useEffect(() => {
    AsyncStorage.getItem(ADDRESS_KEY).then(value => {
      if (value) setAddress(value);
    });
  }, []);

  const save = async () => {
    await AsyncStorage.setItem(ADDRESS_KEY, address);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </Pressable>
          <Text style={styles.title}>Morada de entrega</Text>
        </View>

      <View style={styles.form}>
        <Text style={styles.label}>Morada</Text>
        <TextInput
          style={styles.input}
          placeholder="Rua, nº, cidade"
          value={address}
          onChangeText={setAddress}
        />
      </View>

      <Pressable style={styles.saveBtn} onPress={save}>
        <Text style={styles.saveText}>Guardar</Text>
      </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    marginRight: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
  },

  form: {
    gap: 8,
    marginBottom: 16,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },

  input: {
    height: 46,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 15,
    backgroundColor: '#fafafa',
  },

  saveBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#0A4CFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },

  saveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
