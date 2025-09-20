import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { socketService } from '../../services/socketService';
import { AppDispatch, RootState } from '../../store';
import { addMessage, fetchMessages, sendMessage } from '../../store/slices/messageSlice';
import { Message } from '../../types';

export default function ChatScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { messages, loading } = useSelector((state: RootState) => state.messages);
  
  const { conversationId } = route.params as { conversationId: string };

  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadMessages();
    setupSocketListeners();
    
    return () => {
      socketService.leaveConversation(conversationId);
    };
  }, [conversationId]);

  const loadMessages = async () => {
    dispatch(fetchMessages(conversationId));
  };

  const setupSocketListeners = () => {
    socketService.joinConversation(conversationId);
    
    socketService.onNewMessage((message: Message) => {
      if (message.conversation.idConversation === conversationId) {
        dispatch(addMessage(message));
      }
    });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    const messageData = {
      conversationId,
      contenu: newMessage.trim(),
      type: 'TEXTE',
    };

    setSending(true);
    try {
      await dispatch(sendMessage(messageData));
      setNewMessage('');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'envoyer le message');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isMyMessage = (message: Message) => {
    return message.expediteur.id === user?.id;
  };

  const renderMessage = ({ item: message }: { item: Message }) => {
    const isMine = isMyMessage(message);
    
    return (
      <View style={[styles.messageContainer, isMine && styles.myMessageContainer]}>
        <View style={[styles.messageBubble, isMine && styles.myMessageBubble]}>
          <Text style={[styles.messageText, isMine && styles.myMessageText]}>
            {message.contenu}
          </Text>
          <Text style={[styles.messageTime, isMine && styles.myMessageTime]}>
            {formatTime(message.dateEnvoi)}
          </Text>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="chatbubbles-outline" size={64} color="#bdc3c7" />
      <Text style={styles.emptyStateText}>Aucun message</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#2c3e50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Conversation</Text>
        <TouchableOpacity>
          <Ionicons name="call" size={24} color="#3498db" />
        </TouchableOpacity>
      </View>

      <View style={styles.messagesContainer}>
        {messages.length > 0 ? (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.idMessage}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContent}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          renderEmptyState()
        )}
      </View>

      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            placeholder="Tapez votre message..."
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={handleSendMessage}
          />
          <TouchableOpacity style={styles.attachButton}>
            <Ionicons name="attach" size={20} color="#7f8c8d" />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity
          style={[styles.sendButton, (!newMessage.trim() || sending) && styles.sendButtonDisabled]}
          onPress={handleSendMessage}
          disabled={!newMessage.trim() || sending}
        >
          <Ionicons 
            name="send" 
            size={20} 
            color={newMessage.trim() && !sending ? "white" : "#bdc3c7"} 
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 15,
  },
  messageContainer: {
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  myMessageContainer: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  myMessageBubble: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  messageText: {
    fontSize: 14,
    color: '#2c3e50',
    lineHeight: 18,
  },
  myMessageText: {
    color: 'white',
  },
  messageTime: {
    fontSize: 11,
    color: '#7f8c8d',
    marginTop: 4,
    textAlign: 'right',
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 15,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 15,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e1e8ed',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#2c3e50',
    maxHeight: 100,
    paddingVertical: 8,
  },
  attachButton: {
    padding: 4,
    marginLeft: 8,
  },
  sendButton: {
    backgroundColor: '#3498db',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#e1e8ed',
  },
});
