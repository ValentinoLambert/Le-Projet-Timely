<script setup>
import { onMounted, ref, computed } from 'vue';
import { useTimeEntryStore } from '../stores/timeEntries';
import { useProjectStore } from '../stores/projects';
import { useActivityStore } from '../stores/activities';

const timeEntryStore = useTimeEntryStore();
const projectStore = useProjectStore();
const activityStore = useActivityStore();

const selectedProjectId = ref('');
const selectedActivityId = ref('');
const comment = ref('');

// Variables pour édition et création manuelle
const editing = ref(null);
const showManual = ref(false);
const manualProject = ref('');
const manualActivity = ref('');
const manualStartDate = ref('');
const manualStartTime = ref('');
const manualEndDate = ref('');
const manualEndTime = ref('');
const manualComment = ref('');

// Filtres
const filterProject = ref('');
const filterActivity = ref('');
const filterKeywords = ref('');

// Charger les données au montage
onMounted(() => {
  projectStore.fetchProjects();
  activityStore.fetchActivities();
  timeEntryStore.fetchTimeEntries();
});

// Démarrer une nouvelle activité
const startActivity = async () => {
  if (!selectedProjectId.value || !selectedActivityId.value) {
    alert('Veuillez sélectionner un projet et une activité');
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
  } catch (err) {
    alert('Erreur lors du démarrage de l\'activité');
  }
};

// Stopper l'activité en cours
const stopActivity = async () => {
  if (!timeEntryStore.activeEntry) return;
  
  try {
    await timeEntryStore.stopTimeEntry(timeEntryStore.activeEntry.id);
  } catch (err) {
    alert('Erreur lors de l\'arrêt de l\'activité');
  }
};

// Supprimer une entrée
const deleteEntry = async (id) => {
  if (!confirm('Supprimer cette entrée ?')) return;
  
  try {
    await timeEntryStore.deleteTimeEntry(id);
  } catch (err) {
    alert('Erreur lors de la suppression');
  }
};

// Trouver le nom d'un projet par son ID
const getProjectName = (projectId) => {
  const project = projectStore.projects.find(p => p.id === projectId);
  return project ? project.name : 'Projet inconnu';
};

// Trouver le nom d'une activité par son ID
const getActivityName = (activityId) => {
  const activity = activityStore.activities.find(a => a.id === activityId);
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
  } catch (err) {
    alert('Erreur lors de la modification');
  }
};

const cancelEdit = () => {
  editing.value = null;
};

// Création manuelle
const createManualEntry = async () => {
  if (!manualProject.value || !manualActivity.value || !manualStartDate.value || !manualStartTime.value || !manualEndDate.value || !manualEndTime.value) {
    alert('Remplissez tous les champs obligatoires');
    return;
  }
  
  // Convertir les dates du format français vers le format ISO
  const [startDay, startMonth, startYear] = manualStartDate.value.split('/');
  const [endDay, endMonth, endYear] = manualEndDate.value.split('/');
  const startDateTime = `${startYear}-${startMonth}-${startDay} ${manualStartTime.value}:00`;
  const endDateTime = `${endYear}-${endMonth}-${endDay} ${manualEndTime.value}:00`;
  
  try {
    await timeEntryStore.createPastTimeEntry(
      manualProject.value,
      manualActivity.value,
      startDateTime,
      endDateTime,
      manualComment.value
    );
    manualProject.value = '';
    manualActivity.value = '';
    manualStartDate.value = '';
    manualStartTime.value = '';
    manualEndDate.value = '';
    manualEndTime.value = '';
    manualComment.value = '';
    showManual.value = false;
  } catch (err) {
    alert('Erreur lors de la création');
  }
};

// Filtrer les entrées
const filteredEntries = computed(() => {
  let entries = timeEntryStore.todayEntries;
  
  if (filterProject.value) {
    entries = entries.filter(e => e.project_id === filterProject.value);
  }
  
  if (filterActivity.value) {
    entries = entries.filter(e => e.activity_id === filterActivity.value);
  }
  
  if (filterKeywords.value) {
    const keywords = filterKeywords.value.toLowerCase();
    entries = entries.filter(e => 
      e.comment && e.comment.toLowerCase().includes(keywords)
    );
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
              v-for="project in projectStore.projects.filter(p => p.is_enabled)" 
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
              v-for="activity in activityStore.activities.filter(a => a.is_enabled)" 
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
            <option v-for="project in projectStore.projects.filter(p => p.is_enabled)" :key="project.id" :value="project.id">
              {{ project.name }}
            </option>
          </select>
        </div>
        <div>
          <label>Activité :</label>
          <select v-model="manualActivity" required>
            <option value="">-- Sélectionner --</option>
            <option v-for="activity in activityStore.activities.filter(a => a.is_enabled)" :key="activity.id" :value="activity.id">
              {{ activity.name }}
            </option>
          </select>
        </div>
        <div>
          <label>Date de début (JJ/MM/YYYY) :</label>
          <input v-model="manualStartDate" type="text" required placeholder="15/01/2024" />
        </div>
        <div>
          <label>Heure de début (HH:MM) :</label>
          <input v-model="manualStartTime" type="text" required placeholder="14:30" />
        </div>
        <div>
          <label>Date de fin (JJ/MM/YYYY) :</label>
          <input v-model="manualEndDate" type="text" required placeholder="15/01/2024" />
        </div>
        <div>
          <label>Heure de fin (HH:MM) :</label>
          <input v-model="manualEndTime" type="text" required placeholder="16:00" />
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
      <ul>
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
            Début : {{ entry.start }}
            <span v-if="entry.end"> | Fin : {{ entry.end }}</span>
            <br />
            <span v-if="entry.comment">{{ entry.comment }}</span>
            <br />
            <button @click="editEntry(entry)">Éditer</button>
            <button @click="deleteEntry(entry.id)">Supprimer</button>
          </div>
        </li>
      </ul>
    </div>

    <p v-else>Aucune activité enregistrée aujourd'hui.</p>
  </div>
</template>
