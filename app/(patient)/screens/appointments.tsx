import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { apiService, RendezVous } from '../../../services/api';

export default function PatientAppointmentsScreen() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<'upcoming' | 'past'>('upcoming');
  const [loading, setLoading] = useState(false);
  const [allAppointments, setAllAppointments] = useState<RendezVous[]>([]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const userDataRaw = await AsyncStorage.getItem('userData');
      const userData = userDataRaw ? JSON.parse(userDataRaw) : null;
      const patientId = userData?.patient?.idpatient || userData?.idutilisateur;
      if (!patientId) return;
      const resp = await apiService.getRendezVousPatient();
      setAllAppointments(resp.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const upcomingAppointments = allAppointments.filter(a => a.statut !== 'TERMINE' && a.statut !== 'ANNULE');
  const pastAppointments = allAppointments.filter(a => a.statut === 'TERMINE' || a.statut === 'ANNULE');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRME':
        return '#34C759';
      case 'EN_ATTENTE':
        return '#FF9500';
      case 'ANNULE':
        return '#FF3B30';
      case 'TERMINE':
        return '#8E8E93';
      default:
        return '#8E8E93';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'CONFIRME':
        return 'Confirmé';
      case 'EN_ATTENTE':
        return 'En attente';
      case 'ANNULE':
        return 'Annulé';
      case 'TERMINE':
        return 'Terminé';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('fr-FR', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long' 
      }),
      time: date.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  };

  const renderAppointment = ({ item }: { item: RendezVous }) => {
    const { date, time } = formatDate(item.dateheure);
    const statusColor = getStatusColor(item.statut);
    
    return (
    <View style={styles.appointmentCard}>
      <View style={styles.appointmentHeader}>
        <View style={styles.doctorInfo}>
            <Text style={styles.doctorName}>
              Dr. {item.medecin?.prenom} {item.medecin?.nom}
            </Text>
            <Text style={styles.doctorSpecialty}>
              {item.medecin?.specialites?.map(s => s.nom).join(', ')}
            </Text>
        </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {getStatusText(item.statut)}
          </Text>
        </View>
      </View>

      <View style={styles.appointmentDetails}>
          <View style={styles.dateTimeRow}>
            <View style={styles.dateTimeItem}>
              <Ionicons name="calendar-outline" size={16} color="#007AFF" />
              <Text style={styles.dateTimeText}>{date}</Text>
            </View>
            <View style={styles.dateTimeItem}>
              <Ionicons name="time-outline" size={16} color="#007AFF" />
              <Text style={styles.dateTimeText}>{time}</Text>
            </View>
        </View>
        
          {item.medecin?.cabinet && (
            <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={16} color="#8E8E93" />
              <View style={styles.locationInfo}>
                <Text style={styles.cabinetName}>{item.medecin.cabinet.nom}</Text>
                <Text style={styles.cabinetAddress}>{item.medecin.cabinet.adresse}</Text>
              </View>
        </View>
          )}
          
          {item.motif && (
            <View style={styles.motifRow}>
              <Ionicons name="document-text-outline" size={16} color="#8E8E93" />
              <Text style={styles.motifText}>{item.motif}</Text>
        </View>
          )}
      </View>

      <View style={styles.appointmentActions}>
          {item.statut === 'CONFIRME' && (
          <>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="videocam-outline" size={16} color="#007AFF" />
              <Text style={styles.actionButtonText}>Vidéo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="call-outline" size={16} color="#007AFF" />
              <Text style={styles.actionButtonText}>Appeler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="navigate-outline" size={16} color="#007AFF" />
              <Text style={styles.actionButtonText}>Itinéraire</Text>
            </TouchableOpacity>
          </>
        )}
        
          {item.statut === 'TERMINE' && (
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="document-text-outline" size={16} color="#007AFF" />
            <Text style={styles.actionButtonText}>Résumé</Text>
          </TouchableOpacity>
        )}
        
          {(item.statut === 'CONFIRME' || item.statut === 'EN_ATTENTE') && (
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={async () => {
                try {
                  await apiService.annulerRendezVous(item.idrendezvous);
                  await loadAppointments();
                } catch {}
              }}
            >
          <Ionicons name="close-outline" size={16} color="#FF3B30" />
              <Text style={styles.cancelButtonText}>Annuler</Text>
        </TouchableOpacity>
          )}
      </View>
    </View>
  );
  };

  const currentAppointments = selectedTab === 'upcoming' ? upcomingAppointments : pastAppointments;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes rendez-vous</Text>
      </View>

      {/* Onglets */}
      <View style={styles.tabsContainer}>
          <TouchableOpacity
          style={[styles.tab, selectedTab === 'upcoming' && styles.tabActive]}
          onPress={() => setSelectedTab('upcoming')}
        >
          <Text style={[styles.tabText, selectedTab === 'upcoming' && styles.tabTextActive]}>
            À venir
          </Text>
          {upcomingAppointments.length > 0 && (
            <View style={[styles.tabBadge, selectedTab === 'upcoming' && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, selectedTab === 'upcoming' && styles.tabBadgeTextActive]}>
                {upcomingAppointments.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'past' && styles.tabActive]}
          onPress={() => setSelectedTab('past')}
        >
          <Text style={[styles.tabText, selectedTab === 'past' && styles.tabTextActive]}>
            Passés
            </Text>
          {pastAppointments.length > 0 && (
            <View style={[styles.tabBadge, selectedTab === 'past' && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, selectedTab === 'past' && styles.tabBadgeTextActive]}>
                {pastAppointments.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
      </View>

      {/* Contenu */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Chargement des rendez-vous...</Text>
          </View>
        ) : currentAppointments.length > 0 ? (
          <FlatList
            data={currentAppointments}
            renderItem={renderAppointment}
            keyExtractor={(item) => item.idrendezvous}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.appointmentsList}
            ListFooterComponent={<View style={{ height: 48 }} />}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color="#8E8E93" />
            <Text style={styles.emptyTitle}>
              {selectedTab === 'upcoming' ? 'Aucun rendez-vous à venir' : 'Aucun rendez-vous passé'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {selectedTab === 'upcoming' 
                ? 'Prenez rendez-vous avec un médecin pour commencer'
                : 'Vos rendez-vous passés apparaîtront ici'
              }
            </Text>
            {selectedTab === 'upcoming' && (
              <TouchableOpacity 
                style={styles.bookButton}
                onPress={() => router.push('/(patient)/screens/search')}
              >
                <Text style={styles.bookButtonText}>Prendre rendez-vous</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7', // iOS System Gray 6
  },
  
  // Header
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#000000',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  
  
  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  tabActive: {
    backgroundColor: '#007AFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8E8E93',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  tabBadge: {
    backgroundColor: '#8E8E93',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  tabBadgeActive: {
    backgroundColor: '#FFFFFF',
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  tabBadgeTextActive: {
    color: '#007AFF',
  },
  
  // Content
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  appointmentsList: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  
  // Appointment Card
  appointmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20, // Gros coins arrondis iOS
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  doctorSpecialty: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  
  // Appointment Details
  appointmentDetails: {
    marginBottom: 20,
  },
  dateTimeRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  dateTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF15',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 12,
  },
  dateTimeText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  locationInfo: {
    marginLeft: 12,
    flex: 1,
  },
  cabinetName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  cabinetAddress: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  motifRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  motifText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#8E8E93',
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  
  // Actions
  appointmentActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 6,
    marginBottom: 12,
  },
  actionButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B3015',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 6,
    marginBottom: 12,
  },
  cancelButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#FF3B30',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  
  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  bookButton: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
});