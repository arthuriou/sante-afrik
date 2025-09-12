import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { apiService, Medecin } from '../../../services/api';

export default function PatientHomeScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Medecin[]>([]);

  const onSearch = useCallback(async (text: string) => {
    setQuery(text);
    if (!text || text.trim().length < 2) {
      setResults([]);
      return;
    }
    try {
      setLoading(true);
      const resp = await apiService.getApprovedMedecinsSearch({ q: text.trim(), page: 1, limit: 20 });
      setResults(resp.data || []);
    } catch (e) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

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
              placeholder="Rechercher un médecin ou une spécialité..."
              placeholderTextColor="#6B7280"
              value={query}
              onChangeText={onSearch}
            />
          </View>
          {(loading || results.length > 0) && (
            <View style={styles.searchResultsBox}>
              {loading ? (
                <ActivityIndicator size="small" color="#007AFF" />
              ) : (
                <View>
                  {results.map((item) => (
                    <TouchableOpacity
                      key={item.idmedecin}
                      style={styles.resultItem}
                      onPress={() => router.push({ pathname: '/(patient)/screens/doctor-detail', params: { doctorId: item.idmedecin, doctor: JSON.stringify(item) } } as any)}
                    >
                      <Ionicons name="person-circle-outline" size={22} color="#8E8E93" />
                      <View style={{ marginLeft: 8, flex: 1 }}>
                        <Text style={styles.resultName}>{item.prenom} {item.nom}</Text>
                        <Text style={styles.resultSubtitle}>{item.specialites?.map(s => s.nom).join(', ') || 'Médecin'}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>

        {/* Entrées rapides: Spécialité / Maux */}
        <View style={styles.section}> 
          <View style={styles.quickEntryRow}>
            <TouchableOpacity style={[styles.quickEntryCard, { borderColor: '#007AFF' }]} onPress={() => router.push('/(patient)/screens/search')}>
              <View style={[styles.quickEntryIcon, { backgroundColor: '#007AFF20' }]}>
                <Ionicons name={"medkit-outline" as unknown as any} size={22} color="#007AFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.quickEntryTitle}>Par spécialité</Text>
                <Text style={styles.quickEntrySubtitle}>Cardiologie, Dermatologie, etc.</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
            </TouchableOpacity>
          </View>

          <View style={styles.quickEntryRow}>
            <TouchableOpacity style={[styles.quickEntryCard, { borderColor: '#10B981' }]} onPress={() => router.push('/(patient)/screens/search')}>
              <View style={[styles.quickEntryIcon, { backgroundColor: '#10B98120' }]}>
                <Ionicons name={"pulse-outline" as unknown as any} size={22} color="#10B981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.quickEntryTitle}>Par mal / symptôme</Text>
                <Text style={styles.quickEntrySubtitle}>Douleur thoracique, fièvre, etc.</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Entrées rapides seules */}
        <View style={styles.section}>
          <View style={styles.quickActionsGrid}>
            {quickActions.slice(0,2).map((action) => (
              <TouchableOpacity 
                key={action.id} 
                style={styles.quickActionCard}
                onPress={() => {
                  if (action.id === 1) router.push('/(patient)/screens/search');
                  if (action.id === 2) router.push('/(patient)/screens/appointments');
                }}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: action.color + '20' }]}>
                  <Ionicons name={action.icon as any} size={24} color={action.color} />
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
                  <Ionicons name={specialty.icon as any} size={28} color={specialty.color} />
                </View>
                <Text style={styles.specialtyName}>{specialty.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Lien rapide RDV */}
        <View style={styles.sectionLarge}>
          <TouchableOpacity style={styles.appointmentCard} onPress={() => router.push('/(patient)/screens/appointments')}>
            <View style={styles.appointmentIcon}>
              <Ionicons name="calendar-outline" size={24} color="#007AFF" />
            </View>
            <View style={styles.appointmentInfo}>
              <Text style={styles.appointmentTitle}>Prendre un rendez-vous</Text>
              <Text style={styles.appointmentSpecialty}>Rechercher un professionnel et choisir un créneau</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>


        {/* À propos minimal */}
        <View style={styles.section}>
          <View style={styles.aboutCard}>
            <Ionicons name="information-circle-outline" size={22} color="#8E8E93" />
            <Text style={styles.aboutText}>SantéAfrik: vos RDV et documents médicaux, au même endroit.</Text>
          </View>
        </View>

        <View style={styles.footerSpacer} />
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
    paddingVertical: 14,
  },
  searchResultsBox: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginTop: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  resultName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  resultSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
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
    marginTop: 32,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionLarge: {
    marginTop: 40,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  quickEntryRow: {
    marginBottom: 16,
  },
  quickEntryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  quickEntryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  quickEntryTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  quickEntrySubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
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
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    width: 150,
    height: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
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
  aboutCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  aboutText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  footerSpacer: {
    height: 32,
  },
});
