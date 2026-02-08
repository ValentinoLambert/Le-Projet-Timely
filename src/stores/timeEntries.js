import { defineStore } from 'pinia';

export const useTimeEntryStore = defineStore('timeEntries', {
  state() {
    return {
      timeEntries: [],
      loading: false
    };
  },

  getters: {
    // Retourne l'entrée en cours (celle sans date de fin)
    activeEntry(state) {
      return state.timeEntries.find(e => !e.end);
    },

    // Retourne les entrées du jour
    todayEntries(state) {
      const today = new Date().toISOString().split('T')[0];
      return state.timeEntries.filter(e => e.start && e.start.startsWith(today));
    }
  },

  actions: {
    // Récupérer les entrées de temps
    async fetchTimeEntries(filters = {}) {
      this.loading = true;
      try {
        const params = new URLSearchParams(filters);
        const response = await this.$api.get(`/time-entries?${params}`);
        this.timeEntries.length = 0;
        this.timeEntries.push(...response.data);
      } catch (error) {
        console.error('Erreur lors de la récupération des time entries', error);
      } finally {
        this.loading = false;
      }
    },

    // Créer une nouvelle entrée (démarre automatiquement le chronomètre)
    async createTimeEntry(projectId, activityId, comment = '') {
      try {
        const response = await this.$api.post('/time-entries', {
          project_id: projectId,
          activity_id: activityId,
          comment
        });
        this.timeEntries.push(response.data);
        return response.data;
      } catch (error) {
        throw error;
      }
    },

    // Créer une entrée passée (avec dates de début et fin)
    async createPastTimeEntry(projectId, activityId, start, end, comment = '') {
      try {
        const response = await this.$api.post('/time-entries', {
          project_id: projectId,
          activity_id: activityId,
          start,
          end,
          comment
        });
        this.timeEntries.push(response.data);
        return response.data;
      } catch (error) {
        throw error;
      }
    },

    // Modifier une entrée existante
    async updateTimeEntry(id, projectId, activityId, start, end, comment) {
      try {
        const response = await this.$api.put(`/time-entries/${id}`, {
          project_id: projectId,
          activity_id: activityId,
          start,
          end,
          comment
        });
        const index = this.timeEntries.findIndex(e => e.id === id);
        if (index !== -1) {
          this.timeEntries[index] = response.data;
        }
      } catch (error) {
        throw error;
      }
    },

    // Stopper l'entrée en cours
    async stopTimeEntry(id) {
      try {
        const response = await this.$api.patch(`/time-entries/${id}/stop`);
        const index = this.timeEntries.findIndex(e => e.id === id);
        if (index !== -1) {
          this.timeEntries[index] = response.data;
        }
      } catch (error) {
        throw error;
      }
    },

    // Supprimer une entrée
    async deleteTimeEntry(id) {
      try {
        await this.$api.delete(`/time-entries/${id}`);
        const index = this.timeEntries.findIndex(e => e.id === id);
        if (index !== -1) {
          this.timeEntries.splice(index, 1);
        }
      } catch (error) {
        throw error;
      }
    }
  }
});
