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
import { fetchPatientAppointments } from '../../store/slices/appointmentSlice';
import { fetchConversations } from '../../store/slices/messageSlice';
import { Conversation, RendezVous } from '../../types';

export default function PatientDashboardScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { upcomingAppointments, loading } = useSelector((state: RootState) => state.appointments);
  const { conversations } = useSelector((state: RootState) => state.messages);

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (user?.role === 'PATIENT') {
      dispatch(fetchPatientAppointments((user as any).idPatient));
    }
    dispatch(fetchConversations());
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const navigateToSearch = () => {
    navigation.navigate('Search' as never);
  };

  const navigateToMessages = () => {
    navigation.navigate('Messages' as never);
  };

  const navigateToAppointments = () => {
    navigation.navigate('Search' as never);
  };

  const navigateToMedicalRecord = () => {
    navigation.navigate('MedicalRecord' as never);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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
          <Text style={styles.name}>{user?.prenom} {user?.nom}</Text>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color="#2c3e50" />
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Actions rapides</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionButton} onPress={navigateToSearch}>
            <Ionicons name="search" size={24} color="#3498db" />
            <Text style={styles.actionText}>Rechercher</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={navigateToMessages}>
            <Ionicons name="chatbubbles" size={24} color="#e74c3c" />
            <Text style={styles.actionText}>Messages</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={navigateToAppointments}>
            <Ionicons name="calendar" size={24} color="#f39c12" />
            <Text style={styles.actionText}>Rendez-vous</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={navigateToMedicalRecord}>
            <Ionicons name="document-text" size={24} color="#9b59b6" />
            <Text style={styles.actionText}>Dossier</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Upcoming Appointments */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Prochains rendez-vous</Text>
          <TouchableOpacity onPress={navigateToAppointments}>
            <Text style={styles.seeAllText}>Voir tout</Text>
          </TouchableOpacity>
        </View>
        
        {upcomingAppointments.length > 0 ? (
          upcomingAppointments.slice(0, 3).map((appointment: RendezVous) => (
            <TouchableOpacity key={appointment.idRendezVous} style={styles.appointmentCard}>
              <View style={styles.appointmentInfo}>
                <View style={styles.appointmentHeader}>
                  <Text style={styles.doctorName}>
                    Dr. {appointment.medecin.prenom} {appointment.medecin.nom}
                  </Text>
                  <View style={[styles.statusBadge, 
                    appointment.statut === 'CONFIRME' && styles.statusConfirmed,
                    appointment.statut === 'EN_ATTENTE_CONSULTATION' && styles.statusWaiting,
                    appointment.statut === 'EN_COURS' && styles.statusInProgress,
                  ]}>
                    <Text style={styles.statusText}>
                      {appointment.statut === 'CONFIRME' && 'Confirmé'}
                      {appointment.statut === 'EN_ATTENTE_CONSULTATION' && 'En attente'}
                      {appointment.statut === 'EN_COURS' && 'En cours'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.specialty}>{appointment.medecin.specialite?.nom}</Text>
                <Text style={styles.appointmentDate}>
                  {formatDate(appointment.dateHeure)} à {formatTime(appointment.dateHeure)}
                </Text>
                <Text style={styles.appointmentType}>
                  {appointment.typeRdv === 'PRESENTIEL' ? 'Consultation présentielle' : 'Téléconsultation'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#bdc3c7" />
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color="#bdc3c7" />
            <Text style={styles.emptyStateText}>Aucun rendez-vous à venir</Text>
            <TouchableOpacity style={styles.bookButton} onPress={navigateToSearch}>
              <Text style={styles.bookButtonText}>Prendre un rendez-vous</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Recent Messages */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Messages récents</Text>
          <TouchableOpacity onPress={navigateToMessages}>
            <Text style={styles.seeAllText}>Voir tout</Text>
          </TouchableOpacity>
        </View>
        
        {conversations.length > 0 ? (
          conversations.slice(0, 2).map((conversation: Conversation) => (
            <TouchableOpacity key={conversation.idConversation} style={styles.messageCard}>
              <View style={styles.messageInfo}>
                <Text style={styles.messageTitle}>
                  {conversation.participants.find(p => p.id !== user?.id)?.prenom} {conversation.participants.find(p => p.id !== user?.id)?.nom}
                </Text>
                <Text style={styles.messagePreview} numberOfLines={1}>
                  {conversation.dernierMessage?.contenu || 'Aucun message'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#bdc3c7" />
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={48} color="#bdc3c7" />
            <Text style={styles.emptyStateText}>Aucun message</Text>
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
  quickActions: {
    padding: 20,
    backgroundColor: 'white',
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2c3e50',
    marginTop: 8,
  },
  section: {
    padding: 20,
    backgroundColor: 'white',
    marginTop: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  seeAllText: {
    fontSize: 14,
    color: '#3498db',
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
  appointmentInfo: {
    flex: 1,
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
  statusConfirmed: {
    backgroundColor: '#d4edda',
  },
  statusWaiting: {
    backgroundColor: '#fff3cd',
  },
  statusInProgress: {
    backgroundColor: '#cce5ff',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#2c3e50',
  },
  specialty: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  appointmentDate: {
    fontSize: 14,
    color: '#2c3e50',
    marginBottom: 2,
  },
  appointmentType: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  messageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  messageInfo: {
    flex: 1,
  },
  messageTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  messagePreview: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 15,
    textAlign: 'center',
  },
  bookButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 15,
  },
  bookButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
