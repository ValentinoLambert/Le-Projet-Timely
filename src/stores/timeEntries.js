import { defineStore } from 'pinia';

/**
 * Store Pinia pour la gestion des entrées de temps (time tracking)
 * 
 * C'est le store le plus complexe de l'application car il gère:
 * - Le suivi du temps en direct (activité en cours)
 * - Les entrées passées (historique)
 * - Le calcul des statistiques journalières
 * - La synchronisation entre le commentaire local et l'API
 * - La normalisation des dates pour l'API
 * 
 * Structure d'une entrée:
 * - project_id: ID du projet
 * - activity_id: ID de l'activité
 * - start: Date/heure de début (ISO 8601)
 * - end: Date/heure de fin (null si en cours)
 * - comment: Commentaire optionnel
 */
export const useTimeEntryStore = defineStore('timeEntries', {
  state() {
    return {
      // Liste complète des entrées de temps
      timeEntries: [],
      
      // Indicateur de chargement
      loading: false
    };
  },

  getters: {
    /**
     * Retourne l'entrée actuellement en cours (sans date de fin)
     * Il ne peut y avoir qu'une seule entrée active à la fois
     * 
     * @param {Object} state - État du store
     * @returns {Object|undefined} L'entrée active ou undefined
     */
    activeEntry(state) {
      for (let i = 0; i < state.timeEntries.length; i++) {
        if (!state.timeEntries[i].end) {
          return state.timeEntries[i];
        }
      }
      return undefined;
    },

    /**
     * Filtre et retourne les entrées du jour actuel
     * Utilisé pour afficher la liste des activités de la journée
     * 
     * @param {Object} state - État du store
     * @returns {Array} Entrées d'aujourd'hui
     */
    todayEntries(state) {
      const now = new Date();
      const month = now.getMonth() + 1;
      const day = now.getDate();
      
      // Construire la date au format YYYY-MM-DD
      const today = now.getFullYear() + '-' + 
                    (month < 10 ? '0' + month : month) + '-' + 
                    (day < 10 ? '0' + day : day);
      
      const result = [];
      for (let i = 0; i < state.timeEntries.length; i++) {
        // Vérifier si la date de début commence par la date du jour
        if (state.timeEntries[i].start && state.timeEntries[i].start.startsWith(today)) {
          result.push(state.timeEntries[i]);
        }
      }
      
      return result;
    },

    /**
     * Calcule le temps total travaillé aujourd'hui (en secondes)
     * Exclut l'activité en cours pour éviter les doublons avec le timer live
     * 
     * @param {Object} state - État du store
     * @returns {number} Nombre de secondes travaillées
     */
    totalTodaySeconds(state) {
      const now = new Date();
      const month = now.getMonth() + 1;
      const day = now.getDate();
      const today = now.getFullYear() + '-' + 
                    (month < 10 ? '0' + month : month) + '-' + 
                    (day < 10 ? '0' + day : day);
      
      // Filtrer uniquement les entrées terminées d'aujourd'hui
      const entries = [];
      for (let i = 0; i < state.timeEntries.length; i++) {
        const entry = state.timeEntries[i];
        if (entry.start && entry.start.startsWith(today) && entry.end) {
          entries.push(entry);
        }
      }
      
      // Calculer la somme des durées
      let totalSeconds = 0;
      for (let i = 0; i < entries.length; i++) {
        const start = new Date(entries[i].start);
        const end = new Date(entries[i].end);
        totalSeconds = totalSeconds + Math.floor((end - start) / 1000);
      }
      
      return totalSeconds;
    },

    /**
     * Calcule la durée écoulée de l'activité en cours (en secondes)
     * Recalculé en temps réel dans le composant pour le live update
     * 
     * @param {Object} state - État du store
     * @returns {number} Durée en secondes, 0 si pas d'activité active
     */
    currentDurationSeconds(state) {
      // Trouver l'entrée active
      let active = null;
      for (let i = 0; i < state.timeEntries.length; i++) {
        if (!state.timeEntries[i].end) {
          active = state.timeEntries[i];
          break;
        }
      }
      
      if (!active) return 0;
      
      // Calculer le temps écoulé depuis le début
      const start = new Date(active.start);
      const now = new Date();
      return Math.floor((now - start) / 1000);
    }
  },

  actions: {
    /**
     * Récupère les entrées de temps depuis l'API
     * Supporte des filtres optionnels (from, to, project_id, etc.)
     * 
     * Gestion spéciale:
     * - Sauvegarde le commentaire local de l'entrée active avant refresh
     * - Restaure le commentaire après pour ne pas perdre la saisie en cours
     * 
     * @param {Object} filters - Filtres optionnels (from, to, project_id)
     */
    async fetchTimeEntries(filters = {}) {
      this.loading = true;
      
      try {
        // Sauvegarder le commentaire local de l'entrée active avant refresh
        const activeEntryComment = this.activeEntry ? this.activeEntry.comment : null;
        const activeEntryId = this.activeEntry ? this.activeEntry.id : null;
        
        // Construire l'URL avec les filtres
        const params = new URLSearchParams(filters);
        const response = await this.$api.get('/time-entries?' + params);
        
        // Vider et remplir le tableau
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

    /**
     * Crée une nouvelle entrée et démarre automatiquement le chronomètre
     * L'API initialise automatiquement la date de début à maintenant
     * 
     * @param {number} projectId - ID du projet
     * @param {number} activityId - ID de l'activité
     * @param {string} comment - Commentaire optionnel
     * @returns {Object} Données de l'entrée créée
     * @throws {Error} Si la création échoue
     */
    async createTimeEntry(projectId, activityId, comment = '') {
      try {
        const response = await this.$api.post('/time-entries', {
          project_id: projectId,
          activity_id: activityId,
          comment
        });
        
        // Ajouter à la liste locale
        this.timeEntries.push(response.data);
        
        this.$toast.success("Tracker démarré !");
        return response.data;
      } catch (error) {
        this.$toast.error("Erreur démarrage tracker.");
        throw error;
      }
    },

    /**
     * Crée une entrée passée avec dates de début et fin spécifiées
     * Utilisé pour l'ajout manuel d'historique
     * 
     * @param {number} projectId - ID du projet
     * @param {number} activityId - ID de l'activité
     * @param {string} start - Date/heure de début (ISO)
     * @param {string} end - Date/heure de fin (ISO)
     * @param {string} comment - Commentaire optionnel
     * @returns {Object} Données de l'entrée créée
     * @throws {Error} Si la création échoue
     */
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

    /**
     * Met à jour une entrée existante
     * 
     * Complexité: Cette fonction normalise les dates pour l'API
     * L'API attend le format ISO 8601: YYYY-MM-DDTHH:MM:SSZ
     * 
     * @param {number} id - ID de l'entrée
     * @param {number} projectId - ID du projet
     * @param {number} activityId - ID de l'activité
     * @param {string} start - Date/heure de début
     * @param {string} end - Date/heure de fin (optionnel si actif)
     * @param {string} comment - Commentaire
     * @returns {Object} Données de l'entrée mise à jour
     * @throws {Error} Si la mise à jour échoue
     */
    async updateTimeEntry(id, projectId, activityId, start, end, comment) {
      try {
        /**
         * Fonction interne pour normaliser les dates au format ISO
         * Gère plusieurs formats d'entrée et les convertit en ISO strict
         * 
         * @param {string} dateStr - Date à normaliser
         * @returns {string|null} Date au format ISO ou null
         */
        const normalizeDate = (dateStr) => {
          if (!dateStr) return null;
          
          // Si la date contient déjà un T, elle est au format ISO
          if (dateStr.indexOf('T') !== -1) {
            // Nettoyer: enlever les microsecondes et garder YYYY-MM-DDTHH:MM:SSZ
            const parts = dateStr.split('T');
            if (parts.length === 2) {
              const datePart = parts[0];
              let timePart = parts[1];
              
              // Enlever le Z, les microsecondes, et le fuseau horaire
              timePart = timePart.replace('Z', '').split('.')[0].split('+')[0].split('-')[0];
              return datePart + 'T' + timePart + 'Z';
            }
            return dateStr;
          }
          
          // Sinon, convertir depuis le format local vers UTC
          const date = new Date(dateStr);
          const year = date.getUTCFullYear();
          const month = date.getUTCMonth() + 1;
          const day = date.getUTCDate();
          const hours = date.getUTCHours();
          const minutes = date.getUTCMinutes();
          const seconds = date.getUTCSeconds();
          
          // Ajouter le zéro devant si nécessaire
          const mm = month < 10 ? '0' + month : String(month);
          const dd = day < 10 ? '0' + day : String(day);
          const hh = hours < 10 ? '0' + hours : String(hours);
          const min = minutes < 10 ? '0' + minutes : String(minutes);
          const ss = seconds < 10 ? '0' + seconds : String(seconds);
          
          return year + '-' + mm + '-' + dd + 'T' + hh + ':' + min + ':' + ss + 'Z';
        };
        
        // Construire le payload avec tous les champs obligatoires
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

    /**
     * Met à jour le commentaire localement sans appel API
     * Utilisé pour éditer le commentaire pendant qu'une activité est en cours
     * Le commentaire sera sauvegardé sur l'API au moment du stop
     * 
     * @param {string} comment - Nouveau commentaire
     */
    updateActiveComment(comment) {
      if (this.activeEntry) {
        this.activeEntry.comment = comment;
      }
    },

    /**
     * Stoppe l'entrée en cours
     * L'API définit automatiquement la date de fin à maintenant
     * 
     * Logique spéciale:
     * - Si un commentaire local existe, il est sauvegardé via updateTimeEntry
     * - Sinon, on met simplement à jour l'entrée locale avec la réponse
     * 
     * @param {number} id - ID de l'entrée à stopper
     * @throws {Error} Si l'arrêt échoue
     */
    async stopTimeEntry(id) {
      try {
        const response = await this.$api.patch('/time-entries/' + id + '/stop');
        
        // Si un commentaire local existe, le sauvegarder maintenant
        let entry = null;
        for (let i = 0; i < this.timeEntries.length; i++) {
          if (this.timeEntries[i].id === id) {
            entry = this.timeEntries[i];
            break;
          }
        }
        
        if (entry && entry.comment) {
          // Sauvegarder le commentaire via un PUT complet
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
        
        // Sinon, simplement mettre à jour l'entrée locale
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

    /**
     * Supprime une entrée de temps
     * 
     * @param {number} id - ID de l'entrée à supprimer
     * @throws {Error} Si la suppression échoue
     */
    async deleteTimeEntry(id) {
      try {
        await this.$api.delete('/time-entries/' + id);
        
        // Retirer de la liste locale
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
