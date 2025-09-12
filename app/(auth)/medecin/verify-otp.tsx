import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { apiService } from '../../../services/api';

export default function VerifyOtpScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const handleVerifyOtp = async () => {
    if (!otpCode.trim() || otpCode.length !== 6) {
      Alert.alert('Erreur', 'Veuillez saisir un code à 6 chiffres');
      return;
    }

    try {
      setLoading(true);
      await apiService.verifyOtp(email as string, otpCode);

      Alert.alert('Succès', 'Compte vérifié avec succès', [
        {
          text: 'OK',
          onPress: () => router.push('/(auth)/medecin/login'),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Code OTP invalide');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email?.trim()) {
      Alert.alert('Erreur', 'Email manquant');
      return;
    }

    try {
      setResendLoading(true);
      await apiService.resendOtp(email.trim());
      Alert.alert('Succès', 'Un nouveau code a été envoyé à votre adresse email');
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de renvoyer le code');
    } finally {
      setResendLoading(false);
    }
  };

  const handleOtpChange = (text: string) => {
    // Ne garder que les chiffres
    const numericText = text.replace(/[^0-9]/g, '');
    if (numericText.length <= 6) {
      setOtpCode(numericText);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Vérification</Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="shield-checkmark-outline" size={64} color="#007AFF" />
          </View>

          <Text style={styles.title}>Vérifiez votre email</Text>
          <Text style={styles.subtitle}>
            Nous avons envoyé un code de vérification à 6 chiffres à votre adresse email.
            Saisissez ce code ci-dessous.
          </Text>

          <View style={styles.emailContainer}>
            <Text style={styles.emailText}>{email}</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.otpContainer}>
              <TextInput
                ref={inputRef}
                style={styles.otpInput}
                placeholder="000000"
                placeholderTextColor="#C7C7CC"
                value={otpCode}
                onChangeText={handleOtpChange}
                keyboardType="numeric"
                maxLength={6}
                textAlign="center"
                autoFocus
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleVerifyOtp}
              disabled={loading || otpCode.length !== 6}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Vérification...' : 'Vérifier le code'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resendButton}
              onPress={handleResendOtp}
              disabled={resendLoading}
            >
              <Text style={styles.resendButtonText}>
                {resendLoading ? 'Envoi en cours...' : 'Renvoyer le code'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Vous n'avez pas reçu le code ?</Text>
            <TouchableOpacity onPress={handleResendOtp} disabled={resendLoading}>
              <Text style={styles.footerLink}>
                {resendLoading ? 'Envoi en cours...' : 'Renvoyer'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    fontFamily: 'System',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'System',
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    fontFamily: 'System',
  },
  emailContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    alignItems: 'center',
  },
  emailText: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '600',
    fontFamily: 'System',
  },
  form: {
    marginBottom: 32,
  },
  otpContainer: {
    marginBottom: 24,
  },
  otpInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    height: 56,
    fontSize: 24,
    fontWeight: '600',
    color: '#1C1C1E',
    fontFamily: 'System',
    letterSpacing: 8,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  submitButtonDisabled: {
    backgroundColor: '#8E8E93',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
  resendButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  resendButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
  footer: {
    alignItems: 'center',
    marginTop: 'auto',
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
    fontFamily: 'System',
  },
  footerLink: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    fontFamily: 'System',
  },
});
