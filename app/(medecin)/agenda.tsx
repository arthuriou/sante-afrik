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
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService, RendezVous, Creneau, User } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

interface AgendaDay {
  date: Date;
  appointments: RendezVous[];
  creneaux: Creneau[];
}

export default function AgendaScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [agendaData, setAgendaData] = useState<AgendaDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateSlotModal, setShowCreateSlotModal] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (user?.medecin?.idmedecin) {
      loadAgendaData();
    }
  }, [user, selectedDate]);

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

  const loadAgendaData = async () => {
    if (!user?.medecin?.idmedecin) return;

    setLoading(true);
    try {
      // Charger les rendez-vous du médecin
      const appointmentsResponse = await apiService.getRendezVousMedecin(user.medecin.idmedecin);
      
      // Charger les créneaux disponibles
      const dateDebut = selectedDate.toISOString().split('T')[0];
      const dateFin = new Date(selectedDate);
      dateFin.setDate(dateFin.getDate() + 7);
      
      const creneauxResponse = await apiService.getCreneauxDisponibles(
        user.medecin.idmedecin,
        dateDebut,
        dateFin.toISOString().split('T')[0]
      );

      // Organiser les données par jour
      const days: AgendaDay[] = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(selectedDate);
        date.setDate(selectedDate.getDate() + i);
        
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);

        const dayAppointments = appointmentsResponse.data.filter(rdv => {
          const rdvDate = new Date(rdv.dateheure);
          return rdvDate >= dayStart && rdvDate < dayEnd;
        });

        const dayCreneaux = creneauxResponse.data.filter(creneau => {
          const creneauDate = new Date(creneau.debut);
          return creneauDate >= dayStart && creneauDate < dayEnd;
        });

        days.push({
          date: new Date(date),
          appointments: dayAppointments,
          creneaux: dayCreneaux,
        });
      }

      setAgendaData(days);
    } catch (error) {
      console.error('Erreur chargement agenda:', error);
      
      // Données de démonstration
      const mockDays: AgendaDay[] = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(selectedDate);
        date.setDate(selectedDate.getDate() + i);
        
        mockDays.push({
          date: new Date(date),
          appointments: i === 0 ? [
            {
              idrendezvous: '1',
              patient_id: 'patient-1',
              medecin_id: user.medecin?.idmedecin || '',
              dateheure: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 9, 0).toISOString(),
              duree: 30,
              motif: 'Consultation de routine',
              statut: 'CONFIRME',
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
          ] : [],
          creneaux: [
            {
              idcreneau: `creneau-${i}-1`,
              agenda_id: 'agenda-1',
              debut: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 14, 0).toISOString(),
              fin: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 14, 30).toISOString(),
              disponible: true,
            },
            {
              idcreneau: `creneau-${i}-2`,
              agenda_id: 'agenda-1',
              debut: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 15, 0).toISOString(),
              fin: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 15, 30).toISOString(),
              disponible: true,
            },
          ],
        });
      }
      
      setAgendaData(mockDays);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
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
        return { label: 'En attente', color: '#FF9500', backgroundColor: '#FFF9E6' };
      case 'CONFIRME':
        return { label: 'Confirmé', color: '#4CAF50', backgroundColor: '#E8F5E8' };
      case 'TERMINE':
        return { label: 'Terminé', color: '#2196F3', backgroundColor: '#E6F3FF' };
      case 'EN_COURS':
        return { label: 'En cours', color: '#9C27B0', backgroundColor: '#F3E6FF' };
      case 'ANNULE':
        return { label: 'Annulé', color: '#FF5722', backgroundColor: '#FFE8E6' };
      default:
        return { label: 'Inconnu', color: '#666', backgroundColor: '#f5f5f5' };
    }
  };

  const handlePreviousWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 7);
    setSelectedDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 7);
    setSelectedDate(newDate);
  };

  const renderAppointment = (appointment: RendezVous) => {
    const statusInfo = getStatusInfo(appointment.statut);

    return (
      <TouchableOpacity
        key={appointment.idrendezvous}
        style={[styles.appointmentItem, { backgroundColor: statusInfo.backgroundColor }]}
        onPress={() => router.push(`/(medecin)/appointment/${appointment.idrendezvous}`)}
      >
        <View style={styles.appointmentHeader}>
          <Text style={styles.appointmentTime}>{formatTime(appointment.dateheure)}</Text>
          <View style={[styles.statusDot, { backgroundColor: statusInfo.color }]} />
        </View>
        <Text style={styles.patientName}>
          {appointment.patient?.utilisateur?.prenom} {appointment.patient?.utilisateur?.nom}
        </Text>
        <Text style={styles.appointmentMotif} numberOfLines={1}>
          {appointment.motif}
        </Text>
        <Text style={styles.appointmentDuration}>{appointment.duree} min</Text>
      </TouchableOpacity>
    );
  };

  const renderCreneau = (creneau: Creneau) => (
    <TouchableOpacity
      key={creneau.idcreneau}
      style={styles.creneauItem}
      onPress={() => {
        Alert.alert('Créneau libre', `${formatTime(creneau.debut)} - ${formatTime(creneau.fin)}`);
      }}
    >
      <Text style={styles.creneauTime}>
        {formatTime(creneau.debut)} - {formatTime(creneau.fin)}
      </Text>
      <Text style={styles.creneauStatus}>Disponible</Text>
    </TouchableOpacity>
  );

  const renderAgendaDay = ({ item }: { item: AgendaDay }) => {
    const isToday = item.date.toDateString() === new Date().toDateString();

    return (
      <View style={[styles.dayContainer, isToday && styles.todayContainer]}>
        <View style={styles.dayHeader}>
          <Text style={[styles.dayTitle, isToday && styles.todayTitle]}>
            {formatDate(item.date)}
          </Text>
          {isToday && <Text style={styles.todayIndicator}>Aujourd'hui</Text>}
        </View>

        <View style={styles.dayContent}>
          {/* Rendez-vous */}
          {item.appointments.length > 0 && (
            <View style={styles.appointmentsSection}>
              <Text style={styles.sectionTitle}>Rendez-vous</Text>
              {item.appointments.map(appointment => renderAppointment(appointment))}
            </View>
          )}

          {/* Créneaux libres */}
          {item.creneaux.length > 0 && (
            <View style={styles.creneauxSection}>
              <Text style={styles.sectionTitle}>Créneaux libres</Text>
              {item.creneaux.slice(0, 3).map(creneau => renderCreneau(creneau))}
              {item.creneaux.length > 3 && (
                <Text style={styles.moreCreneaux}>
                  +{item.creneaux.length - 3} autres créneaux
                </Text>
              )}
            </View>
          )}

          {/* Jour vide */}
          {item.appointments.length === 0 && item.creneaux.length === 0 && (
            <View style={styles.emptyDay}>
              <Ionicons name="calendar-outline" size={30} color="#ccc" />
              <Text style={styles.emptyDayText}>Aucun rendez-vous</Text>
              <TouchableOpacity
                style={styles.addSlotButton}
                onPress={() => setShowCreateSlotModal(true)}
              >
                <Text style={styles.addSlotButtonText}>Ajouter des créneaux</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mon agenda</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowCreateSlotModal(true)}
        >
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.weekNavigation}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={handlePreviousWeek}
        >
          <Ionicons name="chevron-back" size={20} color="#007AFF" />
          <Text style={styles.navButtonText}>Précédent</Text>
        </TouchableOpacity>

        <Text style={styles.weekTitle}>
          Semaine du {selectedDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
        </Text>

        <TouchableOpacity
          style={styles.navButton}
          onPress={handleNextWeek}
        >
          <Text style={styles.navButtonText}>Suivant</Text>
          <Ionicons name="chevron-forward" size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={agendaData}
        renderItem={renderAgendaDay}
        keyExtractor={(item) => item.date.toISOString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.agendaContainer}
        refreshing={loading}
        onRefresh={loadAgendaData}
      />

      {/* Modal de création de créneau */}
      <Modal
        visible={showCreateSlotModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateSlotModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Créer des créneaux</Text>
              <TouchableOpacity
                onPress={() => setShowCreateSlotModal(false)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.modalText}>
                Cette fonctionnalité permettra de créer des créneaux personnalisés.
              </Text>
              
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  setShowCreateSlotModal(false);
                  router.push('/(medecin)/create-slot');
                }}
              >
                <Text style={styles.modalButtonText}>Aller aux paramètres</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  addButton: {
    padding: 8,
  },
  weekNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  navButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  weekTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  agendaContainer: {
    padding: 20,
  },
  dayContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  todayContainer: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textTransform: 'capitalize',
  },
  todayTitle: {
    color: '#007AFF',
  },
  todayIndicator: {
    fontSize: 12,
    color: '#007AFF',
    backgroundColor: '#E6F3FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontWeight: '600',
  },
  dayContent: {
    padding: 16,
  },
  appointmentsSection: {
    marginBottom: 20,
  },
  creneauxSection: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  appointmentItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  appointmentTime: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  appointmentMotif: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  appointmentDuration: {
    fontSize: 12,
    color: '#999',
  },
  creneauItem: {
    backgroundColor: '#E8F5E8',
    padding: 10,
    borderRadius: 6,
    marginBottom: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  creneauTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  creneauStatus: {
    fontSize: 12,
    color: '#4CAF50',
  },
  moreCreneaux: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  emptyDay: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyDayText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    marginBottom: 15,
  },
  addSlotButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addSlotButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalBody: {
    padding: 20,
  },
  modalText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});