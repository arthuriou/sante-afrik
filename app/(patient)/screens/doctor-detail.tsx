import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');

export default function PatientDoctorDetailScreen() {
  const router = useRouter();
  const [selectedTime, setSelectedTime] = useState<number | null>(null);

  const doctor = {
    id: 1,
    name: 'Dr. Martin Dubois',
    specialty: 'Médecine générale',
    rating: 4.8,
    reviews: 127,
    experience: '15 ans d\'expérience',
    price: '25€',
    nextAvailable: 'Aujourd\'hui 14h30',
    verified: true,
    description: 'Médecin généraliste expérimenté, spécialisé dans la médecine préventive et le suivi des patients chroniques.',
    address: '15 rue de Rivoli, 75001 Paris',
    phone: '+33 1 42 36 78 90',
    languages: ['Français', 'Anglais'],
    education: [
      'Diplôme de Médecine - Université Paris Descartes',
      'Spécialisation en Médecine Générale - Hôpital Saint-Antoine',
    ],
    certifications: [
      'Certification en Diabétologie',
      'Formation en Télémédecine',
    ],
  };

  const timeSlots = [
    { id: 1, time: '09h00', available: true },
    { id: 2, time: '09h30', available: false },
    { id: 3, time: '10h00', available: true },
    { id: 4, time: '10h30', available: true },
    { id: 5, time: '11h00', available: false },
    { id: 6, time: '11h30', available: true },
    { id: 7, time: '14h00', available: true },
    { id: 8, time: '14h30', available: true },
    { id: 9, time: '15h00', available: false },
    { id: 10, time: '15h30', available: true },
  ];

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
    if (selectedTime) {
      // Ici, vous navigueriez vers l'écran de réservation
      router.push({ pathname: '/(patient)/screens/appointments' } as any);
    }
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
            {doctor.verified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark" size={16} color="white" />
              </View>
            )}
          </View>
          
          <Text style={styles.doctorName}>{doctor.name}</Text>
          <Text style={styles.doctorSpecialty}>{doctor.specialty}</Text>
          
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.rating}>{doctor.rating}</Text>
            <Text style={styles.reviews}>({doctor.reviews} avis)</Text>
          </View>
          
          <Text style={styles.experience}>{doctor.experience}</Text>
        </View>

        {/* Informations de contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations de contact</Text>
          <View style={styles.contactInfo}>
            <View style={styles.contactItem}>
              <Ionicons name="location-outline" size={20} color="#007AFF" />
              <Text style={styles.contactText}>{doctor.address}</Text>
            </View>
            <View style={styles.contactItem}>
              <Ionicons name="call-outline" size={20} color="#007AFF" />
              <Text style={styles.contactText}>{doctor.phone}</Text>
            </View>
            <View style={styles.contactItem}>
              <Ionicons name="language-outline" size={20} color="#007AFF" />
              <Text style={styles.contactText}>{doctor.languages.join(', ')}</Text>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>À propos</Text>
          <Text style={styles.description}>{doctor.description}</Text>
        </View>

        {/* Formation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Formation</Text>
          {doctor.education.map((edu, index) => (
            <View key={index} style={styles.educationItem}>
              <Ionicons name="school-outline" size={16} color="#8E8E93" />
              <Text style={styles.educationText}>{edu}</Text>
            </View>
          ))}
        </View>

        {/* Certifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Certifications</Text>
          {doctor.certifications.map((cert, index) => (
            <View key={index} style={styles.certificationItem}>
              <Ionicons name="ribbon-outline" size={16} color="#8E8E93" />
              <Text style={styles.certificationText}>{cert}</Text>
            </View>
          ))}
        </View>

        {/* Créneaux disponibles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Créneaux disponibles</Text>
          <View style={styles.timeSlotsGrid}>
            {timeSlots.map((slot) => (
              <TouchableOpacity
                key={slot.id}
                style={[
                  styles.timeSlot,
                  !slot.available && styles.timeSlotUnavailable,
                  selectedTime === slot.id && styles.timeSlotSelected,
                ]}
                onPress={() => slot.available && setSelectedTime(slot.id)}
                disabled={!slot.available}
              >
                <Text
                  style={[
                    styles.timeSlotText,
                    !slot.available && styles.timeSlotTextUnavailable,
                    selectedTime === slot.id && styles.timeSlotTextSelected,
                  ]}
                >
                  {slot.time}
                </Text>
              </TouchableOpacity>
            ))}
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
            <Text style={styles.price}>{doctor.price}</Text>
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
