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

interface Ordonnance {
  idordonnance: string;
  date_ordonnance: string;
  medicaments: Array<{
    nom: string;
    dosage: string;
    forme: string;
    quantite: number;
    posologie: string;
    duree: number;
    renouvelable: boolean;
  }>;
  instructions?: string;
  duree_traitement: number;
  renouvelable: boolean;
  statut: 'BROUILLON' | 'FINALISE' | 'ENVOYE';
  medecin_nom: string;
  medecin_prenom: string;
  created_at: string;
  envoye_le?: string;
}

export default function PatientOrdonnancesScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [ordonnances, setOrdonnances] = useState<Ordonnance[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadOrdonnances = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Chargement des ordonnances patient...');
      
      const response = await apiService.getOrdonnancesPatient();
      const ordonnancesData = response.data || [];
      
      // Filtrer seulement les ordonnances envoyées pour le patient
      const envoyees = ordonnancesData.filter((o: any) => o.statut === 'ENVOYE');
      
      setOrdonnances(envoyees);
      console.log('✅ Ordonnances chargées:', envoyees.length);
    } catch (err: any) {
      console.error('❌ Erreur chargement ordonnances:', err);
      setError(err.message || 'Erreur lors du chargement des ordonnances');
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger au montage du composant
  useEffect(() => {
    loadOrdonnances();
  }, [loadOrdonnances]);

  // Recharger automatiquement quand on revient sur l'écran
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 Focus sur l\'écran ordonnances patient - rechargement automatique');
      loadOrdonnances();
    }, [loadOrdonnances])
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ENVOYE':
        return '#34C759';
      case 'FINALISE':
        return '#007AFF';
      case 'BROUILLON':
        return '#FF9500';
      default:
        return '#8E8E93';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ENVOYE':
        return 'Reçue';
      case 'FINALISE':
        return 'Finalisée';
      case 'BROUILLON':
        return 'En préparation';
      default:
        return status;
    }
  };

  const renderOrdonnance = ({ item }: { item: Ordonnance }) => (
    <TouchableOpacity style={styles.ordonnanceCard}>
      <View style={styles.ordonnanceHeader}>
        <View style={styles.medecinInfo}>
          <Ionicons name="medical" size={20} color="#007AFF" />
          <Text style={styles.medecinName}>
            Dr. {item.medecin_prenom} {item.medecin_nom}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.statut) }]}>
          <Text style={styles.statusText}>{getStatusText(item.statut)}</Text>
        </View>
      </View>

      <View style={styles.ordonnanceDate}>
        <Ionicons name="calendar-outline" size={16} color="#8E8E93" />
        <Text style={styles.dateText}>
          {formatDate(item.date_ordonnance)}
        </Text>
      </View>

      <View style={styles.medicamentsSection}>
        <View style={styles.sectionHeader}>
          <Ionicons name="pills" size={16} color="#34C759" />
          <Text style={styles.sectionTitle}>Médicaments prescrits</Text>
        </View>
        {item.medicaments.slice(0, 2).map((medicament, index) => (
          <View key={index} style={styles.medicamentItem}>
            <Text style={styles.medicamentName}>{medicament.nom}</Text>
            <Text style={styles.medicamentDetails}>
              {medicament.dosage} - {medicament.posologie}
            </Text>
          </View>
        ))}
        {item.medicaments.length > 2 && (
          <Text style={styles.moreMedicaments}>
            +{item.medicaments.length - 2} autre(s) médicament(s)
          </Text>
        )}
      </View>

      {item.instructions && (
        <View style={styles.instructionsSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle-outline" size={16} color="#FF9500" />
            <Text style={styles.sectionTitle}>Instructions</Text>
          </View>
          <Text style={styles.instructionsText} numberOfLines={3}>
            {item.instructions}
          </Text>
        </View>
      )}

      <View style={styles.ordonnanceFooter}>
        <View style={styles.footerInfo}>
          <Text style={styles.footerText}>
            Durée: {item.duree_traitement} jour(s)
          </Text>
          <Text style={styles.footerText}>
            {item.renouvelable ? 'Renouvelable' : 'Non renouvelable'}
          </Text>
        </View>
        {item.envoye_le && (
          <Text style={styles.sentDate}>
            Reçue le {formatDate(item.envoye_le)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes Ordonnances</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={loadOrdonnances}>
            <Ionicons name="refresh" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Contenu */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Chargement des ordonnances...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={64} color="#FF3B30" />
            <Text style={styles.errorTitle}>Erreur de chargement</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadOrdonnances}>
              <Text style={styles.retryButtonText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        ) : ordonnances.length > 0 ? (
          <FlatList
            data={ordonnances}
            renderItem={renderOrdonnance}
            keyExtractor={(item) => item.idordonnance}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.ordonnancesList}
            ListFooterComponent={<View style={{ height: 48 }} />}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={64} color="#8E8E93" />
            <Text style={styles.emptyTitle}>Aucune ordonnance</Text>
            <Text style={styles.emptySubtitle}>
              Vos ordonnances reçues apparaîtront ici
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
  ordonnancesList: {
    padding: 16,
  },
  ordonnanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  ordonnanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  medecinInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  medecinName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginLeft: 8,
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
  ordonnanceDate: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateText: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 6,
  },
  medicamentsSection: {
    marginBottom: 12,
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
    marginLeft: 6,
  },
  medicamentItem: {
    marginBottom: 6,
  },
  medicamentName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  medicamentDetails: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  moreMedicaments: {
    fontSize: 12,
    color: '#007AFF',
    fontStyle: 'italic',
    marginTop: 4,
  },
  instructionsSection: {
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  ordonnanceFooter: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingTop: 12,
  },
  footerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  footerText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  sentDate: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: '500',
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
