import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
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
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { clearError, registerMedecin, registerPatient, sendOTP, verifyOTP } from '../../store/slices/authSlice';

export default function RegisterScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.auth);

  const [step, setStep] = useState(1); // 1: Téléphone, 2: OTP, 3: Informations
  const [userType, setUserType] = useState<'PATIENT' | 'MEDECIN'>('PATIENT');
  const [telephone, setTelephone] = useState('');
  const [otp, setOtp] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nom: '',
    prenom: '',
    dateNaissance: '',
    sexe: 'M' as 'M' | 'F',
  });

  const handleSendOTP = async () => {
    if (!telephone) {
      Alert.alert('Erreur', 'Veuillez entrer votre numéro de téléphone');
      return;
    }

    dispatch(sendOTP(telephone));
  };

  const handleVerifyOTP = async () => {
    if (!otp) {
      Alert.alert('Erreur', 'Veuillez entrer le code OTP');
      return;
    }

    dispatch(verifyOTP({ telephone, code: otp }));
  };

  const handleRegister = async () => {
    if (!formData.email || !formData.password || !formData.nom || !formData.prenom) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    const userData = {
      ...formData,
      telephone,
    };

    if (userType === 'PATIENT') {
      dispatch(registerPatient(userData));
    } else {
      dispatch(registerMedecin(userData));
    }
  };

  const navigateToLogin = () => {
    navigation.navigate('Login' as never);
  };

  // Afficher les erreurs
  React.useEffect(() => {
    if (error) {
      Alert.alert('Erreur', error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // Passer à l'étape suivante après l'envoi de l'OTP
  React.useEffect(() => {
    if (step === 1 && !loading && !error) {
      setStep(2);
    }
  }, [loading, error, step]);

  // Passer à l'étape suivante après la vérification de l'OTP
  React.useEffect(() => {
    if (step === 2 && !loading && !error) {
      setStep(3);
    }
  }, [loading, error, step]);

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Type de compte</Text>
      <View style={styles.userTypeContainer}>
        <TouchableOpacity
          style={[styles.userTypeButton, userType === 'PATIENT' && styles.userTypeButtonActive]}
          onPress={() => setUserType('PATIENT')}
        >
          <Ionicons name="person" size={30} color={userType === 'PATIENT' ? '#3498db' : '#7f8c8d'} />
          <Text style={[styles.userTypeText, userType === 'PATIENT' && styles.userTypeTextActive]}>
            Patient
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.userTypeButton, userType === 'MEDECIN' && styles.userTypeButtonActive]}
          onPress={() => setUserType('MEDECIN')}
        >
          <Ionicons name="medical" size={30} color={userType === 'MEDECIN' ? '#3498db' : '#7f8c8d'} />
          <Text style={[styles.userTypeText, userType === 'MEDECIN' && styles.userTypeTextActive]}>
            Médecin
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <Ionicons name="call-outline" size={20} color="#7f8c8d" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Numéro de téléphone"
          value={telephone}
          onChangeText={setTelephone}
          keyboardType="phone-pad"
        />
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSendOTP}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Envoi...' : 'Envoyer le code OTP'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Vérification OTP</Text>
      <Text style={styles.stepDescription}>
        Entrez le code de vérification envoyé au {telephone}
      </Text>

      <View style={styles.inputContainer}>
        <Ionicons name="key-outline" size={20} color="#7f8c8d" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Code OTP"
          value={otp}
          onChangeText={setOtp}
          keyboardType="number-pad"
          maxLength={6}
        />
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleVerifyOTP}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Vérification...' : 'Vérifier le code'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.resendButton}
        onPress={handleSendOTP}
      >
        <Text style={styles.resendText}>Renvoyer le code</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Informations personnelles</Text>

      <View style={styles.inputContainer}>
        <Ionicons name="mail-outline" size={20} color="#7f8c8d" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={formData.email}
          onChangeText={(text) => setFormData({ ...formData, email: text })}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputContainer}>
        <Ionicons name="lock-closed-outline" size={20} color="#7f8c8d" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          value={formData.password}
          onChangeText={(text) => setFormData({ ...formData, password: text })}
          secureTextEntry
        />
      </View>

      <View style={styles.inputContainer}>
        <Ionicons name="lock-closed-outline" size={20} color="#7f8c8d" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Confirmer le mot de passe"
          value={formData.confirmPassword}
          onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
          secureTextEntry
        />
      </View>

      <View style={styles.inputContainer}>
        <Ionicons name="person-outline" size={20} color="#7f8c8d" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Nom"
          value={formData.nom}
          onChangeText={(text) => setFormData({ ...formData, nom: text })}
        />
      </View>

      <View style={styles.inputContainer}>
        <Ionicons name="person-outline" size={20} color="#7f8c8d" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Prénom"
          value={formData.prenom}
          onChangeText={(text) => setFormData({ ...formData, prenom: text })}
        />
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleRegister}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Création...' : 'Créer le compte'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Ionicons name="medical" size={60} color="#3498db" />
          <Text style={styles.title}>Créer un compte</Text>
          <Text style={styles.subtitle}>Étape {step} sur 3</Text>
        </View>

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Vous avez déjà un compte ?</Text>
          <TouchableOpacity onPress={navigateToLogin}>
            <Text style={styles.loginText}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 15,
  },
  subtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 5,
  },
  stepContainer: {
    marginBottom: 30,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  stepDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 20,
    textAlign: 'center',
  },
  userTypeContainer: {
    flexDirection: 'row',
    marginBottom: 30,
    gap: 15,
  },
  userTypeButton: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e1e8ed',
    backgroundColor: 'white',
  },
  userTypeButtonActive: {
    borderColor: '#3498db',
    backgroundColor: '#f8f9fa',
  },
  userTypeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#7f8c8d',
    marginTop: 10,
  },
  userTypeTextActive: {
    color: '#3498db',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 15,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: '#2c3e50',
  },
  button: {
    backgroundColor: '#3498db',
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 10,
    shadowColor: '#3498db',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  resendButton: {
    alignItems: 'center',
    marginTop: 15,
  },
  resendText: {
    color: '#3498db',
    fontSize: 14,
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    color: '#7f8c8d',
    fontSize: 14,
  },
  loginText: {
    color: '#3498db',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 5,
  },
});
