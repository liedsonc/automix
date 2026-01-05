import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* ecrã principal do admin */}
      <Stack.Screen name="orders" />

      {/* no futuro podes adicionar mais */}
      {/* <Stack.Screen name="members" /> */}
      {/* <Stack.Screen name="products" /> */}
    </Stack>
  );
}
