import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { apiService, User } from '../../../services/api';

export default function PatientHomeScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [nextAppointment, setNextAppointment] = useState<any | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const patientId = useMemo(() => (currentUser?.patient?.idpatient ? currentUser.patient.idpatient : null), [currentUser]);

  useEffect(() => {
    (async () => {
      try {
        const profile = await apiService.getProfile();
        setCurrentUser(profile.data);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    if (!patientId) return;
    (async () => {
      try {
        const list = await apiService.getRendezVousPatient();
        const upcoming = (list?.data || list || [])
          .filter((r: any) => new Date(r.dateheure) > new Date())
          .sort((a: any, b: any) => new Date(a.dateheure).getTime() - new Date(b.dateheure).getTime())[0];
        setNextAppointment(upcoming || null);
      } catch {}
    })();
  }, [patientId]);

  const nextAppointmentDate = useMemo(() => {
    if (!nextAppointment) return '';
    const d = new Date(nextAppointment.dateheure);
    return d.toLocaleString();
  }, [nextAppointment]);

  const onSearch = useCallback(async (text: string) => {
    setQuery(text);
    if (!text || text.trim().length < 2) {
      setResults([]);
      return;
    }
    
    try {
      setLoading(true);
      
      // Recherche simple : chercher des médecins directement
      const medecinsResp = await apiService.getApprovedMedecinsSearch({ 
        q: text.trim(), 
        page: 1, 
        limit: 20 
      });
      
      const allResults: any[] = [];
      
      // Ajouter les médecins trouvés
      if (medecinsResp?.data) {
        medecinsResp.data.forEach((medecin: any) => {
          allResults.push({ ...medecin, _type: 'medecin' });
        });
      }
      
      // Si pas assez de résultats, chercher par spécialités
      if (allResults.length < 10) {
        try {
          const specialitesResp = await apiService.getApprovedMedecinsSearch({ q: text.trim(), page: 1, limit: 1 });
          
          // simplification: on garde la recherche médecins
        } catch (e) {
          console.log('Erreur recherche spécialités:', e);
        }
      }
      
      // Si toujours pas assez, chercher par maux
      // on retire les recherches avancées (spécialités/maux) non supportées par l'API
      
      setResults(allResults.slice(0, 20));
    } catch (e) {
      console.log('Erreur recherche générale:', e);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const quickActions = [
    { id: 1, title: 'Prendre RDV', subtitle: 'Réserver en ligne', icon: 'calendar-outline', color: '#007AFF' },
    { id: 2, title: 'Urgences', subtitle: 'Appeler le 15', icon: 'call-outline', color: '#FF3B30' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Bonjour</Text>
          <Text style={styles.headerSubtitle}>Comment pouvons-nous vous aider aujourd'hui ?</Text>
        </View>

        {/* Prochaine consultation */}
        <View style={styles.nextAppointmentSection}>
          <View style={styles.nextAppointmentCard}>
            <View style={styles.nextAppointmentHeader}>
              <View style={styles.nextAppointmentIcon}>
                <Ionicons name="calendar" size={24} color="#007AFF" />
              </View>
              <Text style={styles.nextAppointmentTitle}>Prochain rendez-vous</Text>
            </View>
            
            {nextAppointment ? (
              <View style={styles.nextAppointmentContent}>
                <Text style={styles.doctorName}>{nextAppointment.medecin?.prenom} {nextAppointment.medecin?.nom}</Text>
                <Text style={styles.appointmentDate}>{nextAppointmentDate}</Text>
                {nextAppointment?.motif ? (
                  <Text style={styles.appointmentMotif}>{nextAppointment.motif}</Text>
                ) : null}
              </View>
            ) : (
              <View style={styles.nextAppointmentContent}>
                <Text style={styles.noAppointmentText}>Aucun rendez-vous à venir</Text>
                <Text style={styles.noAppointmentSubtext}>Prenez rendez-vous avec un médecin</Text>
              </View>
            )}
            
            <TouchableOpacity 
              style={styles.primaryActionButton} 
              onPress={() => router.push('/(patient)/screens/search')}
            >
              <Text style={styles.primaryActionButtonText}>
                {nextAppointment ? 'Prendre un autre RDV' : 'Prendre un rendez-vous'}
              </Text>
            </TouchableOpacity>
            
            {nextAppointment && (
              <TouchableOpacity 
                style={styles.secondaryActionButton} 
                onPress={() => router.push('/(patient)/screens/appointments')}
              >
                <Text style={styles.secondaryActionButtonText}>Voir mes RDV</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Recherche */}
        <View style={styles.searchSection}>
          <View style={styles.searchCard}>
            <View style={styles.searchHeader}>
            <Ionicons name="search-outline" size={20} color="#8E8E93" />
            <TextInput
              style={styles.searchInput}
                placeholder="Rechercher un médecin, spécialité ou symptôme..."
                placeholderTextColor="#8E8E93"
                value={query}
                onChangeText={onSearch}
              />
              {loading && <ActivityIndicator size="small" color="#007AFF" />}
        </View>

            {(loading || results.length > 0) && (
              <View style={styles.searchResults}>
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#007AFF" />
                    <Text style={styles.loadingText}>Recherche en cours...</Text>
                  </View>
                ) : (
                  <View>
                    {results.map((medecin, index) => (
                      <TouchableOpacity
                        key={medecin.idmedecin || index}
                        style={styles.searchResultItem}
                        onPress={() => {
                          router.push({ 
                            pathname: '/(patient)/screens/doctor-detail', 
                            params: { 
                              doctorId: medecin.idmedecin, 
                              doctor: JSON.stringify(medecin) 
                            } 
                          } as any);
                        }}
                      >
                        <View style={styles.searchResultIcon}>
                          <Ionicons name="person-circle-outline" size={20} color="#007AFF" />
              </View>
                        <View style={styles.searchResultContent}>
                          <Text style={styles.searchResultName}>
                            {medecin.prenom} {medecin.nom}
                          </Text>
                          <Text style={styles.searchResultSubtitle}>
                            {medecin.specialites?.map((s: any) => s.nom).join(', ')}
                          </Text>
                          {medecin._context && (
                            <Text style={styles.searchResultContext}>
                              {medecin._context}
                            </Text>
                          )}
                          <Text style={styles.searchResultType}>
                            Médecin
                          </Text>
              </View>
                        <Ionicons name="chevron-forward-outline" size={16} color="#8E8E93" />
            </TouchableOpacity>
                    ))}
          </View>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Actions rapides */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity 
                key={action.id} 
                style={styles.quickActionCard}
                onPress={() => {
                  if (action.id === 1) router.push('/(patient)/screens/search');
                  if (action.id === 2) {
                    // Appeler le 15 pour les urgences
                    Alert.alert(
                      'Urgences médicales',
                      'Composez le 15 pour les urgences médicales',
                      [
                        { text: 'Annuler', style: 'cancel' },
                        { text: 'Appeler le 15', style: 'destructive', onPress: () => {
                          // TODO: Implémenter l'appel téléphonique
                          console.log('Appel du 15...');
                        }}
                      ]
                    );
                  }
                }}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: action.color + '15' }]}>
                  <Ionicons name={action.icon as any} size={24} color={action.color} />
                </View>
                <Text style={styles.quickActionTitle}>{action.title}</Text>
                <Text style={styles.quickActionSubtitle}>{action.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7', // iOS System Gray 6
  },
  scrollContent: {
    paddingBottom: 40,
  },
  
  // Header
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  headerSubtitle: {
    fontSize: 17,
    color: '#8E8E93',
    fontWeight: '400',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  
  // Next Appointment Section
  nextAppointmentSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  nextAppointmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20, // Gros coins arrondis iOS
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  nextAppointmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  nextAppointmentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  nextAppointmentTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  nextAppointmentContent: {
    marginBottom: 24,
  },
  doctorName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  appointmentDate: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  appointmentMotif: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  noAppointmentText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  noAppointmentSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  primaryActionButton: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  primaryActionButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  secondaryActionButton: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  secondaryActionButtonText: {
    color: '#007AFF',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  
  // Search Section
  searchSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  searchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 17,
    color: '#000000',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  searchResults: {
    marginTop: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  searchResultIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  searchResultContent: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  searchResultSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 2,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  searchResultContext: {
    fontSize: 12,
    color: '#FF9500',
    fontWeight: '500',
    fontStyle: 'italic',
    marginBottom: 2,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  searchResultType: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  
  // Quick Actions Section
  quickActionsSection: {
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 20,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '48%',
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  quickActionSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
});
