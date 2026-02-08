import { defineStore } from 'pinia';

export const useActivityStore = defineStore('activities', {
  state() {
    return {
      activities: [],
      loading: false,
    };
  },

  getters: {
    // Retourne uniquement les activités actives
    activeActivities(state) {
      const result = [];
      for (let i = 0; i < state.activities.length; i++) {
        if (state.activities[i].is_enabled) {
          result.push(state.activities[i]);
        }
      }
      return result;
    }
  },

  actions: {
    // Récupérer la liste des activités depuis l'API
    async fetchActivities() {
      this.loading = true;
      try {
        const response = await this.$api.get('/activities');
        this.activities.length = 0;
        for (let i = 0; i < response.data.length; i++) {
          this.activities.push(response.data[i]);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des activités', error);
      } finally {
        this.loading = false;
      }
    },

    // Créer une nouvelle activité
    async createActivity(name, color) {
      try {
        const response = await this.$api.post('/activities', { name, color });
        this.activities.push(response.data);
      } catch (error) {
        throw error;
      }
    },

    // Mettre à jour une activité
    async updateActivity(id, name, color) {
      try {
        const response = await this.$api.put('/activities/' + id, { name, color });
        const index = this.activities.findIndex(a => a.id === id);
        if (index !== -1) {
          this.activities[index] = response.data;
        }
        return response.data;
      } catch (error) {
        throw error;
      }
    },

    // Activer ou désactiver une activité
    async toggleActivity(activity) {
      const action = activity.is_enabled ? 'disable' : 'enable';
      try {
        const response = await this.$api.patch('/activities/' + activity.id + '/' + action);
        const index = this.activities.findIndex(a => a.id === activity.id);
        if (index !== -1) {
          this.activities[index] = response.data;
        }
      } catch (error) {
        throw error;
      }
    }
  }
});
