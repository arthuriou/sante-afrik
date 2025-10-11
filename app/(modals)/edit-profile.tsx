import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { apiService, User } from '../../services/api';

export default function EditProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);
  
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    datenaissance: '',
    genre: '',
    adresse: '',
    groupesanguin: '',
    poids: '',
    taille: '',
  });

  useEffect(() => {
    loadProfile();
    
    return () => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
    };
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await apiService.getProfile();
      const userData = response.data;
      
      setFormData({
        nom: userData.nom || '',
        prenom: userData.prenom || '',
        telephone: userData.telephone || '',
        datenaissance: userData.patient?.datenaissance ? userData.patient.datenaissance.substring(0, 10) : '',
        genre: userData.patient?.genre || '',
        adresse: userData.patient?.adresse || '',
        groupesanguin: userData.patient?.groupesanguin || '',
        poids: userData.patient?.poids ? userData.patient.poids.toString() : '',
        taille: userData.patient?.taille ? userData.patient.taille.toString() : '',
      });
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
      Alert.alert('Erreur', 'Impossible de charger le profil');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handleAutoSave = async () => {
    if (!hasUnsavedChanges) return;
    
    try {
      // Validation des données numériques
      const poids = formData.poids ? parseFloat(formData.poids) : undefined;
      const taille = formData.taille ? parseFloat(formData.taille) : undefined;
      
      if (poids && (poids < 20 || poids > 300)) return;
      if (taille && (taille < 100 || taille > 250)) return;

      // Séparer la mise à jour utilisateur et patient
      const userUpdate: any = {};
      if (formData.nom.trim()) userUpdate.nom = formData.nom.trim();
      if (formData.prenom.trim()) userUpdate.prenom = formData.prenom.trim();
      if (formData.telephone.trim()) userUpdate.telephone = formData.telephone.trim();

      const patientUpdate: any = {};
      if (formData.datenaissance) patientUpdate.datenaissance = formData.datenaissance;
      if (formData.genre) patientUpdate.genre = formData.genre;
      if (formData.adresse.trim()) patientUpdate.adresse = formData.adresse.trim();
      if (formData.groupesanguin) patientUpdate.groupesanguin = formData.groupesanguin;
      if (poids) patientUpdate.poids = poids;
      if (taille) patientUpdate.taille = taille;

      // Mise à jour utilisateur
      if (Object.keys(userUpdate).length > 0) {
        await apiService.updateUserProfile(userUpdate);
      }

      // Mise à jour patient
      if (Object.keys(patientUpdate).length > 0) {
        await apiService.updateProfile(patientUpdate);
      }

      setHasUnsavedChanges(false);
      setLastSaved(new Date());
      console.log('✅ Sauvegarde automatique réussie');
    } catch (error) {
      console.error('❌ Erreur sauvegarde automatique:', error);
      throw error; // Re-throw pour que handleQuit puisse gérer l'erreur
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Validation des données numériques
      const poids = formData.poids ? parseFloat(formData.poids) : undefined;
      const taille = formData.taille ? parseFloat(formData.taille) : undefined;
      
      if (poids && (poids < 20 || poids > 300)) {
        Alert.alert('Erreur', 'Le poids doit être entre 20 et 300 kg');
        return;
      }
      
      if (taille && (taille < 100 || taille > 250)) {
        Alert.alert('Erreur', 'La taille doit être entre 100 et 250 cm');
        return;
      }

      // Séparer la mise à jour utilisateur et patient
      const userUpdate: any = {};
      if (formData.nom.trim()) userUpdate.nom = formData.nom.trim();
      if (formData.prenom.trim()) userUpdate.prenom = formData.prenom.trim();
      if (formData.telephone.trim()) userUpdate.telephone = formData.telephone.trim();

      const patientUpdate: any = {};
      if (formData.datenaissance.trim()) patientUpdate.datenaissance = formData.datenaissance.trim();
      if (formData.genre.trim()) patientUpdate.genre = formData.genre.trim() as 'M' | 'F';
      if (formData.adresse.trim()) patientUpdate.adresse = formData.adresse.trim();
      if (formData.groupesanguin.trim()) patientUpdate.groupesanguin = formData.groupesanguin.trim();
      if (poids !== undefined) patientUpdate.poids = poids;
      if (taille !== undefined) patientUpdate.taille = taille;

      if (Object.keys(userUpdate).length > 0) {
        await apiService.updateUserProfile(userUpdate);
      }
      if (Object.keys(patientUpdate).length > 0) {
        await apiService.updateProfile(patientUpdate);
      }
      
      setHasUnsavedChanges(false);
      setLastSaved(new Date());
      Alert.alert('Succès', 'Profil mis à jour avec succès');
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour le profil');
    } finally {
      setSaving(false);
    }
  };

  const handleQuit = async () => {
    if (hasUnsavedChanges) {
      try {
        await handleAutoSave();
        Alert.alert('Succès', 'Modifications sauvegardées automatiquement');
      } catch (error) {
        Alert.alert('Erreur', 'Impossible de sauvegarder les modifications');
        return;
      }
    }
    router.back();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement du profil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* Informations personnelles */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person" size={20} color="#007AFF" />
            <Text style={styles.sectionTitle}>Informations personnelles</Text>
          </View>
          
          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nom *</Text>
              <TextInput
                style={styles.input}
                value={formData.nom}
                onChangeText={(text) => updateFormData('nom', text)}
                placeholder="Votre nom"
                placeholderTextColor="#8E8E93"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Prénom *</Text>
              <TextInput
                style={styles.input}
                value={formData.prenom}
                onChangeText={(text) => updateFormData('prenom', text)}
                placeholder="Votre prénom"
                placeholderTextColor="#8E8E93"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Téléphone *</Text>
            <TextInput
              style={styles.input}
              value={formData.telephone}
              onChangeText={(text) => updateFormData('telephone', text)}
              placeholder="Votre numéro de téléphone"
              placeholderTextColor="#8E8E93"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date de naissance</Text>
              <TextInput
                style={styles.input}
                value={formData.datenaissance}
                onChangeText={(text) => updateFormData('datenaissance', text)}
                placeholder="1990-01-15"
                placeholderTextColor="#8E8E93"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Genre</Text>
              <TextInput
                style={styles.input}
                value={formData.genre}
                onChangeText={(text) => updateFormData('genre', text.toUpperCase())}
                placeholder="M ou F"
                placeholderTextColor="#8E8E93"
                autoCapitalize="characters"
                maxLength={1}
              />
            </View>
          </View>
        </View>

        {/* Informations médicales */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="medical" size={20} color="#34C759" />
            <Text style={styles.sectionTitle}>Informations médicales</Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Adresse</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.adresse}
              onChangeText={(text) => updateFormData('adresse', text)}
              placeholder="Votre adresse complète"
              placeholderTextColor="#8E8E93"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Groupe sanguin</Text>
            <TextInput
              style={styles.input}
              value={formData.groupesanguin}
              onChangeText={(text) => updateFormData('groupesanguin', text)}
              placeholder="Ex: O+, A-, B+, AB-"
              placeholderTextColor="#8E8E93"
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Poids (kg)</Text>
              <TextInput
                style={styles.input}
                value={formData.poids}
                onChangeText={(text) => updateFormData('poids', text)}
                placeholder="70"
                placeholderTextColor="#8E8E93"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Taille (cm)</Text>
              <TextInput
                style={styles.input}
                value={formData.taille}
                onChangeText={(text) => updateFormData('taille', text)}
                placeholder="175"
                placeholderTextColor="#8E8E93"
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Indicateur de sauvegarde automatique */}
        <View style={styles.autoSaveInfo}>
          <Ionicons name="cloud-done" size={16} color="#34C759" />
          <Text style={styles.autoSaveText}>
            Sauvegarde automatique activée - Vos modifications sont sauvegardées automatiquement
          </Text>
        </View>

        {/* Bouton de sauvegarde manuelle */}
        <View style={styles.saveButtonContainer}>
          <TouchableOpacity 
            onPress={handleSave} 
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.saveButtonText}>Sauvegarder</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginLeft: 8,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputGroup: {
    marginBottom: 16,
    flex: 1,
    marginRight: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  autoSaveInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 8,
  },
  autoSaveText: {
    fontSize: 14,
    color: '#34C759',
    marginLeft: 8,
    flex: 1,
  },
  saveButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    marginTop: 8,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#8E8E93',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
