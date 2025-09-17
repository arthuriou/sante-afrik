import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    RefreshControl,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { API_BASE_URL, apiService, Conversation, Patient } from '../../../services/api';
import { bindMessagingRealtime, createSocket } from '../../../services/socket';

export default function MedecinMessagesScreen() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [socketReady, setSocketReady] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [userPhotoById, setUserPhotoById] = useState<Record<string, string>>({});

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

  const onRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  };

  // Rafraîchir automatiquement quand on revient sur l'écran
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 Focus sur l\'écran messages médecin - rafraîchissement automatique');
      loadConversations();
    }, [])
  );

  useEffect(() => {
    loadConversations();
    // Précharger patients pour démarrer une conversation si liste vide
    (async () => {
      try {
        const resp = await apiService.getPatients();
        setPatients(resp.data || []);
      } catch {}
    })();
    // Socket temps réel: rafraîchir la liste quand nouveau message
    (async () => {
      try {
        const socket = await createSocket();
        bindMessagingRealtime(socket, {
          onNewMessage: (data) => {
            console.log('📨 Nouveau message reçu dans liste médecin:', data);
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
            console.log('👁️ Conversation lue par médecin:', data);
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
        setSocketReady(true);
      } catch (error) {
        console.error('Erreur setup socket médecin:', error);
      }
    })();
  }, []);

  const startPrivateConversation = async (participantUserId: string) => {
    try {
      const conv = await apiService.createOrGetPrivateConversation(participantUserId);
      const conversationId = (conv as any)?.data?.idconversation || (conv as any)?.idconversation;
      const id = conversationId || (conv as any)?.data?.data?.idconversation;
      const finalId = id || conversationId;
      if (finalId) {
        try { await apiService.markConversationAsRead(finalId); } catch {}
        router.push({ pathname: '/(medecin)/screens/messages/[id]', params: { id: String(finalId) } } as any);
      } else {
        Alert.alert('Erreur', 'Conversation introuvable');
      }
    } catch (e: any) {
      Alert.alert('Erreur', e.message || 'Impossible de créer la conversation');
    }
  };

  const openConversation = async (conversationId: string) => {
    try {
      await apiService.markConversationAsRead(conversationId);
    } catch {}
    router.push({ pathname: '/(medecin)/screens/messages/[id]', params: { id: conversationId } } as any);
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="chatbubbles-outline" size={64} color="#C7C7CC" />
      </View>
      <Text style={styles.emptyTitle}>Aucune conversation</Text>
      <Text style={styles.emptySubtitle}>Vos conversations apparaîtront ici</Text>
      <TouchableOpacity style={styles.startConversationButton} onPress={() => router.push('/(medecin)/screens/patients' as any)}>
        <Ionicons name="add-circle" size={20} color="white" />
        <Text style={styles.startConversationText}>Nouvelle conversation</Text>
      </TouchableOpacity>
    </View>
  );

  const renderConversation = ({ item }: { item: Conversation }) => {
    const other = item.participants.find(p => p.role_participant === 'MEMBRE');
    const contactName = other ? `${other.utilisateur.prenom} ${other.utilisateur.nom}` : 'Contact';
    const lastMessage = item.dernier_message?.contenu || 'Aucun message';
    const timestamp = item.dernier_message?.dateEnvoi ? new Date(item.dernier_message.dateEnvoi).toLocaleDateString() : '';
    const hasUnread = item.nombre_messages_non_lus > 0;
    const otherId = other?.utilisateur?.idutilisateur;
    const photo = (otherId && userPhotoById[otherId]) ? userPhotoById[otherId] : undefined;
    if (otherId && !userPhotoById[otherId]) {
      // Chargement paresseux de la photo profil
      (async () => {
        try {
          const resp = await apiService.getUserById(otherId);
          const p = (resp as any)?.data?.photoprofil || resp?.data?.photoprofil;
          if (p) setUserPhotoById(prev => ({ ...prev, [otherId]: p.startsWith('http') ? p : `${API_BASE_URL}${p}` }));
        } catch {}
      })();
    }

    return (
      <TouchableOpacity style={styles.conversationCard} onPress={() => openConversation(item.idconversation)}>
        <View style={styles.avatarContainer}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.avatarImg} />
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
          <Text style={styles.lastMessage} numberOfLines={2}>{lastMessage}</Text>
        </View>

        {hasUnread && (
          <View style={styles.unreadCount}>
            <Text style={styles.unreadCountText}>{item.nombre_messages_non_lus}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity style={styles.newMessageButton} onPress={() => router.push('/(medecin)/screens/patients' as any)}>
          <Ionicons name="create-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Chargement des conversations...</Text>
          </View>
        ) : conversations.length === 0 ? (
          // Liste de patients pour démarrer une conversation
          <View style={{ flex: 1 }}>
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={20} color="#8E8E93" />
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher un patient..."
                placeholderTextColor="#8E8E93"
                value={search}
                onChangeText={setSearch}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Ionicons name="close-circle" size={20} color="#8E8E93" />
                </TouchableOpacity>
              )}
            </View>
            <FlatList
              data={patients.filter(p => `${p.prenom} ${p.nom}`.toLowerCase().includes(search.toLowerCase()))}
              keyExtractor={(item) => item.idpatient}
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
              contentContainerStyle={{ paddingBottom: 24, paddingTop: 8 }}
              renderItem={({ item }) => {
                const photo = (item as any).photoprofil as string | undefined;
                const uri = photo ? (photo.startsWith('http') ? photo : `${API_BASE_URL}${photo}`) : undefined;
                return (
                  <TouchableOpacity style={styles.patientRow} onPress={() => startPrivateConversation((item as any).idutilisateur || item.idpatient)}>
                    {uri ? (
                      <Image source={{ uri }} style={styles.patientAvatarImg} />
                    ) : (
                      <View style={styles.patientAvatar}><Ionicons name="person" size={20} color="#007AFF" /></View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.patientName}>{item.prenom} {item.nom}</Text>
                      <Text style={styles.patientMeta}>{item.telephone || item.email || ''}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={renderEmptyState()}
            />
          </View>
        ) : (
          <FlatList
            data={conversations}
            renderItem={renderConversation}
            keyExtractor={(item) => item.idconversation}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.conversationsList}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  newMessageButton: {
    position: 'absolute',
    right: 20,
    top: 16,
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  loadingContainer: {
    marginTop: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#6B7280',
  },
  conversationsList: {
    paddingBottom: 24,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF2FF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#000',
  },
  patientRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 12, borderRadius: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  patientAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E5F0FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  patientAvatarImg: { width: 36, height: 36, borderRadius: 18, marginRight: 12, backgroundColor: '#E5F0FF' },
  patientName: { fontSize: 16, fontWeight: '600', color: '#111827' },
  patientMeta: { fontSize: 12, color: '#6B7280' },
  emptyState: {
    alignItems: 'center',
    marginTop: 80,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  emptySubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: '#6B7280',
  },
  startConversationButton: {
    marginTop: 16,
    backgroundColor: '#2E7CF6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  startConversationText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  conversationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E5F0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: { width: 44, height: 44, borderRadius: 22 },
  unreadBadge: {
    position: 'absolute',
    right: -2,
    top: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF3B30',
    borderWidth: 2,
    borderColor: '#FFFFFF',
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
    color: '#111827',
  },
  timestamp: {
    fontSize: 12,
    color: '#6B7280',
  },
  lastMessage: {
    fontSize: 14,
    color: '#4B5563',
  },
  unreadCount: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  unreadCountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});


