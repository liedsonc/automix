import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { productImages } from '@/constants/images';
import products from '@/data/products.json';

export default function ExploreScreen() {
  const [search, setSearch] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const router = useRouter();

  const normalizeText = (text: string) =>
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  const filteredProducts = products.filter(product => {
    const matchesSearch = normalizeText(product.name).includes(
      normalizeText(search)
    );

    const matchesCategory = selectedCategory
      ? product.category === selectedCategory
      : true;

    return matchesSearch && matchesCategory;
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header + barra de pesquisa */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.backIcon}>←</Text>
          </Pressable>

          <TextInput
            placeholder="Pesquisar peças"
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />

          <Pressable
            style={styles.filterButton}
            onPress={() => setFilterVisible(true)}
          >
            <Text style={{ fontSize: 20 }}>≡</Text>
          </Pressable>
        </View>

        {/* RESULTADOS DA PESQUISA */}
        {search.length > 0 ? (
          <View style={styles.results}>
            {filteredProducts.map(product => (
              <View key={product.id} style={styles.resultCard}>
                <Image
                  source={productImages[product.image]}
                  style={styles.resultImage}
                  resizeMode="contain"
                />
                <Text style={styles.resultName}>{product.name}</Text>
                <Text style={styles.resultPrice}>
                  €{product.price.toFixed(2)}
                </Text>
              </View>
            ))}

            {filteredProducts.length === 0 && (
              <Text style={styles.noResults}>
                Nenhum produto encontrado
              </Text>
            )}
          </View>
        ) : (
          <>
            {/* Histórico de Pesquisa */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Histórico de Pesquisa</Text>
                <Text style={styles.trash}>🗑</Text>
              </View>

              <View style={styles.chips}>
                {['Óleo motor', 'Amortecedor', 'Kit Ferramentas', 'Radiador'].map(item => (
                  <View key={item} style={styles.chip}>
                    <Text>{item}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Descobrir */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Descobrir</Text>

              <View style={styles.discoverGrid}>
                {products.slice(0, 4).map(product => (
                  <View key={product.id} style={styles.discoverCard}>
                    <Image
                      source={productImages[product.image]}
                      style={styles.discoverImage}
                      resizeMode="contain"
                    />
                    <Text style={styles.discoverText}>{product.name}</Text>
                    <Text style={styles.discoverPrice}>
                      €{product.price.toFixed(2)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}

      </ScrollView>

      <Modal
        visible={filterVisible}
        animationType="slide"
        transparent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Categorias</Text>

            {[
              'Todas',
              'Bateria',
              'Travões',
              'Filtros',
              'Iluminação',
              'Ferramentas',
              'Suspensão',
              'Motor',
            ].map(category => (
              <Pressable
                key={category}
                style={styles.modalItem}
                onPress={() => {
                  setSelectedCategory(category === 'Todas' ? null : category);
                  setFilterVisible(false);
                }}
              >
                <Text style={styles.modalItemText}>{category}</Text>
              </Pressable>
            ))}

            <Pressable onPress={() => setFilterVisible(false)}>
              <Text style={styles.modalClose}>Fechar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  backIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#F2F2F2',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  filterButton: {
    marginLeft: 12,
    padding: 10,
    backgroundColor: '#F2F2F2',
    borderRadius: 12,
  },
  filterIcon: {
    fontSize: 18,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  trash: {
    fontSize: 18,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    backgroundColor: '#F2F2F2',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 8,
    marginBottom: 8,
  },
  results: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  resultCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  resultImage: {
    width: '100%',
    height: 120,
  },
  resultName: {
    fontSize: 14,
    marginTop: 8,
  },
  resultPrice: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  noResults: {
    textAlign: 'center',
    marginTop: 20,
    color: '#888',
  },
  discoverGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  discoverCard: {
    width: '48%',
    marginBottom: 16,
  },
  discoverImage: {
    width: '100%',
    height: 140,
    marginBottom: 8,
  },
  discoverText: {
    fontSize: 14,
    color: '#555',
  },
  discoverPrice: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  modalItem: {
    paddingVertical: 12,
  },
  modalItemText: {
    fontSize: 16,
  },
  modalClose: {
    textAlign: 'center',
    marginTop: 16,
    fontSize: 16,
    color: '#007AFF',
  },
});
