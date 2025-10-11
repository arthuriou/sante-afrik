import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { apiService } from './api';
import { notificationService } from './notificationService';

interface NotificationContextType {
  unreadMessagesCount: number;
  unreadNotificationsCount: number;
  totalUnreadCount: number;
  updateUnreadCount: () => Promise<void>;
  updateNotificationsCount: () => Promise<void>;
  markAsRead: () => void;
  markNotificationsAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  const updateUnreadCount = async () => {
    try {
      console.log('🔄 Mise à jour du compteur de messages non lus');
      const response = await apiService.getConversations();
      const conversations = response.data || [];
      
      const totalUnread = conversations.reduce((sum, conv) => {
        const unread = conv.nombre_messages_non_lus || 0;
        console.log(`📊 Conversation ${conv.idconversation}: ${unread} non lus`);
        return sum + unread;
      }, 0);
      
      console.log('📊 Total messages non lus calculé:', totalUnread);
      console.log('📊 Ancien compteur:', unreadMessagesCount);
      console.log('📊 Nouveau compteur:', totalUnread);
      
      setUnreadMessagesCount(totalUnread);
      
      // Sauvegarder en cache
      await AsyncStorage.setItem('unreadMessagesCount', totalUnread.toString());
      console.log('✅ Compteur mis à jour et sauvegardé');
    } catch (error) {
      console.error('❌ Erreur mise à jour compteur:', error);
      // Charger depuis le cache en cas d'erreur
      try {
        const cached = await AsyncStorage.getItem('unreadMessagesCount');
        if (cached) {
          const cachedCount = parseInt(cached);
          console.log('📊 Chargement depuis cache:', cachedCount);
          setUnreadMessagesCount(cachedCount);
        }
      } catch {}
    }
  };

  const updateNotificationsCount = async () => {
    try {
      console.log('🔄 Mise à jour du compteur de notifications non lues');
      // Pas d'endpoint stats: compter via /history?lu=false
      const unreadNotifications = await notificationService.getNotifications({ lu: false });
      const unreadCount = Array.isArray(unreadNotifications) ? unreadNotifications.length : 0;

      console.log('📊 Total notifications non lues:', unreadCount);
      setUnreadNotificationsCount(unreadCount);

      // Sauvegarder en cache
      await AsyncStorage.setItem('unreadNotificationsCount', unreadCount.toString());
    } catch (error) {
      console.error('❌ Erreur mise à jour compteur notifications:', error);
      // Fallback : compter localement toutes les notifications non lues
      try {
        const notifications = await notificationService.getNotifications();
        const unreadCount = notifications.filter(notif => !notif.lu).length;
        setUnreadNotificationsCount(unreadCount);
        await AsyncStorage.setItem('unreadNotificationsCount', unreadCount.toString());
      } catch {
        // Charger depuis le cache en cas d'erreur
        const cached = await AsyncStorage.getItem('unreadNotificationsCount');
        if (cached) {
          setUnreadNotificationsCount(parseInt(cached));
        }
      }
    }
  };

  const markAsRead = () => {
    setUnreadMessagesCount(0);
    AsyncStorage.setItem('unreadMessagesCount', '0');
  };

  const markNotificationsAsRead = () => {
    setUnreadNotificationsCount(0);
    AsyncStorage.setItem('unreadNotificationsCount', '0');
  };

  // Calculer le total des notifications non lues
  const totalUnreadCount = unreadMessagesCount + unreadNotificationsCount;
  
  // Debug: afficher le compteur à chaque changement
  useEffect(() => {
    console.log('🔢 Compteur messages non lus changé:', unreadMessagesCount);
  }, [unreadMessagesCount]);

  // Charger les compteurs au démarrage
  useEffect(() => {
    const loadCachedCounts = async () => {
      try {
        const cachedMessages = await AsyncStorage.getItem('unreadMessagesCount');
        const cachedNotifications = await AsyncStorage.getItem('unreadNotificationsCount');
        
        if (cachedMessages) {
          setUnreadMessagesCount(parseInt(cachedMessages));
        }
        if (cachedNotifications) {
          setUnreadNotificationsCount(parseInt(cachedNotifications));
        }
      } catch {}
    };
    
    loadCachedCounts();
    updateUnreadCount();
    updateNotificationsCount();
  }, []);

  return (
    <NotificationContext.Provider 
      value={{ 
        unreadMessagesCount,
        unreadNotificationsCount,
        totalUnreadCount,
        updateUnreadCount,
        updateNotificationsCount,
        markAsRead,
        markNotificationsAsRead
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
