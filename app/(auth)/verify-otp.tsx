import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { apiService } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

export default function VerifyOtpScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(60);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(timer - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert('Erreur', 'Veuillez saisir le code à 6 chiffres');
      return;
    }

    setLoading(true);
    try {
      await apiService.verifyOtp(email!, otp);
      Alert.alert(
        'Vérification réussie',
        'Votre compte a été activé avec succès !',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(auth)/login'),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Erreur de vérification', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResendLoading(true);
    try {
      await apiService.sendOtp(email!);
      setTimer(60);
      Alert.alert('Code envoyé', 'Un nouveau code de vérification a été envoyé à votre email');
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <View style={styles.iconContainer}>
            <Ionicons name="mail-outline" size={60} color="#007AFF" />
          </View>
        </View>

        <View style={styles.form}>
          <Text style={styles.title}>Vérification de votre email</Text>
          <Text style={styles.subtitle}>
            Nous avons envoyé un code de vérification à 6 chiffres à :
          </Text>
          <Text style={styles.email}>{email}</Text>

          <View style={styles.otpContainer}>
            <TextInput
              style={styles.otpInput}
              value={otp}
              onChangeText={setOtp}
              keyboardType="numeric"
              maxLength={6}
              placeholder="123456"
              placeholderTextColor="#ccc"
              textAlign="center"
              fontSize={24}
              letterSpacing={8}
            />
          </View>

          <TouchableOpacity
            style={[styles.verifyButton, loading && styles.verifyButtonDisabled]}
            onPress={handleVerifyOtp}
            disabled={loading}
          >
            <Text style={styles.verifyButtonText}>
              {loading ? 'Vérification...' : 'Vérifier le code'}
            </Text>
          </TouchableOpacity>

          <View style={styles.resendSection}>
            <Text style={styles.resendText}>
              Vous n'avez pas reçu le code ?
            </Text>
            
            {timer > 0 ? (
              <Text style={styles.timerText}>
                Renvoyer dans {timer}s
              </Text>
            ) : (
              <TouchableOpacity
                style={styles.resendButton}
                onPress={handleResendOtp}
                disabled={resendLoading}
              >
                <Text style={styles.resendButtonText}>
                  {resendLoading ? 'Envoi...' : 'Renvoyer le code'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.helpSection}>
            <Text style={styles.helpText}>
              Vérifiez votre dossier spam si vous ne trouvez pas l'email.
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  iconContainer: {
    marginTop: 30,
  },
  form: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    textAlign: 'center',
    marginBottom: 30,
  },
  otpContainer: {
    marginBottom: 30,
  },
  otpInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  verifyButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  verifyButtonDisabled: {
    opacity: 0.6,
  },
  verifyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resendSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  resendText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  timerText: {
    fontSize: 14,
    color: '#999',
  },
  resendButton: {},
  resendButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  helpSection: {
    alignItems: 'center',
  },
  helpText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});