import { defineStore } from 'pinia';
import apiClient from '../plugins/axios';

export const useActivityStore = defineStore('activities', {
  state() {
    return {
      activities: [],
      loading: false,
    };
  },

  getters: {
    // Retourne uniquement les activités actives
    activeActivities: (state) => state.activities.filter(a => a.active),
  },

  actions: {
    // Récupérer la liste des activités depuis l'API
    async fetchActivities() {
      this.loading = true;
      try {
        const response = await apiClient.get('/activities');
        this.activities = response.data;
      } catch (error) {
        console.error('Erreur lors de la récupération des activités', error);
      } finally {
        this.loading = false;
      }
    },

    // Créer une nouvelle activité
    async createActivity(name, color) {
      try {
        const response = await apiClient.post('/activities', { name, color });
        this.activities.push(response.data);
      } catch (error) {
        throw error;
      }
    },

    // Activer ou désactiver une activité
    async toggleActivity(activity) {
      const action = activity.active ? 'disable' : 'enable';
      try {
        const response = await apiClient.patch(`/activities/${activity.id}/${action}`);
        const index = this.activities.findIndex(a => a.id === activity.id);
        if (index !== -1) {
          this.activities[index] = response.data;
        }
      } catch (error) {
        throw error;
      }
    }
  },

  persist: {
    enabled: true,
    strategies: [{ storage: localStorage, paths: ['activities'] }]
  }
});
