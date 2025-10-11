import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { apiService, Medecin } from '../../services/api';

const { width } = Dimensions.get('window');

export default function PatientDoctorDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ doctorId?: string; doctor?: string }>();
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedOriginalCreneauId, setSelectedOriginalCreneauId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [creneaux, setCreneaux] = useState<Array<{ idcreneau: string; debut: string; fin: string; disponible: boolean }>>([]);
  const [selectedStart, setSelectedStart] = useState<string | null>(null);
  const [selectedEnd, setSelectedEnd] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [availableDates, setAvailableDates] = useState<string[]>(() => {
    // Générer les dates disponibles dès l'initialisation
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today.getTime() + i * 86400000);
      dates.push(date.toISOString().slice(0, 10));
    }
    return dates;
  });

  const doctorFromParam: Medecin | null = useMemo(() => {
    try {
      return params.doctor ? JSON.parse(params.doctor as string) : null;
    } catch {
      return null;
    }
  }, [params.doctor]);

  const doctorId = (params.doctorId as string) || doctorFromParam?.idmedecin;
  
  console.log('👨‍⚕️ Doctor ID debug:', { 
    paramsDoctorId: params.doctorId, 
    doctorFromParamId: doctorFromParam?.idmedecin,
    finalDoctorId: doctorId,
    doctorFromParam: doctorFromParam 
  });

  useEffect(() => {
    const loadSlots = async () => {
      if (!doctorId) return;
      try {
        setLoading(true);
        console.log('📅 Chargement des créneaux pour:', selectedDate);
        
        // Charger les créneaux pour la date sélectionnée
        console.log('🔍 Appel API créneaux:', { doctorId, selectedDate });
        
        // D'abord vérifier si le médecin a des agendas
        try {
          const agendasResp = await apiService.getAgendasMedecin(doctorId);
          console.log('📅 Agendas du médecin:', agendasResp);
        } catch (agendaError) {
          console.log('⚠️ Erreur chargement agendas:', agendaError);
        }
        
        const resp = await apiService.getCreneauxDisponibles(doctorId, selectedDate);
        console.log('📊 Réponse API créneaux:', resp);
        console.log('📊 Structure des créneaux:', JSON.stringify(resp.data, null, 2));
        
        const creneauxData = resp.data || [];
        console.log('⏰ Créneaux reçus:', creneauxData.length, creneauxData);
        
        // Mapper et découper les créneaux du backend en créneaux de 30 minutes
        const mappedCreneaux: any[] = [];
        
        creneauxData.forEach((creneau: any) => {
          const startTime = new Date(creneau.start_at || creneau.debut);
          const endTime = new Date(creneau.end_at || creneau.fin);
          const creneauId = creneau.idextra || creneau.idcreneau;
          
          // Calculer la durée en minutes
          const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
          
          console.log(`📊 Créneau: ${startTime.toLocaleTimeString()} - ${endTime.toLocaleTimeString()} (${durationMinutes}min)`);
          console.log(`🆔 ID original: ${creneauId}`);
          
          // Découper en créneaux de 30 minutes
          let currentTime = new Date(startTime);
          let slotIndex = 0;
          
          while (currentTime < endTime) {
            const slotEnd = new Date(currentTime.getTime() + 30 * 60000);
            
            // S'assurer qu'on ne dépasse pas la fin du créneau original
            if (slotEnd > endTime) break;
            
            mappedCreneaux.push({
              idcreneau: `${creneauId}_slot_${slotIndex}`,
              debut: currentTime.toISOString(),
              fin: slotEnd.toISOString(),
              disponible: creneau.visible_en_ligne !== false,
              originalCreneauId: creneauId
            });
            
            console.log(`🔪 Slot ${slotIndex}: ${currentTime.toLocaleTimeString()} - ${slotEnd.toLocaleTimeString()} (ID: ${creneauId}_slot_${slotIndex})`);
            
            currentTime = new Date(slotEnd);
            slotIndex++;
          }
        });
        
        console.log('🔄 Créneaux découpés:', mappedCreneaux.length, 'créneaux de 30min');
        console.log('🔄 Premier créneau découpé:', mappedCreneaux[0]);
        console.log('🔄 Dernier créneau découpé:', mappedCreneaux[mappedCreneaux.length - 1]);
        
        // Si pas de créneaux, créer des créneaux de test pour debug
        if (mappedCreneaux.length === 0) {
          console.log('🧪 Création de créneaux de test...');
          const testCreneaux = [];
          const baseDate = new Date(selectedDate);
          
          // Créer des créneaux de 9h à 17h toutes les 30 minutes
          for (let hour = 9; hour < 17; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
              const startTime = new Date(baseDate);
              startTime.setHours(hour, minute, 0, 0);
              
              const endTime = new Date(startTime);
              endTime.setMinutes(endTime.getMinutes() + 30);
              
              testCreneaux.push({
                idcreneau: `test_${hour}_${minute}`,
                debut: startTime.toISOString(),
                fin: endTime.toISOString(),
                disponible: Math.random() > 0.3 // 70% de chance d'être disponible
              });
            }
          }
          
          console.log('🧪 Créneaux de test créés:', testCreneaux.length);
          setCreneaux(testCreneaux);
        } else {
          setCreneaux(mappedCreneaux);
        }
        
      } catch (e) {
        console.log('❌ Erreur chargement créneaux:', e);
        setCreneaux([]);
      } finally {
        setLoading(false);
      }
    };
    loadSlots();
  }, [doctorId, selectedDate]);


  const handleBookAppointment = () => {
    if (!selectedTime || !selectedOriginalCreneauId || !doctorId || !selectedStart) {
      Alert.alert('Erreur', 'Veuillez sélectionner un créneau disponible');
      return;
    }

    console.log('🚀 Navigation vers appointment-motif avec creneauId:', selectedOriginalCreneauId);
    router.push({ 
      pathname: '/(modals)/appointment-motif', 
      params: { 
        doctorId, 
        creneauId: selectedOriginalCreneauId, // Utiliser l'ID original pour le backend
        start: selectedStart, 
        end: selectedEnd || '',
        doctor: JSON.stringify(doctorFromParam) // Passer les données du médecin
      } 
    } as any);
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
                  <Text style={styles.contactText}>{doctorFromParam?.cabinet?.telephone || 'Téléphone indisponible'}</Text>
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

        {/* Sélecteur de date */}
        <View style={styles.section}>
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Choisir une date</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.datesContainer}
            >
              {availableDates.map((date) => {
                const dateObj = new Date(date);
                const isSelected = selectedDate === date;
                const isToday = date === new Date().toISOString().slice(0, 10);
                
                return (
                  <TouchableOpacity
                    key={date}
                    style={[
                      styles.dateCard,
                      isSelected && styles.dateCardSelected
                    ]}
                    onPress={() => setSelectedDate(date)}
                  >
                    <Text style={[
                      styles.dateDay,
                      isSelected && styles.dateDaySelected
                    ]}>
                      {dateObj.toLocaleDateString('fr-FR', { weekday: 'short' })}
                    </Text>
                    <Text style={[
                      styles.dateNumber,
                      isSelected && styles.dateNumberSelected
                    ]}>
                      {dateObj.getDate()}
                    </Text>
                    <Text style={[
                      styles.dateMonth,
                      isSelected && styles.dateMonthSelected
                    ]}>
                      {dateObj.toLocaleDateString('fr-FR', { month: 'short' })}
                    </Text>
                    {isToday && (
                      <View style={styles.todayIndicator} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>

        {/* Créneaux disponibles */}
        <View style={styles.section}>
          <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            Créneaux disponibles - {new Date(selectedDate).toLocaleDateString('fr-FR', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long' 
            })}
          </Text>
          <View style={styles.timeSlotsGrid}>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#007AFF" />
                  <Text style={styles.loadingText}>Chargement des créneaux...</Text>
                </View>
              ) : creneaux.length > 0 ? (
                creneaux.map((slot) => {
                  console.log('🔍 Slot debug:', slot);
                  const timeLabel = new Date(slot.debut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const slotOriginalId = (slot as any).originalCreneauId || slot.idcreneau;
                  // Sélection basée sur l'ID unique du slot, pas sur l'originalCreneauId
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
                        // Stocker l'ID unique du slot pour la sélection visuelle
                        const creneauId = (slot as any).originalCreneauId || slot.idcreneau;
                        console.log('🎯 Créneau sélectionné - Slot ID:', slot.idcreneau, 'Original ID:', creneauId);
                        setSelectedTime(slot.idcreneau); // Pour la sélection visuelle
                        setSelectedStart(slot.debut);
                        setSelectedEnd(slot.fin);
                        // Stocker l'ID original pour l'envoi au backend
                        setSelectedOriginalCreneauId(creneauId);
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
                  <Text style={styles.noSlotsSubtext}>
                    Le médecin n'a pas encore configuré ses disponibilités pour cette date
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>


        {/* Bouton de réservation */}
        <View style={styles.bookingSection}>
          <View style={styles.bookingCard}>
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
  
  // Date Selector
  datesContainer: {
    paddingRight: 16,
  },
  dateCard: {
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    alignItems: 'center',
    minWidth: 80,
    position: 'relative',
  },
  dateCardSelected: {
    backgroundColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  dateDay: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  dateDaySelected: {
    color: '#FFFFFF',
  },
  dateNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 2,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  dateNumberSelected: {
    color: '#FFFFFF',
  },
  dateMonth: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  dateMonthSelected: {
    color: '#FFFFFF',
  },
  todayIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34C759',
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
  noSlotsSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
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
  bookButton: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    paddingHorizontal: 32,
    paddingVertical: 16,
    width: '100%',
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

