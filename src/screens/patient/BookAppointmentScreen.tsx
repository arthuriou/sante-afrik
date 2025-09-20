import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
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
import { createAppointment } from '../../store/slices/appointmentSlice';
import { Creneau, Medecin } from '../../types';

interface RouteParams {
  doctor: Medecin;
  selectedSlot: Creneau;
}

export default function BookAppointmentScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { loading } = useSelector((state: RootState) => state.appointments);
  
  const { doctor, selectedSlot } = route.params as RouteParams;

  const [appointmentType, setAppointmentType] = useState<'PRESENTIEL' | 'TELECONSULTATION'>('PRESENTIEL');
  const [motif, setMotif] = useState('');
  const [documents, setDocuments] = useState<any[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);

  const handleBookAppointment = async () => {
    if (!motif.trim()) {
      Alert.alert('Erreur', 'Veuillez indiquer le motif de la consultation');
      return;
    }

    const appointmentData = {
      patient_id: (user as any).idPatient,
      medecin_id: doctor.idMedecin,
      creneau_id: selectedSlot.idCreneau,
      dateheure: selectedSlot.debut,
      duree: selectedSlot.duree,
      motif: motif.trim(),
      type_rdv: appointmentType,
      adresse_cabinet: appointmentType === 'PRESENTIEL' ? doctor.cabinet?.adresse : null,
    };

    try {
      const result = await dispatch(createAppointment(appointmentData));
      
      if (result.type.endsWith('fulfilled')) {
        Alert.alert(
          'Succès',
          'Votre rendez-vous a été réservé avec succès',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Erreur', 'Impossible de réserver le rendez-vous');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue lors de la réservation');
    }
  };

  const pickDocument = async () => {
    try {
      setLoadingDocuments(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets) {
        setDocuments(prev => [...prev, ...result.assets]);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sélectionner le document');
    } finally {
      setLoadingDocuments(false);
    }
  };

  const removeDocument = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView}>
        {/* Appointment Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Résumé du rendez-vous</Text>
          
          <View style={styles.summaryRow}>
            <Ionicons name="person" size={20} color="#7f8c8d" />
            <Text style={styles.summaryText}>
              Dr. {doctor.prenom} {doctor.nom}
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Ionicons name="medical" size={20} color="#7f8c8d" />
            <Text style={styles.summaryText}>{doctor.specialite?.nom}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Ionicons name="calendar" size={20} color="#7f8c8d" />
            <Text style={styles.summaryText}>
              {formatDate(selectedSlot.debut)} à {formatTime(selectedSlot.debut)}
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Ionicons name="time" size={20} color="#7f8c8d" />
            <Text style={styles.summaryText}>
              Durée: {selectedSlot.duree} minutes
            </Text>
          </View>
        </View>

        {/* Appointment Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Type de consultation</Text>
          
          <View style={styles.typeContainer}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                appointmentType === 'PRESENTIEL' && styles.typeButtonActive
              ]}
              onPress={() => setAppointmentType('PRESENTIEL')}
            >
              <Ionicons 
                name="location" 
                size={24} 
                color={appointmentType === 'PRESENTIEL' ? '#3498db' : '#7f8c8d'} 
              />
              <Text style={[
                styles.typeText,
                appointmentType === 'PRESENTIEL' && styles.typeTextActive
              ]}>
                Présentiel
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.typeButton,
                appointmentType === 'TELECONSULTATION' && styles.typeButtonActive
              ]}
              onPress={() => setAppointmentType('TELECONSULTATION')}
            >
              <Ionicons 
                name="videocam" 
                size={24} 
                color={appointmentType === 'TELECONSULTATION' ? '#3498db' : '#7f8c8d'} 
              />
              <Text style={[
                styles.typeText,
                appointmentType === 'TELECONSULTATION' && styles.typeTextActive
              ]}>
                Téléconsultation
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Motif */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Motif de la consultation *</Text>
          <TextInput
            style={styles.motifInput}
            placeholder="Décrivez brièvement le motif de votre consultation..."
            value={motif}
            onChangeText={setMotif}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Documents */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Documents (optionnel)</Text>
          
          <TouchableOpacity
            style={styles.addDocumentButton}
            onPress={pickDocument}
            disabled={loadingDocuments}
          >
            <Ionicons name="add" size={20} color="#3498db" />
            <Text style={styles.addDocumentText}>
              {loadingDocuments ? 'Ajout...' : 'Ajouter un document'}
            </Text>
          </TouchableOpacity>
          
          {documents.length > 0 && (
            <View style={styles.documentsList}>
              {documents.map((doc, index) => (
                <View key={index} style={styles.documentItem}>
                  <Ionicons name="document" size={20} color="#7f8c8d" />
                  <Text style={styles.documentName} numberOfLines={1}>
                    {doc.name}
                  </Text>
                  <TouchableOpacity onPress={() => removeDocument(index)}>
                    <Ionicons name="close-circle" size={20} color="#e74c3c" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Book Button */}
        <View style={styles.bookContainer}>
          <TouchableOpacity
            style={[styles.bookButton, loading && styles.bookButtonDisabled]}
            onPress={handleBookAppointment}
            disabled={loading}
          >
            <Text style={styles.bookButtonText}>
              {loading ? 'Réservation...' : 'Confirmer la réservation'}
            </Text>
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
  scrollView: {
    flex: 1,
  },
  summaryCard: {
    backgroundColor: 'white',
    padding: 20,
    margin: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryText: {
    fontSize: 14,
    color: '#2c3e50',
    marginLeft: 10,
  },
  section: {
    backgroundColor: 'white',
    padding: 20,
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  typeButton: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e1e8ed',
    backgroundColor: '#f8f9fa',
  },
  typeButtonActive: {
    borderColor: '#3498db',
    backgroundColor: '#f0f8ff',
  },
  typeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#7f8c8d',
    marginTop: 8,
  },
  typeTextActive: {
    color: '#3498db',
  },
  motifInput: {
    borderWidth: 1,
    borderColor: '#e1e8ed',
    borderRadius: 8,
    padding: 15,
    fontSize: 14,
    color: '#2c3e50',
    backgroundColor: '#f8f9fa',
  },
  addDocumentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderWidth: 1,
    borderColor: '#3498db',
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  addDocumentText: {
    fontSize: 14,
    color: '#3498db',
    marginLeft: 10,
    fontWeight: '500',
  },
  documentsList: {
    marginTop: 15,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  documentName: {
    flex: 1,
    fontSize: 14,
    color: '#2c3e50',
    marginLeft: 10,
  },
  bookContainer: {
    padding: 20,
    backgroundColor: 'white',
    margin: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  bookButton: {
    backgroundColor: '#3498db',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  bookButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  bookButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
