import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ADDRESS_KEY = 'DELIVERY_ADDRESS';

const COUNTRIES = [
  'Portugal',
  'Spain',
  'France',
  'Germany',
  'Italy',
  'United Kingdom',
  'Netherlands',
  'Belgium',
  'Brazil',
  'United States',
];

export default function Country() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ADDRESS_KEY).then(stored => {
      if (stored) {
        const parsed = JSON.parse(stored);
        setSelected(parsed.country || null);
      }
    });
  }, []);

  const selectCountry = async (country: string) => {
    const stored = await AsyncStorage.getItem(ADDRESS_KEY);
    const data = stored ? JSON.parse(stored) : {};
    data.country = country;

    await AsyncStorage.setItem(ADDRESS_KEY, JSON.stringify(data));
    router.back();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </Pressable>
        <Text style={styles.title}>Configurações</Text>
      </View>

      <Text style={styles.subtitle}>Country</Text>

      <FlatList
        data={COUNTRIES}
        keyExtractor={item => item}
        renderItem={({ item }) => (
          <Pressable
            style={[
              styles.item,
              selected === item && styles.itemSelected,
            ]}
            onPress={() => selectCountry(item)}
          >
            <Text
              style={[
                styles.itemText,
                selected === item && styles.selectedText,
              ]}
            >
              {item}
            </Text>

            {selected === item && (
              <Ionicons name="checkmark" size={20} color="#0A4CFF" />
            )}
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },

  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
  },

  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },

  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },

  itemSelected: {
    backgroundColor: '#F3F6FC',
    borderRadius: 10,
    paddingHorizontal: 12,
  },

  itemText: {
    fontSize: 16,
    color: '#000',
  },

  selectedText: {
    fontWeight: '600',
    color: '#0A4CFF',
  },
});
