import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, SafeAreaView, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { API_BASE_URL, apiService, DocumentMedical, DossierMedical } from '../../../services/api';

export default function SanteScreen() {
  const [loading, setLoading] = useState(false);
  const [dossier, setDossier] = useState<DossierMedical | null>(null);
  const [documents, setDocuments] = useState<DocumentMedical[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    bootstrap();
  }, []);

  const bootstrap = async () => {
    try {
      setLoading(true);
      const resp = await apiService.getOrCreateDossier();
      setDossier(resp.dossier);
      const docs = await apiService.listDocuments(resp.dossier.iddossier);
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
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', "Autorisez l'accès à la galerie.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
        quality: 0.9,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      const uri = asset.uri as string;
      const nameGuess = (uri.split('/').pop() || `document_${Date.now()}`).replace(/\?.*$/, '');
      const mime = (asset as any).mimeType || 'application/octet-stream';

      const form = new FormData();
      form.append('dossier_id', dossier.iddossier);
      form.append('nom', nameGuess);
      form.append('type', mime.includes('image') ? 'IMAGE' : (mime.includes('pdf') ? 'PDF' : 'FICHIER'));
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
    if (/^https?:\/\//i.test(url)) return url;
    return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const handleOpen = async (doc: any) => {
    const url = resolveUrl(doc?.url);
    if (!url) {
      Alert.alert('Impossible d\'ouvrir', 'URL du document indisponible');
      return;
    }
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Non supporté', `Impossible d'ouvrir: ${url}`);
      }
    } catch (e: any) {
      Alert.alert('Erreur', e.message || 'Échec d\'ouverture du document');
    }
  };

  const handleShare = async (doc: any) => {
    try {
      const url = resolveUrl(doc?.url);
      await Share.share({ message: `${doc?.nom || 'Document'}\n${url}` });
    } catch {}
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Ma santé</Text>
        <Text style={styles.subtitle}>Créez votre dossier et ajoutez des documents</Text>

        {loading && (
          <View style={{ paddingVertical: 12 }}>
            <ActivityIndicator size="small" color="#007AFF" />
          </View>
        )}

        <View style={styles.cardRow}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Dossier</Text>
            <Text style={styles.cardDesc}>{dossier ? `Créé le ${new Date(dossier.datecreation).toLocaleDateString()}` : '—'}</Text>
          </View>
          <TouchableOpacity style={styles.card} onPress={handleAddDocument} disabled={uploading}>
            <Text style={styles.cardTitle}>Ajouter un document</Text>
            <Text style={styles.cardDesc}>{uploading ? 'Envoi en cours...' : 'Ordonnances, analyses, imageries...'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.placeholderBox}>
          <Text style={styles.placeholderText}>Documents</Text>
          {documents.length === 0 ? (
            <Text style={[styles.placeholderText, { marginTop: 8 }]}>Aucun document</Text>
          ) : (
            documents.filter(Boolean).map((doc) => (
              <View key={(doc as any).iddocument || (doc as any).id || Math.random().toString(36)} style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
                <Text style={{ color: '#111827', fontWeight: '600' }}>{(doc as any).nom || 'Document'}</Text>
                <Text style={{ color: '#6B7280', fontSize: 12, marginBottom: 8 }}>
                  {((doc as any).type || 'FICHIER')} • {Math.round(((doc as any).taillekb || 0))} Ko
                </Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity onPress={() => handleOpen(doc)} style={styles.actionBtn}>
                    <Text style={styles.actionText}>Ouvrir</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleShare(doc)} style={styles.actionBtn}>
                    <Text style={styles.actionText}>Partager</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(doc)} style={[styles.actionBtn, { backgroundColor: '#FEE2E2' }]}>
                    <Text style={[styles.actionText, { color: '#DC2626' }]}>Supprimer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7FAFC' },
  content: { padding: 16 },
  title: { fontSize: 22, fontWeight: '700', color: '#1F2937', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#6B7280', marginBottom: 16 },
  cardRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  card: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 4 },
  cardDesc: { fontSize: 13, color: '#6B7280' },
  placeholderBox: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 20, borderWidth: 1, borderColor: '#E5E7EB' },
  placeholderText: { color: '#6B7280', textAlign: 'center' },
});


