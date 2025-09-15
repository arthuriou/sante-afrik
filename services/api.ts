import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError } from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';


// Détermination robuste de l'URL de base API selon l'environnement (Expo Go, émulateur, web)
function resolveApiBaseUrl(): string {
  // 1) Priorité à la variable d'env
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
    return envUrl.trim().replace(/\/$/, '');
  }

  // 1.bis) Clé expo.extra.apiUrl depuis app.json
  const extraApiUrl = (Constants as any)?.expoConfig?.extra?.apiUrl || (Constants as any)?.manifest?.extra?.apiUrl;
  if (extraApiUrl && typeof extraApiUrl === 'string' && extraApiUrl.trim().length > 0) {
    return extraApiUrl.trim().replace(/\/$/, '');
  }

  // 2) Web: utiliser l'origine du site si le backend est servi sur le même host:port
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
    return window.location.origin.replace(/\/$/, '');
  }

  // 3) Expo Go / appareil réel: essayer de déduire l'IP LAN depuis hostUri
  //    ex: 192.168.x.x:19000 → on réutilise l'IP et on force port 3000
  const hostUri = (Constants as any)?.expoConfig?.hostUri || (Constants as any)?.manifest2?.extra?.expoClient?.hostUri || (Constants as any)?.manifest?.hostUri;
  if (hostUri && typeof hostUri === 'string') {
    const hostname = hostUri.split(':')[0];
    if (hostname && /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
      return `http://${hostname}:3000`;
    }
  }

  // 4) Android émulateur par défaut
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000';
  }

  // 5) iOS simulateur/dernier recours: localhost
  return 'http://localhost:3000';
}



export const API_BASE_URL = resolveApiBaseUrl();

// Types de base
export interface User {
  idutilisateur: string;
  email: string;
  nom: string;
  prenom: string;
  telephone: string;
  role: 'PATIENT' | 'MEDECIN' | 'ADMINCABINET' | 'SUPERADMIN';
  actif: boolean;
  datecreation: string;
  derniereconnexion?: string;
  photoprofil?: string;
  patient?: Patient;
  medecin?: Medecin;
}

export interface Patient {
  idpatient: string;
  idutilisateur: string;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  datenaissance: string;
  genre: 'M' | 'F';
  adresse: string;
  groupesanguin: string;
  poids: number;
  taille: number;
  actif: boolean;
  statut: 'ACTIF' | 'INACTIF';
}

export interface Medecin {
  idmedecin: string;
  nom: string;
  prenom: string;
  email: string;
  numordre: string;
  experience: number;
  biographie: string;
  statut: 'PENDING' | 'APPROVED';
  specialites?: Specialite[];
  cabinet?: Cabinet;
}

export interface Specialite {
  idspecialite: string;
  nom: string;
  description: string;
}

export interface Maux {
  idmaux: string;
  nom: string;
  description: string;
  categorie: string;
}

export interface Cabinet {
  idcabinet: string;
  nom: string;
  adresse: string;
  telephone: string;
  email: string;
  logo?: string;
  horairesouverture?: any;
}

export interface RendezVous {
  idrendezvous: string;
  patient_id: string;
  medecin_id: string;
  dateheure: string;
  duree: number;
  motif: string;
  statut: 'EN_ATTENTE' | 'CONFIRME' | 'ANNULE' | 'TERMINE' | 'EN_COURS';
  patient?: Patient;
  medecin?: Medecin;
}

export interface Creneau {
  idcreneau: string;
  agenda_id: string;
  debut: string;
  fin: string;
  disponible: boolean;
}

// Dossier médical
export interface DossierMedical {
  iddossier: string;
  patient_id: string;
  datecreation: string;
  datemaj?: string | null;
}

export interface DocumentMedical {
  iddocument: string;
  dossier_id: string;
  nom: string;
  type: string;
  url: string;
  mimetype: string;
  taillekb: number;
  dateupload: string;
  ispublic: boolean;
}

// Interfaces pour la messagerie
export interface Conversation {
  idconversation: string;
  type_conversation: 'PRIVEE' | 'GROUPE_CABINET' | 'SUPPORT';
  titre?: string;
  cabinet_id?: string;
  participants: Participant[];
  dernier_message?: Message;
  nombre_messages_non_lus: number;
}

export interface Participant {
  idParticipant: string;
  utilisateur_id: string;
  role_participant: 'MEMBRE' | 'ADMIN';
  dateRejointe: string;
  actif: boolean;
  utilisateur: {
    idutilisateur: string;
    nom: string;
    prenom: string;
    email: string;
    role: string;
  };
}

export interface Message {
  idmessage: string;
  conversation_id: string;
  expediteur_id: string;
  contenu: string;
  type_message: 'TEXTE' | 'IMAGE' | 'FICHIER' | 'SYSTEME';
  dateEnvoi: string;
  expediteur: {
    idutilisateur: string;
    nom: string;
    prenom: string;
    email: string;
    role: string;
  };
  reponse_a_message?: {
    idmessage: string;
    contenu: string;
    expediteur: {
      nom: string;
      prenom: string;
    };
  };
  lu_par: MessageLu[];
}

export interface MessageLu {
  idMessageLu: string;
  utilisateur_id: string;
  dateLecture: string;
  utilisateur: {
    nom: string;
    prenom: string;
  };
}

// Service API générique
class ApiService {
  private token: string | null = null;
  private refreshTokenValue: string | null = null;
  private isRefreshing = false;
  private pendingRequests: Array<(token: string | null) => void> = [];
  private client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
  });

  constructor() {
    this.client.interceptors.request.use((config) => {
      if (this.token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      // Log de debug pour confirmer l'URL complète appelée
      if (__DEV__) {
        // @ts-ignore
        const fullUrl = `${this.client.defaults.baseURL}${config.url}`;
        console.log('🌐 API Request →', config.method?.toUpperCase(), fullUrl);
      }
      return config;
    });

    // Intercepteur de réponse pour gérer 401 et rafraîchir le token
    this.client.interceptors.response.use(
      (res) => res,
      async (error) => {
        const originalRequest: any = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            const newToken = await this.performTokenRefresh();
            if (newToken) {
              originalRequest.headers = originalRequest.headers || {};
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return this.client(originalRequest);
          } catch (e) {
            // Échec de refresh → déconnexion silencieuse
            await this.clearSession();
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private async postMultipart<T = any>(path: string, formData: FormData): Promise<T> {
    // Utiliser fetch pour une meilleure compatibilité RN sur multipart
    await this.ensureCachedTokens();
    const url = `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: this.token ? `Bearer ${this.token}` : '',
        Accept: 'application/json',
      },
      body: formData,
    } as any);
    const text = await response.text();
    let json: any = null;
    try { json = text ? JSON.parse(text) : null; } catch {}
    if (!response.ok) {
      const message = (json && (json.error || json.message)) || `HTTP ${response.status}`;
      throw new Error(message);
    }
    return (json as T) ?? ({} as T);
  }

  setToken(token: string) {
    this.token = token;
  }

  private async setRefreshToken(refreshToken: string | null) {
    this.refreshTokenValue = refreshToken;
    if (refreshToken) {
      await AsyncStorage.setItem('refreshToken', refreshToken);
    } else {
      await AsyncStorage.removeItem('refreshToken');
    }
  }

  private async ensureCachedTokens() {
    if (!this.token) {
      const storedToken = await AsyncStorage.getItem('userToken');
      if (storedToken) this.setToken(storedToken);
    }
    if (!this.refreshTokenValue) {
      const storedRefresh = await AsyncStorage.getItem('refreshToken');
      if (storedRefresh) this.refreshTokenValue = storedRefresh;
    }
  }

  private async performTokenRefresh(): Promise<string | null> {
    // Éviter plusieurs refresh en parallèle
    await this.ensureCachedTokens();
    if (!this.refreshTokenValue) return null;
    if (this.isRefreshing) {
      return new Promise((resolve) => {
        this.pendingRequests.push((token) => resolve(token));
      });
    }
    this.isRefreshing = true;
    try {
      const resp = await this.client.post<{ message: string; data: { token: string; refreshToken?: string } }>(
        '/api/auth/refresh',
        { token: this.refreshTokenValue }
      );
      const newToken = resp.data?.data?.token;
      const newRefresh = resp.data?.data?.refreshToken;
      if (newToken) {
        this.setToken(newToken);
        await AsyncStorage.setItem('userToken', newToken);
      }
      if (newRefresh) {
        await this.setRefreshToken(newRefresh);
      }
      this.pendingRequests.forEach((cb) => cb(this.token));
      this.pendingRequests = [];
      return this.token;
    } finally {
      this.isRefreshing = false;
    }
  }

  async clearSession() {
    this.token = null;
    this.refreshTokenValue = null;
    await AsyncStorage.multiRemove(['userToken', 'refreshToken', 'userData', 'userRole']);
  }

  // Initialiser la session au démarrage de l'app
  async initializeSession(): Promise<void> {
    await this.ensureCachedTokens();
    if (!this.token && this.refreshTokenValue) {
      try {
        await this.performTokenRefresh();
      } catch {
        // ignore, restera déconnecté
      }
    }
  }

  private async request<T>(endpoint: string, options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    body?: any;
    headers?: Record<string, string>;
    params?: Record<string, any>;
  } = {}): Promise<T> {
    try {
      // S'assurer que le token est présent (ex: après redémarrage de l'app)
      if (!this.token) {
        const storedToken = await AsyncStorage.getItem('userToken');
        if (storedToken) {
          this.setToken(storedToken);
        }
      }

      const response = await this.client.request<T>({
        url: endpoint,
        method: options.method || 'GET',
        data: options.body,
        headers: options.headers,
        params: options.params,
      });
      // @ts-ignore axios wraps data
      return response.data as T;
    } catch (err) {
      const error = err as AxiosError<any>;
      if (error.response) {
        const data = error.response.data as any;
        const message = (data && (data.error || data.message)) || `HTTP ${error.response.status}`;
        throw new Error(message);
      }
      if (error.request) {
        throw new Error('Network request failed. Vérifiez votre connexion et l’URL API.');
      }
      throw new Error(error.message || 'Unknown error');
    }
  }

  // Authentification
  async registerPatient(data: {
    email: string;
    motdepasse: string;
    nom: string;
    prenom: string;
    telephone: string;
    datenaissance: string;
    genre: 'M' | 'F';
    adresse: string;
    groupesanguin: string;
    poids: number;
    taille: number;
  }) {
    return this.request('/api/auth/register-patient', {
      method: 'POST',
      body: data,
    });
  }

  async registerDoctor(data: {
    email: string;
    motdepasse: string;
    nom: string;
    prenom: string;
    telephone: string;
    numordre: string;
    experience: number;
    biographie: string;
    specialiteIds?: string[];
  }) {
    return this.request('/api/auth/register-doctor', {
      method: 'POST',
      body: data,
    });
  }

  async login(email: string, motdepasse: string) {
    const response = await this.request<{
      message: string;
      data: { user: User; token: string; refreshToken?: string };
    }>('/api/auth/login', {
      method: 'POST',
      body: { email, motdepasse },
    });

    if (response.data.token) {
      this.setToken(response.data.token);
      await AsyncStorage.setItem('userToken', response.data.token);
    }
    if (response.data.refreshToken) {
      await this.setRefreshToken(response.data.refreshToken);
    }

    return response;
  }

  async sendOtp(email: string) {
    return this.request('/api/auth/send-otp', {
      method: 'POST',
      body: { email },
    });
  }

  async verifyOtp(email: string, otp: string) {
    return this.request('/api/auth/verify-otp', {
      method: 'POST',
      body: { email, otp },
    });
  }

  async resendOtp(email: string) {
    return this.request('/api/auth/resend-otp', {
      method: 'POST',
      body: { email },
    });
  }

  async changePassword(email: string, newPassword: string) {
    return this.request('/api/auth/change-password', {
      method: 'POST',
      body: { email, newPassword },
    });
  }

  async forgotPassword(email: string) {
    return this.request('/api/auth/forgot-password', {
      method: 'POST',
      body: { email },
    });
  }

  async getProfile() {
    return this.request<{ message: string; data: User }>('/api/auth/profile');
  }

  async updateProfile(data: {
    datenaissance?: string;
    genre?: 'M' | 'F';
    adresse?: string;
    groupesanguin?: string;
    poids?: number;
    taille?: number;
  }) {
    // Certains backends exigent userId si le middleware n'attache pas l'utilisateur
    try {
      const userDataRaw = await AsyncStorage.getItem('userData');
      const userData = userDataRaw ? JSON.parse(userDataRaw) : null;
      const userId = userData?.idutilisateur;
      const body = userId ? { userId, ...data } : data;
      return this.request<{ message: string }>('/api/auth/profile/patient', {
        method: 'PATCH',
        body,
      });
    } catch {
      return this.request<{ message: string }>('/api/auth/profile/patient', {
        method: 'PATCH',
        body: data,
      });
    }
  }

  // Mise à jour informations de base utilisateur (nom, prenom, telephone)
  async updateUserProfile(data: {
    nom?: string;
    prenom?: string;
    telephone?: string;
  }) {
    try {
      const userDataRaw = await AsyncStorage.getItem('userData');
      const userData = userDataRaw ? JSON.parse(userDataRaw) : null;
      const userId = userData?.idutilisateur;
      const body = userId ? { userId, ...data } : data;
      return this.request<{ message: string; data?: User }>('/api/auth/profile', {
        method: 'PATCH',
        body,
      });
    } catch {
      return this.request<{ message: string; data?: User }>('/api/auth/profile', {
        method: 'PATCH',
        body: data,
      });
    }
  }

  async updateProfilePhoto(photoData: FormData) {
    console.log('🚀 API Upload - URL:', `${API_BASE_URL}/api/auth/profile/photo`);
    console.log('🚀 API Upload - Token présent:', !!this.token);
    console.log('🚀 API Upload - FormData:', photoData);

    try {
      const data = await this.postMultipart<{ message: string; data: { url: string; user: User; storage: string } }>(
        '/api/auth/profile/photo',
        photoData
      );
      console.log('🚀 API Upload - Succès:', data);
      return data;
    } catch (error: any) {
      console.log('🚀 API Upload - Erreur:', error.message);
      throw error;
    }
  }

  async updateProfilePhotoFromAsset(file: { uri: string; name: string; type: string }) {
    const fieldCandidates = ['file', 'photo', 'image'];
    let lastError: any = null;
    for (const key of fieldCandidates) {
      try {
        const fd = new FormData();
        // @ts-ignore RN File
        fd.append(key, { uri: file.uri, name: file.name, type: file.type } as any);
        const data = await this.postMultipart<{ message: string; data: { url: string; user: User; storage: string } }>(
          '/api/auth/profile/photo',
          fd
        );
        return data;
      } catch (e: any) {
        lastError = e;
        // Essayer la clé suivante
      }
    }
    throw lastError || new Error('Échec upload photo');
  }

  // Médecins
  async getMedecins(params?: {
    page?: number;
    limit?: number;
    search?: string;
    specialite?: string;
    cabinetId?: string;
    onlyApproved?: boolean;
  }) {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);
    if (params?.specialite) query.append('specialite', params.specialite);
    if (params?.cabinetId) query.append('cabinetId', params.cabinetId);
    if (typeof params?.onlyApproved === 'boolean') query.append('onlyApproved', String(params.onlyApproved));

    const queryString = query.toString();
    const url = `/api/auth/medecins${queryString ? `?${queryString}` : ''}`;
    return this.request<{ message: string; data: User[] }>(url);
  }

  async getUserById(userId: string) {
    return this.request<{ message: string; data: User }>(
      `/api/auth/user/${userId}`
    );
  }

  // Recherche publique de médecins APPROVED
  async getApprovedMedecinsSearch(params?: {
    page?: number;
    limit?: number;
    q?: string; // nom/prenom/email
    specialiteId?: string;
  }) {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.q) query.append('q', params.q);
    if (params?.specialiteId) query.append('specialiteId', params.specialiteId);

    const qs = query.toString();
    const url = qs ? `/api/auth/medecins/search?${qs}` : '/api/auth/medecins/search';
    return this.request<{ message: string; data: Medecin[] }>(url);
  }




  // Cabinets
  async getCabinets() {
    return this.request<{ message: string; data: Cabinet[] }>('/api/cabinets');
  }

  // Dossier médical
  async getOrCreateDossier() {
    return this.request<{ dossier: DossierMedical; created: boolean }>(`/api/dossier-medical/dossier/me`);
  }

  async listDocuments(dossierId: string) {
    return this.request<DocumentMedical[]>(`/api/dossier-medical/${dossierId}/documents`);
  }

  async addDocument(form: FormData) {
    const doc = await this.postMultipart<DocumentMedical>(`/api/dossier-medical/documents`, form);
    return doc;
  }

  async updateDocument(id: string, data: Partial<Pick<DocumentMedical, 'nom' | 'url'>>) {
    return this.request(`/api/dossier-medical/documents/${id}`, { method: 'PATCH', body: data });
  }

  async deleteDocument(id: string) {
    return this.request(`/api/dossier-medical/documents/${id}`, { method: 'DELETE' });
  }

  // === RENDEZ-VOUS ===
  
  async getRendezVousMedecin() {
    // Récupérer l'ID du médecin depuis le profil
    const profile = await this.getProfile();
    const medecinId = profile.data.medecin?.idmedecin;
    
    if (!medecinId) {
      throw new Error('ID médecin non trouvé');
    }
    
    return this.request<{ message: string; data: RendezVous[] }>(`/api/rendezvous/medecin/${medecinId}`);
  }

  async getRendezVousPatient() {
    return this.request<{ message: string; data: RendezVous[] }>('/api/rendezvous/patient/me');
  }

  async getRendezVousById(id: string) {
    return this.request<{ message: string; data: RendezVous }>(`/api/rendezvous/${id}`);
  }

  async createRendezVous(data: {
    medecin_id: string;
    dateheure: string;
    duree: number;
    motif: string;
  }) {
    return this.request<{ message: string; data: RendezVous }>('/api/rendezvous', {
        method: 'POST',
      body: data
    });
  }

  async updateRendezVous(id: string, data: {
    dateheure?: string;
    duree?: number;
    motif?: string;
    statut?: 'EN_ATTENTE' | 'CONFIRME' | 'ANNULE' | 'TERMINE';
  }) {
    return this.request<{ message: string; data: RendezVous }>(`/api/rendezvous/${id}`, {
      method: 'PUT',
      body: data
    });
  }

  async confirmerRendezVous(id: string) {
    return this.request<{ message: string; data: RendezVous }>(`/api/rendezvous/${id}/confirmer`, {
      method: 'PUT'
    });
  }

  async annulerRendezVous(id: string) {
    return this.request<{ message: string; data: RendezVous }>(`/api/rendezvous/${id}/annuler`, {
      method: 'PUT'
    });
  }

  async terminerRendezVous(id: string) {
    return this.request<{ message: string; data: RendezVous }>(`/api/rendezvous/${id}/terminer`, {
      method: 'PUT'
    });
  }

  async getCreneauxDisponibles(medecinId: string, date: string) {
    return this.request<{ message: string; data: any[] }>(`/api/rendezvous/medecin/${medecinId}/creneaux-disponibles?date=${date}`);
  }

  async getAgendasMedecin(medecinId: string) {
    return this.request<{ message: string; data: any[] }>(`/api/rendezvous/medecin/${medecinId}/agendas`);
  }

  async createCreneau(data: {
    agenda_id: string;
    debut: string;
    fin: string;
    disponible: boolean;
  }) {
    return this.request('/api/rendezvous/creneaux', {
      method: 'POST',
      body: data
    });
  }

  async updateCreneau(creneauId: string, data: {
    disponible?: boolean;
    debut?: string;
    fin?: string;
  }) {
    return this.request(`/api/rendezvous/creneaux/${creneauId}`, {
      method: 'PUT',
      body: data
    });
  }

  async deleteCreneau(creneauId: string) {
    return this.request(`/api/rendezvous/creneaux/${creneauId}`, {
      method: 'DELETE'
    });
  }

  async getPatients() {
    return this.request<{ message: string; data: Patient[] }>('/api/auth/patients');
  }

  // === MESSAGERIE ===
  
  async createOrGetPrivateConversation(participantId: string) {
    return this.request<{ message: string; data: Conversation }>('/api/messagerie/conversations/private', {
      method: 'POST',
      body: { participantId }
    });
  }

  async getConversations() {
    return this.request<{ message: string; data: Conversation[] }>('/api/messagerie/conversations');
  }

  async getConversation(id: string) {
    return this.request<{ message: string; data: Conversation }>(`/api/messagerie/conversations/${id}`);
  }

  async addParticipantToConversation(conversationId: string, participantId: string) {
    return this.request(`/api/messagerie/conversations/${conversationId}/participants`, {
      method: 'POST',
      body: { participantId }
    });
  }

  async removeParticipantFromConversation(conversationId: string, participantId: string) {
    return this.request(`/api/messagerie/conversations/${conversationId}/participants/${participantId}`, {
      method: 'DELETE'
    });
  }

  async markConversationAsRead(conversationId: string) {
    return this.request(`/api/messagerie/conversations/${conversationId}/read`, {
      method: 'POST'
    });
  }

  async sendMessage(conversationId: string, contenu: string, typeMessage: 'TEXTE' | 'IMAGE' | 'FICHIER' = 'TEXTE', reponseA?: string) {
    return this.request<{ message: string; data: Message }>('/api/messagerie/messages', {
      method: 'POST',
      body: {
        conversation_id: conversationId,
        contenu,
        type_message: typeMessage,
        reponse_a: reponseA
      }
    });
  }

  async sendFileMessage(conversationId: string, file: any) {
    const formData = new FormData();
    formData.append('conversation_id', conversationId);
    formData.append('file', file);
    
    return this.postMultipart<{ message: string; data: Message }>('/api/messagerie/messages', formData);
  }

  async getMessages(conversationId: string, limit: number = 50, offset: number = 0) {
    return this.request<{ message: string; data: Message[] }>(`/api/messagerie/conversations/${conversationId}/messages?limit=${limit}&offset=${offset}`);
  }

  async updateMessage(messageId: string, contenu: string) {
    return this.request(`/api/messagerie/messages/${messageId}`, {
      method: 'PUT',
      body: { contenu }
    });
  }

  async deleteMessage(messageId: string) {
    return this.request(`/api/messagerie/messages/${messageId}`, {
      method: 'DELETE'
    });
  }

  async markMessageAsRead(messageId: string) {
    return this.request(`/api/messagerie/messages/${messageId}/read`, {
      method: 'POST'
    });
  }
}

export const apiService = new ApiService();
