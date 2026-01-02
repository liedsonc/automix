import { Redirect } from 'expo-router';

export default function Index() {
  // Garantes que a primeira tela é a Store
  return <Redirect href="/store" />;
}
