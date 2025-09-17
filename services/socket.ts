import AsyncStorage from '@react-native-async-storage/async-storage';
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from './api';

export async function createSocket(): Promise<Socket> {
  const token = (await AsyncStorage.getItem('userToken')) || '';
  const socket = io(API_BASE_URL, {
    transports: ['websocket'],
    auth: { token },
    autoConnect: true,
    reconnection: true,
  });
  socket.on('connect', () => console.log('Socket connecté', socket.id));
  socket.on('disconnect', () => console.log('Socket déconnecté'));
  return socket;
}

export function bindMessagingRealtime(socket: Socket, handlers: { 
  onNewMessage?: (m: any)=>void; 
  onMessageRead?: (p: any)=>void;
  onConversationRead?: (data: { conversation_id: string; reader_id: string }) => void;
}) {
  socket.on('message:new', (payload: any) => handlers.onNewMessage?.(payload?.data));
  socket.on('message:read', (payload: any) => handlers.onMessageRead?.(payload?.data));
  
  // NOUVEAU - Gestion du statut "Lu"
  if (handlers.onConversationRead) {
    socket.on('conversation_read', handlers.onConversationRead);
  }
}

export function joinConversation(socket: Socket, conversationId: string) {
  socket.emit('join-room', `conversation:${conversationId}`);
}

export function leaveConversation(socket: Socket, conversationId: string) {
  socket.emit('leave-room', `conversation:${conversationId}`);
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


