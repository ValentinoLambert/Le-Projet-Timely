import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
  state() {
    return {
      user: null,
      apiKey: null,
    };
  },
  
  getters: {
    isAuthenticated: (state) => !!state.apiKey,
  },

  actions: {
    setApiKey(key) {
      this.apiKey = key;
      localStorage.setItem('timely_api_key', key);
    },

    async login(apiKey) {
      this.setApiKey(apiKey);
      try {
        const response = await this.$api.get('/profile');
        this.user = response.data;
        this.$toast.success(`Bienvenue ${this.user.name} !`);
        return response.data;
      } catch (error) {
        this.logout();
        this.$toast.error("Échec de la connexion. Vérifiez votre clé API.");
        throw error;
      }
    },

    async register(name, email) {
      try {
        const response = await this.$api.post('/apikeys', { name, email });
        
        const d = response.data || {};
        const key = d.key || '';
        if (key) {
          this.setApiKey(key);
        } else {
          console.warn('Pas de clé API trouvée dans la réponse', response.data);
        }
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

    logout() {
      this.apiKey = null;
      this.user = null;
      localStorage.removeItem('timely_api_key');
      this.$toast.info("Déconnecté.");
    },
  },

  persist: {
    enabled: true,
    strategies: [
      { storage: localStorage, paths: ['apiKey', 'user'] }
    ]
  }
});

