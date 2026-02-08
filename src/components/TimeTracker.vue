<script setup>
import { onMounted, ref, computed } from 'vue';
import { useTimeEntryStore } from '../stores/timeEntries';
import { useProjectStore } from '../stores/projects';
import { useActivityStore } from '../stores/activities';
import { useToastStore } from '../stores/toast';
import { formatDuration, calculateDuration } from '../mixins/durations';
import { formatDate, formatDateTime } from '../mixins/dates';

const timeEntryStore = useTimeEntryStore();
const projectStore = useProjectStore();
const activityStore = useActivityStore();
const toastStore = useToastStore();

const selectedProjectId = ref('');
const selectedActivityId = ref('');
const comment = ref('');

// Computed pour le commentaire de l'activité en cours (synchronisé avec le store)
const activeComment = computed({
  get() {
    return timeEntryStore.activeEntry ? (timeEntryStore.activeEntry.comment || '') : '';
  },
  set(value) {
    if (timeEntryStore.activeEntry) {
      timeEntryStore.updateActiveComment(value);
    }
  }
});

// Variables pour édition et création manuelle
const editing = ref(null);
const showManual = ref(false);
const manualProject = ref('');
const manualActivity = ref('');
const manualStart = ref('');
const manualEnd = ref('');
const manualComment = ref('');

// Filtres
const filterProject = ref('');
const filterActivity = ref('');
const filterKeywords = ref('');

// Charger les données au montage
onMounted(() => {
  projectStore.fetchProjects();
  activityStore.fetchActivities();
});

// Mettre à jour le commentaire de l'activité en cours (appelé sur blur)
const updateActiveComment = () => {
  // La mise à jour est déjà faite via le computed setter
  // Cette fonction existe juste pour le @blur
};

// Démarrer une nouvelle activité
const startActivity = async () => {
  if (!selectedProjectId.value || !selectedActivityId.value) {
    toastStore.show('Veuillez sélectionner un projet et une activité');
    return;
  }

  try {
    await timeEntryStore.createTimeEntry(
      selectedProjectId.value,
      selectedActivityId.value,
      comment.value
    );
    selectedProjectId.value = '';
    selectedActivityId.value = '';
    comment.value = '';
    toastStore.show('Chronomètre démarré');
  } catch (err) {
    toastStore.show('Erreur lors du démarrage');
  }
};

// Stopper l'activité en cours
const stopActivity = async () => {
  if (!timeEntryStore.activeEntry) return;
  
  try {
    await timeEntryStore.stopTimeEntry(timeEntryStore.activeEntry.id);
    toastStore.show('Chronomètre arrêté');
  } catch (err) {
    toastStore.show('Erreur lors de l\'arrêt');
  }
};

// Supprimer une entrée
const deleteEntry = async (id) => {
  if (!confirm('Supprimer cette entrée ?')) return;
  
  try {
    await timeEntryStore.deleteTimeEntry(id);
    toastStore.show('Entrée supprimée');
  } catch (err) {
    toastStore.show('Erreur lors de la suppression');
  }
};

// Trouver le nom d'un projet par son ID
const getProjectName = (projectId) => {
  let project = null;
  for (let i = 0; i < projectStore.projects.length; i++) {
    if (projectStore.projects[i].id === projectId) {
      project = projectStore.projects[i];
      break;
    }
  }
  return project ? project.name : 'Projet inconnu';
};

// Trouver le nom d'une activité par son ID
const getActivityName = (activityId) => {
  let activity = null;
  for (let i = 0; i < activityStore.activities.length; i++) {
    if (activityStore.activities[i].id === activityId) {
      activity = activityStore.activities[i];
      break;
    }
  }
  return activity ? activity.name : 'Activité inconnue';
};

// Éditer une entrée
const editEntry = (entry) => {
  editing.value = {
    id: entry.id,
    project_id: entry.project_id,
    activity_id: entry.activity_id,
    start: entry.start,
    end: entry.end,
    comment: entry.comment || ''
  };
};

const saveEdit = async () => {
  if (!editing.value) return;
  
  try {
    await timeEntryStore.updateTimeEntry(
      editing.value.id,
      editing.value.project_id,
      editing.value.activity_id,
      editing.value.start,
      editing.value.end,
      editing.value.comment
    );
    editing.value = null;
    toastStore.show('Modifié');
  } catch (err) {
    toastStore.show('Erreur');
  }
};

const cancelEdit = () => {
  editing.value = null;
};

// Création manuelle
const createManualEntry = async () => {
  if (!manualProject.value || !manualActivity.value || !manualStart.value || !manualEnd.value) {
    toastStore.show('Remplissez tous les champs obligatoires');
    return;
  }
  
  try {
    // Convertir le format JJ/MM/YYYY HH:MM en ISO
    const convertToISO = (dateStr) => {
      // Format attendu: "15/01/2024 14:30"
      const parts = dateStr.split(' ');
      if (parts.length !== 2) {
        throw new Error('Format invalide');
      }
      
      const dateParts = parts[0].split('/');
      if (dateParts.length !== 3) {
        throw new Error('Format invalide');
      }
      
      const timeParts = parts[1].split(':');
      if (timeParts.length !== 2) {
        throw new Error('Format invalide');
      }
      
      const day = dateParts[0];
      const month = dateParts[1];
      const year = dateParts[2];
      const hours = timeParts[0];
      const minutes = timeParts[1];
      
      // Format ISO: YYYY-MM-DDTHH:MM:SSZ
      return year + '-' + month + '-' + day + 'T' + hours + ':' + minutes + ':00Z';
    };
    
    const startISO = convertToISO(manualStart.value);
    const endISO = convertToISO(manualEnd.value);
    
    await timeEntryStore.createPastTimeEntry(
      manualProject.value,
      manualActivity.value,
      startISO,
      endISO,
      manualComment.value
    );
    manualProject.value = '';
    manualActivity.value = '';
    manualStart.value = '';
    manualEnd.value = '';
    manualComment.value = '';
    showManual.value = false;
    toastStore.show('Entrée passée créée');
  } catch (err) {
    toastStore.show('Erreur: vérifiez le format des dates (JJ/MM/YYYY HH:MM)');
  }
};

// Filtrer les entrées
const filteredEntries = computed(() => {
  let entries = [];
  const todayEntries = timeEntryStore.todayEntries;
  
  for (let i = 0; i < todayEntries.length; i++) {
    entries.push(todayEntries[i]);
  }
  
  if (filterProject.value) {
    const filtered = [];
    for (let i = 0; i < entries.length; i++) {
      if (entries[i].project_id === filterProject.value) {
        filtered.push(entries[i]);
      }
    }
    entries = filtered;
  }
  
  if (filterActivity.value) {
    const filtered = [];
    for (let i = 0; i < entries.length; i++) {
      if (entries[i].activity_id === filterActivity.value) {
        filtered.push(entries[i]);
      }
    }
    entries = filtered;
  }
  
  if (filterKeywords.value) {
    const keywords = filterKeywords.value.toLowerCase();
    const filtered = [];
    for (let i = 0; i < entries.length; i++) {
      if (entries[i].comment && entries[i].comment.toLowerCase().includes(keywords)) {
        filtered.push(entries[i]);
      }
    }
    entries = filtered;
  }
  
  return entries;
});
</script>

<template>
  <div>
    <h3>Time Tracker</h3>

    <!-- Activité en cours -->
    <div v-if="timeEntryStore.activeEntry" style="border: 2px solid green; padding: 10px; margin-bottom: 20px;">
      <h4>Activité en cours</h4>
      <p>Projet : {{ getProjectName(timeEntryStore.activeEntry.project_id) }}</p>
      <p>Activité : {{ getActivityName(timeEntryStore.activeEntry.activity_id) }}</p>
      <p>Démarré à : {{ timeEntryStore.activeEntry.start }}</p>
      
      <div style="margin: 10px 0;">
        <label>Notes sur l'activité en cours :</label>
        <textarea 
          v-model="activeComment" 
          @blur="updateActiveComment"
          placeholder="Prenez des notes..."
          rows="4"
          style="width: 100%; padding: 8px;"
        ></textarea>
        <small>Les notes sont sauvegardées automatiquement</small>
      </div>
      
      <button @click="stopActivity">Arrêter</button>
    </div>

    <!-- Formulaire de démarrage -->
    <div v-else>
      <h4>Démarrer une activité</h4>
      <form @submit.prevent="startActivity">
        <div>
          <label>Projet :</label>
          <select v-model="selectedProjectId" required>
            <option value="">-- Sélectionner --</option>
            <option 
              v-for="project in projectStore.activeProjects" 
              :key="project.id" 
              :value="project.id"
            >
              {{ project.name }}
            </option>
          </select>
        </div>

        <div>
          <label>Activité :</label>
          <select v-model="selectedActivityId" required>
            <option value="">-- Sélectionner --</option>
            <option 
              v-for="activity in activityStore.activeActivities" 
              :key="activity.id" 
              :value="activity.id"
            >
              {{ activity.name }}
            </option>
          </select>
        </div>

        <div>
          <label>Commentaire :</label>
          <textarea v-model="comment" placeholder="Notes sur l'activité..."></textarea>
        </div>

        <button type="submit">Démarrer</button>
      </form>
    </div>

    <hr />

    <!-- Liste des activités du jour -->
    <h4>Activités du jour</h4>
    
    <button @click="showManual = !showManual">
      {{ showManual ? 'Annuler' : 'Créer une entrée manuelle' }}
    </button>

    <!-- Formulaire de création manuelle -->
    <div v-if="showManual" style="border: 1px solid #ccc; padding: 10px; margin: 10px 0;">
      <h5>Créer une entrée passée</h5>
      <form @submit.prevent="createManualEntry">
        <div>
          <label>Projet :</label>
          <select v-model="manualProject" required>
            <option value="">-- Sélectionner --</option>
            <option v-for="project in projectStore.activeProjects" :key="project.id" :value="project.id">
              {{ project.name }}
            </option>
          </select>
        </div>
        <div>
          <label>Activité :</label>
          <select v-model="manualActivity" required>
            <option value="">-- Sélectionner --</option>
            <option v-for="activity in activityStore.activeActivities" :key="activity.id" :value="activity.id">
              {{ activity.name }}
            </option>
          </select>
        </div>
        <div>
          <label>Début (JJ/MM/YYYY HH:MM) :</label>
          <input v-model="manualStart" type="text" required placeholder="15/01/2024 14:30" />
        </div>
        <div>
          <label>Fin (JJ/MM/YYYY HH:MM) :</label>
          <input v-model="manualEnd" type="text" required placeholder="15/01/2024 16:00" />
        </div>
        <div>
          <label>Commentaire :</label>
          <textarea v-model="manualComment"></textarea>
        </div>
        <button type="submit">Créer</button>
      </form>
    </div>

    <!-- Filtres -->
    <div style="margin: 10px 0; padding: 10px; background-color: #f5f5f5;">
      <h5>Filtres</h5>
      <div>
        <label>Projet :</label>
        <select v-model="filterProject">
          <option value="">Tous</option>
          <option v-for="project in projectStore.projects" :key="project.id" :value="project.id">
            {{ project.name }}
          </option>
        </select>
      </div>
      <div>
        <label>Activité :</label>
        <select v-model="filterActivity">
          <option value="">Toutes</option>
          <option v-for="activity in activityStore.activities" :key="activity.id" :value="activity.id">
            {{ activity.name }}
          </option>
        </select>
      </div>
      <div>
        <label>Mots-clés :</label>
        <input v-model="filterKeywords" type="text" placeholder="Rechercher dans les commentaires..." />
      </div>
    </div>

    <div v-if="timeEntryStore.loading">Chargement...</div>

    <div v-else-if="filteredEntries.length > 0">
      <transition-group name="list" tag="ul">
        <li v-for="entry in filteredEntries" :key="entry.id">
          <!-- Mode édition -->
          <div v-if="editing && editing.id === entry.id" style="border: 1px solid blue; padding: 10px;">
            <div>
              <label>Projet :</label>
              <select v-model="editing.project_id" required>
                <option v-for="project in projectStore.projects" :key="project.id" :value="project.id">
                  {{ project.name }}
                </option>
              </select>
            </div>
            <div>
              <label>Activité :</label>
              <select v-model="editing.activity_id" required>
                <option v-for="activity in activityStore.activities" :key="activity.id" :value="activity.id">
                  {{ activity.name }}
                </option>
              </select>
            </div>
            <div>
              <label>Début :</label>
              <input v-model="editing.start" type="text" required />
            </div>
            <div>
              <label>Fin :</label>
              <input v-model="editing.end" type="text" />
            </div>
            <div>
              <label>Commentaire :</label>
              <textarea v-model="editing.comment"></textarea>
            </div>
            <button @click="saveEdit">Enregistrer</button>
            <button @click="cancelEdit">Annuler</button>
          </div>

          <!-- Mode affichage -->
          <div v-else>
            <strong>{{ getProjectName(entry.project_id) }}</strong> - 
            {{ getActivityName(entry.activity_id) }}
            <br />
            Début : {{ formatDateTime(entry.start) }}
            <span v-if="entry.end"> | Fin : {{ formatDateTime(entry.end) }}</span>
            <br />
            <span v-if="entry.comment">{{ entry.comment }}</span>
            <br />
            <button @click="editEntry(entry)">Éditer</button>
            <button @click="deleteEntry(entry.id)">Supprimer</button>
          </div>
        </li>
      </transition-group>
    </div>

    <p v-else>Aucune activité enregistrée aujourd'hui.</p>
  </div>
</template>

<style scoped>
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.list-move {
  transition: transform 0.5s ease;
}
</style>
