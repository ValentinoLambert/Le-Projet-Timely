import { defineStore } from 'pinia';
import apiClient from '../plugins/axios';

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
        const response = await apiClient.get('/profile');
        this.user = response.data;
        return response.data;
      } catch (error) {
        this.logout();
        throw error;
      }
    },

    async register(name, email) {
      try {
        const response = await apiClient.post('/apikeys', { name, email });
        this.setApiKey(response.data.api_key);
        this.user = response.data;
        return response.data;
      } catch (error) {
        throw error;
      }
    },

    logout() {
      this.apiKey = null;
      this.user = null;
      localStorage.removeItem('timely_api_key');
    },
  },

  // Configuration de la persistance comme indiqué dans le cours
  persist: {
    enabled: true,
    strategies: [
      { storage: localStorage, paths: ['apiKey', 'user'] }
    ]
  }
});
