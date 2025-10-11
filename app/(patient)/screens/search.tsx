import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { apiService, Medecin, Specialite } from '../../../services/api';

export default function PatientSearchScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [specialties, setSpecialties] = useState<Specialite[]>([]);
  const [doctors, setDoctors] = useState<Medecin[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);

  // Charger les données au démarrage
  useEffect(() => {
    loadSpecialties();
    loadDoctors();
  }, []);

  // Charger tous les médecins
  const loadDoctors = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 Chargement de tous les médecins...');
      
      const response = await apiService.getApprovedMedecinsSearch({ 
        q: '', 
        page: 1, 
        limit: 50 
      });
      
      console.log('✅ Médecins chargés:', response.data?.length || 0);
      setDoctors(response.data || []);
    } catch (error) {
      console.error('❌ Erreur chargement médecins:', error);
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger les spécialités
  const loadSpecialties = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 Chargement des spécialités...');
      const response = await apiService.getSpecialites();
      console.log('✅ Spécialités reçues:', response);
      setSpecialties(response.data || []);
    } catch (error) {
      console.error('❌ Erreur chargement spécialités:', error);
      Alert.alert('Erreur', 'Impossible de charger les spécialités');
    } finally {
      setLoading(false);
    }
  }, []);

  // Rechercher des médecins
  const searchDoctors = useCallback(async (query?: string, specialtyId?: string) => {
    try {
      setLoading(true);
      console.log('🔄 Recherche de médecins...', { query, specialtyId });
      
      // Utiliser l'endpoint qui fonctionne déjà dans l'app
      const response = await apiService.getApprovedMedecinsSearch({ 
        q: query || '', 
        page: 1, 
        limit: 50 
      });
      
      let doctors = response.data || [];
      
      // Filtrer par spécialité si spécifiée
      if (specialtyId) {
        doctors = doctors.filter((doctor: any) => 
          doctor.specialites?.some((s: any) => s.idspecialite === specialtyId)
        );
      }
      
      console.log('✅ Médecins trouvés:', doctors.length);
      setDoctors(doctors);
    } catch (error) {
      console.error('❌ Erreur recherche médecins:', error);
      Alert.alert('Erreur', 'Impossible de rechercher des médecins');
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Recherche par spécialité
  const handleSpecialtySelect = (specialtyId: string) => {
    setSelectedSpecialty(specialtyId);
    setSearchQuery(''); // Effacer la recherche textuelle
    searchDoctors(undefined, specialtyId);
  };

  // Recherche textuelle
  const handleTextSearch = (query: string) => {
    setSearchQuery(query);
    setSelectedSpecialty(null); // Effacer la sélection de spécialité
    
    // Rechercher immédiatement si il y a du texte
    if (query.trim()) {
      searchDoctors(query.trim());
    } else {
      // Si pas de texte, charger tous les médecins
      loadDoctors();
    }
  };

  // Recherche générale (tous les médecins)
  const handleGeneralSearch = () => {
    setSearchQuery('');
    setSelectedSpecialty(null);
    loadDoctors();
  };

  const renderSpecialty = ({ item }: { item: Specialite }) => (
    <TouchableOpacity
      style={[
        styles.specialtyCard,
        selectedSpecialty === item.idspecialite && styles.specialtyCardSelected
      ]}
      onPress={() => handleSpecialtySelect(item.idspecialite)}
    >
      <Ionicons
        name="medical-outline"
        size={24}
        color={selectedSpecialty === item.idspecialite ? 'white' : '#007AFF'}
      />
      <Text
        style={[
          styles.specialtyName,
          selectedSpecialty === item.idspecialite && styles.specialtyNameSelected
        ]}
      >
        {item.nom}
      </Text>
    </TouchableOpacity>
  );

  const renderDoctor = ({ item }: { item: Medecin }) => (
    <TouchableOpacity 
      style={styles.doctorCard}
      onPress={() => router.push({
        pathname: '/(modals)/doctor-detail',
        params: { doctorId: item.idmedecin }
      })}
    >
      <View style={styles.doctorImageContainer}>
        <View style={styles.doctorImage}>
          <Ionicons name="person" size={30} color="#8E8E93" />
        </View>
        {item.statut === 'APPROVED' && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark" size={12} color="white" />
          </View>
        )}
      </View>
      
      <View style={styles.doctorInfo}>
        <View style={styles.doctorHeader}>
          <Text style={styles.doctorName}>Dr. {item.prenom} {item.nom}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={styles.rating}>4.8</Text>
            <Text style={styles.reviews}>({item.experience || 0} ans)</Text>
          </View>
        </View>
        
        <Text style={styles.doctorSpecialty}>
          {item.specialites?.map(s => s.nom).join(', ') || 'Médecine générale'}
        </Text>
        
        <View style={styles.doctorDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="briefcase-outline" size={14} color="#8E8E93" />
            <Text style={styles.detailText}>{item.experience || 0} ans exp.</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="document-text-outline" size={14} color="#8E8E93" />
            <Text style={styles.detailText}>N° {item.numordre || 'N/A'}</Text>
          </View>
          {item.cabinet?.nom && (
            <View style={styles.detailItem}>
              <Ionicons name="business-outline" size={14} color="#8E8E93" />
              <Text style={styles.detailText}>{item.cabinet.nom}</Text>
            </View>
          )}
        </View>
      </View>
      
      <TouchableOpacity style={styles.bookButton}>
        <Text style={styles.bookButtonText}>Réserver</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Barre de recherche */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#8E8E93" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un médecin..."
            placeholderTextColor="#8E8E93"
            value={searchQuery}
            onChangeText={handleTextSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleTextSearch('')}>
              <Ionicons name="close-circle" size={20} color="#8E8E93" />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity 
          style={styles.generalSearchButton}
          onPress={handleGeneralSearch}
        >
          <Text style={styles.generalSearchText}>Tous les médecins</Text>
        </TouchableOpacity>
      </View>

      {/* Spécialités */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Spécialités</Text>
        <FlatList
          data={specialties}
          renderItem={renderSpecialty}
          keyExtractor={(item) => item.idspecialite}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.specialtiesList}
        />
      </View>

      {/* Résultats */}
      <View style={styles.resultsSection}>
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsTitle}>
            {doctors.length > 0 
              ? `${doctors.length} médecin${doctors.length > 1 ? 's' : ''} trouvé${doctors.length > 1 ? 's' : ''}`
              : 'Aucun médecin trouvé'
            }
          </Text>
          {(selectedSpecialty || searchQuery) && (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={() => {
                setSelectedSpecialty(null);
                setSearchQuery('');
                setDoctors([]);
              }}
            >
              <Text style={styles.clearButtonText}>Effacer</Text>
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Recherche en cours...</Text>
          </View>
        ) : doctors.length > 0 ? (
          <FlatList
            data={doctors}
            renderItem={renderDoctor}
            keyExtractor={(item) => item.idmedecin}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.doctorsList}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="search" size={64} color="#8E8E93" />
            <Text style={styles.emptyTitle}>Aucun médecin trouvé</Text>
            <Text style={styles.emptyText}>
              Essayez de modifier votre recherche ou de sélectionner une spécialité
            </Text>
          </View>
        )}
      </View>
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    marginLeft: 8,
  },
  generalSearchButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  generalSearchText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  specialtiesList: {
    paddingHorizontal: 16,
  },
  specialtyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginRight: 12,
    minWidth: 120,
  },
  specialtyCardSelected: {
    backgroundColor: '#007AFF',
  },
  specialtyName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    marginLeft: 8,
  },
  specialtyNameSelected: {
    color: '#FFFFFF',
  },
  resultsSection: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FF3B30',
    borderRadius: 6,
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8E8E93',
  },
  doctorsList: {
    padding: 16,
  },
  doctorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  doctorImageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  doctorImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
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
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginLeft: 4,
  },
  reviews: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 4,
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
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 4,
  },
  bookButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
});