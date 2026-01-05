import AsyncStorage from '@react-native-async-storage/async-storage';
import { ADMIN_CREDENTIALS } from '../data/admin';

export const currentUser = {
  id: 10,
};

const USER_KEY = 'USER_SESSION';

export const loginAdmin = async (email: string, password: string) => {
  if (
    email === ADMIN_CREDENTIALS.email &&
    password === ADMIN_CREDENTIALS.password
  ) {
    await AsyncStorage.setItem(
      USER_KEY,
      JSON.stringify({
        email,
        role: 'admin',
      })
    );
    return true;
  }
  return false;
};

export const getUserRole = async (): Promise<string | null> => {
  const user = await AsyncStorage.getItem(USER_KEY);
  if (user) {
    return JSON.parse(user).role;
  }

  // fallback to existing session keys used elsewhere
  const storedRole = await AsyncStorage.getItem('USER_ROLE');
  if (storedRole) return storedRole;

  const loggedUser = await AsyncStorage.getItem('LOGGED_USER');
  if (loggedUser) {
    const parsed = JSON.parse(loggedUser);
    return parsed?.role ?? null;
  }

  return null;
};

export const logout = async () => {
  await AsyncStorage.removeItem(USER_KEY);
};
