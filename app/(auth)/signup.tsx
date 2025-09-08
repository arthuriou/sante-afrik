import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { apiService } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

type UserType = 'PATIENT' | 'MEDECIN';

export default function SignupScreen() {
  const router = useRouter();
  const [userType, setUserType] = useState<UserType>('PATIENT');
  const [loading, setLoading] = useState(false);

  // Champs communs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [telephone, setTelephone] = useState('');

  // Champs spécifiques patient
  const [datenaissance, setDatenaissance] = useState('');
  const [genre, setGenre] = useState<'M' | 'F'>('M');
  const [adresse, setAdresse] = useState('');
  const [groupesanguin, setGroupesanguin] = useState('');
  const [poids, setPoids] = useState('');
  const [taille, setTaille] = useState('');

  // Champs spécifiques médecin
  const [numordre, setNumordre] = useState('');
  const [experience, setExperience] = useState('');
  const [biographie, setBiographie] = useState('');

  const handleSignup = async () => {
    // Validation des champs communs
    if (!email || !password || !nom || !prenom || !telephone) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);
    try {
      if (userType === 'PATIENT') {
        if (!datenaissance || !adresse || !groupesanguin || !poids || !taille) {
          Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
          return;
        }

        await apiService.registerPatient({
          email,
          motdepasse: password,
          nom,
          prenom,
          telephone,
          datenaissance,
          genre,
          adresse,
          groupesanguin,
          poids: parseFloat(poids),
          taille: parseFloat(taille),
        });

        Alert.alert(
          'Inscription réussie',
          'Votre compte a été créé avec succès. Vous allez recevoir un code de vérification par email.',
          [
            {
              text: 'OK',
              onPress: () => router.push({
                pathname: '/(auth)/verify-otp',
                params: { email }
              }),
            },
          ]
        );
      } else {
        if (!numordre || !experience || !biographie) {
          Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
          return;
        }

        await apiService.registerDoctor({
          email,
          motdepasse: password,
          nom,
          prenom,
          telephone,
          numordre,
          experience: parseInt(experience),
          biographie,
        });

        Alert.alert(
          'Inscription réussie',
          'Votre compte médecin a été créé avec succès. Il sera validé par un administrateur.',
          [
            {
              text: 'OK',
              onPress: () => router.push('/(auth)/login'),
            },
          ]
        );
      }
    } catch (error: any) {
      Alert.alert('Erreur d\'inscription', error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderUserTypeSelector = () => (
    <View style={styles.userTypeContainer}>
      <Text style={styles.sectionTitle}>Je suis :</Text>
      <View style={styles.userTypeButtons}>
        <TouchableOpacity
          style={[
            styles.userTypeButton,
            userType === 'PATIENT' && styles.userTypeButtonActive,
          ]}
          onPress={() => setUserType('PATIENT')}
        >
          <Ionicons
            name="person-outline"
            size={24}
            color={userType === 'PATIENT' ? '#007AFF' : '#666'}
          />
          <Text
            style={[
              styles.userTypeButtonText,
              userType === 'PATIENT' && styles.userTypeButtonTextActive,
            ]}
          >
            Patient
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.userTypeButton,
            userType === 'MEDECIN' && styles.userTypeButtonActive,
          ]}
          onPress={() => setUserType('MEDECIN')}
        >
          <Ionicons
            name="medical-outline"
            size={24}
            color={userType === 'MEDECIN' ? '#007AFF' : '#666'}
          />
          <Text
            style={[
              styles.userTypeButtonText,
              userType === 'MEDECIN' && styles.userTypeButtonTextActive,
            ]}
          >
            Médecin
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCommonFields = () => (
    <>
      <Text style={styles.sectionTitle}>Informations personnelles</Text>
      
      <View style={styles.inputContainer}>
        <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Adresse email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.inputContainer}>
        <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.inputContainer, styles.halfInput]}>
          <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Nom"
            value={nom}
            onChangeText={setNom}
            placeholderTextColor="#999"
          />
        </View>

        <View style={[styles.inputContainer, styles.halfInput]}>
          <TextInput
            style={styles.input}
            placeholder="Prénom"
            value={prenom}
            onChangeText={setPrenom}
            placeholderTextColor="#999"
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Numéro de téléphone"
          value={telephone}
          onChangeText={setTelephone}
          keyboardType="phone-pad"
          placeholderTextColor="#999"
        />
      </View>
    </>
  );

  const renderPatientFields = () => (
    <>
      <Text style={styles.sectionTitle}>Informations médicales</Text>
      
      <View style={styles.inputContainer}>
        <Ionicons name="calendar-outline" size={20} color="#666" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Date de naissance (YYYY-MM-DD)"
          value={datenaissance}
          onChangeText={setDatenaissance}
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.genderContainer}>
        <Text style={styles.fieldLabel}>Genre :</Text>
        <View style={styles.genderButtons}>
          <TouchableOpacity
            style={[
              styles.genderButton,
              genre === 'M' && styles.genderButtonActive,
            ]}
            onPress={() => setGenre('M')}
          >
            <Text style={[
              styles.genderButtonText,
              genre === 'M' && styles.genderButtonTextActive,
            ]}>
              Homme
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.genderButton,
              genre === 'F' && styles.genderButtonActive,
            ]}
            onPress={() => setGenre('F')}
          >
            <Text style={[
              styles.genderButtonText,
              genre === 'F' && styles.genderButtonTextActive,
            ]}>
              Femme
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Ionicons name="location-outline" size={20} color="#666" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Adresse complète"
          value={adresse}
          onChangeText={setAdresse}
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.inputContainer}>
        <Ionicons name="water-outline" size={20} color="#666" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Groupe sanguin (ex: O+)"
          value={groupesanguin}
          onChangeText={setGroupesanguin}
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.inputContainer, styles.halfInput]}>
          <Ionicons name="fitness-outline" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Poids (kg)"
            value={poids}
            onChangeText={setPoids}
            keyboardType="numeric"
            placeholderTextColor="#999"
          />
        </View>

        <View style={[styles.inputContainer, styles.halfInput]}>
          <TextInput
            style={styles.input}
            placeholder="Taille (cm)"
            value={taille}
            onChangeText={setTaille}
            keyboardType="numeric"
            placeholderTextColor="#999"
          />
        </View>
      </View>
    </>
  );

  const renderMedecinFields = () => (
    <>
      <Text style={styles.sectionTitle}>Informations professionnelles</Text>
      
      <View style={styles.inputContainer}>
        <Ionicons name="card-outline" size={20} color="#666" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Numéro d'ordre"
          value={numordre}
          onChangeText={setNumordre}
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.inputContainer}>
        <Ionicons name="time-outline" size={20} color="#666" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Années d'expérience"
          value={experience}
          onChangeText={setExperience}
          keyboardType="numeric"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.inputContainer}>
        <Ionicons name="document-text-outline" size={20} color="#666" style={styles.inputIcon} />
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Biographie / Spécialités"
          value={biographie}
          onChangeText={setBiographie}
          multiline
          numberOfLines={4}
          placeholderTextColor="#999"
        />
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#007AFF" />
            </TouchableOpacity>
            <Text style={styles.title}>Créer un compte</Text>
          </View>

          <View style={styles.form}>
            {renderUserTypeSelector()}
            {renderCommonFields()}
            {userType === 'PATIENT' && renderPatientFields()}
            {userType === 'MEDECIN' && renderMedecinFields()}

            <TouchableOpacity
              style={[styles.signupButton, loading && styles.signupButtonDisabled]}
              onPress={handleSignup}
              disabled={loading}
            >
              <Text style={styles.signupButtonText}>
                {loading ? 'Création...' : 'Créer mon compte'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.loginLink}
              onPress={() => router.push('/(auth)/login')}
            >
              <Text style={styles.loginLinkText}>
                Vous avez déjà un compte ? Se connecter
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
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
  userTypeContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  userTypeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  userTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  userTypeButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  userTypeButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  userTypeButtonTextActive: {
    color: '#007AFF',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 16,
    minHeight: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingVertical: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  genderContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
  genderButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  genderButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  genderButtonText: {
    fontSize: 16,
    color: '#666',
  },
  genderButtonTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  signupButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  signupButtonDisabled: {
    opacity: 0.6,
  },
  signupButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loginLink: {
    alignItems: 'center',
    marginTop: 20,
  },
  loginLinkText: {
    color: '#007AFF',
    fontSize: 14,
  },
});