import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService, User } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

export default function BookAppointmentScreen() {
  const router = useRouter();
  const { medecinId, creneauId, dateTime } = useLocalSearchParams<{
    medecinId: string;
    creneauId: string;
    dateTime: string;
  }>();

  const [user, setUser] = useState<User | null>(null);
  const [motif, setMotif] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedMotif, setSelectedMotif] = useState('');

  const motifsCommuns = [
    'Consultation de routine',
    'Contrôle médical',
    'Douleur thoracique',
    'Problème cardiaque',
    'Suivi traitement',
    'Certificat médical',
    'Autre',
  ];

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Erreur chargement utilisateur:', error);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      time: date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  };

  const handleMotifSelection = (motifSelected: string) => {
    setSelectedMotif(motifSelected);
    if (motifSelected === 'Autre') {
      setMotif('');
    } else {
      setMotif(motifSelected);
    }
  };

  const validateForm = () => {
    if (!motif.trim()) {
      Alert.alert('Erreur', 'Veuillez indiquer le motif de la consultation');
      return false;
    }
    return true;
  };

  const handleBookAppointment = async () => {
    if (!validateForm()) return;
    if (!user?.patient?.idpatient) {
      Alert.alert('Erreur', 'Informations patient manquantes');
      return;
    }

    setLoading(true);
    try {
      const appointmentData = {
        patient_id: user.patient.idpatient,
        medecin_id: medecinId,
        dateheure: dateTime,
        duree: 30, // durée par défaut en minutes
        motif: motif.trim(),
        creneau_id: creneauId,
      };

      const response = await apiService.createRendezVous(appointmentData);

      Alert.alert(
        'Rendez-vous confirmé !',
        'Votre rendez-vous a été créé avec succès. Vous recevrez une confirmation par email.',
        [
          {
            text: 'Voir mes RDV',
            onPress: () => router.replace('/(patient)/appointments'),
          },
          {
            text: 'OK',
            onPress: () => router.back(),
            style: 'default',
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        'Erreur de réservation',
        error.message || 'Une erreur est survenue lors de la réservation'
      );
    } finally {
      setLoading(false);
    }
  };

  const { date, time } = formatDateTime(dateTime);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Réserver un rendez-vous</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Résumé du rendez-vous */}
          <View style={styles.summarySection}>
            <View style={styles.summaryHeader}>
              <Ionicons name="calendar" size={24} color="#007AFF" />
              <Text style={styles.summaryTitle}>Récapitulatif</Text>
            </View>
            
            <View style={styles.summaryContent}>
              <View style={styles.summaryItem}>
                <Ionicons name="calendar-outline" size={20} color="#666" />
                <Text style={styles.summaryText}>{date}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Ionicons name="time-outline" size={20} color="#666" />
                <Text style={styles.summaryText}>{time}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Ionicons name="hourglass-outline" size={20} color="#666" />
                <Text style={styles.summaryText}>30 minutes</Text>
              </View>
            </View>
          </View>

          {/* Informations patient */}
          <View style={styles.patientSection}>
            <Text style={styles.sectionTitle}>Informations patient</Text>
            <View style={styles.patientInfo}>
              <View style={styles.patientItem}>
                <Text style={styles.patientLabel}>Nom complet :</Text>
                <Text style={styles.patientValue}>
                  {user?.prenom} {user?.nom}
                </Text>
              </View>
              <View style={styles.patientItem}>
                <Text style={styles.patientLabel}>Téléphone :</Text>
                <Text style={styles.patientValue}>{user?.telephone}</Text>
              </View>
              <View style={styles.patientItem}>
                <Text style={styles.patientLabel}>Email :</Text>
                <Text style={styles.patientValue}>{user?.email}</Text>
              </View>
            </View>
          </View>

          {/* Motif de la consultation */}
          <View style={styles.motifSection}>
            <Text style={styles.sectionTitle}>Motif de la consultation</Text>
            
            <Text style={styles.subsectionTitle}>Motifs courants :</Text>
            <View style={styles.motifsGrid}>
              {motifsCommuns.map((motifItem, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.motifChip,
                    selectedMotif === motifItem && styles.motifChipSelected,
                  ]}
                  onPress={() => handleMotifSelection(motifItem)}
                >
                  <Text
                    style={[
                      styles.motifChipText,
                      selectedMotif === motifItem && styles.motifChipTextSelected,
                    ]}
                  >
                    {motifItem}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {(selectedMotif === 'Autre' || !motifsCommuns.includes(selectedMotif)) && (
              <View style={styles.customMotifContainer}>
                <Text style={styles.inputLabel}>Précisez le motif :</Text>
                <TextInput
                  style={styles.motifInput}
                  value={motif}
                  onChangeText={setMotif}
                  placeholder="Décrivez le motif de votre consultation..."
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            )}
          </View>

          {/* Notes supplémentaires */}
          <View style={styles.notesSection}>
            <Text style={styles.sectionTitle}>Notes supplémentaires (optionnel)</Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Ajoutez des informations supplémentaires utiles pour le médecin..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Informations importantes */}
          <View style={styles.infoSection}>
            <View style={styles.infoHeader}>
              <Ionicons name="information-circle" size={20} color="#FF9500" />
              <Text style={styles.infoTitle}>Informations importantes</Text>
            </View>
            <Text style={styles.infoText}>
              • Arrivez 10 minutes avant votre rendez-vous
            </Text>
            <Text style={styles.infoText}>
              • Apportez votre carte d'identité et carnet de santé
            </Text>
            <Text style={styles.infoText}>
              • En cas d'empêchement, annulez au moins 2h avant
            </Text>
            <Text style={styles.infoText}>
              • Vous recevrez un SMS de rappel 24h avant
            </Text>
          </View>
        </ScrollView>

        {/* Bouton de confirmation */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.confirmButton, loading && styles.confirmButtonDisabled]}
            onPress={handleBookAppointment}
            disabled={loading}
          >
            <Text style={styles.confirmButtonText}>
              {loading ? 'Réservation...' : 'Confirmer le rendez-vous'}
            </Text>
          </TouchableOpacity>
        </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  summarySection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 10,
  },
  summaryContent: {
    gap: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 10,
  },
  patientSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  patientInfo: {
    gap: 12,
  },
  patientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  patientLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  patientValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  motifSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  subsectionTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  motifsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  motifChip: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  motifChipSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  motifChipText: {
    fontSize: 14,
    color: '#666',
  },
  motifChipTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  customMotifContainer: {
    marginTop: 10,
  },
  inputLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  motifInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#333',
    minHeight: 80,
  },
  notesSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notesInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#333',
    minHeight: 100,
  },
  infoSection: {
    backgroundColor: '#FFF9E6',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF9500',
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#8B4513',
    marginBottom: 6,
    lineHeight: 20,
  },
  footer: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});