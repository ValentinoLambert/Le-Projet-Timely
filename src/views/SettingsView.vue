<script setup>
import { onMounted, ref } from 'vue';
import { useProjectStore } from '../stores/projects';
import { useActivityStore } from '../stores/activities';

const projectStore = useProjectStore();
const activityStore = useActivityStore();

// Variables locales pour les formulaires
const newProjectName = ref('');
const newProjectDesc = ref('');
const newActivityName = ref('');
const newActivityColor = ref('#000000');

// Au chargement, on récupère les données
onMounted(() => {
  projectStore.fetchProjects();
  activityStore.fetchActivities();
});

// Méthode pour ajouter un projet
const addProject = async () => {
  if (!newProjectName.value) return;
  try {
    await projectStore.createProject(newProjectName.value, newProjectDesc.value);
    // Reset du formulaire
    newProjectName.value = '';
    newProjectDesc.value = '';
  } catch (err) {
    alert('Erreur lors de l\'ajout du projet');
  }
};

// Méthode pour ajouter une activité
const addActivity = async () => {
  if (!newActivityName.value) return;
  try {
    await activityStore.createActivity(newActivityName.value, newActivityColor.value);
    // Reset du formulaire
    newActivityName.value = '';
  } catch (err) {
    alert('Erreur lors de l\'ajout de l\'activité');
  }
};
</script>

<template>
  <div>
    <h1>Paramètres</h1>
    
    <section>
      <h2>Gestion des Projets</h2>
      <!-- Formulaire d'ajout de projet -->
      <form @submit.prevent="addProject">
        <input v-model="newProjectName" placeholder="Nom du projet" required />
        <input v-model="newProjectDesc" placeholder="Description (facultatif)" />
        <button type="submit">Ajouter le projet</button>
      </form>

      <!-- Liste des projets -->
      <ul>
        <li v-for="project in projectStore.projects" :key="project.id">
          <strong>{{ project.name }}</strong> 
          <span v-if="project.description"> - {{ project.description }}</span>
          ({{ project.active ? 'Actif' : 'Inactif' }})
          
          <!-- Bouton pour activer/désactiver -->
          <button @click="projectStore.toggleProject(project)">
            {{ project.active ? 'Désactiver' : 'Activer' }}
          </button>
        </li>
      </ul>
    </section>

    <hr />

    <section>
      <h2>Gestion des Activités</h2>
      <!-- Formulaire d'ajout d'activité -->
      <form @submit.prevent="addActivity">
        <input v-model="newActivityName" placeholder="Nom de l'activité" required />
        <input v-model="newActivityColor" type="color" title="Couleur de l'activité" />
        <button type="submit">Ajouter l'activité</button>
      </form>

      <!-- Liste des activités -->
      <ul>
        <li v-for="activity in activityStore.activities" :key="activity.id">
          <span :style="{ color: activity.color, fontWeight: 'bold' }">●</span> 
          {{ activity.name }} 
          ({{ activity.active ? 'Actif' : 'Inactif' }})
          
          <!-- Bouton pour activer/désactiver -->
          <button @click="activityStore.toggleActivity(activity)">
            {{ activity.active ? 'Désactiver' : 'Activer' }}
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>
