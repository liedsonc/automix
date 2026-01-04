import { getCurrentUser } from '@/utils/getCurrentUser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';

export default function SupplierLayout() {
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  const ensureSupplier = useCallback(async () => {
    const user = await getCurrentUser<{ role?: string }>();
    const storedRole = await AsyncStorage.getItem('USER_ROLE');
    const role = user?.role ?? storedRole;

    if (role !== 'fornecedor') {
      setAllowed(false);
      router.replace('/(tabs)/store');
      return;
    }

    setAllowed(true);
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      ensureSupplier();
    }, [ensureSupplier])
  );

  if (allowed === false) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="orders/index" />
      <Stack.Screen
        name="orders/search"
        options={{
          presentation: 'transparentModal',
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
      <Stack.Screen name="orders/result" />
    </Stack>
  );
}
