import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { apiService, Message } from '../../../../services/api';

export default function MedecinConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState('');
  const listRef = useRef<FlatList>(null);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await apiService.getMessages(id);
      setMessages(response.data || []);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 0);
      // Marquer la conversation comme lue
      await apiService.markConversationAsRead(id);
    } catch (error) {
      console.error('Erreur chargement messages:', error);
      Alert.alert('Erreur', 'Impossible de charger les messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [id]);

  const send = async () => {
    if (!input.trim()) return;
    try {
      setSending(true);
      await apiService.sendMessage(id, input.trim());
      setInput('');
      await loadMessages();
    } catch (error) {
      Alert.alert('Erreur', 'Envoi impossible');
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMine = (item as any).est_mien === true;
    return (
      <View style={[styles.bubble, isMine ? styles.bubbleRight : styles.bubbleLeft]}>
        <Text style={[styles.bubbleText, isMine && styles.bubbleTextRight]}>{item.contenu}</Text>
        <Text style={[styles.bubbleTime, isMine && styles.bubbleTimeRight]}>{new Date(item.dateEnvoi).toLocaleTimeString()}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Conversation</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.content}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Chargement...</Text>
            </View>
          ) : (
            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={(item) => item.idmessage}
              renderItem={renderMessage}
              contentContainerStyle={styles.messagesList}
              onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            />
          )}
        </View>

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Écrire un message..."
            value={input}
            onChangeText={setInput}
            editable={!sending}
          />
          <TouchableOpacity style={styles.sendButton} onPress={send} disabled={sending}>
            <Ionicons name="send" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  backButton: { padding: 6 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  content: { flex: 1, paddingHorizontal: 12, paddingTop: 8 },
  loadingContainer: { marginTop: 40, alignItems: 'center' },
  loadingText: { marginTop: 8, color: '#6B7280' },
  messagesList: { paddingBottom: 8 },
  bubble: {
    maxWidth: '78%',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  bubbleLeft: { alignSelf: 'flex-start', backgroundColor: '#FFFFFF' },
  bubbleRight: { alignSelf: 'flex-end', backgroundColor: '#007AFF' },
  bubbleText: { color: '#111827' },
  bubbleTextRight: { color: '#FFFFFF' },
  bubbleTime: { fontSize: 10, color: '#6B7280', marginTop: 4 },
  bubbleTimeRight: { color: '#E5E7EB' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0.5,
    borderTopColor: '#E5E5EA',
  },
  input: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
});


