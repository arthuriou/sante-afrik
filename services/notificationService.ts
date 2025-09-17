import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { apiService } from './api';
import { audioNotificationService } from './audioNotificationService';

// Configuration des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationPreferences {
  idpreference?: string;
  utilisateur_id?: string;
  soundenabled: boolean;
  soundfile: string;
  volume: number;
  vibration: boolean;
  pushenabled: boolean;
  emailenabled: boolean;
  smsenabled: boolean;
  datemodification?: string;
}

export interface NotificationDevice {
  iddevice?: string;
  utilisateur_id?: string;
  platform: 'FCM' | 'APNS' | 'EXPO' | 'WEB';
  token: string;
  appversion: string;
  deviceinfo: string;
  datecreation?: string;
  datemodification?: string;
}

export interface Notification {
  id: string;
  titre: string;
  contenu: string;
  type: string;
  date_creation: string;
  lu: boolean;
  data?: any;
}

class NotificationService {
  private expoPushToken: string | null = null;
  private preferences: NotificationPreferences | null = null;

  // Initialiser le service de notifications
  async initialize() {
    try {
      console.log('🔔 Initialisation du service de notifications');
      
      // Demander les permissions
      await this.requestPermissions();
      
      // Enregistrer le device
      await this.registerDevice();
      
      // Charger les préférences
      await this.loadPreferences();
      
      console.log('✅ Service de notifications initialisé');
    } catch (error) {
      console.error('❌ Erreur initialisation notifications:', error);
    }
  }

  // Demander les permissions de notification
  async requestPermissions() {
    if (!Device.isDevice) {
      console.log('⚠️ Les notifications push ne fonctionnent que sur un appareil physique');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('❌ Permission de notification refusée');
      return false;
    }

    console.log('✅ Permissions de notification accordées');
    return true;
  }

  // Enregistrer le device pour les notifications push
  async registerDevice() {
    try {
      if (!Device.isDevice) {
        console.log('⚠️ Les notifications push ne fonctionnent que sur un appareil physique');
        return;
      }
      
      // Récupérer le projectId depuis la configuration Expo/EAS ou variable d'environnement
      const projectId =
        (Constants as any)?.expoConfig?.extra?.eas?.projectId ||
        (Constants as any)?.easConfig?.projectId ||
        (process as any)?.env?.EXPO_PUBLIC_PROJECT_ID;

      if (!projectId) {
        throw new Error('ProjectId EAS manquant. Configurez extra.eas.projectId dans app.json ou EXPO_PUBLIC_PROJECT_ID.');
      }

      const token = await Notifications.getExpoPushTokenAsync({ projectId });

      this.expoPushToken = token.data;

      const deviceInfo = {
        platform: Platform.OS === 'ios' ? 'APNS' : 'FCM' as 'FCM' | 'APNS',
        token: this.expoPushToken,
        appversion: '1.0.0', // Vous pouvez récupérer la version depuis app.json
        deviceinfo: `${Platform.OS} ${Platform.Version}`,
      };

      // Enregistrer le device sur le serveur
      await apiService.registerNotificationDevice(deviceInfo);
      
      console.log('📱 Device enregistré:', this.expoPushToken);
    } catch (error) {
      console.error('❌ Erreur enregistrement device:', error);
    }
  }

  // Charger les préférences de notification
  async loadPreferences() {
    try {
      const response = await apiService.getNotificationPreferences();
      this.preferences = (response as any).data || response;
      
      // Sauvegarder en cache
      await AsyncStorage.setItem('notificationPreferences', JSON.stringify(this.preferences));
      
      console.log('⚙️ Préférences chargées:', this.preferences);
    } catch (error) {
      console.error('❌ Erreur chargement préférences:', error);
      
      // Charger depuis le cache
      try {
        const cached = await AsyncStorage.getItem('notificationPreferences');
        if (cached) {
          this.preferences = JSON.parse(cached);
        }
      } catch {}
    }
  }

  // Mettre à jour les préférences
  async updatePreferences(preferences: Partial<NotificationPreferences>) {
    try {
      const response = await apiService.updateNotificationPreferences(preferences);
      this.preferences = (response as any).data || response;
      
      // Sauvegarder en cache
      await AsyncStorage.setItem('notificationPreferences', JSON.stringify(this.preferences));
      
      console.log('⚙️ Préférences mises à jour:', this.preferences);
      return this.preferences;
    } catch (error) {
      console.error('❌ Erreur mise à jour préférences:', error);
      throw error;
    }
  }

  // Réinitialiser les préférences aux valeurs par défaut
  async resetPreferences() {
    try {
      const response = await apiService.resetNotificationPreferences();
      this.preferences = (response as any).data || response;
      
      // Sauvegarder en cache
      await AsyncStorage.setItem('notificationPreferences', JSON.stringify(this.preferences));
      
      console.log('🔄 Préférences réinitialisées:', this.preferences);
      return this.preferences;
    } catch (error) {
      console.error('❌ Erreur réinitialisation préférences:', error);
      throw error;
    }
  }

  // Obtenir les préférences actuelles
  getPreferences(): NotificationPreferences | null {
    return this.preferences;
  }

  // Alias pour la compatibilité
  getNotificationPreferences(): NotificationPreferences | null {
    return this.getPreferences();
  }

  // Programmer une notification locale
  async scheduleLocalNotification(title: string, body: string, data?: any, seconds: number = 0) {
    try {
      const preferences = this.getPreferences();
      
      const notificationConfig: Notifications.NotificationRequestInput = {
        content: {
          title,
          body,
          data,
          sound: preferences?.soundenabled ? preferences.soundfile : false,
        },
        trigger: seconds > 0 ? { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds } : null,
      };

      const notificationId = await Notifications.scheduleNotificationAsync(notificationConfig);
      console.log('📅 Notification locale programmée:', notificationId);
      
      return notificationId;
    } catch (error) {
      console.error('❌ Erreur programmation notification locale:', error);
      throw error;
    }
  }

  // Envoyer une notification immédiate
  async sendImmediateNotification(title: string, body: string, data?: any) {
    try {
      const preferences = this.getPreferences();
      
      if (!preferences?.pushenabled) {
        console.log('⚠️ Notifications push désactivées');
        return;
      }

      const notificationConfig: Notifications.NotificationRequestInput = {
        content: {
          title,
          body,
          data,
          sound: preferences.soundenabled ? preferences.soundfile : false,
        },
        trigger: null, // Immédiat
      };

      const notificationId = await Notifications.scheduleNotificationAsync(notificationConfig);
      console.log('📤 Notification immédiate envoyée:', notificationId);
      
      // Jouer le son de notification si activé
      if (preferences.soundenabled) {
        await audioNotificationService.playNotificationSound();
      }
      
      return notificationId;
    } catch (error) {
      console.error('❌ Erreur envoi notification immédiate:', error);
      throw error;
    }
  }

  // Obtenir les notifications de l'utilisateur
  async getNotifications(filters: any = {}): Promise<Notification[]> {
    try {
      // Essayer de récupérer les notifications de l'API
      try {
        const response = await apiService.getNotifications(filters);
        const apiData = (response as any).data || response;
        const notifications = Array.isArray(apiData.notifications) ? apiData.notifications : [];
        
        console.log(`📱 ${notifications.length} notifications récupérées de l'API`);
        return notifications;
      } catch (apiError) {
        console.log('⚠️ API notifications non disponible, utilisation du mode local uniquement');
        // Fallback : retourner uniquement les notifications locales
        return await this.getLocalNotifications();
      }
    } catch (error) {
      console.error('❌ Erreur récupération notifications:', error);
      // Fallback final : retourner un tableau vide
      return [];
    }
  }

  // Obtenir le compteur non lues sans endpoint stats (via history?lu=false)
  async getUnreadCount(): Promise<number> {
    try {
      const unread = await this.getNotifications({ lu: false });
      return Array.isArray(unread) ? unread.length : 0;
    } catch (error) {
      console.error('❌ Erreur récupération compteur non lues:', error);
      return 0;
    }
  }

  // Marquer une notification comme lue
  async markAsRead(notificationId: string) {
    try {
      // Essayer de marquer via l'API
      try {
        await apiService.markNotificationAsRead([notificationId]);
        console.log('✅ Notification API marquée comme lue:', notificationId);
      } catch (apiError) {
        console.log('⚠️ API non disponible, marquage local uniquement');
        // Marquer localement
        await this.markLocalNotificationAsRead(notificationId);
      }
    } catch (error) {
      console.error('❌ Erreur marquer notification comme lue:', error);
      throw error;
    }
  }

  // Marquer une notification locale comme lue
  async markLocalNotificationAsRead(notificationId: string) {
    try {
      const localNotifications = await this.getLocalNotifications();
      const updatedNotifications = localNotifications.map(notif => 
        notif.id === notificationId ? { ...notif, lu: true } : notif
      );
      await AsyncStorage.setItem('localNotifications', JSON.stringify(updatedNotifications));
      console.log('✅ Notification locale marquée comme lue:', notificationId);
    } catch (error) {
      console.error('❌ Erreur marquage local:', error);
    }
  }

  // Marquer toutes les notifications comme lues
  async markAllAsRead() {
    try {
      // Essayer de marquer via l'API
      try {
        await apiService.markAllNotificationsAsRead();
        console.log('✅ Toutes les notifications API marquées comme lues');
      } catch (apiError) {
        console.log('⚠️ API non disponible, marquage local uniquement');
        // Marquer toutes les notifications locales comme lues
        await this.markAllLocalNotificationsAsRead();
      }
    } catch (error) {
      console.error('❌ Erreur marquer toutes les notifications comme lues:', error);
      throw error;
    }
  }

  // Marquer toutes les notifications locales comme lues
  async markAllLocalNotificationsAsRead() {
    try {
      const localNotifications = await this.getLocalNotifications();
      const updatedNotifications = localNotifications.map(notif => ({ ...notif, lu: true }));
      await AsyncStorage.setItem('localNotifications', JSON.stringify(updatedNotifications));
      console.log('✅ Toutes les notifications locales marquées comme lues');
    } catch (error) {
      console.error('❌ Erreur marquage local en masse:', error);
    }
  }

  // Obtenir le token Expo Push
  getExpoPushToken(): string | null {
    return this.expoPushToken;
  }

  // Tester un son de notification
  async testNotificationSound(soundFile?: string) {
    try {
      await audioNotificationService.playNotificationSound(soundFile);
      console.log('🔊 Test de son de notification');
    } catch (error) {
      console.error('❌ Erreur test son notification:', error);
      throw error;
    }
  }

  // Sauvegarder une notification localement (fallback)
  async saveNotificationLocally(notificationData: any) {
    try {
      const localNotifications = await AsyncStorage.getItem('localNotifications');
      const notifications = localNotifications ? JSON.parse(localNotifications) : [];
      
      const notification = {
        id: `local_${Date.now()}`,
        ...notificationData,
        date_creation: new Date().toISOString(),
        lu: false
      };
      
      notifications.unshift(notification); // Ajouter au début
      await AsyncStorage.setItem('localNotifications', JSON.stringify(notifications));
      console.log('💾 Notification sauvegardée localement');
    } catch (error) {
      console.error('❌ Erreur sauvegarde locale:', error);
    }
  }

  // Récupérer les notifications locales
  async getLocalNotifications(): Promise<Notification[]> {
    try {
      const localNotifications = await AsyncStorage.getItem('localNotifications');
      return localNotifications ? JSON.parse(localNotifications) : [];
    } catch (error) {
      console.error('❌ Erreur récupération notifications locales:', error);
      return [];
    }
  }

  // Envoyer une notification de message
  async sendMessageNotification(senderName: string, messageContent: string, conversationId: string) {
    try {
      const preferences = this.getPreferences();
      
      // Créer la notification dans la base de données
      const notificationData = {
        titre: `Nouveau message de ${senderName}`,
        contenu: messageContent.length > 100 ? messageContent.substring(0, 100) + '...' : messageContent,
        type_notification: 'MESSAGE',
        data: {
          conversationId,
          senderName,
          messageContent
        }
      };

      // Sauvegarder la notification via l'API
      try {
        await apiService.createNotification(notificationData);
        console.log('📝 Notification sauvegardée en base de données');
      } catch (error) {
        console.log('⚠️ Erreur sauvegarde notification:', error);
        // Fallback : sauvegarder localement
        await this.saveNotificationLocally(notificationData);
      }
      
      // Envoyer la notification push si activée
      if (preferences?.pushenabled) {
        const notificationConfig: Notifications.NotificationRequestInput = {
          content: {
            title: `Nouveau message de ${senderName}`,
            body: messageContent.length > 50 ? messageContent.substring(0, 50) + '...' : messageContent,
            data: { 
              type: 'MESSAGE',
              conversationId,
              screen: 'messages'
            },
            sound: preferences.soundenabled ? preferences.soundfile : false,
          },
          trigger: null, // Immédiat
        };

        const notificationId = await Notifications.scheduleNotificationAsync(notificationConfig);
        console.log('📤 Notification push envoyée:', notificationId);
      } else {
        console.log('⚠️ Notifications push désactivées');
      }
      
      // Jouer le son de notification si activé
      if (preferences?.soundenabled) {
        await audioNotificationService.playNotificationSound();
      }
      
      return true;
    } catch (error) {
      console.error('❌ Erreur envoi notification de message:', error);
      throw error;
    }
  }

  // Configurer les listeners de notification
  setupNotificationListeners() {
    // Listener pour les notifications reçues
    Notifications.addNotificationReceivedListener((notification: any) => {
      console.log('📨 Notification reçue:', notification);
      
      // Jouer le son de notification si activé
      const preferences = this.getPreferences();
      if (preferences?.soundenabled) {
        audioNotificationService.playNotificationSound();
      }
    });

    // Listener pour les interactions avec les notifications
    Notifications.addNotificationResponseReceivedListener((response: any) => {
      console.log('👆 Interaction avec notification:', response);
      
      // Vous pouvez naviguer vers une écran spécifique ici
      const data = response.notification.request.content.data;
      if (data?.screen) {
        // Navigation vers l'écran spécifié
        console.log('🧭 Navigation vers:', data.screen);
      }
    });
  }
}

export const notificationService = new NotificationService();
