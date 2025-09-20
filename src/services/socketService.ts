import AsyncStorage from '@react-native-async-storage/async-storage';
import { io, Socket } from 'socket.io-client';
import API_CONFIG from '../config/api';

class SocketService {
  private socket: Socket | null = null;

  async connect() {
    const token = await AsyncStorage.getItem('token');
    if (!token) return;

    // Utiliser la même base URL que l'API mais sans /api
    const socketUrl = API_CONFIG.BASE_URL.replace('/api', '');
    console.log('🔌 Connexion Socket.IO vers:', socketUrl);
    
    this.socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'] // Ajouter le support polling
    });

    this.socket.on('connect', () => {
      console.log('Connecté au serveur Socket.IO');
    });

    this.socket.on('disconnect', () => {
      console.log('Déconnecté du serveur Socket.IO');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Erreur de connexion Socket.IO:', error);
    });
  }

  onNewMessage(callback: (message: any) => void) {
    this.socket?.on('new_message', callback);
  }

  onConsultationUpdate(callback: (data: any) => void) {
    this.socket?.on('consultation:started', callback);
    this.socket?.on('consultation:ended', callback);
    this.socket?.on('patient:arrived', callback);
  }

  onAppointmentUpdate(callback: (data: any) => void) {
    this.socket?.on('appointment:created', callback);
    this.socket?.on('appointment:updated', callback);
    this.socket?.on('appointment:cancelled', callback);
  }

  onNotification(callback: (notification: any) => void) {
    this.socket?.on('notification', callback);
  }

  // Émettre des événements
  joinConversation(conversationId: string) {
    this.socket?.emit('join_conversation', conversationId);
  }

  leaveConversation(conversationId: string) {
    this.socket?.emit('leave_conversation', conversationId);
  }

  joinDoctorRoom(medecinId: string) {
    this.socket?.emit('join_doctor_room', medecinId);
  }

  joinPatientRoom(patientId: string) {
    this.socket?.emit('join_patient_room', patientId);
  }

  disconnect() {
    this.socket?.disconnect();
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();
