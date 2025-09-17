import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, usePathname, useRouter } from "expo-router";
import { useEffect } from 'react';
import { apiService } from '../services/api';
import { notificationService } from '../services/notificationService';

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const initializeApp = async () => {
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

        // 2) Initialiser le service de notifications si connecté
        if (token) {
          await notificationService.initialize();
          notificationService.setupNotificationListeners();
        }
      } catch (error) {
        console.error('❌ Erreur initialisation app:', error);
      }
    };

    initializeApp();
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
