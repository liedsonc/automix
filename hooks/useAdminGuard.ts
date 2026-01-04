import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { getUserRole } from '../utils/auth';

export function useAdminGuard() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const role = await getUserRole();
      if (role !== 'admin') {
        router.replace('/login');
      }
    })();
  }, [router]);
}
