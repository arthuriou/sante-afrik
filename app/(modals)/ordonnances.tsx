import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { apiService } from '../../services/api';
import { Linking } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

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
  const [savedOrdonnances, setSavedOrdonnances] = useState<string[]>([]);

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
      
      // Charger les ordonnances sauvegardées localement
      await loadSavedOrdonnances();
    } catch (err: any) {
      console.error('❌ Erreur chargement ordonnances:', err);
      setError(err.message || 'Erreur lors du chargement des ordonnances');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSavedOrdonnances = useCallback(async () => {
    try {
      const documentsDir = FileSystem.documentDirectory;
      if (!documentsDir) return;
      
      const ordonnancesDir = `${documentsDir}ordonnances/`;
      
      // Créer le dossier ordonnances s'il n'existe pas
      const dirInfo = await FileSystem.getInfoAsync(ordonnancesDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(ordonnancesDir, { intermediates: true });
      }
      
      // Lister les fichiers PDF dans le dossier ordonnances
      const files = await FileSystem.readDirectoryAsync(ordonnancesDir);
      const pdfFiles = files.filter(file => file.endsWith('.pdf'));
      
      setSavedOrdonnances(pdfFiles);
      console.log('✅ Ordonnances sauvegardées trouvées:', pdfFiles.length);
    } catch (error) {
      console.error('❌ Erreur chargement ordonnances sauvegardées:', error);
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

  const handleDownloadOrdonnance = async (ordonnance: Ordonnance) => {
    try {
      console.log('🔄 Téléchargement ordonnance:', ordonnance.idordonnance);
      
      // Récupérer le PDF avec authentification
      const pdfData = await apiService.downloadOrdonnancePDF(ordonnance.idordonnance);
      console.log('✅ PDF reçu, type:', typeof pdfData);
      
      // Sauvegarder le PDF dans le dossier temporaire
      const fileName = `ordonnance_${ordonnance.idordonnance}.pdf`;
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
      
      // Si c'est un Blob, le convertir en base64
      let base64: string;
      if (pdfData instanceof Blob) {
        const arrayBuffer = await pdfData.arrayBuffer();
        base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      } else if (pdfData instanceof ArrayBuffer) {
        base64 = btoa(String.fromCharCode(...new Uint8Array(pdfData)));
      } else {
        throw new Error('Format de données PDF non supporté');
      }
      
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Sauvegarder dans le dossier médical ET proposer le partage
      try {
        const documentsDir = FileSystem.documentDirectory;
        if (!documentsDir) {
          Alert.alert('Erreur', 'Dossier Documents non accessible');
          return;
        }
        
        // Créer le dossier ordonnances s'il n'existe pas
        const ordonnancesDir = `${documentsDir}ordonnances/`;
        const dirInfo = await FileSystem.getInfoAsync(ordonnancesDir);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(ordonnancesDir, { intermediates: true });
        }
        
        // Sauvegarder dans le dossier médical
        const fileName = `ordonnance_${ordonnance.idordonnance}_${new Date().toISOString().slice(0, 10)}.pdf`;
        const medicalFileUri = `${ordonnancesDir}${fileName}`;
        
        await FileSystem.copyAsync({
          from: fileUri,
          to: medicalFileUri
        });
        
        console.log('✅ Ordonnance sauvegardée dans le dossier médical:', medicalFileUri);
        
        // Recharger la liste des ordonnances sauvegardées
        await loadSavedOrdonnances();
        
        // Proposer le partage pour sauvegarder ailleurs aussi
        Alert.alert(
          'Ordonnance sauvegardée',
          'L\'ordonnance a été sauvegardée dans votre dossier médical. Voulez-vous aussi la sauvegarder ailleurs (Drive, Email, etc.) ?',
          [
            { text: 'Non merci', style: 'cancel' },
            { 
              text: 'Oui', 
              onPress: async () => {
                try {
                  const isAvailable = await Sharing.isAvailableAsync();
                  if (isAvailable) {
                    await Sharing.shareAsync(fileUri, {
                      mimeType: 'application/pdf',
                      dialogTitle: 'Sauvegarder l\'ordonnance',
                      UTI: 'com.adobe.pdf'
                    });
                  }
                } catch (shareError) {
                  console.error('Erreur partage:', shareError);
                }
              }
            }
          ]
        );
        
      } catch (error) {
        console.error('Erreur téléchargement:', error);
        Alert.alert('Erreur', 'Impossible de télécharger l\'ordonnance');
      }
      
    } catch (error) {
      console.error('Erreur téléchargement:', error);
      Alert.alert('Erreur', 'Impossible de télécharger l\'ordonnance');
    }
  };

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
      {/* En-tête professionnel */}
      <View style={styles.professionalHeader}>
        <Text style={styles.doctorTitle}>
          Dr. {item.medecin_prenom} {item.medecin_nom}
        </Text>
        <Text style={styles.doctorSubtitle}>Médecin généraliste</Text>
        <Text style={styles.ordonnanceTitle}>ORDONNANCE MÉDICALE</Text>
        <View style={styles.separatorLine} />
        <Text style={styles.confidentialText}>CONFIDENTIEL</Text>
      </View>

      {/* Informations ordonnance */}
      <View style={styles.ordonnanceInfoSection}>
        <Text style={styles.professionalSectionTitle}>INFORMATIONS ORDONNANCE</Text>
        <View style={styles.separatorLine} />
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Date d'ordonnance :</Text>
          <Text style={styles.infoValue}>{formatDate(item.date_ordonnance)}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Statut :</Text>
          <Text style={styles.infoValue}>{getStatusText(item.statut)}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Durée traitement :</Text>
          <Text style={styles.infoValue}>{item.duree_traitement} jour(s)</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Renouvelable :</Text>
          <Text style={styles.infoValue}>{item.renouvelable ? 'Oui' : 'Non'}</Text>
        </View>
      </View>

      {/* Médicaments */}
      <View style={styles.medicamentsSection}>
        <Text style={styles.professionalSectionTitle}>MÉDICAMENTS PRESCRITS</Text>
        <View style={styles.separatorLine} />
        
        {item.medicaments.map((medicament, index) => (
          <View key={index} style={styles.medicamentItem}>
            <Text style={styles.medicamentName}>{medicament.nom}</Text>
            <View style={styles.medicamentDetails}>
              <Text style={styles.medicamentDetail}>Dosage: {medicament.dosage}</Text>
              <Text style={styles.medicamentDetail}>Forme: {medicament.forme}</Text>
              <Text style={styles.medicamentDetail}>Posologie: {medicament.posologie}</Text>
              <Text style={styles.medicamentDetail}>Durée: {medicament.duree} jour(s)</Text>
              <Text style={styles.medicamentDetail}>Quantité: {medicament.quantite}</Text>
            </View>
            {index < item.medicaments.length - 1 && <View style={styles.medicamentSeparator} />}
          </View>
        ))}
      </View>

      {/* Instructions */}
      {item.instructions && (
        <View style={styles.instructionsSection}>
          <Text style={styles.professionalSectionTitle}>INSTRUCTIONS PARTICULIÈRES</Text>
          <View style={styles.separatorLine} />
          <Text style={styles.instructionsText}>{item.instructions}</Text>
        </View>
      )}

      {/* Footer professionnel */}
      <View style={styles.professionalFooter}>
        <View style={styles.separatorLine} />
        <Text style={styles.footerText}>
          {item.envoye_le ? `Envoyée le ${formatDate(item.envoye_le)}` : 'En cours de traitement'}
        </Text>
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
        ) : ordonnances.length > 0 || savedOrdonnances.length > 0 ? (
          <FlatList
            data={ordonnances}
            renderItem={renderOrdonnance}
            keyExtractor={(item) => item.idordonnance}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.ordonnancesList}
            ListHeaderComponent={
              savedOrdonnances.length > 0 ? (
                <View style={styles.savedSection}>
                  <Text style={styles.savedSectionTitle}>📁 Dossier Médical</Text>
                  <Text style={styles.savedSectionSubtitle}>
                    {savedOrdonnances.length} ordonnance{savedOrdonnances.length > 1 ? 's' : ''} sauvegardée{savedOrdonnances.length > 1 ? 's' : ''}
                  </Text>
                  {savedOrdonnances.map((fileName, index) => (
                    <View key={index} style={styles.savedFileItem}>
                      <Ionicons name="document-text" size={20} color="#007AFF" />
                      <Text style={styles.savedFileName}>{fileName}</Text>
                      <TouchableOpacity 
                        style={styles.openButton}
                        onPress={() => {
                          const documentsDir = FileSystem.documentDirectory;
                          const fileUri = `${documentsDir}ordonnances/${fileName}`;
                          Linking.openURL(fileUri).catch(() => {
                            Alert.alert('Info', 'Fichier disponible dans votre dossier médical');
                          });
                        }}
                      >
                        <Ionicons name="open-outline" size={16} color="#007AFF" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ) : null
            }
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
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 0,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  professionalHeader: {
    padding: 20,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  doctorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  doctorSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  ordonnanceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    fontStyle: 'italic',
    color: '#000',
    textAlign: 'center',
    marginBottom: 8,
  },
  separatorLine: {
    height: 1,
    backgroundColor: '#000',
    marginVertical: 8,
  },
  confidentialText: {
    fontSize: 12,
    color: '#000',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  ordonnanceInfoSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  infoLabel: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
    flex: 1,
    minWidth: '40%',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    textAlign: 'right',
    flexWrap: 'wrap',
  },
  medicamentsSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  medicamentItem: {
    marginBottom: 15,
  },
  medicamentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  medicamentDetails: {
    marginLeft: 10,
  },
  medicamentDetail: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  medicamentSeparator: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginTop: 15,
  },
  instructionsSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  instructionsText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginTop: 8,
  },
  professionalFooter: {
    padding: 20,
    backgroundColor: '#F8F9FA',
  },
  professionalSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
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
  footerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sentDate: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: '500',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  downloadButtonText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
    marginLeft: 4,
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
  // Styles pour le dossier médical
  savedSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  savedSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  savedSectionSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 12,
  },
  savedFileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    marginBottom: 8,
  },
  savedFileName: {
    flex: 1,
    fontSize: 14,
    color: '#1C1C1E',
    marginLeft: 8,
  },
  openButton: {
    padding: 4,
  },
});
