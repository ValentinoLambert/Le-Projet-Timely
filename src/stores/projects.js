import { defineStore } from 'pinia';

export const useProjectStore = defineStore('projects', {
  state() {
    return {
      projects: [],
      loading: false,
    };
  },

  getters: {
    // Retourne uniquement les projets actifs
    activeProjects: (state) => state.projects.filter(p => p.is_enabled),
  },

  actions: {
    // Récupérer la liste des projets depuis l'API
    async fetchProjects() {
      this.loading = true;
      try {
        const response = await this.$api.get('/projects');
        this.projects.length = 0;
        this.projects.push(...response.data);
      } catch (error) {
        console.error('Erreur lors de la récupération des projets', error);
      } finally {
        this.loading = false;
      }
    },

    // Créer un nouveau projet
    async createProject(name, description) {
      try {
        const response = await this.$api.post('/projects', { name, description });
        this.projects.push(response.data);
      } catch (error) {
        throw error;
      }
    },
    
    // Activer ou désactiver un projet
    async toggleProject(project) {
      const action = project.is_enabled ? 'disable' : 'enable';
      try {
        const response = await this.$api.patch(`/projects/${project.id}/${action}`);
        const index = this.projects.findIndex(p => p.id === project.id);
        if (index !== -1) {
          this.projects[index] = response.data;
        }
        return response.data;
      } catch (error) {
        throw error;
      }
    }
  }
});
