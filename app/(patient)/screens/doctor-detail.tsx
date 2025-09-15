import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { apiService, Medecin } from '../../../services/api';

const { width } = Dimensions.get('window');

export default function PatientDoctorDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ doctorId?: string; doctor?: string }>();
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [creneaux, setCreneaux] = useState<Array<{ idcreneau: string; debut: string; fin: string; disponible: boolean }>>([]);
  const [selectedStart, setSelectedStart] = useState<string | null>(null);
  const [selectedEnd, setSelectedEnd] = useState<string | null>(null);

  const doctorFromParam: Medecin | null = useMemo(() => {
    try {
      return params.doctor ? JSON.parse(params.doctor as string) : null;
    } catch {
      return null;
    }
  }, [params.doctor]);

  const doctorId = (params.doctorId as string) || doctorFromParam?.idmedecin;

  useEffect(() => {
    const loadSlots = async () => {
      if (!doctorId) return;
      try {
        setLoading(true);
        const today = new Date();
        const dateDebut = today.toISOString().slice(0, 10);
        const in7 = new Date(today.getTime() + 7 * 86400000);
        const resp = await apiService.getCreneauxDisponibles(doctorId, dateDebut);
        setCreneaux(resp.data || []);
      } catch (e) {
        setCreneaux([]);
      } finally {
        setLoading(false);
      }
    };
    loadSlots();
  }, [doctorId]);

  const reviews = [
    {
      id: 1,
      patient: 'Sophie M.',
      rating: 5,
      date: 'Il y a 2 jours',
      comment: 'Excellent médecin, très à l\'écoute et professionnel. Je recommande vivement.',
    },
    {
      id: 2,
      patient: 'Pierre L.',
      rating: 4,
      date: 'Il y a 1 semaine',
      comment: 'Très bon accueil et consultation de qualité. Un peu d\'attente mais ça vaut le coup.',
    },
    {
      id: 3,
      patient: 'Marie K.',
      rating: 5,
      date: 'Il y a 2 semaines',
      comment: 'Dr. Dubois est très compétent et prend le temps d\'expliquer. Je suis très satisfaite.',
    },
  ];

  const handleBookAppointment = () => {
    if (!selectedTime || !doctorId || !selectedStart) return;
    router.push({ pathname: '/(patient)/screens/appointment-motif', params: { doctorId, creneauId: selectedTime, start: selectedStart, end: selectedEnd || '' } } as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header du médecin */}
        <View style={styles.header}>
          <View style={styles.doctorImageContainer}>
            <View style={styles.doctorImage}>
              <Ionicons name="person" size={60} color="#8E8E93" />
            </View>
            {doctorFromParam?.statut === 'APPROVED' && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark" size={16} color="white" />
              </View>
            )}
          </View>
          
          <Text style={styles.doctorName}>
            Dr. {doctorFromParam ? `${doctorFromParam.prenom} ${doctorFromParam.nom}` : 'Médecin'}
          </Text>
          <Text style={styles.doctorSpecialty}>
            {doctorFromParam?.specialites?.map(s => s.nom).join(', ') || 'Spécialité'}
          </Text>
          
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.rating}>4.8</Text>
            <Text style={styles.reviews}>(127 avis)</Text>
          </View>
          
          {doctorFromParam?.experience != null && (
            <Text style={styles.experience}>{doctorFromParam.experience} ans d'expérience</Text>
          )}
        </View>

        {/* Informations de contact */}
        <View style={styles.section}>
          <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Informations de contact</Text>
          <View style={styles.contactInfo}>
            <View style={styles.contactItem}>
                <View style={styles.contactIcon}>
              <Ionicons name="location-outline" size={20} color="#007AFF" />
                </View>
                <View style={styles.contactDetails}>
                  <Text style={styles.contactLabel}>Cabinet</Text>
                  <Text style={styles.contactText}>{doctorFromParam?.cabinet?.nom || 'Cabinet médical'}</Text>
                  <Text style={styles.contactSubtext}>{doctorFromParam?.cabinet?.adresse || 'Adresse indisponible'}</Text>
                </View>
              </View>
              
              <View style={styles.contactItem}>
                <View style={styles.contactIcon}>
                  <Ionicons name="mail-outline" size={20} color="#007AFF" />
                </View>
                <View style={styles.contactDetails}>
                  <Text style={styles.contactLabel}>Email</Text>
                  <Text style={styles.contactText}>{doctorFromParam?.email || 'Email indisponible'}</Text>
                </View>
            </View>
              
            <View style={styles.contactItem}>
                <View style={styles.contactIcon}>
              <Ionicons name="call-outline" size={20} color="#007AFF" />
                </View>
                <View style={styles.contactDetails}>
                  <Text style={styles.contactLabel}>Téléphone</Text>
                  <Text style={styles.contactText}>Téléphone indisponible</Text>
                </View>
            </View>
            </View>
          </View>
        </View>

        {/* À propos */}
        {doctorFromParam?.biographie && (
        <View style={styles.section}>
            <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>À propos</Text>
              <Text style={styles.description}>{doctorFromParam.biographie}</Text>
        </View>
            </View>
        )}

        {/* Créneaux disponibles */}
        <View style={styles.section}>
          <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Créneaux disponibles</Text>
          <View style={styles.timeSlotsGrid}>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#007AFF" />
                  <Text style={styles.loadingText}>Chargement des créneaux...</Text>
                </View>
              ) : creneaux.length > 0 ? (
                creneaux.map((slot) => {
                  const timeLabel = new Date(slot.debut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const isSelected = selectedTime === slot.idcreneau;
                  return (
              <TouchableOpacity
                      key={slot.idcreneau}
                style={[
                  styles.timeSlot,
                        !slot.disponible && styles.timeSlotUnavailable,
                        isSelected && styles.timeSlotSelected,
                      ]}
                      onPress={() => {
                        if (!slot.disponible) return;
                        setSelectedTime(slot.idcreneau);
                        setSelectedStart(slot.debut);
                        setSelectedEnd(slot.fin);
                      }}
                      disabled={!slot.disponible}
              >
                <Text
                  style={[
                    styles.timeSlotText,
                          !slot.disponible && styles.timeSlotTextUnavailable,
                          isSelected && styles.timeSlotTextSelected,
                  ]}
                >
                        {timeLabel}
                </Text>
              </TouchableOpacity>
                  );
                })
              ) : (
                <View style={styles.noSlotsContainer}>
                  <Ionicons name="calendar-outline" size={32} color="#8E8E93" />
                  <Text style={styles.noSlotsText}>Aucun créneau disponible</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Avis des patients */}
        <View style={styles.section}>
          <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Avis des patients</Text>
          {reviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewPatient}>{review.patient}</Text>
                <View style={styles.reviewRating}>
                  {[...Array(5)].map((_, i) => (
                    <Ionicons
                      key={i}
                      name="star"
                      size={14}
                      color={i < review.rating ? '#FFD700' : '#E5E5EA'}
                    />
                  ))}
                </View>
              </View>
              <Text style={styles.reviewDate}>{review.date}</Text>
              <Text style={styles.reviewComment}>{review.comment}</Text>
            </View>
          ))}
          </View>
        </View>

        {/* Bouton de réservation */}
        <View style={styles.bookingSection}>
          <View style={styles.bookingCard}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Prix de la consultation</Text>
              <Text style={styles.price}>—</Text>
          </View>
          
          <TouchableOpacity
            style={[
              styles.bookButton,
              (!selectedTime) && styles.bookButtonDisabled
            ]}
            onPress={handleBookAppointment}
            disabled={!selectedTime}
          >
            <Text style={styles.bookButtonText}>
              {selectedTime ? 'Réserver maintenant' : 'Sélectionnez un créneau'}
            </Text>
          </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7', // iOS System Gray 6
  },
  scrollContent: {
    paddingBottom: 40,
  },
  
  // Header
  header: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    marginBottom: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  doctorImageContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  doctorImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  doctorName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  doctorSpecialty: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rating: {
    marginLeft: 6,
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  reviews: {
    marginLeft: 6,
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  experience: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  
  // Sections
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20, // Gros coins arrondis iOS
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 20,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  
  // Contact Info
  contactInfo: {
    gap: 20,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contactDetails: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  contactText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  contactSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  
  // Description
  description: {
    fontSize: 16,
    color: '#8E8E93',
    lineHeight: 24,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  
  // Time Slots
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    width: '100%',
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  noSlotsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    width: '100%',
  },
  noSlotsText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8E8E93',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  timeSlot: {
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    minWidth: (width - 120) / 3,
    alignItems: 'center',
  },
  timeSlotUnavailable: {
    backgroundColor: '#E5E5EA',
  },
  timeSlotSelected: {
    backgroundColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  timeSlotText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  timeSlotTextUnavailable: {
    color: '#8E8E93',
  },
  timeSlotTextSelected: {
    color: '#FFFFFF',
  },
  
  // Reviews
  reviewCard: {
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewPatient: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  reviewRating: {
    flexDirection: 'row',
  },
  reviewDate: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  reviewComment: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  
  // Booking
  bookingSection: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  price: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  bookButton: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    paddingHorizontal: 32,
    paddingVertical: 16,
    marginLeft: 20,
  },
  bookButtonDisabled: {
    backgroundColor: '#E5E5EA',
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
});
