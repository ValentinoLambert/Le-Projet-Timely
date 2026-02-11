import { defineStore } from 'pinia';

/**
 * Store Pinia pour la gestion de l'authentification
 * 
 * Responsabilités:
 * - Gestion de la clé API utilisateur
 * - Récupération du profil utilisateur
 * - Inscription (création de clé API)
 * - Déconnexion
 * - Persistance de l'état d'authentification (localStorage)
 * 
 * L'API utilise un système de clés API plutôt que JWT
 * La clé API est envoyée dans le header Authorization de chaque requête
 */
export const useAuthStore = defineStore('auth', {
  state() {
    return {
      // Données du profil utilisateur (name, email, etc.)
      user: null,
      
      // Clé API pour l'authentification
      apiKey: null,
    };
  },
  
  getters: {
    /**
     * Vérifie si l'utilisateur est authentifié
     * Basé sur la présence de la clé API
     * 
     * @param {Object} state - État du store
     * @returns {boolean} true si authentifié, false sinon
     */
    isAuthenticated: (state) => !!state.apiKey,
  },

  actions: {
    /**
     * Sauvegarde la clé API dans le state et le localStorage
     * 
     * @param {string} key - Clé API à sauvegarder
     */
    setApiKey(key) {
      this.apiKey = key;
      localStorage.setItem('timely_api_key', key);
    },

    /**
     * Authentifie l'utilisateur avec une clé API existante
     * 
     * Processus:
     * 1. Sauvegarde la clé API fournie
     * 2. Récupère le profil utilisateur via GET /profile
     * 3. Si échec, déconnecte automatiquement
     * 
     * @param {string} apiKey - Clé API de l'utilisateur
     * @returns {Object} Données du profil utilisateur
     * @throws {Error} Si la clé API est invalide
     */
    async login(apiKey) {
      this.setApiKey(apiKey);
      
      try {
        // Vérifier la clé en récupérant le profil
        const response = await this.$api.get('/profile');
        this.user = response.data;
        
        this.$toast.success(`Bienvenue ${this.user.name} !`);
        return response.data;
      } catch (error) {
        // Clé invalide: nettoyer l'état
        this.logout();
        this.$toast.error("Échec de la connexion. Vérifiez votre clé API.");
        throw error;
      }
    },

    /**
     * Crée un nouveau compte et génère une clé API
     * 
     * Processus:
     * 1. Envoie name et email à POST /apikeys
     * 2. L'API retourne une nouvelle clé API
     * 3. Sauvegarde la clé et les données utilisateur
     * 
     * @param {string} name - Nom complet de l'utilisateur
     * @param {string} email - Adresse email
     * @returns {Object} Données de l'utilisateur créé avec la clé API
     * @throws {Error} Si la création échoue (email déjà utilisé, etc.)
     */
    async register(name, email) {
      try {
        const response = await this.$api.post('/apikeys', { name, email });
        
        // Extraire la clé API de la réponse
        const d = response.data || {};
        const key = d.key || '';
        
        if (key) {
          this.setApiKey(key);
        } else {
          console.warn('Pas de clé API trouvée dans la réponse', response.data);
        }
        
        // Sauvegarder les données utilisateur
        this.user = response.data;
        
        this.$toast.success("Compte créé avec succès !");
        return response.data;
      } catch (error) {
        const status = error.response && error.response.status;
        const data = error.response && error.response.data;
        
        console.error('auth.register erreur', status, data || error.message);
        this.$toast.error("Erreur lors de l'inscription.");
        throw error;
      }
    },

    /**
     * Déconnecte l'utilisateur
     * Nettoie l'état local et le localStorage
     */
    logout() {
      this.apiKey = null;
      this.user = null;
      localStorage.removeItem('timely_api_key');
      this.$toast.info("Déconnecté.");
    },
  },

  /**
   * Configuration de la persistance avec pinia-plugin-persist
   * Sauvegarde apiKey et user dans le localStorage
   * Permet de rester connecté après un rechargement de page
   */
  persist: {
    enabled: true,
    strategies: [
      { storage: localStorage, paths: ['apiKey', 'user'] }
    ]
  }
});
