import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { apiService } from '../../services/apiService';
import { Creneau, Medecin } from '../../types';

interface RouteParams {
  doctor: Medecin;
}

export default function DoctorDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { doctor } = route.params as RouteParams;

  const [availableSlots, setAvailableSlots] = useState<Creneau[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Creneau | null>(null);

  useEffect(() => {
    loadAvailableSlots();
  }, []);

  const loadAvailableSlots = async () => {
    setLoading(true);
    try {
      const response = await apiService.getAvailableSlots(doctor.idMedecin);
      setAvailableSlots(response.data);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les créneaux disponibles');
      console.error('Erreur chargement créneaux:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectSlot = (slot: Creneau) => {
    setSelectedSlot(slot);
  };

  const bookAppointment = () => {
    if (!selectedSlot) {
      Alert.alert('Erreur', 'Veuillez sélectionner un créneau');
      return;
    }
      (navigation as any).navigate('BookAppointment', { 
        doctor, 
        selectedSlot 
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

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const groupSlotsByDate = (slots: Creneau[]) => {
    const grouped: { [key: string]: Creneau[] } = {};
    slots.forEach(slot => {
      const date = new Date(slot.debut).toDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(slot);
    });
    return grouped;
  };

  const groupedSlots = groupSlotsByDate(availableSlots);

  const renderSlotGroup = ({ item }: { item: { date: string; slots: Creneau[] } }) => (
    <View style={styles.dateGroup}>
      <Text style={styles.dateTitle}>{formatDate(item.slots[0].debut)}</Text>
      <View style={styles.slotsContainer}>
        {item.slots.map((slot) => (
          <TouchableOpacity
            key={slot.idCreneau}
            style={[
              styles.slotButton,
              selectedSlot?.idCreneau === slot.idCreneau && styles.slotButtonSelected
            ]}
            onPress={() => selectSlot(slot)}
          >
            <Text style={[
              styles.slotText,
              selectedSlot?.idCreneau === slot.idCreneau && styles.slotTextSelected
            ]}>
              {formatTime(slot.debut)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Doctor Header */}
      <View style={styles.doctorHeader}>
        <View style={styles.doctorInfo}>
          <Text style={styles.doctorName}>
            Dr. {doctor.prenom} {doctor.nom}
          </Text>
          <Text style={styles.specialty}>{doctor.specialite?.nom}</Text>
          
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#f39c12" />
            <Text style={styles.rating}>4.8</Text>
            <Text style={styles.ratingCount}>(24 avis)</Text>
          </View>
        </View>
      </View>

      {/* Doctor Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informations</Text>
        
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={20} color="#7f8c8d" />
          <Text style={styles.detailText}>
            {doctor.experience} ans d'expérience
          </Text>
        </View>
        
        {doctor.tarifConsultation && (
          <View style={styles.detailRow}>
            <Ionicons name="cash-outline" size={20} color="#7f8c8d" />
            <Text style={styles.detailText}>
              {doctor.tarifConsultation}€ par consultation
            </Text>
          </View>
        )}
        
        {doctor.numeroOrdre && (
          <View style={styles.detailRow}>
            <Ionicons name="document-outline" size={20} color="#7f8c8d" />
            <Text style={styles.detailText}>
              N° Ordre: {doctor.numeroOrdre}
            </Text>
          </View>
        )}
      </View>

      {/* Cabinet Information */}
      {doctor.cabinet && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cabinet</Text>
          
          <View style={styles.cabinetInfo}>
            <Text style={styles.cabinetName}>{doctor.cabinet.nom}</Text>
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={20} color="#7f8c8d" />
              <Text style={styles.detailText}>
                {doctor.cabinet.adresse}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={20} color="#7f8c8d" />
              <Text style={styles.detailText}>
                {doctor.cabinet.ville}, {doctor.cabinet.codePostal}
              </Text>
            </View>
            {doctor.cabinet.telephone && (
              <View style={styles.detailRow}>
                <Ionicons name="call-outline" size={20} color="#7f8c8d" />
                <Text style={styles.detailText}>
                  {doctor.cabinet.telephone}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Description */}
      {doctor.description && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>À propos</Text>
          <Text style={styles.description}>{doctor.description}</Text>
        </View>
      )}

      {/* Available Slots */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Créneaux disponibles</Text>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Chargement des créneaux...</Text>
          </View>
        ) : availableSlots.length > 0 ? (
          <FlatList
            data={Object.entries(groupedSlots).map(([date, slots]) => ({ date, slots }))}
            renderItem={renderSlotGroup}
            keyExtractor={(item) => item.date}
            scrollEnabled={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color="#bdc3c7" />
            <Text style={styles.emptyStateText}>Aucun créneau disponible</Text>
          </View>
        )}
      </View>

      {/* Book Button */}
      {selectedSlot && (
        <View style={styles.bookContainer}>
          <TouchableOpacity style={styles.bookButton} onPress={bookAppointment}>
            <Text style={styles.bookButtonText}>
              Réserver ce créneau
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  doctorHeader: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  doctorInfo: {
    alignItems: 'center',
  },
  doctorName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  specialty: {
    fontSize: 16,
    color: '#3498db',
    fontWeight: '500',
    marginBottom: 10,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 16,
    color: '#f39c12',
    marginLeft: 5,
    fontWeight: 'bold',
  },
  ratingCount: {
    fontSize: 14,
    color: '#7f8c8d',
    marginLeft: 5,
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
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailText: {
    fontSize: 14,
    color: '#2c3e50',
    marginLeft: 10,
    flex: 1,
  },
  cabinetInfo: {
    marginTop: 5,
  },
  cabinetName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#2c3e50',
    lineHeight: 20,
  },
  dateGroup: {
    marginBottom: 20,
  },
  dateTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  slotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  slotButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e1e8ed',
    backgroundColor: 'white',
  },
  slotButtonSelected: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  slotText: {
    fontSize: 14,
    color: '#2c3e50',
  },
  slotTextSelected: {
    color: 'white',
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 14,
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
  },
  bookContainer: {
    padding: 20,
    backgroundColor: 'white',
    marginTop: 10,
  },
  bookButton: {
    backgroundColor: '#3498db',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  bookButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
