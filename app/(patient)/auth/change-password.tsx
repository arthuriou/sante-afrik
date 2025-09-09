import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
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

export default function ChangePasswordScreen() {
  const { email } = useLocalSearchParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validatePassword = (password: string) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
      isValid: minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar,
      requirements: {
        minLength,
        hasUpperCase,
        hasLowerCase,
        hasNumbers,
        hasSpecialChar,
      }
    };
  };

  const handleChangePassword = async () => {
    if (!newPassword.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir un nouveau mot de passe');
      return;
    }

    if (!confirmPassword.trim()) {
      Alert.alert('Erreur', 'Veuillez confirmer votre mot de passe');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      Alert.alert('Erreur', 'Le mot de passe ne respecte pas les critères de sécurité');
      return;
    }

    setIsLoading(true);
    
    try {
      // Appel API pour changer le mot de passe
      const response = await fetch('http://localhost:3000/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          newPassword: newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'Succès',
          'Votre mot de passe a été modifié avec succès',
          [
            {
              text: 'OK',
              onPress: () => router.push('/(patient)/auth/login'),
            },
          ]
        );
      } else {
        Alert.alert('Erreur', data.error || 'Erreur lors du changement de mot de passe');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Erreur de connexion. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const passwordValidation = validatePassword(newPassword);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#2D3748" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="key" size={64} color="#3182CE" />
          </View>

          <Text style={styles.title}>Nouveau mot de passe</Text>
          <Text style={styles.subtitle}>
            Créez un nouveau mot de passe sécurisé
          </Text>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed" size={20} color="#718096" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nouveau mot de passe"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={20}
                  color="#718096"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed" size={20} color="#718096" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirmer le mot de passe"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off" : "eye"}
                  size={20}
                  color="#718096"
                />
              </TouchableOpacity>
            </View>

            {/* Critères de sécurité */}
            <View style={styles.requirementsContainer}>
              <Text style={styles.requirementsTitle}>Critères de sécurité :</Text>
              <View style={styles.requirementItem}>
                <Ionicons
                  name={passwordValidation.requirements.minLength ? "checkmark-circle" : "close-circle"}
                  size={16}
                  color={passwordValidation.requirements.minLength ? "#38A169" : "#E53E3E"}
                />
                <Text style={[
                  styles.requirementText,
                  passwordValidation.requirements.minLength ? styles.requirementMet : styles.requirementNotMet
                ]}>
                  Au moins 8 caractères
                </Text>
              </View>
              <View style={styles.requirementItem}>
                <Ionicons
                  name={passwordValidation.requirements.hasUpperCase ? "checkmark-circle" : "close-circle"}
                  size={16}
                  color={passwordValidation.requirements.hasUpperCase ? "#38A169" : "#E53E3E"}
                />
                <Text style={[
                  styles.requirementText,
                  passwordValidation.requirements.hasUpperCase ? styles.requirementMet : styles.requirementNotMet
                ]}>
                  Une majuscule
                </Text>
              </View>
              <View style={styles.requirementItem}>
                <Ionicons
                  name={passwordValidation.requirements.hasLowerCase ? "checkmark-circle" : "close-circle"}
                  size={16}
                  color={passwordValidation.requirements.hasLowerCase ? "#38A169" : "#E53E3E"}
                />
                <Text style={[
                  styles.requirementText,
                  passwordValidation.requirements.hasLowerCase ? styles.requirementMet : styles.requirementNotMet
                ]}>
                  Une minuscule
                </Text>
              </View>
              <View style={styles.requirementItem}>
                <Ionicons
                  name={passwordValidation.requirements.hasNumbers ? "checkmark-circle" : "close-circle"}
                  size={16}
                  color={passwordValidation.requirements.hasNumbers ? "#38A169" : "#E53E3E"}
                />
                <Text style={[
                  styles.requirementText,
                  passwordValidation.requirements.hasNumbers ? styles.requirementMet : styles.requirementNotMet
                ]}>
                  Un chiffre
                </Text>
              </View>
              <View style={styles.requirementItem}>
                <Ionicons
                  name={passwordValidation.requirements.hasSpecialChar ? "checkmark-circle" : "close-circle"}
                  size={16}
                  color={passwordValidation.requirements.hasSpecialChar ? "#38A169" : "#E53E3E"}
                />
                <Text style={[
                  styles.requirementText,
                  passwordValidation.requirements.hasSpecialChar ? styles.requirementMet : styles.requirementNotMet
                ]}>
                  Un caractère spécial
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.changeButton,
                (!passwordValidation.isValid || newPassword !== confirmPassword || isLoading) && styles.changeButtonDisabled
              ]}
              onPress={handleChangePassword}
              disabled={!passwordValidation.isValid || newPassword !== confirmPassword || isLoading}
            >
              <Text style={styles.changeButtonText}>
                {isLoading ? 'Modification...' : 'Modifier le mot de passe'}
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
    backgroundColor: '#F7FAFC',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#EBF8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  form: {
    width: '100%',
    maxWidth: 400,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#2D3748',
  },
  eyeButton: {
    padding: 4,
  },
  requirementsContainer: {
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 30,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 12,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 14,
    marginLeft: 8,
  },
  requirementMet: {
    color: '#38A169',
  },
  requirementNotMet: {
    color: '#E53E3E',
  },
  changeButton: {
    backgroundColor: '#3182CE',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 30,
  },
  changeButtonDisabled: {
    backgroundColor: '#A0AEC0',
  },
  changeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
