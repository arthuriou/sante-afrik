import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { apiService, Maux, Medecin, Specialite } from '../../../services/api';

export default function PatientSearchScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'specialites' | 'maux'>('specialites');
  const [searchQuery, setSearchQuery] = useState('');
  const [specialties, setSpecialties] = useState<Specialite[]>([]);
  const [maux, setMaux] = useState<Maux[]>([]);
  const [doctors, setDoctors] = useState<Medecin[]>([]);
  const [loading, setLoading] = useState(false);
  const [cabinetId, setCabinetId] = useState<string | undefined>(undefined);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [selectedMal, setSelectedMal] = useState<string | null>(null);

  // Charger les spécialités
  const loadSpecialties = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 Chargement des spécialités...');
      const response = await apiService.getSpecialites();
      console.log('✅ Spécialités reçues:', response);
      setSpecialties(response.data || []);
      console.log('📋 Spécialités dans le state:', response.data?.length || 0);
    } catch (error) {
      console.error('❌ Erreur chargement spécialités:', error);
      Alert.alert('Erreur', 'Impossible de charger les spécialités');
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger les maux
  const loadMaux = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 Chargement des maux...');
      const response = await apiService.getMaux();
      console.log('✅ Maux reçus:', response);
      setMaux(response.data || []);
      console.log('📋 Maux dans le state:', response.data?.length || 0);
    } catch (error) {
      console.error('❌ Erreur chargement maux:', error);
      Alert.alert('Erreur', 'Impossible de charger les maux');
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger les médecins (par spécialité et/ou recherche)
  const loadDoctors = useCallback(async (specialtyId?: string, query?: string) => {
    try {
      setLoading(true);
      console.log('🔄 Chargement des médecins (endpoint spécialités)...', { specialtyId, query, cabinetId });
      if (!specialtyId) {
        setDoctors([]);
        return;
      }
      const response = await apiService.getMedecinsBySpecialiteId(specialtyId, {
        q: query || undefined,
        page: 1,
        limit: 50,
        cabinet_id: cabinetId,
      });
      console.log('✅ Médecins reçus:', response);
      setDoctors(response.data || []);
      console.log('👨‍⚕️ Médecins dans le state:', response.data?.length || 0);
    } catch (error) {
      console.error('❌ Erreur chargement médecins:', error);
      Alert.alert('Erreur', 'Impossible de charger les médecins');
    } finally {
      setLoading(false);
    }
  }, [cabinetId]);

  useEffect(() => {
    if (activeTab === 'specialites') {
      loadSpecialties();
    } else {
      loadMaux();
    }
  }, [activeTab, loadSpecialties, loadMaux]);

  useEffect(() => {
    // Charger à chaque changement de spécialité ou de texte de recherche
    if (activeTab === 'specialites') {
      loadDoctors(selectedSpecialty || undefined, searchQuery || undefined);
    }
  }, [activeTab, selectedSpecialty, searchQuery, loadDoctors]);

  const renderDoctor = ({ item }: { item: Medecin }) => (
    <TouchableOpacity 
      style={styles.doctorCard}
      onPress={() => router.push({
        pathname: '/(patient)/screens/doctor-detail',
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
          <Text style={styles.doctorName}>{item.prenom} {item.nom}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={styles.rating}>4.8</Text>
            <Text style={styles.reviews}>({item.experience})</Text>
          </View>
        </View>
        
        <Text style={styles.doctorSpecialty}>
          {item.specialites?.map(s => s.nom).join(', ') || 'Médecine générale'}
        </Text>
        
        <View style={styles.doctorDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="briefcase-outline" size={14} color="#8E8E93" />
            <Text style={styles.detailText}>{item.experience} ans exp.</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="document-text-outline" size={14} color="#8E8E93" />
            <Text style={styles.detailText}>N° {item.numordre}</Text>
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

  const renderSpecialty = ({ item }: { item: Specialite }) => (
    <TouchableOpacity
      style={[
        styles.specialtyCard,
        selectedSpecialty === item.idspecialite && styles.specialtyCardSelected
      ]}
      onPress={() => setSelectedSpecialty(
        selectedSpecialty === item.idspecialite ? null : item.idspecialite
      )}
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

  const renderMal = ({ item }: { item: Maux }) => (
    <TouchableOpacity
      style={[
        styles.specialtyCard,
        selectedMal === item.idmaux && styles.specialtyCardSelected
      ]}
      onPress={() => setSelectedMal(
        selectedMal === item.idmaux ? null : item.idmaux
      )}
    >
      <Ionicons
        name="medical-outline"
        size={24}
        color={selectedMal === item.idmaux ? 'white' : '#007AFF'}
      />
      <Text
        style={[
          styles.specialtyName,
          selectedMal === item.idmaux && styles.specialtyNameSelected
        ]}
      >
        {item.nom}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header iOS-style */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Recherche</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {/* Barre de recherche iOS-style */}
        <View style={styles.searchSection}>
          <View style={styles.searchCard}>
          <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color="#8E8E93" />
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
        </View>

        {/* Onglets iOS-style */}
        <View style={styles.tabsSection}>
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'specialites' && styles.activeTab]}
            onPress={() => setActiveTab('specialites')}
          >
            <Text style={[styles.tabText, activeTab === 'specialites' && styles.activeTabText]}>
              Spécialités
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'maux' && styles.activeTab]}
            onPress={() => setActiveTab('maux')}
          >
            <Text style={[styles.tabText, activeTab === 'maux' && styles.activeTabText]}>
              Maux
            </Text>
          </TouchableOpacity>
          </View>
        </View>

        {/* Contenu selon l'onglet actif */}
        {activeTab === 'specialites' ? (
          <>
            {/* Spécialités */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="medical" size={20} color="#007AFF" />
              <Text style={styles.sectionTitle}>Choisir une spécialité</Text>
              </View>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#007AFF" />
                </View>
              ) : (
                <View style={styles.specialtiesContainer}>
                  <FlatList
                    data={specialties}
                    renderItem={renderSpecialty}
                    keyExtractor={(item) => item.idspecialite}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.specialtiesList}
                  />
                </View>
              )}
            </View>

            {/* Médecins de la spécialité sélectionnée */}
            {selectedSpecialty && (
              <View style={styles.section}>
                <View style={styles.resultsHeader}>
                  <View style={styles.resultsHeaderLeft}>
                    <Ionicons name="people" size={20} color="#007AFF" />
                  <Text style={styles.sectionTitle}>Médecins disponibles</Text>
                  </View>
                  <View style={styles.resultsBadge}>
                    <Text style={styles.resultsCount}>{doctors.length}</Text>
                  </View>
                </View>
                
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                  </View>
                ) : (
                  <View style={styles.doctorsContainer}>
                  <FlatList
                    data={doctors}
                    renderItem={renderDoctor}
                    keyExtractor={(item) => item.idmedecin}
                    scrollEnabled={false}
                    showsVerticalScrollIndicator={false}
                  />
                  </View>
                )}
              </View>
            )}
          </>
        ) : (
          <>
            {/* Maux */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="medical-outline" size={20} color="#007AFF" />
              <Text style={styles.sectionTitle}>Choisir un mal</Text>
              </View>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#007AFF" />
                </View>
              ) : (
                <View style={styles.mauxContainer}>
                <FlatList
                  data={maux}
                  renderItem={renderMal}
                  keyExtractor={(item) => item.idmaux}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.mauxList}
                />
                </View>
              )}
            </View>

            {/* Message pour les maux */}
            {selectedMal && (
              <View style={styles.section}>
                <View style={styles.infoCard}>
                  <View style={styles.infoHeader}>
                    <Ionicons name="information-circle" size={24} color="#007AFF" />
                    <Text style={styles.infoTitle}>Information</Text>
                  </View>
                  <Text style={styles.infoText}>
                    Sélectionnez un mal pour voir les médecins spécialisés dans ce domaine.
                  </Text>
                </View>
              </View>
            )}
          </>
        )}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 0.5,
    borderBottomColor: '#C6C6C8',
  },
  headerTitle: {
    flex: 1,
    fontSize: 34,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  content: {
    flex: 1,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  searchCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1D1D1F',
  },
  tabsSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
  },
  activeTabText: {
    color: 'white',
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1D1D1F',
    marginLeft: 8,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  specialtiesContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  specialtiesList: {
    paddingRight: 16,
  },
  specialtyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
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
    fontWeight: '600',
    color: '#007AFF',
  },
  specialtyNameSelected: {
    color: 'white',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultsBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  resultsCount: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  doctorsContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  doctorCard: {
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorImageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  doctorImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
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
    color: '#1D1D1F',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
    color: '#1D1D1F',
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
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  bookButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  mauxContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  mauxList: {
    paddingRight: 16,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
});
