import {
    StyleSheet
} from 'react-native';

type Product = {
  id: number;
  name: string;
  price: number;
  stock: number;
  description?: string;
  image: string;
  supplierId: number;
  categoryId?: number;
  discount: boolean;
  discountValue: number;
};

const normalizeProduct = (product: any): Product => {
  const price = Number(product.price ?? 0);
  const rawDiscount = Number(product.discountValue ?? product.discount ?? 0);
  // Considera promoções mesmo que o campo discount não esteja true
  const hasDiscount = rawDiscount > 0 || Boolean(product.discount ?? product.promotion);

  return {
    id: Number(product.id),
    name: String(product.name ?? ''),
    price,
    stock: Number(product.stock ?? 0),
    description: product.description ?? '',
    image: String(product.image ?? ''),
    supplierId: product.supplierId ? Number(product.supplierId) : 0,
    categoryId: product.categoryId ? Number(product.categoryId) : undefined,
    discount: hasDiscount,
    discountValue: hasDiscount ? rawDiscount : 0,
  };
};

const getFinalPrice = (product: Product) => {
  if (!product.discount) return product.price;
  return product.price - (product.price * product.discountValue) / 100;
};

export default function Promo() {
  return null;
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFF',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },

  backIcon: {
    fontSize: 32,
    color: '#000',
  },

  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },

  banner: {
    backgroundColor: '#FFD700',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
  },

  bannerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },

  bannerSubtitle: {
    fontSize: 14,
    color: '#333',
  },

  container: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },

  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },

  productCard: {
    width: '47%',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },

  discountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 10,
  },

  discountText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },

  productImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#EEE',
  },

  productInfo: {
    padding: 12,
  },

  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
    minHeight: 36,
  },

  priceContainer: {
    gap: 4,
  },

  oldPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
  },

  newPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A84FF',
  },
});
