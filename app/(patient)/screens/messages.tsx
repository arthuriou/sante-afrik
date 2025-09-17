import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { API_BASE_URL, apiService, Conversation } from '../../../services/api';
import { useNotifications } from '../../../services/notificationContext';
import { bindMessagingRealtime, createSocket } from '../../../services/socket';

export default function MessagesScreen() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [meId, setMeId] = useState<string | undefined>();
  const { updateUnreadCount } = useNotifications();

  // Charger les conversations
  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await apiService.getConversations();
      setConversations(response.data || []);
    } catch (error) {
      console.error('Erreur chargement conversations:', error);
      Alert.alert('Erreur', 'Impossible de charger les conversations');
    } finally {
      setLoading(false);
    }
  };

  // Rafraîchir les conversations
  const onRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  };

  // Rafraîchir automatiquement quand on revient sur l'écran
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 Focus sur l\'écran messages patient - rafraîchissement automatique');
      loadConversations();
      updateUnreadCount(); // Mettre à jour le compteur de notifications
    }, [])
  );

  // Charger au montage du composant
  useEffect(() => {
    loadConversations();
    
    // Récupérer mon ID
    const getMyId = async () => {
      try {
        const me = await apiService.getProfile();
        const myId = (me as any)?.data?.idutilisateur || (me as any)?.data?.id;
        setMeId(myId);
      } catch (error) {
        console.log('Erreur récupération profil:', error);
      }
    };
    getMyId();

    // Configurer les événements en temps réel
    let socket: any;
    const setupRealtime = async () => {
      try {
        socket = await createSocket();
        bindMessagingRealtime(socket, {
          onNewMessage: (data) => {
            console.log('📨 Nouveau message reçu dans liste patient:', data);
            // Le backend envoie { message: {...}, conversationId: "..." }
            const message = data?.message || data;
            const conversationId = data?.conversationId || data?.conversation_id;
            
            // Mettre à jour la conversation spécifique
            setConversations(prev => 
              prev.map(conv => 
                conv.idconversation === conversationId
                  ? {
                      ...conv,
                      dernier_message: message,
                      nombre_messages_non_lus: (conv.nombre_messages_non_lus || 0) + 1
                    }
                  : conv
              )
            );
          },
          onConversationRead: (data) => {
            console.log('👁️ Conversation lue:', data);
            // Mettre à jour le statut de lecture
            setConversations(prev => 
              prev.map(conv => 
                conv.idconversation === data.conversation_id 
                  ? { ...conv, nombre_messages_non_lus: 0 }
                  : conv
              )
            );
          }
        });
      } catch (error) {
        console.error('Erreur setup temps réel:', error);
      }
    };
    setupRealtime();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="chatbubbles-outline" size={64} color="#C7C7CC" />
      </View>
      <Text style={styles.emptyTitle}>Aucune conversation</Text>
      <Text style={styles.emptySubtitle}>
        Vos conversations avec vos médecins apparaîtront ici
      </Text>
      <TouchableOpacity style={styles.startConversationButton}>
        <Ionicons name="add-circle" size={20} color="white" />
        <Text style={styles.startConversationText}>Commencer une conversation</Text>
      </TouchableOpacity>
    </View>
  );

  const renderConversation = ({ item }: { item: Conversation }) => {
    // Debug: afficher les participants
    console.log('🔍 Participants pour conversation:', item.idconversation, {
      meId,
      participants: item.participants.map(p => ({
        id: p?.utilisateur?.idutilisateur,
        role: p?.role_participant,
        nom: `${p?.utilisateur?.prenom} ${p?.utilisateur?.nom}`,
        isMe: meId ? String(p?.utilisateur?.idutilisateur) === String(meId) : false
      }))
    });

    // Trouver le médecin (participant différent de moi)
    // Puisque le type ne contient que MEMBRE/ADMIN, on prend simplement celui qui n'est pas moi
    const finalParticipant = meId 
      ? item.participants.find(p => String(p?.utilisateur?.idutilisateur) !== String(meId))
      : item.participants[0]; // Si pas d'ID, prendre le premier
    
    console.log('👨‍⚕️ Médecin trouvé:', {
      finalParticipant: finalParticipant ? `${finalParticipant.utilisateur?.prenom} ${finalParticipant.utilisateur?.nom}` : null
    });
    
    const contactName = finalParticipant 
      ? `${finalParticipant.utilisateur?.prenom || ''} ${finalParticipant.utilisateur?.nom || ''}`.trim() || 'Médecin'
      : 'Médecin';
    
    const lastMessage = item.dernier_message?.contenu || 'Aucun message';
    const timestamp = item.dernier_message?.dateEnvoi ? new Date(item.dernier_message.dateEnvoi).toLocaleDateString() : '';
    const hasUnread = item.nombre_messages_non_lus > 0;
    const doctorPhoto = (finalParticipant?.utilisateur as any)?.photoprofil;

    return (
      <TouchableOpacity 
        style={styles.conversationCard}
        onPress={() => {
          router.push(`/(patient)/screens/messages/${item.idconversation}`);
        }}
      >
        <View style={styles.avatarContainer}>
          {doctorPhoto ? (
            <Image 
              source={{ 
                uri: doctorPhoto.startsWith('http') ? doctorPhoto : 
                     doctorPhoto.startsWith('/') ? `${API_BASE_URL}${doctorPhoto}` : 
                     `${API_BASE_URL}/${doctorPhoto}`
              }} 
              style={styles.avatarImage}
              onError={() => {
                // En cas d'erreur de chargement, on pourrait essayer de récupérer via API
                console.log('Erreur chargement avatar médecin:', doctorPhoto);
              }}
            />
          ) : (
            <View style={styles.avatar}>
              <Ionicons name="person" size={24} color="#007AFF" />
            </View>
          )}
          {hasUnread && <View style={styles.unreadBadge} />}
        </View>
        
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={styles.contactName}>{contactName}</Text>
            <Text style={styles.timestamp}>{timestamp}</Text>
          </View>
          <Text style={styles.lastMessage} numberOfLines={2}>
            {lastMessage}
          </Text>
        </View>
        
        <View style={styles.conversationActions}>
          {hasUnread && (
            <View style={styles.unreadCount}>
              <Text style={styles.unreadCountText}>{item.nombre_messages_non_lus}</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header iOS-style */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity style={styles.newMessageButton}>
          <Ionicons name="create-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Chargement des conversations...</Text>
          </View>
        ) : conversations.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={conversations}
            renderItem={renderConversation}
            keyExtractor={(item) => item.idconversation}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.conversationsList}
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
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
    backgroundColor: 'white',
    borderBottomWidth: 0.5,
    borderBottomColor: '#C6C6C8',
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#000',
  },
  newMessageButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  startConversationButton: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  startConversationText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  conversationsList: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  conversationCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF3B30',
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
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  timestamp: {
    fontSize: 13,
    color: '#8E8E93',
  },
  lastMessage: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 18,
  },
  conversationActions: {
    marginLeft: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  unreadCount: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  unreadCountText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
  },
});


