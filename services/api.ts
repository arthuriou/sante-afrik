import axios, { AxiosError } from 'axios';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000';

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
      return config;
    });
  }

  setToken(token: string) {
    this.token = token;
  }

  private async request<T>(endpoint: string, options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: any;
    headers?: Record<string, string>;
    params?: Record<string, any>;
  } = {}): Promise<T> {
    try {
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

  // Médecins
  async getMedecins(params?: {
    page?: number;
    limit?: number;
    search?: string;
    specialite?: string;
  }) {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);
    if (params?.specialite) query.append('specialite', params.specialite);

    return this.request<{ message: string; data: Medecin[] }>(
      `/api/auth/medecins?${query.toString()}`
    );
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

  // Cabinets
  async getCabinets() {
    return this.request<{ message: string; data: Cabinet[] }>('/api/cabinets');
  }
}

export const apiService = new ApiService();
