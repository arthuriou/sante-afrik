import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { apiService, RendezVous } from '../../../services/api';

export default function PatientAppointmentsScreen() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<'upcoming' | 'past'>('upcoming');
  const [loading, setLoading] = useState(false);
  const [allAppointments, setAllAppointments] = useState<RendezVous[]>([]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const userDataRaw = await AsyncStorage.getItem('userData');
      const userData = userDataRaw ? JSON.parse(userDataRaw) : null;
      const patientId = userData?.patient?.idpatient || userData?.idutilisateur;
      if (!patientId) return;
      const resp = await apiService.getRendezVousPatient(patientId);
      setAllAppointments(resp.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const tabs = [
    { id: 'upcoming', label: 'À venir', count: allAppointments.filter(a => a.statut !== 'TERMINE' && a.statut !== 'ANNULE').length },
    { id: 'past', label: 'Passés', count: allAppointments.filter(a => a.statut === 'TERMINE' || a.statut === 'ANNULE').length },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return '#34C759';
      case 'pending':
        return '#FF9500';
      case 'cancelled':
        return '#FF3B30';
      case 'completed':
        return '#8E8E93';
      default:
        return '#8E8E93';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmé';
      case 'pending':
        return 'En attente';
      case 'cancelled':
        return 'Annulé';
      case 'completed':
        return 'Terminé';
      default:
        return status;
    }
  };

  const renderAppointment = ({ item }: { item: RendezVous }) => (
    <View style={styles.appointmentCard}>
      <View style={styles.appointmentHeader}>
        <View style={styles.doctorInfo}>
          <Text style={styles.doctorName}>{item.medecin?.prenom} {item.medecin?.nom}</Text>
          <Text style={styles.doctorSpecialty}>{item.medecin?.specialites?.map(s => s.nom).join(', ')}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.statut) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.statut) }]}>
            {getStatusText(item.statut)}
          </Text>
        </View>
      </View>

      <View style={styles.appointmentDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color="#8E8E93" />
          <Text style={styles.detailText}>{new Date(item.dateheure).toLocaleString()}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={16} color="#8E8E93" />
          <Text style={styles.detailText}>{item.medecin?.cabinet?.nom || '—'}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="map-outline" size={16} color="#8E8E93" />
          <Text style={styles.detailText}>{item.medecin?.cabinet?.adresse || '—'}</Text>
        </View>
      </View>

      <View style={styles.appointmentActions}>
        {item.statut === 'CONFIRME' && (
          <>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="videocam-outline" size={16} color="#007AFF" />
              <Text style={styles.actionButtonText}>Vidéo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="call-outline" size={16} color="#007AFF" />
              <Text style={styles.actionButtonText}>Appeler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="navigate-outline" size={16} color="#007AFF" />
              <Text style={styles.actionButtonText}>Itinéraire</Text>
            </TouchableOpacity>
          </>
        )}
        
        {item.statut === 'TERMINE' && (
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="document-text-outline" size={16} color="#007AFF" />
            <Text style={styles.actionButtonText}>Résumé</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={async () => {
          try {
            await apiService.cancelRendezVous(item.idrendezvous);
            await loadAppointments();
          } catch {}
        }}>
          <Ionicons name="close-outline" size={16} color="#FF3B30" />
          <Text style={[styles.actionButtonText, styles.cancelButtonText]}>Annuler</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const currentAppointments = selectedTab === 'upcoming'
    ? allAppointments.filter(a => a.statut !== 'TERMINE' && a.statut !== 'ANNULE')
    : allAppointments.filter(a => a.statut === 'TERMINE' || a.statut === 'ANNULE');

  return (
    <SafeAreaView style={styles.container}>
      {/* Entrée de flow RDV */}
      <View style={styles.entryCard}>
        <Text style={styles.entryTitle}>Prendre un rendez-vous</Text>
        <Text style={styles.entrySubtitle}>Recherchez par spécialité ou par mal/symptôme</Text>
        <View style={styles.entryRow}>
          <TouchableOpacity style={[styles.entryButton, { backgroundColor: '#007AFF' }]} onPress={() => router.push('/(patient)/screens/search')}>
            <Ionicons name="medkit-outline" size={16} color="#FFFFFF" />
            <Text style={styles.entryButtonText}>Par spécialité</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.entryButton, { backgroundColor: '#10B981' }]} onPress={() => router.push('/(patient)/screens/search')}>
            <Ionicons name="pulse-outline" size={16} color="#FFFFFF" />
            <Text style={styles.entryButtonText}>Par mal</Text>
          </TouchableOpacity>
        </View>
      </View>
      {/* Onglets */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              selectedTab === tab.id && styles.tabActive
            ]}
            onPress={() => setSelectedTab(tab.id)}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === tab.id && styles.tabTextActive
              ]}
            >
              {tab.label}
            </Text>
            {tab.count > 0 && (
              <View style={[
                styles.tabBadge,
                selectedTab === tab.id && styles.tabBadgeActive
              ]}>
                <Text style={[
                  styles.tabBadgeText,
                  selectedTab === tab.id && styles.tabBadgeTextActive
                ]}>
                  {tab.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Contenu */}
      <View style={styles.content}>
        {currentAppointments.length > 0 ? (
          <FlatList
            data={currentAppointments}
            renderItem={renderAppointment}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.appointmentsList}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color="#8E8E93" />
            <Text style={styles.emptyTitle}>
              {selectedTab === 'upcoming' ? 'Aucun rendez-vous à venir' : 'Aucun rendez-vous passé'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {selectedTab === 'upcoming' 
                ? 'Prenez rendez-vous avec un médecin pour commencer'
                : 'Vos rendez-vous passés apparaîtront ici'
              }
            </Text>
            {selectedTab === 'upcoming' && (
              <TouchableOpacity 
                style={styles.bookButton}
                onPress={() => router.push('/(patient)/screens/search')}
              >
                <Text style={styles.bookButtonText}>Prendre rendez-vous</Text>
              </TouchableOpacity>
            )}
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  entryCard: { backgroundColor: 'white', margin: 16, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  entryTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 4 },
  entrySubtitle: { fontSize: 13, color: '#6B7280', marginBottom: 12 },
  entryRow: { flexDirection: 'row', gap: 10 },
  entryButton: { flexDirection: 'row', gap: 6, alignItems: 'center', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, flex: 1, justifyContent: 'center' },
  entryButtonText: { color: '#FFFFFF', fontWeight: '600' },
  headerCtaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  bookNow: { flexDirection: 'row', gap: 6, alignItems: 'center', backgroundColor: '#007AFF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  bookNowText: { color: '#FFFFFF', fontWeight: '600' },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8E8E93',
  },
  tabTextActive: {
    color: 'white',
  },
  tabBadge: {
    backgroundColor: '#8E8E93',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  tabBadgeActive: {
    backgroundColor: 'white',
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  tabBadgeTextActive: {
    color: '#007AFF',
  },
  content: {
    flex: 1,
  },
  appointmentsList: {
    padding: 16,
  },
  appointmentCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  doctorSpecialty: {
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
  appointmentDetails: {
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
  appointmentActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionButtonText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '500',
    color: '#007AFF',
  },
  cancelButton: {
    backgroundColor: '#FF3B3020',
  },
  cancelButtonText: {
    color: '#FF3B30',
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
    marginBottom: 24,
  },
  bookButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  bookButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
