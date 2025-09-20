// Configuration de l'API
const API_CONFIG = {
  // Pour le développement local, utilisez l'adresse IP de votre machine
  BASE_URL: __DEV__ 
    ? 'http://192.168.1.79:3000/api'  // Votre IP locale
    : 'https://your-production-api.com/api', // URL de production
  
  TIMEOUT: 10000,
};

export default API_CONFIG;
