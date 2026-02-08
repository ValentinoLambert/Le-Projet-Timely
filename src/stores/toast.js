import { defineStore } from 'pinia';

export const useToastStore = defineStore('toast', {
  state: () => ({
    toasts: []
  }),

  actions: {
    show(message, type = 'info', duration = 3000) {
      const id = Date.now() + Math.random();
      const toast = { id, message, type, duration };
      
      this.toasts.push(toast);

      if (duration > 0) {
        setTimeout(() => {
          this.remove(id);
        }, duration);
      }
    },

    remove(id) {
      const index = this.toasts.findIndex(t => t.id === id);
      if (index > -1) {
        this.toasts.splice(index, 1);
      }
    },

    success(message, duration = 3000) {
      this.show(message, 'success', duration);
    },

    error(message, duration = 4000) {
      this.show(message, 'error', duration);
    },

    warning(message, duration = 3000) {
      this.show(message, 'warning', duration);
    },

    info(message, duration = 3000) {
      this.show(message, 'info', duration);
    }
  }
});
