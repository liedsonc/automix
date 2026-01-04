import { Stack } from 'expo-router';

// Hide settings routes from the tab bar while keeping the tab bar visible
export const unstable_settings = {
  href: null,
};

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: 'card',
      }}
    />
  );
}
