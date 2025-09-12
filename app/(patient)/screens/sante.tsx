import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    SafeAreaView,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { API_BASE_URL, apiService, DocumentMedical, DossierMedical } from '../../../services/api';
import { openDocument } from '../../../utils/documentViewer';

export default function SanteScreen() {
  const [loading, setLoading] = useState(false);
  const [dossier, setDossier] = useState<DossierMedical | null>(null);
  const [documents, setDocuments] = useState<DocumentMedical[]>([]);
  const [uploading, setUploading] = useState(false);
  const [openingDocument, setOpeningDocument] = useState<string | null>(null);

  useEffect(() => {
    bootstrap();
  }, []);

  const bootstrap = async () => {
    try {
      setLoading(true);
      const resp = await apiService.getOrCreateDossier();
      setDossier(resp.dossier);
      const docs = await apiService.listDocuments(resp.dossier.iddossier);
      console.log('📄 Documents reçus:', docs);
      setDocuments(docs || []);
    } catch (e: any) {
      Alert.alert('Erreur', e.message || 'Impossible de charger le dossier');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDocument = async () => {
    try {
      if (!dossier) {
        Alert.alert('Dossier manquant', 'Le dossier n\'a pas été chargé');
        return;
      }

      // Proposer le choix entre images et documents
      Alert.alert(
        'Ajouter un document',
        'Que souhaitez-vous ajouter ?',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Photo/Image', onPress: () => handleAddImage() },
          { text: 'Document (PDF, etc.)', onPress: () => handleAddFile() }
        ]
      );
    } catch (e: any) {
      Alert.alert('Erreur', e.message || 'Échec de l\'upload');
    }
  };

  const handleAddImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', "Autorisez l'accès à la galerie.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.9,
      });
      if (result.canceled) return;
      await uploadFile(result.assets[0], 'IMAGE');
    } catch (e: any) {
      Alert.alert('Erreur', e.message || 'Échec de l\'upload');
    }
  };

  const handleAddFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      await uploadFile(result.assets[0], 'FICHIER');
    } catch (e: any) {
      Alert.alert('Erreur', e.message || 'Échec de l\'upload');
    }
  };

  const uploadFile = async (asset: any, defaultType: string) => {
    try {
      if (!dossier) return;
      
      const uri = asset.uri as string;
      const nameGuess = asset.name || (uri.split('/').pop() || `document_${Date.now()}`).replace(/\?.*$/, '');
      const mime = asset.mimeType || 'application/octet-stream';

      const form = new FormData();
      form.append('dossier_id', dossier.iddossier);
      form.append('nom', nameGuess);
      form.append('type', mime.includes('image') ? 'IMAGE' : (mime.includes('pdf') ? 'PDF' : defaultType));
      form.append('ispublic', 'false');
      // @ts-ignore RN File
      form.append('file', { uri, name: nameGuess, type: mime });

      setUploading(true);
      await apiService.addDocument(form);
      // Recharger depuis l'API pour éviter tout écart de schéma
      const fresh = await apiService.listDocuments(dossier.iddossier);
      setDocuments(fresh || []);
      Alert.alert('Succès', 'Document ajouté');
    } catch (e: any) {
      Alert.alert('Erreur', e.message || 'Échec de l\'upload');
    } finally {
      setUploading(false);
    }
  };

  const resolveUrl = (url?: string) => {
    if (!url) return '';
    
    // Si c'est déjà une URL complète (http/https), la retourner telle quelle
    if (/^https?:\/\//i.test(url)) {
      console.log('✅ URL complète détectée:', url);
      return url;
    }
    
    // Si c'est une URL Cloudinary (commence par /uploads/), construire l'URL complète
    if (url.startsWith('/uploads/')) {
      const cloudinaryUrl = `https://res.cloudinary.com/duk7ftbwo/image/upload/v1757587502${url}`;
      console.log('☁️ URL Cloudinary construite:', cloudinaryUrl);
      return cloudinaryUrl;
    }
    
    // Sinon, utiliser l'API locale
    const localUrl = `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
    console.log('🏠 URL locale construite:', localUrl);
    return localUrl;
  };

  const downloadAndOpenDocument = async (doc: any) => {
    try {
      // Utiliser la fonction utilitaire avec authentification
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }
      
      await openDocument(doc.iddocument, token);
      
    } catch (error) {
      console.error('Erreur ouverture document:', error);
      
      // Fallback vers l'URL directe en cas d'erreur
      try {
        console.log('🔄 Fallback vers l\'URL Cloudinary directe...');
        const directUrl = resolveUrl(doc?.url);
        console.log('🌐 URL Cloudinary:', directUrl);
        
        await WebBrowser.openBrowserAsync(directUrl, {
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
          controlsColor: '#007AFF',
        });
      } catch (fallbackError) {
        console.error('Erreur fallback:', fallbackError);
        throw new Error('Impossible d\'ouvrir le document. Vérifiez votre connexion internet.');
      }
    }
  };

  const handleOpen = async (doc: any) => {
    if (!doc?.iddocument) {
      Alert.alert('Impossible d\'ouvrir', 'ID du document indisponible');
      return;
    }
    
    // Afficher l'état de chargement
    setOpeningDocument(doc.iddocument);
    
    try {
      // Utiliser la nouvelle méthode de téléchargement + ouverture locale
      await downloadAndOpenDocument(doc);
      
    } catch (e: any) {
      console.error('Erreur ouverture document:', e);
      Alert.alert('Erreur', e.message || 'Échec d\'ouverture du document');
    } finally {
      // Masquer l'état de chargement
      setOpeningDocument(null);
    }
  };

  const handleShare = async (doc: any) => {
    try {
      // Pour le partage, on utilise l'URL directe Cloudinary
      const url = resolveUrl(doc?.url);
      await Share.share({ 
        message: `${doc?.nom || 'Document'}\n${url}`,
        title: doc?.nom || 'Document médical'
      });
    } catch (e: any) {
      Alert.alert('Erreur', 'Impossible de partager le document');
    }
  };

  const handleDelete = async (doc: any) => {
    Alert.alert('Supprimer', `Supprimer "${doc?.nom || 'document'}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        try {
          await apiService.deleteDocument(doc.iddocument || doc.id);
          const fresh = await apiService.listDocuments(dossier!.iddossier);
          setDocuments(fresh || []);
        } catch (e: any) {
          Alert.alert('Erreur', e.message || 'Échec de suppression');
        }
      }},
    ]);
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'IMAGE':
        return 'image-outline';
      case 'PDF':
        return 'document-text-outline';
      default:
        return 'document-outline';
    }
  };

  const formatFileSize = (sizeKB: number) => {
    if (sizeKB < 1024) return `${sizeKB} Ko`;
    return `${(sizeKB / 1024).toFixed(1)} Mo`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Ma santé</Text>
          <Text style={styles.headerSubtitle}>Gérez votre dossier médical et vos documents</Text>
        </View>

        {/* Dossier Info Card */}
        <View style={styles.section}>
          <View style={styles.sectionCard}>
            <View style={styles.dossierHeader}>
              <View style={styles.dossierIcon}>
                <Ionicons name="folder-outline" size={24} color="#007AFF" />
              </View>
              <View style={styles.dossierInfo}>
                <Text style={styles.dossierTitle}>Dossier médical</Text>
                <Text style={styles.dossierSubtitle}>
                  {dossier ? `Créé le ${formatDate(dossier.datecreation)}` : 'Dossier en cours de création...'}
                </Text>
              </View>
            </View>
            <View style={styles.dossierStats}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{documents.length}</Text>
                <Text style={styles.statLabel}>Documents</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {documents.filter(d => d.type === 'IMAGE').length}
                </Text>
                <Text style={styles.statLabel}>Images</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {documents.filter(d => d.type === 'PDF').length}
                </Text>
                <Text style={styles.statLabel}>PDFs</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Add Document Button */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.addDocumentButton} 
            onPress={handleAddDocument} 
            disabled={uploading}
          >
            <View style={styles.addButtonContent}>
              <View style={styles.addButtonIcon}>
                {uploading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="add-outline" size={24} color="#FFFFFF" />
                )}
              </View>
              <View style={styles.addButtonText}>
                <Text style={styles.addButtonTitle}>
                  {uploading ? 'Ajout en cours...' : 'Ajouter un document'}
                </Text>
                <Text style={styles.addButtonSubtitle}>
                  Ordonnances, analyses, imageries, certificats...
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Documents List */}
        <View style={styles.section}>
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Mes documents</Text>
            
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.loadingText}>Chargement des documents...</Text>
              </View>
            ) : documents.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="document-outline" size={48} color="#8E8E93" />
                <Text style={styles.emptyTitle}>Aucun document</Text>
                <Text style={styles.emptySubtitle}>
                  Ajoutez vos premiers documents médicaux pour commencer
                </Text>
              </View>
            ) : (
              <View style={styles.documentsGrid}>
                {documents.map((doc, index) => (
                  <View key={doc.iddocument || index} style={[
                    styles.documentCard,
                    index === 0 && styles.documentCardFirst,
                    index === documents.length - 1 && styles.documentCardLast
                  ]}>
                    <View style={styles.documentCardHeader}>
                      <View style={styles.documentIcon}>
                        <Ionicons 
                          name={getDocumentIcon(doc.type)} 
                          size={24} 
                          color="#007AFF" 
                        />
                      </View>
                      <View style={styles.documentActions}>
                        <TouchableOpacity 
                          style={styles.actionButton}
                          onPress={() => handleOpen(doc)}
                          disabled={openingDocument === doc.iddocument}
                        >
                          {openingDocument === doc.iddocument ? (
                            <ActivityIndicator size="small" color="#007AFF" />
                          ) : (
                            <Ionicons name="eye-outline" size={16} color="#007AFF" />
                          )}
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.actionButton}
                          onPress={() => handleShare(doc)}
                        >
                          <Ionicons name="share-outline" size={16} color="#007AFF" />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.actionButton, styles.deleteButton]}
                          onPress={() => handleDelete(doc)}
                        >
                          <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                        </TouchableOpacity>
                      </View>
                    </View>
                    
                    <View style={styles.documentCardContent}>
                      <Text style={styles.documentName} numberOfLines={2}>{doc.nom}</Text>
                      <View style={styles.documentMeta}>
                        <View style={styles.metaItem}>
                          <Text style={styles.metaLabel}>Type</Text>
                          <Text style={styles.metaValue}>{doc.type}</Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Text style={styles.metaLabel}>Taille</Text>
                          <Text style={styles.metaValue}>{formatFileSize(doc.taillekb || 0)}</Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Text style={styles.metaLabel}>Date</Text>
                          <Text style={styles.metaValue}>{formatDate(doc.dateupload)}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
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
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  
  // Sections
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20, // Gros coins arrondis iOS
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 20,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  
  // Dossier Info
  dossierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dossierIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  dossierInfo: {
    flex: 1,
  },
  dossierTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  dossierSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  dossierStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E5E5EA',
  },
  
  // Add Document Button
  addDocumentButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  addButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButtonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  addButtonText: {
    flex: 1,
  },
  addButtonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  addButtonSubtitle: {
    fontSize: 14,
    color: '#FFFFFF80',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  
  // Documents List
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#8E8E93',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  documentsGrid: {
    gap: 0,
  },
  documentCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 0,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  documentCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  documentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  deleteButton: {
    backgroundColor: '#FF3B3015',
  },
  documentCardContent: {
    gap: 12,
  },
  documentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  documentMeta: {
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#000000',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  documentCardFirst: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  documentCardLast: {
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderBottomWidth: 0,
  },
});