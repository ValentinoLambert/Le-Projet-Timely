import { defineStore } from 'pinia';
import apiClient from '../plugins/axios';

export const useProjectStore = defineStore('projects', {
  state() {
    return {
      projects: [],
      loading: false,
    };
  },

  getters: {
    // Retourne uniquement les projets actifs
    activeProjects: (state) => state.projects.filter(p => p.active),
  },

  actions: {
    // Récupérer la liste des projets depuis l'API
    async fetchProjects() {
      this.loading = true;
      try {
        const response = await apiClient.get('/projects');
        this.projects = response.data;
      } catch (error) {
        console.error('Erreur lors de la récupération des projets', error);
      } finally {
        this.loading = false;
      }
    },

    // Créer un nouveau projet
    async createProject(name, description) {
      try {
        const response = await apiClient.post('/projects', { name, description });
        this.projects.push(response.data);
      } catch (error) {
        throw error;
      }
    },
    
    // Activer ou désactiver un projet
    async toggleProject(project) {
      // Si le projet est actif, on appelle l'endpoint disable, sinon enable
      const action = project.active ? 'disable' : 'enable';
      try {
        const response = await apiClient.patch(`/projects/${project.id}/${action}`);
        // Mise à jour locale du projet dans la liste pour refléter le changement
        const index = this.projects.findIndex(p => p.id === project.id);
        if (index !== -1) {
          this.projects[index] = response.data;
        }
      } catch (error) {
        throw error;
      }
    }
  },

  // Persistance optionnelle pour garder la liste en cache si besoin
  persist: {
    enabled: true,
    strategies: [{ storage: localStorage, paths: ['projects'] }]
  }
});
