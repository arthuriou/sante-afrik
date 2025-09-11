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
  datenaissance: string;
  genre: 'M' | 'F';
  adresse: string;
  groupesanguin: string;
  poids: number;
  taille: number;
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

// Service API générique
class ApiService {
  private token: string | null = null;
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
  }

  setToken(token: string) {
    this.token = token;
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
  }) {
    return this.request('/api/auth/register-doctor', {
      method: 'POST',
      body: data,
    });
  }

  async login(email: string, motdepasse: string) {
    const response = await this.request<{
      message: string;
      data: { user: User; token: string };
    }>('/api/auth/login', {
      method: 'POST',
      body: { email, motdepasse },
    });

    if (response.data.token) {
      this.setToken(response.data.token);
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
      const response = await this.client.post('/api/auth/profile/photo', photoData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        transformRequest: (data) => data, // Ne pas sérialiser le FormData
      });

      console.log('🚀 API Upload - Status:', response.status);
      console.log('🚀 API Upload - Succès:', response.data);
      return response.data as { message: string; data: { url: string; user: User; storage: string } };
    } catch (error: any) {
      console.log('🚀 API Upload - Erreur:', error.response?.data || error.message);
      if (error.response) {
        const data = error.response.data as any;
        const message = (data && (data.error || data.message)) || `HTTP ${error.response.status}`;
        throw new Error(message);
      }
      throw new Error(error.message || 'Erreur upload');
    }
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

    return this.request<{ message: string; data: Medecin[] }>(
      `/api/auth/medecins?${query.toString()}`
    );
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

  // Rendez-vous
  async createRendezVous(data: {
    patient_id: string;
    medecin_id: string;
    dateheure: string;
    duree: number;
    motif: string;
    creneau_id?: string;
  }) {
    return this.request<{ message: string; data: RendezVous }>(
      '/api/rendezvous',
      {
        method: 'POST',
        body: data,
      }
    );
  }

  async getRendezVousPatient(patientId: string) {
    return this.request<{ message: string; data: RendezVous[] }>(
      `/api/rendezvous/patient/${patientId}`
    );
  }

  async getRendezVousMedecin(medecinId: string) {
    return this.request<{ message: string; data: RendezVous[] }>(
      `/api/rendezvous/medecin/${medecinId}`
    );
  }

  async confirmRendezVous(rendezVousId: string) {
    return this.request(`/api/rendezvous/${rendezVousId}/confirmer`, {
      method: 'PUT',
    });
  }

  async cancelRendezVous(rendezVousId: string) {
    return this.request(`/api/rendezvous/${rendezVousId}/annuler`, {
      method: 'PUT',
    });
  }

  // Créneaux
  async getCreneauxDisponibles(
    medecinId: string,
    dateDebut: string,
    dateFin: string
  ) {
    return this.request<{ message: string; data: Creneau[] }>(
      `/api/rendezvous/medecin/${medecinId}/creneaux-disponibles?dateDebut=${dateDebut}&dateFin=${dateFin}`
    );
  }

  async createCreneau(data: {
    agenda_id: string;
    debut: string;
    fin: string;
    disponible: boolean;
  }) {
    return this.request('/api/rendezvous/creneaux', {
      method: 'POST',
      body: data,
    });
  }

  // Spécialités
  async getSpecialites() {
    return this.request<{ message: string; data: Specialite[] }>(
      '/api/specialites/specialites'
    );
  }

  async getMaux() {
    return this.request<{ message: string; data: any[] }>(
      '/api/specialites/maux'
    );
  }

  async getMedecinsBySpecialiteId(
    specialiteId: string,
    params?: { q?: string; page?: number; limit?: number; cabinet_id?: string }
  ) {
    const query = new URLSearchParams();
    if (params?.q) query.append('q', params.q);
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.cabinet_id) query.append('cabinet_id', params.cabinet_id);
    const qs = query.toString();
    const url = qs
      ? `/api/specialites/specialites/${specialiteId}/medecins?${qs}`
      : `/api/specialites/specialites/${specialiteId}/medecins`;
    return this.request<{ message: string; data: Medecin[] }>(url);
  }

  // Cabinets
  async getCabinets() {
    return this.request<{ message: string; data: Cabinet[] }>('/api/cabinets');
  }
}

export const apiService = new ApiService();
