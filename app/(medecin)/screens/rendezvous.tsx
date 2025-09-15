import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { apiService, RendezVous } from '../../../services/api';

export default function MedecinRendezVousScreen() {
  const [rendezVous, setRendezVous] = useState<RendezVous[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'aujourdhui' | 'semaine' | 'tous'>('aujourdhui');

  // Charger les rendez-vous au montage
  useEffect(() => {
    loadRendezVous();
  }, []);

  const loadRendezVous = async () => {
    try {
      setLoading(true);
      
      // Récupérer les rendez-vous du médecin connecté
      const response = await apiService.getRendezVousMedecin();
      console.log('Rendez-vous médecin:', response.data);
      
      setRendezVous(response.data || []);
      
    } catch (error) {
      console.error('Erreur lors du chargement des rendez-vous:', error);
      Alert.alert('Erreur', 'Impossible de charger les rendez-vous');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRendezVous();
    setRefreshing(false);
  };

  const handleConfirmerRdv = async (rdvId: string) => {
    try {
      await apiService.confirmerRendezVous(rdvId);
      Alert.alert('Succès', 'Rendez-vous confirmé');
      loadRendezVous();
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de confirmer le rendez-vous');
    }
  };

  const handleAnnulerRdv = async (rdvId: string) => {
    try {
      await apiService.annulerRendezVous(rdvId);
      Alert.alert('Succès', 'Rendez-vous annulé');
      loadRendezVous();
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible d\'annuler le rendez-vous');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'EN_ATTENTE': return '#F59E0B';
      case 'CONFIRME': return '#10B981';
      case 'ANNULE': return '#EF4444';
      case 'TERMINE': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getStatusText = (statut: string) => {
    switch (statut) {
      case 'EN_ATTENTE': return 'En attente';
      case 'CONFIRME': return 'Confirmé';
      case 'ANNULE': return 'Annulé';
      case 'TERMINE': return 'Terminé';
      default: return statut;
    }
  };

  const renderRendezVous = ({ item }: { item: RendezVous }) => (
    <View style={styles.rdvCard}>
      <View style={styles.rdvHeader}>
        <View style={styles.patientInfo}>
          <Text style={styles.patientName}>
            {item.patient?.prenom || 'Patient'} {item.patient?.nom || ''}
          </Text>
          {item.patient?.telephone ? (
            <Text style={styles.patientContact}>{item.patient.telephone}</Text>
          ) : null}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.statut) }]}>
          <Text style={styles.statusText}>{getStatusText(item.statut)}</Text>
        </View>
      </View>

      <View style={styles.rdvDetails}>
        <View style={styles.timeInfo}>
          <Ionicons name="time" size={16} color="#6B7280" />
          <Text style={styles.timeText}>
            {formatTime(item.dateheure)} ({item.duree} min)
          </Text>
        </View>
        <View style={styles.dateInfo}>
          <Ionicons name="calendar" size={16} color="#6B7280" />
          <Text style={styles.dateText}>{formatDate(item.dateheure)}</Text>
        </View>
      </View>

      <Text style={styles.motifText}>{item.motif}</Text>

      {item.statut === 'EN_ATTENTE' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.confirmButton]}
            onPress={() => handleConfirmerRdv(item.idrendezvous)}
          >
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Confirmer</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={() => handleAnnulerRdv(item.idrendezvous)}
          >
            <Ionicons name="close" size={16} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const filteredRendezVous = rendezVous.filter(rdv => {
    const rdvDate = new Date(rdv.dateheure);
    const today = new Date();
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    switch (selectedTab) {
      case 'aujourdhui':
        return rdvDate.toDateString() === today.toDateString();
      case 'semaine':
        return rdvDate >= today && rdvDate <= weekFromNow;
      case 'tous':
        return true;
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#34C759" />
          <Text style={styles.loadingText}>Chargement des rendez-vous...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mes Rendez-vous</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/(medecin)/screens/creneaux' as any)}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'aujourdhui' && styles.activeTab]}
          onPress={() => setSelectedTab('aujourdhui')}
        >
          <Text style={[styles.tabText, selectedTab === 'aujourdhui' && styles.activeTabText]}>
            Aujourd'hui
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'semaine' && styles.activeTab]}
          onPress={() => setSelectedTab('semaine')}
        >
          <Text style={[styles.tabText, selectedTab === 'semaine' && styles.activeTabText]}>
            Cette semaine
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'tous' && styles.activeTab]}
          onPress={() => setSelectedTab('tous')}
        >
          <Text style={[styles.tabText, selectedTab === 'tous' && styles.activeTabText]}>
            Tous
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredRendezVous}
        renderItem={renderRendezVous}
        keyExtractor={(item) => item.idrendezvous}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyText}>Aucun rendez-vous</Text>
            <Text style={styles.emptySubtext}>
              {selectedTab === 'aujourdhui' 
                ? 'Aucun rendez-vous aujourd\'hui'
                : selectedTab === 'semaine'
                ? 'Aucun rendez-vous cette semaine'
                : 'Aucun rendez-vous trouvé'
              }
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  addButton: {
    backgroundColor: '#2E7CF6',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#2E7CF6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: { color: '#FFFFFF' },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  rdvCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E5EAF0',
  },
  rdvHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  patientContact: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  rdvDetails: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  timeText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },
  motifText: {
    fontSize: 14,
    color: '#374151',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 0.45,
    justifyContent: 'center',
  },
  confirmButton: {
    backgroundColor: '#10B981',
  },
  cancelButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
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
