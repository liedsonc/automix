import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Dimensions, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { useAdminGuard } from '../../hooks/useAdminGuard';
import { STORAGE_KEYS } from '../../utils/storageKeys';

const screenWidth = Dimensions.get('window').width - 40;

const COLORS = [
  '#4F8EF7',
  '#3CB371',
  '#6FE7F0',
  '#6AA5FF',
  '#FF6B6B',
  '#FFD93D',
  '#A8E6CF',
  '#FF8B94',
];

type Order = {
  id: string;
  userId?: string;
  items: any[];
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

const calculateFinance = (orders: Order[]) => {
  let totalPaid = 0;
  let totalPending = 0;
  let notPaidCount = 0;

  orders.forEach(order => {
    if (order.paymentStatus === 'PAGO' || order.orderStatus === 'ENTREGUE') {
      totalPaid += order.total;
    }

    if (order.orderStatus === 'AGUARDA_PAGAMENTO') {
      totalPending += order.total;
    }

    if (order.paymentStatus === 'PENDENTE' && order.orderStatus === 'AGUARDA_PAGAMENTO') {
      notPaidCount += 1;
    }
  });

  return {
    totalPaid,
    totalPending,
    notPaidCount,
    totalOrders: orders.length,
  };
};

const buildChartData = (orders: Order[]) => {
  let paid = 0;
  let pending = 0;
  let notPaid = 0;

  orders.forEach(order => {
    if (order.paymentStatus === 'PAGO' || order.orderStatus === 'ENTREGUE') {
      paid += order.total;
    }

    if (order.orderStatus === 'AGUARDA_PAGAMENTO') {
      pending += order.total;
    }

    if (order.paymentStatus === 'PENDENTE' && order.orderStatus === 'AGUARDA_PAGAMENTO') {
      notPaid += order.total;
    }
  });

  return {
    labels: ['Pago', 'Pendente', 'Não pago'],
    values: [paid, pending, notPaid],
  };
};

const calculateStats = (orders: Order[]) => {
  const totals: Record<string, number> = {};

  orders.forEach(order => {
    if (order.paymentStatus !== 'PAGO' && order.orderStatus !== 'ENTREGUE') return;

    order.items.forEach((item: any) => {
      const value = item.price * item.quantity;
      const category = item.category || 'Outros';
      totals[category] = (totals[category] || 0) + value;
    });
  });

  const total = Object.values(totals).reduce((a, b) => a + b, 0);

  if (total === 0) {
    return { total: 0, result: [] };
  }

  const result = Object.entries(totals).map(([category, value]) => ({
    category,
    value,
    percentage: Math.round((value / total) * 100),
  }));

  return { total, result };
};

export default function AdminFinance() {
  useAdminGuard();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [chart, setChart] = useState<any>(null);
  const [categoryStats, setCategoryStats] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.ORDERS);
      const orders = raw ? JSON.parse(raw) : [];

      setStats(calculateFinance(orders));
      setChart(buildChartData(orders));
      setCategoryStats(calculateStats(orders));
    };

    load();
  }, []);

  if (!stats || !chart || !categoryStats) return null;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#1B2C48" />
          </Pressable>
          <View>
            <Text style={styles.title}>Painel Financeiro</Text>
            <Text style={styles.subtitle}>Admin - Finanças</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.iconWrapper}>
            <Ionicons name="cash-outline" size={28} color="#16a34a" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Total faturado</Text>
            <Text style={styles.value}>€{stats.totalPaid.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={[styles.iconWrapper, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="time-outline" size={28} color="#f59e0b" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Por receber</Text>
            <Text style={styles.value}>€{stats.totalPending.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={[styles.iconWrapper, { backgroundColor: '#FEE2E2' }]}>
            <Ionicons name="close-circle-outline" size={28} color="#ef4444" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Não pagas</Text>
            <Text style={styles.value}>{stats.notPaidCount}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={[styles.iconWrapper, { backgroundColor: '#DBEAFE' }]}>
            <Ionicons name="receipt-outline" size={28} color="#0A4CFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Total encomendas</Text>
            <Text style={styles.value}>{stats.totalOrders}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Resumo financeiro</Text>

        <BarChart
          data={{
            labels: chart.labels,
            datasets: [{ data: chart.values }],
          }}
          width={screenWidth}
          height={220}
          yAxisLabel="€"
          yAxisSuffix=""
          fromZero
          chartConfig={{
            backgroundGradientFrom: '#fff',
            backgroundGradientTo: '#fff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(10, 76, 255, ${opacity})`,
            labelColor: () => '#333',
            barPercentage: 0.6,
          }}
          style={{
            marginVertical: 8,
            borderRadius: 16,
          }}
        />

        <Text style={styles.sectionTitle}>Vendas por categoria</Text>
        
        <View style={styles.categoryTotalCard}>
          <Text style={styles.categoryTotalLabel}>Total Vendas</Text>
          <Text style={styles.categoryTotalValue}>€{categoryStats.total.toFixed(2)}</Text>
        </View>

        {categoryStats.result.map((item: any, index: number) => (
          <View key={index} style={styles.categoryCard}>
            <View style={[styles.categoryDot, { backgroundColor: COLORS[index % COLORS.length] }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.categoryLabel}>{item.category}</Text>
              <Text style={styles.categoryValue}>€{item.value.toFixed(2)}</Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${item.percentage}%`,
                      backgroundColor: COLORS[index % COLORS.length]
                    }
                  ]} 
                />
              </View>
            </View>
            <View style={styles.percentBadge}>
              <Text style={styles.percentText}>{item.percentage}%</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f9f9f9' },
  container: {
    padding: 20,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111',
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 2,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  value: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111',
    marginTop: 12,
    marginBottom: 4,
  },
  categoryTotalCard: {
    backgroundColor: '#16a34a',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  categoryTotalLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 8,
  },
  categoryTotalValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
  },
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    marginBottom: 4,
  },
  categoryValue: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  percentBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  percentText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0A4CFF',
  },
});
