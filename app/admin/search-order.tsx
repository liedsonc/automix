import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    FlatList,
    Modal,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useAdminGuard } from '../../hooks/useAdminGuard';
import { STORAGE_KEYS } from '../../utils/storageKeys';

type OrderItem = {
  productId: number;
  name: string;
  quantity: number;
  price: number;
  image?: string;
};

type Order = {
  id: string;
  userId?: string;
  items: OrderItem[];
  total: number;
  paymentStatus: 'PENDENTE' | 'PAGO';
  orderStatus:
    | 'AGUARDA_PAGAMENTO'
    | 'EM_PROCESSAMENTO'
    | 'ENVIADO'
    | 'ENTREGUE'
    | 'DEVOLVIDO';
  createdAt: string;
};

type UserLite = { id?: string; name?: string };

const statusLabel: Record<Order['orderStatus'], string> = {
  AGUARDA_PAGAMENTO: 'Pendente',
  EM_PROCESSAMENTO: 'Processamento',
  ENVIADO: 'Enviado',
  ENTREGUE: 'Entregue',
  DEVOLVIDO: 'Devolução',
};

const statusColor: Record<Order['orderStatus'], string> = {
  AGUARDA_PAGAMENTO: '#f59e0b',
  EM_PROCESSAMENTO: '#0ea5e9',
  ENVIADO: '#2563eb',
  ENTREGUE: '#16a34a',
  DEVOLVIDO: '#f97316',
};

export default function SearchOrder() {
  useAdminGuard();
  const router = useRouter();
  const [searchText, setSearchText] = useState('');
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, UserLite>>({});
  const [searched, setSearched] = useState(false);
  const [filterClient, setFilterClient] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<Order['orderStatus'] | ''>('');
  const [allUsers, setAllUsers] = useState<UserLite[]>([]);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const handleSearch = useCallback(async () => {
    try {
      const storedOrders = await AsyncStorage.getItem(STORAGE_KEYS.ORDERS);
      const parsedOrders: Order[] = storedOrders ? JSON.parse(storedOrders) : [];

      const storedUsers = await AsyncStorage.getItem('USERS');
      let usersMap: Record<string, UserLite> = {};
      let usersList: UserLite[] = [];
      if (storedUsers) {
        usersList = JSON.parse(storedUsers);
        usersList.forEach(u => {
          if (u.id) usersMap[String(u.id)] = u;
        });
      }
      setUsersMap(usersMap);
      setAllUsers(usersList);

      let results = parsedOrders;

      // Filter by search text
      if (searchText.trim()) {
        const query = searchText.toLowerCase();
        results = results.filter(o => {
          const orderId = o.id.toLowerCase();
          const customer = (o.userId ? usersMap[o.userId]?.name ?? '' : '').toLowerCase();
          return orderId.includes(query) || customer.includes(query);
        });
      }

      // Filter by client
      if (filterClient) {
        results = results.filter(o => o.userId === filterClient);
      }

      // Filter by status
      if (filterStatus) {
        results = results.filter(o => o.orderStatus === filterStatus);
      }

      setAllOrders(results);
      setSearched(true);
    } catch {
      setAllOrders([]);
      setSearched(true);
    }
  }, [searchText, filterClient, filterStatus]);

  const renderItem = ({ item }: { item: Order }) => {
    const status = statusLabel[item.orderStatus] ?? item.orderStatus;
    const color = statusColor[item.orderStatus] ?? '#1f2937';
    const customer = item.userId ? usersMap[item.userId]?.name ?? 'Cliente' : 'Cliente';
    const itemsCount = item.items?.reduce((sum, i) => sum + (i.quantity || 0), 0) || 0;

    return (
      <Pressable 
        style={styles.card}
        onPress={() => router.push({ pathname: '/admin/order/[id]', params: { id: item.id } })}
      >
        <View style={styles.row}>
          <View>
            <Text style={styles.orderTitle}>Pedido #{item.id}</Text>
            <View style={styles.clientPill}>
              <Ionicons name="person-outline" size={14} color="#1f2937" />
              <Text style={styles.clientText}>{customer}</Text>
            </View>
          </View>

          <View style={styles.itemsBadge}>
            <Text style={styles.itemsText}>{itemsCount} items</Text>
          </View>
        </View>

        <View style={styles.statusRow}>
          <Text style={[styles.statusText, { color }]}>{status}</Text>
          <Ionicons name="chevron-forward" size={20} color="#0A4CFF" />
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.roundBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#1B2C48" />
        </Pressable>
        <Text style={styles.pageTitle}>Pesquisar</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} scrollEnabled={true}>
        {/* Search Input */}
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="#0A4CFF" />
          <TextInput
            placeholder="número de pedido, peça, cliente..."
            placeholderTextColor="#999"
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        {/* Advanced Filters Title */}
        <Text style={styles.filterTitle}>Filtros Avançados</Text>

        {/* Filters Row */}
        <View style={styles.filtersRow}>
          {/* Client Filter */}
          <Pressable
            style={styles.filterDropdown}
            onPress={() => setShowClientModal(true)}
          >
            <Text style={styles.filterDropdownLabel}>
              {filterClient
                ? allUsers.find(u => u.id === filterClient)?.name || 'Seleccionar'
                : 'Seleccionar'}
            </Text>
            <Ionicons name="chevron-down" size={18} color="#0A4CFF" />
          </Pressable>

          {/* Status Filter */}
          <Pressable
            style={styles.filterDropdown}
            onPress={() => setShowStatusModal(true)}
          >
            <Text style={styles.filterDropdownLabel}>
              {filterStatus
                ? statusLabel[filterStatus as Order['orderStatus']]
                : 'Seleccionar'}
            </Text>
            <Ionicons name="chevron-down" size={18} color="#0A4CFF" />
          </Pressable>
        </View>

        {/* Labels for filters */}
        <View style={styles.filtersLabelsRow}>
          <Text style={styles.filterLabel}>Cliente</Text>
          <Text style={styles.filterLabel}>Estado</Text>
        </View>

        {/* Search Button */}
        <Pressable style={styles.searchBtn} onPress={handleSearch}>
          <Text style={styles.searchBtnText}>Pesquisar</Text>
        </Pressable>

        {/* Results */}
        {searched && (
          <View style={styles.resultsContainer}>
            {allOrders.length > 0 ? (
              <FlatList
                data={allOrders}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                scrollEnabled={false}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={48} color="#ccc" />
                <Text style={styles.empty}>Nenhuma encomenda encontrada</Text>
                <Text style={styles.emptyHint}>Tente outro número ou nome</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Client Modal */}
      <Modal
        visible={showClientModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowClientModal(false)}
      >
        <BlurView style={styles.blurContainer} intensity={70}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Pressable
                style={styles.modalCloseBtn}
                onPress={() => setShowClientModal(false)}
              >
                <Ionicons name="close" size={24} color="#111" />
              </Pressable>

              <Text style={styles.modalTitle}>Seleccionar Cliente</Text>

              <ScrollView style={styles.modalScroll}>
                <Pressable
                  style={[
                    styles.modalOption,
                    filterClient === '' && styles.modalOptionActive,
                  ]}
                  onPress={() => {
                    setFilterClient('');
                    setShowClientModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      filterClient === '' && styles.modalOptionTextActive,
                    ]}
                  >
                    Todos os clientes
                  </Text>
                </Pressable>

                {allUsers.map(user => (
                  <Pressable
                    key={user.id}
                    style={[
                      styles.modalOption,
                      filterClient === user.id && styles.modalOptionActive,
                    ]}
                    onPress={() => {
                      setFilterClient(user.id || '');
                      setShowClientModal(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        filterClient === user.id && styles.modalOptionTextActive,
                      ]}
                    >
                      {user.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
        </BlurView>
      </Modal>

      {/* Status Modal */}
      <Modal
        visible={showStatusModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <BlurView style={styles.blurContainer} intensity={70}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Pressable
                style={styles.modalCloseBtn}
                onPress={() => setShowStatusModal(false)}
              >
                <Ionicons name="close" size={24} color="#111" />
              </Pressable>

              <Text style={styles.modalTitle}>Seleccionar Estado</Text>

              <ScrollView style={styles.modalScroll}>
                <Pressable
                  style={[
                    styles.modalOption,
                    filterStatus === '' && styles.modalOptionActive,
                  ]}
                  onPress={() => {
                    setFilterStatus('');
                    setShowStatusModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      filterStatus === '' && styles.modalOptionTextActive,
                    ]}
                  >
                    Todos os estados
                  </Text>
                </Pressable>

                {(
                  [
                    'AGUARDA_PAGAMENTO',
                    'EM_PROCESSAMENTO',
                    'ENVIADO',
                    'ENTREGUE',
                    'DEVOLVIDO',
                  ] as const
                ).map(status => (
                  <Pressable
                    key={status}
                    style={[
                      styles.modalOption,
                      filterStatus === status && styles.modalOptionActive,
                    ]}
                    onPress={() => {
                      setFilterStatus(status);
                      setShowStatusModal(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        filterStatus === status && styles.modalOptionTextActive,
                      ]}
                    >
                      {statusLabel[status]}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
        </BlurView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  roundBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 20, fontWeight: '800', color: '#111' },
  subtitle: { fontSize: 13, color: '#999', marginTop: 2 },
  container: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0A4CFF',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
    marginBottom: 24,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111',
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0A4CFF',
    marginBottom: 12,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 6,
  },
  filterDropdown: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  filterDropdownLabel: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  filtersLabelsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
    paddingHorizontal: 14,
  },
  filterLabel: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  searchBtn: {
    backgroundColor: '#0A4CFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 24,
  },
  searchBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  resultsContainer: {
    marginTop: 12,
  },
  list: {
    gap: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    gap: 10,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderTitle: { fontSize: 18, fontWeight: '800', color: '#111' },
  clientPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginTop: 6,
  },
  clientText: { color: '#111', fontWeight: '600' },
  itemsBadge: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  itemsText: { fontWeight: '700', color: '#111' },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  statusText: { fontSize: 18, fontWeight: '800' },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  empty: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyHint: {
    textAlign: 'center',
    color: '#999',
    fontSize: 13,
  },
  blurContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    maxHeight: '80%',
  },
  modalCloseBtn: {
    alignSelf: 'flex-end',
    padding: 8,
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalScroll: {
    maxHeight: 400,
  },
  modalOption: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  modalOptionActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#0A4CFF',
  },
  modalOptionText: {
    fontSize: 14,
    color: '#111',
    fontWeight: '600',
  },
  modalOptionTextActive: {
    color: '#0A4CFF',
  },
});
