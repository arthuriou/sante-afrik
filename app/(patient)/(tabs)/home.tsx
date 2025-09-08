import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  FlatList,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { apiService, Medecin, Specialite, Cabinet } from '../../../services/api';
import { Ionicons } from '@expo/vector-icons';

interface MedecinWithDetails extends Medecin {
  utilisateur?: {
    nom: string;
    prenom: string;
    email: string;
    photoprofil?: string;
  };
  cabinet_nom?: string;
  cabinet_adresse?: string;
  specialites?: Specialite[];
}

export default function PatientHomeScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [medecins, setMedecins] = useState<MedecinWithDetails[]>([]);
  const [specialites, setSpecialites] = useState<Specialite[]>([]);
  const [selectedSpecialite, setSelectedSpecialite] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSpecialites();
    loadMedecins();
  }, []);

  const loadSpecialites = async () => {
    try {
      const response = await apiService.getSpecialites();
      setSpecialites(response.data);
    } catch (error) {
      console.error('Erreur chargement spécialités:', error);
    }
  };

  const loadMedecins = async (params?: {
    search?: string;
    specialite?: string;
  }) => {
    setLoading(true);
    try {
      const response = await apiService.getMedecins({
        limit: 20,
        search: params?.search,
        specialite: params?.specialite,
      });
      setMedecins(response.data);
    } catch (error) {
      console.error('Erreur chargement médecins:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadMedecins({
      search: searchQuery,
      specialite: selectedSpecialite,
    });
  };

  const renderSpecialiteChip = ({ item }: { item: Specialite }) => (
    <TouchableOpacity
      style={[
        styles.specialiteChip,
        selectedSpecialite === item.idspecialite && styles.specialiteChipActive,
      ]}
      onPress={() => {
        const newSpecialite = selectedSpecialite === item.idspecialite ? '' : item.idspecialite;
        setSelectedSpecialite(newSpecialite);
        loadMedecins({
          search: searchQuery,
          specialite: newSpecialite,
        });
      }}
    >
      <Text
        style={[
          styles.specialiteChipText,
          selectedSpecialite === item.idspecialite && styles.specialiteChipTextActive,
        ]}
      >
        {item.nom}
      </Text>
    </TouchableOpacity>
  );

  const renderMedecinCard = ({ item }: { item: MedecinWithDetails }) => (
    <TouchableOpacity
      style={styles.medecinCard}
      onPress={() => router.push(`/(patient)/medecin/${item.idmedecin}`)}
    >
      <View style={styles.medecinHeader}>
        <View style={styles.medecinAvatar}>
          {item.utilisateur?.photoprofil ? (
            <Image
              source={{ uri: item.utilisateur.photoprofil }}
              style={styles.avatarImage}
            />
          ) : (
            <Ionicons name="person" size={30} color="#666" />
          )}
        </View>
        <View style={styles.medecinInfo}>
          <Text style={styles.medecinName}>
            {item.utilisateur?.prenom} {item.utilisateur?.nom}
          </Text>
          <View style={styles.medecinMeta}>
            <Ionicons name="medical" size={16} color="#007AFF" />
            <Text style={styles.medecinSpeciality}>
              {item.specialites?.map(s => s.nom).join(', ') || 'Médecine générale'}
            </Text>
          </View>
          <Text style={styles.medecinExperience}>
            {item.experience} ans d'expérience
          </Text>
        </View>
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text style={styles.rating}>4.8</Text>
        </View>
      </View>

      {item.cabinet_nom && (
        <View style={styles.cabinetInfo}>
          <Ionicons name="business-outline" size={16} color="#666" />
          <Text style={styles.cabinetName}>{item.cabinet_nom}</Text>
        </View>
      )}

      {item.cabinet_adresse && (
        <View style={styles.locationInfo}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={styles.location}>{item.cabinet_adresse}</Text>
        </View>
      )}

      <View style={styles.cardFooter}>
        <View style={styles.availabilityInfo}>
          <Ionicons name="time-outline" size={16} color="#4CAF50" />
          <Text style={styles.availabilityText}>Disponible aujourd'hui</Text>
        </View>
        <TouchableOpacity
          style={styles.appointmentButton}
          onPress={() => router.push(`/(patient)/medecin/${item.idmedecin}`)}
        >
          <Text style={styles.appointmentButtonText}>Prendre RDV</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Trouver un médecin</Text>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => router.push('/(patient)/(tabs)/profile')}
        >
          <Ionicons name="person-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un médecin, spécialité..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                setSearchQuery('');
                loadMedecins();
              }}
            >
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
        >
          <Ionicons name="search" size={20} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.specialitesSection}>
        <Text style={styles.sectionTitle}>Spécialités</Text>
        <FlatList
          horizontal
          data={specialites}
          renderItem={renderSpecialiteChip}
          keyExtractor={(item) => item.idspecialite}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.specialitesList}
        />
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickActionCard}
          onPress={() => router.push('/(patient)/emergency')}
        >
          <Ionicons name="warning" size={24} color="#FF5722" />
          <Text style={styles.quickActionText}>Urgences</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionCard}
          onPress={() => router.push('/(patient)/teleconsultation')}
        >
          <Ionicons name="videocam" size={24} color="#4CAF50" />
          <Text style={styles.quickActionText}>Téléconsultation</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionCard}
          onPress={() => router.push('/(patient)/(tabs)/appointments')}
        >
          <Ionicons name="calendar" size={24} color="#007AFF" />
          <Text style={styles.quickActionText}>Mes RDV</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.medecinsList}>
        <View style={styles.resultsHeader}>
          <Text style={styles.sectionTitle}>Médecins recommandés</Text>
          <Text style={styles.resultsCount}>
            {medecins.length} résultat{medecins.length > 1 ? 's' : ''}
          </Text>
        </View>

        <FlatList
          data={medecins}
          renderItem={renderMedecinCard}
          keyExtractor={(item) => item.idmedecin}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={() => loadMedecins()}
          contentContainerStyle={styles.medecinCardsContainer}
        />
      </View>
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  profileButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    gap: 10,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 15,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    height: 45,
  },
  clearButton: {
    padding: 5,
  },
  searchButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    width: 45,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  specialitesSection: {
    backgroundColor: 'white',
    paddingVertical: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  specialitesList: {
    paddingHorizontal: 15,
  },
  specialiteChip: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 5,
  },
  specialiteChipActive: {
    backgroundColor: '#007AFF',
  },
  specialiteChipText: {
    fontSize: 14,
    color: '#666',
  },
  specialiteChipTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quickActionText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  medecinsList: {
    flex: 1,
    paddingTop: 10,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  resultsCount: {
    fontSize: 14,
    color: '#666',
  },
  medecinCardsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  medecinCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  medecinHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  medecinAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  medecinInfo: {
    flex: 1,
  },
  medecinName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  medecinMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  medecinSpeciality: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 4,
  },
  medecinExperience: {
    fontSize: 12,
    color: '#666',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    color: '#333',
    marginLeft: 4,
    fontWeight: '600',
  },
  cabinetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  cabinetName: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  location: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  availabilityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  availabilityText: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 4,
  },
  appointmentButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  appointmentButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});