import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo et titre */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="medical" size={60} color="#007AFF" />
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
              <Ionicons name="person-outline" size={40} color="#007AFF" />
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
              <Ionicons name="medical-outline" size={40} color="#34C759" />
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
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginLeft: 12,
  },
  subtitle: {
    fontSize: 18,
    color: '#8E8E93',
    textAlign: 'center',
  },
  selectionContainer: {
    marginBottom: 60,
  },
  selectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 32,
  },
  selectionButton: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  buttonSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
});
