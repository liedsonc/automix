import AsyncStorage from '@react-native-async-storage/async-storage';

const USERS_KEY = 'USERS';

export type User = {
  id?: string;
  name: string;
  email: string;
  password: string;
  avatar?: string;
  phone?: string;
  country?: string;
  role?: 'cliente' | 'fornecedor' | 'admin';
};

// Ler utilizadores
export async function getUsers(): Promise<User[]> {
  const data = await AsyncStorage.getItem(USERS_KEY);
  return data ? JSON.parse(data) : [];
}

// Criar utilizador
export async function addUser(user: User) {
  const users = await getUsers();

  const exists = users.find((u) => u.email === user.email);
  if (exists) {
    throw new Error('Este email já existe');
  }

  users.push({
    id: user.id ?? Date.now().toString(),
    name: user.name,
    email: user.email,
    password: user.password,
    avatar: user.avatar,
    role: user.role ?? 'cliente',
  });
  await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// Login
export async function loginUser(email: string, password: string) {
  const users = await getUsers();
  return users.find((u) => u.email === email && u.password === password);
}
