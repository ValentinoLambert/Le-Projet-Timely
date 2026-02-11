import { defineStore } from 'pinia';

/**
 * Store Pinia pour la gestion des activités
 * 
 * Responsabilités:
 * - Récupération de la liste des activités depuis l'API
 * - Création, modification et gestion de l'état des activités
 * - Support des descriptions Markdown pour les activités
 * - Filtrage des activités actives/inactives
 * 
 * Ce store utilise l'Options API de Pinia
 */
export const useActivityStore = defineStore('activities', {
  state() {
    return {
      // Liste complète des activités
      activities: [],
      
      // Indicateur de chargement
      loading: false,
    };
  },

  getters: {
    /**
     * Retourne uniquement les activités actives (is_enabled = true)
     * Utilisé pour le sélecteur d'activités dans le time tracker
     * 
     * @param {Object} state - État du store
     * @returns {Array} Liste des activités actives
     */
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
    /**
     * Récupère la liste complète des activités depuis l'API
     * Met à jour state.activities avec les données reçues
     */
    async fetchActivities() {
      this.loading = true;
      
      try {
        const response = await this.$api.get('/activities');
        
        // Vider le tableau pour éviter les doublons
        this.activities.length = 0;
        
        // Remplir avec les nouvelles activités
        for (let i = 0; i < response.data.length; i++) {
          this.activities.push(response.data[i]);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des activités', error);
        this.$toast.error("Impossible de charger les activités.");
      } finally {
        this.loading = false;
      }
    },

    /**
     * Crée une nouvelle activité avec support Markdown pour la description
     * 
     * @param {string} name - Nom de l'activité
     * @param {string} color - Couleur hexadécimale pour l'activité
     * @param {string} description - Description optionnelle (supporte Markdown)
     * @throws {Error} Si la création échoue
     */
    async createActivity(name, color, description = '') {
      try {
        // Préparer le payload
        const payload = { name, color };
        
        // Ajouter la description seulement si elle est fournie
        if (description) payload.description = description;
        
        const response = await this.$api.post('/activities', payload);
        
        // Ajouter la nouvelle activité à la liste locale
        this.activities.push(response.data);
        
        this.$toast.success("Activité créée !");
      } catch (error) {
        this.$toast.error("Erreur lors de la création de l'activité.");
        throw error;
      }
    },

    /**
     * Met à jour une activité existante
     * 
     * @param {number} id - ID de l'activité à modifier
     * @param {string} name - Nouveau nom
     * @param {string} color - Nouvelle couleur
     * @param {string} description - Nouvelle description (Markdown)
     * @returns {Object} Données de l'activité mise à jour
     * @throws {Error} Si la mise à jour échoue
     */
    async updateActivity(id, name, color, description = '') {
      try {
        const payload = { name, color };
        
        // Inclure la description si elle est définie
        if (description !== undefined) payload.description = description;
        
        const response = await this.$api.put('/activities/' + id, payload);
        
        // Mettre à jour dans la liste locale
        const index = this.activities.findIndex(a => a.id === id);
        if (index !== -1) {
          this.activities[index] = response.data;
        }
        
        this.$toast.success("Activité mise à jour.");
        return response.data;
      } catch (error) {
        this.$toast.error("Erreur de mise à jour.");
        throw error;
      }
    },

    /**
     * Active ou désactive une activité
     * Utilise PATCH /activities/:id/enable ou /activities/:id/disable
     * 
     * @param {Object} activity - Objet activité avec id et is_enabled
     * @throws {Error} Si le changement d'état échoue
     */
    async toggleActivity(activity) {
      const action = activity.is_enabled ? 'disable' : 'enable';
      
      try {
        const response = await this.$api.patch('/activities/' + activity.id + '/' + action);
        
        // Mettre à jour dans la liste locale
        const index = this.activities.findIndex(a => a.id === activity.id);
        if (index !== -1) {
          this.activities[index] = response.data;
        }
        
        // Message contextuel
        const msg = activity.is_enabled ? "Activité désactivée." : "Activité activée.";
        this.$toast.info(msg);
      } catch (error) {
        this.$toast.error("Erreur changement d'état.");
        throw error;
      }
    }
  }
});
