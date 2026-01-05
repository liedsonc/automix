import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from './storageKeys';

export async function getCurrentUser<T = any>() {
  const user = await AsyncStorage.getItem(STORAGE_KEYS.USER);
  return user ? (JSON.parse(user) as T) : null;
}
