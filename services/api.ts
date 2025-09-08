const API_BASE_URL = 'http://localhost:3000/api';

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

  setToken(token: string) {
    this.token = token;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || `HTTP ${response.status}`);
    }

    return response.json();
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
    return this.request('/auth/register-patient', {
      method: 'POST',
      body: JSON.stringify(data),
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
    return this.request('/auth/register-doctor', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(email: string, motdepasse: string) {
    const response = await this.request<{
      message: string;
      data: { user: User; token: string };
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, motdepasse }),
    });

    if (response.data.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  async sendOtp(email: string) {
    return this.request('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async verifyOtp(email: string, otp: string) {
    return this.request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  }

  async getProfile() {
    return this.request<{ message: string; data: User }>('/auth/profile');
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
      `/auth/medecins?${query.toString()}`
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
      '/rendezvous',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  async getRendezVousPatient(patientId: string) {
    return this.request<{ message: string; data: RendezVous[] }>(
      `/rendezvous/patient/${patientId}`
    );
  }

  async getRendezVousMedecin(medecinId: string) {
    return this.request<{ message: string; data: RendezVous[] }>(
      `/rendezvous/medecin/${medecinId}`
    );
  }

  async confirmRendezVous(rendezVousId: string) {
    return this.request(`/rendezvous/${rendezVousId}/confirmer`, {
      method: 'PUT',
    });
  }

  async cancelRendezVous(rendezVousId: string) {
    return this.request(`/rendezvous/${rendezVousId}/annuler`, {
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
      `/rendezvous/medecin/${medecinId}/creneaux-disponibles?dateDebut=${dateDebut}&dateFin=${dateFin}`
    );
  }

  async createCreneau(data: {
    agenda_id: string;
    debut: string;
    fin: string;
    disponible: boolean;
  }) {
    return this.request('/rendezvous/creneaux', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Spécialités
  async getSpecialites() {
    return this.request<{ message: string; data: Specialite[] }>(
      '/specialites/specialites'
    );
  }

  // Cabinets
  async getCabinets() {
    return this.request<{ message: string; data: Cabinet[] }>('/cabinets');
  }
}

export const apiService = new ApiService();