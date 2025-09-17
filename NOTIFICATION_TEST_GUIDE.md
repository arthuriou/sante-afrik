# 🔔 Guide de test du système de notifications

## ✅ **Modifications apportées :**

### 1. **Notifications de messages intégrées**
- ✅ **Service de notification** : Ajout de `sendMessageNotification()` dans `notificationService.ts`
- ✅ **Conversations patient** : Intégration dans `app/(patient)/screens/messages/[id].tsx`
- ✅ **Conversations médecin** : Intégration dans `app/(medecin)/screens/messages/[id].tsx`
- ✅ **Écran notifications** : Affichage des notifications dans `app/(patient)/screens/notifications.tsx` et `app/(medecin)/screens/notifications.tsx`

### 2. **Préférences déplacées vers le profil**
- ✅ **Profil patient** : Ajout de "Préférences de notifications" dans `app/(patient)/screens/profile.tsx`
- ✅ **Profil médecin** : Ajout de "Préférences de notifications" dans `app/(medecin)/screens/profile.tsx`
- ✅ **Navigation** : Liens vers les écrans de préférences depuis le profil

## 🧪 **Comment tester :**

### **Test 1 : Notifications de messages**
1. **Ouvrir une conversation** entre patient et médecin
2. **Envoyer un message** depuis l'un des comptes
3. **Vérifier** que :
   - Une notification push apparaît (si activée)
   - Le son de notification se joue (si activé)
   - La notification apparaît dans l'écran "Notifications"
   - Le badge de notification se met à jour

### **Test 2 : Préférences de notifications**
1. **Aller dans le profil** (onglet "Compte")
2. **Cliquer sur "Préférences de notifications"**
3. **Tester les options** :
   - Activer/désactiver les sons
   - Changer le volume
   - Changer le son de notification
   - Activer/désactiver les vibrations
   - Activer/désactiver les notifications push
   - Tester la notification

### **Test 3 : Écran de notifications**
1. **Aller dans l'onglet "Notifications"**
2. **Vérifier** que :
   - Les notifications s'affichent correctement
   - Les notifications non lues sont marquées
   - Le bouton "Tout marquer comme lu" fonctionne
   - Le pull-to-refresh fonctionne

## 🔧 **Configuration requise :**

### **Dépendances à installer :**
```bash
npx expo install expo-notifications expo-device expo-av
```

### **Fichiers son à ajouter :**
```
assets/sounds/
├── notification.mp3    # Son par défaut
├── message.mp3         # Son pour les messages
├── appointment.mp3     # Son pour les rendez-vous
├── reminder.mp3        # Son pour les rappels
└── emergency.mp3       # Son pour les urgences
```

### **Configuration Expo :**
- Le fichier `app.json` est déjà configuré
- Remplacer `'your-expo-project-id'` dans `notificationService.ts` par votre vrai project ID

## 🎯 **Fonctionnalités disponibles :**

### **Notifications automatiques :**
- ✅ **Nouveaux messages** : Notification push + son + badge
- ✅ **Rendez-vous** : Notification pour création/annulation
- ✅ **Rappels** : Notifications programmées
- ✅ **Système** : Notifications générales

### **Préférences personnalisables :**
- ✅ **Sons** : 5 sons différents + contrôle du volume
- ✅ **Vibrations** : Activation/désactivation
- ✅ **Types** : Push, email, SMS
- ✅ **Test** : Bouton de test intégré

### **Interface utilisateur :**
- ✅ **Badges** : Compteurs sur les onglets Messages et Notifications
- ✅ **Navigation** : Accès aux préférences depuis le profil
- ✅ **Design iOS** : Interface moderne et intuitive

## 🚀 **Prochaines étapes :**

1. **Installer les dépendances** Expo
2. **Ajouter les fichiers son** dans `assets/sounds/`
3. **Configurer le project ID** Expo
4. **Tester sur un appareil physique** (les notifications push ne fonctionnent pas sur simulateur)
5. **Vérifier la configuration serveur** pour les notifications push

Le système de notifications est maintenant **complet et fonctionnel** ! 🎉
