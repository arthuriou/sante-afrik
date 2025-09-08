import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Image,
  Alert,
  FlatList,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService, Medecin, Creneau, User } from '../../../services/api';
import { Ionicons } from '@expo/vector-icons';

interface MedecinDetails extends Medecin {
  utilisateur?: {
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
    photoprofil?: string;
  };
  specialites?: Array<{ nom: string; description: string }>;
  cabinet?: {
    nom: string;
    adresse: string;
    telephone: string;
    horairesouverture?: any;
  };
}

export default function MedecinDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [medecin, setMedecin] = useState<MedecinDetails | null>(null);
  const [creneaux, setCreneaux] = useState<Creneau[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedCreneau, setSelectedCreneau] = useState<Creneau | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    loadUserData();
    loadMedecinDetails();
    loadCreneaux();
  }, [id, selectedDate]);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Erreur chargement utilisateur:', error);
    }
  };

  const loadMedecinDetails = async () => {
    try {
      // Simuler les détails du médecin - à remplacer par l'API réelle
      const mockMedecin: MedecinDetails = {
        idmedecin: id!,
        numordre: '12345',
        experience: 8,
        biographie: 'Médecin spécialisé en cardiologie avec 8 ans d\'expérience. Diplômé de l\'Université de Lomé.',
        statut: 'APPROVED',
        utilisateur: {
          nom: 'MARTIN',
          prenom: 'Dr. Jean',
          email: 'jean.martin@santeafrik.com',
          telephone: '+228 90 12 34 56',
        },
        specialites: [
          { nom: 'Cardiologie', description: 'Spécialiste des maladies cardiovasculaires' },
          { nom: 'Médecine interne', description: 'Médecine générale pour adultes' },
        ],
        cabinet: {
          nom: 'Centre Médical Santé Plus',
          adresse: '123 Boulevard de la République, Lomé',
          telephone: '+228 22 12 34 56',
          horairesouverture: {
            lundi: '08:00-17:00',
            mardi: '08:00-17:00',
            mercredi: '08:00-17:00',
            jeudi: '08:00-17:00',
            vendredi: '08:00-17:00',
            samedi: '08:00-12:00',
          },
        },
      };
      setMedecin(mockMedecin);
    } catch (error) {
      console.error('Erreur chargement médecin:', error);
    }
  };

  const loadCreneaux = async () => {
    try {
      const dateDebut = selectedDate.toISOString().split('T')[0];
      const dateFin = new Date(selectedDate);
      dateFin.setDate(dateFin.getDate() + 7);
      
      const response = await apiService.getCreneauxDisponibles(
        id!,
        dateDebut,
        dateFin.toISOString().split('T')[0]
      );
      
      setCreneaux(response.data);
    } catch (error) {
      console.error('Erreur chargement créneaux:', error);
      // Simuler des créneaux pour la démo
      const mockCreneaux: Creneau[] = [
        {
          idcreneau: '1',
          agenda_id: 'agenda-1',
          debut: '2024-01-15T09:00:00Z',
          fin: '2024-01-15T09:30:00Z',
          disponible: true,
        },
        {
          idcreneau: '2',
          agenda_id: 'agenda-1',
          debut: '2024-01-15T10:00:00Z',
          fin: '2024-01-15T10:30:00Z',
          disponible: true,
        },
        {
          idcreneau: '3',
          agenda_id: 'agenda-1',
          debut: '2024-01-15T14:00:00Z',
          fin: '2024-01-15T14:30:00Z',
          disponible: true,
        },
      ];
      setCreneaux(mockCreneaux);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const handleBookAppointment = () => {
    if (!selectedCreneau) {
      Alert.alert('Erreur', 'Veuillez sélectionner un créneau');
      return;
    }

    router.push({
      pathname: '/(patient)/book-appointment',
      params: {
        medecinId: id!,
        creneauId: selectedCreneau.idcreneau,
        dateTime: selectedCreneau.debut,
      },
    });
  };

  const renderCreneau = ({ item }: { item: Creneau }) => (
    <TouchableOpacity
      style={[
        styles.creneauItem,
        selectedCreneau?.idcreneau === item.idcreneau && styles.creneauItemSelected,
      ]}
      onPress={() => setSelectedCreneau(item)}
    >
      <Text
        style={[
          styles.creneauTime,
          selectedCreneau?.idcreneau === item.idcreneau && styles.creneauTimeSelected,
        ]}
      >
        {formatTime(item.debut)}
      </Text>
    </TouchableOpacity>
  );

  const generateWeekDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  };

  const renderDateSelector = () => {
    const dates = generateWeekDates();

    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dateSelector}
      >
        {dates.map((date, index) => {
          const isSelected = date.toDateString() === selectedDate.toDateString();
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dateItem,
                isSelected && styles.dateItemSelected,
              ]}
              onPress={() => setSelectedDate(date)}
            >
              <Text
                style={[
                  styles.dateDay,
                  isSelected && styles.dateDaySelected,
                ]}
              >
                {date.toLocaleDateString('fr-FR', { weekday: 'short' })}
              </Text>
              <Text
                style={[
                  styles.dateNumber,
                  isSelected && styles.dateNumberSelected,
                ]}
              >
                {date.getDate()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  if (loading || !medecin) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails du médecin</Text>
        <TouchableOpacity style={styles.favoriteButton}>
          <Ionicons name="heart-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Profil du médecin */}
        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              {medecin.utilisateur?.photoprofil ? (
                <Image
                  source={{ uri: medecin.utilisateur.photoprofil }}
                  style={styles.avatarImage}
                />
              ) : (
                <Ionicons name="person" size={40} color="#666" />
              )}
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.doctorName}>
                {medecin.utilisateur?.prenom} {medecin.utilisateur?.nom}
              </Text>
              <Text style={styles.speciality}>
                {medecin.specialites?.map(s => s.nom).join(', ')}
              </Text>
              <View style={styles.experience}>
                <Ionicons name="time-outline" size={16} color="#666" />
                <Text style={styles.experienceText}>
                  {medecin.experience} ans d'expérience
                </Text>
              </View>
            </View>
            <View style={styles.rating}>
              <Ionicons name="star" size={20} color="#FFD700" />
              <Text style={styles.ratingText}>4.8</Text>
            </View>
          </View>

          {medecin.biographie && (
            <Text style={styles.biography}>{medecin.biographie}</Text>
          )}
        </View>

        {/* Informations du cabinet */}
        {medecin.cabinet && (
          <View style={styles.cabinetSection}>
            <Text style={styles.sectionTitle}>Cabinet médical</Text>
            <View style={styles.cabinetInfo}>
              <View style={styles.cabinetItem}>
                <Ionicons name="business-outline" size={20} color="#007AFF" />
                <Text style={styles.cabinetText}>{medecin.cabinet.nom}</Text>
              </View>
              <View style={styles.cabinetItem}>
                <Ionicons name="location-outline" size={20} color="#007AFF" />
                <Text style={styles.cabinetText}>{medecin.cabinet.adresse}</Text>
              </View>
              <View style={styles.cabinetItem}>
                <Ionicons name="call-outline" size={20} color="#007AFF" />
                <Text style={styles.cabinetText}>{medecin.cabinet.telephone}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Sélection de date */}
        <View style={styles.dateSection}>
          <Text style={styles.sectionTitle}>Choisir une date</Text>
          {renderDateSelector()}
        </View>

        {/* Créneaux disponibles */}
        <View style={styles.creneauxSection}>
          <Text style={styles.sectionTitle}>
            Créneaux disponibles - {formatDate(selectedDate)}
          </Text>
          {creneaux.length > 0 ? (
            <FlatList
              data={creneaux}
              renderItem={renderCreneau}
              keyExtractor={(item) => item.idcreneau}
              numColumns={3}
              scrollEnabled={false}
              contentContainerStyle={styles.creneauxGrid}
            />
          ) : (
            <Text style={styles.noCreneaux}>
              Aucun créneau disponible pour cette date
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Bouton de réservation */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.bookButton,
            !selectedCreneau && styles.bookButtonDisabled,
          ]}
          onPress={handleBookAppointment}
          disabled={!selectedCreneau}
        >
          <Text style={styles.bookButtonText}>
            Prendre rendez-vous
            {selectedCreneau && ` à ${formatTime(selectedCreneau.debut)}`}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  favoriteButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  profileSection: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 10,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  profileInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  speciality: {
    fontSize: 16,
    color: '#007AFF',
    marginBottom: 8,
  },
  experience: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  experienceText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  rating: {
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  biography: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  cabinetSection: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  cabinetInfo: {
    gap: 12,
  },
  cabinetItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cabinetText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
    flex: 1,
  },
  dateSection: {
    backgroundColor: 'white',
    paddingVertical: 20,
    marginBottom: 10,
  },
  dateSelector: {
    paddingHorizontal: 15,
  },
  dateItem: {
    alignItems: 'center',
    padding: 15,
    marginHorizontal: 5,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    minWidth: 70,
  },
  dateItemSelected: {
    backgroundColor: '#007AFF',
  },
  dateDay: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  dateDaySelected: {
    color: 'white',
  },
  dateNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  dateNumberSelected: {
    color: 'white',
  },
  creneauxSection: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 20,
  },
  creneauxGrid: {
    gap: 10,
  },
  creneauItem: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    margin: 5,
    minHeight: 40,
    justifyContent: 'center',
  },
  creneauItemSelected: {
    backgroundColor: '#007AFF',
  },
  creneauTime: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  creneauTimeSelected: {
    color: 'white',
  },
  noCreneaux: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    padding: 20,
  },
  footer: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  bookButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookButtonDisabled: {
    backgroundColor: '#ccc',
  },
  bookButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});