import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import API_CONFIG from '../config/api';

// Configuration axios pour React Native
const axiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

class ApiService {
  private token: string | null = null;

  constructor() {
    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Intercepteur pour ajouter le token automatiquement
    axiosInstance.interceptors.request.use(async (config: any) => {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Intercepteur pour gérer les erreurs
    axiosInstance.interceptors.response.use(
      (response: any) => response,
      async (error: any) => {
        console.log('API Error:', error);
        
        if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
          console.log('Network error - check if backend is running and accessible');
          return Promise.reject(new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.'));
        }
        
        if (error.response?.status === 401) {
          await AsyncStorage.removeItem('token');
          return Promise.reject(new Error('Session expirée. Veuillez vous reconnecter.'));
        }
        
        if (error.response?.status >= 500) {
          return Promise.reject(new Error('Erreur du serveur. Veuillez réessayer plus tard.'));
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Authentification
  async login(email: string, password: string) {
    console.log('🔐 Tentative de connexion pour:', email);
    const response = await axiosInstance.post('/auth/login', {
      email,
      motdepasse: password  // Le backend attend 'motdepasse' au lieu de 'password'
    });
    console.log('✅ Réponse de connexion:', response.data);
    await AsyncStorage.setItem('token', response.data.data.token);
    
    // Récupérer le profil complet avec le rôle
    console.log('👤 Récupération du profil utilisateur...');
    const profileResponse = await this.getProfile();
    console.log('✅ Profil utilisateur récupéré:', profileResponse.data);
    
    return {
      ...response.data,
      data: {
        ...response.data.data,
        user: profileResponse.data.data  // Remplacer l'utilisateur par le profil complet
      }
    };
  }

  async sendOTP(telephone: string) {
    return axiosInstance.post('/auth/send-otp', { telephone });
  }

  async verifyOTP(email: string, otp: string) {
    return axiosInstance.post('/auth/verify-otp', { email, otp });
  }

  async createPatient(patientData: any) {
    return axiosInstance.post('/auth/register-patient', patientData);
  }

  async createMedecin(medecinData: any) {
    return axiosInstance.post('/auth/register-doctor', medecinData);
  }

  // Récupérer le profil utilisateur avec le rôle
  async getProfile() {
    return axiosInstance.get('/auth/profile');
  }

  // Mettre à jour le profil utilisateur
  async updateProfile(profileData: any) {
    return axiosInstance.put('/auth/profile', profileData);
  }

  // Mettre à jour le profil patient
  async updatePatientProfile(patientData: any) {
    return axiosInstance.patch('/auth/profile/patient', patientData);
  }

  // Mettre à jour le profil médecin
  async updateMedecinProfile(medecinData: any) {
    return axiosInstance.patch('/auth/profile/medecin', medecinData);
  }

  // Uploader la photo de profil
  async uploadProfilePhoto(imageData: any) {
    const formData = new FormData();
    formData.append('file', imageData);
    
    return axiosInstance.post('/auth/profile/photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // Changer le mot de passe
  async changePassword(passwordData: { ancienMotDePasse: string; nouveauMotDePasse: string }) {
    return axiosInstance.post('/auth/change-password', passwordData);
  }

  // Recherche de médecins
  async searchDoctors(params: any) {
    return axiosInstance.get(`/specialites/medecins/search`, { params });
  }

  async getSpecialties() {
    return axiosInstance.get(`/specialites/specialites`);
  }

  async getAvailableSlots(medecinId: string) {
    return axiosInstance.get(`/rendezvous/medecin/${medecinId}/creneaux-disponibles`);
  }

  // Rendez-vous
  async createAppointment(data: any) {
    return axiosInstance.post(`/rendezvous`, data);
  }

  async getPatientAppointments(patientId: string) {
    return axiosInstance.get(`/rendezvous/patient/${patientId}`);
  }

  async getTodayAppointments() {
    return axiosInstance.get(`/rendezvous/aujourd-hui`);
  }

  async getWaitingPatients() {
    return axiosInstance.get(`/rendezvous/en-attente-consultation`);
  }

  async startConsultation(appointmentId: string) {
    return axiosInstance.put(`/rendezvous/${appointmentId}/commencer-consultation`);
  }

  async endConsultation(appointmentId: string) {
    return axiosInstance.put(`/rendezvous/${appointmentId}/cloturer-consultation`);
  }

  async markPatientArrived(appointmentId: string) {
    return axiosInstance.put(`/rendezvous/${appointmentId}/patient-arrive`);
  }

  // Messagerie
  async createPrivateConversation(participantId: string) {
    return axiosInstance.post(`/messagerie/conversations/private`, {
      participantId
    });
  }

  async getConversations() {
    return axiosInstance.get(`/messagerie/conversations`);
  }

  async sendMessage(data: any) {
    return axiosInstance.post(`/messagerie/messages`, data);
  }

  async getMessages(conversationId: string) {
    return axiosInstance.get(`/messagerie/conversations/${conversationId}/messages`);
  }

  // Dossier médical
  async getMedicalRecord() {
    return axiosInstance.get(`/dossier-medical/dossier/me`);
  }

  async getMedicalDocuments(dossierId: string) {
    return axiosInstance.get(`/dossier-medical/${dossierId}/documents`);
  }

  async uploadDocument(data: FormData) {
    return axiosInstance.post(`/dossier-medical/documents`, data, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }

  // Agenda et créneaux
  async getDoctorAgendas(medecinId: string) {
    return axiosInstance.get(`/rendezvous/medecin/${medecinId}/agendas`);
  }

  async createAgenda(data: any) {
    return axiosInstance.post(`/rendezvous/agendas`, data);
  }

  async createTimeSlot(data: any) {
    return axiosInstance.post(`/rendezvous/creneaux`, data);
  }

  // Ordonnances
  async createPrescription(data: any) {
    return axiosInstance.post(`/ordonnances`, data);
  }

  async getPrescriptions(patientId: string) {
    return axiosInstance.get(`/ordonnances/patient/${patientId}`);
  }

  // Notifications
  async getNotificationPreferences() {
    return axiosInstance.get(`/notification-preferences`);
  }

  async updateNotificationPreferences(data: any) {
    return axiosInstance.put(`/notification-preferences`, data);
  }

  async getNotificationHistory() {
    return axiosInstance.get(`/notification-history`);
  }
}

export const apiService = new ApiService();
