import * as FileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Sharing from 'expo-sharing';
import * as WebBrowser from 'expo-web-browser';
import { Alert, Platform } from 'react-native';
import { API_BASE_URL } from '../services/api';

export const openDocument = async (documentId: string, userToken: string, documentType?: string, documentName?: string) => {
  try {
    console.log('🔄 Ouverture du document...', documentId);
    
    // Construire l'URL avec le token d'authentification
    const documentUrl = `${API_BASE_URL}/api/dossier-medical/documents/${documentId}/view`;
    const authenticatedUrl = `${documentUrl}?token=${encodeURIComponent(userToken)}`;
    
    console.log('🌐 URL document:', documentUrl);
    
    // 1. Télécharger directement le document pour l'ouvrir avec les apps système
    console.log('📥 Téléchargement du document...');
    
    // Déterminer l'extension et le MIME type
    const getFileInfo = (type?: string, name?: string) => {
      if (type === 'IMAGE') {
        return { ext: '.jpg', mimeType: 'image/jpeg' };
      } else if (type === 'PDF' || (name && name.toLowerCase().includes('.pdf'))) {
        return { ext: '.pdf', mimeType: 'application/pdf' };
      } else {
        return { ext: '.pdf', mimeType: 'application/pdf' };
      }
    };
    
    const fileInfo = getFileInfo(documentType, documentName);
    const fileName = `document_${documentId}_${Date.now()}${fileInfo.ext}`;
    const localUri = `${FileSystem.cacheDirectory}${fileName}`;
    
    console.log('📁 Fichier local:', localUri);
    
    // Télécharger le document
    const downloadResult = await FileSystem.downloadAsync(
      documentUrl,
      localUri,
      {
        headers: {
          'Authorization': `Bearer ${userToken}`,
        }
      }
    );

    if (downloadResult.status !== 200) {
      throw new Error(`Erreur de téléchargement: ${downloadResult.status}`);
    }

    console.log('✅ Document téléchargé:', downloadResult.uri);
    
    // 2. Ouvrir le document avec les apps système
    console.log('📖 Ouverture du document avec les apps système...');
    
    if (Platform.OS === 'android') {
      // Sur Android, utiliser IntentLauncher avec Content URI
      try {
        console.log('🤖 Android: Génération Content URI...');
        
        // Générer un Content URI pour Android
        const contentUri = await FileSystem.getContentUriAsync(downloadResult.uri);
        console.log('📄 Content URI généré:', contentUri);
        
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: contentUri,
          type: fileInfo.mimeType,
          flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
        });
        console.log('✅ Document ouvert avec l\'app système Android');
      } catch (intentError) {
        console.log('⚠️ Erreur IntentLauncher, fallback vers Sharing:', intentError);
        // Fallback vers Sharing
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(downloadResult.uri, {
            mimeType: fileInfo.mimeType,
            dialogTitle: `Ouvrir ${documentName || 'le document'}`
          });
        } else {
          throw new Error('Impossible d\'ouvrir le document');
        }
      }
    } else {
      // Sur iOS, utiliser Sharing
      console.log('🍎 iOS: Ouverture avec Sharing...');
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(downloadResult.uri, {
          mimeType: fileInfo.mimeType,
          dialogTitle: `Ouvrir ${documentName || 'le document'}`,
          UTI: fileInfo.mimeType
        });
        console.log('✅ Document ouvert avec l\'app système iOS');
      } else {
        throw new Error('Impossible d\'ouvrir le document');
      }
    }
    
    // 4. Nettoyer le fichier temporaire après un délai
    setTimeout(async () => {
      try {
        await FileSystem.deleteAsync(downloadResult.uri, { idempotent: true });
        console.log('🧹 Fichier temporaire supprimé');
      } catch (cleanupError) {
        console.log('⚠️ Erreur nettoyage:', cleanupError);
      }
    }, 30000);
    
  } catch (error: any) {
    console.error('❌ Erreur ouverture document:', error);
    Alert.alert(
      'Erreur', 
      `Impossible d'ouvrir le document: ${error?.message || 'Erreur inconnue'}`,
      [{ text: 'OK' }]
    );
  }
};
