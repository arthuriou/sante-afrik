# 🔔 Guide de configuration des notifications

## ⚠️ **PROBLÈMES IDENTIFIÉS ET SOLUTIONS**

### **1. Erreur projectId Expo**
```
ERROR: No "projectId" found. If "projectId" can't be inferred from the manifest...
```

**✅ SOLUTION APPLIQUÉE :**
- Ajout du `projectId` dans `app.json`
- Configuration dans `notificationService.ts`

**🔧 ACTION REQUISE :**
1. Remplacer `'your-expo-project-id'` dans `app.json` par votre vrai projectId Expo
2. Remplacer `'your-expo-project-id'` dans `services/notificationService.ts` par le même projectId

### **2. Erreur 404 - Endpoint notifications manquant**
```
ERROR: HTTP 404 - GET /api/notifications
```

**✅ SOLUTION APPLIQUÉE :**
- Système de fallback local avec `AsyncStorage`
- Gestion des erreurs API avec mode local uniquement
- Notifications sauvegardées localement si l'API échoue

### **3. Nom de l'expéditeur manquant**
```
"Nouveau message de Vous" au lieu du vrai nom
```

**✅ SOLUTION APPLIQUÉE :**
- Récupération du nom depuis `AsyncStorage` avec `userInfo`
- Format : "Prénom Nom" au lieu de "Vous"
- Logs de debug pour vérifier le nom récupéré

## 🚀 **CONFIGURATION REQUISE**

### **1. ProjectId Expo**
```json
// app.json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "votre-vrai-project-id-ici"
      }
    }
  }
}
```

```typescript
// services/notificationService.ts
const projectId = 'votre-vrai-project-id-ici';
```

### **2. Obtenir votre projectId Expo**
1. **Connectez-vous** à [expo.dev](https://expo.dev)
2. **Créez un projet** ou sélectionnez un existant
3. **Copiez le projectId** depuis l'URL ou les paramètres
4. **Remplacez** les placeholders dans les fichiers

### **3. Vérifier la configuration**
```bash
# Vérifier que le projectId est correct
npx expo config --type public
```

## 🧪 **TESTER LE SYSTÈME**

### **Test 1 : Vérifier les logs**
1. **Redémarrer l'app**
2. **Vérifier** qu'il n'y a plus l'erreur projectId
3. **Vérifier** que les notifications locales fonctionnent

### **Test 2 : Tester l'envoi de notifications**
1. **Envoyer un message** dans une conversation
2. **Vérifier** que le nom de l'expéditeur est correct dans les logs
3. **Aller dans l'écran Notifications**
4. **Vérifier** que la notification apparaît

### **Test 3 : Tester le marquage comme lu**
1. **Cliquer sur une notification** pour la marquer comme lue
2. **Vérifier** que le badge de notification se met à jour
3. **Tester** "Tout marquer comme lu"

## 📱 **FONCTIONNALITÉS DISPONIBLES**

### **✅ Notifications push**
- Notifications push avec son personnalisé
- Gestion des permissions
- Enregistrement du device

### **✅ Notifications locales**
- Sauvegarde dans `AsyncStorage`
- Affichage dans l'écran notifications
- Marquage comme lu/non lu

### **✅ Noms d'expéditeur**
- Récupération depuis `userInfo`
- Format "Prénom Nom"
- Fallback vers "Vous"

### **✅ Gestion d'erreurs**
- Fallback local si API indisponible
- Logs détaillés pour le debug
- Mode dégradé fonctionnel

## 🔧 **DÉPANNAGE**

### **Si les notifications ne s'affichent pas :**
1. Vérifier les logs pour les erreurs
2. Vérifier que `userInfo` est bien sauvegardé
3. Vérifier que les notifications locales sont créées

### **Si l'erreur projectId persiste :**
1. Vérifier que le projectId est correct
2. Redémarrer l'app complètement
3. Vérifier la configuration Expo

### **Si les noms ne s'affichent pas :**
1. Vérifier que `userInfo` contient `prenom` et `nom`
2. Vérifier les logs "Nom de l'expéditeur pour notification"
3. Vérifier le format des données utilisateur

## 🎯 **PROCHAINES ÉTAPES**

1. **Configurer le projectId** Expo
2. **Tester sur un appareil physique** (les notifications push ne fonctionnent pas sur simulateur)
3. **Implémenter l'endpoint API** `/api/notifications` sur le serveur (optionnel)
4. **Ajouter les fichiers son** dans `assets/sounds/`

Le système fonctionne maintenant **en mode local** et sera **amélioré** quand l'API sera disponible ! 🎉
