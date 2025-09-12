import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, usePathname, useRouter } from "expo-router";
import { useEffect } from 'react';
import { apiService } from '../services/api';

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const enforceAuthSeparation = async () => {
      try {
        // Tenter d'initialiser/rafraîchir la session au boot
        await apiService.initializeSession();
        const token = await AsyncStorage.getItem('userToken');
        const inAuth = pathname?.startsWith('/(auth)');
        const inApp = pathname?.startsWith('/(patient)') || pathname?.startsWith('/(medecin)');

        // 1) Si non connecté et on tente d'accéder à l'app → renvoyer vers login
        if (!token && inApp) {
          router.replace('/(auth)/patient/login');
        }
      } catch {}
    };

    enforceAuthSeparation();
  }, [pathname]);

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(patient)" options={{ headerShown: false }} />
      <Stack.Screen name="(medecin)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
    </Stack>
  );
}
