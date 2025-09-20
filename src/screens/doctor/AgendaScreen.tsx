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
import { apiService } from '../../services/apiService';
import { AppDispatch, RootState } from '../../store';
import { fetchTodayAppointments } from '../../store/slices/appointmentSlice';
import { RendezVous } from '../../types';

export default function AgendaScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { todayAppointments, loading } = useSelector((state: RootState) => state.appointments);

  const [agendas, setAgendas] = useState<any[]>([]);
  const [timeSlots, setTimeSlots] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    dispatch(fetchTodayAppointments());
    loadAgendas();
    loadTimeSlots();
  };

  const loadAgendas = async () => {
    try {
      if (user?.role === 'MEDECIN') {
        const response = await apiService.getDoctorAgendas((user as any).idMedecin);
        setAgendas(response.data);
      }
    } catch (error) {
      console.error('Erreur chargement agendas:', error);
    }
  };

  const loadTimeSlots = async () => {
    try {
      // Simuler le chargement des créneaux
      // En réalité, on utiliserait une API pour récupérer les créneaux
      setTimeSlots([]);
    } catch (error) {
      console.error('Erreur chargement créneaux:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const createNewAgenda = () => {
    Alert.alert('Info', 'Fonctionnalité en cours de développement');
  };

  const createNewTimeSlot = () => {
    Alert.alert('Info', 'Fonctionnalité en cours de développement');
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
      default:
        return statut;
    }
  };

  const renderAgendaList = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Mes agendas</Text>
        <TouchableOpacity style={styles.addButton} onPress={createNewAgenda}>
          <Ionicons name="add" size={20} color="#3498db" />
          <Text style={styles.addButtonText}>Nouveau</Text>
        </TouchableOpacity>
      </View>
      
      {agendas.length > 0 ? (
        agendas.map((agenda, index) => (
          <View key={index} style={styles.agendaCard}>
            <View style={styles.agendaInfo}>
              <Text style={styles.agendaName}>{agenda.nom}</Text>
              <Text style={styles.agendaDescription}>{agenda.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#bdc3c7" />
          </View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={48} color="#bdc3c7" />
          <Text style={styles.emptyStateText}>Aucun agenda créé</Text>
          <TouchableOpacity style={styles.createButton} onPress={createNewAgenda}>
            <Text style={styles.createButtonText}>Créer un agenda</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderTimeSlots = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Créneaux horaires</Text>
        <TouchableOpacity style={styles.addButton} onPress={createNewTimeSlot}>
          <Ionicons name="add" size={20} color="#3498db" />
          <Text style={styles.addButtonText}>Nouveau</Text>
        </TouchableOpacity>
      </View>
      
      {timeSlots.length > 0 ? (
        timeSlots.map((slot, index) => (
          <View key={index} style={styles.slotCard}>
            <View style={styles.slotInfo}>
              <Text style={styles.slotTime}>
                {formatTime(slot.debut)} - {formatTime(slot.fin)}
              </Text>
              <Text style={styles.slotType}>{slot.typeCreneau}</Text>
            </View>
            <View style={[styles.slotStatus, { backgroundColor: slot.disponible ? '#27ae60' : '#e74c3c' }]}>
              <Text style={styles.slotStatusText}>
                {slot.disponible ? 'Disponible' : 'Occupé'}
              </Text>
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="time-outline" size={48} color="#bdc3c7" />
          <Text style={styles.emptyStateText}>Aucun créneau défini</Text>
          <TouchableOpacity style={styles.createButton} onPress={createNewTimeSlot}>
            <Text style={styles.createButtonText}>Créer un créneau</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderTodayAppointments = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Rendez-vous d'aujourd'hui</Text>
      
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
        <Text style={styles.headerTitle}>Mon agenda</Text>
        <Text style={styles.headerSubtitle}>
          {formatDate(selectedDate.toISOString())}
        </Text>
      </View>

      {/* Today's Appointments */}
      {renderTodayAppointments()}

      {/* Agenda List */}
      {renderAgendaList()}

      {/* Time Slots */}
      {renderTimeSlots()}
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
  section: {
    backgroundColor: 'white',
    padding: 20,
    marginTop: 10,
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
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0f8ff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#3498db',
  },
  addButtonText: {
    fontSize: 12,
    color: '#3498db',
    marginLeft: 4,
    fontWeight: '500',
  },
  agendaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  agendaInfo: {
    flex: 1,
  },
  agendaName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  agendaDescription: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  slotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  slotInfo: {
    flex: 1,
  },
  slotTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  slotType: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  slotStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  slotStatusText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
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
  patientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
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
  createButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 15,
  },
  createButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
