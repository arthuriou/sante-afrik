import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import {
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { apiService } from '../services/api';

export default function WelcomeScreen() {
  const router = useRouter();

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await apiService.initializeSession();
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
          const role = await AsyncStorage.getItem('userRole');
          if (role === 'MEDECIN') {
            router.replace('/(medecin)/screens/agenda');
          } else {
            router.replace('/(patient)/screens/home');
          }
        }
      } catch (error) {
        console.log('Bootstrap error:', error);
      }
    };
    bootstrap();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo et titre */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <Ionicons name="medical" size={64} color="#007AFF" />
            </View>
            <Text style={styles.logoText}>SantéAfrik</Text>
          </View>
          <Text style={styles.subtitle}>
            Votre santé, notre priorité
          </Text>
        </View>

        {/* Boutons de sélection */}
        <View style={styles.selectionContainer}>
          <Text style={styles.selectionTitle}>Je suis...</Text>
          
          <TouchableOpacity 
            style={styles.selectionButton}
            onPress={() => router.push('/(auth)/patient/login')}
          >
            <View style={styles.buttonIcon}>
              <Ionicons name="person-outline" size={48} color="#007AFF" />
            </View>
            <Text style={styles.buttonTitle}>Patient</Text>
            <Text style={styles.buttonSubtitle}>
              Prendre rendez-vous avec un médecin
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.selectionButton}
            onPress={() => router.push('/(auth)/medecin/login')}
          >
            <View style={styles.buttonIcon}>
              <Ionicons name="medical-outline" size={48} color="#34C759" />
            </View>
            <Text style={styles.buttonTitle}>Médecin</Text>
            <Text style={styles.buttonSubtitle}>
              Gérer mon cabinet et mes patients
            </Text>
          </TouchableOpacity>
        </View>

        {/* Informations supplémentaires */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Rejoignez des milliers d'utilisateurs qui nous font confiance
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 80,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoIcon: {
    width: 100,
    height: 100,
    borderRadius: 25,
    backgroundColor: '#007AFF15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  subtitle: {
    fontSize: 17,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  selectionContainer: {
    marginBottom: 80,
  },
  selectionTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 40,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  selectionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonIcon: {
    width: 100,
    height: 100,
    borderRadius: 25,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  buttonSubtitle: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
});
