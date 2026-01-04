export type OrderStatus =
  | 'AGUARDA_PAGAMENTO'
  | 'EM_PROCESSAMENTO'
  | 'ENVIADO'
  | 'ENTREGUE'
  | 'DEVOLVIDO';

export type Order = {
  id: string;
  userId: string;
  items: {
    productId: number;
    name: string;
    category?: string;
    quantity: number;
    price: number;
    image?: string;
    supplierId?: number | string;
  }[];
  total: number;
  paymentMethod: { type: 'card'; last4: string };
  paymentStatus: 'PENDENTE' | 'PAGO';
  orderStatus: OrderStatus;
  createdAt: string;
};

export const orders: Order[] = [
  {
    id: 'ORD-001',
    userId: 'user-1',
    items: [{ productId: 1, name: 'Pneu Michelin', category: 'Pneus', quantity: 2, price: 120, supplierId: 101 }],
    total: 240,
    paymentMethod: { type: 'card', last4: '4242' },
    paymentStatus: 'PAGO',
    orderStatus: 'ENVIADO',
    createdAt: '2025-01-02T10:00:00Z',
  },
  {
    id: 'ORD-002',
    userId: 'user-1',
    items: [{ productId: 3, name: 'Bateria Varta', category: 'Bateria', quantity: 1, price: 118.99, supplierId: 102 }],
    total: 118.99,
    paymentMethod: { type: 'card', last4: '1881' },
    paymentStatus: 'PENDENTE',
    orderStatus: 'EM_PROCESSAMENTO',
    createdAt: '2025-01-01T09:00:00Z',
  },
  {
    id: 'ORD-003',
    userId: 'user-2',
    items: [{ productId: 8, name: 'Óleo Motor', category: 'Óleos e Lubrificantes', quantity: 1, price: 35.5, supplierId: 103 }],
    total: 35.5,
    paymentMethod: { type: 'card', last4: '0555' },
    paymentStatus: 'PAGO',
    orderStatus: 'ENTREGUE',
    createdAt: '2024-12-30T12:00:00Z',
  },
  {
    id: 'ORD-004',
    userId: 'user-3',
    items: [{ productId: 4, name: 'Pastilhas de Travão', category: 'Travões', quantity: 4, price: 45, supplierId: 101 }],
    total: 180,
    paymentMethod: { type: 'card', last4: '3333' },
    paymentStatus: 'PAGO',
    orderStatus: 'ENTREGUE',
    createdAt: '2025-01-03T08:00:00Z',
  },
  {
    id: 'ORD-005',
    userId: 'user-4',
    items: [{ productId: 5, name: 'Filtro de Óleo', category: 'Filtros', quantity: 3, price: 15.5, supplierId: 102 }],
    total: 46.5,
    paymentMethod: { type: 'card', last4: '4444' },
    paymentStatus: 'PAGO',
    orderStatus: 'ENTREGUE',
    createdAt: '2025-01-02T14:00:00Z',
  },
  {
    id: 'ORD-006',
    userId: 'user-5',
    items: [{ productId: 6, name: 'Kit Embraiagem', category: 'Embraiagem', quantity: 1, price: 285, supplierId: 103 }],
    total: 285,
    paymentMethod: { type: 'card', last4: '5555' },
    paymentStatus: 'PAGO',
    orderStatus: 'ENTREGUE',
    createdAt: '2025-01-01T16:00:00Z',
  },
  {
    id: 'ORD-007',
    userId: 'user-6',
    items: [{ productId: 7, name: 'Amortecedores', category: 'Suspensão', quantity: 2, price: 95, supplierId: 101 }],
    total: 190,
    paymentMethod: { type: 'card', last4: '6666' },
    paymentStatus: 'PAGO',
    orderStatus: 'ENTREGUE',
    createdAt: '2024-12-31T11:00:00Z',
  },
  {
    id: 'ORD-008',
    userId: 'user-7',
    items: [{ productId: 9, name: 'Lâmpadas LED', category: 'Iluminação', quantity: 6, price: 12, supplierId: 102 }],
    total: 72,
    paymentMethod: { type: 'card', last4: '7777' },
    paymentStatus: 'PAGO',
    orderStatus: 'ENTREGUE',
    createdAt: '2025-01-02T13:00:00Z',
  },
];
