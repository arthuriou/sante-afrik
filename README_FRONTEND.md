# 🚀 SantéAfrik - Frontend React Native

## 📋 Vue d'ensemble

Ce projet est le frontend de l'application SantéAfrik, une plateforme de prise de rendez-vous médicaux développée avec React Native et Expo. L'application permet aux patients de rechercher des médecins, prendre des rendez-vous, et communiquer avec leurs médecins, tandis que les médecins peuvent gérer leur agenda et leurs consultations.

## 🛠️ Technologies utilisées

- **React Native** avec **Expo** pour le développement mobile
- **TypeScript** pour le typage statique
- **React Navigation v6** pour la navigation
- **Redux Toolkit** pour la gestion d'état
- **Axios** pour les appels API
- **Socket.IO Client** pour la messagerie en temps réel
- **Expo Notifications** pour les notifications push
- **Expo Document Picker** pour l'upload de documents

## 📁 Structure du projet

```
src/
├── components/          # Composants réutilisables
│   └── common/         # Composants communs (LoadingScreen, etc.)
├── navigation/         # Configuration de la navigation
│   └── AppNavigator.tsx
├── screens/           # Écrans de l'application
│   ├── auth/          # Authentification (Login, Register)
│   ├── patient/       # Écrans patients
│   ├── doctor/        # Écrans médecins
│   └── shared/        # Écrans partagés (Chat, Profile)
├── services/          # Services API et Socket.IO
│   ├── apiService.ts
│   └── socketService.ts
├── store/             # Store Redux
│   ├── index.ts
│   └── slices/        # Slices Redux (auth, messages, etc.)
├── types/             # Types TypeScript
│   └── index.ts
└── utils/             # Utilitaires
```

## 🚀 Installation et démarrage

### Prérequis

- Node.js (version 16 ou supérieure)
- npm ou yarn
- Expo CLI
- Un émulateur Android/iOS ou un appareil physique

### Installation

1. **Cloner le projet**
   ```bash
   git clone <repository-url>
   cd sante-afrik
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Démarrer le serveur de développement**
   ```bash
   npm start
   ```

4. **Lancer sur un appareil/émulateur**
   ```bash
   # Android
   npm run android
   
   # iOS
   npm run ios
   
   # Web
   npm run web
   ```

## 📱 Fonctionnalités

### Pour les Patients

- **Authentification** : Connexion et inscription avec OTP
- **Recherche de médecins** : Recherche par nom, spécialité, localisation
- **Prise de rendez-vous** : Réservation de créneaux disponibles
- **Messagerie** : Communication en temps réel avec les médecins
- **Dossier médical** : Consultation et upload de documents
- **Notifications** : Alertes pour les rendez-vous et messages

### Pour les Médecins

- **Dashboard** : Vue d'ensemble des rendez-vous du jour
- **Gestion des consultations** : Marquer l'arrivée, démarrer/terminer les consultations
- **Agenda** : Gestion des créneaux et planning
- **Messagerie** : Communication avec les patients
- **Gestion des patients** : Suivi des consultations

## 🔧 Configuration

### Variables d'environnement

Le projet utilise des URLs par défaut pour le développement local. Pour la production, modifiez les URLs dans `src/services/apiService.ts` :

```typescript
const API_BASE_URL = 'http://localhost:3000/api'; // Développement
// const API_BASE_URL = 'https://api.santeafrik.com/api'; // Production
```

### Configuration des notifications

Les notifications sont configurées dans `app.json`. Assurez-vous d'avoir les bonnes icônes dans le dossier `assets/`.

## 📦 Scripts disponibles

- `npm start` : Démarrer le serveur de développement
- `npm run android` : Lancer sur Android
- `npm run ios` : Lancer sur iOS
- `npm run web` : Lancer sur le web
- `npm run build:android` : Build pour Android (EAS)
- `npm run build:ios` : Build pour iOS (EAS)
- `npm run lint` : Vérifier le code avec ESLint

## 🏗️ Architecture

### Gestion d'état (Redux)

L'application utilise Redux Toolkit avec les slices suivants :

- **authSlice** : Authentification et gestion des utilisateurs
- **messageSlice** : Messagerie et conversations
- **appointmentSlice** : Rendez-vous et consultations
- **notificationSlice** : Notifications et préférences

### Navigation

La navigation est organisée en deux flux principaux :

1. **Flux d'authentification** : Login/Register
2. **Flux principal** : 
   - Tabs pour les patients (Dashboard, Recherche, Messages, Profil)
   - Tabs pour les médecins (Dashboard, Agenda, Rendez-vous, Messages, Profil)

### Services

- **apiService** : Gestion des appels API avec intercepteurs pour l'authentification
- **socketService** : Gestion des connexions WebSocket pour la messagerie temps réel

## 🔌 Intégration Backend

L'application est conçue pour fonctionner avec l'API backend SantéAfrik. Les endpoints principaux sont :

- **Authentification** : `/api/auth/*`
- **Médecins** : `/api/specialites/medecins/*`
- **Rendez-vous** : `/api/rendezvous/*`
- **Messagerie** : `/api/messagerie/*`
- **Dossier médical** : `/api/dossier-medical/*`

## 🧪 Tests

Pour lancer les tests (à implémenter) :

```bash
npm test
```

## 📱 Déploiement

### EAS Build

1. **Installer EAS CLI**
   ```bash
   npm install -g @expo/eas-cli
   ```

2. **Configurer le projet**
   ```bash
   eas init
   eas build:configure
   ```

3. **Build pour production**
   ```bash
   eas build --platform android --profile production
   eas build --platform ios --profile production
   ```

### Configuration des stores

- **Google Play Store** : Suivre la documentation Expo pour la soumission
- **Apple App Store** : Suivre la documentation Expo pour la soumission

## 🐛 Dépannage

### Problèmes courants

1. **Erreur de connexion API** : Vérifiez que le backend est démarré et accessible
2. **Problèmes de navigation** : Vérifiez les types TypeScript dans les paramètres de navigation
3. **Erreurs de build** : Vérifiez la configuration EAS et les certificats

### Logs

Pour voir les logs détaillés :

```bash
npx expo start --clear
```

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit les changements (`git commit -m 'Ajouter nouvelle fonctionnalité'`)
4. Push vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 📞 Support

Pour toute question ou problème, contactez l'équipe de développement ou ouvrez une issue sur GitHub.

---

**SantéAfrik** - Votre santé, notre priorité 🏥
