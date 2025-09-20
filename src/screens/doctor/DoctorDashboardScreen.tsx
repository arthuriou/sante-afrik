import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchTodayAppointments, markPatientArrived, startConsultation } from '../../store/slices/appointmentSlice';
import { RendezVous } from '../../types';

export default function DoctorDashboardScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { todayAppointments, loading } = useSelector((state: RootState) => state.appointments);

  const [waitingPatients, setWaitingPatients] = useState<RendezVous[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    dispatch(fetchTodayAppointments());
    loadWaitingPatients();
  };

  const loadWaitingPatients = async () => {
    try {
      // Simuler le chargement des patients en attente
      // En réalité, on utiliserait fetchWaitingPatients()
      setWaitingPatients([]);
    } catch (error) {
      console.error('Erreur chargement patients en attente:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleMarkArrived = async (appointmentId: string) => {
    try {
      await dispatch(markPatientArrived(appointmentId));
      loadData(); // Recharger les données
    } catch (error) {
      console.error('Erreur marquer arrivé:', error);
    }
  };

  const handleStartConsultation = async (appointmentId: string) => {
    try {
      await dispatch(startConsultation(appointmentId));
      // Navigation vers l'écran de consultation
      // navigation.navigate('Consultation', { appointmentId });
    } catch (error) {
      console.error('Erreur démarrer consultation:', error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
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
      default:
        return statut;
    }
  };

  const renderStatsCards = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <Ionicons name="people" size={24} color="#3498db" />
        <Text style={styles.statNumber}>{todayAppointments.length}</Text>
        <Text style={styles.statLabel}>RDV aujourd'hui</Text>
      </View>
      
      <View style={styles.statCard}>
        <Ionicons name="time" size={24} color="#f39c12" />
        <Text style={styles.statNumber}>{waitingPatients.length}</Text>
        <Text style={styles.statLabel}>En attente</Text>
      </View>
      
      <View style={styles.statCard}>
        <Ionicons name="checkmark-circle" size={24} color="#27ae60" />
        <Text style={styles.statNumber}>
          {todayAppointments.filter(apt => apt.statut === 'TERMINE').length}
        </Text>
        <Text style={styles.statLabel}>Terminés</Text>
      </View>
    </View>
  );

  const renderWaitingPatients = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Patients en attente</Text>
      
      {waitingPatients.length > 0 ? (
        waitingPatients.map((appointment: RendezVous) => (
          <View key={appointment.idRendezVous} style={styles.patientCard}>
            <View style={styles.patientInfo}>
              <Text style={styles.patientName}>
                {appointment.patient.prenom} {appointment.patient.nom}
              </Text>
              <Text style={styles.appointmentTime}>
                {formatTime(appointment.dateHeure)}
              </Text>
            </View>
            
            <View style={styles.patientActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleMarkArrived(appointment.idRendezVous)}
              >
                <Ionicons name="checkmark" size={16} color="white" />
                <Text style={styles.actionButtonText}>Arrivé</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.primaryButton]}
                onPress={() => handleStartConsultation(appointment.idRendezVous)}
              >
                <Ionicons name="play" size={16} color="white" />
                <Text style={styles.actionButtonText}>Commencer</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={48} color="#bdc3c7" />
          <Text style={styles.emptyStateText}>Aucun patient en attente</Text>
        </View>
      )}
    </View>
  );

  const renderTodaySchedule = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Planning d'aujourd'hui</Text>
      
      {todayAppointments.length > 0 ? (
        todayAppointments.map((appointment: RendezVous) => (
          <View key={appointment.idRendezVous} style={styles.appointmentCard}>
            <View style={styles.appointmentTime}>
              <Text style={styles.timeText}>
                {formatTime(appointment.dateHeure)}
              </Text>
            </View>
            
            <View style={styles.appointmentInfo}>
              <Text style={styles.patientName}>
                {appointment.patient.prenom} {appointment.patient.nom}
              </Text>
              <Text style={styles.appointmentType}>
                {appointment.typeRdv === 'PRESENTIEL' ? 'Consultation présentielle' : 'Téléconsultation'}
              </Text>
              <Text style={styles.motif} numberOfLines={1}>
                {appointment.motif}
              </Text>
            </View>
            
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.statut) }]}>
              <Text style={styles.statusText}>
                {getStatusText(appointment.statut)}
              </Text>
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={48} color="#bdc3c7" />
          <Text style={styles.emptyStateText}>Aucun rendez-vous aujourd'hui</Text>
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
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bonjour,</Text>
          <Text style={styles.name}>Dr. {user?.prenom} {user?.nom}</Text>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color="#2c3e50" />
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      {renderStatsCards()}

      {/* Waiting Patients */}
      {renderWaitingPatients()}

      {/* Today's Schedule */}
      {renderTodaySchedule()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  greeting: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  notificationButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 15,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 10,
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 5,
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    padding: 20,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  appointmentTime: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  patientActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#7f8c8d',
    borderRadius: 8,
  },
  primaryButton: {
    backgroundColor: '#3498db',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  appointmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  appointmentTime: {
    width: 60,
    alignItems: 'center',
    marginRight: 15,
  },
  timeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentType: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  motif: {
    fontSize: 14,
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
