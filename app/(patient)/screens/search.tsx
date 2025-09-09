import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    FlatList,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function PatientSearchScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState(null);

  const specialties = [
    { id: 1, name: 'Médecine générale', icon: 'medical-outline' },
    { id: 2, name: 'Cardiologie', icon: 'heart-outline' },
    { id: 3, name: 'Dermatologie', icon: 'body-outline' },
    { id: 4, name: 'Gynécologie', icon: 'female-outline' },
    { id: 5, name: 'Pédiatrie', icon: 'people-outline' },
    { id: 6, name: 'Ophtalmologie', icon: 'eye-outline' },
    { id: 7, name: 'Neurologie', icon: 'brain-outline' },
    { id: 8, name: 'Orthopédie', icon: 'fitness-outline' },
  ];

  const doctors = [
    {
      id: 1,
      name: 'Dr. Martin Dubois',
      specialty: 'Médecine générale',
      rating: 4.8,
      reviews: 127,
      distance: '0.3 km',
      price: '25€',
      nextAvailable: 'Aujourd\'hui 14h30',
      verified: true,
    },
    {
      id: 2,
      name: 'Dr. Sophie Laurent',
      specialty: 'Cardiologie',
      rating: 4.9,
      reviews: 89,
      distance: '0.8 km',
      price: '50€',
      nextAvailable: 'Demain 09h00',
      verified: true,
    },
    {
      id: 3,
      name: 'Dr. Pierre Moreau',
      specialty: 'Dermatologie',
      rating: 4.7,
      reviews: 203,
      distance: '1.2 km',
      price: '40€',
      nextAvailable: 'Mercredi 16h00',
      verified: false,
    },
  ];

  const renderDoctor = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.doctorCard}
      onPress={() => router.push('/(patient)/screens/doctor-detail')}
    >
      <View style={styles.doctorImageContainer}>
        <View style={styles.doctorImage}>
          <Ionicons name="person" size={30} color="#8E8E93" />
        </View>
        {item.verified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark" size={12} color="white" />
          </View>
        )}
      </View>
      
      <View style={styles.doctorInfo}>
        <View style={styles.doctorHeader}>
          <Text style={styles.doctorName}>{item.name}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={styles.rating}>{item.rating}</Text>
            <Text style={styles.reviews}>({item.reviews})</Text>
          </View>
        </View>
        
        <Text style={styles.doctorSpecialty}>{item.specialty}</Text>
        
        <View style={styles.doctorDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="location-outline" size={14} color="#8E8E93" />
            <Text style={styles.detailText}>{item.distance}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={14} color="#8E8E93" />
            <Text style={styles.detailText}>{item.nextAvailable}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="card-outline" size={14} color="#8E8E93" />
            <Text style={styles.detailText}>{item.price}</Text>
          </View>
        </View>
      </View>
      
      <TouchableOpacity style={styles.bookButton}>
        <Text style={styles.bookButtonText}>Réserver</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Barre de recherche */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color="#8E8E93" />
            <TextInput
              style={styles.searchInput}
              placeholder="Nom du médecin, spécialité..."
              placeholderTextColor="#8E8E93"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#8E8E93" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filtres */}
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity style={styles.filterButton}>
              <Ionicons name="location-outline" size={16} color="#007AFF" />
              <Text style={styles.filterButtonText}>Localisation</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.filterButton}>
              <Ionicons name="time-outline" size={16} color="#007AFF" />
              <Text style={styles.filterButtonText}>Disponibilité</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.filterButton}>
              <Ionicons name="card-outline" size={16} color="#007AFF" />
              <Text style={styles.filterButtonText}>Prix</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.filterButton}>
              <Ionicons name="star-outline" size={16} color="#007AFF" />
              <Text style={styles.filterButtonText}>Note</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Spécialités */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Spécialités</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {specialties.map((specialty) => (
              <TouchableOpacity
                key={specialty.id}
                style={[
                  styles.specialtyCard,
                  selectedSpecialty === specialty.id && styles.specialtyCardSelected
                ]}
                onPress={() => setSelectedSpecialty(
                  selectedSpecialty === specialty.id ? null : specialty.id as any
                )}
              >
                <Ionicons
                  name={specialty.icon as any}
                  size={24}
                  color={selectedSpecialty === specialty.id ? 'white' : '#007AFF'}
                />
                <Text
                  style={[
                    styles.specialtyName,
                    selectedSpecialty === specialty.id && styles.specialtyNameSelected
                  ]}
                >
                  {specialty.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Résultats */}
        <View style={styles.section}>
          <View style={styles.resultsHeader}>
            <Text style={styles.sectionTitle}>Médecins disponibles</Text>
            <Text style={styles.resultsCount}>{doctors.length} résultats</Text>
          </View>
          
          <FlatList
            data={doctors}
            renderItem={renderDoctor}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
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
  searchContainer: {
    padding: 16,
    backgroundColor: 'white',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#000',
  },
  filtersContainer: {
    paddingVertical: 16,
    paddingLeft: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  filterButtonText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  specialtyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  specialtyCardSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  specialtyName: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  specialtyNameSelected: {
    color: 'white',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultsCount: {
    fontSize: 14,
    color: '#8E8E93',
  },
  doctorCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  doctorImageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  doctorImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
  },
  doctorInfo: {
    flex: 1,
  },
  doctorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  reviews: {
    marginLeft: 4,
    fontSize: 12,
    color: '#8E8E93',
  },
  doctorSpecialty: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  doctorDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  detailText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#8E8E93',
  },
  bookButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  bookButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
