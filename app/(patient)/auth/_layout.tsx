import { Stack } from 'expo-router';

export default function PatientAuthLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="login" 
        options={{ 
          title: 'Connexion Patient',
          headerStyle: { backgroundColor: '#007AFF' },
          headerTintColor: 'white',
        }} 
      />
      <Stack.Screen 
        name="register" 
        options={{ 
          title: 'Inscription Patient',
          headerStyle: { backgroundColor: '#007AFF' },
          headerTintColor: 'white',
        }} 
      />
      <Stack.Screen 
        name="forgot-password" 
        options={{ 
          title: 'Mot de passe oublié',
          headerStyle: { backgroundColor: '#007AFF' },
          headerTintColor: 'white',
        }} 
      />
    </Stack>
  );
}
