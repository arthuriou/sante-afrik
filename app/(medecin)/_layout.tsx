import { Stack } from 'expo-router';

export default function MedecinLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
      }}
    >
      <Stack.Screen 
        name="dashboard" 
        options={{ 
          headerShown: false,
          gestureEnabled: false,
        }} 
      />
      <Stack.Screen 
        name="agenda" 
        options={{ 
          presentation: 'card',
          gestureEnabled: true,
        }} 
      />
      <Stack.Screen 
        name="patients" 
        options={{ 
          presentation: 'card',
          gestureEnabled: true,
        }} 
      />
      <Stack.Screen 
        name="create-slot" 
        options={{ 
          presentation: 'modal',
          gestureEnabled: true,
        }} 
      />
      <Stack.Screen 
        name="appointment/[id]" 
        options={{ 
          presentation: 'card',
          gestureEnabled: true,
        }} 
      />
      <Stack.Screen 
        name="patient/[id]" 
        options={{ 
          presentation: 'card',
          gestureEnabled: true,
        }} 
      />
      <Stack.Screen 
        name="profile" 
        options={{ 
          presentation: 'card',
          gestureEnabled: true,
        }} 
      />
      <Stack.Screen 
        name="stats" 
        options={{ 
          presentation: 'card',
          gestureEnabled: true,
        }} 
      />
    </Stack>
  );
}