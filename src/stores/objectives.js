import { defineStore } from 'pinia';

export const useObjectiveStore = defineStore('objectives', {
  state() {
    return {
      objectives: [],
      loading: false,
    };
  },

  getters: {
    // Filtrer les objectifs non atteints
    pendingObjectives: (state) => state.objectives.filter(o => !o.done),
    // Filtrer les objectifs atteints
    completedObjectives: (state) => state.objectives.filter(o => o.done),
    // Calculer le taux de réalisation (pour le dashboard par exemple)
    completionRate: (state) => {
      if (state.objectives.length === 0) return 0;
      return Math.round((state.objectives.filter(o => o.done).length / state.objectives.length) * 100);
    }
  },

  actions: {
    // Récupérer les objectifs du jour depuis l'API
    async fetchObjectives() {
      this.loading = true;
      try {
        const response = await this.$api.get('/daily-objectives');
        this.objectives.length = 0;
        this.objectives.push(...response.data);
      } catch (error) {
        console.error('Erreur lors de la récupération des objectifs', error);
      } finally {
        this.loading = false;
      }
    },

    // Créer un nouvel objectif
    async createObjective(name, content) {
      try {
        const response = await this.$api.post('/daily-objectives', { name, content });
        this.objectives.push(response.data);
      } catch (error) {
        throw error;
      }
    },

    // Basculer l'état (fait/non fait) d'un objectif
    async toggleObjective(objective) {
      const action = objective.done ? 'undone' : 'done';
      try {
        const response = await this.$api.patch(`/daily-objectives/${objective.id}/${action}`);
        // Mise à jour locale
        const index = this.objectives.findIndex(o => o.id === objective.id);
        if (index !== -1) {
          this.objectives[index] = response.data;
        }
      } catch (error) {
        throw error;
      }
    },

    // Supprimer un objectif
    async deleteObjective(id) {
      try {
        await this.$api.delete(`/daily-objectives/${id}`);
        const index = this.objectives.findIndex(o => o.id === id);
        if (index !== -1) {
          this.objectives.splice(index, 1);
        }
      } catch (error) {
        throw error;
      }
    }
  }
});
