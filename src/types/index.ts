// Types d'authentification
export interface User {
  id: string;
  email: string;
  role: 'PATIENT' | 'MEDECIN';
  nom?: string;
  prenom?: string;
  telephone?: string;
  avatar?: string;
}

export interface Patient extends User {
  idPatient: string;
  dateNaissance?: string;
  adresse?: string;
  ville?: string;
  codePostal?: string;
  pays?: string;
  sexe?: 'M' | 'F';
  groupeSanguin?: string;
  allergies?: string[];
  antecedents?: string[];
}

export interface Medecin extends User {
  idMedecin: string;
  specialite?: Specialite;
  cabinet?: Cabinet;
  numeroOrdre?: string;
  experience?: number;
  tarifConsultation?: number;
  description?: string;
  horaires?: Horaires[];
}

// Types de spécialités
export interface Specialite {
  id: string;
  nom: string;
  description?: string;
  icone?: string;
}

// Types de cabinet
export interface Cabinet {
  id: string;
  nom: string;
  adresse: string;
  ville: string;
  codePostal: string;
  telephone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
}

// Types d'horaires
export interface Horaires {
  jour: string;
  heureDebut: string;
  heureFin: string;
  pauseDebut?: string;
  pauseFin?: string;
}

// Types de rendez-vous
export interface RendezVous {
  idRendezVous: string;
  patient: Patient;
  medecin: Medecin;
  dateHeure: string;
  duree: number;
  motif: string;
  typeRdv: 'PRESENTIEL' | 'TELECONSULTATION';
  statut: 'EN_ATTENTE' | 'CONFIRME' | 'EN_ATTENTE_CONSULTATION' | 'EN_COURS' | 'TERMINE' | 'ANNULE';
  adresseCabinet?: string;
  notesConsultation?: string;
  ordonnance?: Ordonnance;
  documents?: DocumentMedical[];
}

// Types de créneaux
export interface Creneau {
  idCreneau: string;
  medecin: Medecin;
  debut: string;
  fin: string;
  duree: number;
  disponible: boolean;
  typeCreneau: 'CONSULTATION' | 'URGENCE' | 'CONTROLE';
}

// Types de messagerie
export interface Conversation {
  idConversation: string;
  type: 'PRIVEE' | 'GROUPE';
  participants: User[];
  dernierMessage?: Message;
  dateCreation: string;
  dateModification: string;
}

export interface Message {
  idMessage: string;
  conversation: Conversation;
  expediteur: User;
  contenu: string;
  type: 'TEXTE' | 'IMAGE' | 'AUDIO' | 'DOCUMENT';
  dateEnvoi: string;
  lu: boolean;
  urlFichier?: string;
  nomFichier?: string;
  tailleFichier?: number;
}

// Types de dossier médical
export interface DossierMedical {
  idDossier: string;
  patient: Patient;
  medecin: Medecin;
  dateCreation: string;
  dateModification: string;
  rendezVous: RendezVous[];
  documents: DocumentMedical[];
  ordonnances: Ordonnance[];
}

export interface DocumentMedical {
  idDocument: string;
  dossier: DossierMedical;
  nom: string;
  type: 'RADIOGRAPHIE' | 'ANALYSE' | 'ORDONNANCE' | 'CERTIFICAT' | 'AUTRE';
  url: string;
  taille: number;
  dateUpload: string;
  description?: string;
}

// Types d'ordonnances
export interface Ordonnance {
  idOrdonnance: string;
  medecin: Medecin;
  patient: Patient;
  rendezVous: RendezVous;
  dateCreation: string;
  medicaments: Medicament[];
  instructions: string;
  dureeValidite: number;
  statut: 'ACTIVE' | 'EXPIREE' | 'ANNULEE';
}

export interface Medicament {
  id: string;
  nom: string;
  dosage: string;
  frequence: string;
  duree: string;
  instructions?: string;
}

// Types de notifications
export interface Notification {
  idNotification: string;
  utilisateur: User;
  titre: string;
  contenu: string;
  type: 'RENDEZ_VOUS' | 'MESSAGE' | 'ORDONNANCE' | 'DOCUMENT' | 'URGENCE';
  lu: boolean;
  dateCreation: string;
  data?: any;
}

export interface PreferencesNotification {
  id: string;
  utilisateur: User;
  notificationsRdv: boolean;
  notificationsMessage: boolean;
  notificationsOrdonnance: boolean;
  notificationsDocument: boolean;
  notificationsUrgence: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
}

// Types de recherche
export interface SearchParams {
  q?: string;
  specialiteId?: string;
  ville?: string;
  typeRdv?: 'PRESENTIEL' | 'TELECONSULTATION';
  dateDebut?: string;
  dateFin?: string;
  limit?: number;
  offset?: number;
}

// Types de formulaires
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  telephone: string;
  otp: string;
  email: string;
  password: string;
  nom: string;
  prenom: string;
  dateNaissance?: string;
  sexe?: 'M' | 'F';
}

export interface AppointmentForm {
  medecinId: string;
  creneauId: string;
  motif: string;
  typeRdv: 'PRESENTIEL' | 'TELECONSULTATION';
  documents?: File[];
}

// Types d'état de l'application
export interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

export interface MessageState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  error: string | null;
}

export interface AppointmentState {
  appointments: RendezVous[];
  upcomingAppointments: RendezVous[];
  todayAppointments: RendezVous[];
  loading: boolean;
  error: string | null;
}

// Types de navigation
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  PatientApp: undefined;
  DoctorApp: undefined;
  Chat: { conversationId: string };
  DoctorDetail: { doctor: Medecin };
  BookAppointment: { doctor: Medecin; selectedSlot: Creneau };
  MedicalRecord: undefined;
  Profile: undefined;
  Settings: undefined;
};

export type PatientTabParamList = {
  Dashboard: undefined;
  Search: undefined;
  Messages: undefined;
  Profile: undefined;
};

export type DoctorTabParamList = {
  Dashboard: undefined;
  Agenda: undefined;
  Messages: undefined;
  Profile: undefined;
};
