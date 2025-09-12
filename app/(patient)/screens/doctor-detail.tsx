import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
    Dimensions,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
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
        const dateFin = in7.toISOString().slice(0, 10);
        const resp = await apiService.getCreneauxDisponibles(doctorId, dateDebut, dateFin);
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
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* En-tête du médecin */}
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
          
          <Text style={styles.doctorName}>{doctorFromParam ? `${doctorFromParam.prenom} ${doctorFromParam.nom}` : 'Médecin'}</Text>
          <Text style={styles.doctorSpecialty}>{doctorFromParam?.specialites?.map(s => s.nom).join(', ') || 'Spécialité'}</Text>
          
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#FFD700" />
            {/* Placeholders de note/avis si non fournis par l'API */}
            <Text style={styles.rating}>4.8</Text>
            <Text style={styles.reviews}>(127 avis)</Text>
          </View>
          
          {doctorFromParam?.experience != null && (
            <Text style={styles.experience}>{doctorFromParam.experience} ans d'expérience</Text>
          )}
        </View>

        {/* Informations de contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations de contact</Text>
          <View style={styles.contactInfo}>
            <View style={styles.contactItem}>
              <Ionicons name="location-outline" size={20} color="#007AFF" />
              <Text style={styles.contactText}>{doctorFromParam?.cabinet?.adresse || 'Adresse indisponible'}</Text>
            </View>
            <View style={styles.contactItem}>
              <Ionicons name="call-outline" size={20} color="#007AFF" />
              <Text style={styles.contactText}>{doctorFromParam?.email || 'Email indisponible'}</Text>
            </View>
            <View style={styles.contactItem}>
              <Ionicons name="language-outline" size={20} color="#007AFF" />
              <Text style={styles.contactText}>{doctorFromParam?.cabinet?.nom || 'Cabinet'}</Text>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>À propos</Text>
          {doctorFromParam?.biographie && (
            <Text style={styles.description}>{doctorFromParam.biographie}</Text>
          )}
        </View>

        {/* Formation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Formation</Text>
          {/* À remplir si l'API fournit la formation */}
        </View>

        {/* Certifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Certifications</Text>
          {/* À remplir si l'API fournit les certifications */}
        </View>

        {/* Créneaux disponibles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Créneaux disponibles</Text>
          <View style={styles.timeSlotsGrid}>
            {loading ? (
              <Text style={{ color: '#8E8E93' }}>Chargement...</Text>
            ) : (
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
            )}
          </View>
        </View>

        {/* Avis des patients */}
        <View style={styles.section}>
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

        {/* Bouton de réservation */}
        <View style={styles.bookingContainer}>
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    backgroundColor: 'white',
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  doctorImageContainer: {
    position: 'relative',
    marginBottom: 16,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
  },
  doctorName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  doctorSpecialty: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rating: {
    marginLeft: 4,
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  reviews: {
    marginLeft: 4,
    fontSize: 14,
    color: '#8E8E93',
  },
  experience: {
    fontSize: 14,
    color: '#8E8E93',
  },
  section: {
    backgroundColor: 'white',
    marginTop: 8,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  contactInfo: {
    gap: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#8E8E93',
  },
  description: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  educationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  educationText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#8E8E93',
  },
  certificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  certificationText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#8E8E93',
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlot: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: (width - 64) / 3,
    alignItems: 'center',
  },
  timeSlotUnavailable: {
    backgroundColor: '#E5E5EA',
  },
  timeSlotSelected: {
    backgroundColor: '#007AFF',
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  timeSlotTextUnavailable: {
    color: '#8E8E93',
  },
  timeSlotTextSelected: {
    color: 'white',
  },
  reviewCard: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reviewPatient: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  reviewRating: {
    flexDirection: 'row',
  },
  reviewDate: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 8,
  },
  reviewComment: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 18,
  },
  bookingContainer: {
    backgroundColor: 'white',
    marginTop: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  bookButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginLeft: 16,
  },
  bookButtonDisabled: {
    backgroundColor: '#E5E5EA',
  },
  bookButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
