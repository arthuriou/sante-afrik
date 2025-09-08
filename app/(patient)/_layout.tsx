import { Stack } from 'expo-router';

export default function PatientLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
      }}
    >
      <Stack.Screen 
        name="(tabs)" 
        options={{ 
          headerShown: false,
          gestureEnabled: false,
        }} 
      />
      <Stack.Screen 
        name="medecin/[id]" 
        options={{ 
          presentation: 'card',
          gestureEnabled: true,
        }} 
      />
      <Stack.Screen 
        name="book-appointment" 
        options={{ 
          presentation: 'modal',
          gestureEnabled: true,
        }} 
      />
      <Stack.Screen 
        name="emergency" 
        options={{ 
          presentation: 'card',
          gestureEnabled: true,
        }} 
      />
      <Stack.Screen 
        name="teleconsultation" 
        options={{ 
          presentation: 'card',
          gestureEnabled: true,
        }} 
      />
    </Stack>
  );
}