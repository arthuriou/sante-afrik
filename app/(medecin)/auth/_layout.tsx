import { Stack } from 'expo-router';

export default function MedecinAuthLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="login" 
        options={{ 
          title: 'Connexion Médecin',
          headerStyle: { backgroundColor: '#34C759' },
          headerTintColor: 'white',
        }} 
      />
      <Stack.Screen 
        name="register" 
        options={{ 
          title: 'Inscription Médecin',
          headerStyle: { backgroundColor: '#34C759' },
          headerTintColor: 'white',
        }} 
      />
      <Stack.Screen 
        name="forgot-password" 
        options={{ 
          title: 'Mot de passe oublié',
          headerStyle: { backgroundColor: '#34C759' },
          headerTintColor: 'white',
        }} 
      />
    </Stack>
  );
}
