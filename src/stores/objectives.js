import { defineStore } from 'pinia';

/**
 * Store Pinia pour la gestion des objectifs journaliers
 * 
 * Responsabilités:
 * - Récupération et filtrage des objectifs du jour
 * - Création, basculement et suppression d'objectifs
 * - Calcul des statistiques (objectifs atteints vs total)
 * - Support Markdown pour le contenu des objectifs
 * 
 * Les objectifs sont associés à une date et peuvent avoir un statut done/undone
 */
export const useObjectiveStore = defineStore('objectives', {
  state() {
    return {
      // Liste complète des objectifs
      objectives: [],
      
      // Indicateur de chargement
      loading: false,
    };
  },

  getters: {
    /**
     * Filtre et retourne uniquement les objectifs du jour actuel
     * Compare la date de chaque objectif avec la date du jour
     * 
     * @param {Object} state - État du store
     * @returns {Array} Liste des objectifs d'aujourd'hui
     */
    todayObjectives(state) {
      const today = new Date().toDateString();
      const result = [];
      
      for (let i = 0; i < state.objectives.length; i++) {
        const objDate = new Date(state.objectives[i].date);
        
        // Comparer uniquement la partie date (ignore l'heure)
        if (objDate.toDateString() === today) {
          result.push(state.objectives[i]);
        }
      }
      
      return result;
    },

    /**
     * Compte le nombre d'objectifs marqués comme "done" aujourd'hui
     * Utilisé pour afficher le progrès dans le header
     * 
     * @returns {number} Nombre d'objectifs atteints
     */
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

    /**
     * Retourne le nombre total d'objectifs pour aujourd'hui
     * 
     * @returns {number} Nombre total d'objectifs du jour
     */
    todayTotalCount() {
      return this.todayObjectives.length;
    }
  },

  actions: {
    /**
     * Récupère la liste complète des objectifs depuis l'API
     * Endpoint: GET /daily-objectives
     */
    async fetchObjectives() {
      this.loading = true;
      
      try {
        const response = await this.$api.get('/daily-objectives');
        
        // Vider le tableau avant de le remplir
        this.objectives.length = 0;
        
        // Remplir avec les nouveaux objectifs
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

    /**
     * Crée un nouvel objectif pour aujourd'hui
     * L'API associe automatiquement la date du jour
     * 
     * @param {string} name - Titre de l'objectif
     * @param {string} content - Contenu/description (supporte Markdown)
     * @throws {Error} Si la création échoue
     */
    async createObjective(name, content) {
      try {
        const response = await this.$api.post('/daily-objectives', { name, content });
        
        // Ajouter le nouvel objectif à la liste locale
        this.objectives.push(response.data);
        
        this.$toast.success("Objectif ajouté !");
      } catch (error) {
        this.$toast.error("Erreur création objectif.");
        throw error;
      }
    },

    /**
     * Bascule l'état d'un objectif (fait <-> pas fait)
     * Utilise PATCH /daily-objectives/:id/done ou /daily-objectives/:id/undone
     * 
     * @param {Object} objective - Objet objectif avec id et done
     * @throws {Error} Si la mise à jour échoue
     */
    async toggleObjective(objective) {
      // Déterminer l'action selon l'état actuel
      const action = objective.done ? 'undone' : 'done';
      
      try {
        const response = await this.$api.patch('/daily-objectives/' + objective.id + '/' + action);
        
        // Mettre à jour dans la liste locale
        const index = this.objectives.findIndex(o => o.id === objective.id);
        if (index !== -1) {
          this.objectives[index] = response.data;
        }
        
        // Toast seulement quand on marque comme fait (évite le spam)
        if (action === 'done') {
          this.$toast.success("Objectif atteint !");
        }
      } catch (error) {
        this.$toast.error("Erreur mise à jour objectif.");
        throw error;
      }
    },

    /**
     * Supprime un objectif
     * 
     * @param {number} id - ID de l'objectif à supprimer
     * @throws {Error} Si la suppression échoue
     */
    async deleteObjective(id) {
      try {
        await this.$api.delete('/daily-objectives/' + id);
        
        // Retirer de la liste locale
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
