import { Stack } from 'expo-router';
import { Platform, StatusBar } from 'react-native';

export default function ModalsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#007AFF',
          paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 17,
          color: '#FFFFFF',
        },
        presentation: 'modal',
      }}
    >
      <Stack.Screen name="doctor-detail" options={{ title: 'Détails du médecin' }} />
      <Stack.Screen name="appointment-motif" options={{ title: 'Prendre rendez-vous' }} />
      <Stack.Screen name="consultations" options={{ title: 'Mes consultations' }} />
      <Stack.Screen name="ordonnances" options={{ title: 'Mes ordonnances' }} />
      <Stack.Screen name="edit-profile" options={{ title: 'Modifier mon profil' }} />
    </Stack>
  );
}
