import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function PatientHomeScreen() {
  const router = useRouter();

  const specialties = [
    { id: 1, name: 'Médecine générale', icon: 'medical-outline', color: '#007AFF' },
    { id: 2, name: 'Cardiologie', icon: 'heart-outline', color: '#FF3B30' },
    { id: 3, name: 'Dermatologie', icon: 'body-outline', color: '#34C759' },
    { id: 4, name: 'Gynécologie', icon: 'female-outline', color: '#FF9500' },
    { id: 5, name: 'Pédiatrie', icon: 'people-outline', color: '#AF52DE' },
    { id: 6, name: 'Ophtalmologie', icon: 'eye-outline', color: '#5AC8FA' },
  ];

  const quickActions = [
    { id: 1, title: 'Prendre RDV', subtitle: 'Réserver en ligne', icon: 'calendar-outline', color: '#007AFF' },
    { id: 2, title: 'Mes RDV', subtitle: 'Gérer mes rendez-vous', icon: 'list-outline', color: '#34C759' },
    { id: 3, title: 'Urgences', subtitle: 'Appeler le 15', icon: 'call-outline', color: '#FF3B30' },
    { id: 4, title: 'Pharmacie', subtitle: 'Trouver une pharmacie', icon: 'medical-outline', color: '#FF9500' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Barre de recherche */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color="#8E8E93" />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un médecin, une spécialité..."
              placeholderTextColor="#8E8E93"
            />
          </View>
        </View>

        {/* Message de bienvenue */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Bonjour ! 👋</Text>
          <Text style={styles.welcomeSubtitle}>
            Comment pouvons-nous vous aider aujourd'hui ?
          </Text>
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
                  if (action.id === 1) router.push('/(patient)/screens/search');
                  if (action.id === 2) router.push('/(patient)/screens/appointments');
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

        {/* Spécialités populaires */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Spécialités populaires</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.specialtiesScroll}>
            {specialties.map((specialty) => (
              <TouchableOpacity 
                key={specialty.id} 
                style={styles.specialtyCard}
                onPress={() => router.push('/(patient)/screens/search')}
              >
                <View style={[styles.specialtyIcon, { backgroundColor: specialty.color + '20' }]}>
                  <Ionicons name={specialty.icon} size={28} color={specialty.color} />
                </View>
                <Text style={styles.specialtyName}>{specialty.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Prochains rendez-vous */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prochains rendez-vous</Text>
          <View style={styles.appointmentCard}>
            <View style={styles.appointmentIcon}>
              <Ionicons name="calendar-outline" size={24} color="#007AFF" />
            </View>
            <View style={styles.appointmentInfo}>
              <Text style={styles.appointmentTitle}>Dr. Martin Dubois</Text>
              <Text style={styles.appointmentSpecialty}>Médecine générale</Text>
              <Text style={styles.appointmentDate}>Lundi 15 Janvier - 14h30</Text>
            </View>
            <TouchableOpacity 
              style={styles.appointmentButton}
              onPress={() => router.push('/(patient)/screens/appointments')}
            >
              <Ionicons name="chevron-forward-outline" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Conseils santé */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conseils santé</Text>
          <View style={styles.tipCard}>
            <View style={styles.tipIcon}>
              <Ionicons name="bulb-outline" size={24} color="#FF9500" />
            </View>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Conseil du jour</Text>
              <Text style={styles.tipText}>
                Buvez au moins 1,5L d'eau par jour pour maintenir une bonne hydratation.
              </Text>
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
  welcomeSection: {
    padding: 16,
    backgroundColor: 'white',
    marginTop: 8,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
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
  specialtiesScroll: {
    marginHorizontal: -16,
  },
  specialtyCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    alignItems: 'center',
    width: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  specialtyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  specialtyName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#000',
    textAlign: 'center',
  },
  appointmentCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  appointmentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  appointmentSpecialty: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 2,
  },
  appointmentDate: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  appointmentButton: {
    padding: 8,
  },
  tipCard: {
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
  tipIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF950020',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
});
