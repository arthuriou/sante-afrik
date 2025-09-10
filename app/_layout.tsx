import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, usePathname, useRouter } from "expo-router";
import { useEffect } from 'react';

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const enforceAuthSeparation = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');

        const inAuth = pathname?.startsWith('/(auth)');
        const inApp = pathname?.startsWith('/(patient)') || pathname?.startsWith('/(medecin)');

        if (token && inAuth) {
          // Rediriger selon rôle stocké
          const role = await AsyncStorage.getItem('userRole');
          if (role === 'MEDECIN') {
            router.replace('/(medecin)/screens/dashboard');
          } else {
            router.replace('/(patient)/screens/home');
          }
        } else if (!token && inApp) {
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
