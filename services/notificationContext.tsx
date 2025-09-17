import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { apiService } from './api';

interface NotificationContextType {
  unreadMessagesCount: number;
  updateUnreadCount: () => Promise<void>;
  markAsRead: () => void;
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

  const updateUnreadCount = async () => {
    try {
      console.log('🔄 Mise à jour du compteur de messages non lus');
      const response = await apiService.getConversations();
      const conversations = response.data || [];
      
      const totalUnread = conversations.reduce((sum, conv) => {
        return sum + (conv.nombre_messages_non_lus || 0);
      }, 0);
      
      console.log('📊 Total messages non lus:', totalUnread);
      setUnreadMessagesCount(totalUnread);
      
      // Sauvegarder en cache
      await AsyncStorage.setItem('unreadMessagesCount', totalUnread.toString());
    } catch (error) {
      console.error('❌ Erreur mise à jour compteur:', error);
      // Charger depuis le cache en cas d'erreur
      try {
        const cached = await AsyncStorage.getItem('unreadMessagesCount');
        if (cached) {
          setUnreadMessagesCount(parseInt(cached));
        }
      } catch {}
    }
  };

  const markAsRead = () => {
    setUnreadMessagesCount(0);
    AsyncStorage.setItem('unreadMessagesCount', '0');
  };

  // Charger le compteur au démarrage
  useEffect(() => {
    const loadCachedCount = async () => {
      try {
        const cached = await AsyncStorage.getItem('unreadMessagesCount');
        if (cached) {
          setUnreadMessagesCount(parseInt(cached));
        }
      } catch {}
    };
    
    loadCachedCount();
    updateUnreadCount();
  }, []);

  return (
    <NotificationContext.Provider 
      value={{ 
        unreadMessagesCount, 
        updateUnreadCount, 
        markAsRead 
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
