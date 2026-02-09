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
      for (let i = 0; i < state.timeEntries.length; i++) {
        if (!state.timeEntries[i].end) {
          return state.timeEntries[i];
        }
      }
      return undefined;
    },

    // Retourne les entrées du jour
    todayEntries(state) {
      const now = new Date();
      const month = now.getMonth() + 1;
      const day = now.getDate();
      const today = now.getFullYear() + '-' + 
                    (month < 10 ? '0' + month : month) + '-' + 
                    (day < 10 ? '0' + day : day);
      const result = [];
      for (let i = 0; i < state.timeEntries.length; i++) {
        if (state.timeEntries[i].start && state.timeEntries[i].start.startsWith(today)) {
          result.push(state.timeEntries[i]);
        }
      }
      return result;
    },

    // Temps total travaillé aujourd'hui (en secondes)
    totalTodaySeconds(state) {
      const now = new Date();
      const month = now.getMonth() + 1;
      const day = now.getDate();
      const today = now.getFullYear() + '-' + 
                    (month < 10 ? '0' + month : month) + '-' + 
                    (day < 10 ? '0' + day : day);
      
      const entries = [];
      for (let i = 0; i < state.timeEntries.length; i++) {
        if (state.timeEntries[i].start && state.timeEntries[i].start.startsWith(today) && state.timeEntries[i].end) {
          entries.push(state.timeEntries[i]);
        }
      }
      
      let totalSeconds = 0;
      for (let i = 0; i < entries.length; i++) {
        const start = new Date(entries[i].start);
        const end = new Date(entries[i].end);
        totalSeconds = totalSeconds + Math.floor((end - start) / 1000);
      }
      return totalSeconds;
    },

    // Durée de l'activité en cours (en secondes)
    currentDurationSeconds(state) {
      let active = null;
      for (let i = 0; i < state.timeEntries.length; i++) {
        if (!state.timeEntries[i].end) {
          active = state.timeEntries[i];
          break;
        }
      }
      if (!active) return 0;
      const start = new Date(active.start);
      const now = new Date();
      return Math.floor((now - start) / 1000);
    }
  },

  actions: {
    // Récupérer les entrées de temps
    async fetchTimeEntries(filters = {}) {
      this.loading = true;
      try {
        // Sauvegarder le commentaire local de l'entrée active avant refresh
        const activeEntryComment = this.activeEntry ? this.activeEntry.comment : null;
        const activeEntryId = this.activeEntry ? this.activeEntry.id : null;
        
        const params = new URLSearchParams(filters);
        const response = await this.$api.get('/time-entries?' + params);
        this.timeEntries.length = 0;
        for (let i = 0; i < response.data.length; i++) {
          this.timeEntries.push(response.data[i]);
        }
        
        // Restaurer le commentaire local de l'entrée active après refresh
        if (activeEntryId && activeEntryComment) {
          let activeEntry = null;
          for (let i = 0; i < this.timeEntries.length; i++) {
            if (this.timeEntries[i].id === activeEntryId && !this.timeEntries[i].end) {
              activeEntry = this.timeEntries[i];
              break;
            }
          }
          if (activeEntry) {
            activeEntry.comment = activeEntryComment;
          }
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des time entries', error);
        this.$toast.error("Erreur chargement entrées.");
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
        this.$toast.success("Tracker démarré !");
        return response.data;
      } catch (error) {
        this.$toast.error("Erreur démarrage tracker.");
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
        this.$toast.success("Entrée ajoutée !");
        return response.data;
      } catch (error) {
        this.$toast.error("Erreur ajout entrée.");
        throw error;
      }
    },

    // Modifier une entrée existante
    async updateTimeEntry(id, projectId, activityId, start, end, comment) {
      try {
        // Normaliser les dates au format ISO que l'API accepte
        const normalizeDate = (dateStr) => {
          if (!dateStr) return null;
          
          // Si la date contient déjà un T, elle est déjà au bon format ISO
          if (dateStr.indexOf('T') !== -1) {
            // Nettoyer : enlever les microsecondes et garder juste YYYY-MM-DDTHH:MM:SSZ
            const parts = dateStr.split('T');
            if (parts.length === 2) {
              const datePart = parts[0];
              let timePart = parts[1];
              // Enlever le Z ou le fuseau horaire
              timePart = timePart.replace('Z', '').split('.')[0].split('+')[0].split('-')[0];
              return datePart + 'T' + timePart + 'Z';
            }
            return dateStr;
          }
          
          // Sinon, convertir depuis le format local
          const date = new Date(dateStr);
          const year = date.getUTCFullYear();
          const month = date.getUTCMonth() + 1;
          const day = date.getUTCDate();
          const hours = date.getUTCHours();
          const minutes = date.getUTCMinutes();
          const seconds = date.getUTCSeconds();
          
          // Ajouter zéro devant si nécessaire
          const mm = month < 10 ? '0' + month : String(month);
          const dd = day < 10 ? '0' + day : String(day);
          const hh = hours < 10 ? '0' + hours : String(hours);
          const min = minutes < 10 ? '0' + minutes : String(minutes);
          const ss = seconds < 10 ? '0' + seconds : String(seconds);
          
          return year + '-' + mm + '-' + dd + 'T' + hh + ':' + min + ':' + ss + 'Z';
        };
        
        // PUT exige tous les champs obligatoires
        const data = {
          project_id: projectId,
          activity_id: activityId,
          start: normalizeDate(start),
          comment: comment === undefined ? '' : comment
        };
        
        // N'inclure end que s'il est défini (pas pour les entrées actives)
        if (end !== undefined && end !== null) {
          data.end = normalizeDate(end);
        }
        
        console.log('PUT /time-entries/' + id, data);
        const response = await this.$api.put('/time-entries/' + id, data);
        
        // Rafraîchir la liste pour avoir les données complètes avec relations
        await this.fetchTimeEntries();
        
        this.$toast.success("Entrée mise à jour.");
        return response.data;
      } catch (error) {
        console.error('Erreur updateTimeEntry:', error.response ? error.response.data : error);
        if (error.response && error.response.data && error.response.data.errors) {
          console.error('Détails des erreurs:', error.response.data.errors);
        }
        this.$toast.error("Erreur mise à jour.");
        throw error;
      }
    },

    // Mettre à jour le commentaire localement (sans appel API pour une entrée active)
    updateActiveComment(comment) {
      if (this.activeEntry) {
        this.activeEntry.comment = comment;
      }
    },

    // Stopper l'entrée en cours
    async stopTimeEntry(id) {
      try {
        const response = await this.$api.patch('/time-entries/' + id + '/stop');
        
        // Si il y a un commentaire local, le sauvegarder maintenant que l'entrée est stoppée
        let entry = null;
        for (let i = 0; i < this.timeEntries.length; i++) {
          if (this.timeEntries[i].id === id) {
            entry = this.timeEntries[i];
            break;
          }
        }
        if (entry && entry.comment) {
          await this.updateTimeEntry(
            id,
            response.data.project_id,
            response.data.activity_id,
            response.data.start,
            response.data.end,
            entry.comment
          );
          return;
        }
        
        const index = this.timeEntries.findIndex(e => e.id === id);
        if (index !== -1) {
          this.timeEntries[index] = response.data;
        }
        this.$toast.info("Tracker arrêté.");
      } catch (error) {
        this.$toast.error("Erreur arrêt tracker.");
        throw error;
      }
    },

    // Supprimer une entrée
    async deleteTimeEntry(id) {
      try {
        await this.$api.delete('/time-entries/' + id);
        const index = this.timeEntries.findIndex(e => e.id === id);
        if (index !== -1) {
          this.timeEntries.splice(index, 1);
        }
        this.$toast.info("Entrée supprimée.");
      } catch (error) {
        this.$toast.error("Erreur suppression.");
        throw error;
      }
    }
  }
});

