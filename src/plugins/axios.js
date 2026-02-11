import axios from 'axios';

/**
 * Client Axios configuré pour l'API Timely
 * 
 * Configuration:
 * - Base URL: API de production sur netlor.fr
 * - Headers par défaut: Content-Type JSON
 * - Intercepteur: Injection automatique de la clé API
 * 
 * Ce client est injecté dans tous les stores Pinia via le plugin
 * et est accessible via this.$api dans les stores
 */
const apiClient = axios.create({
  // URL de base de l'API Timely
  baseURL: 'https://timely.edu.netlor.fr/api',
  
  // Headers par défaut pour toutes les requêtes
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Intercepteur de requêtes
 * 
 * Ajoute automatiquement la clé API dans le header Authorization
 * de chaque requête sortante si l'utilisateur est connecté
 * 
 * Format attendu par l'API: Authorization: key=<API_KEY>
 * 
 * La clé est récupérée depuis le localStorage où elle est
 * sauvegardée par le store auth lors de la connexion/inscription
 */
apiClient.interceptors.request.use((config) => {
  // Récupérer la clé API depuis le localStorage
  const apiKey = localStorage.getItem('timely_api_key');
  
  // Si une clé existe, l'ajouter au header
  if (apiKey) {
    config.headers.Authorization = 'key=' + apiKey;
  }
  
  return config;
});

export default apiClient;
