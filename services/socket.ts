import AsyncStorage from '@react-native-async-storage/async-storage';
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from './api';

export async function createSocket(): Promise<Socket> {
  const token = (await AsyncStorage.getItem('userToken')) || '';
  console.log('🔌 Création socket avec token:', token ? 'présent' : 'absent');
  
  const socket = io(API_BASE_URL, {
    transports: ['websocket', 'polling'],
    auth: { token },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });
  
  socket.on('connect', () => {
    console.log('✅ Socket connecté avec ID:', socket.id);
  });
  
  socket.on('disconnect', (reason) => {
    console.log('❌ Socket déconnecté, raison:', reason);
  });
  
  socket.on('connect_error', (error) => {
    console.error('❌ Erreur connexion socket:', error);
  });
  
  // Écouter tous les événements pour debug
  socket.onAny((event, ...args) => {
    console.log('📡 Événement reçu:', event, args);
  });
  
  return socket;
}

export function bindMessagingRealtime(socket: Socket, handlers: { 
  onNewMessage?: (m: any)=>void; 
  onMessageRead?: (p: any)=>void;
  onConversationRead?: (data: { conversation_id: string; reader_id: string }) => void;
}) {
  console.log('🔗 Configuration des handlers Socket.IO');
  
  // Écouter l'événement principal pour les nouveaux messages
  socket.on('message:new', (data: any) => {
    console.log('📨 Événement message:new reçu:', data);
    handlers.onNewMessage?.(data);
  });
  
  // Écouter aussi l'événement alternatif pour compatibilité
  socket.on('new_message', (data: any) => {
    console.log('📨 Événement new_message reçu:', data);
    handlers.onNewMessage?.(data);
  });
  
  socket.on('message:read', (payload: any) => {
    console.log('👁️ Événement message:read reçu:', payload);
    handlers.onMessageRead?.(payload?.data);
  });
  
  // Gestion du statut "Lu"
  if (handlers.onConversationRead) {
    socket.on('conversation_read', (data: any) => {
      console.log('👁️ Événement conversation_read reçu:', data);
      handlers.onConversationRead(data);
    });
  }
}

export function joinConversation(socket: Socket, conversationId: string) {
  console.log('🔌 Rejoindre conversation:', conversationId);
  socket.emit('join_conversation', { conversationId });
}

export function leaveConversation(socket: Socket, conversationId: string) {
  console.log('🔌 Quitter conversation:', conversationId);
  socket.emit('leave_conversation', { conversationId });
}

export function bindRdvRealtime(socket: Socket, handlers: {
  onCreated?: (d:any)=>void; onConfirmed?: (d:any)=>void; onCancelled?: (d:any)=>void; onCreneauConflict?: (d:any)=>void; onCreneauAvailable?: (d:any)=>void;
}) {
  socket.on('rendezvous:created', (p:any) => handlers.onCreated?.(p?.data));
  socket.on('rendezvous:new', (p:any) => handlers.onCreated?.(p?.data));
  socket.on('rendezvous:confirmed', (p:any) => handlers.onConfirmed?.(p?.data));
  socket.on('rendezvous:cancelled', (p:any) => handlers.onCancelled?.(p?.data));
  socket.on('creneau:conflict', (p:any) => handlers.onCreneauConflict?.(p?.data));
  socket.on('creneau:available', (p:any) => handlers.onCreneauAvailable?.(p?.data));
}


