import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

export default function Index() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const [token, userData] = await Promise.all([
        AsyncStorage.getItem('userToken'),
        AsyncStorage.getItem('userData'),
      ]);

      if (token && userData) {
        const user = JSON.parse(userData);
        
        // Rediriger selon le rôle de l'utilisateur
        switch (user.role) {
          case 'PATIENT':
            router.replace('/(patient)/(tabs)/home');
            break;
          case 'MEDECIN':
            router.replace('/(medecin)/dashboard');
            break;
          case 'ADMINCABINET':
          case 'SUPERADMIN':
            router.replace('/(medecin)/dashboard'); // Utiliser la même interface pour les admins
            break;
          default:
            router.replace('/(auth)/login');
        }
      } else {
        router.replace('/(auth)/login');
      }
    } catch (error) {
      console.error('Erreur vérification auth:', error);
      router.replace('/(auth)/login');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.logoContainer}>
          <Ionicons name="medical" size={60} color="#007AFF" />
          <Text style={styles.logoText}>SantéAfrik</Text>
          <Text style={styles.subtitle}>Votre santé, notre priorité</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
});
