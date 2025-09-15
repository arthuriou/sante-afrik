import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { apiService, Medecin, Specialite, User } from '../../../services/api';

export default function MedecinDashboardScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [medecin, setMedecin] = useState<Medecin | null>(null);
  const [specialites, setSpecialites] = useState<Specialite[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger les données du médecin au montage
  useEffect(() => {
    loadMedecinData();
  }, []);

  const loadMedecinData = async () => {
    try {
      setLoading(true);
      
      // Récupérer le profil complet du médecin
      const response = await apiService.getProfile();
      console.log('Profil médecin:', response.data);
      
      setUser(response.data);
      setMedecin(response.data.medecin || null);
      setSpecialites(response.data.medecin?.specialites || []);
      
    } catch (error) {
      console.error('Erreur lors du chargement des données médecin:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { id: 1, title: 'Rendez-vous aujourd\'hui', value: '12', icon: 'calendar-outline' as const, color: '#34C759' },
    { id: 2, title: 'Patients actifs', value: '156', icon: 'people-outline' as const, color: '#007AFF' },
    { id: 3, title: 'Revenus du mois', value: '2,450€', icon: 'card-outline' as const, color: '#FF9500' },
    { id: 4, title: 'Avis patients', value: '4.8/5', icon: 'star-outline' as const, color: '#FFD700' },
  ];

  const quickActions = [
    { id: 1, title: 'Nouveau RDV', subtitle: 'Ajouter un rendez-vous', icon: 'add-circle-outline' as const, color: '#34C759' },
    { id: 2, title: 'Mes patients', subtitle: 'Gérer mes patients', icon: 'people-outline' as const, color: '#007AFF' },
    { id: 3, title: 'Planning', subtitle: 'Voir mon planning', icon: 'calendar-outline' as const, color: '#FF9500' },
    { id: 4, title: 'Messages', subtitle: 'Messagerie', icon: 'chatbubble-outline' as const, color: '#AF52DE' },
  ];

  const upcomingAppointments = [
    {
      id: 1,
      patient: 'Marie Dupont',
      time: '09h00',
      type: 'Consultation',
      status: 'confirmed',
    },
    {
      id: 2,
      patient: 'Pierre Martin',
      time: '10h30',
      type: 'Suivi',
      status: 'confirmed',
    },
    {
      id: 3,
      patient: 'Sophie Laurent',
      time: '14h00',
      type: 'Consultation',
      status: 'pending',
    },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#34C759" />
          <Text style={styles.loadingText}>Chargement de votre profil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* En-tête */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              Bonjour, {user ? `Dr. ${user.prenom} ${user.nom}` : 'Dr. Médecin'}
            </Text>
            <Text style={styles.subtitle}>
              {specialites.length > 0 
                ? specialites.map(s => s.nom).join(', ')
                : 'Voici un aperçu de votre journée'
              }
            </Text>
            {medecin && (
              <Text style={styles.experience}>
                {medecin.experience} ans d'expérience • {medecin.statut}
              </Text>
            )}
          </View>
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => router.push('/(medecin)/screens/profile')}
          >
            <Ionicons name="person-circle" size={32} color="#34C759" />
          </TouchableOpacity>
        </View>

        {/* Statistiques */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistiques</Text>
          <View style={styles.statsGrid}>
            {stats.map((stat) => (
              <View key={stat.id} style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: stat.color + '20' }]}>
                  <Ionicons name={stat.icon} size={24} color={stat.color} />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statTitle}>{stat.title}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Actions rapides */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity 
                key={action.id} 
                style={styles.quickActionCard}
                onPress={() => {
                  if (action.id === 1) router.push('/(medecin)/screens/rendezvous');
                  if (action.id === 2) router.push('/(medecin)/screens/patients');
                }}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: action.color + '20' }]}>
                  <Ionicons name={action.icon} size={24} color={action.color} />
                </View>
                <Text style={styles.quickActionTitle}>{action.title}</Text>
                <Text style={styles.quickActionSubtitle}>{action.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Rendez-vous du jour */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Rendez-vous d'aujourd'hui</Text>
            <TouchableOpacity 
              style={styles.seeAllButton}
              onPress={() => router.push('/(medecin)/screens/rendezvous')}
            >
              <Text style={styles.seeAllText}>Voir tout</Text>
              <Ionicons name="chevron-forward" size={16} color="#34C759" />
            </TouchableOpacity>
          </View>
          
          {upcomingAppointments.map((appointment) => (
            <View key={appointment.id} style={styles.appointmentCard}>
              <View style={styles.appointmentTime}>
                <Text style={styles.timeText}>{appointment.time}</Text>
              </View>
              <View style={styles.appointmentInfo}>
                <Text style={styles.patientName}>{appointment.patient}</Text>
                <Text style={styles.appointmentType}>{appointment.type}</Text>
              </View>
              <View style={[
                styles.statusBadge,
                { backgroundColor: appointment.status === 'confirmed' ? '#34C75920' : '#FF950020' }
              ]}>
                <Text style={[
                  styles.statusText,
                  { color: appointment.status === 'confirmed' ? '#34C759' : '#FF9500' }
                ]}>
                  {appointment.status === 'confirmed' ? 'Confirmé' : 'En attente'}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Messages récents */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Messages récents</Text>
            <TouchableOpacity style={styles.seeAllButton}>
              <Text style={styles.seeAllText}>Voir tout</Text>
              <Ionicons name="chevron-forward" size={16} color="#34C759" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.messageCard}>
            <View style={styles.messageIcon}>
              <Ionicons name="chatbubble-outline" size={20} color="#34C759" />
            </View>
            <View style={styles.messageContent}>
              <Text style={styles.messageTitle}>Nouveau message de Marie Dupont</Text>
              <Text style={styles.messageText}>Bonjour docteur, j'aimerais reporter mon rendez-vous...</Text>
              <Text style={styles.messageTime}>Il y a 2 heures</Text>
            </View>
          </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 4,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    color: '#34C759',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
  appointmentCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  appointmentTime: {
    width: 60,
    alignItems: 'center',
  },
  timeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#34C759',
  },
  appointmentInfo: {
    flex: 1,
    marginLeft: 16,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  appointmentType: {
    fontSize: 14,
    color: '#8E8E93',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  messageCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  messageIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#34C75920',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  messageContent: {
    flex: 1,
  },
  messageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  messageTime: {
    fontSize: 12,
    color: '#8E8E93',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
    fontFamily: 'System',
  },
  experience: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
    fontFamily: 'System',
  },
});
