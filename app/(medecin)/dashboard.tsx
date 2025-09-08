import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  FlatList,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService, RendezVous, User } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

interface DashboardStats {
  totalPatients: number;
  appointmentsToday: number;
  pendingAppointments: number;
  completedToday: number;
}

export default function MedecinDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [appointments, setAppointments] = useState<RendezVous[]>([]);
  const [todayAppointments, setTodayAppointments] = useState<RendezVous[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    appointmentsToday: 0,
    pendingAppointments: 0,
    completedToday: 0,
  });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (user?.medecin?.idmedecin) {
      loadDashboardData();
    }
  }, [user]);

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

  const loadDashboardData = async () => {
    if (!user?.medecin?.idmedecin) return;

    setLoading(true);
    try {
      const response = await apiService.getRendezVousMedecin(user.medecin.idmedecin);
      const allAppointments = response.data;

      // Filtrer les rendez-vous d'aujourd'hui
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const todayEnd = new Date(todayStart);
      todayEnd.setDate(todayEnd.getDate() + 1);

      const todayRdv = allAppointments.filter(rdv => {
        const rdvDate = new Date(rdv.dateheure);
        return rdvDate >= todayStart && rdvDate < todayEnd;
      });

      setAppointments(allAppointments);
      setTodayAppointments(todayRdv);

      // Calculer les statistiques
      const pending = allAppointments.filter(rdv => rdv.statut === 'EN_ATTENTE').length;
      const completedToday = todayRdv.filter(rdv => rdv.statut === 'TERMINE').length;
      
      setStats({
        totalPatients: allAppointments.length, // Approximation
        appointmentsToday: todayRdv.length,
        pendingAppointments: pending,
        completedToday: completedToday,
      });

    } catch (error) {
      console.error('Erreur chargement données:', error);
      
      // Données de démonstration
      const mockAppointments: RendezVous[] = [
        {
          idrendezvous: '1',
          patient_id: 'patient-1',
          medecin_id: user.medecin?.idmedecin || '',
          dateheure: new Date().toISOString(),
          duree: 30,
          motif: 'Consultation de routine',
          statut: 'EN_ATTENTE',
          patient: {
            idpatient: 'patient-1',
            datenaissance: '1985-05-15',
            genre: 'M',
            adresse: '123 Rue de la Paix',
            groupesanguin: 'O+',
            poids: 75,
            taille: 180,
            statut: 'ACTIF',
            utilisateur: {
              nom: 'KOUASSI',
              prenom: 'Jean',
              email: 'jean.kouassi@email.com',
            },
          },
        },
        {
          idrendezvous: '2',
          patient_id: 'patient-2',
          medecin_id: user.medecin?.idmedecin || '',
          dateheure: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          duree: 30,
          motif: 'Douleur thoracique',
          statut: 'CONFIRME',
          patient: {
            idpatient: 'patient-2',
            datenaissance: '1978-10-20',
            genre: 'F',
            adresse: '456 Avenue des Palmiers',
            groupesanguin: 'A+',
            poids: 65,
            taille: 165,
            statut: 'ACTIF',
            utilisateur: {
              nom: 'MENSAH',
              prenom: 'Marie',
              email: 'marie.mensah@email.com',
            },
          },
        },
      ];

      setTodayAppointments(mockAppointments);
      setStats({
        totalPatients: 45,
        appointmentsToday: mockAppointments.length,
        pendingAppointments: 1,
        completedToday: 3,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleConfirmAppointment = async (appointmentId: string) => {
    try {
      await apiService.confirmRendezVous(appointmentId);
      loadDashboardData();
      Alert.alert('Succès', 'Rendez-vous confirmé avec succès');
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusInfo = (status: RendezVous['statut']) => {
    switch (status) {
      case 'EN_ATTENTE':
        return { label: 'En attente', color: '#FF9500', icon: 'time-outline' };
      case 'CONFIRME':
        return { label: 'Confirmé', color: '#4CAF50', icon: 'checkmark-circle-outline' };
      case 'TERMINE':
        return { label: 'Terminé', color: '#2196F3', icon: 'checkmark-done-outline' };
      case 'EN_COURS':
        return { label: 'En cours', color: '#9C27B0', icon: 'play-circle-outline' };
      case 'ANNULE':
        return { label: 'Annulé', color: '#FF5722', icon: 'close-circle-outline' };
      default:
        return { label: 'Inconnu', color: '#666', icon: 'help-circle-outline' };
    }
  };

  const renderStatCard = (title: string, value: number, color: string, icon: any) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <Ionicons name={icon} size={24} color={color} />
        <Text style={styles.statValue}>{value}</Text>
      </View>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  const renderAppointment = ({ item }: { item: RendezVous }) => {
    const statusInfo = getStatusInfo(item.statut);

    return (
      <View style={styles.appointmentCard}>
        <View style={styles.appointmentHeader}>
          <Text style={styles.appointmentTime}>{formatTime(item.dateheure)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: `${statusInfo.color}20` }]}>
            <Ionicons name={statusInfo.icon as any} size={14} color={statusInfo.color} />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </View>
        </View>

        <View style={styles.patientInfo}>
          <View style={styles.patientAvatar}>
            <Ionicons 
              name={item.patient?.genre === 'F' ? 'woman' : 'man'} 
              size={20} 
              color="#666" 
            />
          </View>
          <View style={styles.patientDetails}>
            <Text style={styles.patientName}>
              {item.patient?.utilisateur?.prenom} {item.patient?.utilisateur?.nom}
            </Text>
            <Text style={styles.appointmentMotif}>{item.motif}</Text>
            <Text style={styles.appointmentDuration}>{item.duree} minutes</Text>
          </View>
        </View>

        <View style={styles.appointmentActions}>
          {item.statut === 'EN_ATTENTE' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.confirmButton]}
              onPress={() => handleConfirmAppointment(item.idrendezvous)}
            >
              <Text style={styles.confirmButtonText}>Confirmer</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.detailButton]}
            onPress={() => router.push(`/(medecin)/patient/${item.patient_id}`)}
          >
            <Text style={styles.detailButtonText}>Voir le patient</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const quickActions = [
    {
      title: 'Créer un créneau',
      icon: 'add-circle',
      color: '#4CAF50',
      onPress: () => router.push('/(medecin)/create-slot'),
    },
    {
      title: 'Mon agenda',
      icon: 'calendar',
      color: '#2196F3',
      onPress: () => router.push('/(medecin)/agenda'),
    },
    {
      title: 'Mes patients',
      icon: 'people',
      color: '#FF9500',
      onPress: () => router.push('/(medecin)/patients'),
    },
    {
      title: 'Statistiques',
      icon: 'bar-chart',
      color: '#9C27B0',
      onPress: () => router.push('/(medecin)/stats'),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Bonjour,</Text>
          <Text style={styles.doctorName}>
            {user?.prenom} {user?.nom}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => router.push('/(medecin)/profile')}
        >
          <Ionicons name="person-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadDashboardData} />
        }
      >
        {/* Statistiques */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Vue d'ensemble</Text>
          <View style={styles.statsGrid}>
            {renderStatCard('RDV aujourd\'hui', stats.appointmentsToday, '#2196F3', 'calendar')}
            {renderStatCard('En attente', stats.pendingAppointments, '#FF9500', 'time')}
            {renderStatCard('Terminés', stats.completedToday, '#4CAF50', 'checkmark-circle')}
            {renderStatCard('Total patients', stats.totalPatients, '#9C27B0', 'people')}
          </View>
        </View>

        {/* Actions rapides */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickActionCard}
                onPress={action.onPress}
              >
                <Ionicons name={action.icon as any} size={28} color={action.color} />
                <Text style={styles.quickActionText}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Rendez-vous d'aujourd'hui */}
        <View style={styles.todayAppointmentsContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Rendez-vous d'aujourd'hui</Text>
            <TouchableOpacity
              onPress={() => router.push('/(medecin)/agenda')}
            >
              <Text style={styles.viewAllText}>Voir tout</Text>
            </TouchableOpacity>
          </View>

          {todayAppointments.length > 0 ? (
            <FlatList
              data={todayAppointments}
              renderItem={renderAppointment}
              keyExtractor={(item) => item.idrendezvous}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={40} color="#ccc" />
              <Text style={styles.emptyText}>Aucun rendez-vous aujourd'hui</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
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
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  welcomeSection: {},
  welcomeText: {
    fontSize: 16,
    color: '#666',
  },
  doctorName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  profileButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  viewAllText: {
    fontSize: 14,
    color: '#007AFF',
  },
  statsContainer: {
    marginBottom: 30,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
  },
  quickActionsContainer: {
    marginBottom: 30,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    marginTop: 8,
  },
  todayAppointmentsContainer: {
    marginBottom: 30,
  },
  appointmentCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  appointmentTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  patientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  patientDetails: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  appointmentMotif: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  appointmentDuration: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  appointmentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  detailButton: {
    backgroundColor: '#E6F3FF',
  },
  detailButtonText: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '600',
  },
  separator: {
    height: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
});