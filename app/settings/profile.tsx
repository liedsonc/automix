import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsProfile() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.title}>Configurações</Text>
            <Text style={styles.subtitle}>Seu perfil</Text>
          </View>
        </View>

        <View style={styles.avatarWrap}>
          <Image
            source={{ uri: 'https://i.pravatar.cc/150' }}
            style={styles.avatar}
          />
          <Pressable style={styles.editAvatar}>
            <Ionicons name="pencil" size={16} color="#fff" />
          </Pressable>
        </View>

        <TextInput 
          style={styles.input} 
          placeholder="País"
          value="Portugal" 
          editable={false} 
        />
        <TextInput 
          style={styles.input} 
          placeholder="Email"
          value="burnoreis@ipb.pt" 
        />
        <TextInput 
          style={styles.input} 
          placeholder="Password"
          value="***********" 
          secureTextEntry 
        />

        <Pressable style={styles.saveBtn}>
          <Text style={styles.saveText}>Guardar Alterações</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#fff' 
  },
  container: { 
    flex: 1 
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  backButton: {
    marginRight: 12,
    marginTop: 4,
  },
  headerText: {
    flex: 1,
  },
  title: { 
    fontSize: 28, 
    fontWeight: '800', 
    color: '#000',
    marginBottom: 4,
  },
  subtitle: { 
    fontSize: 16, 
    marginBottom: 10, 
    color: '#666' 
  },
  avatarWrap: { 
    alignItems: 'center', 
    marginBottom: 30,
    position: 'relative',
  },
  avatar: { 
    width: 110, 
    height: 110, 
    borderRadius: 55,
  },
  editAvatar: {
    position: 'absolute',
    right: '50%',
    marginRight: -65,
    bottom: 0,
    backgroundColor: '#0A4CFF',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  input: {
    backgroundColor: '#F3F6FC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    fontSize: 16,
    color: '#000',
  },
  saveBtn: {
    backgroundColor: '#0A4CFF',
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  saveText: { 
    color: '#fff', 
    fontWeight: '700', 
    fontSize: 16 
  },
});
