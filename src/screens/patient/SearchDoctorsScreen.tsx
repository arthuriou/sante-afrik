import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { apiService } from '../../services/apiService';
import { AppDispatch, RootState } from '../../store';
import { fetchAvailableSlots } from '../../store/slices/appointmentSlice';
import { Medecin, Specialite } from '../../types';

export default function SearchDoctorsScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  const { availableSlots, loading } = useSelector((state: RootState) => state.appointments);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<Specialite | null>(null);
  const [doctors, setDoctors] = useState<Medecin[]>([]);
  const [specialties, setSpecialties] = useState<Specialite[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    loadSpecialties();
  }, []);

  const loadSpecialties = async () => {
    try {
      const response = await apiService.getSpecialties();
      console.log('📋 Réponse spécialités:', response.data);
      setSpecialties(response.data?.data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des spécialités:', error);
      setSpecialties([]); // S'assurer que specialties reste un tableau
    }
  };

  const searchDoctors = async () => {
    if (!searchQuery.trim() && !selectedSpecialty) {
      Alert.alert('Erreur', 'Veuillez entrer un nom de médecin ou sélectionner une spécialité');
      return;
    }

    setSearchLoading(true);
    try {
      const params = {
        q: searchQuery.trim(),
        specialite_id: selectedSpecialty?.id,
        limit: 20,
      };
      
      const response = await apiService.searchDoctors(params);
      setDoctors(response.data);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de rechercher les médecins');
      console.error('Erreur recherche:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const selectDoctor = async (doctor: Medecin) => {
    try {
      // Charger les créneaux disponibles pour ce médecin
      dispatch(fetchAvailableSlots(doctor.idMedecin));
      navigation.navigate('DoctorDetail' as never, { doctor } as never);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les informations du médecin');
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSelectedSpecialty(null);
    setDoctors([]);
  };

  const renderSpecialtyFilter = () => (
    <View style={styles.filterContainer}>
      <Text style={styles.filterTitle}>Spécialité</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.specialtyList}>
        <TouchableOpacity
          style={[styles.specialtyChip, !selectedSpecialty && styles.specialtyChipActive]}
          onPress={() => setSelectedSpecialty(null)}
        >
          <Text style={[styles.specialtyChipText, !selectedSpecialty && styles.specialtyChipTextActive]}>
            Toutes
          </Text>
        </TouchableOpacity>
        {specialties && specialties.length > 0 ? specialties.map((specialty) => (
          <TouchableOpacity
            key={specialty.id}
            style={[
              styles.specialtyChip,
              selectedSpecialty?.id === specialty.id && styles.specialtyChipActive
            ]}
            onPress={() => setSelectedSpecialty(specialty)}
          >
            <Text style={[
              styles.specialtyChipText,
              selectedSpecialty?.id === specialty.id && styles.specialtyChipTextActive
            ]}>
              {specialty.nom}
            </Text>
          </TouchableOpacity>
        )) : null}
      </ScrollView>
    </View>
  );

  const renderDoctorCard = ({ item: doctor }: { item: Medecin }) => (
    <TouchableOpacity
      style={styles.doctorCard}
      onPress={() => selectDoctor(doctor)}
    >
      <View style={styles.doctorInfo}>
        <View style={styles.doctorHeader}>
          <Text style={styles.doctorName}>
            Dr. {doctor.prenom} {doctor.nom}
          </Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#f39c12" />
            <Text style={styles.rating}>4.8</Text>
          </View>
        </View>
        
        <Text style={styles.specialty}>{doctor.specialite?.nom}</Text>
        
        {doctor.cabinet && (
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={16} color="#7f8c8d" />
            <Text style={styles.location}>
              {doctor.cabinet.ville}, {doctor.cabinet.codePostal}
            </Text>
          </View>
        )}
        
        <View style={styles.doctorDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={16} color="#7f8c8d" />
            <Text style={styles.detailText}>
              {doctor.experience} ans d'expérience
            </Text>
          </View>
          
          {doctor.tarifConsultation && (
            <View style={styles.detailItem}>
              <Ionicons name="cash-outline" size={16} color="#7f8c8d" />
              <Text style={styles.detailText}>
                {doctor.tarifConsultation}€/consultation
              </Text>
            </View>
          )}
        </View>
        
        {doctor.description && (
          <Text style={styles.description} numberOfLines={2}>
            {doctor.description}
          </Text>
        )}
      </View>
      
      <Ionicons name="chevron-forward" size={20} color="#bdc3c7" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#7f8c8d" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un médecin..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={searchDoctors}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <Ionicons name="close-circle" size={20} color="#7f8c8d" />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity
          style={[styles.searchButton, searchLoading && styles.searchButtonDisabled]}
          onPress={searchDoctors}
          disabled={searchLoading}
        >
          <Ionicons name="search" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Specialty Filter */}
      {renderSpecialtyFilter()}

      {/* Results */}
      <View style={styles.resultsContainer}>
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsTitle}>
            {doctors.length} médecin{doctors.length > 1 ? 's' : ''} trouvé{doctors.length > 1 ? 's' : ''}
          </Text>
        </View>

        {searchLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Recherche en cours...</Text>
          </View>
        ) : doctors.length > 0 ? (
          <FlatList
            data={doctors}
            renderItem={renderDoctorCard}
            keyExtractor={(item) => item.idMedecin}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.doctorsList}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={64} color="#bdc3c7" />
            <Text style={styles.emptyStateTitle}>Aucun médecin trouvé</Text>
            <Text style={styles.emptyStateText}>
              Essayez de modifier vos critères de recherche
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 25,
    paddingHorizontal: 15,
    marginRight: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2c3e50',
  },
  searchButton: {
    backgroundColor: '#3498db',
    padding: 12,
    borderRadius: 25,
  },
  searchButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  filterContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  specialtyList: {
    flexDirection: 'row',
  },
  specialtyChip: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e1e8ed',
    marginRight: 10,
  },
  specialtyChipActive: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  specialtyChipText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  specialtyChipTextActive: {
    color: 'white',
    fontWeight: '500',
  },
  resultsContainer: {
    flex: 1,
    padding: 15,
  },
  resultsHeader: {
    marginBottom: 15,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  doctorsList: {
    paddingBottom: 20,
  },
  doctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e1e8ed',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    color: '#f39c12',
    marginLeft: 4,
    fontWeight: '500',
  },
  specialty: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: '500',
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  location: {
    fontSize: 14,
    color: '#7f8c8d',
    marginLeft: 5,
  },
  doctorDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    marginBottom: 5,
  },
  detailText: {
    fontSize: 12,
    color: '#7f8c8d',
    marginLeft: 5,
  },
  description: {
    fontSize: 14,
    color: '#2c3e50',
    lineHeight: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 15,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 20,
  },
});
