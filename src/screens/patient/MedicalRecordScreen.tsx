import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { apiService } from '../../services/apiService';
import { AppDispatch, RootState } from '../../store';
import { fetchPatientAppointments } from '../../store/slices/appointmentSlice';
import { DocumentMedical, RendezVous } from '../../types';

export default function MedicalRecordScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { appointments, loading } = useSelector((state: RootState) => state.appointments) as any;

  const [medicalRecord, setMedicalRecord] = useState<any>(null);
  const [documents, setDocuments] = useState<DocumentMedical[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (user?.role === 'PATIENT') {
      dispatch(fetchPatientAppointments((user as any).idPatient));
    }
    loadMedicalRecord();
  };

  const loadMedicalRecord = async () => {
    try {
      const response = await apiService.getMedicalRecord();
      setMedicalRecord(response.data);
      if (response.data?.iddossier) {
        loadDocuments(response.data.iddossier);
      }
    } catch (error) {
      console.error('Erreur chargement dossier médical:', error);
    }
  };

  const loadDocuments = async (dossierId: string) => {
    try {
      const response = await apiService.getMedicalDocuments(dossierId);
      setDocuments(response.data);
    } catch (error) {
      console.error('Erreur chargement documents:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const uploadDocument = async () => {
    try {
      setUploading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && medicalRecord?.iddossier) {
        const formData = new FormData();
        formData.append('dossier_id', medicalRecord.iddossier);
        formData.append('nom', result.assets[0].name);
        formData.append('type', 'AUTRE');
        formData.append('file', {
          uri: result.assets[0].uri,
          type: result.assets[0].mimeType,
          name: result.assets[0].name,
        } as any);

        await apiService.uploadDocument(formData);
        Alert.alert('Succès', 'Document uploadé avec succès');
        loadDocuments(medicalRecord.iddossier);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'uploader le document');
    } finally {
      setUploading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'TERMINE':
        return '#27ae60';
      case 'EN_COURS':
        return '#f39c12';
      case 'CONFIRME':
        return '#3498db';
      case 'ANNULE':
        return '#e74c3c';
      default:
        return '#7f8c8d';
    }
  };

  const getStatusText = (statut: string) => {
    switch (statut) {
      case 'TERMINE':
        return 'Terminé';
      case 'EN_COURS':
        return 'En cours';
      case 'CONFIRME':
        return 'Confirmé';
      case 'ANNULE':
        return 'Annulé';
      default:
        return statut;
    }
  };

  const renderAppointmentHistory = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Historique des consultations</Text>
      
      {appointments.length > 0 ? (
        appointments
          .filter((apt: any) => apt.statut === 'TERMINE')
          .slice(0, 5)
          .map((appointment: RendezVous) => (
            <View key={appointment.idRendezVous} style={styles.appointmentItem}>
              <View style={styles.appointmentHeader}>
                <Text style={styles.doctorName}>
                  Dr. {appointment.medecin.prenom} {appointment.medecin.nom}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.statut) }]}>
                  <Text style={styles.statusText}>
                    {getStatusText(appointment.statut)}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.specialty}>{appointment.medecin.specialite?.nom}</Text>
              <Text style={styles.appointmentDate}>
                {formatDate(appointment.dateHeure)}
              </Text>
              
              {appointment.notesConsultation && (
                <Text style={styles.notes} numberOfLines={2}>
                  {appointment.notesConsultation}
                </Text>
              )}
            </View>
          ))
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={48} color="#bdc3c7" />
          <Text style={styles.emptyStateText}>Aucune consultation terminée</Text>
        </View>
      )}
    </View>
  );

  const renderDocuments = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Documents médicaux</Text>
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={uploadDocument}
          disabled={uploading || !medicalRecord?.iddossier}
        >
          <Ionicons name="add" size={20} color="#3498db" />
          <Text style={styles.uploadButtonText}>
            {uploading ? 'Upload...' : 'Ajouter'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {documents.length > 0 ? (
        documents.map((doc, index) => (
          <TouchableOpacity key={index} style={styles.documentItem}>
            <Ionicons name="document" size={24} color="#3498db" />
            <View style={styles.documentInfo}>
              <Text style={styles.documentName}>{doc.nom}</Text>
              <Text style={styles.documentDate}>
                Ajouté le {formatDate(doc.dateUpload)}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#bdc3c7" />
          </TouchableOpacity>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="document-outline" size={48} color="#bdc3c7" />
          <Text style={styles.emptyStateText}>Aucun document</Text>
        </View>
      )}
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Personal Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informations personnelles</Text>
        
        <View style={styles.infoItem}>
          <Ionicons name="person" size={20} color="#7f8c8d" />
          <Text style={styles.infoText}>
            {user?.prenom} {user?.nom}
          </Text>
        </View>
        
        <View style={styles.infoItem}>
          <Ionicons name="mail" size={20} color="#7f8c8d" />
          <Text style={styles.infoText}>{user?.email}</Text>
        </View>
        
        {user?.telephone && (
          <View style={styles.infoItem}>
            <Ionicons name="call" size={20} color="#7f8c8d" />
            <Text style={styles.infoText}>{user.telephone}</Text>
          </View>
        )}
      </View>

      {/* Appointment History */}
      {renderAppointmentHistory()}

      {/* Documents */}
      {renderDocuments()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  section: {
    backgroundColor: 'white',
    marginTop: 10,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#2c3e50',
    marginLeft: 10,
  },
  appointmentItem: {
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  specialty: {
    fontSize: 14,
    color: '#3498db',
    marginBottom: 5,
  },
  appointmentDate: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  notes: {
    fontSize: 14,
    color: '#2c3e50',
    fontStyle: 'italic',
    marginTop: 5,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0f8ff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#3498db',
  },
  uploadButtonText: {
    fontSize: 12,
    color: '#3498db',
    marginLeft: 4,
    fontWeight: '500',
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  documentInfo: {
    flex: 1,
    marginLeft: 10,
  },
  documentName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2c3e50',
    marginBottom: 2,
  },
  documentDate: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  emptyState: {
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 10,
    textAlign: 'center',
  },
});
