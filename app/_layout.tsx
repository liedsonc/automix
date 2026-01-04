import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import '@/global.css';

export const unstable_settings = {
  anchor: '(tabs)',
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();


  return (
    
    <GluestackUIProvider mode="dark">
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
          initialRouteName="(tabs)"
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

          {/* Rotas de produto fora das tabs */}
          <Stack.Screen name="product/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="product/edit/[id]" options={{ headerShown: false }} />

          {/* Settings - apresentadas por cima das tabs */}
          <Stack.Screen name="settings/index" options={{ headerShown: false, presentation: 'card' }} />
          <Stack.Screen name="settings/profile" options={{ headerShown: false, presentation: 'card' }} />
          <Stack.Screen name="settings/address" options={{ headerShown: false, presentation: 'card' }} />
          <Stack.Screen name="settings/country" options={{ headerShown: false, presentation: 'card' }} />
          <Stack.Screen name="settings/payments" options={{ headerShown: false, presentation: 'card' }} />
          <Stack.Screen name="settings/add-card" options={{ headerShown: false, presentation: 'card' }} />
          <Stack.Screen name="settings/edit-card" options={{ headerShown: false, presentation: 'card' }} />

          {/* Auth & outras rotas soltas */}
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="login-password" options={{ headerShown: false }} />
          <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
          <Stack.Screen name="create-account" options={{ headerShown: false }} />
          <Stack.Screen name="promo" options={{ headerShown: false }} />

          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </GluestackUIProvider>
  );
}
