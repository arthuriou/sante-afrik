import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SafeAreaView,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../../../services/api';
import { Ionicons } from '@expo/vector-icons';

interface Conversation {
  id: string;
  participant: {
    nom: string;
    prenom: string;
    role: 'MEDECIN' | 'ADMINCABINET';
    avatar?: string;
  };
  dernierMessage: {
    contenu: string;
    dateEnvoi: string;
    expediteur: 'MOI' | 'AUTRE';
  };
  nonLus: number;
  actif: boolean;
}

export default function MessagesScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUserData();
    loadConversations();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Erreur chargement utilisateur:', error);
    }
  };

  const loadConversations = async () => {
    setLoading(true);
    try {
      // Simuler le chargement des conversations
      // À remplacer par l'API réelle
      
      const mockConversations: Conversation[] = [
        {
          id: '1',
          participant: {
            nom: 'MARTIN',
            prenom: 'Dr. Jean',
            role: 'MEDECIN',
          },
          dernierMessage: {
            contenu: 'Votre rendez-vous de demain est confirmé. N\'oubliez pas d\'apporter vos anciens examens.',
            dateEnvoi: '2024-01-15T14:30:00Z',
            expediteur: 'AUTRE',
          },
          nonLus: 2,
          actif: true,
        },
        {
          id: '2',
          participant: {
            nom: 'DUBOIS',
            prenom: 'Dr. Marie',
            role: 'MEDECIN',
          },
          dernierMessage: {
            contenu: 'Merci pour votre message. Les résultats de vos analyses sont normaux.',
            dateEnvoi: '2024-01-14T10:15:00Z',
            expediteur: 'AUTRE',
          },
          nonLus: 0,
          actif: true,
        },
        {
          id: '3',
          participant: {
            nom: 'ADMIN',
            prenom: 'Secrétariat Centre Médical',
            role: 'ADMINCABINET',
          },
          dernierMessage: {
            contenu: 'Bonjour, nous avons reçu votre demande de changement d\'horaire.',
            dateEnvoi: '2024-01-12T16:45:00Z',
            expediteur: 'MOI',
          },
          nonLus: 0,
          actif: true,
        },
      ];

      setConversations(mockConversations);
    } catch (error) {
      console.error('Erreur chargement conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Aujourd\'hui';
    } else if (diffDays === 2) {
      return 'Hier';
    } else if (diffDays <= 7) {
      return date.toLocaleDateString('fr-FR', { weekday: 'long' });
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
      });
    }
  };

  const handleConversationPress = (conversation: Conversation) => {
    Alert.alert(
      'Ouvrir la conversation',
      `Conversation avec ${conversation.participant.prenom} ${conversation.participant.nom}`,
      [
        {
          text: 'Ouvrir',
          onPress: () => {
            // Navigation vers l'écran de chat
            Alert.alert('Chat', 'Interface de chat à implémenter');
          },
        },
        {
          text: 'Annuler',
          style: 'cancel',
        },
      ]
    );
  };

  const renderConversation = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => handleConversationPress(item)}
    >
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Ionicons
            name={item.participant.role === 'MEDECIN' ? 'medical' : 'business'}
            size={24}
            color="#007AFF"
          />
        </View>
        {item.participant.role === 'MEDECIN' && (
          <View style={styles.doctorBadge}>
            <Ionicons name="checkmark" size={12} color="white" />
          </View>
        )}
      </View>

      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.participantName}>
            {item.participant.prenom} {item.participant.nom}
          </Text>
          <Text style={styles.messageDate}>
            {formatDate(item.dernierMessage.dateEnvoi)}
          </Text>
        </View>

        <View style={styles.messagePreview}>
          <Text
            style={[
              styles.lastMessage,
              item.nonLus > 0 && styles.unreadMessage,
            ]}
            numberOfLines={2}
          >
            {item.dernierMessage.expediteur === 'MOI' && 'Vous: '}
            {item.dernierMessage.contenu}
          </Text>

          {item.nonLus > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>
                {item.nonLus > 99 ? '99+' : item.nonLus}
              </Text>
            </View>
          )}
        </View>
      </View>

      <Ionicons name="chevron-forward" size={16} color="#ccc" />
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="chatbubbles-outline" size={60} color="#ccc" />
      <Text style={styles.emptyTitle}>Aucune conversation</Text>
      <Text style={styles.emptySubtitle}>
        Vos messages avec les médecins apparaîtront ici
      </Text>
      <TouchableOpacity
        style={styles.emptyActionButton}
        onPress={() => router.push('/(patient)/(tabs)/home')}
      >
        <Text style={styles.emptyActionText}>Prendre un rendez-vous</Text>
      </TouchableOpacity>
    </View>
  );

  const totalUnread = conversations.reduce((sum, conv) => sum + conv.nonLus, 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        {totalUnread > 0 && (
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>
              {totalUnread > 99 ? '99+' : totalUnread}
            </Text>
          </View>
        )}
      </View>

      {/* Messages d'information */}
      <View style={styles.infoSection}>
        <View style={styles.infoCard}>
          <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
          <Text style={styles.infoText}>
            Vos conversations sont sécurisées et confidentielles
          </Text>
        </View>
      </View>

      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.conversationsList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadConversations} />
        }
        ListEmptyComponent={renderEmptyState}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {/* Actions rapides */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => {
            Alert.alert('Urgence', 'En cas d\'urgence, contactez immédiatement les services d\'urgence');
          }}
        >
          <Ionicons name="call" size={20} color="white" />
          <Text style={styles.quickActionText}>Urgence</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickActionButton, styles.secondaryButton]}
          onPress={() => {
            Alert.alert('Aide', 'Service d\'aide et FAQ à venir');
          }}
        >
          <Ionicons name="help-circle" size={20} color="#007AFF" />
          <Text style={[styles.quickActionText, styles.secondaryButtonText]}>
            Aide
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  headerBadge: {
    backgroundColor: '#FF5722',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  headerBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  infoSection: {
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  conversationsList: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: 100,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E6F3FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  doctorBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  messageDate: {
    fontSize: 12,
    color: '#666',
  },
  messagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    marginRight: 8,
  },
  unreadMessage: {
    color: '#333',
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  unreadCount: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  separator: {
    height: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  emptyActionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  emptyActionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  quickActions: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#FF5722',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  quickActionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#007AFF',
  },
});