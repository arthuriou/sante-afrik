import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { apiService } from '../../services/api';

interface Consultation {
  idconsultation: string;
  diagnostique: string;
  antecedents?: string;
  traitement_propose?: string;
  prescriptions?: string;
  observations?: string;
  recommandations?: string;
  examens_complementaires?: string;
  date_consultation: string;
  statut: 'BROUILLON' | 'FINALISE' | 'ARCHIVE';
  medecin_nom: string;
  medecin_prenom: string;
  created_at: string;
  finalise_le?: string;
}

export default function PatientConsultationsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadConsultations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Chargement des consultations patient...');
      
      const response = await apiService.getConsultationsPatient();
      const consultationsData = response.data || [];
      
      // Filtrer seulement les consultations finalisées pour le patient
      const finalisees = consultationsData.filter((c: any) => c.statut === 'FINALISE');
      
      setConsultations(finalisees);
      console.log('✅ Consultations chargées:', finalisees.length);
    } catch (err: any) {
      console.error('❌ Erreur chargement consultations:', err);
      setError(err.message || 'Erreur lors du chargement des consultations');
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger au montage du composant
  useEffect(() => {
    loadConsultations();
  }, [loadConsultations]);

  // Recharger automatiquement quand on revient sur l'écran
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 Focus sur l\'écran consultations patient - rechargement automatique');
      loadConsultations();
    }, [loadConsultations])
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'FINALISE':
        return '#34C759';
      case 'BROUILLON':
        return '#FF9500';
      case 'ARCHIVE':
        return '#8E8E93';
      default:
        return '#8E8E93';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'FINALISE':
        return 'Finalisée';
      case 'BROUILLON':
        return 'En cours';
      case 'ARCHIVE':
        return 'Archivée';
      default:
        return status;
    }
  };

  const renderConsultation = ({ item }: { item: Consultation }) => (
    <View style={styles.consultationCard}>
      {/* Header avec médecin et statut */}
      <View style={styles.consultationHeader}>
        <View style={styles.medecinInfo}>
          <View style={styles.doctorIcon}>
            <Ionicons name="medical" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.doctorDetails}>
            <Text style={styles.medecinName}>
              Dr. {item.medecin_prenom} {item.medecin_nom}
            </Text>
            <View style={styles.consultationDate}>
              <Ionicons name="calendar-outline" size={14} color="#8E8E93" />
              <Text style={styles.dateText}>
                {formatDate(item.date_consultation)}
              </Text>
            </View>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.statut) }]}>
          <Text style={styles.statusText}>{getStatusText(item.statut)}</Text>
        </View>
      </View>

      {/* Contenu principal */}
      <View style={styles.consultationContent}>
        {item.diagnostique && (
          <View style={styles.infoSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text" size={16} color="#007AFF" />
              <Text style={styles.sectionTitle}>Diagnostic</Text>
            </View>
            <Text style={styles.sectionText} numberOfLines={3}>
              {item.diagnostique}
            </Text>
          </View>
        )}

        {item.traitement_propose && (
          <View style={styles.infoSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="medical" size={16} color="#34C759" />
              <Text style={styles.sectionTitle}>Traitement</Text>
            </View>
            <Text style={styles.sectionText} numberOfLines={3}>
              {item.traitement_propose}
            </Text>
          </View>
        )}

        {item.prescriptions && (
          <View style={styles.infoSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="receipt" size={16} color="#FF9500" />
              <Text style={styles.sectionTitle}>Prescriptions</Text>
            </View>
            <Text style={styles.sectionText} numberOfLines={3}>
              {item.prescriptions}
            </Text>
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={styles.consultationFooter}>
        <Text style={styles.footerText}>
          {item.finalise_le ? `Finalisée le ${formatDate(item.finalise_le)}` : 'En cours de traitement'}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Contenu */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Chargement des consultations...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={64} color="#FF3B30" />
            <Text style={styles.errorTitle}>Erreur de chargement</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadConsultations}>
              <Text style={styles.retryButtonText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        ) : consultations.length > 0 ? (
          <FlatList
            data={consultations}
            renderItem={renderConsultation}
            keyExtractor={(item) => item.idconsultation}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.consultationsList}
            ListFooterComponent={<View style={{ height: 48 }} />}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="medical-outline" size={64} color="#8E8E93" />
            <Text style={styles.emptyTitle}>Aucune consultation</Text>
            <Text style={styles.emptySubtitle}>
              Vos consultations finalisées apparaîtront ici
            </Text>
            <TouchableOpacity 
              style={styles.bookButton}
              onPress={() => router.push('/(patient)/screens/search')}
            >
              <Text style={styles.bookButtonText}>Prendre rendez-vous</Text>
            </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  headerRight: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  consultationsList: {
    padding: 16,
  },
  consultationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  consultationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  medecinInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  doctorIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  doctorDetails: {
    flex: 1,
  },
  medecinName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  consultationDate: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 4,
  },
  consultationContent: {
    padding: 16,
  },
  infoSection: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginLeft: 8,
  },
  sectionText: {
    fontSize: 14,
    color: '#3C3C43',
    lineHeight: 20,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  consultationDate: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateText: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 6,
  },
  diagnosticSection: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  diagnosticText: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  treatmentSection: {
    marginBottom: 12,
  },
  treatmentText: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  prescriptionSection: {
    marginBottom: 12,
  },
  prescriptionText: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  consultationFooter: {
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  footerText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
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
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 32,
  },
  bookButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
