import { Stack } from 'expo-router';

/** Sign-in screens (only reachable while signed out). */
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
