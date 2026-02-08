<script setup>
import { onMounted, ref } from 'vue';
import { useActivityStore } from '../../stores/activities';

const activityStore = useActivityStore();

const newName = ref('');
const newColor = ref('#3498db');
const searchKeywords = ref('');

onMounted(() => {
  activityStore.fetchActivities();
});

const addActivity = async () => {
  if (!newName.value) {
    alert('Le nom est obligatoire');
    return;
  }

  try {
    await activityStore.createActivity(newName.value, newColor.value);
    newName.value = '';
    newColor.value = '#3498db';
  } catch (err) {
    alert('Erreur lors de la création de l\'activité');
  }
};

const toggleActivity = async (activity) => {
  try {
    await activityStore.toggleActivity(activity);
    await activityStore.fetchActivities();
  } catch (err) {
    alert('Erreur lors de la modification de l activité');
  }
};

const filteredActivities = () => {
  if (!searchKeywords.value) return activityStore.activities;
  
  const keywords = searchKeywords.value.toLowerCase();
  return activityStore.activities.filter(a => 
    a.name.toLowerCase().includes(keywords)
  );
};
</script>

<template>
  <div>
    <h2>Mes activités</h2>
    
    <form @submit.prevent="addActivity" style="margin-bottom: 20px; padding: 10px; border: 1px solid #ddd;">
      <h3>Ajouter une activité</h3>
      <div>
        <label>Nom :</label>
        <input v-model="newName" type="text" required />
      </div>
      <div>
        <label>Couleur :</label>
        <input v-model="newColor" type="color" />
      </div>
      <button type="submit">Ajouter</button>
    </form>

    <div style="margin-bottom: 10px;">
      <label>Rechercher :</label>
      <input v-model="searchKeywords" type="text" placeholder="Mots-clés..." />
    </div>

    <div v-if="activityStore.loading">Chargement...</div>
    
    <div v-else-if="filteredActivities().length > 0">
      <ul>
        <li v-for="activity in filteredActivities()" :key="activity.id">
          <span :style="{ display: 'inline-block', width: '20px', height: '20px', backgroundColor: activity.color, marginRight: '10px' }"></span>
          <strong>{{ activity.name }}</strong>
          <span v-if="!activity.is_enabled" style="color: red;"> (Désactivé)</span>
          <br />
          <button @click="toggleActivity(activity)">
            {{ activity.is_enabled ? 'Désactiver' : 'Activer' }}
          </button>
        </li>
      </ul>
    </div>

    <p v-else>Aucune activité trouvée.</p>
  </div>
</template>
