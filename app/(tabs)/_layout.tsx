import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#000000',
        tabBarInactiveTintColor: '#004CFF',
        tabBarStyle: {
          height: 70,
          backgroundColor: '#fff',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'search' : 'search-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="store"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'cart' : 'cart-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="login"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
