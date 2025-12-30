import { Stack, useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView style={styles.container}>
        {/* Blobs decorativos */}
        <View style={styles.topBlob} />
        <View style={styles.bottomBlob} />

        {/* Conteúdo */}
        <View style={styles.content}>
          <Text style={styles.title}>Login</Text>
          <Text style={styles.subtitle}>Bom vê-lo de volta!</Text>

          <TextInput
            placeholder="Email"
            placeholderTextColor="#AAA"
            style={styles.input}
          />

          <TextInput
            placeholder="Password"
            placeholderTextColor="#AAA"
            style={styles.input}
            secureTextEntry
          />

          <Pressable style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Continuar</Text>
          </Pressable>

          <Pressable onPress={() => Alert.alert('Conta', 'Funcionalidade em breve')}>
            <Text style={styles.createAccount}>Criar uma conta</Text>
          </Pressable>

          <Pressable onPress={() => router.back()}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },

  title: {
    fontSize: 42,
    fontWeight: '700',
    color: '#111',
  },

  subtitle: {
    fontSize: 16,
    color: '#777',
    marginTop: 6,
    marginBottom: 36,
  },

  input: {
    height: 56,
    backgroundColor: '#F2F2F2',
    borderRadius: 28,
    paddingHorizontal: 20,
    fontSize: 16,
    marginBottom: 20,
  },

  primaryButton: {
    height: 56,
    backgroundColor: '#0A4CFF',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },

  primaryButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },

  createAccount: {
    textAlign: 'center',
    fontSize: 16,
    color: '#0A4CFF',
    marginBottom: 12,
    fontWeight: '600',
  },

  cancelText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#777',
  },

  /* BLOBS */
  topBlob: {
    position: 'absolute',
    top: -180,
    left: -160,
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: '#E3EBFF',
  },

  bottomBlob: {
    position: 'absolute',
    bottom: -120,
    right: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#0A4CFF',
  },
});
