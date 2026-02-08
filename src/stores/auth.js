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
        return response.data;
      } catch (error) {
        this.logout();
        throw error;
      }
    },

    async register(name, email) {
      try {
        const response = await this.$api.post('/apikeys', { name, email });
        console.debug('auth.register response', response.status, response.data);

        const d = response.data ?? {}
        const key = d.key ?? '';
        if (key) {
          this.setApiKey(key);
        } else {
          console.warn('Pas de clé API trouvée dans la réponse', response.data);
        }
        this.user = response.data;
        return response.data;
      } catch (error) {
        console.error('auth.register erreur', error.response?.status, error.response?.data || error.message);
        throw error;
      }
    },

    logout() {
      this.apiKey = null;
      this.user = null;
      localStorage.removeItem('timely_api_key');
    },
  },

  persist: {
    enabled: true,
    strategies: [
      { storage: localStorage, paths: ['apiKey', 'user'] }
    ]
  }
});
