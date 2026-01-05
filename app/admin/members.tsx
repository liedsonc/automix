import { useAdminGuard } from '@/hooks/useAdminGuard';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// UX: Label bonito para role
const ROLE_LABEL: Record<string, string> = {
  cliente: 'Cliente',
  fornecedor: 'Fornecedor',
  admin: 'Admin',
};

type Member = {
  id: string | number;
  name: string;
  email: string;
  role?: 'cliente' | 'fornecedor' | 'admin';
  avatar?: string;
  approved?: boolean;
};

export default function AdminMembers() {
  useAdminGuard();
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'todos' | 'pendentes'>('todos');

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      const stored = await AsyncStorage.getItem('USERS');
      const users = stored ? JSON.parse(stored) : [];
      setMembers(users);
    } catch {
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const saveMembers = async (updated: Member[]) => {
    setMembers(updated);
    await AsyncStorage.setItem('USERS', JSON.stringify(updated));
  };

  const approveMember = async (member: Member) => {
    const updated = members.map(m =>
      m.id === member.id ? { ...m, approved: true } : m
    );
    await saveMembers(updated);
  };

  const rejectMember = async (member: Member) => {
    const updated = members.filter(m => m.id !== member.id);
    await saveMembers(updated);
  };

  const filteredMembers = members.filter(m => {
    if (m.role === 'admin') return false;
    if (filter === 'pendentes') return m.approved === false;
    return true;
  });

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>A carregar membros…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F6FA' }}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Back Button */}
        <Pressable onPress={() => router.push('/profile')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0A4CFF" />
        </Pressable>
          
        {/* Header */}
        <Text style={styles.title}>Gestão de Membros</Text>

        {/* Filtros */}
        <View style={styles.filters}>
          <Pressable
            style={[styles.filterBtn, filter === 'todos' && styles.filterActive]}
            onPress={() => setFilter('todos')}
          >
            <Text
              style={[
                styles.filterText,
                filter === 'todos' && styles.filterTextActive,
              ]}
            >
              Todos
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.filterBtn,
              filter === 'pendentes' && styles.filterActive,
            ]}
            onPress={() => setFilter('pendentes')}
          >
            <Text
              style={[
                styles.filterText,
                filter === 'pendentes' && styles.filterTextActive,
              ]}
            >
              Pendentes
            </Text>
          </Pressable>
        </View>

        {/* Lista */}
        {filteredMembers.length === 0 && (
          <Text style={styles.empty}>Sem resultados</Text>
        )}

        {filteredMembers.map((member) => {
          const isPending = member.approved === false;

          return (
            <View key={String(member.id)} style={styles.card}>
              {/* Avatar */}
              <View style={styles.avatar}>
                {member.avatar ? (
                  <Image
                    source={{ uri: member.avatar }}
                    style={styles.avatarImg}
                  />
                ) : (
                  <Text style={styles.avatarText}>
                    {member.name?.charAt(0)?.toUpperCase() ?? '?'}
                  </Text>
                )}
              </View>


              {/* Info */}
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{member.name}</Text>
                <Text style={styles.email}>{member.email}</Text>

                <View style={styles.badges}>

                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {member.role ? ROLE_LABEL[member.role] : 'Pendente'}
                    </Text>
                  </View>

                  {isPending && (
                    <View style={[styles.badge, styles.pendingBadge]}>
                      <Text style={styles.badgeText}>pedido</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Ações */}
              {isPending ? (
                <View style={styles.actions}>
                  <Pressable
                    style={[styles.actionBtn, styles.approve]}
                    onPress={() => approveMember(member)}
                  >
                    <Ionicons name="checkmark" size={18} color="#fff" />
                  </Pressable>

                  <Pressable
                    style={[styles.actionBtn, styles.reject]}
                    onPress={() => rejectMember(member)}
                  >
                    <Ionicons name="close" size={18} color="#fff" />
                  </Pressable>
                </View>
              ) : (
                <Ionicons name="person" size={26} color="#0A4CFF" />
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 16,
    color: '#111',
  },

  filters: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  filterBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    marginRight: 10,
  },
  filterActive: {
    backgroundColor: '#0A4CFF',
  },
  filterText: {
    color: '#333',
    fontWeight: '700',
  },
  filterTextActive: {
    color: '#fff',
  },

  empty: {
    color: '#777',
    textAlign: 'center',
    marginTop: 40,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',

    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },


  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0A4CFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    resizeMode: 'cover',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 18,
  },

  name: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111',
  },
  email: {
    fontSize: 13,
    color: '#555',
    marginTop: 2,
  },

  badges: {
    flexDirection: 'row',
    marginTop: 6,
  },
  badge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginRight: 6,
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },

  actions: {
    flexDirection: 'row',
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  approve: {
    backgroundColor: '#22C55E',
  },
  reject: {
    backgroundColor: '#EF4444',
  },
  backBtn: {
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 10,
            backgroundColor: '#fff',
            shadowColor: '#000',
            shadowOpacity: 0.05,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 2 },
            elevation: 2,
          },
});
