import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { apiService, Patient } from '../../../services/api';

export default function MedecinPatientsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'new' | 'old'>('all');

  // Charger les patients au montage
  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      setLoading(true);
      
      // Récupérer les patients du médecin connecté
      const response = await apiService.getPatients();
      console.log('Patients médecin:', response.data);
      
      setPatients(response.data || []);
      
    } catch (error) {
      console.error('Erreur lors du chargement des patients:', error);
      Alert.alert('Erreur', 'Impossible de charger les patients');
    } finally {
      setLoading(false);
    }
  };

  const isNewPatient = (p: Patient): boolean => {
    const anyP: any = p as any;
    const dc = anyP?.datecreation || anyP?.createdAt || anyP?.created_at;
    if (dc) {
      const created = new Date(dc).getTime();
      const days = (Date.now() - created) / (1000 * 60 * 60 * 24);
      return days <= 30; // nouvel inscrit dans les 30 derniers jours
    }
    // fallback si pas de date: considérer "nouveau" si actif et téléphone présent
    return Boolean(p.actif && p.telephone);
  };

  const filteredPatients = patients
    .filter(patient =>
      `${patient.prenom} ${patient.nom}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.telephone?.includes(searchQuery)
    )
    .filter(p => filter === 'all' ? true : filter === 'new' ? isNewPatient(p) : !isNewPatient(p));

  const handleCall = (phone?: string) => {
    if (!phone) { Alert.alert('Info', 'Numéro indisponible'); return; }
    Linking.openURL(`tel:${phone}`);
  };

  const handleSms = (phone?: string) => {
    if (!phone) { Alert.alert('Info', 'Numéro indisponible'); return; }
    Linking.openURL(`sms:${phone}`);
  };

  const renderPatient = ({ item }: { item: Patient }) => (
    <TouchableOpacity style={styles.patientCard} onPress={() => {
      Alert.alert('Patient', `${item.prenom} ${item.nom}`);
    }}>
      <View style={styles.patientHeader}>
        <View style={styles.patientInfo}>
          <Text style={styles.patientName}>{item.prenom} {item.nom}</Text>
          <Text style={styles.patientAge}>
            {item.datenaissance ? 
              new Date().getFullYear() - new Date(item.datenaissance).getFullYear() + ' ans' : 
              'Âge non renseigné'
            }
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {isNewPatient(item) && (
            <View style={[styles.statusBadge, { backgroundColor: '#007AFF20' }]}>
              <Text style={[styles.statusText, { color: '#007AFF' }]}>Nouveau</Text>
        </View>
          )}
          <View style={[styles.statusBadge, { backgroundColor: item.actif ? '#34C75920' : '#8E8E9320' }]}>
            <Text style={[styles.statusText, { color: item.actif ? '#34C759' : '#8E8E93' }]}>
              {item.actif ? 'Actif' : 'Inactif'}
          </Text>
          </View>
        </View>
      </View>

      <View style={styles.patientDetails}>
        {item.telephone && (
        <View style={styles.detailRow}>
          <Ionicons name="call-outline" size={16} color="#8E8E93" />
            <Text style={styles.detailText}>{item.telephone}</Text>
        </View>
        )}
        
        {item.email && (
        <View style={styles.detailRow}>
          <Ionicons name="mail-outline" size={16} color="#8E8E93" />
          <Text style={styles.detailText}>{item.email}</Text>
        </View>
        )}
        
        {item.genre && (
        <View style={styles.detailRow}>
            <Ionicons name="person-outline" size={16} color="#8E8E93" />
            <Text style={styles.detailText}>{item.genre}</Text>
        </View>
        )}
        
        {item.groupesanguin && (
          <View style={styles.detailRow}>
            <Ionicons name="water-outline" size={16} color="#8E8E93" />
            <Text style={styles.detailText}>Groupe sanguin: {item.groupesanguin}</Text>
          </View>
        )}
      </View>

      <View style={styles.patientActions}>
        {/* Messages */}
        <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(medecin)/screens/messages' as any)}>
          <Ionicons name="chatbubble-outline" size={16} color="#34C759" />
          <Text style={styles.actionButtonText}>Messages</Text>
        </TouchableOpacity>
        
        {/* Appeler */}
        <TouchableOpacity style={styles.actionButton} onPress={() => handleCall(item.telephone)}>
          <Ionicons name="call-outline" size={16} color="#34C759" />
          <Text style={styles.actionButtonText}>Appeler</Text>
        </TouchableOpacity>
        
        {/* RDV */}
        <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(medecin)/screens/rendezvous' as any)}>
          <Ionicons name="calendar-outline" size={16} color="#34C759" />
          <Text style={styles.actionButtonText}>RDV</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#34C759" />
          <Text style={styles.loadingText}>Chargement des patients...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Barre de recherche */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="#8E8E93" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un patient..."
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

      {/* Résumé iOS */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{patients.length}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{patients.filter(isNewPatient).length}</Text>
          <Text style={styles.summaryLabel}>Nouveaux</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{patients.filter(p => !isNewPatient(p)).length}</Text>
          <Text style={styles.summaryLabel}>Anciens</Text>
        </View>
      </View>

      {/* Filtres */}
      <View style={styles.filterRow}>
        {(['all','new','old'] as const).map(key => (
          <TouchableOpacity key={key} style={[styles.filterChip, filter===key && styles.filterChipActive]} onPress={() => setFilter(key)}>
            <Text style={[styles.filterChipText, filter===key && styles.filterChipTextActive]}>
              {key==='all' ? 'Tous' : key==='new' ? 'Nouveaux' : 'Anciens'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Statistiques rapides */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{patients.length}</Text>
          <Text style={styles.statLabel}>Patients total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{patients.filter(p => p.actif).length}</Text>
          <Text style={styles.statLabel}>Actifs</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Avec RDV</Text>
        </View>
      </View>

      {/* Liste des patients */}
      <View style={styles.patientsList}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mes patients</Text>
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="add" size={20} color="white" />
            <Text style={styles.addButtonText}>Ajouter</Text>
          </TouchableOpacity>
        </View>

        {filteredPatients.length > 0 ? (
          <FlatList
            data={filteredPatients}
            renderItem={renderPatient}
             keyExtractor={(item) => item.idpatient}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#8E8E93" />
            <Text style={styles.emptyTitle}>Aucun patient trouvé</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'Aucun patient ne correspond à votre recherche' : 'Vous n\'avez pas encore de patients'}
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
    backgroundColor: '#FFFFFF',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: 'white',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF2FF',
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
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#34C759',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
  patientsList: {
    flex: 1,
    padding: 16,
  },
  summaryRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginTop: 6 },
  summaryCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, paddingVertical: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2, borderWidth: 1, borderColor: '#F0F3F7' },
  summaryNumber: { fontSize: 18, fontWeight: '700', color: '#000' },
  summaryLabel: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginTop: 12 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#EAF2FF', borderRadius: 16 },
  filterChipActive: { backgroundColor: '#007AFF' },
  filterChipText: { color: '#0A2540', fontWeight: '600' },
  filterChipTextActive: { color: '#FFFFFF' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0A2540',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E7CF6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  patientCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E5EAF0',
  },
  patientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  patientAge: {
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
  patientDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#8E8E93',
  },
  patientActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF2FF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionButtonText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '500',
    color: '#2E7CF6',
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
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 24,
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
});
