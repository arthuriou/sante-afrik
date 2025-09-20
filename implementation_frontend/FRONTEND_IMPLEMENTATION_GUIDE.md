# 🚀 GUIDE D'IMPLÉMENTATION FRONTEND - SANTÉAFRIK

## 📋 Vue d'ensemble

Ce guide détaille l'implémentation complète du frontend pour la plateforme SantéAfrik, incluant tous les écrans, flux et intégrations nécessaires.

## 🎯 Architecture Frontend Recommandée

### Stack Technologique
- **Framework** : React Native (Expo) pour mobile
- **Navigation** : React Navigation v6
- **État** : Redux Toolkit ou Zustand
- **HTTP Client** : Axios
- **Socket** : Socket.IO Client
- **Notifications** : Expo Notifications
- **Upload** : Expo Document Picker + Image Picker

---

## 👤 ÉCRANS PATIENT

### 1. 🔐 Authentification & Inscription

#### Écran de Connexion
```typescript
// LoginScreen.tsx
const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const response = await apiService.login({ email, password });
      // Sauvegarder le token
      await AsyncStorage.setItem('token', response.token);
      // Naviguer vers le dashboard
      navigation.navigate('PatientDashboard');
    } catch (error) {
      Alert.alert('Erreur', 'Identifiants incorrects');
    }
  };
};
```

**Endpoints utilisés :**
- `POST /api/auth/login`

#### Écran d'Inscription (OTP)
```typescript
// RegisterScreen.tsx
const RegisterScreen = () => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');

  const sendOTP = async () => {
    await apiService.sendOTP({ telephone: phone });
  };

  const verifyOTP = async () => {
    const response = await apiService.verifyOTP({ telephone: phone, code: otp });
    // Créer le compte patient
    await apiService.createPatient(response.token, patientData);
  };
};
```

**Endpoints utilisés :**
- `POST /api/auth/send-otp`
- `POST /api/auth/verify-otp`
- `POST /api/patients`

### 2. 🏥 Recherche de Médecins

#### Écran de Recherche Principale
```typescript
// SearchDoctorsScreen.tsx
const SearchDoctorsScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState(null);
  const [doctors, setDoctors] = useState([]);

  const searchDoctors = async () => {
    try {
      const response = await apiService.searchDoctors({
        q: searchQuery,
        specialite_id: selectedSpecialty?.id,
        limit: 20
      });
      setDoctors(response.data);
    } catch (error) {
      console.error('Erreur recherche:', error);
    }
  };

  return (
    <View>
      <SearchBar 
        value={searchQuery}
        onChangeText={setSearchQuery}
        onSearch={searchDoctors}
      />
      <SpecialtyFilter 
        selected={selectedSpecialty}
        onSelect={setSelectedSpecialty}
      />
      <DoctorList doctors={doctors} onSelect={selectDoctor} />
    </View>
  );
};
```

**Endpoints utilisés :**
- `GET /api/specialites/medecins/search` (recommandé)
- `GET /api/specialites/specialites` (pour les filtres)

#### Écran de Détails Médecin
```typescript
// DoctorDetailsScreen.tsx
const DoctorDetailsScreen = ({ doctor }) => {
  const [availableSlots, setAvailableSlots] = useState([]);

  const loadAvailableSlots = async () => {
    const slots = await apiService.getAvailableSlots(doctor.idmedecin);
    setAvailableSlots(slots);
  };

  return (
    <View>
      <DoctorProfile doctor={doctor} />
      <AvailableSlots 
        slots={availableSlots}
        onSelectSlot={bookAppointment}
      />
    </View>
  );
};
```

**Endpoints utilisés :**
- `GET /api/rendezvous/medecin/:medecinId/creneaux-disponibles`

### 3. 📅 Prise de Rendez-vous

#### Écran de Réservation
```typescript
// BookAppointmentScreen.tsx
const BookAppointmentScreen = ({ doctor, selectedSlot }) => {
  const [appointmentType, setAppointmentType] = useState('PRESENTIEL');
  const [motif, setMotif] = useState('');
  const [documents, setDocuments] = useState([]);

  const bookAppointment = async () => {
    try {
      const appointmentData = {
        patient_id: user.idPatient,
        medecin_id: doctor.idmedecin,
        creneau_id: selectedSlot.idcreneau,
        dateheure: selectedSlot.debut,
        duree: selectedSlot.duree,
        motif: motif,
        type_rdv: appointmentType,
        adresse_cabinet: appointmentType === 'PRESENTIEL' ? doctor.cabinet?.adresse : null
      };

      const response = await apiService.createAppointment(appointmentData);
      
      // Upload documents si nécessaire
      if (documents.length > 0) {
        await uploadDocuments(response.idrendezvous, documents);
      }

      navigation.navigate('AppointmentConfirmation', { appointment: response });
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de réserver le rendez-vous');
    }
  };
};
```

**Endpoints utilisés :**
- `POST /api/rendezvous`
- `POST /api/dossier-medical/documents` (pour les documents)

### 4. 📱 Dashboard Patient

#### Écran Principal
```typescript
// PatientDashboardScreen.tsx
const PatientDashboardScreen = () => {
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);

  useEffect(() => {
    loadUpcomingAppointments();
    loadRecentMessages();
  }, []);

  const loadUpcomingAppointments = async () => {
    const appointments = await apiService.getPatientAppointments(user.idPatient);
    setUpcomingAppointments(appointments.filter(apt => 
      new Date(apt.dateheure) > new Date() && 
      ['CONFIRME', 'EN_ATTENTE_CONSULTATION', 'EN_COURS'].includes(apt.statut)
    ));
  };

  return (
    <ScrollView>
      <WelcomeSection user={user} />
      <UpcomingAppointments appointments={upcomingAppointments} />
      <QuickActions />
      <RecentMessages messages={recentMessages} />
    </ScrollView>
  );
};
```

**Endpoints utilisés :**
- `GET /api/rendezvous/patient/:patientId`

### 5. 💬 Messagerie Patient

#### Écran de Conversations
```typescript
// ConversationsScreen.tsx
const ConversationsScreen = () => {
  const [conversations, setConversations] = useState([]);

  const loadConversations = async () => {
    const convs = await apiService.getConversations();
    setConversations(convs);
  };

  const startConversation = async (doctorId) => {
    try {
      const conversation = await apiService.createPrivateConversation(doctorId);
      navigation.navigate('Chat', { conversationId: conversation.idconversation });
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de démarrer la conversation');
    }
  };

  return (
    <View>
      <ConversationList 
        conversations={conversations}
        onSelect={navigateToChat}
      />
      <FloatingActionButton onPress={showDoctorList} />
    </View>
  );
};
```

**Endpoints utilisés :**
- `GET /api/messagerie/conversations`
- `POST /api/messagerie/conversations/private`

#### Écran de Chat
```typescript
// ChatScreen.tsx
const ChatScreen = ({ conversationId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    // Écouter les nouveaux messages via Socket.IO
    socket.on('new_message', (message) => {
      if (message.conversation_id === conversationId) {
        setMessages(prev => [...prev, message]);
      }
    });

    loadMessages();
  }, [conversationId]);

  const sendMessage = async () => {
    try {
      await apiService.sendMessage({
        conversationId,
        contenu: newMessage,
        type: 'TEXTE'
      });
      setNewMessage('');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'envoyer le message');
    }
  };

  return (
    <View style={styles.container}>
      <MessageList messages={messages} />
      <MessageInput 
        value={newMessage}
        onChangeText={setNewMessage}
        onSend={sendMessage}
      />
    </View>
  );
};
```

**Endpoints utilisés :**
- `GET /api/messagerie/conversations/:id/messages`
- `POST /api/messagerie/messages`

### 6. 📁 Dossier Médical

#### Écran du Dossier
```typescript
// MedicalRecordScreen.tsx
const MedicalRecordScreen = () => {
  const [medicalRecord, setMedicalRecord] = useState(null);
  const [documents, setDocuments] = useState([]);

  const loadMedicalRecord = async () => {
    const record = await apiService.getMedicalRecord();
    setMedicalRecord(record);
  };

  const loadDocuments = async () => {
    const docs = await apiService.getMedicalDocuments(medicalRecord.iddossier);
    setDocuments(docs);
  };

  const uploadDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync();
    if (!result.canceled) {
      await apiService.uploadDocument({
        dossier_id: medicalRecord.iddossier,
        file: result.assets[0]
      });
      loadDocuments(); // Recharger la liste
    }
  };

  return (
    <ScrollView>
      <PersonalInfo user={user} />
      <AppointmentHistory appointments={medicalRecord?.appointments} />
      <DocumentsList 
        documents={documents}
        onUpload={uploadDocument}
      />
    </ScrollView>
  );
};
```

**Endpoints utilisés :**
- `GET /api/dossier-medical/dossier/me`
- `GET /api/dossier-medical/:dossierId/documents`
- `POST /api/dossier-medical/documents`

---

## 👨‍⚕️ ÉCRANS MÉDECIN

### 1. 📊 Dashboard Médecin

#### Écran Principal
```typescript
// DoctorDashboardScreen.tsx
const DoctorDashboardScreen = () => {
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [waitingPatients, setWaitingPatients] = useState([]);
  const [currentConsultation, setCurrentConsultation] = useState(null);

  useEffect(() => {
    loadTodayAppointments();
    loadWaitingPatients();
  }, []);

  const loadTodayAppointments = async () => {
    const appointments = await apiService.getTodayAppointments();
    setTodayAppointments(appointments);
  };

  const loadWaitingPatients = async () => {
    const waiting = await apiService.getWaitingPatients();
    setWaitingPatients(waiting);
  };

  return (
    <ScrollView>
      <StatsCards />
      <WaitingPatients 
        patients={waitingPatients}
        onMarkArrived={markPatientArrived}
        onStartConsultation={startConsultation}
      />
      <TodaySchedule appointments={todayAppointments} />
    </ScrollView>
  );
};
```

**Endpoints utilisés :**
- `GET /api/rendezvous/aujourd-hui`
- `GET /api/rendezvous/en-attente-consultation`

### 2. 🏥 Gestion des Consultations

#### Écran de Consultation en Cours
```typescript
// ConsultationScreen.tsx
const ConsultationScreen = ({ appointment }) => {
  const [consultationNotes, setConsultationNotes] = useState('');
  const [prescription, setPrescription] = useState([]);

  const startConsultation = async () => {
    try {
      await apiService.startConsultation(appointment.idrendezvous);
      // Mettre à jour l'état local
      setConsultationStatus('EN_COURS');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de démarrer la consultation');
    }
  };

  const endConsultation = async () => {
    try {
      await apiService.endConsultation(appointment.idrendezvous);
      // Sauvegarder les notes et ordonnance
      await saveConsultationData();
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de clôturer la consultation');
    }
  };

  return (
    <View>
      <PatientInfo patient={appointment.patient} />
      <ConsultationNotes 
        value={consultationNotes}
        onChangeText={setConsultationNotes}
      />
      <PrescriptionForm 
        prescription={prescription}
        onChange={setPrescription}
      />
      <ActionButtons 
        onStart={startConsultation}
        onEnd={endConsultation}
      />
    </View>
  );
};
```

**Endpoints utilisés :**
- `PUT /api/rendezvous/:id/commencer-consultation`
- `PUT /api/rendezvous/:id/cloturer-consultation`

### 3. 📅 Gestion de l'Agenda

#### Écran de l'Agenda
```typescript
// AgendaScreen.tsx
const AgendaScreen = () => {
  const [agendas, setAgendas] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);

  const loadAgendas = async () => {
    const ags = await apiService.getDoctorAgendas();
    setAgendas(ags);
  };

  const createTimeSlot = async (slotData) => {
    await apiService.createTimeSlot(slotData);
    loadTimeSlots(); // Recharger
  };

  return (
    <View>
      <AgendaList 
        agendas={agendas}
        onCreateAgenda={createAgenda}
      />
      <TimeSlotsList 
        slots={timeSlots}
        onCreateSlot={createTimeSlot}
      />
    </View>
  );
};
```

**Endpoints utilisés :**
- `GET /api/rendezvous/medecin/:medecinId/agendas`
- `POST /api/rendezvous/agendas`
- `POST /api/rendezvous/creneaux`

---

## 🔧 SERVICES & UTILITAIRES

### Service API Principal
```typescript
// services/apiService.ts
class ApiService {
  private baseURL = 'http://localhost:3000/api';
  private token: string | null = null;

  async setToken(token: string) {
    this.token = token;
    await AsyncStorage.setItem('token', token);
  }

  private async getHeaders() {
    const token = await AsyncStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  // Authentification
  async login(credentials: LoginRequest) {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    return response.json();
  }

  // Recherche de médecins
  async searchDoctors(params: SearchDoctorsParams) {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${this.baseURL}/specialites/medecins/search?${queryString}`, {
      headers: await this.getHeaders()
    });
    return response.json();
  }

  // Rendez-vous
  async createAppointment(data: CreateAppointmentRequest) {
    const response = await fetch(`${this.baseURL}/rendezvous`, {
      method: 'POST',
      headers: await this.getHeaders(),
      body: JSON.stringify(data)
    });
    return response.json();
  }

  async getTodayAppointments() {
    const response = await fetch(`${this.baseURL}/rendezvous/aujourd-hui`, {
      headers: await this.getHeaders()
    });
    return response.json();
  }

  // Messagerie
  async createPrivateConversation(participantId: string) {
    const response = await fetch(`${this.baseURL}/messagerie/conversations/private`, {
      method: 'POST',
      headers: await this.getHeaders(),
      body: JSON.stringify({ participantId })
    });
    return response.json();
  }

  async sendMessage(data: SendMessageRequest) {
    const response = await fetch(`${this.baseURL}/messagerie/messages`, {
      method: 'POST',
      headers: await this.getHeaders(),
      body: JSON.stringify(data)
    });
    return response.json();
  }

  // Dossier médical
  async getMedicalRecord() {
    const response = await fetch(`${this.baseURL}/dossier-medical/dossier/me`, {
      headers: await this.getHeaders()
    });
    return response.json();
  }

  async uploadDocument(data: UploadDocumentRequest) {
    const formData = new FormData();
    formData.append('dossier_id', data.dossier_id);
    formData.append('nom', data.nom);
    formData.append('type', data.type);
    formData.append('file', data.file);

    const response = await fetch(`${this.baseURL}/dossier-medical/documents`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${await AsyncStorage.getItem('token')}`,
        'Content-Type': 'multipart/form-data'
      },
      body: formData
    });
    return response.json();
  }
}

export const apiService = new ApiService();
```

### Service Socket.IO
```typescript
// services/socketService.ts
import { io } from 'socket.io-client';

class SocketService {
  private socket: any = null;

  connect(token: string) {
    this.socket = io('http://localhost:3000', {
      auth: { token }
    });

    this.socket.on('connect', () => {
      console.log('Connecté au serveur');
    });
  }

  onNewMessage(callback: (message: any) => void) {
    this.socket?.on('new_message', callback);
  }

  onConsultationUpdate(callback: (data: any) => void) {
    this.socket?.on('consultation:started', callback);
    this.socket?.on('consultation:ended', callback);
  }

  disconnect() {
    this.socket?.disconnect();
  }
}

export const socketService = new SocketService();
```

---

## 📱 CONFIGURATION EXPO

### app.json
```json
{
  "expo": {
    "name": "SantéAfrik",
    "slug": "santeafrik",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.santeafrik.app"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      },
      "package": "com.santeafrik.app",
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#ffffff"
        }
      ]
    ],
    "extra": {
      "eas": {
        "projectId": "your-project-id-here"
      }
    }
  }
}
```

---

## 🚀 DÉPLOIEMENT

### 1. Configuration EAS
```bash
# Installer EAS CLI
npm install -g @expo/eas-cli

# Initialiser le projet
eas init

# Configurer le build
eas build:configure

# Build pour Android
eas build --platform android

# Build pour iOS
eas build --platform ios
```

### 2. Variables d'environnement
```typescript
// config/environment.ts
export const config = {
  API_BASE_URL: __DEV__ 
    ? 'http://localhost:3000/api' 
    : 'https://api.santeafrik.com/api',
  SOCKET_URL: __DEV__ 
    ? 'http://localhost:3000' 
    : 'https://api.santeafrik.com'
};
```

---

## 📋 CHECKLIST D'IMPLÉMENTATION

### Phase 1: Authentification ✅
- [ ] Écran de connexion
- [ ] Écran d'inscription avec OTP
- [ ] Gestion des tokens
- [ ] Navigation conditionnelle

### Phase 2: Recherche & Réservation ✅
- [ ] Écran de recherche de médecins
- [ ] Filtres par spécialité
- [ ] Détails médecin
- [ ] Réservation de RDV
- [ ] Upload de documents

### Phase 3: Dashboard & Messagerie ✅
- [ ] Dashboard patient
- [ ] Dashboard médecin
- [ ] Système de messagerie
- [ ] Notifications push

### Phase 4: Gestion des Consultations ✅
- [ ] Workflow présentiel complet
- [ ] Gestion de l'agenda
- [ ] Dossier médical
- [ ] Ordonnances

### Phase 5: Tests & Déploiement ✅
- [ ] Tests unitaires
- [ ] Tests d'intégration
- [ ] Build de production
- [ ] Déploiement

---

## 🎯 PROCHAINES ÉTAPES

1. **Créer la structure du projet** avec les dossiers recommandés
2. **Implémenter l'authentification** en premier
3. **Développer les écrans de recherche** et réservation
4. **Intégrer la messagerie** avec Socket.IO
5. **Finaliser le workflow** de consultation
6. **Tester et déployer**

Ce guide couvre tous les aspects nécessaires pour implémenter un frontend complet et fonctionnel ! 🚀
