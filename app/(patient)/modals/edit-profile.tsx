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
import { apiService, User } from '../../../services/api';

export default function EditProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  
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
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await apiService.getProfile();
      const userData = response.data;
      
      setUser(userData);
      setFormData({
        nom: userData.nom || '',
        prenom: userData.prenom || '',
        telephone: userData.telephone || '',
        datenaissance: userData.patient?.datenaissance ? userData.patient.datenaissance.substring(0, 10) : '',
        genre: (userData.patient?.genre as any) || '',
        adresse: userData.patient?.adresse || '',
        groupesanguin: userData.patient?.groupesanguin || '',
        poids: userData.patient?.poids?.toString() || '',
        taille: userData.patient?.taille?.toString() || '',
      });
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
      Alert.alert('Erreur', 'Impossible de charger le profil');
    } finally {
      setLoading(false);
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

      // Séparer la mise à jour utilisateur (nom, prénom, téléphone) et patient (adresse, groupe, poids, taille)
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
      
      Alert.alert('Succès', 'Profil mis à jour avec succès', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour le profil');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Annuler',
      'Voulez-vous vraiment annuler les modifications ?',
      [
        { text: 'Continuer l\'édition', style: 'cancel' },
        { text: 'Annuler', style: 'destructive', onPress: () => router.back() }
      ]
    );
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
        {/* En-tête */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.cancelButton}>
            <Ionicons name="close" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Modifier le profil</Text>
          <TouchableOpacity 
            onPress={handleSave} 
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.saveButtonText}>Enregistrer</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Formulaire */}
        <View style={styles.form}>
          {/* Informations personnelles */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations personnelles</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nom *</Text>
              <TextInput
                style={styles.input}
                value={formData.nom}
                onChangeText={(text) => setFormData({ ...formData, nom: text })}
                placeholder="Votre nom"
                placeholderTextColor="#8E8E93"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Prénom *</Text>
              <TextInput
                style={styles.input}
                value={formData.prenom}
                onChangeText={(text) => setFormData({ ...formData, prenom: text })}
                placeholder="Votre prénom"
                placeholderTextColor="#8E8E93"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Téléphone *</Text>
              <TextInput
                style={styles.input}
                value={formData.telephone}
                onChangeText={(text) => setFormData({ ...formData, telephone: text })}
                placeholder="Votre numéro de téléphone"
                placeholderTextColor="#8E8E93"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Date de naissance (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.datenaissance}
                  onChangeText={(text) => setFormData({ ...formData, datenaissance: text })}
                  placeholder="1990-01-15"
                  placeholderTextColor="#8E8E93"
                />
              </View>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Genre (M/F)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.genre}
                  onChangeText={(text) => setFormData({ ...formData, genre: text.toUpperCase() })}
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
            <Text style={styles.sectionTitle}>Informations médicales</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Adresse</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.adresse}
                onChangeText={(text) => setFormData({ ...formData, adresse: text })}
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
                onChangeText={(text) => setFormData({ ...formData, groupesanguin: text })}
                placeholder="Ex: O+, A-, B+, AB-"
                placeholderTextColor="#8E8E93"
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Poids (kg)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.poids}
                  onChangeText={(text) => setFormData({ ...formData, poids: text })}
                  placeholder="70"
                  placeholderTextColor="#8E8E93"
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Taille (cm)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.taille}
                  onChangeText={(text) => setFormData({ ...formData, taille: text })}
                  placeholder="175"
                  placeholderTextColor="#8E8E93"
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          {/* Note */}
          <View style={styles.noteContainer}>
            <Ionicons name="information-circle-outline" size={20} color="#8E8E93" />
            <Text style={styles.noteText}>
              Les champs marqués d'un * sont obligatoires. Les informations médicales sont optionnelles.
            </Text>
          </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  cancelButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#8E8E93',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  form: {
    padding: 16,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
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
    backgroundColor: 'white',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0F8FF',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  noteText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
});
