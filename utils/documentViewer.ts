import * as WebBrowser from 'expo-web-browser';
import { Alert } from 'react-native';
import { API_BASE_URL } from '../services/api';

export const openDocument = async (documentId: string, userToken: string) => {
  try {
    console.log('🔄 Téléchargement du document...', documentId);
    console.log('🌐 URL API:', `${API_BASE_URL}/api/dossier-medical/documents/${documentId}/view`);
    
    // 1. Télécharger le document avec authentification
    const response = await fetch(`${API_BASE_URL}/api/dossier-medical/documents/${documentId}/view`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur ${response.status}: ${errorText}`);
    }

    console.log('✅ Document téléchargé, création du blob...');
    
    // 2. Créer un blob à partir de la réponse
    const blob = await response.blob();
    
    // 3. Créer une URL locale temporaire
    const localUrl = URL.createObjectURL(blob);
    
    console.log('🌐 Ouverture dans le navigateur...');
    
    // 4. Ouvrir dans le navigateur intégré
    await WebBrowser.openBrowserAsync(localUrl, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
      controlsColor: '#007AFF',
      showTitle: true
    });
    
    // 5. Nettoyer l'URL après utilisation
    setTimeout(() => {
      URL.revokeObjectURL(localUrl);
      console.log('🧹 URL locale nettoyée');
    }, 10000); // 10 secondes
    
  } catch (error: any) {
    console.error('❌ Erreur ouverture document:', error);
    Alert.alert(
      'Erreur', 
      `Impossible d'ouvrir le document: ${error?.message || 'Erreur inconnue'}`,
      [{ text: 'OK' }]
    );
  }
};
