import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SafeAreaView,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService, RendezVous, User } from '../../../services/api';
import { Ionicons } from '@expo/vector-icons';

type TabType = 'upcoming' | 'past' | 'cancelled';

export default function AppointmentsScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [appointments, setAppointments] = useState<RendezVous[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (user?.patient?.idpatient) {
      loadAppointments();
    }
  }, [user, activeTab]);

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

  const loadAppointments = async () => {
    if (!user?.patient?.idpatient) return;

    setLoading(true);
    try {
      const response = await apiService.getRendezVousPatient(user.patient.idpatient);
      
      // Filtrer selon l'onglet actif
      const now = new Date();
      const filtered = response.data.filter(rdv => {
        const rdvDate = new Date(rdv.dateheure);
        
        switch (activeTab) {
          case 'upcoming':
            return rdvDate >= now && rdv.statut !== 'ANNULE';
          case 'past':
            return rdvDate < now && rdv.statut === 'TERMINE';
          case 'cancelled':
            return rdv.statut === 'ANNULE';
          default:
            return true;
        }
      });

      setAppointments(filtered);
    } catch (error) {
      console.error('Erreur chargement rendez-vous:', error);
      
      // Données de démonstration
      const mockAppointments: RendezVous[] = [
        {
          idrendezvous: '1',
          patient_id: user.patient?.idpatient || '',
          medecin_id: 'medecin-1',
          dateheure: '2024-01-20T14:30:00Z',
          duree: 30,
          motif: 'Consultation de routine',
          statut: 'CONFIRME',
          medecin: {
            idmedecin: 'medecin-1',
            numordre: '12345',
            experience: 8,
            biographie: 'Cardiologue expérimenté',
            statut: 'APPROVED',
            utilisateur: {
              nom: 'MARTIN',
              prenom: 'Dr. Jean',
              email: 'jean.martin@santeafrik.com',
            },
          },
        },
        {
          idrendezvous: '2',
          patient_id: user.patient?.idpatient || '',
          medecin_id: 'medecin-2',
          dateheure: '2024-01-10T10:00:00Z',
          duree: 30,
          motif: 'Douleur thoracique',
          statut: 'TERMINE',
          medecin: {
            idmedecin: 'medecin-2',
            numordre: '67890',
            experience: 12,
            biographie: 'Médecin généraliste',
            statut: 'APPROVED',
            utilisateur: {
              nom: 'DUBOIS',
              prenom: 'Dr. Marie',
              email: 'marie.dubois@santeafrik.com',
            },
          },
        },
      ];
      
      const now = new Date();
      const filtered = mockAppointments.filter(rdv => {
        const rdvDate = new Date(rdv.dateheure);
        
        switch (activeTab) {
          case 'upcoming':
            return rdvDate >= now && rdv.statut !== 'ANNULE';
          case 'past':
            return rdvDate < now && rdv.statut === 'TERMINE';
          case 'cancelled':
            return rdv.statut === 'ANNULE';
          default:
            return true;
        }
      });
      
      setAppointments(filtered);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCancelAppointment = (appointment: RendezVous) => {
    Alert.alert(
      'Annuler le rendez-vous',
      'Êtes-vous sûr de vouloir annuler ce rendez-vous ?',
      [
        {
          text: 'Non',
          style: 'cancel',
        },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.cancelRendezVous(appointment.idrendezvous);
              loadAppointments();
              Alert.alert('Succès', 'Rendez-vous annulé avec succès');
            } catch (error: any) {
              Alert.alert('Erreur', error.message);
            }
          },
        },
      ]
    );
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      }),
      time: date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      fullDate: date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    };
  };

  const getStatusInfo = (status: RendezVous['statut']) => {
    switch (status) {
      case 'EN_ATTENTE':
        return {
          label: 'En attente',
          color: '#FF9500',
          backgroundColor: '#FFF9E6',
          icon: 'time-outline',
        };
      case 'CONFIRME':
        return {
          label: 'Confirmé',
          color: '#4CAF50',
          backgroundColor: '#E8F5E8',
          icon: 'checkmark-circle-outline',
        };
      case 'ANNULE':
        return {
          label: 'Annulé',
          color: '#FF5722',
          backgroundColor: '#FFE8E6',
          icon: 'close-circle-outline',
        };
      case 'TERMINE':
        return {
          label: 'Terminé',
          color: '#2196F3',
          backgroundColor: '#E6F3FF',
          icon: 'checkmark-done-outline',
        };
      case 'EN_COURS':
        return {
          label: 'En cours',
          color: '#9C27B0',
          backgroundColor: '#F3E6FF',
          icon: 'play-circle-outline',
        };
      default:
        return {
          label: 'Inconnu',
          color: '#666',
          backgroundColor: '#f5f5f5',
          icon: 'help-circle-outline',
        };
    }
  };

  const renderAppointment = ({ item }: { item: RendezVous }) => {
    const { date, time, fullDate } = formatDateTime(item.dateheure);
    const statusInfo = getStatusInfo(item.statut);

    return (
      <View style={styles.appointmentCard}>
        <View style={styles.appointmentHeader}>
          <View style={styles.dateTimeContainer}>
            <View style={styles.dateContainer}>
              <Text style={styles.dateText}>{date}</Text>
              <Text style={styles.timeText}>{time}</Text>
            </View>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: statusInfo.backgroundColor }]}>
            <Ionicons name={statusInfo.icon as any} size={16} color={statusInfo.color} />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </View>
        </View>

        <View style={styles.appointmentBody}>
          <View style={styles.doctorInfo}>
            <View style={styles.doctorAvatar}>
              <Ionicons name="person" size={20} color="#666" />
            </View>
            <View style={styles.doctorDetails}>
              <Text style={styles.doctorName}>
                {item.medecin?.utilisateur?.prenom} {item.medecin?.utilisateur?.nom}
              </Text>
              <Text style={styles.speciality}>Cardiologue</Text>
            </View>
          </View>

          <View style={styles.appointmentDetails}>
            <View style={styles.detailItem}>
              <Ionicons name="document-text-outline" size={16} color="#666" />
              <Text style={styles.detailText}>{item.motif}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={16} color="#666" />
              <Text style={styles.detailText}>{item.duree} minutes</Text>
            </View>
          </View>
        </View>

        <View style={styles.appointmentFooter}>
          {activeTab === 'upcoming' && item.statut !== 'ANNULE' && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => handleCancelAppointment(item)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.rescheduleButton]}
                onPress={() => {
                  router.push(`/(patient)/medecin/${item.medecin_id}`);
                }}
              >
                <Text style={styles.rescheduleButtonText}>Reprogrammer</Text>
              </TouchableOpacity>
            </View>
          )}

          {activeTab === 'past' && (
            <TouchableOpacity
              style={styles.reviewButton}
              onPress={() => {
                Alert.alert('Avis', 'Fonctionnalité d\'évaluation à venir');
              }}
            >
              <Ionicons name="star-outline" size={16} color="#007AFF" />
              <Text style={styles.reviewButtonText}>Laisser un avis</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderEmptyState = () => {
    const messages = {
      upcoming: {
        title: 'Aucun rendez-vous à venir',
        subtitle: 'Vous n\'avez pas de rendez-vous programmé',
        action: 'Prendre un rendez-vous',
      },
      past: {
        title: 'Aucun historique',
        subtitle: 'Vous n\'avez pas encore eu de consultation',
        action: null,
      },
      cancelled: {
        title: 'Aucun rendez-vous annulé',
        subtitle: 'Vous n\'avez pas de rendez-vous annulé',
        action: null,
      },
    };

    const message = messages[activeTab];

    return (
      <View style={styles.emptyState}>
        <Ionicons name="calendar-outline" size={60} color="#ccc" />
        <Text style={styles.emptyTitle}>{message.title}</Text>
        <Text style={styles.emptySubtitle}>{message.subtitle}</Text>
        {message.action && (
          <TouchableOpacity
            style={styles.emptyActionButton}
            onPress={() => router.push('/(patient)/(tabs)/home')}
          >
            <Text style={styles.emptyActionText}>{message.action}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes rendez-vous</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>
            À venir
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'past' && styles.activeTab]}
          onPress={() => setActiveTab('past')}
        >
          <Text style={[styles.tabText, activeTab === 'past' && styles.activeTabText]}>
            Passés
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'cancelled' && styles.activeTab]}
          onPress={() => setActiveTab('cancelled')}
        >
          <Text style={[styles.tabText, activeTab === 'cancelled' && styles.activeTabText]}>
            Annulés
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={appointments}
        renderItem={renderAppointment}
        keyExtractor={(item) => item.idrendezvous}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadAppointments} />
        }
        ListEmptyComponent={renderEmptyState}
      />

      {activeTab === 'upcoming' && (
        <View style={styles.floatingButton}>
          <TouchableOpacity
            style={styles.fabButton}
            onPress={() => router.push('/(patient)/(tabs)/home')}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>
      )}
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  listContainer: {
    padding: 20,
    paddingBottom: 80,
  },
  appointmentCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
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
  dateTimeContainer: {
    flex: 1,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  timeText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
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
  appointmentBody: {
    marginBottom: 16,
  },
  doctorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  doctorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  doctorDetails: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  speciality: {
    fontSize: 14,
    color: '#666',
  },
  appointmentDetails: {
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  appointmentFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#FFE8E6',
  },
  cancelButtonText: {
    color: '#FF5722',
    fontSize: 14,
    fontWeight: '600',
  },
  rescheduleButton: {
    backgroundColor: '#E6F3FF',
  },
  rescheduleButtonText: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '600',
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  reviewButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyActionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  emptyActionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});