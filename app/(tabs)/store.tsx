import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { categoryImages, productImages } from '@/constants/images';
import categories from '@/data/categories.json';
import products from '@/data/products.json';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function StoreScreen() {
  const router = useRouter();
  const sortedCategories = [...categories].sort((a, b) => a.name.localeCompare(b.name));
  const [categoryIndex, setCategoryIndex] = useState(0);
  const CATEGORIES_VISIBLE = 4;
  const promotionProducts = products.filter(
    product => product.promotion && product.discount > 0
  );
  const bestSellers = products.filter(p => p.showInBestSellers);
  const newProducts = products.filter(p => p.showInNew);
  const recommendedProducts = products.filter(p => p.showInRecommended);
  const [promoIndex, setPromoIndex] = useState(0);
  const PROMO_VISIBLE = 5;

  const visiblePromotions =
    promotionProducts.length > PROMO_VISIBLE
      ? [...promotionProducts, ...promotionProducts].slice(
          promoIndex,
          promoIndex + PROMO_VISIBLE
        )
      : promotionProducts;

  const visibleCategories =
    sortedCategories.length > CATEGORIES_VISIBLE
      ? [...sortedCategories, ...sortedCategories].slice(
          categoryIndex,
          categoryIndex + CATEGORIES_VISIBLE
        )
      : sortedCategories;

  useEffect(() => {
    if (promotionProducts.length <= PROMO_VISIBLE) return;

    const interval = setInterval(() => {
      setPromoIndex(prev =>
        (prev + PROMO_VISIBLE) % promotionProducts.length
      );
    }, 10000);

    return () => clearInterval(interval);
  }, [promotionProducts]);

  useEffect(() => {
    if (sortedCategories.length <= CATEGORIES_VISIBLE) return;

    const interval = setInterval(() => {
      setCategoryIndex(prev =>
        (prev + CATEGORIES_VISIBLE) % sortedCategories.length
      );
    }, 10000);

    return () => clearInterval(interval);
  }, [sortedCategories]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <StatusBar style="dark" backgroundColor="#fff" />
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
      >

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Loja</Text>
          <Pressable onPress={() => router.push('/login')} style={styles.profileButton}>
            <Ionicons name="person-circle" size={28} color="#004CFF" />
          </Pressable>
        </View>
        <Pressable
          onPress={() => router.push('/explore')}
          style={styles.searchBar}
        >
          <Text style={styles.searchPlaceholder}>Pesquisar peças</Text>
        </Pressable>
      </View>

      {/* Banner amarelo */}
      <Pressable
        onPress={() => router.push('/promo')}
        style={styles.banner}
      >
        <View>
          <Text style={styles.bannerTitle}>Grandes descontos</Text>
          <Text style={styles.bannerSubtitle}>Até 50%</Text>
        </View>

        <Image
          source={require('@/assets/images/filtros.png')}
          style={styles.bannerImage}
          resizeMode="contain"
        />
      </Pressable>

      {/* Categorias */}
      <Section
        title="Categorias"
        action="Ver todos"
        onPress={() => router.push('/categories')}
      >
        <View style={styles.categories}>
          {visibleCategories.map(cat => (
            <View key={cat.id} style={styles.categoryCard}>
              <View style={styles.categoryImageWrapper}>
                <Image
                  source={categoryImages[cat.imageKey]}
                  style={styles.categoryImage}
                  resizeMode="contain"
                />
              </View>

              <Text style={styles.categoryName}>{cat.name}</Text>
            </View>
          ))}
        </View>
      </Section>

      {/* Mais vendidos */}
      <Section title="Mais vendidos">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {bestSellers.map(product => (
            <View key={product.id} style={styles.bestSellerCard}>

              <Image
                source={productImages[product.image]}
                style={styles.bestSellerImage}
                resizeMode="contain"
              />

              <Text
                numberOfLines={2}
                style={styles.productName}
              >
                {product.name}
              </Text>

              <Text style={styles.price}>
                €{product.price.toFixed(2)}
              </Text>

            </View>
          ))}
        </ScrollView>
      </Section>

      {/* Novos artigos */}
      <Section title="Novos artigos" action="Ver mais">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {newProducts.map(product => (
            <View key={product.id} style={styles.newProductCard}>

              {/* Badge NOVO */}
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>Novo</Text>
              </View>

              <Image
                source={productImages[product.image]}
                style={styles.newProductImage}
                resizeMode="contain"
              />

              <Text
                numberOfLines={2}
                style={styles.productName}
              >
                {product.name}
              </Text>

              <Text style={styles.price}>
                €{product.price.toFixed(2)}
              </Text>

            </View>
          ))}
        </ScrollView>
      </Section>

      {/* Ofertas especiais */}
      <Section title="Ofertas especiais">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {visiblePromotions.map(product => (
            <View key={product.id} style={styles.offerCard}>

              {product.promotion && (
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>
                    -{product.discount}%
                  </Text>
                </View>
              )}

              <Image
                source={productImages[product.image]}
                style={styles.offerImage}
                resizeMode="contain"
              />

              <Text style={styles.offerName} numberOfLines={2}>
                {product.name}
              </Text>
              {product.promotion ? (
                <View>
                  <Text style={styles.oldPrice}>
                    €{product.price.toFixed(2)}
                  </Text>

                  <Text style={styles.newPrice}>
                    €
                    {(
                      product.price -
                      (product.price * product.discount) / 100
                    ).toFixed(2)}
                  </Text>
                </View>
              ) : (
                <Text style={styles.normalPrice}>
                  €{product.price.toFixed(2)}
                </Text>
              )}

            </View>
          ))}
        </ScrollView>
      </Section>

      {/* Recomendados */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { fontSize: 22 }]}>Recomendados</Text>

        <View style={styles.recommendedGrid}>
          {recommendedProducts.map(product => (
            <View key={product.id} style={styles.recommendedCard}>
              <Image
                source={productImages[product.image]}
                style={styles.recommendedImage}
                resizeMode="contain"
              />

              <Text style={styles.productName}>
                {product.name}
              </Text>

              <Text style={styles.productPrice}>
                €{product.price.toFixed(2)}
              </Text>
            </View>
          ))}
        </View>
      </View>

      </ScrollView>
    </SafeAreaView>
  );
}

/* COMPONENTES */

function Section({ title, action, onPress, children }: any) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {action && (
          onPress ? (
            <Pressable onPress={onPress}>
              <Text style={styles.action}>{action}</Text>
            </Pressable>
          ) : (
            <Text style={styles.action}>{action}</Text>
          )
        )}
      </View>
      {children}
    </View>
  );
}

function HorizontalProducts() {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {products.map(p => (
        <View key={p.id} style={styles.horizontalCard}>
          <Image source={{ uri: p.image }} style={styles.horizontalImage} />
        </View>
      ))}
    </ScrollView>
  );
}

/* ESTILOS */

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: { marginBottom: 12 },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 28, fontWeight: 'bold' },
  profileButton: {
    padding: 4,
  },
  searchBar: {
    backgroundColor: '#F2F2F2',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    marginBottom: 12,
  },
  searchPlaceholder: {
    color: '#888',
    fontSize: 16,
  },
  banner: {
    marginTop: 10,
    backgroundColor: '#F6B21A',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  bannerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  bannerSubtitle: {
    color: '#fff',
    marginTop: 4,
  },
  bannerImage: {
    width: 120,
    height: 80,
  },
  section: { marginBottom: 26 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  sectionTitle: { fontSize: 20, fontWeight: 'bold' },
  action: { color: '#1E90FF' },

  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  categoryCard: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 20,
  },
  categoryImageWrapper: {
    width: '100%',
    height: 130,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  categoryImage: {
    width: '90%',
    height: '90%',
  },
  categoryName: {
    marginTop: 6,
    fontWeight: '600',
    textAlign: 'center',
  },
  categoryCount: {
    color: '#777',
    textAlign: 'center',
  },

  horizontalCard: {
    width: 120,
    height: 80,
    marginRight: 12,
    borderRadius: 12,
    backgroundColor: '#f1f1f1'
  },
  horizontalImage: { width: '100%', height: '100%', borderRadius: 12 },

  bestSellerCard: {
    width: 150,
    marginRight: 16,
  },
  bestSellerImage: {
    width: '100%',
    height: 110,
    borderRadius: 14,
    backgroundColor: '#F2F2F2',
    marginBottom: 8,
  },

  newProductCard: {
    width: 150,
    marginRight: 16,
  },
  newProductImage: {
    width: '100%',
    height: 110,
    borderRadius: 14,
    backgroundColor: '#F2F2F2',
    marginBottom: 8,
  },
  newBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#0A58FF',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    zIndex: 1,
  },
  newBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },

  offerCard: {
    width: 160,
    marginRight: 16,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    padding: 12,
    position: 'relative',
  },
  offerImage: {
    width: '100%',
    height: 110,
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 1,
  },
  discountText: {
    fontWeight: '700',
    fontSize: 12,
    color: '#fff',
  },
  offerName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  oldPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  newPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  normalPrice: {
    fontSize: 18,
    fontWeight: '700',
  },
  recommendedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  recommendedCard: {
    width: '48%',
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  recommendedImage: {
    width: '100%',
    height: 120,
    marginBottom: 8,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
});
