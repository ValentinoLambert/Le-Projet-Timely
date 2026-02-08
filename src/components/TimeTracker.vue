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
      parseInt(selectedProjectId.value),
      parseInt(selectedActivityId.value),
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
              v-for="project in projectStore.projects.filter(p => p.active)" 
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
              v-for="activity in activityStore.activities.filter(a => a.active)" 
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
    <div v-if="timeEntryStore.loading">Chargement...</div>

    <div v-else-if="timeEntryStore.todayEntries.length > 0">
      <ul>
        <li v-for="entry in timeEntryStore.todayEntries" :key="entry.id">
          <strong>{{ getProjectName(entry.project_id) }}</strong> - 
          {{ getActivityName(entry.activity_id) }}
          <br />
          Début : {{ entry.start }}
          <span v-if="entry.end"> | Fin : {{ entry.end }}</span>
          <br />
          <span v-if="entry.comment">{{ entry.comment }}</span>
          <br />
          <button @click="deleteEntry(entry.id)">Supprimer</button>
        </li>
      </ul>
    </div>

    <p v-else>Aucune activité enregistrée aujourd'hui.</p>
  </div>
</template>
