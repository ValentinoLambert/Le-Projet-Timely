import { defineStore } from 'pinia';

export const useObjectiveStore = defineStore('objectives', {
  state() {
    return {
      objectives: [],
      loading: false,
    };
  },

  getters: {
    // Objectifs du jour
    todayObjectives(state) {
      const today = new Date().toDateString();
      const result = [];
      for (let i = 0; i < state.objectives.length; i++) {
        const objDate = new Date(state.objectives[i].date);
        if (objDate.toDateString() === today) {
          result.push(state.objectives[i]);
        }
      }
      return result;
    },

    // Nombre d'objectifs atteints aujourd'hui
    todayDoneCount() {
      let count = 0;
      const todayObjs = this.todayObjectives;
      for (let i = 0; i < todayObjs.length; i++) {
        if (todayObjs[i].done) {
          count = count + 1;
        }
      }
      return count;
    },

    // Nombre total d'objectifs aujourd'hui
    todayTotalCount() {
      return this.todayObjectives.length;
    }
  },

  actions: {
    // Récupérer les objectifs du jour depuis l'API
    async fetchObjectives() {
      this.loading = true;
      try {
        const response = await this.$api.get('/daily-objectives');
        this.objectives.length = 0;
        for (let i = 0; i < response.data.length; i++) {
          this.objectives.push(response.data[i]);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des objectifs', error);
        this.$toast.error("Erreur chargement objectifs.");
      } finally {
        this.loading = false;
      }
    },

    // Créer un nouvel objectif
    async createObjective(name, content) {
      try {
        const response = await this.$api.post('/daily-objectives', { name, content });
        this.objectives.push(response.data);
        this.$toast.success("Objectif ajouté !");
      } catch (error) {
        this.$toast.error("Erreur création objectif.");
        throw error;
      }
    },

    // Basculer l'état (fait/non fait) d'un objectif
    async toggleObjective(objective) {
      const action = objective.done ? 'undone' : 'done';
      try {
        const response = await this.$api.patch('/daily-objectives/' + objective.id + '/' + action);
        // Mise à jour locale
        const index = this.objectives.findIndex(o => o.id === objective.id);
        if (index !== -1) {
          this.objectives[index] = response.data;
        }
        if (action === 'done') this.$toast.success("Objectif atteint !");
      } catch (error) {
        this.$toast.error("Erreur mise à jour objectif.");
        throw error;
      }
    },

    // Supprimer un objectif
    async deleteObjective(id) {
      try {
        await this.$api.delete('/daily-objectives/' + id);
        const index = this.objectives.findIndex(o => o.id === id);
        if (index !== -1) {
          this.objectives.splice(index, 1);
        }
        this.$toast.info("Objectif supprimé.");
      } catch (error) {
        this.$toast.error("Erreur suppression objectif.");
        throw error;
      }
    }
  }
});

