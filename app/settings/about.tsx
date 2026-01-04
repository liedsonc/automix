import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function About() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.roundBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#1B2C48" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Configurações</Text>
          <Text style={styles.subtitle}>Sobre AutoMix</Text>
        </View>
      </View>

      <View style={styles.icon}>
        <Ionicons name="bag-handle" size={48} color="#0A4CFF" />
      </View>

      <Text style={styles.mainTitle}>Sobre AutoMix</Text>

      <Text style={styles.text}>
        AutoMix é uma aplicação de comércio eletrónico desenvolvida
        como projeto académico. O objetivo é facilitar a compra de
        produtos através de uma interface simples e intuitiva.
      </Text>

      <Text style={styles.text}>
        Para qualquer dúvida ou apoio, contacta:
        {'\n'}
        ajuda@automix.com
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 20,
  },
  roundBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111',
  },
  subtitle: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  icon: {
    alignItems: 'center',
    marginBottom: 16,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  text: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 20,
  },
});
