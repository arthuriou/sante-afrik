# Guide de Dépannage - SantéAfrik

## Problèmes de Connexion API

### 1. Vérifier que le serveur backend est en cours d'exécution

Le serveur backend doit être démarré sur le port 3000. Vérifiez que :
- Le serveur backend est démarré
- Il écoute sur le port 3000
- Il accepte les connexions depuis d'autres machines (pas seulement localhost)

### 2. Vérifier l'adresse IP

L'adresse IP configurée est : `192.168.1.79:3000`

Si votre IP a changé, modifiez le fichier `src/config/api.ts` :
```typescript
BASE_URL: __DEV__ 
  ? 'http://VOTRE_NOUVELLE_IP:3000/api'
  : 'https://your-production-api.com/api',
```

### 3. Tester la connexion API

Vous pouvez tester si l'API est accessible en ouvrant dans votre navigateur :
`http://192.168.1.79:3000/api/health` (ou un endpoint de test)

### 4. Problèmes courants

#### Erreur "Network Error"
- Vérifiez que le serveur backend est démarré
- Vérifiez que l'adresse IP est correcte
- Vérifiez que le port 3000 n'est pas bloqué par un firewall

#### Erreur "Connection refused"
- Le serveur backend n'est pas démarré
- L'adresse IP ou le port sont incorrects

#### Erreur "Timeout"
- Le serveur backend met trop de temps à répondre
- Problème de réseau

### 5. Configuration du serveur backend

Assurez-vous que votre serveur backend :
- Écoute sur `0.0.0.0:3000` (pas seulement `localhost:3000`)
- Accepte les requêtes CORS depuis l'application mobile
- A les endpoints d'authentification configurés

### 6. Logs de débogage

Les erreurs API sont maintenant loggées dans la console. Ouvrez les outils de développement pour voir les détails des erreurs.

## Test de l'application

1. Démarrez le serveur backend
2. Vérifiez l'adresse IP dans `src/config/api.ts`
3. Démarrez l'application Expo
4. Testez la connexion avec des identifiants valides
