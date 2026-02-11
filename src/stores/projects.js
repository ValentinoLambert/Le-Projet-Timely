import { defineStore } from 'pinia';

/**
 * Store Pinia pour la gestion des projets
 * 
 * Responsabilités:
 * - Récupération de la liste des projets depuis l'API
 * - Création, modification et gestion de l'état des projets
 * - Filtrage des projets actifs/inactifs
 * 
 * Ce store utilise l'Options API de Pinia avec state, getters et actions
 */
export const useProjectStore = defineStore('projects', {
  state() {
    return {
      // Liste complète des projets récupérés depuis l'API
      projects: [],
      
      // Indicateur de chargement pour afficher un spinner dans l'UI
      loading: false,
    };
  },

  getters: {
    /**
     * Filtre et retourne uniquement les projets actifs (is_enabled = true)
     * Utilisé pour le sélecteur de projets dans le time tracker
     * 
     * @param {Object} state - État du store
     * @returns {Array} Liste des projets actifs
     */
    activeProjects(state) {
      const result = [];
      for (let i = 0; i < state.projects.length; i++) {
        if (state.projects[i].is_enabled) {
          result.push(state.projects[i]);
        }
      }
      return result;
    }
  },

  actions: {
    /**
     * Récupère la liste complète des projets depuis l'API
     * Met à jour le state.projects avec les données reçues
     * 
     * Gestion d'erreurs:
     * - Affiche un toast en cas d'échec
     * - Log l'erreur dans la console pour le debug
     */
    async fetchProjects() {
      this.loading = true;
      
      try {
        const response = await this.$api.get('/projects');
        
        // Vider le tableau avant de le remplir pour éviter les doublons
        this.projects.length = 0;
        
        // Remplir avec les nouveaux projets
        for (let i = 0; i < response.data.length; i++) {
          this.projects.push(response.data[i]);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des projets', error);
        this.$toast.error("Impossible de charger les projets.");
      } finally {
        this.loading = false;
      }
    },

    /**
     * Crée un nouveau projet via l'API
     * 
     * @param {string} name - Nom du projet
     * @param {string} description - Description optionnelle du projet
     * @throws {Error} Si la création échoue
     */
    async createProject(name, description) {
      try {
        const response = await this.$api.post('/projects', { name, description });
        
        // Ajouter le nouveau projet à la liste locale
        this.projects.push(response.data);
        
        this.$toast.success("Projet créé !");
      } catch (error) {
        this.$toast.error("Erreur lors de la création du projet.");
        throw error;
      }
    },

    /**
     * Met à jour un projet existant
     * 
     * @param {number} id - ID du projet à modifier
     * @param {string} name - Nouveau nom du projet
     * @param {string} description - Nouvelle description
     * @returns {Object} Données du projet mis à jour
     * @throws {Error} Si la mise à jour échoue
     */
    async updateProject(id, name, description) {
      try {
        const response = await this.$api.put('/projects/' + id, { name, description });
        
        // Trouver le projet dans la liste locale
        const index = this.projects.findIndex(p => p.id === id);
        
        // Remplacer par les nouvelles données
        if (index !== -1) {
          this.projects[index] = response.data;
        }
        
        this.$toast.success("Projet mis à jour.");
        return response.data;
      } catch (error) {
        this.$toast.error("Erreur lors de la mise à jour.");
        throw error;
      }
    },
    
    /**
     * Active ou désactive un projet
     * Utilise l'endpoint PATCH /projects/:id/enable ou /projects/:id/disable
     * 
     * @param {Object} project - Objet projet contenant id et is_enabled
     * @returns {Object} Données du projet mis à jour
     * @throws {Error} Si le changement d'état échoue
     */
    async toggleProject(project) {
      // Déterminer l'action à effectuer selon l'état actuel
      const action = project.is_enabled ? 'disable' : 'enable';
      
      try {
        const response = await this.$api.patch('/projects/' + project.id + '/' + action);
        
        // Mettre à jour dans la liste locale
        const index = this.projects.findIndex(p => p.id === project.id);
        if (index !== -1) {
          this.projects[index] = response.data;
        }
        
        // Message différent selon l'action
        const msg = project.is_enabled ? "Projet désactivé." : "Projet activé.";
        this.$toast.info(msg);
        
        return response.data;
      } catch (error) {
        this.$toast.error("Erreur lors du changement d'état.");
        throw error;
      }
    }
  }
});
