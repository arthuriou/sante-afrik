import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { apiService, Specialite } from '../../../services/api';

export default function DoctorRegisterScreen() {
  const [formData, setFormData] = useState({
    email: '',
    motdepasse: '',
    nom: '',
    prenom: '',
    telephone: '',
    numordre: '',
    experience: '',
    biographie: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [specialites, setSpecialites] = useState<Specialite[]>([]);
  const [selectedSpecialites, setSelectedSpecialites] = useState<string[]>([]);
  const [showSpecialitesModal, setShowSpecialitesModal] = useState(false);
  const [loadingSpecialites, setLoadingSpecialites] = useState(false);

  // Charger les spécialités au montage du composant
  useEffect(() => {
    loadSpecialites();
  }, []);

  const loadSpecialites = async () => {
    try {
      setLoadingSpecialites(true);
      console.log('Chargement des spécialités depuis l\'API publique...');
      
      // Utiliser l'endpoint public qui ne nécessite pas d'authentification
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/specialites/specialites`);
      const data = await response.json();
      
      console.log('Réponse spécialités:', data);
      
      if (data.data && Array.isArray(data.data)) {
        setSpecialites(data.data);
      } else {
        console.error('Format de réponse inattendu:', data);
        Alert.alert('Erreur', 'Format de réponse inattendu de l\'API');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des spécialités:', error);
      Alert.alert('Erreur', 'Impossible de charger les spécialités. Veuillez réessayer.');
    } finally {
      setLoadingSpecialites(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleSpecialite = (specialiteId: string) => {
    setSelectedSpecialites(prev => 
      prev.includes(specialiteId) 
        ? [] // Désélectionner si déjà sélectionnée
        : [specialiteId] // Sélectionner seulement cette spécialité
    );
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir votre adresse email');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      Alert.alert('Erreur', 'Veuillez saisir une adresse email valide');
      return false;
    }
    if (!formData.motdepasse.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir un mot de passe');
      return false;
    }
    if (formData.motdepasse.length < 8) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 8 caractères');
      return false;
    }
    if (!formData.nom.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir votre nom');
      return false;
    }
    if (!formData.prenom.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir votre prénom');
      return false;
    }
    if (!formData.telephone.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir votre numéro de téléphone');
      return false;
    }
    if (!formData.numordre.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir votre numéro d\'ordre');
      return false;
    }
    if (!formData.experience.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir votre nombre d\'années d\'expérience');
      return false;
    }
    if (isNaN(Number(formData.experience)) || Number(formData.experience) < 0) {
      Alert.alert('Erreur', 'L\'expérience doit être un nombre valide');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      await apiService.registerDoctor({
          email: formData.email.trim(),
          motdepasse: formData.motdepasse,
          nom: formData.nom.trim(),
          prenom: formData.prenom.trim(),
          telephone: formData.telephone.trim(),
          numordre: formData.numordre.trim(),
          experience: Number(formData.experience),
          biographie: formData.biographie.trim(),
        specialiteIds: selectedSpecialites, // Envoyer les noms des spécialités
      });

         Alert.alert(
           'Inscription réussie',
        'Votre compte médecin a été créé avec succès. Votre compte est en attente de validation par un administrateur. Vous recevrez un email de confirmation une fois votre compte validé.',
           [
             {
               text: 'OK',
               onPress: () => router.push('/(auth)/medecin/login'),
             },
           ]
         );
    } catch (error: any) {
      Alert.alert('Erreur d\'inscription', error.message || 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
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
            <Ionicons name="medical" size={64} color="#34C759" />
          </View>

          <Text style={styles.title}>Inscription Médecin</Text>
          <Text style={styles.subtitle}>
            Créez votre compte médecin pour accéder à la plateforme
          </Text>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons name="mail" size={20} color="#718096" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Adresse email"
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed" size={20} color="#718096" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Mot de passe"
                value={formData.motdepasse}
                onChangeText={(value) => handleInputChange('motdepasse', value)}
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

            <View style={styles.row}>
              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Ionicons name="person" size={20} color="#718096" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Nom"
                  value={formData.nom}
                  onChangeText={(value) => handleInputChange('nom', value)}
                  autoCapitalize="words"
                  editable={!isLoading}
                />
              </View>

              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Ionicons name="person" size={20} color="#718096" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Prénom"
                  value={formData.prenom}
                  onChangeText={(value) => handleInputChange('prenom', value)}
                  autoCapitalize="words"
                  editable={!isLoading}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="call" size={20} color="#718096" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Numéro de téléphone"
                value={formData.telephone}
                onChangeText={(value) => handleInputChange('telephone', value)}
                keyboardType="phone-pad"
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="card" size={20} color="#718096" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Numéro d'ordre"
                value={formData.numordre}
                onChangeText={(value) => handleInputChange('numordre', value)}
                autoCapitalize="characters"
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="time" size={20} color="#718096" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Années d'expérience"
                value={formData.experience}
                onChangeText={(value) => handleInputChange('experience', value)}
                keyboardType="numeric"
                editable={!isLoading}
              />
            </View>

            <View style={styles.textAreaContainer}>
              <Ionicons name="document-text" size={20} color="#718096" style={styles.textAreaIcon} />
              <TextInput
                style={styles.textArea}
                placeholder="Biographie (optionnel)"
                value={formData.biographie}
                onChangeText={(value) => handleInputChange('biographie', value)}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={!isLoading}
              />
            </View>

            <TouchableOpacity
              style={styles.specialitesButton}
              onPress={() => {
                if (specialites.length === 0 && !loadingSpecialites) {
                  loadSpecialites();
                }
                setShowSpecialitesModal(true);
              }}
              disabled={isLoading || loadingSpecialites}
            >
              <Ionicons name="medical" size={20} color="#718096" style={styles.specialitesIcon} />
              <View style={styles.specialitesContent}>
                <Text style={styles.specialitesLabel}>
                  Spécialités {selectedSpecialites.length > 0 && `(${selectedSpecialites.length})`}
                </Text>
                <Text style={styles.specialitesSubtext}>
                  {loadingSpecialites 
                    ? 'Chargement des spécialités...'
                    : selectedSpecialites.length === 0 
                      ? 'Sélectionnez votre spécialité (optionnel)' 
                      : specialites.find(s => s.idspecialite === selectedSpecialites[0])?.nom || selectedSpecialites[0]
                  }
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#718096" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              <Text style={styles.registerButtonText}>
                {isLoading ? 'Inscription...' : 'S\'inscrire'}
              </Text>
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>
                Vous avez déjà un compte ?
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/(auth)/medecin/login')}
                disabled={isLoading}
              >
                <Text style={styles.loginLink}>Se connecter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Modal de sélection des spécialités */}
      {showSpecialitesModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sélectionner votre spécialité</Text>
              <TouchableOpacity
                onPress={() => setShowSpecialitesModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#718096" />
              </TouchableOpacity>
            </View>

            {loadingSpecialites ? (
              <View style={styles.loadingContainer}>
                <Ionicons name="refresh" size={32} color="#718096" />
                <Text style={styles.loadingText}>Chargement des spécialités...</Text>
              </View>
            ) : specialites.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="medical-outline" size={32} color="#718096" />
                <Text style={styles.emptyText}>Aucune spécialité disponible</Text>
                <TouchableOpacity 
                  style={styles.retryButton}
                  onPress={loadSpecialites}
                >
                  <Text style={styles.retryButtonText}>Réessayer</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={specialites}
                keyExtractor={(item) => item.idspecialite}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.specialiteItem,
                      selectedSpecialites.includes(item.idspecialite) && styles.specialiteItemSelected
                    ]}
                    onPress={() => toggleSpecialite(item.idspecialite)}
                  >
                    <View style={styles.specialiteItemContent}>
                      <Text style={[
                        styles.specialiteItemName,
                        selectedSpecialites.includes(item.idspecialite) && styles.specialiteItemNameSelected
                      ]}>
                        {item.nom}
                      </Text>
                      {item.description && (
                        <Text style={styles.specialiteItemDescription}>
                          {item.description}
                        </Text>
                      )}
                    </View>
                    {selectedSpecialites.includes(item.idspecialite) && (
                      <Ionicons name="checkmark-circle" size={24} color="#34C759" />
                    )}
                  </TouchableOpacity>
                )}
                style={styles.specialitesList}
              />
            )}

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={() => setShowSpecialitesModal(false)}
              >
                <Text style={styles.modalConfirmButtonText}>Confirmer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
    paddingBottom: 96,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 36,
    paddingBottom: 12,
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
    backgroundColor: '#DCFCE7',
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
    marginBottom: 28,
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  textAreaContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 100,
  },
  textAreaIcon: {
    marginRight: 12,
    marginTop: 4,
  },
  textArea: {
    flex: 1,
    fontSize: 16,
    color: '#2D3748',
    minHeight: 80,
  },
  registerButton: {
    backgroundColor: '#34C759',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 30,
  },
  registerButtonDisabled: {
    backgroundColor: '#A0AEC0',
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  loginContainer: {
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 8,
  },
  loginLink: {
    fontSize: 16,
    color: '#34C759',
    fontWeight: '600',
  },
  // Styles pour la sélection des spécialités
  specialitesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  specialitesIcon: {
    marginRight: 12,
  },
  specialitesContent: {
    flex: 1,
  },
  specialitesLabel: {
    fontSize: 16,
    color: '#2D3748',
    fontWeight: '500',
    marginBottom: 2,
  },
  specialitesSubtext: {
    fontSize: 14,
    color: '#718096',
  },
  // Styles pour la modal
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3748',
  },
  modalCloseButton: {
    padding: 4,
  },
  specialitesList: {
    maxHeight: 400,
  },
  specialiteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  specialiteItemSelected: {
    backgroundColor: '#F0FDF4',
  },
  specialiteItemContent: {
    flex: 1,
  },
  specialiteItemName: {
    fontSize: 16,
    color: '#2D3748',
    fontWeight: '500',
    marginBottom: 2,
  },
  specialiteItemNameSelected: {
    color: '#16A34A',
  },
  specialiteItemDescription: {
    fontSize: 14,
    color: '#718096',
    lineHeight: 20,
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  modalConfirmButton: {
    backgroundColor: '#34C759',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalConfirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Styles pour les états de chargement et vide
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#718096',
    marginTop: 12,
    fontFamily: 'System',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#718096',
    marginTop: 12,
    marginBottom: 20,
    fontFamily: 'System',
  },
  retryButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
  },
});
