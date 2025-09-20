import { Ionicons } from '@expo/vector-icons';
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
import { AppDispatch, RootState } from '../../store';
import { endConsultation, fetchTodayAppointments, markPatientArrived, startConsultation } from '../../store/slices/appointmentSlice';
import { RendezVous } from '../../types';

export default function RendezVousScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { todayAppointments, loading } = useSelector((state: RootState) => state.appointments);

  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'TODAY' | 'UPCOMING' | 'ALL'>('TODAY');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    dispatch(fetchTodayAppointments());
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleMarkArrived = async (appointmentId: string) => {
    try {
      await dispatch(markPatientArrived(appointmentId));
      Alert.alert('Succès', 'Patient marqué comme arrivé');
      loadData();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de marquer le patient comme arrivé');
    }
  };

  const handleStartConsultation = async (appointmentId: string) => {
    try {
      await dispatch(startConsultation(appointmentId));
      Alert.alert('Succès', 'Consultation démarrée');
      loadData();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de démarrer la consultation');
    }
  };

  const handleEndConsultation = async (appointmentId: string) => {
    try {
      await dispatch(endConsultation(appointmentId));
      Alert.alert('Succès', 'Consultation terminée');
      loadData();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de terminer la consultation');
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'EN_ATTENTE_CONSULTATION':
        return '#f39c12';
      case 'EN_COURS':
        return '#e74c3c';
      case 'CONFIRME':
        return '#3498db';
      case 'TERMINE':
        return '#27ae60';
      case 'ANNULE':
        return '#95a5a6';
      default:
        return '#7f8c8d';
    }
  };

  const getStatusText = (statut: string) => {
    switch (statut) {
      case 'EN_ATTENTE_CONSULTATION':
        return 'En attente';
      case 'EN_COURS':
        return 'En cours';
      case 'CONFIRME':
        return 'Confirmé';
      case 'TERMINE':
        return 'Terminé';
      case 'ANNULE':
        return 'Annulé';
      default:
        return statut;
    }
  };

  const getFilteredAppointments = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (selectedFilter) {
      case 'TODAY':
        return todayAppointments.filter(apt => {
          const aptDate = new Date(apt.dateHeure);
          return aptDate >= today && aptDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
        });
      case 'UPCOMING':
        return todayAppointments.filter(apt => new Date(apt.dateHeure) > now);
      case 'ALL':
        return todayAppointments;
      default:
        return todayAppointments;
    }
  };

  const renderFilterButtons = () => (
    <View style={styles.filterContainer}>
      <TouchableOpacity
        style={[styles.filterButton, selectedFilter === 'TODAY' && styles.filterButtonActive]}
        onPress={() => setSelectedFilter('TODAY')}
      >
        <Text style={[styles.filterText, selectedFilter === 'TODAY' && styles.filterTextActive]}>
          Aujourd'hui
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.filterButton, selectedFilter === 'UPCOMING' && styles.filterButtonActive]}
        onPress={() => setSelectedFilter('UPCOMING')}
      >
        <Text style={[styles.filterText, selectedFilter === 'UPCOMING' && styles.filterTextActive]}>
          À venir
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.filterButton, selectedFilter === 'ALL' && styles.filterButtonActive]}
        onPress={() => setSelectedFilter('ALL')}
      >
        <Text style={[styles.filterText, selectedFilter === 'ALL' && styles.filterTextActive]}>
          Tous
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderAppointmentCard = (appointment: RendezVous) => (
    <View key={appointment.idRendezVous} style={styles.appointmentCard}>
      <View style={styles.appointmentHeader}>
        <View style={styles.appointmentTime}>
          <Text style={styles.timeText}>
            {formatTime(appointment.dateHeure)}
          </Text>
        </View>
        
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.statut) }]}>
          <Text style={styles.statusText}>
            {getStatusText(appointment.statut)}
          </Text>
        </View>
      </View>
      
      <View style={styles.appointmentInfo}>
        <Text style={styles.patientName}>
          {appointment.patient.prenom} {appointment.patient.nom}
        </Text>
        
        <Text style={styles.appointmentType}>
          {appointment.typeRdv === 'PRESENTIEL' ? 'Consultation présentielle' : 'Téléconsultation'}
        </Text>
        
        <Text style={styles.motif} numberOfLines={2}>
          {appointment.motif}
        </Text>
        
        <Text style={styles.appointmentDate}>
          {formatDate(appointment.dateHeure)}
        </Text>
      </View>
      
      <View style={styles.appointmentActions}>
        {appointment.statut === 'CONFIRME' && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleMarkArrived(appointment.idRendezVous)}
          >
            <Ionicons name="checkmark" size={16} color="white" />
            <Text style={styles.actionButtonText}>Arrivé</Text>
          </TouchableOpacity>
        )}
        
        {appointment.statut === 'EN_ATTENTE_CONSULTATION' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={() => handleStartConsultation(appointment.idRendezVous)}
          >
            <Ionicons name="play" size={16} color="white" />
            <Text style={styles.actionButtonText}>Commencer</Text>
          </TouchableOpacity>
        )}
        
        {appointment.statut === 'EN_COURS' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.dangerButton]}
            onPress={() => handleEndConsultation(appointment.idRendezVous)}
          >
            <Ionicons name="stop" size={16} color="white" />
            <Text style={styles.actionButtonText}>Terminer</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const filteredAppointments = getFilteredAppointments();

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Rendez-vous</Text>
        <Text style={styles.headerSubtitle}>
          {filteredAppointments.length} rendez-vous
        </Text>
      </View>

      {/* Filter Buttons */}
      {renderFilterButtons()}

      {/* Appointments List */}
      <View style={styles.appointmentsContainer}>
        {filteredAppointments.length > 0 ? (
          filteredAppointments.map(renderAppointmentCard)
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color="#bdc3c7" />
            <Text style={styles.emptyStateTitle}>Aucun rendez-vous</Text>
            <Text style={styles.emptyStateText}>
              {selectedFilter === 'TODAY' && 'Aucun rendez-vous aujourd\'hui'}
              {selectedFilter === 'UPCOMING' && 'Aucun rendez-vous à venir'}
              {selectedFilter === 'ALL' && 'Aucun rendez-vous trouvé'}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 5,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e1e8ed',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  filterText: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  filterTextActive: {
    color: 'white',
  },
  appointmentsContainer: {
    padding: 15,
  },
  appointmentCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e1e8ed',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  appointmentTime: {
    alignItems: 'center',
  },
  timeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  appointmentInfo: {
    marginBottom: 15,
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  appointmentType: {
    fontSize: 14,
    color: '#3498db',
    marginBottom: 8,
  },
  motif: {
    fontSize: 14,
    color: '#2c3e50',
    marginBottom: 8,
    lineHeight: 20,
  },
  appointmentDate: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  appointmentActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#7f8c8d',
    borderRadius: 8,
  },
  primaryButton: {
    backgroundColor: '#3498db',
  },
  dangerButton: {
    backgroundColor: '#e74c3c',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 5,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 15,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 20,
  },
});
