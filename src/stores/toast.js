import { defineStore } from 'pinia';

/**
 * Store de gestion des notifications (Toasts)
 * Permet d'afficher des messages temporaires à l'utilisateur
 * Note: Ce store est utilisé en complément ou remplacement de bibliothèques externes
 * pour une gestion personnalisée des notifications dans l'interface.
 */
export const useToastStore = defineStore('toast', {
  /**
   * État du store
   * @property {Array} toasts - Liste des notifications actives
   */
  state: () => ({
    toasts: []
  }),

  actions: {
    /**
     * Affiche une nouvelle notification
     * @param {string} message - Le texte à afficher
     * @param {string} type - Le type de notification (info, success, error, warning)
     * @param {number} duration - Durée d'affichage en ms (0 pour permanent)
     */
    show(message, type = 'info', duration = 3000) {
      const id = Date.now() + Math.random();
      const toast = { id, message, type, duration };
      
      this.toasts.push(toast);

      // Suppression automatique après la durée spécifiée
      if (duration > 0) {
        setTimeout(() => {
          this.remove(id);
        }, duration);
      }
    },

    /**
     * Supprime une notification par son ID
     * @param {number|string} id - L'identifiant de la notification
     */
    remove(id) {
      const index = this.toasts.findIndex(t => t.id === id);
      if (index > -1) {
        this.toasts.splice(index, 1);
      }
    },

    /** Raccourci pour une notification de succès */
    success(message, duration = 3000) {
      this.show(message, 'success', duration);
    },

    /** Raccourci pour une notification d'erreur */
    error(message, duration = 4000) {
      this.show(message, 'error', duration);
    },

    /** Raccourci pour une notification d'avertissement */
    warning(message, duration = 3000) {
      this.show(message, 'warning', duration);
    },

    /** Raccourci pour une notification d'information */
    info(message, duration = 3000) {
      this.show(message, 'info', duration);
    }
  }
});
