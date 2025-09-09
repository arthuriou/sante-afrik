import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="patient/login" />
      <Stack.Screen name="patient/register" />
      <Stack.Screen name="patient/forgot-password" />
      <Stack.Screen name="medecin/login" />
      <Stack.Screen name="medecin/register" />
    </Stack>
  );
}


